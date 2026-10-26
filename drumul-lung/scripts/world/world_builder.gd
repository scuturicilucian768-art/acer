class_name WorldBuilder
extends Node3D
## Builds the playable world from a map JSON: terrain, roads with markings, river with bridges,
## village houses, landmark buildings, bus stops, signs, forests and map limits.
## Everything is generated in code from data, so new regions are added by adding map files.

const GRID := 25.0
const HOUSE_WALLS := [Color("#f1ece1"), Color("#efe3c2"), Color("#e6efe0"), Color("#dfe8ef"), Color("#f2dfd6"),
	Color("#f5f0d0"), Color("#e9e4dc"), Color("#d8e3c8")]
const HOUSE_ROOFS := [Color("#9c3b25"), Color("#7c2f22"), Color("#5b3a2a"), Color("#4a4f55"), Color("#2f5a3c"), Color("#8a4a2e")]
const WOOD := Color("#6b4a2f")
const PLINTH := Color("#8d8a83")

var net: RoadNetwork
var noise := FastNoiseLite.new()
var river: PackedVector2Array = PackedVector2Array()
var river_width := 11.0
var valley_half := 560.0
var bounds := Rect2()
var window_material: StandardMaterial3D
var house_count := 0
var reserved: Array = []          # [{p: Vector2, r: float}] areas kept free of houses
var fuel_zone := Vector3.ZERO
var service_zone := Vector3.ZERO
var radar_zone := Vector3.ZERO
var depot_slots: Array = []       # [Transform3D]
var trailer_slots: Array = []     # [Transform3D]

var _vc_mat: StandardMaterial3D
var _st: SurfaceTool               # opaque vertex-coloured architecture
var _st_win: SurfaceTool           # windows (glow at night)
var _st_col: SurfaceTool           # collision-only boxes
var _yard_trees: Array = []        # [Vector3]


func build(network: RoadNetwork) -> void:
	net = network
	var m := net.map
	noise.seed = 7
	noise.frequency = 1.0
	noise.fractal_octaves = 4
	var b: Array = m["bounds"]
	bounds = Rect2(b[0], b[1], b[2] - b[0], b[3] - b[1])
	valley_half = float(m.get("valley_half_width", 560))
	river_width = float(m["river"]["width"])
	river = _smooth(_to_v2(m["river"]["points"]), 3)

	_vc_mat = MeshKit.vc_material()
	window_material = StandardMaterial3D.new()
	window_material.albedo_color = Color(0.12, 0.14, 0.16)
	window_material.emission_enabled = true
	window_material.emission = Color(1.0, 0.78, 0.45)
	window_material.emission_energy_multiplier = 0.0
	window_material.roughness = 0.2
	window_material.cull_mode = BaseMaterial3D.CULL_DISABLED

	_st = MeshKit.new_st()
	_st_win = MeshKit.new_st()
	_st_col = MeshKit.new_st()

	for s in net.stops.values():
		reserved.append({"p": s["pos"], "r": 22.0})
	for p in m.get("places", []):
		reserved.append({"p": Vector2(p["pos"][0], p["pos"][1]), "r": 48.0 if p["type"] in ["depot", "fuel", "church", "school"] else 32.0})
	for id in net.adjacency:
		if net.adjacency[id].size() > 2 or _is_road_end(id):
			reserved.append({"p": net.nodes[id], "r": 26.0})

	_build_terrain()
	_build_roads()
	_build_river()
	for p in m.get("places", []):
		_build_place(p)
	for s in net.stops.values():
		_build_stop(s)
	for s in m.get("signs", []):
		_build_sign(s)
	_build_houses()
	_build_forest()
	_build_bounds()
	if depot_slots.is_empty():
		_fallback_depot()

	var mesh := ArrayMesh.new()
	MeshKit.commit(_st, mesh, _vc_mat)
	MeshKit.commit(_st_win, mesh, window_material)
	var mi := MeshInstance3D.new()
	mi.name = "Architecture"
	mi.mesh = mesh
	add_child(mi)
	var col_arrays := _st_col.commit_to_arrays()
	_static_body("ArchitectureCollision", col_arrays[Mesh.ARRAY_VERTEX])


## Collision built straight from vertex data, so it works the same with every renderer (and headless).
func _static_body(node_name: String, faces: PackedVector3Array) -> void:
	if faces.is_empty():
		return
	var shape := ConcavePolygonShape3D.new()
	shape.set_faces(faces)
	var body := StaticBody3D.new()
	body.name = node_name
	var cs := CollisionShape3D.new()
	cs.shape = shape
	body.add_child(cs)
	add_child(body)


func _is_road_end(id: String) -> bool:
	return net.adjacency.has(id) and net.adjacency[id].size() == 1


