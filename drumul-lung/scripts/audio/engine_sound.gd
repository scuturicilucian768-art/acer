class_name EngineSound
extends AudioStreamPlayer
## Real-time synthesized engine sound (no recorded or commercial samples): firing-frequency
## harmonics from rpm and cylinder count, throttle-dependent brightness, diesel clatter, tyre
## squeal from wheel slip, wind noise and the horn. Works the same on PC, Android and iOS.

const RATE := 22050.0

var vehicle = null
var _playback: AudioStreamGeneratorPlayback
var _phase := [0.0, 0.0, 0.0, 0.0]
var _horn_phase := [0.0, 0.0]
var _lp := 0.0
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	var gen := AudioStreamGenerator.new()
	gen.mix_rate = RATE
	gen.buffer_length = 0.12
	stream = gen
	# on the web Godot defaults to sample playback, which cannot play generated audio
	playback_type = AudioServer.PLAYBACK_TYPE_STREAM
	volume_db = linear_to_db(maxf(float(GameState.settings.get("volume", 0.8)), 0.001)) - 4.0
	play()
	_playback = get_stream_playback()


func _process(_delta: float) -> void:
	if _playback == null:
		return
	var frames := _playback.get_frames_available()
	if frames <= 0:
		return
	var on: bool = vehicle != null and is_instance_valid(vehicle) and (vehicle.engine_on or vehicle.rpm > 50.0)
	var rpm: float = vehicle.rpm if on else 0.0
	var cyl: float = float(vehicle.spec["engine"]["cylinders"]) if vehicle != null else 4.0
	var diesel: bool = vehicle != null and vehicle.spec["engine"]["fuel"] == "motorină"
	var load: float = clampf(vehicle.throttle if on else 0.0, 0.0, 1.0)
	var fire := rpm / 60.0 * cyl * 0.5
	var amp := (0.10 + 0.22 * load) if on else 0.0
	var speed: float = absf(vehicle.speed) if vehicle != null else 0.0
	var wind := clampf(speed / 40.0, 0.0, 1.0) * 0.12
	var slip := 0.0
	if vehicle != null:
		for w in vehicle._wheels:
			if w.is_in_contact():
				slip = maxf(slip, 1.0 - w.get_skidinfo())
	slip = clampf((slip - 0.25) * 1.5, 0.0, 1.0) * clampf(speed / 6.0, 0.0, 1.0) * 0.25
	var horn: bool = vehicle != null and vehicle.horn
	var cutoff := 0.08 + 0.25 * load
	for i in frames:
		var s := 0.0
		if amp > 0.0:
			for h in 4:
				_phase[h] = fmod(_phase[h] + fire * (h + 1) * 0.5 / RATE, 1.0)
				s += sin(_phase[h] * TAU) / (h + 1)
			s += (_phase[0] * 2.0 - 1.0) * 0.35
			if diesel:
				s += _rng.randf_range(-1.0, 1.0) * 0.18 * (1.0 if _phase[1] < 0.1 else 0.2)
			s *= amp
		var n := _rng.randf_range(-1.0, 1.0)
		_lp = lerpf(_lp, n, 0.05)
		s += _lp * wind * 3.0
		if slip > 0.0:
			s += sin(_phase[3] * TAU * 7.0) * slip * 0.3 + n * slip * 0.2
		if horn:
			_horn_phase[0] = fmod(_horn_phase[0] + 420.0 / RATE, 1.0)
			_horn_phase[1] = fmod(_horn_phase[1] + 510.0 / RATE, 1.0)
			s += (signf(sin(_horn_phase[0] * TAU)) + signf(sin(_horn_phase[1] * TAU))) * 0.06
		s = clampf(s * (0.6 + cutoff), -1.0, 1.0)
		_playback.push_frame(Vector2(s, s))
