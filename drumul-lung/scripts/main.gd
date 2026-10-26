extends Node3D
## Entry point: builds the world from map data, spawns the company's vehicles, trailers and the
## player, and connects traffic, contracts, interface, fuel station, service, radar and saving.

const MAP := "res://data/maps/telciu.json"
## Approximate Romanian speeding fines (lei) by km/h over the limit; real values change yearly.
const FINES := [[50, 1450], [40, 1160], [30, 870], [20, 580], [10, 290]]

var network: RoadNetwork
var world: WorldBuilder
var player: Player
var rig: CameraRig
var hud: Hud
var menu: GameMenu
var touch: TouchControls
var traffic: TrafficManager
var jobs: JobSystem
var tod: TimeOfDay
var vehicles: Array = []
var trailers: Array = []
var gps_route := PackedVector2Array()
var current_limit := 50
var _sound: EngineSound
var _limit_t := 0.0
var _gps_t := 0.0
var _save_t := 0.0
var _fine_cooldown := 0.0
var _odo_last := -1.0


func _ready() -> void:
	network = RoadNetwork.new()
	network.load_map(MAP)
	world = WorldBuilder.new()
	world.name = "World"
	add_child(world)
	world.build(network)
	tod = TimeOfDay.new()
	add_child(tod)
	tod.setup(world)

	var slot := 0
	var tslot := 0
	for e in GameState.owned:
		var spec: Dictionary = GameState.specs[e["spec"]]
		if spec["kind"] == "car":
			_spawn_vehicle(e, slot)
			slot += 1
		else:
			_spawn_trailer(e, tslot)
			tslot += 1

	player = Player.new()
	player.name = "Player"
	add_child(player)
	var start: Transform3D = world.depot_slots[0]
	player.global_position = start.origin + start.basis.x * 3.4 + start.basis.z * 1.0
	rig = CameraRig.new()
	add_child(rig)
	rig.player = player
	rig.yaw = start.basis.get_euler().y + PI
	rig.snap()
	player.entered.connect(_on_entered)
	player.exited.connect(_on_exited)

	traffic = TrafficManager.new()
	traffic.name = "Traffic"
	add_child(traffic)
	traffic.setup(network, int(GameState.settings.get("traffic", 10)))
	jobs = JobSystem.new()
	jobs.name = "Jobs"
	add_child(jobs)
	jobs.setup(network, self)
	jobs.finished.connect(_on_job_finished)
	for v in vehicles:
		v.impact.connect(jobs.on_impact)
	_update_obstacles()

	hud = Hud.new()
	add_child(hud)
	hud.setup(self)
	touch = TouchControls.new()
	add_child(touch)
	touch.setup()
	menu = GameMenu.new()
	add_child(menu)
	menu.setup(self)
	_sound = EngineSound.new()
	add_child(_sound)
	GameState.notify.connect(toast)
	apply_settings()
	toast("Bun venit, %s! Mergi la microbuz și apasă %s ca să urci." % [GameState.company, InputSetup.label("interact")])


func _spawn_vehicle(e: Dictionary, slot: int) -> Vehicle:
	var v := Vehicle.new()
	v.name = "Vehicle_" + e["uid"]
	add_child(v)
	v.setup(GameState.specs[e["spec"]], e["uid"], Color(e.get("color", "#ffffff")), e)
	if e.has("pos"):
		var p: Array = e["pos"]
		v.place(Vector3(p[0], p[1], p[2]), float(e.get("yaw", 0.0)))
	else:
		var t: Transform3D = world.depot_slots[slot % world.depot_slots.size()]
		v.place(t.origin, t.basis.get_euler().y)
	v.message.connect(toast)
	vehicles.append(v)
	return v


func _spawn_trailer(e: Dictionary, slot: int) -> Trailer:
	var t := Trailer.new()
	t.name = "Trailer_" + e["uid"]
	add_child(t)
	t.setup(GameState.specs[e["spec"]], e["uid"], Color(e.get("color", "#9aa0a6")))
	if e.has("pos"):
		var p: Array = e["pos"]
		t.place(Vector3(p[0], p[1], p[2]), float(e.get("yaw", 0.0)))
	else:
		var tr: Transform3D = world.trailer_slots[slot % world.trailer_slots.size()]
		t.place(tr.origin, tr.basis.get_euler().y)
	trailers.append(t)
	return t


