extends SceneTree
## Automated checks for the first playable version. Run headless:
##   godot --headless --path . -s res://tests/run_tests.gd
## Each test drives the real game objects through the physics engine and prints PASS/FAIL with the
## measured numbers. The player's save file is never touched (GameState.testing).

var main
var results: Array = []
var dt := 1.0 / 120.0


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var gs = root.get_node("GameState")
	gs.testing = true
	gs.new_game()
	Engine.max_physics_steps_per_frame = 32
	Engine.time_scale = 1.0
	main = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	await _frames(30)
	await test_world()
	await test_forward_and_acceleration()
	await test_braking()
	await test_van()
	await test_cornering()
	await test_manual_stall()
	await test_fuel()
	await test_enter_exit()
	await test_trailer()
	await test_passenger_job()
	await test_traffic()
	await test_radar()
	test_save_load()
	var failed := results.filter(func(r): return not r[1])
	print("\n================ REZULTATE ================")
	for r in results:
		print(("PASS  " if r[1] else "FAIL  ") + r[0] + "  —  " + r[2])
	print("%d/%d teste trecute" % [results.size() - failed.size(), results.size()])
	quit(1 if failed.size() > 0 else 0)


func check(name: String, ok: bool, detail: String) -> void:
	results.append([name, ok, detail])
	print(("PASS " if ok else "FAIL ") + name + " — " + detail)


func _frames(n: int) -> void:
	for i in n:
		await physics_frame


func _steps_until(cond: Callable, max_s: float) -> float:
	var t := 0.0
	while not cond.call() and t < max_s:
		await physics_frame
		t += dt
	return t


func vehicle(spec_id: String):
	for v in main.vehicles:
		if v.spec["id"] == spec_id:
			return v
	return null


## Puts a vehicle on the DN17C straight between Telciu centre and the north stop, heading north.
func on_straight(v, z := -330.0) -> void:
	var p := Vector2(-28.0, z)
	var nr: Dictionary = main.network.nearest_on_road(p)
	var dir: Vector2 = nr["dir"]
	if dir.y > 0.0:
		dir = -dir
	var right := Vector2(-dir.y, dir.x)
	var spot: Vector2 = nr["point"] + right * 1.8
	v.place(Vector3(spot.x, 0.0, spot.y), atan2(dir.x, dir.y))
	v.parking_brake = false
	v.engine_on = true
	v.damage = 0.0
	v.gear = 1
	v.ai_input = {"throttle": 0.0, "brake": 0.0, "steer": 0.0}


func test_world() -> void:
	var w = main.world
	check("Lume construită", w.house_count > 60 and main.network.roads.size() == 4,
		"%d case, %d drumuri, %d stații, %d mașini în trafic" % [w.house_count, main.network.roads.size(), main.network.stops.size(), main.traffic.cars.size()])
	var v = vehicle("sedan_e46_330i")
	await _frames(240)
	check("Vehiculele stau pe roți", v.global_position.y > -0.2 and v.global_position.y < 0.6 and v.global_transform.basis.y.dot(Vector3.UP) > 0.95,
		"BMW tip E46 la înălțimea %.2f m" % v.global_position.y)


func test_forward_and_acceleration() -> void:
	var v = vehicle("sedan_e46_330i")
	v.transmission = "auto"
	on_straight(v)
	await _frames(60)
	var start: Vector3 = v.global_position
	v.ai_input["throttle"] = 1.0
	var t := await _steps_until(func(): return v.kmh() >= 100.0, 20.0)
	var moved: Vector3 = v.global_position - start
	var fwd: Vector3 = v.global_transform.basis.z
	check("Mașina merge înainte", moved.dot(fwd) > 50.0, "%.0f m în direcția botului" % moved.dot(fwd))
	check("Accelerație 0–100 km/h (tip 330i, real ≈ 6,5 s)", t > 5.0 and t < 9.5, "%.1f s, treapta %s, %d rpm" % [t, v.gear_label(), int(v.rpm)])


func test_braking() -> void:
	var v = vehicle("sedan_e46_330i")
	on_straight(v, -250.0)
	v.linear_velocity = v.global_transform.basis.z * (100.0 / 3.6)
	await physics_frame
	var p0: Vector3 = v.global_position
	v.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return v.kmh() < 1.0, 10.0)
	var d: float = v.global_position.distance_to(p0)
	check("Frânare 100–0 km/h (real ≈ 38–42 m)", d > 30.0 and d < 55.0, "%.1f m" % d)