static func _to_v2(arr: Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	for p in arr:
		out.append(Vector2(p[0], p[1]))
	return out


## Chaikin smoothing keeping the end points.
static func _smooth(pts: PackedVector2Array, iterations: int) -> PackedVector2Array:
	var cur := pts
	for _i in iterations:
		var nxt := PackedVector2Array([cur[0]])
		for i in range(cur.size() - 1):
			nxt.append(cur[i].lerp(cur[i + 1], 0.25))
			nxt.append(cur[i].lerp(cur[i + 1], 0.75))
		nxt.append(cur[-1])
		cur = nxt
	return cur


static func yaw_toward(from: Vector2, to: Vector2) -> float:
	var d := to - from
	return atan2(d.x, d.y)


func river_x(z: float) -> float:
	for i in range(river.size() - 1):
		var a := river[i]
		var c := river[i + 1]
		if (z <= a.y and z >= c.y) or (z >= a.y and z <= c.y):
			var t := 0.0 if absf(c.y - a.y) < 0.001 else (z - a.y) / (c.y - a.y)
			return lerpf(a.x, c.x, t)
	return river[0].x if z > river[0].y else river[-1].x


## Ground height in metres. The valley floor is flat; hills rise beyond the valley edges.
func height_at(x: float, z: float) -> float:
	var d := absf(x - river_x(z))
	if d <= valley_half:
		return 0.0
	var t := (d - valley_half) / 500.0
	var h := pow(t, 1.35) * 140.0
	h += noise.get_noise_2d(x * 0.004, z * 0.004) * 38.0 * clampf(t * 2.0, 0.0, 1.0)
	return maxf(h, 0.0)


func distance_to_river(p: Vector2) -> float:
	var best := INF
	for i in range(0, river.size() - 1):
		best = minf(best, Geometry2D.get_closest_point_to_segment(p, river[i], river[i + 1]).distance_to(p))
	return best


# ---------------------------------------------------------------- terrain
func _build_terrain() -> void:
	var cols := int(bounds.size.x / GRID) + 1
	var rows := int(bounds.size.y / GRID) + 1
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var positions := PackedVector3Array()
	var meadow_a := Color(0.36, 0.46, 0.22)
	var meadow_b := Color(0.46, 0.52, 0.26)
	var forest := Color(0.22, 0.29, 0.15)
	var rock := Color(0.44, 0.44, 0.38)
	for r in rows:
		for c in cols:
			var x := bounds.position.x + c * GRID
			var z := bounds.position.y + r * GRID
			var h := height_at(x, z)
			var n := noise.get_noise_2d(x * 0.02, z * 0.02) * 0.5 + 0.5
			var col := meadow_a.lerp(meadow_b, n)
			if h > 2.0:
				col = col.lerp(forest, clampf((h - 2.0) / 25.0, 0.0, 1.0))
			if h > 240.0:
				col = col.lerp(rock, clampf((h - 240.0) / 80.0, 0.0, 1.0))
			st.set_color(col)
			st.set_uv(Vector2(x, z) / 9.0)
			st.add_vertex(Vector3(x, h, z))
			positions.append(Vector3(x, h, z))
	var faces := PackedVector3Array()
	for r in rows - 1:
		for c in cols - 1:
			var i := r * cols + c
			st.add_index(i)
			st.add_index(i + 1)
			st.add_index(i + cols)
			st.add_index(i + 1)
			st.add_index(i + cols + 1)
			st.add_index(i + cols)
			for k in [i, i + 1, i + cols, i + 1, i + cols + 1, i + cols]:
				faces.append(positions[k])
	st.generate_normals()
	var mesh := st.commit()
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.vertex_color_is_srgb = true
	mat.albedo_texture = MeshKit.noise_texture(0.03, 11, 256, 4, 0.3)
	mat.albedo_color = Color(1.25, 1.25, 1.25)
	mat.roughness = 1.0
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mesh.surface_set_material(0, mat)
	var mi := MeshInstance3D.new()
	mi.name = "Terrain"
	mi.mesh = mesh
	add_child(mi)
	_static_body("TerrainCollision", faces)


# ---------------------------------------------------------------- roads
func _build_roads() -> void:
	var asphalt := StandardMaterial3D.new()
	asphalt.albedo_texture = MeshKit.noise_texture(0.08, 3)
	asphalt.albedo_color = Color(0.36, 0.36, 0.37)
	asphalt.roughness = 0.92
	asphalt.cull_mode = BaseMaterial3D.CULL_DISABLED
	var gravel := StandardMaterial3D.new()
	gravel.albedo_texture = MeshKit.noise_texture(0.15, 5)
	gravel.albedo_color = Color(0.62, 0.58, 0.5)
	gravel.roughness = 1.0
	gravel.cull_mode = BaseMaterial3D.CULL_DISABLED
	var paint := MeshKit.color_material(Color(0.93, 0.92, 0.88), 0.6)
	var st_a := SurfaceTool.new()
	st_a.begin(Mesh.PRIMITIVE_TRIANGLES)
	var st_g := SurfaceTool.new()
	st_g.begin(Mesh.PRIMITIVE_TRIANGLES)
	var st_p := MeshKit.new_st()
	for road in net.roads:
		var pts: PackedVector2Array = road["points"]
		var hw: float = road["width"] * 0.5
		var y := 0.04 if road["type"] == "national" else 0.035
		_ribbon(st_a, pts, -hw, hw, y, 6.0)
		_ribbon(st_g, pts, -hw - 1.3, -hw, 0.025, 4.0)
		_ribbon(st_g, pts, hw, hw + 1.3, 0.025, 4.0)
		if road["type"] in ["national", "county", "motorway"]:
			_markings(st_p, pts, hw)
	for st in [st_a, st_g]:
		st.generate_normals()
	var mesh := ArrayMesh.new()
	MeshKit.commit(st_a, mesh, asphalt)
	MeshKit.commit(st_g, mesh, gravel)
	MeshKit.commit(st_p, mesh, paint)
	var mi := MeshInstance3D.new()
	mi.name = "Roads"
	mi.mesh = mesh
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


static func _normal_at(pts: PackedVector2Array, i: int) -> Vector2:
	var a := pts[maxi(i - 1, 0)]
	var b := pts[mini(i + 1, pts.size() - 1)]
	var t := (b - a).normalized()
	return Vector2(-t.y, t.x)


## Ribbon between lateral offsets o0 and o1 along a polyline (UV v follows distance).
func _ribbon(st: SurfaceTool, pts: PackedVector2Array, o0: float, o1: float, y: float, v_scale: float) -> void:
	var dist := 0.0
	for i in range(pts.size() - 1):
		var n0 := _normal_at(pts, i)
		var n1 := _normal_at(pts, i + 1)
		var seg := pts[i].distance_to(pts[i + 1])
		var v0 := dist / v_scale
		var v1 := (dist + seg) / v_scale
		var a0 := pts[i] + n0 * o0
		var a1 := pts[i] + n0 * o1
		var b0 := pts[i + 1] + n1 * o0
		var b1 := pts[i + 1] + n1 * o1
		var verts := [[a0, Vector2(0, v0)], [a1, Vector2(1, v0)], [b1, Vector2(1, v1)], [a0, Vector2(0, v0)], [b1, Vector2(1, v1)], [b0, Vector2(0, v1)]]
		for v in verts:
			st.set_uv(v[1])
			st.set_normal(Vector3.UP)
			st.add_vertex(Vector3(v[0].x, y, v[0].y))
		dist += seg


## Romanian-style markings: continuous edge lines, dashed centre line (3 m dash, 6 m gap).
func _markings(st: SurfaceTool, pts: PackedVector2Array, hw: float) -> void:
	var white := Color(0.95, 0.95, 0.92)
	var dist := 0.0
	for i in range(pts.size() - 1):
		var n0 := _normal_at(pts, i)
		var n1 := _normal_at(pts, i + 1)
		var seg := pts[i].distance_to(pts[i + 1])
		for side in [-1.0, 1.0]:
			var o: float = side * (hw - 0.35)
			_line_quad(st, pts[i] + n0 * o, pts[i + 1] + n1 * o, n0, n1, 0.12, white)
		var phase := fmod(dist, 9.0)
		if phase < 3.0:
			_line_quad(st, pts[i], pts[i + 1], n0, n1, 0.06, white)
		dist += seg


func _line_quad(st: SurfaceTool, a: Vector2, b: Vector2, na: Vector2, nb: Vector2, half: float, col: Color) -> void:
	var y := 0.048
	MeshKit.quad(st, Vector3(a.x - na.x * half, y, a.y - na.y * half), Vector3(a.x + na.x * half, y, a.y + na.y * half),
		Vector3(b.x + nb.x * half, y, b.y + nb.y * half), Vector3(b.x - nb.x * half, y, b.y - nb.y * half), col)


# ---------------------------------------------------------------- river
func _build_river() -> void:
	var water := StandardMaterial3D.new()
	water.albedo_color = Color(0.13, 0.24, 0.27)
	water.metallic = 0.3
	water.roughness = 0.06
	water.cull_mode = BaseMaterial3D.CULL_DISABLED
	var st_w := SurfaceTool.new()
	st_w.begin(Mesh.PRIMITIVE_TRIANGLES)
	var hw := river_width * 0.5
	_ribbon(st_w, river, -hw, hw, 0.02, 10.0)
	var stone := Color(0.55, 0.53, 0.49)
	for side in [-1.0, 1.0]:
		for i in range(river.size() - 1):
			var n := _normal_at(river, i)
			var a: Vector2 = river[i] + n * side * (hw + 0.3)
			var c: Vector2 = river[i + 1] + _normal_at(river, i + 1) * side * (hw + 0.3)
			var mid: Vector2 = (a + c) * 0.5
			if net.distance_to_roads(mid, 2) < 2.5:
				continue  # gap where a bridge carries the road
			var len: float = a.distance_to(c)
			var yaw := yaw_toward(a, c)
			var xf := Transform3D(Basis(Vector3.UP, yaw), Vector3(mid.x, 0.3, mid.y))
			MeshKit.box(_st, xf, Vector3(0.5, 0.75, len + 0.05), stone)
			MeshKit.box(_st_col, xf, Vector3(0.5, 1.2, len + 0.05), stone)
	st_w.generate_normals()
	var mesh := st_w.commit()
	mesh.surface_set_material(0, water)
	var mi := MeshInstance3D.new()
	mi.name = "River"
	mi.mesh = mesh
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	# bridges: railings on both road edges where a road crosses the river
	for road in net.roads:
		var pts: PackedVector2Array = road["points"]
		for i in range(pts.size() - 1):
			for k in range(river.size() - 1):
				var hit = Geometry2D.segment_intersects_segment(pts[i], pts[i + 1], river[k], river[k + 1])
				if hit == null:
					continue
				_build_bridge(hit, (pts[i + 1] - pts[i]).normalized(), road["width"] * 0.5)


func _build_bridge(at: Vector2, dir: Vector2, hw: float) -> void:
	var n := Vector2(-dir.y, dir.x)
	var yaw := yaw_toward(Vector2.ZERO, dir)
	var concrete := Color(0.72, 0.71, 0.68)
	for side in [-1.0, 1.0]:
		var p: Vector2 = at + n * side * (hw + 0.45)
		var xf := Transform3D(Basis(Vector3.UP, yaw), Vector3(p.x, 0.55, p.y))
		MeshKit.box(_st, xf, Vector3(0.35, 1.1, river_width + 6.0), concrete)
		MeshKit.box(_st_col, xf, Vector3(0.35, 1.6, river_width + 6.0), concrete)
		var top := Transform3D(Basis(Vector3.UP, yaw), Vector3(p.x, 1.15, p.y))
		MeshKit.box(_st, top, Vector3(0.12, 0.08, river_width + 6.0), Color(0.3, 0.32, 0.35))
	reserved.append({"p": at, "r": 20.0})


# ---------------------------------------------------------------- houses
func _build_houses() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 2026
	var placed: Array = []
	for road in net.roads:
		var pts: PackedVector2Array = road["points"]
		var hw: float = road["width"] * 0.5
		var next_at := rng.randf_range(8.0, 20.0)
		var dist := 0.0
		for i in range(pts.size() - 1):
			var seg := pts[i].distance_to(pts[i + 1])
			while next_at < dist + seg:
				var t := (next_at - dist) / seg
				var p := pts[i].lerp(pts[i + 1], t)
				var dir := (pts[i + 1] - pts[i]).normalized()
				var n := Vector2(-dir.y, dir.x)
				for side in [-1.0, 1.0]:
					if net.in_settlement(p).is_empty() or rng.randf() > 0.86:
						continue
					var w := rng.randf_range(8.5, 12.5)
					var d := rng.randf_range(8.0, 11.0)
					var setback := rng.randf_range(7.0, 12.0)
					var c: Vector2 = p + n * side * (hw + setback + d * 0.5)
					if not _house_fits(c, maxf(w, d), placed, hw + setback - 1.5):
						continue
					placed.append(c)
					_house(c, yaw_toward(c, p), w, d, rng, p + n * side * (hw + 3.2), dir)
				next_at += rng.randf_range(22.0, 34.0)
			dist += seg
	house_count = placed.size()


func _house_fits(c: Vector2, size: float, placed: Array, road_clear: float) -> bool:
	if not bounds.grow(-40).has_point(c):
		return false
	for q in placed:
		if q.distance_to(c) < 15.0:
			return false
	for r in reserved:
		if r["p"].distance_to(c) < r["r"] + size * 0.5:
			return false
	if net.distance_to_roads(c, 2) < road_clear:
		return false
	if distance_to_river(c) < river_width * 0.5 + size * 0.6 + 4.0:
		return false
	return true


## A village house facing the road: plinth, walls, gable roof, windows, door, fence with gate,
## sometimes a barn behind and a tree in the yard.
func _house(c: Vector2, yaw: float, w: float, d: float, rng: RandomNumberGenerator, fence_mid: Vector2, road_dir: Vector2) -> void:
	var gable_front := rng.randf() < 0.5
	var basis := Basis(Vector3.UP, yaw)
	var origin := Vector3(c.x, 0, c.y)
	var xf := Transform3D(basis, origin)
	var wall: Color = HOUSE_WALLS[rng.randi() % HOUSE_WALLS.size()]
	var roof: Color = HOUSE_ROOFS[rng.randi() % HOUSE_ROOFS.size()]
	var wall_h := rng.randf_range(2.8, 3.2)
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 0.25, 0)), Vector3(w + 0.1, 0.5, d + 0.1), PLINTH)
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 0.5 + wall_h / 2, 0)), Vector3(w, wall_h, d), wall)
	MeshKit.box(_st_col, xf * Transform3D(Basis(), Vector3(0, 2.0, 0)), Vector3(w, 4.0, d), wall)
	var roof_xf := xf if not gable_front else xf * Transform3D(Basis(Vector3.UP, PI / 2), Vector3.ZERO)
	var rl := w + 0.8 if not gable_front else d + 0.8
	var rd := d + 0.8 if not gable_front else w + 0.8
	MeshKit.gable_roof(_st, roof_xf, rl, rd, 0.5 + wall_h, rng.randf_range(2.2, 3.4), roof, wall.darkened(0.05))
	# facade windows (local +z faces the road) and door
	var n_win := 2 if w < 10.5 else 3
	for k in n_win:
		var wx := -w / 2 + w * (k + 0.5) / n_win
		MeshKit.box(_st_win, xf * Transform3D(Basis(), Vector3(wx, 0.5 + wall_h * 0.55, d / 2 + 0.03)), Vector3(1.1, 1.25, 0.05), Color.WHITE)
	for side in [-1.0, 1.0]:
		MeshKit.box(_st_win, xf * Transform3D(Basis(), Vector3(side * (w / 2 + 0.03), 0.5 + wall_h * 0.55, -d * 0.15)), Vector3(0.05, 1.2, 1.0), Color.WHITE)
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(w / 2 + 0.03, 1.4, d * 0.28)), Vector3(0.06, 2.0, 0.95), WOOD)
	# fence along the road, with a gate (sometimes a traditional carved wooden gate with a little roof)
	var fyaw := yaw_toward(Vector2.ZERO, road_dir)
	var fxf := Transform3D(Basis(Vector3.UP, fyaw), Vector3(fence_mid.x, 0, fence_mid.y))
	var flen := w + 7.0
	var fcol := WOOD if rng.randf() < 0.6 else Color(0.25, 0.4, 0.3)
	var gate_at := flen * 0.25
	for part in [[-flen / 2, gate_at - 1.8], [gate_at + 1.8, flen / 2]]:
		var l: float = part[1] - part[0]
		var mid: float = (part[0] + part[1]) * 0.5
		MeshKit.box(_st, fxf * Transform3D(Basis(), Vector3(0, 0.65, mid)), Vector3(0.06, 1.3, l), fcol)
		MeshKit.box(_st_col, fxf * Transform3D(Basis(), Vector3(0, 0.65, mid)), Vector3(0.1, 1.3, l), fcol)
	for gx in [gate_at - 1.8, gate_at + 1.8]:
		MeshKit.box(_st, fxf * Transform3D(Basis(), Vector3(0, 1.1, gx)), Vector3(0.22, 2.2, 0.22), WOOD.darkened(0.2))
	if rng.randf() < 0.35:
		MeshKit.gable_roof(_st, fxf * Transform3D(Basis(Vector3.UP, PI / 2), Vector3(0, 0, gate_at)), 4.4, 0.9, 2.2, 0.6, roof, WOOD)
	# barn behind the house
	if rng.randf() < 0.55:
		var bxf := xf * Transform3D(Basis(), Vector3(rng.randf_range(-2, 2), 0, -d / 2 - 7.5))
		MeshKit.box(_st, bxf * Transform3D(Basis(), Vector3(0, 1.6, 0)), Vector3(8.0, 3.2, 5.5), WOOD.lightened(0.1))
		MeshKit.gable_roof(_st, bxf, 8.6, 6.1, 3.2, 2.0, Color(0.35, 0.33, 0.3), WOOD)
		MeshKit.box(_st_col, bxf * Transform3D(Basis(), Vector3(0, 2.0, 0)), Vector3(8.0, 4.0, 5.5), WOOD)
	if rng.randf() < 0.6:
		var tp := xf * Vector3(rng.randf_range(-w / 2, w / 2), 0, d / 2 + 3.5)
		_yard_trees.append(tp)


