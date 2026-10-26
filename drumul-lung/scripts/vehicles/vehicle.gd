class_name Vehicle
extends VehicleBody3D
## Drivable vehicle on top of Godot's VehicleBody3D raycast suspension and tyre friction.
## Adds: engine torque curve, clutch (pedal or assisted), manual/automatic gearbox, engine braking,
## service/hand/parking brakes, aerodynamic drag, rolling resistance, fuel use, collision damage,
## lights, opening doors, passenger seats, luggage and a tow hitch.
## Godot vehicles drive toward +Z and positive steering turns right, so steering is negated here.

signal message(text: String, kind: String)
signal impact(strength: float)

const STATIC_COMPRESSION_AT_40 := 0.103   # measured for this solver: suspension sag at stiffness 40

var spec: Dictionary = {}
var uid := ""
var display_name := ""
var paint_color := Color.WHITE
var model: Node3D
var driven := false
var ai_input = null                 # Dictionary {throttle, brake, steer, handbrake, clutch} from tests/AI
var engine_on := false
var gear := 0                       # -1 reverse, 0 neutral, 1..n forward
var rpm := 0.0
var throttle := 0.0
var brake_in := 0.0
var steer_in := 0.0
var clutch_pedal := 0.0
var clutch := 0.0
var handbrake := false
var parking_brake := true
var fuel := 40.0
var damage := 0.0
var odometer_km := 0.0
var lights_on := false
var transmission := "auto"
var assisted_clutch := true
var shift_timer := 0.0
var speed := 0.0                    # m/s along the vehicle's forward axis, signed
var long_accel := 0.0
var trailer = null
var doors := {}
var passengers_on := 0
var bags_on := 0
var horn := false
var fuel_used_l := 0.0
var engine_torque_now := 0.0

var _wheels: Array = []
var _front: Array = []
var _rear: Array = []
var _drive: Array = []
var _drive_share: Dictionary = {}
var _prev_vel := Vector3.ZERO
var _prev_speed := 0.0
var _rev_hold := 0.0
var _rpm_free := 0.0
var _skip_impact := 10
var _crank := 0.0
var _spots: Array = []
var _seat_people: Array = []
var _bag_nodes: Array = []
var _warned_parking := false
var _radius := 0.33


