class_name Passenger
extends Node3D
## A passenger waiting at a stop: idles, walks to the minibus door to board, or walks away after
## getting off. Movement is scripted on the ground (no physics), which keeps many passengers cheap.

signal arrived

var model: PersonModel
var has_bag := false
var _target := Vector3.ZERO
var _walking := false
var _bag: MeshInstance3D


func build(seed_value: int, bag: bool) -> void:
	model = PersonModel.new()
	model.build(seed_value)
	add_child(model)
	has_bag = bag
	if bag:
		_bag = MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.4, 0.55, 0.22)
		_bag.mesh = bm
		_bag.material_override = MeshKit.color_material(Color(0.15, 0.17, 0.22).lerp(Color(0.5, 0.15, 0.1), float(seed_value % 3) / 2.0), 0.7)
		_bag.position = Vector3(0.38, 0.3, 0)
		add_child(_bag)


func walk_to(p: Vector3) -> void:
	_target = Vector3(p.x, 0.0, p.z)
	_walking = true


func is_walking() -> bool:
	return _walking


func _process(delta: float) -> void:
	if not _walking:
		model.animate(delta, 0.0)
		return
	var to := _target - global_position
	to.y = 0.0
	var d := to.length()
	var spd := 1.35
	if d < 0.15:
		_walking = false
		arrived.emit()
		return
	global_position += to / d * minf(spd * delta, d)
	model.rotation.y = lerp_angle(model.rotation.y, atan2(-to.x, -to.z), minf(1.0, delta * 8.0))
	model.animate(delta, spd)