# ---------------------------------------------------------------- landmark buildings
func _place_xf(p: Dictionary) -> Transform3D:
	var pos := Vector2(p["pos"][0], p["pos"][1])
	var face := Vector2(p["face"][0], p["face"][1]) if p.has("face") else pos + Vector2(0, 1)
	return Transform3D(Basis(Vector3.UP, yaw_toward(pos, face)), Vector3(pos.x, 0, pos.y))


func _label(text: String, xf: Transform3D, size := 64, col := Color(0.08, 0.08, 0.08), outline := 0) -> void:
	var l := Label3D.new()
	l.text = text
	l.font_size = size
	l.pixel_size = 0.006
	l.modulate = col
	l.outline_size = outline
	l.double_sided = false
	l.transform = xf
	add_child(l)


func _building(xf: Transform3D, size: Vector3, wall: Color, roof: Color, roof_h: float, windows_rows := 1) -> void:
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, size.y / 2, 0)), size, wall)
	MeshKit.box(_st_col, xf * Transform3D(Basis(), Vector3(0, size.y / 2, 0)), size, wall)
	if roof_h > 0:
		MeshKit.gable_roof(_st, xf, size.x + 0.8, size.z + 0.8, size.y, roof_h, roof, wall)
	for row in windows_rows:
		var y := 1.6 + row * 3.0
		var n := int(size.x / 3.2)
		for k in n:
			var wx := -size.x / 2 + size.x * (k + 0.5) / n
			MeshKit.box(_st_win, xf * Transform3D(Basis(), Vector3(wx, y, size.z / 2 + 0.03)), Vector3(1.3, 1.5, 0.05), Color.WHITE)


