class_name MapView
extends Control
## Road map drawn from the road network. Used twice: as the minimap (follows the player) and as
## the full map in the menu (drag to pan, wheel or +/- to zoom). Shows the GPS route in orange.

var network: RoadNetwork
var world: WorldBuilder
var game = null
var follow := true
var scale_px := 0.35              # pixels per metre
var center := Vector2.ZERO        # metres
var route: PackedVector2Array = PackedVector2Array()
var _font: Font
var _drag := false


func _ready() -> void:
	_font = ThemeDB.fallback_font
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_IGNORE if follow else Control.MOUSE_FILTER_STOP


func _process(_delta: float) -> void:
	if is_visible_in_tree():
		if follow and game:
			var p: Vector3 = game.focus_position()
			center = Vector2(p.x, p.z)
		queue_redraw()


func _gui_input(event: InputEvent) -> void:
	if follow:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			_drag = event.pressed
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			zoom(1.25)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			zoom(0.8)
	elif event is InputEventMouseMotion and _drag:
		center -= event.relative / scale_px
	elif event is InputEventScreenDrag:
		center -= event.relative / scale_px
	elif event is InputEventMagnifyGesture:
		zoom(event.factor)


func zoom(f: float) -> void:
	scale_px = clampf(scale_px * f, 0.05, 4.0)


func to_screen(p: Vector2) -> Vector2:
	return (p - center) * scale_px + size * 0.5


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.13, 0.17, 0.12, 0.92), true)
	if network == null:
		return
	if world:
		var rv: PackedVector2Array = world.river
		var pts := PackedVector2Array()
		for p in rv:
			pts.append(to_screen(p))
		draw_polyline(pts, Color(0.25, 0.45, 0.6), maxf(2.0, world.river_width * scale_px), true)
	for road in network.roads:
		var pts := PackedVector2Array()
		for p in road["points"]:
			pts.append(to_screen(p))
		var w: float = maxf(2.0, road["width"] * scale_px)
		draw_polyline(pts, Color(0.08, 0.08, 0.08), w + 2.0, true)
		draw_polyline(pts, Color(0.92, 0.9, 0.82) if road["type"] == "national" else Color(0.75, 0.74, 0.7), w, true)
	if route.size() > 1:
		var rp := PackedVector2Array()
		for p in route:
			rp.append(to_screen(p))
		draw_polyline(rp, Color(1.0, 0.6, 0.15), maxf(3.0, 4.0 * scale_px), true)
	for s in network.stops.values():
		var p := to_screen(s["pos"])
		draw_circle(p, 5.0, Color(0.15, 0.35, 0.8))
		if not follow or scale_px > 0.3:
			draw_string(_font, p + Vector2(8, 4), s["name"], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color.WHITE)
	if world:
		for z in [[world.fuel_zone, "Benzinărie", Color(0.2, 0.75, 0.35)], [world.service_zone, "Depou / service", Color(0.95, 0.65, 0.2)]]:
			var p := to_screen(Vector2(z[0].x, z[0].z))
			draw_rect(Rect2(p - Vector2(5, 5), Vector2(10, 10)), z[2], true)
			if not follow:
				draw_string(_font, p + Vector2(8, 4), z[1], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, z[2])
	if game:
		for v in game.vehicles:
			if v != game.current_vehicle():
				var p := to_screen(Vector2(v.global_position.x, v.global_position.z))
				draw_circle(p, 3.5, Color(0.8, 0.8, 0.85))
		var t: Vector3 = game.jobs.target()
		if t != Vector3.INF:
			var p := to_screen(Vector2(t.x, t.z))
			draw_circle(p, 8.0, Color(1.0, 0.6, 0.15, 0.6))
			draw_circle(p, 4.0, Color(1.0, 0.6, 0.15))
		var me: Vector3 = game.focus_position()
		var heading: float = game.focus_heading()
		var c := to_screen(Vector2(me.x, me.z))
		var fwd := Vector2(sin(heading), cos(heading))
		var side := Vector2(-fwd.y, fwd.x)
		draw_colored_polygon(PackedVector2Array([c + fwd * 11.0, c - fwd * 7.0 + side * 7.0, c - fwd * 3.0, c - fwd * 7.0 - side * 7.0]), Color(1.0, 0.85, 0.2))
	draw_string(_font, Vector2(size.x - 18, 18), "N", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.WHITE)
	if not follow and network.map.has("accuracy"):
		draw_string(_font, Vector2(10, size.y - 10), "Hartă: %s — %s" % [network.map["name"], network.map["accuracy"]], HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1, 1, 1, 0.7))
