class_name GameMenu
extends CanvasLayer
## Pause menu with tabs: map, contracts, garage, shop, company, settings, help.
## Opening it pauses the simulation.

const TABS := ["Hartă", "Contracte", "Garaj", "Magazin", "Firmă", "Setări", "Ajutor"]

var game = null
var tabs: TabContainer
var map_view: MapView
var _pages := {}
var _new_game_armed := false


func setup(g) -> void:
	game = g
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS
	var bg := ColorRect.new()
	bg.color = Color(0.02, 0.03, 0.05, 0.86)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	add_child(margin)
	var vb := VBoxContainer.new()
	margin.add_child(vb)
	var top := HBoxContainer.new()
	vb.add_child(top)
	var title := Label.new()
	title.text = "Drumul Lung — prototip"
	title.add_theme_font_size_override("font_size", 26)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(title)
	var close := Button.new()
	close.text = "Continuă jocul  (Esc)"
	close.pressed.connect(close_menu)
	top.add_child(close)
	tabs = TabContainer.new()
	tabs.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(tabs)
	for name in TABS:
		var page: Control
		if name == "Hartă":
			map_view = MapView.new()
			map_view.follow = false
			map_view.network = game.network
			map_view.world = game.world
			map_view.game = game
			page = map_view
		else:
			var sc := ScrollContainer.new()
			var box := VBoxContainer.new()
			box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			box.add_theme_constant_override("separation", 10)
			sc.add_child(box)
			_pages[name] = box
			page = sc
		page.name = name
		tabs.add_child(page)
	visible = false


func open(tab := "") -> void:
	visible = true
	get_tree().paused = true
	if tab != "":
		tabs.current_tab = TABS.find(tab)
	refresh()
	if map_view:
		var p: Vector3 = game.focus_position()
		map_view.center = Vector2(p.x, p.z)
		map_view.route = game.gps_route


func close_menu() -> void:
	if game:
		game._menu_closed_frame = Engine.get_process_frames()
	visible = false
	get_tree().paused = false
	_new_game_armed = false
	GameState.save_game()


func toggle(tab := "") -> void:
	if visible:
		close_menu()
	else:
		open(tab)


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("menu"):
		close_menu()
		get_viewport().set_input_as_handled()


func refresh() -> void:
	_contracts()
	_garage()
	_shop()
	_company()
	_settings()
	_help()


func _clear(box: VBoxContainer) -> void:
	for c in box.get_children():
		c.queue_free()


func _h(box: VBoxContainer, text: String, size := 20) -> void:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	box.add_child(l)


func _p(box: VBoxContainer, text: String, col := Color(1, 1, 1, 0.75)) -> void:
	var l := Label.new()
	l.text = text
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_color_override("font_color", col)
	box.add_child(l)


func _row(box: VBoxContainer, title: String, detail: String, button: String, cb: Callable, disabled := false) -> void:
	var hb := HBoxContainer.new()
	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var t := Label.new()
	t.text = title
	t.add_theme_font_size_override("font_size", 17)
	vb.add_child(t)
	var d := Label.new()
	d.text = detail
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	d.add_theme_color_override("font_color", Color(1, 1, 1, 0.65))
	vb.add_child(d)
	hb.add_child(vb)
	if button != "":
		var b := Button.new()
		b.text = button
		b.disabled = disabled
		b.custom_minimum_size = Vector2(150, 40)
		b.pressed.connect(cb)
		hb.add_child(b)
	box.add_child(hb)
	box.add_child(HSeparator.new())


func _contracts() -> void:
	var box: VBoxContainer = _pages["Contracte"]
	_clear(box)
	var jobs = game.jobs
	if not jobs.active.is_empty():
		_h(box, "Cursa activă")
		var cancel := func():
			jobs.abandon()
			refresh()
		_row(box, jobs.active["title"], "%s · rating %.1f" % [jobs.instruction(), jobs.active["rating"]], "Renunță", cancel)
	_h(box, "Contracte disponibile (Telciu)")
	for i in jobs.offers.size():
		var o: Dictionary = jobs.offers[i]
		var need := "necesită microbuz" if o["type"] == "pasageri" else "necesită vehicul cu cârlig + remorca de bagaje"
		var take := func():
			var err: String = jobs.accept(i)
			if err != "":
				game.toast(err, "warn")
			close_menu()
		_row(box, o["title"], "%s · %s" % [o["detail"], need], "Acceptă", take, not jobs.active.is_empty())
	var rb := Button.new()
	rb.text = "Caută alte contracte"
	var more := func():
		jobs.refresh_offers()
		refresh()
	rb.pressed.connect(more)
	box.add_child(rb)
	_h(box, "Rute internaționale", 18)
	_p(box, "Telciu → Viena, München, Milano prin Ungaria vor apărea când harta se extinde (etapa 4 din plan). Acum nu sunt disponibile: harta prototipului acoperă doar zona Telciu.")


