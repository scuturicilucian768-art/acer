class_name VehicleModel
extends RefCounted
## Builds original low-poly vehicle models in code from a side profile.
## Vehicles face +Z (Godot's VehicleBody3D forward). Profiles are written as (s, y) with the
## front at negative s, so z = -s. The driver sits on the left, which is +X when facing +Z.
## Bodies are hollow shells with real door openings, so interiors and passengers are visible.

const STYLES := {
	"van": {
		"ref": [6.95, 2.7],
		"outline": [[-3.475, 0.42], [-3.475, 1.0], [-3.42, 1.12], [-2.45, 1.40], [-1.72, 2.42], [-1.58, 2.68], [3.44, 2.68], [3.475, 2.6], [3.475, 0.42]],
		"glass_edges": [3], "belt": 1.42, "win_top": 2.32, "glass_s": [-2.38, 3.3],
		"pillars": [[-1.42, -1.30], [-0.02, 0.08], [1.25, 1.35], [2.45, 2.55]],
		"arches": [-2.475, 1.855], "arch_r": 0.47,
		"doors": [
			{"name": "DoorDriver", "side": 1, "s": [-2.40, -1.44], "y": [0.5, 2.32], "type": "hinge"},
			{"name": "DoorSide", "side": -1, "s": [-1.28, -0.04], "y": [0.45, 2.32], "type": "slide"},
		],
		"head": [0.72, 0.98, 0.42, 0.17], "tail": [0.92, 0.9, 0.12, 0.55],
		"rear_windows": [1.5, 2.25],
		"floor": 0.58, "dash": [-2.45, -1.95, 1.1, 1.45],
		"driver": [0.52, -1.15], "eye": [0.52, 1.82, -1.2], "wheel": [0.52, 1.45, -1.78, 0.8],
		"seats": [[-0.25, -1.15], [-0.70, -1.15],
			[0.25, 0.35], [0.70, 0.35], [-0.70, 0.35], [0.25, 1.05], [0.70, 1.05], [-0.70, 1.05],
			[0.25, 1.75], [0.70, 1.75], [-0.70, 1.75], [0.25, 2.45], [0.70, 2.45], [-0.70, 2.45]],
		"seat_h": 0.47, "luggage_s": [2.95, 3.38], "mirror": [-2.35, 1.85],
	},
	"sedan": {
		"ref": [4.47, 1.415],
		"outline": [[-2.235, 0.32], [-2.25, 0.60], [-2.18, 0.72], [-1.6, 0.82], [-0.78, 0.88], [0.02, 1.38], [0.95, 1.41], [1.62, 1.02], [2.18, 0.99], [2.235, 0.75], [2.20, 0.34]],
		"glass_edges": [4, 6], "belt": 0.92, "win_top": 1.33, "glass_s": [-0.72, 1.15],
		"pillars": [[0.33, 0.43]], "arches": [-1.435, 1.29], "arch_r": 0.38,
		"doors": [{"name": "DoorDriver", "side": 1, "s": [-0.76, 0.36], "y": [0.33, 1.33], "type": "hinge"}],
		"head": [0.58, 0.66, 0.42, 0.13], "tail": [0.6, 0.84, 0.45, 0.14],
		"floor": 0.30, "dash": [-0.78, -0.45, 0.72, 0.95],
		"driver": [0.38, 0.2], "eye": [0.38, 1.13, 0.25], "wheel": [0.38, 0.88, -0.22, 1.15],
		"seats": [[-0.38, 0.2], [-0.45, 1.0], [0.0, 1.0], [0.45, 1.0]],
		"seat_h": 0.27, "luggage_s": [1.6, 2.1], "mirror": [-0.6, 0.98],
	},
	"wagon": {
		"ref": [4.69, 1.47],
		"outline": [[-2.345, 0.30], [-2.36, 0.60], [-2.28, 0.72], [-1.40, 0.86], [-0.72, 0.92], [0.05, 1.44], [1.95, 1.46], [2.30, 1.30], [2.345, 0.70], [2.30, 0.33]],
		"glass_edges": [4, 6], "belt": 0.95, "win_top": 1.38, "glass_s": [-0.66, 2.15],
		"pillars": [[0.40, 0.50], [1.45, 1.58]], "arches": [-1.445, 1.245], "arch_r": 0.38,
		"doors": [{"name": "DoorDriver", "side": 1, "s": [-0.70, 0.42], "y": [0.32, 1.38], "type": "hinge"}],
		"head": [0.6, 0.68, 0.45, 0.13], "tail": [0.66, 0.95, 0.2, 0.3],
		"floor": 0.30, "dash": [-0.72, -0.40, 0.74, 0.97],
		"driver": [0.4, 0.25], "eye": [0.4, 1.16, 0.3], "wheel": [0.4, 0.9, -0.17, 1.15],
		"seats": [[-0.4, 0.25], [-0.45, 1.1], [0.0, 1.1], [0.45, 1.1]],
		"seat_h": 0.28, "luggage_s": [1.65, 2.25], "mirror": [-0.55, 1.0],
	},
	"suv": {
		"ref": [4.8, 1.71],
		"outline": [[-2.4, 0.42], [-2.42, 0.75], [-2.32, 0.92], [-1.3, 1.06], [-0.65, 1.12], [0.12, 1.66], [1.95, 1.70], [2.35, 1.52], [2.4, 0.90], [2.36, 0.45]],
		"glass_edges": [4, 6], "belt": 1.15, "win_top": 1.6, "glass_s": [-0.58, 2.1],
		"pillars": [[0.45, 0.55], [1.5, 1.62]], "arches": [-1.48, 1.41], "arch_r": 0.45,
		"doors": [{"name": "DoorDriver", "side": 1, "s": [-0.62, 0.47], "y": [0.45, 1.6], "type": "hinge"}],
		"head": [0.66, 0.88, 0.45, 0.15], "tail": [0.72, 1.15, 0.2, 0.3],
		"floor": 0.45, "dash": [-0.65, -0.32, 0.95, 1.2],
		"driver": [0.42, 0.3], "eye": [0.42, 1.4, 0.35], "wheel": [0.42, 1.1, -0.12, 1.1],
		"seats": [[-0.42, 0.3], [-0.48, 1.2], [0.0, 1.2], [0.48, 1.2]],
		"seat_h": 0.32, "luggage_s": [1.7, 2.3], "mirror": [-0.5, 1.25],
	},
	"hatch": {
		"ref": [4.0, 1.45],
		"outline": [[-2.0, 0.32], [-2.02, 0.62], [-1.95, 0.74], [-1.1, 0.86], [-0.6, 0.92], [0.15, 1.42], [1.35, 1.44], [1.92, 1.10], [2.0, 0.60], [1.95, 0.34]],
		"glass_edges": [4, 6], "belt": 0.95, "win_top": 1.36, "glass_s": [-0.55, 1.5],
		"pillars": [[0.45, 0.55]], "arches": [-1.2, 1.3], "arch_r": 0.37,
		"doors": [], "head": [0.58, 0.7, 0.36, 0.12], "tail": [0.66, 0.92, 0.18, 0.25],
		"floor": 0.3, "dash": [-0.6, -0.3, 0.72, 0.95], "driver": [0.38, 0.2], "eye": [0.38, 1.12, 0.25],
		"wheel": [0.38, 0.88, -0.15, 1.15], "seats": [], "seat_h": 0.27, "luggage_s": [1.4, 1.9], "mirror": [-0.45, 0.98],
	},
}