func _build_place(p: Dictionary) -> void:
	var xf := _place_xf(p)
	match p["type"]:
		"church":
			var white := Color(0.95, 0.94, 0.9)
			var green := Color(0.2, 0.36, 0.28)
			# nave behind the tower, apse at the back; tower faces the road
			var nave := xf * Transform3D(Basis(Vector3.UP, PI / 2), Vector3(0, 0, -9))
			MeshKit.box(_st, nave * Transform3D(Basis(), Vector3(0, 4.5, 0)), Vector3(18, 9, 9.5), white)
			MeshKit.box(_st_col, nave * Transform3D(Basis(), Vector3(0, 4.5, 0)), Vector3(18, 9, 9.5), white)
			MeshKit.gable_roof(_st, nave, 18.8, 10.4, 9, 4.5, green, white)
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 3.5, -19)), Vector3(6, 7, 4), white)
			var tower := xf * Transform3D(Basis(), Vector3(0, 0, 1.5))
			MeshKit.box(_st, tower * Transform3D(Basis(), Vector3(0, 9, 0)), Vector3(5, 18, 5), white)
			MeshKit.box(_st_col, tower * Transform3D(Basis(), Vector3(0, 9, 0)), Vector3(5, 18, 5), white)
			MeshKit.pyramid(_st, tower, 5.6, 5.6, 18, 9, green)
			MeshKit.box(_st, tower * Transform3D(Basis(), Vector3(0, 28.2, 0)), Vector3(0.15, 2.4, 0.15), Color(0.85, 0.7, 0.3))
			MeshKit.box(_st, tower * Transform3D(Basis(), Vector3(0, 28.6, 0)), Vector3(1.2, 0.15, 0.15), Color(0.85, 0.7, 0.3))
			MeshKit.box(_st, tower * Transform3D(Basis(), Vector3(0, 1.4, 2.53)), Vector3(1.6, 2.8, 0.05), WOOD)
			for y in [8.0, 13.0]:
				MeshKit.box(_st_win, tower * Transform3D(Basis(), Vector3(0, y, 2.53)), Vector3(0.9, 1.8, 0.05), Color.WHITE)
		"townhall":
			_building(xf, Vector3(22, 7.5, 12), Color(0.94, 0.88, 0.72), Color(0.6, 0.24, 0.16), 3.5, 2)
			_label("PRIMĂRIA COMUNEI TELCIU", xf * Transform3D(Basis(), Vector3(0, 6.4, 6.06)), 72)
			_flag(xf * Transform3D(Basis(), Vector3(-6, 0, 8)))
		"school":
			_building(xf, Vector3(30, 7, 11), Color(0.95, 0.85, 0.45), Color(0.55, 0.22, 0.15), 3.0, 2)
			_label("ȘCOALA GIMNAZIALĂ", xf * Transform3D(Basis(), Vector3(0, 6.0, 5.56)), 72)
		"shop":
			_building(xf, Vector3(11, 4, 8), Color(0.97, 0.97, 0.95), Color(0.35, 0.36, 0.38), 1.6)
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 3.3, 4.6)), Vector3(8, 0.7, 0.12), Color(0.15, 0.4, 0.7))
			_label("MAGAZIN MIXT", xf * Transform3D(Basis(), Vector3(0, 3.3, 4.68)), 64, Color.WHITE)
		"hall":
			_building(xf, Vector3(16, 6.5, 24), Color(0.93, 0.9, 0.84), Color(0.45, 0.2, 0.15), 4.0)
			_label("CĂMINUL CULTURAL", xf * Transform3D(Basis(), Vector3(0, 5.4, 12.06)), 64)
		"fuel":
			_fuel_station(xf)
		"depot":
			_depot(xf)
		"police":
			radar_zone = xf.origin
			var car := TrafficCar.make_body_mesh("sedan", Color(0.95, 0.95, 0.95), true)
			car.transform = xf * Transform3D(Basis(Vector3.UP, PI / 2), Vector3(0, 0, -2))
			add_child(car)
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(2.5, 0.6, 2.5)), Vector3(0.08, 1.2, 0.08), Color(0.2, 0.2, 0.2))
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(2.5, 1.3, 2.5)), Vector3(0.35, 0.25, 0.25), Color(0.1, 0.1, 0.1))


