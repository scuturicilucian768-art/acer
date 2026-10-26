class_name TouchControls
extends CanvasLayer
## On-screen buttons for phones and tablets. Each TouchScreenButton presses a real input action,
## so driving and walking use the same code as keyboard and gamepad. Multitouch works
## (steer and accelerate at the same time).

const BIG := 92.0
const SMALL := 60.0

var _buttons: Array = []   # [{node, anchor, offset}]
var _tex_cache := {}


func setup() -> void:
	layer = 6
	_add("steer_left", "◀", Vector2(0, 1), Vector2(24, -BIG - 28), BIG)
	_add("steer_right", "▶", Vector2(0, 1), Vector2(24 + BIG + 16, -BIG - 28), BIG)
	_add("accelerate", "GAZ", Vector2(1, 1), Vector2(-BIG - 24, -BIG * 1.4 - 28), BIG, 1.4)
	_add("brake", "FRÂNĂ", Vector2(1, 1), Vector2(-BIG * 2 - 40, -BIG - 28), BIG)
	_add("handbrake", "MÂNĂ", Vector2(1, 1), Vector2(-BIG * 3 - 50, -SMALL - 28), SMALL)
	var row := [["interact", "F urcă"], ["doors", "Uși"], ["trailer", "Remorcă"], ["engine", "Motor"], ["lights", "Faruri"],
		["camera", "Cameră"], ["action", "Acțiune"], ["gear_up", "Treaptă+"], ["gear_down", "Treaptă−"], ["horn", "Claxon"]]
	for i in row.size():
		_add(row[i][0], row[i][1], Vector2(1, 0), Vector2(-(SMALL + 8) * (i % 5 + 1) - 8, 250 + (i / 5) * (SMALL * 0.6 + 8)), SMALL, 0.6)
	_add("menu", "☰", Vector2(0.5, 0), Vector2(-SMALL * 0.5, 8), SMALL, 0.7)
	get_viewport().size_changed.connect(_layout)
	_layout()
	apply_mode(GameState.settings.get("touch_controls", "auto"))


func apply_mode(mode: String) -> void:
	for b in _buttons:
		var btn: TouchScreenButton = b["node"]
		if mode == "on":
			btn.visibility_mode = TouchScreenButton.VISIBILITY_ALWAYS
			btn.visible = true
		elif mode == "off":
			btn.visible = false
		else:
			# the button hides itself without a touchscreen, but its label would not, so hide both
			btn.visibility_mode = TouchScreenButton.VISIBILITY_ALWAYS
			btn.visible = DisplayServer.is_touchscreen_available()


func _texture(w: float, h: float) -> Texture2D:
	var key := "%d_%d" % [int(w), int(h)]
	if _tex_cache.has(key):
		return _tex_cache[key]
	var img := Image.create(int(w), int(h), false, Image.FORMAT_RGBA8)
	var r := minf(w, h) * 0.3
	for y in int(h):
		for x in int(w):
			var dx := maxf(absf(x + 0.5 - w * 0.5) - (w * 0.5 - r), 0.0)
			var dy := maxf(absf(y + 0.5 - h * 0.5) - (h * 0.5 - r), 0.0)
			var d := sqrt(dx * dx + dy * dy)
			var a := clampf(r - d, 0.0, 1.0)
			var edge := 1.0 if d > r - 2.5 else 0.0
			img.set_pixel(x, y, Color(1, 1, 1, 0.55 * a) if edge > 0.0 else Color(0.05, 0.06, 0.08, 0.45 * a))
	var t := ImageTexture.create_from_image(img)
	_tex_cache[key] = t
	return t


func _add(action: String, text: String, anchor: Vector2, offset: Vector2, size: float, h_scale := 1.0) -> void:
	var w := size if h_scale >= 1.0 or size == BIG else size * 1.6
	var h := size * h_scale
	var b := TouchScreenButton.new()
	b.texture_normal = _texture(w, h)
	b.action = action
	b.passby_press = action in ["steer_left", "steer_right", "accelerate", "brake"]
	var shape := RectangleShape2D.new()
	shape.size = Vector2(w, h)
	b.shape = shape
	b.shape_centered = true
	var l := Label.new()
	l.text = text
	l.size = Vector2(w, h)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", 16 if size == BIG else 13)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(l)
	add_child(b)
	_buttons.append({"node": b, "anchor": anchor, "offset": offset})


func _layout() -> void:
	var vs := get_viewport().get_visible_rect().size
	for b in _buttons:
		b["node"].position = vs * b["anchor"] + b["offset"]