func _update_obstacles() -> void:
	traffic.obstacles = vehicles + trailers + [player]


# ------------------------------------------------------------------ queries used by other systems
func current_vehicle():
	return player.vehicle if player else null


func focus_position() -> Vector3:
	var v = current_vehicle()
	return v.global_position if v else player.global_position


func focus_heading() -> float:
	var v = current_vehicle()
	return v.global_rotation.y if v else player.model.global_rotation.y + PI


func speed_limit_at(_p: Vector3) -> float:
	return float(current_limit)


func trailer_by_spec(id: String):
	for t in trailers:
		if t.spec["id"] == id:
			return t
	return null


func toast(text: String, kind := "") -> void:
	if hud:
		hud.toast(text, kind)
	else:
		print(text)


# ------------------------------------------------------------------ frame logic
func _process(delta: float) -> void:
	if Input.is_action_just_pressed("menu") and Engine.get_process_frames() != _menu_closed_frame:
		menu.open()
		return
	if Input.is_action_just_pressed("map"):
		menu.open("Hartă")
		return
	if Input.is_action_just_pressed("jobs"):
		menu.open("Contracte")
		return
	if Input.is_action_just_pressed("interact"):
		_interact()
	if Input.is_action_just_pressed("camera"):
		toast(rig.cycle_mode())
	if Input.is_action_just_pressed("trailer"):
		_trailer_action()
	if Input.is_action_just_pressed("action"):
		_context_action()
	if Input.is_action_just_pressed("reset_vehicle"):
		_reset_vehicle()
	traffic.focus = focus_position()
	_limit_t -= delta
	if _limit_t <= 0.0:
		_limit_t = 0.3
		_update_limit()
	_gps_t -= delta
	if _gps_t <= 0.0:
		_gps_t = 1.0
		var t: Vector3 = jobs.target()
		gps_route = network.route(Vector2(focus_position().x, focus_position().z), Vector2(t.x, t.z)) if t != Vector3.INF else PackedVector2Array()
	_radar(delta)
	_stats()
	traffic.set_night(tod.night)
	_save_t += delta
	if _save_t > 90.0:
		_save_t = 0.0
		save_all()


var _menu_closed_frame := -1


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED:
		save_all()


func _update_limit() -> void:
	var p := focus_position()
	var p2 := Vector2(p.x, p.z)
	var nr := network.nearest_on_road(p2)
	current_limit = network.speed_limit(nr["road"], p2) if nr["dist"] < 15.0 else 50


func _radar(delta: float) -> void:
	_fine_cooldown -= delta
	var v = current_vehicle()
	if v == null or world.radar_zone == Vector3.ZERO or _fine_cooldown > 0.0:
		return
	if v.global_position.distance_to(world.radar_zone) > 40.0:
		return
	var over: float = v.kmh() - current_limit
	for f in FINES:
		if over > f[0]:
			GameState.add_money(-int(f[1]), "amendă radar: %d km/h peste limită" % int(over))
			GameState.stats["fines"] = int(GameState.stats.get("fines", 0)) + int(f[1])
			_fine_cooldown = 20.0
			return


func _stats() -> void:
	var v = current_vehicle()
	if v == null:
		_odo_last = -1.0
		return
	if _odo_last >= 0.0:
		GameState.stats["km"] = float(GameState.stats.get("km", 0.0)) + maxf(v.odometer_km - _odo_last, 0.0)
	_odo_last = v.odometer_km


func _interact() -> void:
	if player.vehicle == null:
		var v = player.nearest_vehicle(vehicles)
		if v:
			player.enter(v)
		else:
			toast("Niciun vehicul al firmei în apropiere")
	elif not player.exit_vehicle():
		toast("Oprește vehiculul ca să cobori", "warn")


func _on_entered(v) -> void:
	rig.vehicle = v
	rig.snap()
	_sound.vehicle = v
	v.transmission = GameState.settings.get("transmission", "auto") if GameState.settings.get("transmission", "auto") in v.spec["gearbox"]["modes"] else v.spec["gearbox"]["modes"][0]
	toast("%s · %s pornește motorul, %s frâna de parcare" % [v.spec["name"], InputSetup.label("engine"), InputSetup.label("parking_brake")])


func _on_exited(v) -> void:
	v.engine_on = false
	rig.vehicle = null
	rig.yaw = v.global_rotation.y + PI
	_sound.vehicle = null