func test_van() -> void:
	var v = vehicle("microbuz_clasic")
	v.transmission = "auto"
	on_straight(v, -760.0)
	await _frames(60)
	v.ai_input["throttle"] = 1.0
	var t := await _steps_until(func(): return v.kmh() >= 80.0, 30.0)
	check("Microbuz 0–80 km/h (real ≈ 10–12 s)", t > 6.0 and t < 16.0, "%.1f s, treapta %s" % [t, v.gear_label()])
	v.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return v.kmh() < 1.0, 10.0)
	v.ai_input = null
	v.parking_brake = true


func test_cornering() -> void:
	var v = vehicle("sedan_e46_330i")
	v.place(Vector3(300, 0, -700), PI)   # open meadow east of the river
	v.parking_brake = false
	await _frames(30)
	v.linear_velocity = v.global_transform.basis.z * (50.0 / 3.6)
	v.ai_input = {"throttle": 0.3, "brake": 0.0, "steer": 1.0}
	var yaw0: float = v.global_rotation.y
	await _steps_until(func(): return false, 3.0)
	var upright: float = v.global_transform.basis.y.dot(Vector3.UP)
	var turned := absf(wrapf(v.global_rotation.y - yaw0, -PI, PI))
	check("Viraj la 50 km/h, volan la maxim: nu se răstoarnă", upright > 0.85 and turned > 0.5,
		"înclinare %.2f, s-a rotit %.0f°, viteză %.0f km/h" % [upright, rad_to_deg(turned), v.kmh()])
	v.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return v.kmh() < 1.0, 10.0)


func test_manual_stall() -> void:
	var v = vehicle("sedan_e46_330i")
	on_straight(v, -330.0)
	v.transmission = "manual"
	v.assisted_clutch = false
	v.gear = 1
	v.ai_input = {"throttle": 0.0, "brake": 0.0, "steer": 0.0, "clutch": 0.0}
	await _steps_until(func(): return not v.engine_on, 2.0)
	check("Cutie manuală: motorul se oprește dacă eliberezi ambreiajul fără accelerație", not v.engine_on, "motor oprit = %s" % str(not v.engine_on))
	# proper start: clutch in, first gear, throttle, release clutch progressively
	v.engine_on = true
	v.ai_input = {"throttle": 0.0, "brake": 0.0, "steer": 0.0, "clutch": 1.0}
	await _frames(30)
	v.ai_input = {"throttle": 0.55, "brake": 0.0, "steer": 0.0, "clutch": 1.0}
	for k in 60:
		v.ai_input["clutch"] = 1.0 - k / 60.0
		await _frames(2)
	await _frames(120)
	check("Cutie manuală: plecare cu ambreiajul eliberat treptat", v.engine_on and v.kmh() > 8.0, "%.0f km/h, %d rpm" % [v.kmh(), int(v.rpm)])
	v.transmission = "auto"
	v.assisted_clutch = true
	v.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return v.kmh() < 1.0, 10.0)


func test_fuel() -> void:
	var v = vehicle("sedan_e46_330i")
	on_straight(v, -260.0)
	v.global_position += Vector3(-250, 0, 0)
	v.ai_input = {"throttle": 0.6, "brake": 0.0, "steer": 0.0}
	await _steps_until(func(): return v.kmh() > 88.0, 15.0)
	var f0: float = v.fuel_used_l
	var o0: float = v.odometer_km
	# hold about 90 km/h with a simple cruise control
	var t := 0.0
	while t < 25.0:
		v.ai_input["throttle"] = clampf((90.0 - v.kmh()) * 0.08 + 0.25, 0.0, 1.0)
		await physics_frame
		t += dt
	var l100: float = (v.fuel_used_l - f0) / maxf(v.odometer_km - o0, 0.001) * 100.0
	check("Consum la 90 km/h constant (tip 330i, real ≈ 6–8 L/100 km)", l100 > 4.0 and l100 < 11.0, "%.1f L/100 km, treapta %s" % [l100, v.gear_label()])
	v.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return v.kmh() < 1.0, 10.0)
	v.ai_input = null


