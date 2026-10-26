extends SceneTree
## Renders a set of screenshots of the prototype. Needs a display (or xvfb-run):
##   godot --path . -s res://tests/screenshots.gd -- <output folder>
var main
var out := "user://screenshots"

func _initialize() -> void:
	_run.call_deferred()

func _shot(name: String) -> void:
	for i in 8:
		await process_frame
	var img := root.get_viewport().get_texture().get_image()
	img.save_png(out + "/" + name + ".png")
	print("saved ", name)

func _wait(s: float) -> void:
	var t := 0.0
	while t < s:
		await physics_frame
		t += 1.0 / 120.0

func _run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() > 0:
		out = args[0]
	DirAccess.make_dir_recursive_absolute(out)
	var gs = root.get_node("GameState")
	gs.testing = true
	gs.new_game()
	gs.time_of_day = 16.5
	gs.settings["time_scale"] = 0.0
	main = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	await _wait(1.5)
	var van
	var car
	for v in main.vehicles:
		if v.spec["id"] == "microbuz_clasic": van = v
		if v.spec["id"] == "sedan_e46_330i": car = v
	# 1: on foot at the depot
	await _wait(1.0)
	await _shot("01_depou_pe_jos")
	# 2: village centre from the air
	var cam: Camera3D = main.rig.camera
	main.rig.set_process(false)
	cam.global_position = Vector3(140, 90, 160)
	cam.look_at(Vector3(-20, 0, -20))
	await _shot("02_centrul_telciu")
	main.rig.set_process(true)
	# 3: minibus at the centre stop with waiting passengers and an active contract
	main.jobs.offers.insert(0, {"type": "pasageri", "from": "telciu_centru", "to": "telciu_sud", "count": 6, "fare": 7, "km": 0.9, "title": "Telciu Centru → Telciu Sud", "detail": ""})
	main.jobs.accept(0)
	main.player.global_position = van.entry_point()
	await _wait(0.1)
	main._interact()
	var sp: Vector2 = main.network.stops["telciu_centru"]["pos"]
	var nr: Dictionary = main.network.nearest_on_road(sp)
	var dir: Vector2 = nr["dir"]
	var right := Vector2(-dir.y, dir.x)
	if right.dot(sp - nr["point"]) < 0.0:
		dir = -dir
		right = -right
	var spot: Vector2 = nr["point"] + right * 2.2
	van.place(Vector3(spot.x, 0, spot.y), atan2(dir.x, dir.y))
	van.engine_on = true
	main.rig.snap()
	await _wait(1.5)
	van.set_door("DoorSide", true)
	await _wait(5.0)
	main.rig._look_yaw = 2.3
	main.rig._idle = 0.0
	await _wait(0.6)
	await _shot("03_imbarcare_statie")
	# 4: cockpit view
	main.rig.mode = CameraRig.Mode.COCKPIT
	main.rig._look_yaw = 0.0
	await _wait(0.5)
	await _shot("04_cabina_sofer")
	main.rig._look_yaw = 2.6
	await _wait(0.3)
	await _shot("05_interior_pasageri")
	main.rig.mode = CameraRig.Mode.CHASE
	main.rig._look_yaw = 0.0
	# 6: menu with map
	main.menu.open("Hartă")
	await _shot("06_meniu_harta")
	main.menu.tabs.current_tab = 1
	await _shot("07_meniu_contracte")
	main.menu.tabs.current_tab = 3
	await _shot("08_meniu_magazin")
	main.menu.close_menu()
	main.jobs.abandon()
	main._interact()
	# 9: sedan with luggage trailer on the DN17C
	var lug = main.trailer_by_spec("remorca_bagaje")
	lug.place(Vector3(300, 0, -1000), PI)
	await _wait(0.5)
	car.place(lug.global_position + lug.global_transform.basis.z * 6.0, lug.global_rotation.y)
	await _wait(0.3)
	var off: Vector3 = lug.coupler_global() - car.hitch_global()
	off.y = 0
	car.place(car.global_position + off, lug.global_rotation.y)
	await _wait(0.8)
	lug.set_cargo(300)
	lug.couple(car)
	main.player.global_position = car.entry_point()
	await _wait(0.1)
	main._interact()
	car.engine_on = true
	car.parking_brake = false
	car.ai_input = {"throttle": 0.35, "brake": 0.0, "steer": 0.15}
	await _wait(5.0)
	main.rig._look_yaw = -0.6
	await _wait(1.0)
	await _shot("09_remorca")
	# 10: night in the village
	car.ai_input = {"throttle": 0.0, "brake": 1.0, "steer": 0.0}
	lug.uncouple()
	car.place(Vector3(-28, 0, 150), PI)
	car.set_lights(true)
	main.tod.paused = true
	main.tod.apply(21.5)
	main.rig._look_yaw = 0.0
	main.rig.snap()
	await _wait(1.5)
	await _shot("10_noapte")
	quit()
