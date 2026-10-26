class_name Trailer
extends VehicleBody3D
## Towable trailer: its own wheels and suspension, a jockey wheel when parked, and a ball-joint
## (PinJoint3D) to the towing vehicle's hitch. Braked trailers brake with the car; unbraked ones
## only follow, so they lengthen the stopping distance. Compatibility follows the towing
## vehicle's legal limits (braked / unbraked towing capacity).

signal message(text: String, kind: String)

var spec: Dictionary = {}
var uid := ""
var cargo_kg := 0.0
var coupled_to = null            # Vehicle
var _joint: PinJoint3D
var _wheels: Array = []
var _jockey: VehicleWheel3D
var _coupler_z := 0.0
var _coupler_y := 0.45
var _cargo_nodes: Array = []


func setup(p_spec: Dictionary, p_uid: String, color: Color) -> void:
	spec = p_spec
	uid = p_uid
	var d: Dictionary = spec["dims"]
	var L: float = d["length"]
	var body_len: float = d["body_length"]
	var drawbar: float = d["drawbar"]
	var W: float = d["width"]
	var r: float = d["wheel_radius"]
	mass = float(spec["mass"])
	can_sleep = false
	# Godot's default linear damping (0.1/s) acts like a hidden brake; drag and rolling resistance are modelled explicitly
	linear_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	linear_damp = 0.0
	# trailer faces +Z like vehicles: the coupler is at the front (+Z)
	_coupler_z = L * 0.5
	var body_center_z := _coupler_z - drawbar - body_len * 0.5
	var axle_z := body_center_z - (0.05 if int(d["axles"]) == 1 else 0.0)
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	center_of_mass = Vector3(0, r + 0.25, axle_z + 0.15)

	var deck_y := r + 0.22
	_coupler_y = deck_y - 0.02
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(W, 0.3, body_len)
	cs.shape = box
	cs.position = Vector3(0, deck_y, body_center_z)
	add_child(cs)

	var st := MeshKit.new_st()
	var frame := Color(0.18, 0.19, 0.2)
	var main: Color = color
	MeshKit.box_at(st, Vector3(0, deck_y, body_center_z), Vector3(W, 0.12, body_len), main.darkened(0.2))
	if spec["body"]["style"] == "box_trailer":
		var h: float = d["height"] - deck_y
		for sx in [-1.0, 1.0]:
			MeshKit.box_at(st, Vector3(sx * W * 0.5, deck_y + h * 0.5, body_center_z), Vector3(0.04, h, body_len), main)
		MeshKit.box_at(st, Vector3(0, deck_y + h * 0.5, body_center_z - body_len * 0.5), Vector3(W, h, 0.04), main)
		MeshKit.box_at(st, Vector3(0, deck_y + h * 0.5, body_center_z + body_len * 0.5), Vector3(W, h, 0.04), main)
		MeshKit.box_at(st, Vector3(0, deck_y + h + 0.03, body_center_z), Vector3(W + 0.06, 0.06, body_len + 0.06), Color(0.25, 0.27, 0.3))
		var cs2 := CollisionShape3D.new()
		var b2 := BoxShape3D.new()
		b2.size = Vector3(W, h, body_len)
		cs2.shape = b2
		cs2.position = Vector3(0, deck_y + h * 0.5, body_center_z)
		add_child(cs2)
	else:
		for sx in [-1.0, 1.0]:
			MeshKit.box_at(st, Vector3(sx * (W * 0.5 - 0.15), deck_y + 0.08, body_center_z), Vector3(0.3, 0.06, body_len), Color(0.55, 0.56, 0.58))
		MeshKit.box_at(st, Vector3(0, deck_y - 0.1, body_center_z - body_len * 0.5 - 0.6), Vector3(W * 0.8, 0.05, 1.2), Color(0.55, 0.56, 0.58))
	# mudguards
	for sx in [-1.0, 1.0]:
		MeshKit.box_at(st, Vector3(sx * (float(d["track"]) * 0.5), r * 2.0 + 0.05, axle_z), Vector3(float(d["wheel_width"]) + 0.08, 0.04, r * 2.4 * int(d["axles"])), frame)
	# A-frame drawbar and coupler head
	var front_body := body_center_z + body_len * 0.5
	for sx in [-1.0, 1.0]:
		var a := Vector3(sx * W * 0.38, deck_y - 0.05, front_body)
		var b := Vector3(0, deck_y - 0.05, _coupler_z - 0.15)
		var mid := (a + b) * 0.5
		var len := a.distance_to(b)
		MeshKit.box(st, Transform3D(Basis(Vector3.UP, atan2(b.x - a.x, b.z - a.z)), mid), Vector3(0.08, 0.08, len), frame)
	MeshKit.box_at(st, Vector3(0, deck_y - 0.02, _coupler_z - 0.08), Vector3(0.12, 0.12, 0.3), Color(0.1, 0.1, 0.1))
	# tail lights
	var tail := MeshKit.emissive_material(Color(1.0, 0.1, 0.05), 0.6)
	var st_t := MeshKit.new_st()
	for sx in [-1.0, 1.0]:
		MeshKit.box_at(st_t, Vector3(sx * (W * 0.5 - 0.15), deck_y + 0.05, body_center_z - body_len * 0.5 - 0.03), Vector3(0.2, 0.1, 0.05), Color.WHITE)
	var mesh := ArrayMesh.new()
	MeshKit.commit(st, mesh, MeshKit.vc_material(0.7))
	MeshKit.commit(st_t, mesh, tail)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	set_meta("tail_mat", tail)
	var lbl := Label3D.new()
	lbl.text = "max %d kg" % int(float(spec["mass"]) + float(spec["max_cargo"]))
	lbl.font_size = 40
	lbl.pixel_size = 0.004
	lbl.position = Vector3(W * 0.5 + 0.01, deck_y + 0.15, body_center_z)
	lbl.rotation.y = PI / 2
	add_child(lbl)

	var axles: int = d["axles"]
	var tw: float = float(d["track"]) * 0.5
	for k in axles:
		var z := axle_z + (0.0 if axles == 1 else (k - 0.5) * 0.9)
		for sx in [-1.0, 1.0]:
			var w := _wheel(Vector3(sx * tw, r + 0.13, z), r, d["wheel_width"])
			_wheels.append(w)
	_jockey = _wheel(Vector3(0, 0.30, _coupler_z - 0.45), 0.1, 0.06)
	_jockey.wheel_rest_length = 0.3