func _flag(xf: Transform3D) -> void:
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 4, 0)), Vector3(0.08, 8, 0.08), Color(0.8, 0.8, 0.8))
	var cols := [Color("#002b7f"), Color("#fcd116"), Color("#ce1126")]
	for k in 3:
		MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0.25 + 0.4 * k + 0.2, 7.3, 0)), Vector3(0.4, 0.8, 0.02), cols[k])


func _fuel_station(xf: Transform3D) -> void:
	fuel_zone = xf * Vector3(0, 0, 10)
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 0.03, 10)), Vector3(34, 0.06, 26), Color(0.62, 0.62, 0.6))
	var canopy := xf * Transform3D(Basis(), Vector3(0, 0, 11))
	MeshKit.box(_st, canopy * Transform3D(Basis(), Vector3(0, 5.2, 0)), Vector3(16, 0.6, 11), Color(0.95, 0.95, 0.95))
	MeshKit.box(_st, canopy * Transform3D(Basis(), Vector3(0, 4.85, 0)), Vector3(16.1, 0.12, 11.1), Color(0.1, 0.45, 0.25))
	for px in [-6.0, 6.0]:
		for pz in [-4.0, 4.0]:
			MeshKit.box(_st, canopy * Transform3D(Basis(), Vector3(px, 2.5, pz)), Vector3(0.35, 5, 0.35), Color(0.9, 0.9, 0.9))
	for px in [-3.0, 3.0]:
		MeshKit.box(_st, canopy * Transform3D(Basis(), Vector3(px, 0.15, 0)), Vector3(1.2, 0.3, 4.5), Color(0.75, 0.75, 0.72))
		MeshKit.box(_st, canopy * Transform3D(Basis(), Vector3(px, 1.0, 0)), Vector3(0.7, 1.6, 0.5), Color(0.15, 0.5, 0.3))
		MeshKit.box(_st_col, canopy * Transform3D(Basis(), Vector3(px, 0.9, 0)), Vector3(1.2, 1.8, 1.0), Color.WHITE)
	_building(xf * Transform3D(Basis(), Vector3(0, 0, -6)), Vector3(12, 4.2, 8), Color(0.96, 0.96, 0.94), Color(0.3, 0.3, 0.3), 0.0)
	_label("BENZINĂRIE", xf * Transform3D(Basis(), Vector3(0, 3.4, -1.94)), 72, Color(0.1, 0.45, 0.25))
	var sign := xf * Transform3D(Basis(), Vector3(15, 0, 21))
	MeshKit.box(_st, sign * Transform3D(Basis(), Vector3(0, 3, 0)), Vector3(0.3, 6, 0.3), Color(0.3, 0.3, 0.3))
	MeshKit.box(_st, sign * Transform3D(Basis(), Vector3(0, 5.6, 0)), Vector3(2.4, 2.2, 0.25), Color(0.1, 0.45, 0.25))
	_label("Motorină  %.2f\nBenzină   %.2f" % [GameState.FUEL_PRICE["motorină"], GameState.FUEL_PRICE["benzină"]], sign * Transform3D(Basis(), Vector3(0, 5.6, 0.14)), 56, Color.WHITE)