func setup(p_spec: Dictionary, p_uid: String, p_color: Color, saved: Dictionary = {}) -> void:
	spec = p_spec
	uid = p_uid
	paint_color = p_color
	display_name = spec["short"]
	var dims: Dictionary = spec["dims"]
	mass = float(spec["mass"])
	_radius = float(dims["wheel_radius"])
	var wb: float = dims["wheelbase"]
	var zf: float = float(dims["length"]) * 0.5 - float(dims["front_overhang"])
	var zr: float = zf - wb
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	center_of_mass = Vector3(0, float(spec["cg_height"]), zr + wb * float(spec["weight_front"]))
	can_sleep = false
	# Godot's default linear damping (0.1/s) acts like a hidden brake; drag and rolling resistance are modelled explicitly
	linear_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	linear_damp = 0.0

	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	var clear: float = dims["clearance"]
	box.size = Vector3(dims["width"], float(dims["height"]) - clear - 0.05, dims["length"])
	cs.shape = box
	cs.position = Vector3(0, clear + box.size.y * 0.5, 0)
	add_child(cs)

	var plate := "BN %02d TLC" % (absi(hash(p_uid)) % 99 + 1)
	model = VehicleModel.build(spec, paint_color, true, plate)
	add_child(model)

	var susp: Dictionary = spec["suspension"]
	var k: float = susp["stiffness"]
	var rest: float = susp["rest"]
	var wy := _radius + rest - STATIC_COMPRESSION_AT_40 * 40.0 / k
	var tw: float = float(dims["track"]) * 0.5
	var drive: String = spec["drive"]
	var front_share: float = float(spec.get("front_share", 0.5))
	for z in [zf, zr]:
		var is_front: bool = z == zf
		for side in [1.0, -1.0]:
			var w := VehicleWheel3D.new()
			w.position = Vector3(side * tw, wy, z)
			w.use_as_steering = is_front
			w.use_as_traction = drive == "all" or (drive == "front" and is_front) or (drive == "rear" and not is_front)
			w.wheel_radius = _radius
			w.wheel_rest_length = rest
			w.suspension_travel = susp["travel"]
			w.suspension_stiffness = k
			w.suspension_max_force = mass * 9.81 * 2.0
			w.damping_compression = 0.6 * sqrt(k)
			w.damping_relaxation = 0.8 * sqrt(k)
			w.wheel_friction_slip = spec["grip"]
			w.wheel_roll_influence = 0.02
			add_child(w)
			w.add_child(_wheel_visual(_radius, dims["wheel_width"], side))
			_wheels.append(w)
			(_front if is_front else _rear).append(w)
			if w.use_as_traction:
				_drive.append(w)
				var share := 0.5
				if drive == "all":
					share = (front_share if is_front else 1.0 - front_share) * 0.5
				_drive_share[w] = share

	for door_name in ["DoorDriver", "DoorSide"]:
		var n := model.get_node_or_null(door_name)
		if n:
			doors[door_name] = {"node": n, "open": false, "t": 0.0, "base": n.position}
	for sx in [-1.0, 1.0]:
		var sp := SpotLight3D.new()
		sp.position = Vector3(sx * 0.6, float(dims["height"]) * 0.32 + 0.2, float(dims["length"]) * 0.5)
		sp.rotation.y = PI
		sp.rotation.x = -0.05
		sp.spot_range = 70.0
		sp.spot_angle = 32.0
		sp.light_energy = 0.0
		sp.light_color = Color(1.0, 0.96, 0.88)
		add_child(sp)
		_spots.append(sp)

	transmission = GameState.settings.get("transmission", "auto")
	if not (transmission in spec["gearbox"]["modes"]):
		transmission = spec["gearbox"]["modes"][0]
	assisted_clutch = GameState.settings.get("assisted_clutch", true)
	fuel = float(saved.get("fuel", spec.get("fuel", {}).get("tank", 50) * 0.5))
	damage = float(saved.get("damage", 0.0))
	odometer_km = float(saved.get("odometer", 0.0))
	_rpm_free = 0.0


func _wheel_visual(r: float, width: float, side: float) -> Node3D:
	var root := Node3D.new()
	var tire := MeshInstance3D.new()
	var tm := CylinderMesh.new()
	tm.top_radius = r
	tm.bottom_radius = r
	tm.height = width
	tm.radial_segments = 24
	tire.mesh = tm
	tire.rotation.z = PI / 2
	tire.material_override = MeshKit.color_material(Color(0.07, 0.07, 0.07), 0.95)
	root.add_child(tire)
	var rim := MeshInstance3D.new()
	var rm := CylinderMesh.new()
	rm.top_radius = r * 0.62
	rm.bottom_radius = r * 0.62
	rm.height = width + 0.01
	rm.radial_segments = 18
	rim.mesh = rm
	rim.rotation.z = PI / 2
	rim.material_override = MeshKit.color_material(Color(0.72, 0.73, 0.75), 0.3, 0.8)
	root.add_child(rim)
	for k in 5:
		var spoke := MeshInstance3D.new()
		var sm := BoxMesh.new()
		sm.size = Vector3(0.02, r * 1.1, 0.05)
		spoke.mesh = sm
		spoke.material_override = MeshKit.color_material(Color(0.25, 0.26, 0.28), 0.4, 0.6)
		spoke.position = Vector3(side * (width * 0.5 + 0.012), 0, 0)
		spoke.rotation.x = TAU * k / 5.0
		root.add_child(spoke)
	return root


# ------------------------------------------------------------------ simulation
func _physics_process(delta: float) -> void:
	var fwd := global_transform.basis.z
	var v := linear_velocity
	speed = v.dot(fwd)
	long_accel = lerpf(long_accel, (speed - _prev_speed) / delta, 0.15)
	_prev_speed = speed
	if _skip_impact > 0:
		_skip_impact -= 1
	else:
		var dv := (v - _prev_vel).length()
		if dv > 2.5 and _prev_vel.length() > 1.5:
			_on_impact(dv)
	_prev_vel = v
	_read_input(delta)
	_update_gearbox(delta)
	_update_engine(delta)
	_apply_forces()
	_update_fuel(delta)
	odometer_km += absf(speed) * delta / 1000.0
	_update_doors(delta)


