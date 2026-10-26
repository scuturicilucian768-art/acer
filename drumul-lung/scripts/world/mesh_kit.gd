class_name MeshKit
extends RefCounted
## Helpers for building low-poly meshes in code with SurfaceTool.
## Materials made here are double-sided, so triangle winding never hides a face; lighting uses the
## face normal flipped toward the viewer, which is correct for closed shells seen from either side.


static func vc_material(rough := 0.85) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true
	m.vertex_color_is_srgb = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.roughness = rough
	return m


static func color_material(col: Color, rough := 0.8, metal := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.roughness = rough
	m.metallic = metal
	return m


static func emissive_material(col: Color, energy := 1.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col.darkened(0.3)
	m.emission_enabled = true
	m.emission = col
	m.emission_energy_multiplier = energy
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


static func glass_material() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.08, 0.1, 0.12, 0.55)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.05
	m.metallic = 0.4
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


static func tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, col: Color) -> void:
	# Godot treats clockwise triangles as front faces; this normal matches SurfaceTool.generate_normals()
	var n := (c - a).cross(b - a)
	if n.length_squared() < 1e-12:
		return
	n = n.normalized()
	for p in [a, b, c]:
		st.set_color(col)
		st.set_normal(n)
		st.add_vertex(p)


static func quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3, col: Color) -> void:
	tri(st, a, b, c, col)
	tri(st, a, c, d, col)


static func box(st: SurfaceTool, xf: Transform3D, size: Vector3, col: Color) -> void:
	var h := size * 0.5
	var p := [
		xf * Vector3(-h.x, -h.y, -h.z), xf * Vector3(h.x, -h.y, -h.z), xf * Vector3(h.x, h.y, -h.z), xf * Vector3(-h.x, h.y, -h.z),
		xf * Vector3(-h.x, -h.y, h.z), xf * Vector3(h.x, -h.y, h.z), xf * Vector3(h.x, h.y, h.z), xf * Vector3(-h.x, h.y, h.z),
	]
	quad(st, p[0], p[1], p[2], p[3], col)
	quad(st, p[5], p[4], p[7], p[6], col)
	quad(st, p[4], p[0], p[3], p[7], col)
	quad(st, p[1], p[5], p[6], p[2], col)
	quad(st, p[3], p[2], p[6], p[7], col)
	quad(st, p[4], p[5], p[1], p[0], col)


static func box_at(st: SurfaceTool, center: Vector3, size: Vector3, col: Color, yaw := 0.0) -> void:
	box(st, Transform3D(Basis(Vector3.UP, yaw), center), size, col)


## Gable roof over a footprint centred at `center` (ridge along local X), eaves at `y0`.
static func gable_roof(st: SurfaceTool, xf: Transform3D, length: float, depth: float, y0: float, height: float, col: Color, gable_col: Color) -> void:
	var hx := length * 0.5
	var hz := depth * 0.5
	var a := xf * Vector3(-hx, y0, -hz)
	var b := xf * Vector3(hx, y0, -hz)
	var c := xf * Vector3(hx, y0, hz)
	var d := xf * Vector3(-hx, y0, hz)
	var r0 := xf * Vector3(-hx, y0 + height, 0)
	var r1 := xf * Vector3(hx, y0 + height, 0)
	quad(st, a, b, r1, r0, col)
	quad(st, d, c, r1, r0, col)
	tri(st, a, d, r0, gable_col)
	tri(st, b, c, r1, gable_col)


## Hip (four-sided) roof, used for the bell tower and some houses.
static func pyramid(st: SurfaceTool, xf: Transform3D, w: float, d: float, y0: float, h: float, col: Color) -> void:
	var a := xf * Vector3(-w / 2, y0, -d / 2)
	var b := xf * Vector3(w / 2, y0, -d / 2)
	var c := xf * Vector3(w / 2, y0, d / 2)
	var e := xf * Vector3(-w / 2, y0, d / 2)
	var top := xf * Vector3(0, y0 + h, 0)
	tri(st, a, b, top, col)
	tri(st, b, c, top, col)
	tri(st, c, e, top, col)
	tri(st, e, a, top, col)


## Flat polygon at constant x. Points are (s, y) where s is the vehicle's long axis.
static func side_poly(st: SurfaceTool, poly: PackedVector2Array, x: float, col: Color, s_to_z := -1.0) -> void:
	var idx := Geometry2D.triangulate_polygon(poly)
	for i in range(0, idx.size(), 3):
		var a := poly[idx[i]]
		var b := poly[idx[i + 1]]
		var c := poly[idx[i + 2]]
		tri(st, Vector3(x, a.y, a.x * s_to_z), Vector3(x, b.y, b.x * s_to_z), Vector3(x, c.y, c.x * s_to_z), col)


## Strip across the vehicle width between two outline points (s, y).
static func strip(st: SurfaceTool, a: Vector2, b: Vector2, x0: float, x1: float, col: Color, s_to_z := -1.0) -> void:
	quad(st, Vector3(x0, a.y, a.x * s_to_z), Vector3(x1, a.y, a.x * s_to_z), Vector3(x1, b.y, b.x * s_to_z), Vector3(x0, b.y, b.x * s_to_z), col)


static func rect_poly(s0: float, s1: float, y0: float, y1: float) -> PackedVector2Array:
	return PackedVector2Array([Vector2(s0, y0), Vector2(s1, y0), Vector2(s1, y1), Vector2(s0, y1)])


static func circle_poly(c: Vector2, r: float, n := 14) -> PackedVector2Array:
	var out := PackedVector2Array()
	for i in n:
		var a := TAU * i / n
		out.append(c + Vector2(cos(a), sin(a)) * r)
	return out


## Parts of each polygon that lie inside the rectangle.
static func clip_in(polys: Array, rect: PackedVector2Array) -> Array:
	var out: Array = []
	for p in polys:
		for q in Geometry2D.intersect_polygons(p, rect):
			out.append(q)
	return out


## Parts of each polygon that lie outside the shape.
static func clip_out(polys: Array, shape: PackedVector2Array) -> Array:
	var out: Array = []
	for p in polys:
		for q in Geometry2D.clip_polygons(p, shape):
			out.append(q)
	return out


static func commit(st: SurfaceTool, mesh: ArrayMesh, mat: Material) -> void:
	if st == null:
		return
	var arrays := st.commit_to_arrays()
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	if verts.is_empty():
		return
	var index: int = mesh.get_meta("surfaces", 0)
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(index, mat)
	mesh.set_meta("surfaces", index + 1)


static func new_st() -> SurfaceTool:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	return st


## Seamless grey-scale noise texture for asphalt, grass, gravel detail.
static func noise_texture(freq: float, seed := 1, size := 256, octaves := 4, contrast := 0.45) -> ImageTexture:
	var n := FastNoiseLite.new()
	n.seed = seed
	n.frequency = freq
	n.fractal_octaves = octaves
	var img: Image = n.get_seamless_image(size, size)
	img.convert(Image.FORMAT_RGB8)
	img.adjust_bcs(1.0, contrast, 1.0)
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)