func _depot(xf: Transform3D) -> void:
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 0.03, 0)), Vector3(56, 0.06, 44), Color(0.55, 0.55, 0.54))
	# open-front garage hall at the back of the yard
	var hall := xf * Transform3D(Basis(), Vector3(0, 0, -16))
	var grey := Color(0.78, 0.8, 0.82)
	MeshKit.box(_st, hall * Transform3D(Basis(), Vector3(0, 3.5, -5.5)), Vector3(24, 7, 0.3), grey)
	for sx in [-12.0, 12.0]:
		MeshKit.box(_st, hall * Transform3D(Basis(), Vector3(sx, 3.5, 0)), Vector3(0.3, 7, 11), grey)
		MeshKit.box(_st_col, hall * Transform3D(Basis(), Vector3(sx, 3.5, 0)), Vector3(0.3, 7, 11), grey)
	MeshKit.box(_st_col, hall * Transform3D(Basis(), Vector3(0, 3.5, -5.5)), Vector3(24, 7, 0.3), grey)
	MeshKit.box(_st, hall * Transform3D(Basis(), Vector3(0, 7.2, 0)), Vector3(25, 0.4, 12), Color(0.35, 0.38, 0.42))
	MeshKit.box(_st, hall * Transform3D(Basis(), Vector3(0, 6.2, 5.5)), Vector3(24, 1.6, 0.3), grey)
	_label(GameState.company.to_upper(), hall * Transform3D(Basis(), Vector3(0, 6.2, 5.68)), 96, Color(0.1, 0.2, 0.45))
	service_zone = hall * Vector3(0, 0, 2)
	# office container
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(21, 1.4, -14)), Vector3(6, 2.8, 2.6), Color(0.85, 0.55, 0.2))
	MeshKit.box(_st_col, xf * Transform3D(Basis(), Vector3(21, 1.4, -14)), Vector3(6, 2.8, 2.6), Color.WHITE)
	# parking slots: vehicles face the depot exit (local +z)
	for k in 5:
		var slot := xf * Transform3D(Basis(), Vector3(-16 + k * 6.5, 0, 6))
		depot_slots.append(slot)
		MeshKit.box(_st, slot * Transform3D(Basis(), Vector3(-3.25, 0.065, 0)), Vector3(0.12, 0.01, 8), Color(0.95, 0.95, 0.9))
	for k in 3:
		trailer_slots.append(xf * Transform3D(Basis(), Vector3(-16 + k * 7.0, 0, 17)))