func _garage() -> void:
	var box: VBoxContainer = _pages["Garaj"]
	_clear(box)
	_h(box, "Vehiculele firmei")
	for v in game.vehicles:
		var tank: float = v.spec["fuel"]["tank"]
		var value := _value(v.spec, v.damage)
		var current: bool = v == game.current_vehicle()
		var sell := func():
			game.sell_vehicle(v)
			refresh()
		_row(box, "%s  (%s)" % [v.spec["name"], "conduci acum" if current else "%.0f m de tine" % v.global_position.distance_to(game.focus_position())],
			"Combustibil %d/%d L · avarie %d%% · %s km · remorcare %d/%d kg · %d locuri pasageri" % [int(v.fuel), int(tank), int(v.damage * 100.0),
				_thousands(int(v.odometer_km)), int(v.spec["tow"]["unbraked"]), int(v.spec["tow"]["braked"]), int(v.spec.get("seats", 0))],
			"Vinde %s lei" % _thousands(value), sell, current or game.vehicles.size() <= 1)
		var assist := Button.new()
		assist.text = "Asistență rutieră: adu-l la depou (300 lei)"
		assist.disabled = current
		var help := func():
			game.roadside_assistance(v)
			refresh()
		assist.pressed.connect(help)
		box.add_child(assist)
	_h(box, "Remorci")
	for t in game.trailers:
		_row(box, t.spec["name"], "%s · masă proprie %d kg · încărcătură %d kg%s" % ["frânată" if t.spec["braked"] else "nefrânată",
			int(t.spec["mass"]), int(t.cargo_kg), " · cuplată" if t.coupled_to != null else ""], "", Callable())


func _value(spec: Dictionary, damage: float) -> int:
	return int(float(spec["price"]) * 0.6 * (1.0 - damage * 0.5))


static func _thousands(n: int) -> String:
	var s := str(n)
	var out := ""
	while s.length() > 3:
		out = "." + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return s + out


func _shop() -> void:
	var box: VBoxContainer = _pages["Magazin"]
	_clear(box)
	_h(box, "Vehicule second-hand și noi")
	_p(box, "Toate vehiculele sunt modele originale inspirate de categoria lor (nu modele licențiate). Vehiculul cumpărat te așteaptă la depou.")
	var ids := GameState.specs.keys()
	ids.sort_custom(func(a, b): return GameState.specs[a]["price"] < GameState.specs[b]["price"])
	for id in ids:
		var s: Dictionary = GameState.specs[id]
		var detail := ""
		if s["kind"] == "car":
			var e: Dictionary = s["engine"]
			var mt := 0.0
			for p in e["torque"]:
				mt = maxf(mt, p[1])
			detail = "%s · %s · %d Nm · cutie %s · tracțiune %s · %d kg · remorcare %d/%d kg · %s" % [s["category"], e["fuel"], int(mt),
				"/".join(s["gearbox"]["modes"]), {"rear": "spate", "front": "față", "all": "integrală"}[s["drive"]], int(s["mass"]),
				int(s["tow"]["unbraked"]), int(s["tow"]["braked"]), s.get("inspired_by", "")]
		else:
			detail = "remorcă %s · masă %d kg · încărcătură max %d kg" % ["frânată" if s["braked"] else "nefrânată", int(s["mass"]), int(s["max_cargo"])]
		var purchase := func():
			game.buy(id)
			refresh()
		_row(box, "%s — %s lei" % [s["name"], _thousands(int(s["price"]))], detail, "Cumpără", purchase, GameState.money < int(s["price"]))


func _company() -> void:
	var box: VBoxContainer = _pages["Firmă"]
	_clear(box)
	var st: Dictionary = GameState.stats
	_h(box, GameState.company)
	_p(box, "Bani: %s lei\nCurse finalizate: %d\nPasageri transportați: %d\nRating mediu: %.1f / 5\nKilometri parcurși: %.1f km\nCheltuieli combustibil: %d lei · reparații: %d lei · amenzi: %d lei\nVehicule: %d · remorci: %d" % [
		_thousands(GameState.money), int(st.get("jobs_done", 0)), int(st.get("passengers", 0)), GameState.average_rating(), float(st.get("km", 0.0)),
		int(st.get("fuel_spent", 0)), int(st.get("repairs", 0)), int(st.get("fines", 0)), game.vehicles.size(), game.trailers.size()], Color.WHITE)
	_h(box, "Dezvoltarea firmei", 18)
	_p(box, "În această versiune: cumperi și vinzi vehicule, faci curse, alimentezi și repari. Angajarea șoferilor AI, garaje în alte orașe și extinderea în alte țări sunt etape următoare din plan (vezi docs/ARHITECTURA.md).")


