class_name PersonModel
extends Node3D
## Simple original low-poly person with jointed legs and arms: walks, idles and sits.
## Used for the player character, passengers and pedestrians. Faces -Z (Godot's forward for nodes).

const SKIN := [Color("#f1c9a5"), Color("#e0ac85"), Color("#c68d63"), Color("#8d5a3b")]
const SHIRTS := [Color("#2f5d8a"), Color("#8a2f2f"), Color("#3f7a46"), Color("#d9d4c7"), Color("#5a4a7a"), Color("#c47b2a"), Color("#222222")]
const PANTS := [Color("#2b2f3a"), Color("#3a3a3a"), Color("#4a5a6e"), Color("#5c4a36")]
const HAIR := [Color("#2a1d14"), Color("#5a3a22"), Color("#9a7a50"), Color("#cfcac0"), Color("#111111")]

var _legs: Array = []
var _arms: Array = []
var _phase := 0.0
var _body: Node3D


func build(seed_value: int, shirt := Color(0, 0, 0, 0)) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value
	var skin: Color = SKIN[rng.randi() % SKIN.size()]
	var top: Color = shirt if shirt.a > 0.0 else SHIRTS[rng.randi() % SHIRTS.size()]
	var pants: Color = PANTS[rng.randi() % PANTS.size()]
	var hair: Color = HAIR[rng.randi() % HAIR.size()]
	var h := rng.randf_range(0.95, 1.05)
	_body = Node3D.new()
	_body.scale = Vector3(h, h, h)
	add_child(_body)
	_part(_body, CapsuleMesh.new(), Vector3(0, 1.22, 0), Vector3(0.36, 0.62, 0.22), top)
	_part(_body, SphereMesh.new(), Vector3(0, 1.66, 0), Vector3(0.22, 0.25, 0.24), skin)
	_part(_body, SphereMesh.new(), Vector3(0, 1.73, 0.02), Vector3(0.23, 0.15, 0.24), hair)
	for sx in [-1.0, 1.0]:
		var hip := Node3D.new()
		hip.position = Vector3(sx * 0.1, 0.92, 0)
		_body.add_child(hip)
		_part(hip, CapsuleMesh.new(), Vector3(0, -0.45, 0), Vector3(0.14, 0.9, 0.14), pants)
		_part(hip, BoxMesh.new(), Vector3(0, -0.88, -0.05), Vector3(0.11, 0.07, 0.24), Color(0.12, 0.1, 0.09))
		_legs.append(hip)
		var shoulder := Node3D.new()
		shoulder.position = Vector3(sx * 0.24, 1.45, 0)
		_body.add_child(shoulder)
		_part(shoulder, CapsuleMesh.new(), Vector3(0, -0.3, 0), Vector3(0.1, 0.62, 0.1), top)
		_part(shoulder, SphereMesh.new(), Vector3(0, -0.62, 0), Vector3(0.08, 0.08, 0.08), skin)
		_arms.append(shoulder)


func _part(parent: Node3D, mesh: PrimitiveMesh, pos: Vector3, size: Vector3, col: Color) -> void:
	var mi := MeshInstance3D.new()
	if mesh is CapsuleMesh:
		mesh.radius = 0.5
		mesh.height = 2.0
		mi.scale = Vector3(size.x, size.y * 0.5, size.z)
	elif mesh is SphereMesh:
		mesh.radius = 0.5
		mesh.height = 1.0
		mi.scale = size
	elif mesh is BoxMesh:
		mesh.size = size
	mi.mesh = mesh
	mi.position = pos
	mi.material_override = MeshKit.color_material(col, 0.85)
	parent.add_child(mi)


## speed in m/s; legs and arms swing in opposition.
func animate(delta: float, speed: float) -> void:
	_phase += delta * (2.0 + speed * 3.2)
	var amp := clampf(speed / 1.6, 0.0, 1.0) * 0.6
	for i in 2:
		var s := sin(_phase + PI * i)
		_legs[i].rotation.x = s * amp
		_arms[i].rotation.x = -s * amp * 0.8
	_body.position.y = absf(sin(_phase)) * 0.04 * clampf(speed, 0.0, 1.0)


func sit() -> void:
	for leg in _legs:
		leg.rotation.x = PI / 2
	for arm in _arms:
		arm.rotation.x = 0.5
	_body.position = Vector3(0, -0.88, 0.08)
