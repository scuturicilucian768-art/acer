class_name Player
extends CharacterBody3D
## On-foot character: walks/runs relative to the camera, and gets into and out of vehicles.

signal entered(vehicle)
signal exited(vehicle)

const WALK := 1.6
const RUN := 4.8
const ENTER_RANGE := 2.6

var vehicle = null              # Vehicle the player is driving, or null on foot
var camera_yaw := 0.0
var model: PersonModel
var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)


func _ready() -> void:
	var cs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.3
	cap.height = 1.8
	cs.shape = cap
	cs.position.y = 0.9
	add_child(cs)
	model = PersonModel.new()
	model.build(1, Color("#2a4d7a"))
	add_child(model)


func _physics_process(delta: float) -> void:
	if vehicle != null:
		global_position = vehicle.global_position
		return
	var input := Vector2(Input.get_axis("steer_left", "steer_right"), Input.get_axis("accelerate", "brake"))
	if input.length() > 1.0:
		input = input.normalized()
	var dir := Basis(Vector3.UP, camera_yaw) * Vector3(input.x, 0, input.y)
	var spd := RUN if Input.is_action_pressed("run") else WALK
	velocity.x = dir.x * spd
	velocity.z = dir.z * spd
	if not is_on_floor():
		velocity.y -= _gravity * delta
	else:
		velocity.y = -0.5
	move_and_slide()
	var flat := Vector2(velocity.x, velocity.z)
	if flat.length() > 0.2:
		var target := atan2(-flat.x, -flat.y)
		model.rotation.y = lerp_angle(model.rotation.y, target, minf(1.0, delta * 10.0))
	model.animate(delta, flat.length())


## Nearest vehicle whose driver door is within reach.
func nearest_vehicle(vehicles: Array):
	var best = null
	var bd := ENTER_RANGE
	for v in vehicles:
		if not is_instance_valid(v):
			continue
		var d := global_position.distance_to(v.entry_point())
		if d < bd:
			bd = d
			best = v
	return best


func enter(v) -> void:
	vehicle = v
	visible = false
	for c in get_children():
		if c is CollisionShape3D:
			c.disabled = true
	v.driven = true
	_door_cycle(v, 1.1)
	entered.emit(v)


func exit_vehicle() -> bool:
	if vehicle == null:
		return false
	if vehicle.kmh() > 4.0:
		return false
	var v = vehicle
	v.driven = false
	v.throttle = 0.0
	v.set_parking_brake(true)
	_door_cycle(v, 1.3)
	vehicle = null
	global_position = v.entry_point()
	velocity = Vector3.ZERO
	visible = true
	for c in get_children():
		if c is CollisionShape3D:
			c.disabled = false
	model.rotation.y = v.global_rotation.y + PI / 2
	exited.emit(v)
	return true


## Opens the driver's door, then closes it again after a short delay.
func _door_cycle(v, delay: float) -> void:
	v.set_door("DoorDriver", true)
	await get_tree().create_timer(delay).timeout
	if is_instance_valid(v):
		v.set_door("DoorDriver", false)