func _read_input(delta: float) -> void:
	var t := 0.0
	var b := 0.0
	var s := 0.0
	var cl := 0.0
	var hb := false
	if ai_input != null:
		t = float(ai_input.get("throttle", 0.0))
		b = float(ai_input.get("brake", 0.0))
		s = float(ai_input.get("steer", 0.0))
		cl = float(ai_input.get("clutch", 0.0))
		hb = bool(ai_input.get("handbrake", false))
	elif driven:
		t = Input.get_action_strength("accelerate")
		b = Input.get_action_strength("brake")
		s = Input.get_axis("steer_right", "steer_left")
		cl = Input.get_action_strength("clutch")
		hb = Input.is_action_pressed("handbrake")
		horn = Input.is_action_pressed("horn")
		if Input.is_action_just_pressed("gear_up"):
			shift(1)
		if Input.is_action_just_pressed("gear_down"):
			shift(-1)
		if Input.is_action_just_pressed("engine"):
			toggle_engine()
		if Input.is_action_just_pressed("lights"):
			set_lights(not lights_on)
		if Input.is_action_just_pressed("parking_brake"):
			set_parking_brake(not parking_brake)
		if Input.is_action_just_pressed("doors"):
			toggle_main_door()
	throttle = move_toward(throttle, t, delta * (2.5 if t > throttle else 6.0))
	brake_in = move_toward(brake_in, b, delta * 6.0)
	clutch_pedal = move_toward(clutch_pedal, cl, delta * 5.0)
	var kmh := absf(speed) * 3.6
	var max_steer: float = float(spec["max_steer"]) / (1.0 + kmh * 0.012)
	steer_in = move_toward(steer_in, s * max_steer, delta * (1.4 if absf(s) > 0.01 else 2.0))
	handbrake = hb
	if driven and parking_brake and _drive_input() > 0.5 and engine_on and gear != 0 and not _warned_parking:
		_warned_parking = true
		message.emit("Frâna de parcare e trasă — apasă P", "warn")


## Pedal that makes the vehicle move: in automatic reverse, S drives backwards and W brakes.
func _drive_input() -> float:
	if transmission == "auto" and gear == -1:
		return brake_in
	return throttle


func _brake_input() -> float:
	if transmission == "auto" and gear == -1:
		return throttle
	return brake_in


func gear_count() -> int:
	return spec["gearbox"]["gears"].size()


func gear_label() -> String:
	if gear == -1:
		return "R"
	if gear == 0:
		return "N"
	if transmission == "auto":
		return "D%d" % gear
	return str(gear)


func _ratio() -> float:
	var gb: Dictionary = spec["gearbox"]
	if gear > 0:
		return float(gb["gears"][gear - 1]) * float(gb["final"])
	if gear < 0:
		return -float(gb["reverse"]) * float(gb["final"])
	return 0.0


func shift(dir: int) -> void:
	if transmission == "auto":
		# selector: R - N - D
		var pos := 1 if gear >= 1 else gear
		pos = clampi(pos + dir, -1, 1)
		if pos == -1 and speed > 1.0:
			message.emit("Oprește complet înainte de marșarier", "warn")
			return
		gear = pos
		return
	if not assisted_clutch and clutch_pedal < 0.6:
		message.emit("Apasă ambreiajul (%s) ca să schimbi treapta" % InputSetup.label("clutch"), "warn")
		return
	var target := clampi(gear + dir, -1, gear_count())
	if target == -1 and speed > 1.0:
		message.emit("Oprește complet înainte de marșarier", "warn")
		return
	gear = target
	shift_timer = float(spec["gearbox"]["shift_time"]) if assisted_clutch else 0.0


func toggle_engine() -> void:
	if engine_on:
		engine_on = false
		return
	if fuel <= 0.0:
		message.emit("Rezervorul este gol", "warn")
		return
	if damage >= 0.95:
		message.emit("Motorul e avariat — cheamă asistența rutieră din meniu", "warn")
		return
	if transmission == "manual" and gear != 0 and clutch_pedal < 0.6 and not assisted_clutch:
		message.emit("Apasă ambreiajul sau pune în neutru ca să pornești", "warn")
		return
	engine_on = true
	_crank = 0.7
	if transmission == "auto" and gear == 0:
		gear = 1


