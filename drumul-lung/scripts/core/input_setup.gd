extends Node
## Builds the whole input map in code (keyboard + gamepad), so the project needs no editor-made input map.
## Touch buttons (scripts/ui/touch_controls.gd) press these same actions.

const KEYBOARD := {
	"accelerate": [KEY_W, KEY_UP],
	"brake": [KEY_S, KEY_DOWN],
	"steer_left": [KEY_A, KEY_LEFT],
	"steer_right": [KEY_D, KEY_RIGHT],
	"handbrake": [KEY_SPACE],
	"parking_brake": [KEY_P],
	"clutch": [KEY_SHIFT],
	"run": [KEY_SHIFT],
	"gear_up": [KEY_Q],
	"gear_down": [KEY_Z],
	"engine": [KEY_E],
	"interact": [KEY_F],
	"doors": [KEY_O],
	"trailer": [KEY_T],
	"lights": [KEY_L],
	"camera": [KEY_C],
	"horn": [KEY_H],
	"action": [KEY_X],
	"reset_vehicle": [KEY_R],
	"map": [KEY_M],
	"jobs": [KEY_J],
	"menu": [KEY_ESCAPE, KEY_TAB],
}

const PAD_BUTTONS := {
	"interact": [JOY_BUTTON_Y],
	"action": [JOY_BUTTON_A],
	"handbrake": [JOY_BUTTON_X],
	"clutch": [JOY_BUTTON_B],
	"gear_up": [JOY_BUTTON_RIGHT_SHOULDER],
	"gear_down": [JOY_BUTTON_LEFT_SHOULDER],
	"camera": [JOY_BUTTON_RIGHT_STICK],
	"horn": [JOY_BUTTON_LEFT_STICK],
	"doors": [JOY_BUTTON_DPAD_UP],
	"trailer": [JOY_BUTTON_DPAD_DOWN],
	"lights": [JOY_BUTTON_DPAD_LEFT],
	"engine": [JOY_BUTTON_DPAD_RIGHT],
	"map": [JOY_BUTTON_BACK],
	"menu": [JOY_BUTTON_START],
}

const PAD_AXES := {
	"steer_left": [JOY_AXIS_LEFT_X, -1.0],
	"steer_right": [JOY_AXIS_LEFT_X, 1.0],
	"accelerate": [JOY_AXIS_TRIGGER_RIGHT, 1.0],
	"brake": [JOY_AXIS_TRIGGER_LEFT, 1.0],
	"look_left": [JOY_AXIS_RIGHT_X, -1.0],
	"look_right": [JOY_AXIS_RIGHT_X, 1.0],
	"look_up": [JOY_AXIS_RIGHT_Y, -1.0],
	"look_down": [JOY_AXIS_RIGHT_Y, 1.0],
}

## Labels shown in the UI for each action (keyboard).
const LABELS := {
	"accelerate": "W / ↑", "brake": "S / ↓", "steer_left": "A / ←", "steer_right": "D / →",
	"handbrake": "Spațiu", "parking_brake": "P", "clutch": "Shift", "gear_up": "Q", "gear_down": "Z",
	"engine": "E", "interact": "F", "doors": "O", "trailer": "T", "lights": "L", "camera": "C",
	"horn": "H", "action": "X", "reset_vehicle": "R", "map": "M", "jobs": "J", "menu": "Esc",
}


func _ready() -> void:
	for action in KEYBOARD:
		_ensure(action)
		for key in KEYBOARD[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
	for action in PAD_BUTTONS:
		_ensure(action)
		for button in PAD_BUTTONS[action]:
			var ev := InputEventJoypadButton.new()
			ev.button_index = button
			InputMap.action_add_event(action, ev)
	for action in PAD_AXES:
		_ensure(action)
		var ev := InputEventJoypadMotion.new()
		ev.axis = PAD_AXES[action][0]
		ev.axis_value = PAD_AXES[action][1]
		InputMap.action_add_event(action, ev)


func _ensure(action: String) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action, 0.2)


func label(action: String) -> String:
	return LABELS.get(action, action)