func _trailer_action() -> void:
	var v = current_vehicle()
	if v == null:
		return
	if v.trailer != null:
		if v.kmh() > 2.0:
			toast("Oprește ca să decuplezi remorca", "warn")
			return
		v.trailer.uncouple()
		toast("Remorcă decuplată")
		return
	var best = null
	var bd := 2.5
	for t in trailers:
		var d: float = t.coupler_global().distance_to(v.hitch_global())
		if d < bd:
			bd = d
			best = t
	if best == null:
		toast("Dă cu spatele până când cârligul ajunge lângă cupla remorcii", "warn")
		return
	var err: String = best.couple(v)
	if err != "":
		toast(err, "warn")
	else:
		toast("Remorcă cuplată: %s (%d kg)" % [best.spec["short"], int(best.total_mass())])


func _context_action() -> void:
	var v = current_vehicle()
	if v == null:
		return
	if v.global_position.distance_to(world.fuel_zone) < 18.0:
		_refuel(v)
	elif v.global_position.distance_to(world.service_zone) < 16.0:
		_repair(v)
	else:
		toast("Nimic de făcut aici. Alimentezi la benzinărie, repari la depou.")


func _refuel(v) -> void:
	if v.kmh() > 1.0:
		toast("Oprește la pompă", "warn")
		return
	if v.engine_on:
		toast("Oprește motorul (%s) înainte de alimentare" % InputSetup.label("engine"), "warn")
		return
	var fuel_type: String = v.spec["engine"]["fuel"]
	var price: float = GameState.FUEL_PRICE[fuel_type]
	var litres: float = float(v.spec["fuel"]["tank"]) - v.fuel
	if litres < 0.5:
		toast("Rezervorul este plin")
		return
	litres = minf(litres, maxf(float(GameState.money), 0.0) / price)
	var cost := int(ceil(litres * price))
	if cost <= 0 or not GameState.spend(cost, "%.1f L %s" % [litres, fuel_type]):
		return
	v.fuel += litres
	GameState.stats["fuel_spent"] = int(GameState.stats.get("fuel_spent", 0)) + cost


func _repair(v) -> void:
	if v.damage < 0.01:
		toast("Vehiculul nu are avarii")
		return
	var cost := maxi(80, int(v.damage * float(v.spec["price"]) * 0.08))
	if GameState.spend(cost, "reparație %s" % v.spec["short"]):
		v.damage = 0.0
		GameState.stats["repairs"] = int(GameState.stats.get("repairs", 0)) + cost


func _reset_vehicle() -> void:
	var v = current_vehicle()
	if v == null:
		return
	var upright: bool = v.global_transform.basis.y.dot(Vector3.UP) > 0.6
	if upright and v.kmh() > 3.0:
		toast("Repunerea pe drum e pentru vehicule răsturnate sau blocate", "warn")
		return
	if v.trailer != null:
		v.trailer.uncouple()
	var p := Vector2(v.global_position.x, v.global_position.z)
	var nr := network.nearest_on_road(p)
	var dir: Vector2 = nr["dir"]
	var right := Vector2(-dir.y, dir.x)
	var spot: Vector2 = nr["point"] + right * 1.8
	v.place(Vector3(spot.x, 0.0, spot.y), atan2(dir.x, dir.y))
	toast("Vehicul repus pe drum")


func context_prompt() -> String:
	var v = current_vehicle()
	if v == null:
		var near = player.nearest_vehicle(vehicles)
		if near:
			return "%s – urcă în %s" % [InputSetup.label("interact"), near.spec["short"]]
		return ""
	var lines: Array = []
	if not v.engine_on:
		lines.append("%s – pornește motorul" % InputSetup.label("engine"))
	elif v.parking_brake:
		lines.append("%s – eliberează frâna de parcare" % InputSetup.label("parking_brake"))
	if v.trailer == null:
		for t in trailers:
			if t.coupler_global().distance_to(v.hitch_global()) < 2.5:
				var why: String = t.check_compatibility(v)
				lines.append(("%s – cuplează %s" % [InputSetup.label("trailer"), t.spec["short"]]) if why == "" else why)
	elif v.kmh() < 1.0:
		lines.append("%s – decuplează remorca" % InputSetup.label("trailer"))
	if v.global_position.distance_to(world.fuel_zone) < 18.0:
		lines.append("%s – alimentează (%.2f lei/L)" % [InputSetup.label("action"), GameState.FUEL_PRICE[v.spec["engine"]["fuel"]]])
	if v.global_position.distance_to(world.service_zone) < 16.0 and v.damage > 0.01:
		lines.append("%s – repară (%d lei)" % [InputSetup.label("action"), maxi(80, int(v.damage * float(v.spec["price"]) * 0.08))])
	if v.kmh() < 3.0:
		lines.append("%s – coboară" % InputSetup.label("interact"))
	return "   ·   ".join(lines)