func _wheel(pos: Vector3, r: float, width: float) -> VehicleWheel3D:
	var w := VehicleWheel3D.new()
	w.position = pos
	w.wheel_radius = r
	w.wheel_rest_length = 0.2
	w.suspension_travel = 0.2
	w.suspension_stiffness = 45.0
	w.suspension_max_force = (float(spec["mass"]) + float(spec["max_cargo"])) * 9.81 * 2.5
	w.damping_compression = 0.6 * sqrt(45.0)
	w.damping_relaxation = 0.8 * sqrt(45.0)
	w.wheel_friction_slip = 1.2
	add_child(w)
	var tire := MeshInstance3D.new()
	var tm := CylinderMesh.new()
	tm.top_radius = r
	tm.bottom_radius = r
	tm.height = width
	tm.radial_segments = 18
	tire.mesh = tm
	tire.rotation.z = PI / 2
	tire.material_override = MeshKit.color_material(Color(0.07, 0.07, 0.07), 0.95)
	w.add_child(tire)
	return w


func total_mass() -> float:
	return float(spec["mass"]) + cargo_kg


func set_cargo(kg: float) -> void:
	cargo_kg = clampf(kg, 0.0, float(spec["max_cargo"]))
	mass = total_mass()
	for n in _cargo_nodes:
		n.queue_free()
	_cargo_nodes.clear()
	if cargo_kg <= 0.0:
		return
	var d: Dictionary = spec["dims"]
	var r: float = d["wheel_radius"]
	var count := clampi(int(cargo_kg / 60.0), 1, 8)
	for i in count:
		var b := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.5, 0.35, 0.42)
		b.mesh = bm
		b.material_override = MeshKit.color_material(Color(0.55, 0.4, 0.25).lerp(Color(0.2, 0.25, 0.35), float(i % 3) / 2.0), 0.8)
		b.position = Vector3(-0.3 + (i % 2) * 0.6, r + 0.48 + (i / 4) * 0.36, _coupler_z - float(d["drawbar"]) - 0.4 - ((i / 2) % 2) * 0.55)
		add_child(b)
		_cargo_nodes.append(b)


func coupler_global() -> Vector3:
	return to_global(Vector3(0, _coupler_y, _coupler_z))


## Empty string when the vehicle may tow this trailer, otherwise the reason (in Romanian).
func check_compatibility(v) -> String:
	if not v.has_towbar():
		return "%s nu are cârlig de remorcare" % v.display_name
	var tow: Dictionary = v.spec["tow"]
	var limit: float = float(tow["braked"]) if bool(spec["braked"]) else float(tow["unbraked"])
	if total_mass() > limit:
		return "Prea grea: %s poate tracta maximum %d kg %s (remorca are %d kg)" % [v.display_name, int(limit), "frânată" if bool(spec["braked"]) else "nefrânată", int(total_mass())]
	return ""


func couple(v) -> String:
	if coupled_to != null:
		return "Remorca este deja cuplată"
	var reason := check_compatibility(v)
	if reason != "":
		return reason
	var hitch: Vector3 = v.hitch_global()
	var offset := hitch - coupler_global()
	offset.y = 0.0
	if offset.length() > 1.0:
		return "Apropie cârligul de cupla remorcii (încă %.1f m)" % offset.length()
	global_position += offset
	_joint = PinJoint3D.new()
	_joint.name = "Hitch_" + uid
	get_parent().add_child(_joint)
	_joint.global_position = hitch
	_joint.node_a = _joint.get_path_to(v)
	_joint.node_b = _joint.get_path_to(self)
	add_collision_exception_with(v)
	v.add_collision_exception_with(self)
	coupled_to = v
	v.trailer = self
	_jockey.wheel_rest_length = 0.0
	_jockey.wheel_radius = 0.01
	return ""


func uncouple() -> void:
	if coupled_to == null:
		return
	if is_instance_valid(_joint):
		_joint.queue_free()
	remove_collision_exception_with(coupled_to)
	coupled_to.remove_collision_exception_with(self)
	coupled_to.trailer = null
	coupled_to = null
	_jockey.wheel_radius = 0.1
	_jockey.wheel_rest_length = 0.3


func _physics_process(_delta: float) -> void:
	var tail: StandardMaterial3D = get_meta("tail_mat")
	if coupled_to != null and is_instance_valid(coupled_to):
		var b: float = coupled_to._brake_input() if bool(spec["braked"]) else 0.0
		for w in _wheels:
			w.brake = b * total_mass() * 0.02 * 0.9
		tail.emission_energy_multiplier = 5.0 if coupled_to._brake_input() > 0.1 else (1.5 if coupled_to.lights_on else 0.4)
	else:
		for w in _wheels:
			w.brake = total_mass() * 0.03
		tail.emission_energy_multiplier = 0.2


func place(pos: Vector3, yaw: float) -> void:
	global_transform = Transform3D(Basis(Vector3.UP, yaw), pos + Vector3(0, 0.2, 0))
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
