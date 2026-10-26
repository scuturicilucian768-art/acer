extends Node
## Persistent player data: money, company, owned vehicles, statistics and settings.
## Saved as JSON in user://salvare.json (on Android/iOS that is the app's private folder).

signal money_changed(amount: int)
signal notify(text: String, kind: String)
signal settings_changed

const SAVE_PATH := "user://salvare.json"
const SAVE_VERSION := 1
## Orientative fuel prices in lei per litre.
const FUEL_PRICE := {"motorină": 7.6, "benzină": 7.7}

var money: int = 0
var company := "Transport Telciu SRL"
## [{uid, spec, color, fuel, damage, odometer, pos, yaw}]
var owned: Array = []
var stats: Dictionary = {}
var settings: Dictionary = {}
var time_of_day := 9.0
## id -> spec Dictionary for every vehicle and trailer in data/vehicles
var specs: Dictionary = {}
## Tests set this so they never overwrite the player's real save.
var testing := false
var _uid_counter := 100


func _ready() -> void:
	_load_specs()
	if not load_game():
		new_game()


func _load_specs() -> void:
	specs.clear()
	var dir := DirAccess.open("res://data/vehicles")
	if dir == null:
		push_error("Lipsește folderul data/vehicles")
		return
	for f in dir.get_files():
		if not f.ends_with(".json"):
			continue
		var data = JSON.parse_string(FileAccess.get_file_as_string("res://data/vehicles/" + f))
		if data is Dictionary and data.has("id"):
			specs[data["id"]] = data
		else:
			push_error("Fișier de vehicul invalid: " + f)


func default_settings() -> Dictionary:
	return {
		"transmission": "auto",
		"assisted_clutch": true,
		"shadows": true,
		"view_distance": 1400.0,
		"touch_controls": "auto",
		"volume": 0.8,
		"traffic": 10,
		"time_scale": 60.0,
		"speed_units": "km/h",
	}


func new_game() -> void:
	money = 3000
	company = "Transport Telciu SRL"
	stats = {"jobs_done": 0, "passengers": 0, "earned": 0, "fuel_spent": 0, "repairs": 0, "fines": 0,
		"km": 0.0, "rating_sum": 0.0, "rating_count": 0}
	settings = default_settings()
	time_of_day = 9.0
	_uid_counter = 100
	# The prototype starts the company with one second-hand minibus, a personal car and two depot trailers.
	owned = [
		{"uid": "v1", "spec": "microbuz_clasic", "color": "#eceae4", "fuel": 48.0, "damage": 0.0, "odometer": 412000.0},
		{"uid": "v2", "spec": "sedan_e46_330i", "color": "#1d3557", "fuel": 34.0, "damage": 0.0, "odometer": 268000.0},
		{"uid": "t1", "spec": "remorca_bagaje", "color": "#9aa0a6", "fuel": 0.0, "damage": 0.0, "odometer": 0.0},
		{"uid": "t2", "spec": "platforma_auto", "color": "#3a3f45", "fuel": 0.0, "damage": 0.0, "odometer": 0.0},
	]
	save_game()


func new_uid() -> String:
	_uid_counter += 1
	return "v%d" % _uid_counter


func owned_entry(uid: String) -> Dictionary:
	for e in owned:
		if e["uid"] == uid:
			return e
	return {}


func add_money(amount: int, reason := "") -> void:
	money += amount
	if amount > 0:
		stats["earned"] = int(stats.get("earned", 0)) + amount
	money_changed.emit(money)
	if reason != "":
		notify.emit(("+%d lei · %s" % [amount, reason]) if amount >= 0 else ("%d lei · %s" % [amount, reason]), "money")


func spend(amount: int, reason: String) -> bool:
	if money < amount:
		notify.emit("Fonduri insuficiente: ai nevoie de %d lei" % amount, "warn")
		return false
	money -= amount
	money_changed.emit(money)
	notify.emit("-%d lei · %s" % [amount, reason], "money")
	return true


func average_rating() -> float:
	var n := int(stats.get("rating_count", 0))
	return float(stats.get("rating_sum", 0.0)) / n if n > 0 else 0.0


func set_setting(key: String, value) -> void:
	settings[key] = value
	settings_changed.emit()
	save_game()


func save_game() -> void:
	if testing:
		return
	var data := {
		"version": SAVE_VERSION, "money": money, "company": company, "owned": owned, "stats": stats,
		"settings": settings, "time_of_day": time_of_day, "uid_counter": _uid_counter,
	}
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		push_error("Nu pot scrie salvarea: %s" % FileAccess.get_open_error())
		return
	f.store_string(JSON.stringify(data, "\t"))


func load_game() -> bool:
	if testing or not FileAccess.file_exists(SAVE_PATH):
		return false
	var data = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if not (data is Dictionary) or int(data.get("version", 0)) != SAVE_VERSION:
		return false
	money = int(data.get("money", 0))
	company = str(data.get("company", company))
	owned = data.get("owned", [])
	stats = data.get("stats", {})
	time_of_day = float(data.get("time_of_day", 9.0))
	_uid_counter = int(data.get("uid_counter", 100))
	settings = default_settings()
	for k in data.get("settings", {}):
		settings[k] = data["settings"][k]
	# drop vehicles whose spec no longer exists
	owned = owned.filter(func(e): return specs.has(e.get("spec", "")))
	return true


## Snapshot used by tests to check that saving and loading keeps the data intact.
func to_dict() -> Dictionary:
	return {"money": money, "owned": owned.duplicate(true), "stats": stats.duplicate(true), "settings": settings.duplicate(true)}
