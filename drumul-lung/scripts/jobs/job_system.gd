class_name JobSystem
extends Node3D
## Transport contracts.
## - Passengers: go to the pickup stop with a minibus, stop and open the side door; passengers walk
##   over, pay their ticket and take a seat (bags go to the luggage area). Drive to the destination
##   stop, open the door and they get off. Rating 1–5 from driving: hard braking, crashes, speeding,
##   driving with the door open.
## - Luggage: couple the luggage trailer at the depot, it is loaded, deliver it to a stop.
## Payment follows Romanian rural fares (a few lei per passenger per km band).

signal changed
signal finished(summary: Dictionary)

const BOARD_RADIUS := 16.0

var network: RoadNetwork
var main = null                  # scripts/main.gd, for vehicles, trailers and messages
var offers: Array = []
var active: Dictionary = {}
var _waiting: Array = []         # Passenger nodes at the pickup stop
var _onboard: Array = []         # bookings riding in the vehicle
var _leaving: Array = []
var _board_cooldown := 0.0
var _rng := RandomNumberGenerator.new()
var _overspeed_t := 0.0
var _door_moving_t := 0.0


func setup(net: RoadNetwork, game) -> void:
	network = net
	main = game
	_rng.randomize()
	refresh_offers()


func stop_pos(id: String) -> Vector3:
	var p: Vector2 = network.stops[id]["pos"]
	return Vector3(p.x, 0, p.y)


func stop_name(id: String) -> String:
	return network.stops[id]["name"]


func refresh_offers() -> void:
	offers.clear()
	var ids := network.stops.keys()
	var passenger_stops := ids.filter(func(i): return i != "depou")
	if passenger_stops.size() < 2:
		changed.emit()
		return  # a map needs at least two stops for passenger routes
	for k in 5:
		var a: String = passenger_stops[_rng.randi() % passenger_stops.size()]
		var b: String = a
		while b == a:
			b = passenger_stops[_rng.randi() % passenger_stops.size()]
		var km := RoadNetwork.polyline_length(network.route(network.stops[a]["pos"], network.stops[b]["pos"])) / 1000.0
		var n := _rng.randi_range(3, 11)
		var fare := 4 + int(ceil(km * 1.5))
		offers.append({"type": "pasageri", "from": a, "to": b, "count": n, "fare": fare, "km": km,
			"title": "%s → %s" % [stop_name(a), stop_name(b)],
			"detail": "%d pasageri · %.1f km · bilet %d lei" % [n, km, fare]})
	for k in (2 if network.stops.has("depou") else 0):
		var b: String = passenger_stops[_rng.randi() % passenger_stops.size()]
		var km := RoadNetwork.polyline_length(network.route(network.stops["depou"]["pos"], network.stops[b]["pos"])) / 1000.0
		var kg := _rng.randi_range(180, 400)
		var pay := 90 + int(km * 45.0) + kg / 4
		offers.append({"type": "bagaje", "from": "depou", "to": b, "kg": kg, "pay": pay, "km": km,
			"title": "Bagaje: Depou → %s" % stop_name(b),
			"detail": "%d kg în remorca de bagaje · %.1f km · %d lei" % [kg, km, pay]})
	# International routes are part of the roadmap: they need the extended map (stage 4).
	changed.emit()


func accept(index: int) -> String:
	if not active.is_empty():
		return "Ai deja o cursă activă. Termin-o sau renunță la ea din meniu."
	var o: Dictionary = offers[index]
	active = o.duplicate()
	active["state"] = "pickup"
	active["rating"] = 5.0
	active["income"] = 0
	active["started"] = Time.get_ticks_msec()
	active["events"] = []
	offers.remove_at(index)
	if o["type"] == "pasageri":
		_spawn_waiting(o["from"], o["count"])
		main.toast("Mergi cu microbuzul la stația %s" % stop_name(o["from"]))
	else:
		main.toast("Cuplează remorca de bagaje la depou și du-o la %s" % stop_name(o["to"]))
	changed.emit()
	return ""