static func style_def(style: String) -> Dictionary:
	return STYLES.get(style, STYLES["sedan"])


## Builds a vehicle model. `detailed` adds interior, doors, markers and seats (player vehicles).
static func build(spec: Dictionary, paint_color: Color, detailed := true, plate := "") -> Node3D:
	var dims: Dictionary = spec["dims"]
	var d := style_def(spec["body"]["style"])
	var L: float = dims["length"]
	var H: float = dims["height"]
	var W: float = dims["width"]
	var ks: float = L / d["ref"][0]
	var ky: float = H / d["ref"][1]
	var S := func(v: float) -> float: return v * ks
	var Y := func(v: float) -> float: return v * ky
	var root := Node3D.new()
	root.name = "Model"

	var paint := MeshKit.color_material(paint_color, 0.32, 0.45)
	paint.clearcoat_enabled = true
	paint.clearcoat = 0.6
	var glass := MeshKit.glass_material()
	var trim := MeshKit.vc_material(0.75)
	var head_mat := MeshKit.emissive_material(Color(1.0, 0.97, 0.88), 0.3)
	var tail_mat := MeshKit.emissive_material(Color(1.0, 0.08, 0.04), 0.4)
	var rev_mat := MeshKit.emissive_material(Color(1, 1, 1), 0.0)
	root.set_meta("tail_mat", tail_mat)
	root.set_meta("head_mat", head_mat)
	root.set_meta("rev_mat", rev_mat)

	var outline := PackedVector2Array()
	for p in d["outline"]:
		outline.append(Vector2(S.call(p[0]), Y.call(p[1])))
	var belt: float = Y.call(d["belt"])
	var win_top: float = Y.call(d["win_top"])
	var BIG := 100.0

	var st_paint := MeshKit.new_st()
	var st_glass := MeshKit.new_st()
	var st_trim := MeshKit.new_st()
	var st_head := MeshKit.new_st()
	var st_tail := MeshKit.new_st()
	var st_rev := MeshKit.new_st()
	var white := Color.WHITE

	# ---- side panels with wheel arches, window band, pillars and door cut-outs
	var lower := MeshKit.clip_in([outline], MeshKit.rect_poly(-BIG, BIG, -1.0, belt))
	for a in d["arches"]:
		lower = MeshKit.clip_out(lower, MeshKit.circle_poly(Vector2(S.call(a), dims["wheel_radius"]), d["arch_r"] * ks, 16))
	var upper := MeshKit.clip_in([outline], MeshKit.rect_poly(-BIG, BIG, belt, BIG))
	var roof_band := MeshKit.clip_in(upper, MeshKit.rect_poly(-BIG, BIG, win_top, BIG))
	var band := MeshKit.clip_in(upper, MeshKit.rect_poly(-BIG, BIG, belt, win_top))
	var gs: Array = d["glass_s"]
	var glass_rect := MeshKit.rect_poly(S.call(gs[0]), S.call(gs[1]), belt, win_top)
	var band_glass := MeshKit.clip_in(band, glass_rect)
	var band_paint := MeshKit.clip_out(band, glass_rect)
	for pl in d["pillars"]:
		var pr := MeshKit.rect_poly(S.call(pl[0]), S.call(pl[1]), belt, win_top)
		band_paint += MeshKit.clip_in(band_glass, pr)
		band_glass = MeshKit.clip_out(band_glass, pr)

	var doors_out: Array = []
	for side in [-1, 1]:
		var x: float = side * W * 0.5
		var body_lower: Array = lower
		var body_glass: Array = band_glass
		var body_paint: Array = band_paint
		for door in d["doors"]:
			if door["side"] != side or not detailed:
				continue
			var dr := MeshKit.rect_poly(S.call(door["s"][0]), S.call(door["s"][1]), Y.call(door["y"][0]) - 0.05, Y.call(door["y"][1]))
			doors_out.append({"def": door, "x": x, "lower": MeshKit.clip_in(body_lower, dr), "glass": MeshKit.clip_in(body_glass, dr), "paint": MeshKit.clip_in(body_paint, dr)})
			body_lower = MeshKit.clip_out(body_lower, dr)
			body_glass = MeshKit.clip_out(body_glass, dr)
			body_paint = MeshKit.clip_out(body_paint, dr)
		for p in body_lower + body_paint + roof_band:
			MeshKit.side_poly(st_paint, p, x, white)
		for p in body_glass:
			MeshKit.side_poly(st_glass, p, x * 1.002, white)

	# ---- perimeter strips (hood, windscreen, roof, rear); the underside stays open for the wheels
	for i in range(outline.size() - 1):
		var a := outline[i]
		var b := outline[i + 1]
		if a.y < 0.5 and b.y < 0.5:
			continue
		var st := st_glass if i in d["glass_edges"] else st_paint
		MeshKit.strip(st, a, b, -W * 0.5, W * 0.5, white)

	var front_s: float = outline[0].x
	var rear_s: float = outline[-1].x
	var dark := Color(0.08, 0.08, 0.09)
	var plastic := Color(0.16, 0.16, 0.17)
	# bumpers, grille, number plates
	MeshKit.box_at(st_trim, Vector3(0, Y.call(0.5), -front_s + 0.04), Vector3(W * 0.98, Y.call(0.24), 0.16), plastic)
	MeshKit.box_at(st_trim, Vector3(0, Y.call(0.5), -rear_s - 0.04), Vector3(W * 0.98, Y.call(0.24), 0.16), plastic)
	var grille_y: float = Y.call(d["head"][1]) - 0.02
	MeshKit.box_at(st_trim, Vector3(0, grille_y, -front_s + 0.015), Vector3(W * 0.42, Y.call(0.14), 0.04), dark)
	if plate != "":
		_plate(root, Vector3(0, Y.call(0.5), -front_s + 0.13), 0.0, plate)
		_plate(root, Vector3(0, Y.call(0.62) if d["ref"][0] < 6 else Y.call(0.75), -rear_s - 0.13), PI, plate)
	# lights
	var hd: Array = d["head"]
	for sx in [-1.0, 1.0]:
		MeshKit.box_at(st_head, Vector3(sx * hd[0], Y.call(hd[1]), -front_s + 0.01), Vector3(hd[2], Y.call(hd[3]), 0.06), white)
	var tl: Array = d["tail"]
	for sx in [-1.0, 1.0]:
		MeshKit.box_at(st_tail, Vector3(sx * tl[0], Y.call(tl[1]), -rear_s - 0.01), Vector3(tl[2], Y.call(tl[3]), 0.06), white)
		MeshKit.box_at(st_rev, Vector3(sx * tl[0] * 0.75, Y.call(tl[1]) - Y.call(tl[3]) * 0.5 - 0.06, -rear_s - 0.01), Vector3(0.1, 0.06, 0.05), white)
	# van rear door windows (overlay)
	if d.has("rear_windows"):
		var rw: Array = d["rear_windows"]
		for sx in [-1.0, 1.0]:
			MeshKit.box_at(st_glass, Vector3(sx * W * 0.24, Y.call((rw[0] + rw[1]) * 0.5), -rear_s - 0.012), Vector3(W * 0.4, Y.call(rw[1] - rw[0]), 0.01), white)
	# mirrors
	var mr: Array = d["mirror"]
	for sx in [-1.0, 1.0]:
		MeshKit.box_at(st_trim, Vector3(sx * (W * 0.5 + 0.12), Y.call(mr[1]), -S.call(mr[0])), Vector3(0.08, 0.2 if L > 6 else 0.12, 0.2), plastic)
		MeshKit.box_at(st_trim, Vector3(sx * (W * 0.5 + 0.06), Y.call(mr[1]) - 0.05, -S.call(mr[0])), Vector3(0.14, 0.03, 0.04), plastic)

	if detailed:
		_interior(root, d, dims, S, Y, st_trim)

	var mesh := ArrayMesh.new()
	MeshKit.commit(st_paint, mesh, paint)
	MeshKit.commit(st_glass, mesh, glass)
	MeshKit.commit(st_trim, mesh, trim)
	MeshKit.commit(st_head, mesh, head_mat)
	MeshKit.commit(st_tail, mesh, tail_mat)
	MeshKit.commit(st_rev, mesh, rev_mat)
	var body := MeshInstance3D.new()
	body.name = "Body"
	body.mesh = mesh
	root.add_child(body)

	for od in doors_out:
		_door(root, od, paint, glass, Y)
	if detailed:
		var fs: float = front_s
		_marker(root, "Hitch", Vector3(0, 0.45, -rear_s - 0.3))
		var drv: Array = d["driver"]
		_marker(root, "DriverEye", Vector3(d["eye"][0], Y.call(d["eye"][1]), -S.call(d["eye"][2])))
		_marker(root, "DriverExit", Vector3(W * 0.5 + 0.8, 0.1, -S.call(drv[1]) + 0.3))
		for door in d["doors"]:
			if door["name"] == "DoorSide":
				_marker(root, "SideDoorOut", Vector3(-W * 0.5 - 0.9, 0.1, -S.call((door["s"][0] + door["s"][1]) * 0.5)))
				_marker(root, "SideDoorIn", Vector3(-W * 0.5 + 0.3, Y.call(d["floor"]), -S.call((door["s"][0] + door["s"][1]) * 0.5)))
		_marker(root, "Front", Vector3(0, 0.5, -fs))
	return root


