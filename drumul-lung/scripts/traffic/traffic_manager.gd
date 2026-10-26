class_name TrafficManager
extends Node3D
## Spawns AI cars on road lanes away from the player, links lanes at junctions so cars continue
## onto connected roads, and recycles cars that reach the edge of the map.

var network: RoadNetwork
var lanes: Array = []
var cars: Array = []
var obstacles: Array = []        # player vehicles, trailers, the player on foot (Node3D)
var focus := Vector3.ZERO        # where the player is; cars spawn away from here
var _rng := RandomNumberGenerator.new()


func setup(net: RoadNetwork, count: int) -> void:
	network = net
	lanes = net.build_lanes()
	_rng.seed = 314
	for i in count:
		var car := TrafficCar.new()
		car.manager = self
		add_child(car)
		car.setup(_rng)
		_spawn(car, false)
		cars.append(car)


func _spawn(car: TrafficCar, far_from_focus := true) -> void:
	for attempt in 30:
		var lane: Dictionary = lanes[_rng.randi() % lanes.size()]
		if not lane.get("traffic", true):
			continue
		var pts: PackedVector2Array = lane["points"]
		var idx := _rng.randi_range(0, maxi(0, pts.size() - 20))
		var p := Vector3(pts[idx].x, 0, pts[idx].y)
		if far_from_focus and p.distance_to(focus) < 180.0 and attempt < 25:
			continue
		var clear := true
		for other in cars:
			if other != car and other.global_position.distance_to(p) < 25.0:
				clear = false
				break
		if not clear:
			continue
		car.assign_lane(lane, idx)
		car.speed = 8.0
		return


func next_lane(car: TrafficCar) -> void:
	var end_node: String = car.lane["end_node"]
	var end_pos := Vector2(car.path[car.path.size() - 1].x, car.path[car.path.size() - 1].z)
	var options: Array = []
	for l in lanes:
		if l["road"] == car.lane["road"] or not l.get("traffic", true):
			continue
		if l["start_node"] == end_node:
			options.append([l, 0])
			continue
		# a road that passes through this junction: join it a little past the crossing point
		var pts: PackedVector2Array = l["points"]
		var bi := -1
		var bd := 12.0
		for i in range(0, pts.size() - 3):
			var d := pts[i].distance_to(end_pos)
			if d < bd:
				bd = d
				bi = i
		if bi >= 0:
			options.append([l, bi + 2])
	if options.is_empty():
		var road: Dictionary = network.roads[car.lane["road"]]
		if road.get("ends", {}).has(end_node):
			_spawn(car)  # the road leaves the map: reuse the car somewhere out of sight
			return
		for l in lanes:
			if l["road"] == car.lane["road"] and l["start_node"] == end_node:
				car.assign_lane(l, 0)  # dead end: turn around
				return
		_spawn(car)
		return
	var pick: Array = options[_rng.randi() % options.size()]
	car.assign_lane(pick[0], pick[1])


## Free distance ahead of a car in its lane (metres), considering every car and obstacle.
func gap_ahead(car: TrafficCar) -> float:
	var best := INF
	var fwd := car.forward()
	var p := car.global_position
	for other in cars:
		if other == car:
			continue
		best = minf(best, _gap(p, fwd, other.global_position, other.length * 0.5 + car.length * 0.5))
	for o in obstacles:
		if is_instance_valid(o) and o.is_visible_in_tree():
			best = minf(best, _gap(p, fwd, o.global_position, car.length * 0.5 + 2.5))
	return best


static func _gap(p: Vector3, fwd: Vector3, q: Vector3, half_lengths: float) -> float:
	var d := q - p
	var ahead := d.dot(fwd)
	if ahead <= 0.0 or ahead > 45.0:
		return INF
	var side := (d - fwd * ahead).length()
	if side > 2.4:
		return INF
	return ahead - half_lengths


func _physics_process(delta: float) -> void:
	for car in cars:
		car.step(delta)


func set_night(f: float) -> void:
	for car in cars:
		car.set_night(f)