func abandon() -> void:
	if active.is_empty():
		return
	for p in _waiting + _leaving:
		p.queue_free()
	_waiting.clear()
	_leaving.clear()
	var v = main.current_vehicle()
	if v and v.has_method("set_passengers"):
		v.set_passengers(0)
		v.set_bags(0)
	_onboard.clear()
	active = {}
	main.toast("Cursa a fost anulată", "warn")
	changed.emit()


func _spawn_waiting(stop_id: String, n: int) -> void:
	var base := stop_pos(stop_id)
	for i in n:
		var p := Passenger.new()
		add_child(p)
		p.build(_rng.randi(), _rng.randf() < 0.7)
		p.global_position = base + Vector3(_rng.randf_range(-2.5, 2.5), 0, _rng.randf_range(-2.0, 1.0))
		p.model.rotation.y = _rng.randf() * TAU
		_waiting.append(p)


## Where the GPS should point right now.
func target() -> Vector3:
	if active.is_empty():
		return Vector3.INF
	if active["type"] == "bagaje" and active["state"] == "pickup":
		return stop_pos("depou")
	return stop_pos(active["from"] if active["state"] in ["pickup", "boarding"] else active["to"])


func instruction() -> String:
	if active.is_empty():
		return ""
	match active["state"]:
		"pickup":
			if active["type"] == "bagaje":
				return "Cuplează remorca de bagaje la depou (%s)" % InputSetup.label("trailer")
			return "Oprește la stația %s și deschide ușa (%s)" % [stop_name(active["from"]), InputSetup.label("doors")]
		"boarding":
			return "Urcă pasagerii: %d / %d" % [_onboard.size(), active["count"]]
		"transit":
			return "Du-i la stația %s" % stop_name(active["to"])
		"alighting":
			return "Deschide ușa ca să coboare pasagerii (%s)" % InputSetup.label("doors")
		"delivery":
			return "Du remorca la stația %s și oprește" % stop_name(active["to"])
	return ""


func _physics_process(delta: float) -> void:
	_board_cooldown -= delta
	for p in _leaving.duplicate():
		if not p.is_walking():
			_leaving.erase(p)
			p.queue_free()
	if active.is_empty():
		return
	var v = main.current_vehicle()
	_rate_driving(v, delta)
	if active["type"] == "pasageri":
		_passenger_job(v)
	else:
		_luggage_job(v)


func _rate_driving(v, delta: float) -> void:
	if v == null or not (active["state"] in ["transit", "delivery", "boarding", "alighting"]):
		return
	if v.long_accel < -5.0 and v.kmh() > 15.0:
		_penalty(0.15 * delta * 4.0, "frânare bruscă")
	var limit: float = main.speed_limit_at(v.global_position)
	if v.kmh() > limit + 10.0:
		_overspeed_t += delta
		if _overspeed_t > 4.0:
			_overspeed_t = 0.0
			_penalty(0.25, "viteză peste limită")
	if v.has_method("is_door_open") and v.is_door_open(v.main_door()) and v.kmh() > 5.0:
		_door_moving_t += delta
		if _door_moving_t > 1.5:
			_door_moving_t = 0.0
			_penalty(0.5, "mers cu ușa deschisă")


func _penalty(amount: float, why: String) -> void:
	active["rating"] = maxf(1.0, active["rating"] - amount)
	if not (why in active["events"]):
		active["events"].append(why)


func on_impact(strength: float) -> void:
	if not active.is_empty() and active["state"] != "pickup":
		_penalty(clampf(strength * 0.12, 0.3, 2.0), "coliziune")


func _at_stop(v, stop_id: String) -> bool:
	return v != null and v.global_position.distance_to(stop_pos(stop_id)) < BOARD_RADIUS and v.kmh() < 1.0