func _on_job_finished(summary: Dictionary) -> void:
	hud.show_summary(summary)


# ------------------------------------------------------------------ garage, shop, settings, save
func _free_depot_slot() -> Transform3D:
	for t in world.depot_slots:
		var free := true
		for v in vehicles:
			if v.global_position.distance_to(t.origin) < 3.0:
				free = false
		if free:
			return t
	return world.depot_slots[0] * Transform3D(Basis(), Vector3(0, 0, -12))


func buy(id: String) -> void:
	var spec: Dictionary = GameState.specs[id]
	if not GameState.spend(int(spec["price"]), "cumpărat %s" % spec["short"]):
		return
	var e := {"uid": GameState.new_uid(), "spec": id, "color": spec["body"]["colors"][0], "fuel": 0.0, "damage": 0.0, "odometer": 0.0}
	if spec["kind"] == "car":
		e["fuel"] = float(spec["fuel"]["tank"]) * 0.5
		var t := _free_depot_slot()
		e["pos"] = [t.origin.x, t.origin.y, t.origin.z]
		e["yaw"] = t.basis.get_euler().y
		var v := _spawn_vehicle(e, 0)
		v.impact.connect(jobs.on_impact)
	else:
		var t: Transform3D = world.trailer_slots[trailers.size() % world.trailer_slots.size()] * Transform3D(Basis(), Vector3(0, 0, -4.0 * (trailers.size() / world.trailer_slots.size())))
		e["pos"] = [t.origin.x, t.origin.y, t.origin.z]
		e["yaw"] = t.basis.get_euler().y
		_spawn_trailer(e, 0)
	GameState.owned.append(e)
	_update_obstacles()
	save_all()
	toast("%s te așteaptă la depou" % spec["short"])


func sell_vehicle(v) -> void:
	if v == current_vehicle():
		return
	var value := int(float(v.spec["price"]) * 0.6 * (1.0 - v.damage * 0.5))
	if v.trailer != null:
		v.trailer.uncouple()
	vehicles.erase(v)
	GameState.owned = GameState.owned.filter(func(e): return e["uid"] != v.uid)
	v.queue_free()
	GameState.add_money(value, "vândut %s" % v.spec["short"])
	_update_obstacles()
	save_all()


func roadside_assistance(v) -> void:
	if v == current_vehicle():
		return
	if not GameState.spend(300, "asistență rutieră"):
		return
	if v.trailer != null:
		v.trailer.uncouple()
	var t := _free_depot_slot()
	v.place(t.origin, t.basis.get_euler().y)


func apply_settings() -> void:
	var s: Dictionary = GameState.settings
	tod.sun.shadow_enabled = bool(s.get("shadows", true))
	rig.camera.far = float(s.get("view_distance", 1400.0))
	tod.env.fog_density = 0.0007 * 1400.0 / float(s.get("view_distance", 1400.0))
	_sound.volume_db = linear_to_db(maxf(float(s.get("volume", 0.8)), 0.001)) - 4.0
	touch.apply_mode(str(s.get("touch_controls", "auto")))
	for v in vehicles:
		if s.get("transmission", "auto") in v.spec["gearbox"]["modes"]:
			v.transmission = s["transmission"]
		v.assisted_clutch = bool(s.get("assisted_clutch", true))


func save_all() -> void:
	var owned: Array = []
	for v in vehicles:
		if is_instance_valid(v):
			owned.append(v.to_state())
	for t in trailers:
		var p: Vector3 = t.global_position
		owned.append({"uid": t.uid, "spec": t.spec["id"], "color": "#9aa0a6", "fuel": 0.0, "damage": 0.0, "odometer": 0.0,
			"pos": [p.x, p.y, p.z], "yaw": t.global_rotation.y})
	GameState.owned = owned
	GameState.save_game()