func set_lights(on: bool) -> void:
	lights_on = on
	for sp in _spots:
		sp.light_energy = 4.0 if on else 0.0
	var hm: StandardMaterial3D = model.get_meta("head_mat")
	hm.emission_energy_multiplier = 3.0 if on else 0.3


func set_parking_brake(on: bool) -> void:
	parking_brake = on
	_warned_parking = false


func _update_gearbox(delta: float) -> void:
	if shift_timer > 0.0:
		shift_timer -= delta
	if transmission != "auto" or not engine_on:
		return
	var gb: Dictionary = spec["gearbox"]
	if gear >= 1:
		if absf(speed) < 0.4 and brake_in > 0.5 and throttle < 0.05:
			_rev_hold += delta
			if _rev_hold > 0.45:
				gear = -1
				_rev_hold = 0.0
				return
		else:
			_rev_hold = 0.0
		if shift_timer <= 0.0:
			# decisions use the rpm the engine would have in the current gear, not a slipping/free-revving value
			var r := linked_rpm()
			var up := lerpf(gb["auto_up"][0], gb["auto_up"][1], throttle)
			var down := lerpf(gb["auto_down"][0], gb["auto_down"][1], throttle)
			if r > up and gear < gear_count():
				gear += 1
				shift_timer = gb["shift_time"]
			elif r < down and gear > 1 and r * float(gb["gears"][gear - 2]) / float(gb["gears"][gear - 1]) < up * 0.85:
				gear -= 1
				shift_timer = float(gb["shift_time"]) * 0.7
	elif gear == -1:
		if absf(speed) < 0.4 and throttle > 0.5 and brake_in < 0.05:
			_rev_hold += delta
			if _rev_hold > 0.3:
				gear = 1
				_rev_hold = 0.0
		else:
			_rev_hold = 0.0


func linked_rpm() -> float:
	return maxf(speed / (TAU * _radius) * 60.0 * _ratio(), 0.0)


func torque_at(r: float) -> float:
	var curve: Array = spec["engine"]["torque"]
	if r <= curve[0][0]:
		return float(curve[0][1]) * clampf(r / float(curve[0][0]), 0.0, 1.0)
	for i in range(1, curve.size()):
		if r <= curve[i][0]:
			var t := (r - float(curve[i - 1][0])) / (float(curve[i][0]) - float(curve[i - 1][0]))
			return lerpf(curve[i - 1][1], curve[i][1], t)
	return float(curve[-1][1])


func max_torque() -> float:
	var m := 0.0
	for p in spec["engine"]["torque"]:
		m = maxf(m, p[1])
	return m


func _update_engine(delta: float) -> void:
	var eng: Dictionary = spec["engine"]
	var idle: float = eng["idle"]
	var limiter: float = eng["limiter"]
	var drive := _drive_input()
	var ratio := _ratio()
	var wheel_rpm := speed / (TAU * _radius) * 60.0
	var linked := maxf(wheel_rpm * ratio, 0.0)
	# clutch engagement
	if gear == 0 or shift_timer > 0.0:
		clutch = 0.0
	elif transmission == "manual" and not assisted_clutch:
		clutch = 1.0 - clutch_pedal
	else:
		var engaged := clampf((linked - idle) / (idle * 0.5), 0.0, 1.0)
		var launch := (0.35 + 0.6 * drive) if drive > 0.02 else 0.0
		clutch = maxf(engaged, launch)
		if transmission == "manual":
			clutch = minf(clutch, 1.0 - clutch_pedal)
	if not engine_on:
		_rpm_free = move_toward(_rpm_free, 0.0, delta * 2500.0)
	else:
		if _crank > 0.0:
			_crank -= delta
		var target := idle + drive * (limiter - idle)
		_rpm_free = move_toward(_rpm_free, target, delta * (4000.0 if target > _rpm_free else 2600.0))
	var launch_rpm := idle + drive * (minf(float(eng["redline"]) * 0.45, 3000.0) - idle)
	if shift_timer > 0.0 and gear != 0 and engine_on:
		# during a gear change the engine speed falls or rises to match the new gear
		_rpm_free = maxf(linked, idle)
		rpm = lerpf(rpm, _rpm_free, 0.25)
	elif clutch >= 0.999:
		_rpm_free = linked
		rpm = linked
	else:
		rpm = lerpf(_rpm_free, maxf(linked, launch_rpm if engine_on else linked), clutch)
	if engine_on:
		if transmission == "manual" and not assisted_clutch and clutch > 0.8 and gear != 0 and rpm < idle * 0.55:
			engine_on = false
			message.emit("Motorul s-a oprit. Apasă ambreiajul și %s" % InputSetup.label("engine"), "warn")
		else:
			rpm = maxf(rpm, idle * (0.6 if _crank > 0.0 else 0.95))
	# torque at the flywheel
	var t := 0.0
	var mt := max_torque()
	if engine_on and fuel > 0.0:
		if drive > 0.03:
			t = torque_at(rpm) * drive * (1.0 - damage * 0.6)
		else:
			t = -float(eng["engine_brake"]) * mt * clampf(rpm / float(eng["redline"]), 0.0, 1.0)
		if rpm > limiter:
			t = minf(t, 0.0)
	elif clutch > 0.5 and gear != 0:
		t = -0.1 * mt * clampf(rpm / float(eng["redline"]), 0.0, 1.0)
	engine_torque_now = t
	_wheel_force = t * clutch * ratio * 0.9 / _radius


