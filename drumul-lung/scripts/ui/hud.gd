class_name Hud
extends CanvasLayer
## In-game overlay: money, clock and active contract (top left), messages (top centre),
## context prompt (bottom centre), minimap with GPS (bottom left), dashboard (bottom right).

var game = null
var info: Label
var job_label: Label
var toast_label: Label
var prompt_label: Label
var minimap: MapView
var dash: Dashboard
var _toast_t := 0.0
var _summary_panel: PanelContainer
var _summary_label: Label


func setup(g) -> void:
	game = g
	layer = 5
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	var tl := PanelContainer.new()
	tl.position = Vector2(12, 12)
	tl.add_theme_stylebox_override("panel", _panel_style())
	root.add_child(tl)
	var vb := VBoxContainer.new()
	tl.add_child(vb)
	info = _label(18)
	vb.add_child(info)
	job_label = _label(15)
	job_label.add_theme_color_override("font_color", Color(1.0, 0.75, 0.4))
	job_label.custom_minimum_size.x = 320
	job_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(job_label)

	toast_label = _label(22)
	_place(toast_label, Vector4(0.5, 0, 0.5, 0), Vector4(-400, 120, 400, 160))
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_label.add_theme_constant_override("outline_size", 6)
	toast_label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	root.add_child(toast_label)

	prompt_label = _label(18)
	_place(prompt_label, Vector4(0.5, 1, 0.5, 1), Vector4(-360, -250, 360, -190))
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	prompt_label.add_theme_constant_override("outline_size", 6)
	prompt_label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	root.add_child(prompt_label)

	minimap = MapView.new()
	minimap.follow = true
	minimap.network = game.network
	minimap.world = game.world
	minimap.game = game
	minimap.scale_px = 0.45
	root.add_child(minimap)
	_place(minimap, Vector4(0, 1, 0, 1), Vector4(12, -232, 232, -12))

	dash = Dashboard.new()
	root.add_child(dash)
	_place(dash, Vector4(1, 1, 1, 1), Vector4(-312, -182, -12, -12))

	_summary_panel = PanelContainer.new()
	_summary_panel.custom_minimum_size = Vector2(440, 200)
	_summary_panel.add_theme_stylebox_override("panel", _panel_style())
	_summary_panel.visible = false
	root.add_child(_summary_panel)
	_place(_summary_panel, Vector4(0.5, 0.5, 0.5, 0.5), Vector4(-220, -110, 220, 110))
	_summary_label = _label(18)
	_summary_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_summary_panel.add_child(_summary_label)


## anchors (left, top, right, bottom) and pixel offsets from those anchors
static func _place(c: Control, anchors: Vector4, offsets: Vector4) -> void:
	c.anchor_left = anchors.x
	c.anchor_top = anchors.y
	c.anchor_right = anchors.z
	c.anchor_bottom = anchors.w
	c.offset_left = offsets.x
	c.offset_top = offsets.y
	c.offset_right = offsets.z
	c.offset_bottom = offsets.w


static func _panel_style() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.04, 0.05, 0.07, 0.72)
	sb.set_corner_radius_all(8)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


func _label(size: int) -> Label:
	var l := Label.new()
	l.add_theme_font_size_override("font_size", size)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func toast(text: String, kind := "") -> void:
	toast_label.text = text
	var col := Color.WHITE
	if kind == "warn":
		col = Color(1.0, 0.45, 0.35)
	elif kind == "money":
		col = Color(0.55, 0.95, 0.6)
	toast_label.add_theme_color_override("font_color", col)
	_toast_t = 3.5


func show_summary(s: Dictionary) -> void:
	var stars := ""
	for i in 5:
		stars += "★" if s["rating"] >= i + 0.75 else "☆"
	var events: String = ", ".join(s["events"]) if not s["events"].is_empty() else "fără probleme"
	_summary_label.text = "Cursă finalizată\n%s\n\nÎncasări: %d lei\nRating: %s (%.1f)\nObservații: %s" % [s["title"], s["income"], stars, s["rating"], events]
	_summary_panel.visible = true
	await get_tree().create_timer(6.0).timeout
	_summary_panel.visible = false


func _process(delta: float) -> void:
	if game == null:
		return
	_toast_t -= delta
	toast_label.modulate.a = clampf(_toast_t, 0.0, 1.0)
	var h := int(GameState.time_of_day)
	var m := int((GameState.time_of_day - h) * 60.0)
	info.text = "%s   %d lei   %02d:%02d" % [GameState.company, GameState.money, h, m]
	var j: Dictionary = game.jobs.active
	if j.is_empty():
		job_label.text = "Nicio cursă activă — %s: contracte" % InputSetup.label("jobs")
	else:
		job_label.text = "%s\n%s\nRating: %.1f" % [j["title"], game.jobs.instruction(), j["rating"]]
	prompt_label.text = game.context_prompt()
	dash.vehicle = game.current_vehicle()
	dash.speed_limit = game.current_limit
	var t: Vector3 = game.jobs.target()
	minimap.route = game.gps_route if t != Vector3.INF else PackedVector2Array()