func test_enter_exit() -> void:
	var van = vehicle("microbuz_clasic")
	van.place(Vector3(260, 0, -1150), PI)   # off the road, so passing traffic cannot hit the player
	van.ai_input = null
	van.parking_brake = true
	await _frames(90)
	var p = main.player
	p.global_position = van.entry_point() + Vector3(0.3, 0.0, 0.0)
	await _frames(10)
	main._interact()
	await _frames(5)
	var inside: bool = p.vehicle == van and main.rig.vehicle == van and not p.visible
	main._interact()
	await _frames(5)
	var out: bool = p.vehicle == null and p.visible and p.global_position.distance_to(van.global_position) < 4.0
	check("Personajul urcă și coboară din microbuz", inside and out, "în vehicul: %s, coborât lângă ușă: %s (la %.1f m de centrul microbuzului)" % [str(inside), str(out), p.global_position.distance_to(van.global_position)])
	# walk a few metres
	var p0: Vector3 = p.global_position
	Input.action_press("accelerate")
	await _steps_until(func(): return false, 1.5)
	Input.action_release("accelerate")
	check("Personajul merge pe jos", p.global_position.distance_to(p0) > 1.0, "%.1f m în 1,5 s" % p.global_position.distance_to(p0))


func _hitch_to(v, t, spot: Vector3) -> void:
	t.place(spot, PI)    # open meadow, away from the depot's other vehicles
	await _frames(60)
	v.place(t.global_position + t.global_transform.basis.z * 6.0, t.global_rotation.y)
	await _frames(30)
	var off: Vector3 = t.coupler_global() - v.hitch_global()
	off.y = 0.0
	v.place(v.global_position + off, t.global_rotation.y)
	await _frames(90)


func test_trailer() -> void:
	var car = vehicle("sedan_e46_330i")
	car.ai_input = {"throttle": 0.0, "brake": 0.0, "steer": 0.0}
	car.parking_brake = false
	car.engine_on = true
	var platform = main.trailer_by_spec("platforma_auto")
	platform.set_cargo(1500)
	await _hitch_to(car, platform, Vector3(380, 0, -850))
	var err: String = platform.couple(car)
	check("Compatibilitate: BMW tip E46 refuză platforma încărcată (2.220 kg > 1.600 kg)", err.begins_with("Prea grea"), err)
	platform.set_cargo(0)
	var lug = main.trailer_by_spec("remorca_bagaje")
	await _hitch_to(car, lug, Vector3(300, 0, -1000))
	err = lug.couple(car)
	check("Cuplare remorcă de bagaje la BMW tip E46", err == "" and car.trailer == lug, err if err != "" else "cuplată, %d kg" % int(lug.total_mass()))
	if err != "":
		return
	var t0: Vector3 = lug.global_position
	car.gear = 1
	car.ai_input = {"throttle": 0.45, "brake": 0.0, "steer": 0.0}
	for k in 6:
		await _steps_until(func(): return false, 1.0)
		print("  remorcă: t=%d s, viteză %.0f km/h, cârlig–cuplă %.2f m" % [k + 1, car.kmh(), car.hitch_global().distance_to(lug.coupler_global())])
	var gap: float = car.hitch_global().distance_to(lug.coupler_global())
	var moved: float = lug.global_position.distance_to(t0)
	check("Remorca e tractată și rămâne prinsă de cârlig", moved > 15.0 and gap < 0.5, "remorca a parcurs %.0f m, distanță cârlig–cuplă %.2f m" % [moved, gap])
	car.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return car.kmh() < 1.0, 10.0)
	lug.uncouple()
	check("Decuplare remorcă", car.trailer == null and lug.coupled_to == null, "ok")
	car.ai_input = null


