class_name TimeOfDay
extends Node
## Day–night cycle: moves the sun (east at 06:00, south at noon, west at 18:00), changes sky,
## fog and ambient light, switches to moonlight at night and lights house windows.

var sun: DirectionalLight3D
var env: Environment
var sky_mat: ProceduralSkyMaterial
var world: WorldBuilder
var night := 0.0                 # 0 day .. 1 night
var paused := false

const TOP := {"night": Color("#05070d"), "dusk": Color("#46638f"), "day": Color("#3b78c4")}
const HORIZON := {"night": Color("#141b2b"), "dusk": Color("#eaa070"), "day": Color("#c4d7e6")}


func setup(w: WorldBuilder) -> void:
	world = w
	sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sun_angle_max = 20.0
	var sky := Sky.new()
	sky.sky_material = sky_mat
	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	# ambient and reflections are set from colours each frame: sky radiance maps are not refreshed
	# continuously by the mobile-friendly renderer, which would leave daylight reflections at night
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_density = 0.00022
	env.fog_sky_affect = 0.25
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 160.0
	sun.shadow_blur = 1.5
	add_child(sun)
	apply(GameState.time_of_day)


func _process(delta: float) -> void:
	if paused:
		return
	GameState.time_of_day = fmod(GameState.time_of_day + delta * float(GameState.settings.get("time_scale", 60.0)) / 3600.0, 24.0)
	apply(GameState.time_of_day)


func apply(h: float) -> void:
	var theta := (h - 6.0) / 12.0 * PI
	var s := sin(theta)
	var dayf := clampf(s * 3.0, 0.0, 1.0)         # 0 below the horizon, 1 once the sun is up
	var dusk := clampf(1.0 - absf(s) * 4.0, 0.0, 1.0)
	night = 1.0 - clampf((s + 0.12) * 4.0, 0.0, 1.0)
	var elev := deg_to_rad(58.0) * maxf(s, 0.02)
	var dir := Vector3(cos(theta) * cos(elev), sin(elev), sin(theta) * cos(elev)).normalized()
	if s < 0.0:
		# moonlight from the opposite side of the sky
		dir = Vector3(-cos(theta) * 0.7, 0.55, -sin(theta) * 0.7).normalized()
	sun.global_transform.basis = Basis.looking_at(-dir, Vector3.UP if absf(dir.y) < 0.99 else Vector3.FORWARD)
	var sun_col := Color(1.0, 0.97, 0.9).lerp(Color(1.0, 0.62, 0.35), dusk)
	sun.light_color = sun_col if s >= 0.0 else Color(0.55, 0.65, 0.9)
	sun.light_energy = lerpf(1.25, 0.6, dusk) * dayf if s >= 0.0 else 0.09
	var top: Color = TOP["day"].lerp(TOP["dusk"], dusk).lerp(TOP["night"], night)
	var hor: Color = HORIZON["day"].lerp(HORIZON["dusk"], dusk).lerp(HORIZON["night"], night)
	sky_mat.sky_top_color = top
	sky_mat.sky_horizon_color = hor
	sky_mat.ground_horizon_color = hor.darkened(0.2)
	sky_mat.ground_bottom_color = Color(0.12, 0.14, 0.1).lerp(Color(0.02, 0.02, 0.03), night)
	env.ambient_light_color = Color(0.55, 0.6, 0.68).lerp(Color(0.75, 0.6, 0.55), dusk).lerp(Color(0.12, 0.14, 0.22), night)
	env.ambient_light_energy = lerpf(0.75, 0.35, night)
	env.fog_light_color = hor.darkened(0.1)
	if world:
		world.set_night(night)