func _passenger_job(v) -> void:
	var is_bus: bool = v != null and v.seat_count() >= 8 and v.doors.has("DoorSide")
	match active["state"]:
		"pickup", "boarding":
			if not (is_bus and _at_stop(v, active["from"])):
				return
			if active["state"] == "pickup":
				active["state"] = "boarding"
				changed.emit()
			if not v.is_door_open("DoorSide"):
				return
			if _board_cooldown <= 0.0 and not _waiting.is_empty():
				var walking := _waiting.filter(func(p): return p.is_walking())
				if walking.is_empty():
					var p: Passenger = _waiting[0]
					p.walk_to(v.side_door_out())
					p.arrived.connect(_board.bind(p), CONNECT_ONE_SHOT)
					_board_cooldown = 0.9
			if _waiting.is_empty() and _onboard.size() >= active["count"]:
				active["state"] = "transit"
				main.toast("Toți pasagerii au urcat. Închide ușa și pornește spre %s" % stop_name(active["to"]))
				changed.emit()
		"transit", "alighting":
			if not (is_bus and _at_stop(v, active["to"])):
				return
			if active["state"] == "transit":
				active["state"] = "alighting"
				changed.emit()
			if not v.is_door_open("DoorSide"):
				return
			if _board_cooldown <= 0.0 and not _onboard.is_empty():
				_onboard.pop_back()
				v.set_passengers(_onboard.size())
				v.set_bags(_onboard.filter(func(b): return b["bag"]).size())
				var p := Passenger.new()
				add_child(p)
				p.build(_rng.randi(), false)
				p.global_position = v.side_door_out()
				var away: Vector3 = stop_pos(active["to"]) + Vector3(_rng.randf_range(-12, 12), 0, _rng.randf_range(-12, 12))
				p.walk_to(away)
				_leaving.append(p)
				_board_cooldown = 0.8
			if _onboard.is_empty():
				_complete()


func _board(p: Passenger) -> void:
	var v = main.current_vehicle()
	if v == null or not _waiting.has(p):
		return
	if v.global_position.distance_to(p.global_position) > 6.0 or not v.is_door_open("DoorSide") or _onboard.size() >= v.seat_count():
		# the bus left or closed the door: walk back to the stop
		p.walk_to(stop_pos(active["from"]) + Vector3(_rng.randf_range(-2, 2), 0, _rng.randf_range(-2, 1)))
		return
	_waiting.erase(p)
	_onboard.append({"bag": p.has_bag})
	p.queue_free()
	v.set_passengers(_onboard.size())
	v.set_bags(_onboard.filter(func(b): return b["bag"]).size())
	var fare: int = active["fare"]
	active["income"] += fare
	GameState.add_money(fare, "bilet")
	GameState.stats["passengers"] = int(GameState.stats.get("passengers", 0)) + 1


func _luggage_job(v) -> void:
	var tr = main.trailer_by_spec("remorca_bagaje")
	match active["state"]:
		"pickup":
			if tr != null and tr.coupled_to != null:
				tr.set_cargo(active["kg"])
				active["state"] = "delivery"
				main.toast("Remorca a fost încărcată cu %d kg. Du-o la %s" % [active["kg"], stop_name(active["to"])])
				changed.emit()
		"delivery":
			if tr == null or tr.coupled_to == null:
				return
			if tr.global_position.distance_to(stop_pos(active["to"])) < BOARD_RADIUS + 4.0 and tr.coupled_to.kmh() < 1.0:
				tr.set_cargo(0)
				active["income"] = active["pay"]
				GameState.add_money(active["pay"], "livrare bagaje")
				_complete()


func _complete() -> void:
	var rating: float = snappedf(active["rating"], 0.1)
	var bonus := 0
	if active["type"] == "pasageri":
		bonus = int(round(active["income"] * 0.1 * maxf(rating - 3.0, 0.0)))
	elif rating >= 4.5:
		bonus = int(active["pay"] * 0.1)
	if bonus > 0:
		GameState.add_money(bonus, "bonus rating")
	GameState.stats["jobs_done"] = int(GameState.stats.get("jobs_done", 0)) + 1
	GameState.stats["rating_sum"] = float(GameState.stats.get("rating_sum", 0.0)) + rating
	GameState.stats["rating_count"] = int(GameState.stats.get("rating_count", 0)) + 1
	var summary := {"title": active["title"], "income": int(active["income"]) + bonus, "rating": rating, "events": active["events"]}
	active = {}
	GameState.save_game()
	finished.emit(summary)
	if offers.size() < 3:
		refresh_offers()
	changed.emit()