static func _marker(root: Node3D, n: String, p: Vector3) -> void:
	var m := Marker3D.new()
	m.name = n
	m.position = p
	root.add_child(m)


static func _plate(root: Node3D, p: Vector3, yaw: float, text: String) -> void:
	var plate := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(0.52, 0.11, 0.01)
	plate.mesh = bm
	plate.material_override = MeshKit.color_material(Color(0.96, 0.96, 0.94), 0.5)
	plate.position = p
	plate.rotation.y = yaw
	root.add_child(plate)
	var eu := MeshInstance3D.new()
	var em := BoxMesh.new()
	em.size = Vector3(0.05, 0.11, 0.012)
	eu.mesh = em
	eu.material_override = MeshKit.color_material(Color(0.0, 0.2, 0.6))
	eu.position = Vector3(-0.235, 0, 0)
	plate.add_child(eu)
	var l := Label3D.new()
	l.text = text
	l.font_size = 40
	l.pixel_size = 0.0022
	l.modulate = Color(0.05, 0.05, 0.05)
	l.position = Vector3(0.02, 0, 0.008)
	plate.add_child(l)


## Door: separate pivot so it can swing (hinge) or slide; its mesh is built in vehicle coordinates.
static func _door(root: Node3D, od: Dictionary, paint: Material, glass: Material, Y: Callable) -> void:
	var def: Dictionary = od["def"]
	var x: float = od["x"]
	var st_p := MeshKit.new_st()
	var st_g := MeshKit.new_st()
	var out := 1.003
	for p in od["lower"] + od["paint"]:
		MeshKit.side_poly(st_p, p, x * out, Color.WHITE)
	for p in od["glass"]:
		MeshKit.side_poly(st_g, p, x * out, Color.WHITE)
	var mesh := ArrayMesh.new()
	MeshKit.commit(st_p, mesh, paint)
	MeshKit.commit(st_g, mesh, glass)
	var s_hinge: float = 0.0
	var all: Array = od["lower"] + od["paint"] + od["glass"]
	var smin := INF
	var smax := -INF
	for p in all:
		for v in p:
			smin = minf(smin, v.x)
			smax = maxf(smax, v.x)
	s_hinge = smin
	var pivot := Node3D.new()
	pivot.name = def["name"]
	pivot.position = Vector3(x, 0, -s_hinge)
	pivot.set_meta("type", def["type"])
	pivot.set_meta("side", def["side"])
	pivot.set_meta("length", smax - smin)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = -pivot.position
	pivot.add_child(mi)
	root.add_child(pivot)