func test_passenger_job() -> void:
	var jobs = main.jobs
	var van = vehicle("microbuz_clasic")
	jobs.offers.insert(0, {"type": "pasageri", "from": "telciu_centru", "to": "telciu_sud", "count": 3, "fare": 7, "km": 0.9,
		"title": "Telciu Centru → Telciu Sud", "detail": "test"})
	var money0: int = main.get_node("/root/GameState").money
	jobs.accept(0)
	main.player.global_position = van.entry_point()
	await _frames(5)
	main._interact()
	var park := func(stop_id: String):
		var sp: Vector2 = main.network.stops[stop_id]["pos"]
		var nr: Dictionary = main.network.nearest_on_road(sp)
		var dir: Vector2 = nr["dir"]
		var right := Vector2(-dir.y, dir.x)
		if right.dot(sp - nr["point"]) < 0.0:
			dir = -dir
			right = -right
		var spot: Vector2 = nr["point"] + right * 2.2
		van.place(Vector3(spot.x, 0, spot.y), atan2(dir.x, dir.y))
	park.call("telciu_centru")
	van.ai_input = {"throttle": 0.0, "brake": 0.3, "steer": 0.0}
	van.engine_on = true
	await _frames(60)
	van.set_door("DoorSide", true)
	await _steps_until(func(): return jobs.active.get("state", "") == "transit", 60.0)
	var boarded: int = van.passengers_on
	check("Pasagerii urcă pe ușa laterală și plătesc biletul", boarded == 3 and jobs.active.get("state", "") == "transit",
		"%d pasageri în scaune, %d bagaje, stare %s" % [boarded, van.bags_on, jobs.active.get("state", "?")])
	van.set_door("DoorSide", false)
	await _frames(120)
	park.call("telciu_sud")
	await _frames(60)
	van.set_door("DoorSide", true)
	var finished := [false]
	jobs.finished.connect(func(_s): finished[0] = true, CONNECT_ONE_SHOT)
	await _steps_until(func(): return finished[0], 60.0)
	var earned: int = main.get_node("/root/GameState").money - money0
	check("Pasagerii coboară la destinație și cursa se încheie", finished[0] and van.passengers_on == 0 and earned >= 21,
		"încasat %d lei (3 bilete × 7 lei + bonus rating)" % earned)
	van.set_door("DoorSide", false)
	main._interact()
	van.ai_input = null


func test_traffic() -> void:
	var cars: Array = main.traffic.cars
	var before: Array = cars.map(func(c): return c.global_position)
	await _steps_until(func(): return false, 6.0)
	var moving := 0
	for i in cars.size():
		if cars[i].global_position.distance_to(before[i]) > 20.0:
			moving += 1
	check("Trafic: mașinile circulă pe benzi", moving >= cars.size() * 0.6, "%d din %d s-au deplasat peste 20 m în 6 s" % [moving, cars.size()])
	var on_lane := 0
	for c in cars:
		var nr: Dictionary = main.network.nearest_on_road(Vector2(c.global_position.x, c.global_position.z))
		if nr["dist"] < 3.5:
			on_lane += 1
	check("Trafic: mașinile stau pe drum", on_lane == cars.size(), "%d din %d la sub 3,5 m de axul drumului" % [on_lane, cars.size()])


func test_radar() -> void:
	var gs = main.get_node("/root/GameState")
	var car = vehicle("sedan_e46_330i")
	main.player.global_position = car.entry_point()
	await _frames(3)
	main._interact()
	var rz: Vector3 = main.world.radar_zone
	var nr: Dictionary = main.network.nearest_on_road(Vector2(rz.x, rz.z + 60.0))
	var dir: Vector2 = nr["dir"]
	if dir.y > 0.0:
		dir = -dir
	var lane: Vector2 = nr["point"] + Vector2(-dir.y, dir.x) * 1.85
	# keep this check independent of where the AI cars happen to be
	main.traffic.set_physics_process(false)
	for c in main.traffic.cars:
		c.global_position = Vector3(400, 0, -1800)
	car.place(Vector3(lane.x, 0, lane.y), atan2(dir.x, dir.y))
	car.engine_on = true
	car.parking_brake = false
	car.linear_velocity = car.global_transform.basis.z * (95.0 / 3.6)
	car.ai_input = {"throttle": 0.5, "brake": 0.0, "steer": 0.0}
	var m0: int = gs.money
	await _steps_until(func(): return gs.money < m0, 6.0)
	check("Radar: amendă pentru viteză în localitate (limită 50 km/h)", gs.money < m0, "amendă %d lei" % (m0 - gs.money))
	main.traffic.set_physics_process(true)
	car.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	await _steps_until(func(): return car.kmh() < 1.0, 10.0)
	main._interact()
	car.ai_input = null


func test_save_load() -> void:
	var gs = main.get_node("/root/GameState")
	gs.testing = false
	var path := "user://salvare.json"
	var had := FileAccess.file_exists(path)
	var backup := FileAccess.get_file_as_string(path) if had else ""
	main.save_all()
	var snap: Dictionary = gs.to_dict()
	gs.money = 1
	var ok: bool = gs.load_game()
	check("Salvare și încărcare", ok and gs.money == snap["money"] and gs.owned.size() == snap["owned"].size(),
		"bani %d, %d vehicule/remorci" % [gs.money, gs.owned.size()])
	if had:
		var f := FileAccess.open(path, FileAccess.WRITE)
		f.store_string(backup)
	else:
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	gs.testing = true
