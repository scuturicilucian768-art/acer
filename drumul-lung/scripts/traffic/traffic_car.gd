class_name TrafficCar
extends AnimatableBody3D
## AI car that follows road lanes (right-hand traffic). It is kinematic: it keeps a safe gap to
## anything ahead in its lane (other traffic, the player's vehicle and trailer, people), slows for
## junctions and road ends, and drives at the posted limit. It does not crash or take damage itself.

const STYLES := ["hatch", "sedan", "wagon", "suv"]
const COLORS := [Color("#c9ccd1"), Color("#1c1f24"), Color("#e8e8e4"), Color("#7a1a1a"), Color("#1f3b73"), Color("#4a5a4a"), Color("#8a8f96"), Color("#b08a3c")]

var manager = null
var path: PackedVector3Array = PackedVector3Array()
var cursor := 0
var lane: Dictionary = {}
var speed := 0.0
var target_speed := 13.0
var length := 4.3
var _model: Node3D
var _tail: StandardMaterial3D
var _head: StandardMaterial3D
var _braking := false


static func make_body_mesh(style: String, color: Color, police := false) -> Node3D:
	return VehicleModel.build_simple(style, color, police)


func setup(rng: RandomNumberGenerator) -> void:
	var style: String = STYLES[rng.randi() % STYLES.size()]
	_model = VehicleModel.build_simple(style, COLORS[rng.randi() % COLORS.size()])
	add_child(_model)
	_tail = _model.get_meta("tail_mat")
	_head = _model.get_meta("head_mat")
	length = float(VehicleModel.style_def(style)["ref"][0])
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.75, 1.1, length)
	cs.shape = box
	cs.position.y = 0.75
	add_child(cs)
	sync_to_physics = false


func assign_lane(l: Dictionary, start_index := 0) -> void:
	lane = l
	path = PackedVector3Array()
	for p in l["points"]:
		path.append(Vector3(p.x, 0.0, p.y))
	cursor = clampi(start_index, 0, path.size() - 2)
	global_position = path[cursor]
	_face(path[cursor + 1] - path[cursor])


func _face(dir: Vector3) -> void:
	if dir.length_squared() > 0.0001:
		rotation.y = atan2(dir.x, dir.z)


func set_night(f: float) -> void:
	_head.emission_energy_multiplier = 0.3 + f * 2.5


func step(delta: float) -> void:
	if path.size() < 2:
		return
	var limit := float(lane.get("speed", 50))
	if manager and manager.network:
		limit = float(manager.network.speed_limit(int(lane["road"]), Vector2(global_position.x, global_position.z)))
	target_speed = limit / 3.6 * 0.92
	var remaining := 0.0
	for i in range(cursor, mini(cursor + 12, path.size() - 1)):
		remaining += path[i].distance_to(path[i + 1])
	if cursor + 12 >= path.size() - 1 and remaining < 30.0:
		target_speed = minf(target_speed, 6.0 + remaining * 0.25)
	var gap: float = manager.gap_ahead(self) if manager else INF
	var safe := maxf(0.0, (gap - 6.0) * 0.7)
	var want := minf(target_speed, safe)
	_braking = want < speed - 0.5
	speed = move_toward(speed, want, delta * (6.5 if _braking else 1.8))
	var move := speed * delta
	var pos := global_position
	while move > 0.0 and cursor < path.size() - 1:
		var to := path[cursor + 1] - pos
		var d := to.length()
		if d <= move:
			pos = path[cursor + 1]
			move -= d
			cursor += 1
		else:
			pos += to / d * move
			move = 0.0
	if cursor >= path.size() - 1:
		if manager:
			manager.next_lane(self)
		return
	pos.y = 0.0
	var ahead := path[mini(cursor + 2, path.size() - 1)] - pos
	var target_yaw := atan2(ahead.x, ahead.z) if ahead.length_squared() > 0.01 else rotation.y
	rotation.y = lerp_angle(rotation.y, target_yaw, minf(1.0, delta * 6.0))
	global_position = pos
	_tail.emission_energy_multiplier = 4.0 if _braking else 0.6


func forward() -> Vector3:
	return global_transform.basis.z