static func _interior(root: Node3D, d: Dictionary, dims: Dictionary, S: Callable, Y: Callable, st: SurfaceTool) -> void:
	var W: float = dims["width"]
	var floor_y: float = Y.call(d["floor"])
	var fabric := Color(0.18, 0.2, 0.24)
	var dash_c := Color(0.12, 0.12, 0.13)
	var outline: Array = d["outline"]
	var fs: float = S.call(outline[0][0])
	var rs: float = S.call(outline[-1][0])
	# floor and inner lining
	MeshKit.box_at(st, Vector3(0, floor_y - 0.03, -(fs + rs) * 0.5), Vector3(W - 0.08, 0.06, (rs - fs) - 0.6), Color(0.22, 0.22, 0.22))
	var da: Array = d["dash"]
	MeshKit.box_at(st, Vector3(0, (Y.call(da[2]) + Y.call(da[3])) * 0.5, -S.call((da[0] + da[1]) * 0.5)),
		Vector3(W - 0.12, Y.call(da[3]) - Y.call(da[2]), S.call(da[1] - da[0])), dash_c)
	var drv: Array = d["driver"]
	_seat(st, Vector3(drv[0], floor_y, -S.call(drv[1])), d["seat_h"], Color(0.12, 0.12, 0.13))
	var seats_node := Node3D.new()
	seats_node.name = "Seats"
	root.add_child(seats_node)
	for i in d["seats"].size():
		var sp: Array = d["seats"][i]
		var p := Vector3(sp[0], floor_y, -S.call(sp[1]))
		_seat(st, p, d["seat_h"], fabric)
		var m := Marker3D.new()
		m.name = "Seat%d" % i
		m.position = p + Vector3(0, d["seat_h"], 0)
		seats_node.add_child(m)
	var lug := Node3D.new()
	lug.name = "Luggage"
	var ls: Array = d["luggage_s"]
	lug.position = Vector3(0, floor_y, -S.call((ls[0] + ls[1]) * 0.5))
	lug.set_meta("depth", S.call(ls[1] - ls[0]))
	root.add_child(lug)
	# steering wheel (pivot rotates around its column) and gauges
	var wd: Array = d["wheel"]
	var col := Node3D.new()
	col.name = "SteeringColumn"
	col.position = Vector3(wd[0], Y.call(wd[1]), -S.call(wd[2]))
	col.rotation.x = -float(wd[3])
	root.add_child(col)
	var sw := Node3D.new()
	sw.name = "SteeringWheel"
	col.add_child(sw)
	var torus := TorusMesh.new()
	torus.inner_radius = 0.16
	torus.outer_radius = 0.195
	torus.rings = 24
	torus.ring_segments = 8
	var ring := MeshInstance3D.new()
	ring.mesh = torus
	ring.material_override = MeshKit.color_material(Color(0.07, 0.07, 0.07), 0.6)
	sw.add_child(ring)
	var hub := MeshInstance3D.new()
	var hb := BoxMesh.new()
	hb.size = Vector3(0.34, 0.04, 0.08)
	hub.mesh = hb
	hub.material_override = ring.material_override
	sw.add_child(hub)
	var gauge_z: float = -S.call(da[0] + (da[1] - da[0]) * 0.6) - 0.02
	var gauge_y: float = Y.call(da[3]) - 0.07
	for g in [["NeedleSpeed", -0.1], ["NeedleRpm", 0.1]]:
		var face := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.065
		cm.bottom_radius = 0.065
		cm.height = 0.01
		cm.radial_segments = 20
		face.mesh = cm
		face.material_override = MeshKit.emissive_material(Color(0.85, 0.9, 1.0), 0.15)
		face.position = Vector3(wd[0] + g[1], gauge_y, gauge_z)
		face.rotation.x = PI / 2
		root.add_child(face)
		var needle := Node3D.new()
		needle.name = g[0]
		needle.position = Vector3(wd[0] + g[1], gauge_y, gauge_z - 0.008)
		root.add_child(needle)
		var nm := MeshInstance3D.new()
		var nb := BoxMesh.new()
		nb.size = Vector3(0.006, 0.055, 0.004)
		nm.mesh = nb
		nm.position = Vector3(0, 0.025, 0)
		nm.material_override = MeshKit.emissive_material(Color(1.0, 0.25, 0.1), 1.0)
		needle.add_child(nm)