var _wheel_force := 0.0


func _apply_forces() -> void:
	for w in _wheels:
		w.engine_force = 0.0
	for w in _drive:
		w.engine_force = _wheel_force * _drive_share[w]
	var max_brake: float = mass * 0.024 * float(spec["brake_g"])   # per-wheel impulse cap; ≈1 g at 120 Hz
	var b := _brake_input()
	var grip: float = spec["grip"]
	for w in _front:
		w.brake = b * max_brake * 1.15
		w.steering = -steer_in
	for w in _rear:
		var rb := b * max_brake * 0.85
		if handbrake:
			rb = max_brake * 1.3
		if parking_brake:
			rb = maxf(rb, max_brake * 1.5)
		w.brake = rb
		w.wheel_friction_slip = grip * (0.45 if handbrake and absf(speed) > 2.0 else 1.0)
	var v := linear_velocity
	var sp := v.length()
	if sp > 0.05:
		apply_central_force(-v * sp * float(spec["drag"]))
		apply_central_force(-v / sp * mass * 9.81 * 0.012 * clampf(sp, 0.0, 1.0))


func _update_fuel(delta: float) -> void:
	if not engine_on:
		return
	var idle: float = spec["engine"]["idle"]
	var f: Dictionary = spec["fuel"]
	var power_kw := maxf(engine_torque_now, 0.0) * rpm / 9549.0
	var lph := float(f["idle_lph"]) * clampf(rpm / idle, 1.0, 3.0) * 0.8 + power_kw * float(f["l_per_kwh"])
	var used := lph / 3600.0 * delta
	fuel = maxf(0.0, fuel - used)
	fuel_used_l += used
	if fuel <= 0.0:
		engine_on = false
		message.emit("Rezervorul este gol!", "warn")


func _on_impact(dv: float) -> void:
	var dmg := clampf((dv - 2.5) * 0.035, 0.0, 0.5)
	damage = minf(1.0, damage + dmg)
	impact.emit(dv)
	if driven:
		message.emit("Impact! Avarie %d%%" % int(damage * 100.0), "warn")
	if damage >= 0.95 and engine_on:
		engine_on = false
		message.emit("Motorul s-a oprit din cauza avariei", "warn")


# ------------------------------------------------------------------ doors, seats, visuals
func main_door() -> String:
	return "DoorSide" if doors.has("DoorSide") else "DoorDriver"


func toggle_main_door() -> void:
	var d := main_door()
	if doors.has(d):
		set_door(d, not doors[d]["open"])


func set_door(door_name: String, open: bool) -> void:
	if doors.has(door_name):
		doors[door_name]["open"] = open


func is_door_open(door_name: String) -> bool:
	return doors.has(door_name) and doors[door_name]["t"] > 0.9