# ---------------------------------------------------------------- stops and signs
func _build_stop(s: Dictionary) -> void:
	var pos: Vector2 = s["pos"]
	var near := net.nearest_on_road(pos)
	var xf := Transform3D(Basis(Vector3.UP, yaw_toward(pos, near["point"])), Vector3(pos.x, 0, pos.y))
	var glass := Color(0.6, 0.75, 0.85)
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 0.08, 0)), Vector3(5, 0.16, 3), Color(0.7, 0.7, 0.68))
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 2.6, -0.3)), Vector3(4.4, 0.12, 2.2), Color(0.25, 0.3, 0.35))
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 1.35, -1.25)), Vector3(4.2, 2.3, 0.06), glass)
	for sx in [-2.1, 2.1]:
		MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(sx, 1.3, -0.3)), Vector3(0.08, 2.6, 0.08), Color(0.25, 0.3, 0.35))
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 0.5, -0.9)), Vector3(3.0, 0.08, 0.45), WOOD)
	var pole := xf * Transform3D(Basis(), Vector3(2.8, 0, 1.0))
	MeshKit.box(_st, pole * Transform3D(Basis(), Vector3(0, 1.4, 0)), Vector3(0.08, 2.8, 0.08), Color(0.5, 0.5, 0.5))
	MeshKit.box(_st, pole * Transform3D(Basis(), Vector3(0, 2.7, 0)), Vector3(0.8, 0.5, 0.04), Color(0.1, 0.3, 0.7))
	_label("STAȚIE", pole * Transform3D(Basis(), Vector3(0, 2.75, 0.03)), 48, Color.WHITE)
	_label(s["name"], xf * Transform3D(Basis(), Vector3(0, 2.25, -1.2)), 48, Color(0.05, 0.05, 0.05))


func _build_sign(s: Dictionary) -> void:
	var pos := Vector2(s["pos"][0], s["pos"][1])
	var face := Vector2(s["face"][0], s["face"][1])
	var xf := Transform3D(Basis(Vector3.UP, yaw_toward(pos, face)), Vector3(pos.x, 0, pos.y))
	var post := Color(0.55, 0.55, 0.55)
	match s["type"]:
		"locality", "locality_end":
			for sx in [-0.9, 0.9]:
				MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(sx, 1.2, 0)), Vector3(0.07, 2.4, 0.07), post)
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 2.0, 0.04)), Vector3(2.3, 0.75, 0.04), Color.WHITE)
			_label(s["text"], xf * Transform3D(Basis(), Vector3(0, 2.0, 0.07)), 88)
			if s["type"] == "locality_end":
				MeshKit.box(_st, xf * Transform3D(Basis(Vector3.FORWARD, 0.32), Vector3(0, 2.0, 0.08)), Vector3(2.4, 0.09, 0.01), Color(0.8, 0.1, 0.1))
			else:
				_speed_sign(xf * Transform3D(Basis(), Vector3(2.0, 0, 0)), 50)
		"direction":
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 1.3, 0)), Vector3(0.08, 2.6, 0.08), post)
			MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 2.4, 0.05)), Vector3(2.6, 0.6, 0.04), Color(0.1, 0.3, 0.7))
			_label(s["text"], xf * Transform3D(Basis(), Vector3(0, 2.4, 0.08)), 72, Color.WHITE)


func _speed_sign(xf: Transform3D, limit: int) -> void:
	MeshKit.box(_st, xf * Transform3D(Basis(), Vector3(0, 1.1, 0)), Vector3(0.07, 2.2, 0.07), Color(0.55, 0.55, 0.55))
	var disc := CylinderMesh.new()
	disc.top_radius = 0.38
	disc.bottom_radius = 0.38
	disc.height = 0.03
	disc.radial_segments = 24
	var red := MeshInstance3D.new()
	red.mesh = disc
	red.material_override = MeshKit.color_material(Color(0.8, 0.1, 0.1))
	red.transform = xf * Transform3D(Basis(Vector3.RIGHT, PI / 2), Vector3(0, 2.3, 0.04))
	add_child(red)
	var inner := CylinderMesh.new()
	inner.top_radius = 0.29
	inner.bottom_radius = 0.29
	inner.height = 0.035
	inner.radial_segments = 24
	var white := MeshInstance3D.new()
	white.mesh = inner
	white.material_override = MeshKit.color_material(Color.WHITE)
	white.transform = xf * Transform3D(Basis(Vector3.RIGHT, PI / 2), Vector3(0, 2.3, 0.045))
	add_child(white)
	_label(str(limit), xf * Transform3D(Basis(), Vector3(0, 2.3, 0.07)), 80)