static func _seat(st: SurfaceTool, p: Vector3, h: float, col: Color) -> void:
	MeshKit.box_at(st, p + Vector3(0, h * 0.5, 0), Vector3(0.44, h, 0.46), col.darkened(0.2))
	MeshKit.box_at(st, p + Vector3(0, h + 0.05, 0), Vector3(0.46, 0.1, 0.46), col)
	MeshKit.box_at(st, p + Vector3(0, h + 0.4, -0.22), Vector3(0.46, 0.68, 0.1), col)
	MeshKit.box_at(st, p + Vector3(0, h + 0.82, -0.22), Vector3(0.26, 0.18, 0.09), col.lightened(0.05))


## Simple body for traffic and parked cars (no interior, doors or markers).
static func build_simple(style: String, color: Color, police := false) -> Node3D:
	var dims := {"length": STYLES[style]["ref"][0], "height": STYLES[style]["ref"][1], "width": 1.76, "wheel_radius": 0.31}
	var spec := {"dims": dims, "body": {"style": style}}
	var m := build(spec, color, false)
	var d := style_def(style)
	var tire := CylinderMesh.new()
	tire.top_radius = 0.31
	tire.bottom_radius = 0.31
	tire.height = 0.21
	tire.radial_segments = 16
	var tm := MeshKit.color_material(Color(0.08, 0.08, 0.08), 0.9)
	for a in d["arches"]:
		for sx in [-1.0, 1.0]:
			var w := MeshInstance3D.new()
			w.mesh = tire
			w.material_override = tm
			w.position = Vector3(sx * 0.76, 0.31, -float(a))
			w.rotation.z = PI / 2
			w.name = "Wheel"
			m.add_child(w)
	if police:
		var bar := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.9, 0.1, 0.25)
		bar.mesh = bm
		bar.material_override = MeshKit.emissive_material(Color(0.1, 0.3, 1.0), 1.5)
		bar.position = Vector3(0, d["ref"][1] + 0.05, -0.4)
		m.add_child(bar)
		var l := Label3D.new()
		l.text = "POLIȚIA"
		l.font_size = 64
		l.pixel_size = 0.004
		l.modulate = Color(0.05, 0.2, 0.6)
		l.position = Vector3(0.9, 0.7, 0)
		l.rotation.y = PI / 2
		m.add_child(l)
	return m
