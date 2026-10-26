class_name Dashboard
extends Control
## Instrument cluster drawn in code: tachometer with redline, digital speed, gear, fuel,
## damage, speed limit and warning lamps.

var vehicle = null
var speed_limit := 50
var _font: Font


func _ready() -> void:
	_font = ThemeDB.fallback_font
	custom_minimum_size = Vector2(300, 170)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _process(_delta: float) -> void:
	visible = vehicle != null
	if visible:
		queue_redraw()


func _draw() -> void:
	if vehicle == null:
		return
	var v = vehicle
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.04, 0.05, 0.07, 0.72), true)
	var eng: Dictionary = v.spec["engine"]
	var limiter: float = eng["limiter"]
	var redline: float = eng["redline"]
	var c := Vector2(88, 92)
	var r := 70.0
	var a0 := PI * 0.75
	var a1 := PI * 2.25
	draw_arc(c, r, a0, a1, 48, Color(1, 1, 1, 0.15), 8.0, true)
	var red_from := a0 + (a1 - a0) * (redline / limiter)
	draw_arc(c, r, red_from, a1, 16, Color(0.9, 0.2, 0.15, 0.8), 8.0, true)
	var frac := clampf(v.rpm / limiter, 0.0, 1.0)
	draw_arc(c, r, a0, a0 + (a1 - a0) * frac, 48, Color(1.0, 0.62, 0.24), 8.0, true)
	for k in range(0, int(limiter / 1000.0) + 1):
		var a := a0 + (a1 - a0) * (k * 1000.0 / limiter)
		var p := c + Vector2(cos(a), sin(a)) * (r - 18)
		draw_string(_font, p - Vector2(5, -5), str(k), HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1, 1, 1, 0.6))
	draw_string(_font, c + Vector2(-26, 8), v.gear_label(), HORIZONTAL_ALIGNMENT_CENTER, 52, 30, Color.WHITE)
	draw_string(_font, c + Vector2(-26, 34), "x1000 rpm", HORIZONTAL_ALIGNMENT_CENTER, 52, 10, Color(1, 1, 1, 0.5))
	# speed
	var kmh := int(round(v.kmh()))
	draw_string(_font, Vector2(170, 62), str(kmh), HORIZONTAL_ALIGNMENT_RIGHT, 90, 46, Color.WHITE)
	draw_string(_font, Vector2(262, 62), "km/h", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1, 1, 1, 0.6))
	# fuel and damage bars
	var tank: float = v.spec["fuel"]["tank"]
	_bar(Vector2(172, 82), "COMB.", v.fuel / tank, "%d L" % int(v.fuel), Color(0.95, 0.75, 0.25) if v.fuel / tank > 0.15 else Color(0.95, 0.3, 0.2))
	_bar(Vector2(172, 104), "AVARIE", v.damage, "%d%%" % int(v.damage * 100.0), Color(0.9, 0.35, 0.25))
	# warning lamps
	var x := 172.0
	for lamp in [["P", v.parking_brake, Color(0.95, 0.25, 0.2)], ["MOTOR", not v.engine_on, Color(0.95, 0.7, 0.2)],
			["FAR", v.lights_on, Color(0.3, 0.8, 0.4)], [v.transmission.to_upper(), true, Color(0.6, 0.75, 0.95)]]:
		var col: Color = lamp[2] if lamp[1] else Color(1, 1, 1, 0.12)
		var w := _font.get_string_size(lamp[0], HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x + 10
		draw_rect(Rect2(Vector2(x, 124), Vector2(w, 18)), col if lamp[1] else Color(0, 0, 0, 0), false, 1.5)
		draw_string(_font, Vector2(x + 5, 138), lamp[0], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, col)
		x += w + 5
	if v.transmission == "manual":
		draw_string(_font, Vector2(172, 160), "Ambreiaj", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(1, 1, 1, 0.5))
		draw_rect(Rect2(Vector2(230, 152), Vector2(60 * v.clutch_pedal, 6)), Color(0.6, 0.75, 0.95), true)
	# speed limit sign
	var sc := Vector2(size.x - 34, 30)
	draw_circle(sc, 22, Color(0.85, 0.12, 0.1))
	draw_circle(sc, 17, Color.WHITE)
	draw_string(_font, sc + Vector2(-16, 6), str(speed_limit), HORIZONTAL_ALIGNMENT_CENTER, 32, 16, Color.BLACK)


func _bar(p: Vector2, label: String, f: float, txt: String, col: Color) -> void:
	draw_string(_font, p + Vector2(0, 10), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(1, 1, 1, 0.55))
	draw_rect(Rect2(p + Vector2(48, 2), Vector2(60, 8)), Color(1, 1, 1, 0.12), true)
	draw_rect(Rect2(p + Vector2(48, 2), Vector2(60 * clampf(f, 0.0, 1.0), 8)), col, true)
	draw_string(_font, p + Vector2(114, 10), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(1, 1, 1, 0.8))