# ---------------------------------------------------------------- vegetation and limits
func _spruce_mesh() -> ArrayMesh:
	var st := MeshKit.new_st()
	MeshKit.box(st, Transform3D(Basis(), Vector3(0, 1.0, 0)), Vector3(0.35, 2.0, 0.35), Color(0.3, 0.22, 0.15))
	var greens := [Color(0.13, 0.24, 0.14), Color(0.15, 0.27, 0.15), Color(0.17, 0.3, 0.17)]
	for k in 4:
		var y0 := 1.5 + k * 3.0
		var r := 2.6 - k * 0.55
		var top := Vector3(0, y0 + 4.2, 0)
		for i in 7:
			var a0 := TAU * i / 7.0
			var a1 := TAU * (i + 1) / 7.0
			MeshKit.tri(st, Vector3(cos(a0) * r, y0, sin(a0) * r), Vector3(cos(a1) * r, y0, sin(a1) * r), top, greens[k % 3])
	var mesh := ArrayMesh.new()
	MeshKit.commit(st, mesh, _vc_mat)
	return mesh


func _leafy_mesh() -> ArrayMesh:
	var st := MeshKit.new_st()
	MeshKit.box(st, Transform3D(Basis(), Vector3(0, 1.6, 0)), Vector3(0.4, 3.2, 0.4), Color(0.35, 0.27, 0.2))
	var ico := SphereMesh.new()
	ico.radius = 2.8
	ico.height = 4.6
	ico.radial_segments = 8
	ico.rings = 5
	var arr := ico.get_mesh_arrays()
	var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	var idx: PackedInt32Array = arr[Mesh.ARRAY_INDEX]
	for i in range(0, idx.size(), 3):
		var off := Vector3(0, 5.0, 0)
		var g := Color(0.26, 0.42, 0.18).lerp(Color(0.34, 0.5, 0.2), float(i % 7) / 7.0)
		MeshKit.tri(st, verts[idx[i]] + off, verts[idx[i + 1]] + off, verts[idx[i + 2]] + off, g)
	var mesh := ArrayMesh.new()
	MeshKit.commit(st, mesh, _vc_mat)
	return mesh


func _build_forest() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 99
	var spruce: Array = []
	var guard := 0
	while spruce.size() < 3800 and guard < 60000:
		guard += 1
		var x := rng.randf_range(bounds.position.x + 20, bounds.end.x - 20)
		var z := rng.randf_range(bounds.position.y + 20, bounds.end.y - 20)
		var h := height_at(x, z)
		if h < 3.0 or h > 300.0:
			continue
		if noise.get_noise_2d(x * 0.01, z * 0.01) < -0.25:
			continue  # clearings
		spruce.append(Vector3(x, h - 0.2, z))
	var leafy: Array = _yard_trees.duplicate()
	for i in range(0, river.size(), 3):
		if rng.randf() < 0.55:
			var n := _normal_at(river, i)
			var p := river[i] + n * (1.0 if rng.randf() < 0.5 else -1.0) * (river_width * 0.5 + rng.randf_range(3.0, 8.0))
			if net.distance_to_roads(p, 3) > 6.0:
				leafy.append(Vector3(p.x, 0, p.y))
	_multimesh("Forest", _spruce_mesh(), spruce, rng, false)
	_multimesh("Trees", _leafy_mesh(), leafy, rng, true)


func _multimesh(node_name: String, mesh: Mesh, points: Array, rng: RandomNumberGenerator, shadows: bool) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = points.size()
	for i in points.size():
		var s := rng.randf_range(0.75, 1.3)
		mm.set_instance_transform(i, Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(s, s * rng.randf_range(0.9, 1.2), s)), points[i]))
	var mmi := MultiMeshInstance3D.new()
	mmi.name = node_name
	mmi.multimesh = mm
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)


func _build_bounds() -> void:
	var body := StaticBody3D.new()
	body.name = "MapLimits"
	var r := bounds
	for spec in [[Vector3(r.get_center().x, 50, r.position.y), Vector3(r.size.x, 400, 2)],
			[Vector3(r.get_center().x, 50, r.end.y), Vector3(r.size.x, 400, 2)],
			[Vector3(r.position.x, 50, r.get_center().y), Vector3(2, 400, r.size.y)],
			[Vector3(r.end.x, 50, r.get_center().y), Vector3(2, 400, r.size.y)]]:
		var cs := CollisionShape3D.new()
		var b := BoxShape3D.new()
		b.size = spec[1]
		cs.shape = b
		cs.position = spec[0]
		body.add_child(cs)
	add_child(body)


## Maps without a depot (e.g. fresh OpenStreetMap imports): park the fleet beside the first road.
func _fallback_depot() -> void:
	var pts: PackedVector2Array = net.roads[0]["points"]
	var i := pts.size() / 2
	var dir := (pts[mini(i + 1, pts.size() - 1)] - pts[i]).normalized()
	var right := Vector2(-dir.y, dir.x)
	var yaw := atan2(dir.x, dir.y)
	for k in 5:
		var p: Vector2 = pts[i] + right * (net.roads[0]["width"] * 0.5 + 6.0) + dir * (k * 7.0)
		depot_slots.append(Transform3D(Basis(Vector3.UP, yaw), Vector3(p.x, 0, p.y)))
	for k in 3:
		var p: Vector2 = pts[i] + right * (net.roads[0]["width"] * 0.5 + 14.0) + dir * (k * 8.0)
		trailer_slots.append(Transform3D(Basis(Vector3.UP, yaw), Vector3(p.x, 0, p.y)))
	service_zone = depot_slots[0].origin


## Night factor 0..1: lights the house windows.
func set_night(f: float) -> void:
	window_material.emission_energy_multiplier = f * 1.6