func _settings() -> void:
	var box: VBoxContainer = _pages["Setări"]
	_clear(box)
	_h(box, "Condus")
	_option(box, "Cutie de viteze", "transmission", [["auto", "Automată"], ["manual", "Manuală"]])
	_check(box, "Ambreiaj asistat (schimbi treptele fără să ții ambreiajul)", "assisted_clutch")
	_h(box, "Grafică și sunet")
	_check(box, "Umbre", "shadows")
	_slider(box, "Distanța de vizibilitate (m)", "view_distance", 400, 3000, 100)
	_slider(box, "Volum", "volume", 0.0, 1.0, 0.05)
	_option(box, "Controale tactile", "touch_controls", [["auto", "Automat"], ["on", "Mereu"], ["off", "Ascunse"]])
	_slider(box, "Viteza timpului (minute de joc pe secundă reală)", "time_scale", 0.0, 10.0, 0.5, 1.0 / 60.0)
	_slider(box, "Mașini în trafic (după repornire)", "traffic", 0, 30, 1)
	_h(box, "Salvare")
	var save := Button.new()
	save.text = "Salvează acum"
	var do_save := func():
		game.save_all()
		game.toast("Joc salvat")
	save.pressed.connect(do_save)
	box.add_child(save)
	var ng := Button.new()
	ng.text = "Joc nou (șterge progresul)" if not _new_game_armed else "Confirmă: începe un joc nou"
	var fresh := func():
		if _new_game_armed:
			GameState.new_game()
			get_tree().paused = false
			get_tree().reload_current_scene()
		else:
			_new_game_armed = true
			_settings()
	ng.pressed.connect(fresh)
	box.add_child(ng)


func _option(box: VBoxContainer, label: String, key: String, opts: Array) -> void:
	var hb := HBoxContainer.new()
	var l := Label.new()
	l.text = label
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(l)
	var ob := OptionButton.new()
	for i in opts.size():
		ob.add_item(opts[i][1], i)
		if GameState.settings.get(key) == opts[i][0]:
			ob.select(i)
	var pick := func(i):
		GameState.set_setting(key, opts[i][0])
		game.apply_settings()
	ob.item_selected.connect(pick)
	hb.add_child(ob)
	box.add_child(hb)


func _check(box: VBoxContainer, label: String, key: String) -> void:
	var cb := CheckBox.new()
	cb.text = label
	cb.button_pressed = bool(GameState.settings.get(key, false))
	var flip := func(on):
		GameState.set_setting(key, on)
		game.apply_settings()
	cb.toggled.connect(flip)
	box.add_child(cb)


func _slider(box: VBoxContainer, label: String, key: String, lo: float, hi: float, step: float, display_mul := 1.0) -> void:
	var hb := HBoxContainer.new()
	var l := Label.new()
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var stored: float = float(GameState.settings.get(key, lo))
	var shown := stored * display_mul
	l.text = "%s: %s" % [label, str(snappedf(shown, step))]
	hb.add_child(l)
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = step
	s.value = shown
	s.custom_minimum_size.x = 260
	var moved := func(v):
		l.text = "%s: %s" % [label, str(snappedf(v, step))]
		GameState.set_setting(key, v / display_mul)
		game.apply_settings()
	s.value_changed.connect(moved)
	hb.add_child(s)
	box.add_child(hb)


func _help() -> void:
	var box: VBoxContainer = _pages["Ajutor"]
	_clear(box)
	_h(box, "Controale (tastatură · controller · ecran tactil)")
	var lines := [
		["W / S", "accelerație / frână (în automat, ține S din oprire pentru marșarier)"],
		["A / D", "virare (pe jos: deplasare)"],
		["Spațiu · P", "frână de mână · frână de parcare"],
		["Shift", "ambreiaj (pe jos: alergare)"],
		["Q / Z", "treaptă sus / jos (în automat: D – N – R)"],
		["E", "pornește / oprește motorul"],
		["F", "urcă / coboară din vehicul"],
		["O", "deschide / închide ușa pasagerilor"],
		["T", "cuplează / decuplează remorca"],
		["X", "acțiune: alimentează la benzinărie, repară la depou"],
		["L · H · C", "faruri · claxon · cameră"],
		["R", "repune vehiculul pe drum dacă s-a răsturnat"],
		["M · J · Esc", "hartă · contracte · meniu"],
		["Controller", "stick stâng virare, RT/LT accelerație/frână, Y urcă, A acțiune, X frână de mână, RB/LB trepte"],
	]
	for l in lines:
		_row(box, l[0], l[1], "", Callable())
	_h(box, "Despre hartă", 18)
	_p(box, "%s\n%s" % [game.network.map["name"] + " — " + game.network.map["accuracy"], game.network.map["source"]])