func _update_doors(delta: float) -> void:
	for door_name in doors:
		var d: Dictionary = doors[door_name]
		var target := 1.0 if d["open"] else 0.0
		if d["t"] == target:
			continue
		d["t"] = move_toward(d["t"], target, delta * 1.5)
		var n: Node3D = d["node"]
		var side: float = n.get_meta("side")
		var t: float = d["t"]
		if n.get_meta("type") == "hinge":
			n.rotation.y = -side * deg_to_rad(68.0) * t
		else:
			var len: float = n.get_meta("length")
			n.position = d["base"] + Vector3(side * 0.12 * clampf(t * 4.0, 0.0, 1.0), 0, -len * 0.95 * clampf((t - 0.15) / 0.85, 0.0, 1.0))


func seat_count() -> int:
	return int(spec.get("seats", 0))


func set_passengers(n: int) -> void:
	passengers_on = n
	var seats := model.get_node_or_null("Seats")
	if seats == null:
		return
	while _seat_people.size() < seats.get_child_count():
		var p := PersonModel.new()
		p.build(_seat_people.size() * 31 + 7)
		p.sit()
		p.visible = false
		seats.get_child(_seat_people.size()).add_child(p)
		_seat_people.append(p)
	for i in _seat_people.size():
		_seat_people[i].visible = i < n


func set_bags(n: int) -> void:
	bags_on = n
	var lug := model.get_node_or_null("Luggage")
	if lug == null:
		return
	var colors := [Color(0.15, 0.17, 0.2), Color(0.45, 0.12, 0.1), Color(0.12, 0.3, 0.45), Color(0.35, 0.33, 0.3)]
	var depth: float = lug.get_meta("depth")
	while _bag_nodes.size() < n:
		var i := _bag_nodes.size()
		var b := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.45, 0.28, minf(0.3, depth * 0.8))
		b.mesh = bm
		b.material_override = MeshKit.color_material(colors[i % colors.size()], 0.7)
		var per_row := 3
		b.position = Vector3(-0.55 + (i % per_row) * 0.55, 0.15 + (i / (per_row * 2)) * 0.3, ((i / per_row) % 2) * 0.32 - 0.16)
		lug.add_child(b)
		_bag_nodes.append(b)
	for i in _bag_nodes.size():
		_bag_nodes[i].visible = i < n


func _process(_delta: float) -> void:
	var kmh := absf(speed) * 3.6
	var ns := model.get_node_or_null("NeedleSpeed")
	if ns:
		ns.rotation.z = 2.2 - clampf(kmh / 220.0, 0.0, 1.0) * 4.4
	var nr := model.get_node_or_null("NeedleRpm")
	if nr:
		nr.rotation.z = 2.2 - clampf(rpm / float(spec["engine"]["limiter"]) * 0.95, 0.0, 1.0) * 4.4
	var sw := model.get_node_or_null("SteeringColumn/SteeringWheel")
	if sw:
		sw.rotation.y = steer_in * 9.0
	var tm: StandardMaterial3D = model.get_meta("tail_mat")
	tm.emission_energy_multiplier = 5.0 if _brake_input() > 0.1 else (1.6 if lights_on else 0.35)
	var rv: StandardMaterial3D = model.get_meta("rev_mat")
	rv.emission_energy_multiplier = 2.5 if gear == -1 else 0.0


# ------------------------------------------------------------------ helpers used by the game
func entry_point() -> Vector3:
	return model.get_node("DriverExit").global_position


func driver_eye() -> Node3D:
	return model.get_node("DriverEye")


func side_door_out() -> Vector3:
	var m := model.get_node_or_null("SideDoorOut")
	return m.global_position if m else entry_point()


func hitch_global() -> Vector3:
	return model.get_node("Hitch").global_position


func has_towbar() -> bool:
	return bool(spec.get("tow", {}).get("towbar", false))


func kmh() -> float:
	return absf(speed) * 3.6


## Puts the vehicle upright at a position and heading (used for spawning and roadside assistance).
func place(pos: Vector3, yaw: float) -> void:
	global_transform = Transform3D(Basis(Vector3.UP, yaw), pos + Vector3(0, 0.25, 0))
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
	_prev_vel = Vector3.ZERO
	_skip_impact = 30


func to_state() -> Dictionary:
	var p := global_position
	return {"uid": uid, "spec": spec["id"], "color": "#" + paint_color.to_html(false), "fuel": snappedf(fuel, 0.01),
		"damage": snappedf(damage, 0.001), "odometer": snappedf(odometer_km, 0.01), "pos": [p.x, p.y, p.z], "yaw": global_rotation.y}
