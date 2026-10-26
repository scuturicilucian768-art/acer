class_name CameraRig
extends Node3D
## Third-person, chase and driver's-seat cameras. Look around with right mouse drag,
## a finger drag on the screen, or the gamepad's right stick.

enum Mode { CHASE, COCKPIT, FAR }

var camera: Camera3D
var player = null
var vehicle = null
var mode := Mode.CHASE
var yaw := 0.0
var pitch := -0.25
var _look_yaw := 0.0
var _look_pitch := 0.0
var _dragging := false
var _drag_index := -1
var _idle := 0.0


func _ready() -> void:
	camera = Camera3D.new()
	camera.fov = 65.0
	camera.near = 0.05
	camera.far = 3000.0
	add_child(camera)
	camera.make_current()


func cycle_mode() -> String:
	mode = ((int(mode) + 1) % 3) as Mode
	_look_yaw = 0.0
	_look_pitch = 0.0
	return ["Cameră exterioară", "Cameră șofer", "Cameră depărtată"][mode]


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT:
		_dragging = event.pressed
	elif event is InputEventMouseMotion and _dragging:
		_rotate(event.relative * 0.005)
	elif event is InputEventScreenTouch:
		if event.pressed and _drag_index == -1 and event.position.x > get_viewport().get_visible_rect().size.x * 0.3:
			_drag_index = event.index
		elif not event.pressed and event.index == _drag_index:
			_drag_index = -1
	elif event is InputEventScreenDrag and event.index == _drag_index:
		_rotate(event.relative * 0.006)


func _rotate(rel: Vector2) -> void:
	_idle = 0.0
	if vehicle != null and mode == Mode.COCKPIT:
		_look_yaw = clampf(_look_yaw - rel.x, -2.4, 2.4)
		_look_pitch = clampf(_look_pitch - rel.y, -0.8, 0.6)
	elif vehicle != null:
		_look_yaw -= rel.x
		_look_pitch = clampf(_look_pitch - rel.y, -0.6, 0.5)
	else:
		yaw -= rel.x
		pitch = clampf(pitch - rel.y, -1.2, 0.35)


func _process(delta: float) -> void:
	var stick := Vector2(Input.get_axis("look_left", "look_right"), Input.get_axis("look_up", "look_down"))
	if stick.length() > 0.1:
		_rotate(stick * delta * 2.5)
	_idle += delta
	if vehicle != null:
		_follow_vehicle(delta)
	elif player != null:
		_follow_player(delta)


func _follow_player(delta: float) -> void:
	var target: Vector3 = player.global_position + Vector3(0, 1.6, 0)
	var dist := 4.2
	var offset := Basis(Vector3.UP, yaw) * Basis(Vector3.RIGHT, pitch) * Vector3(0, 0, dist)
	camera.global_position = camera.global_position.lerp(target + offset, minf(1.0, delta * 12.0))
	camera.look_at(target, Vector3.UP)
	player.camera_yaw = yaw


func _follow_vehicle(delta: float) -> void:
	var xf: Transform3D = vehicle.global_transform
	var fwd := xf.basis.z
	if mode == Mode.COCKPIT:
		var eye: Node3D = vehicle.driver_eye()
		var b := eye.global_transform.basis * Basis(Vector3.UP, PI + _look_yaw) * Basis(Vector3.RIGHT, _look_pitch)
		camera.global_transform = Transform3D(b, eye.global_position)
		camera.fov = 70.0
		return
	if _idle > 2.5:
		_look_yaw = lerp_angle(_look_yaw, 0.0, minf(1.0, delta * 2.0))
		_look_pitch = lerpf(_look_pitch, 0.0, minf(1.0, delta * 2.0))
	var dims: Dictionary = vehicle.spec["dims"]
	var L: float = dims["length"]
	var H: float = dims["height"]
	var far := 1.7 if mode == Mode.FAR else 1.0
	var dist := (L * 0.9 + 3.2) * far
	if vehicle.trailer != null:
		dist += vehicle.trailer.spec["dims"]["length"] * 0.8
	var heading := atan2(fwd.x, fwd.z) + _look_yaw
	var back := Vector3(sin(heading), 0, cos(heading))
	var up := H * 0.7 + 1.4 * far - _look_pitch * 4.0
	var desired: Vector3 = vehicle.global_position - back * dist + Vector3(0, up, 0)
	camera.global_position = camera.global_position.lerp(desired, minf(1.0, delta * 6.0))
	camera.look_at(vehicle.global_position + Vector3(0, H * 0.6, 0) + fwd * 2.0, Vector3.UP)
	camera.fov = lerpf(camera.fov, 62.0 + clampf(vehicle.kmh() / 140.0, 0.0, 1.0) * 10.0, minf(1.0, delta * 2.0))


func snap() -> void:
	if vehicle != null:
		var xf: Transform3D = vehicle.global_transform
		camera.global_position = xf.origin - xf.basis.z * 9.0 + Vector3(0, 3.5, 0)
	elif player != null:
		camera.global_position = player.global_position + Basis(Vector3.UP, yaw) * Vector3(0, 2.6, 4.2)
