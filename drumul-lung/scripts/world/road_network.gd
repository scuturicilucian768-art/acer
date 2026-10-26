class_name RoadNetwork
extends RefCounted
## Road graph loaded from a map JSON (data/maps/*.json): smoothed road geometry, lanes for traffic,
## speed limits and shortest-path routing for the GPS.
## Coordinates are metres on the ground plane: Vector2(x, z), x = east, z = south.

const WIDTH := {"motorway": 11.0, "national": 7.4, "county": 6.5, "local": 5.6}
const LANE_OFFSET := {"motorway": 2.8, "national": 1.85, "county": 1.6, "local": 1.4}

var map: Dictionary = {}
var nodes: Dictionary = {}          # id -> Vector2
var roads: Array = []               # [{id, name, type, speed, nodes, points, node_index, width}]
var adjacency: Dictionary = {}      # id -> Array of {to, cost, road}
var stops: Dictionary = {}          # id -> {id, name, pos: Vector2}
var settlements: Array = []


func load_map(path: String) -> bool:
	var data = JSON.parse_string(FileAccess.get_file_as_string(path))
	if not (data is Dictionary):
		push_error("Hartă invalidă: " + path)
		return false
	map = data
	for id in map["nodes"]:
		var p = map["nodes"][id]
		nodes[id] = Vector2(p[0], p[1])
	for r in map["roads"]:
		var road: Dictionary = r.duplicate(true)
		var sampled := _spline(r["nodes"])
		road["points"] = sampled[0]
		road["node_index"] = sampled[1]
		road["width"] = WIDTH.get(r["type"], 6.0)
		road["lane_offset"] = LANE_OFFSET.get(r["type"], 1.5)
		roads.append(road)
		for i in range(r["nodes"].size() - 1):
			var a: String = r["nodes"][i]
			var b: String = r["nodes"][i + 1]
			var cost := _length(road["points"], road["node_index"][i], road["node_index"][i + 1])
			_link(a, b, cost, roads.size() - 1)
			_link(b, a, cost, roads.size() - 1)
	for s in map.get("stops", []):
		stops[s["id"]] = {"id": s["id"], "name": s["name"], "pos": Vector2(s["pos"][0], s["pos"][1])}
	for s in map.get("settlements", []):
		settlements.append({"name": s["name"], "center": Vector2(s["center"][0], s["center"][1]), "radius": float(s["radius"]), "speed": int(s.get("speed", 50))})
	return true


func _link(a: String, b: String, cost: float, road: int) -> void:
	if not adjacency.has(a):
		adjacency[a] = []
	adjacency[a].append({"to": b, "cost": cost, "road": road})


static func _length(pts: PackedVector2Array, i0: int, i1: int) -> float:
	var d := 0.0
	for i in range(mini(i0, i1), maxi(i0, i1)):
		d += pts[i].distance_to(pts[i + 1])
	return d


## Catmull-Rom (chordal knots) through every node, sampled about every 4 m.
## Returns [points, node_index] where node_index[k] is the sample index of the k-th node.
func _spline(ids: Array) -> Array:
	var pts: Array = []
	for id in ids:
		pts.append(nodes[id])
	var out := PackedVector2Array()
	var node_index: Array = []
	for i in range(pts.size() - 1):
		var p0: Vector2 = pts[maxi(i - 1, 0)]
		var p1: Vector2 = pts[i]
		var p2: Vector2 = pts[i + 1]
		var p3: Vector2 = pts[mini(i + 2, pts.size() - 1)]
		var d01 := maxf(p0.distance_to(p1), 1.0)
		var d12 := maxf(p1.distance_to(p2), 1.0)
		var d23 := maxf(p2.distance_to(p3), 1.0)
		node_index.append(out.size())
		var n := maxi(2, int(d12 / 4.0))
		for k in range(n):
			var t := float(k) / n
			out.append(p1.cubic_interpolate_in_time(p2, p0, p3, t, d12, -d01, d12 + d23))
	node_index.append(out.size())
	out.append(pts[-1])
	return [out, node_index]


## Closest point on any road: {road, index, point, dist, dir}
func nearest_on_road(p: Vector2) -> Dictionary:
	var best := {"road": -1, "index": 0, "point": p, "dist": INF, "dir": Vector2.UP}
	for ri in roads.size():
		var pts: PackedVector2Array = roads[ri]["points"]
		for i in range(pts.size() - 1):
			var q := Geometry2D.get_closest_point_to_segment(p, pts[i], pts[i + 1])
			var d := q.distance_to(p)
			if d < best["dist"]:
				best = {"road": ri, "index": i, "point": q, "dist": d, "dir": (pts[i + 1] - pts[i]).normalized()}
	return best


func distance_to_roads(p: Vector2, skip_step := 1) -> float:
	var best := INF
	for r in roads:
		var pts: PackedVector2Array = r["points"]
		var hw: float = r["width"] * 0.5
		for i in range(0, pts.size() - 1, skip_step):
			best = minf(best, Geometry2D.get_closest_point_to_segment(p, pts[i], pts[i + 1]).distance_to(p) - hw)
	return best


func in_settlement(p: Vector2) -> Dictionary:
	for s in settlements:
		if p.distance_to(s["center"]) < s["radius"]:
			return s
	return {}


## Speed limit in km/h for a road at a position (settlement limit applies inside localities).
func speed_limit(road_index: int, p: Vector2) -> int:
	if road_index < 0:
		return 50
	var road: Dictionary = roads[road_index]
	var s := in_settlement(p)
	if not s.is_empty():
		return mini(int(road["speed"]), int(s["speed"]))
	return int(road["speed"])


func nearest_node(p: Vector2) -> String:
	var best := ""
	var bd := INF
	for id in adjacency:
		var d: float = nodes[id].distance_to(p)
		if d < bd:
			bd = d
			best = id
	return best


## Shortest path along the road graph between two positions, as a polyline of road samples.
func route(from: Vector2, to: Vector2) -> PackedVector2Array:
	var a := nearest_node(from)
	var b := nearest_node(to)
	var out := PackedVector2Array([from])
	if a == "" or b == "":
		out.append(to)
		return out
	var dist := {a: 0.0}
	var prev := {}
	var prev_road := {}
	var open := [a]
	var done := {}
	while not open.is_empty():
		var best_i := 0
		for i in open.size():
			if dist[open[i]] < dist[open[best_i]]:
				best_i = i
		var u: String = open[best_i]
		open.remove_at(best_i)
		if done.has(u):
			continue
		done[u] = true
		if u == b:
			break
		for e in adjacency.get(u, []):
			var nd: float = dist[u] + e["cost"]
			if nd < dist.get(e["to"], INF):
				dist[e["to"]] = nd
				prev[e["to"]] = u
				prev_road[e["to"]] = e["road"]
				open.append(e["to"])
	if not dist.has(b):
		out.append(to)
		return out
	var chain: Array = [b]
	while chain[0] != a:
		chain.push_front(prev[chain[0]])
	for i in range(chain.size() - 1):
		var road: Dictionary = roads[prev_road[chain[i + 1]]]
		var k0: int = road["nodes"].find(chain[i])
		var k1: int = road["nodes"].find(chain[i + 1])
		var i0: int = road["node_index"][k0]
		var i1: int = road["node_index"][k1]
		var step := 1 if i1 > i0 else -1
		var j := i0
		while j != i1:
			out.append(road["points"][j])
			j += step
		out.append(road["points"][i1])
	out.append(to)
	return out


static func polyline_length(pts: PackedVector2Array) -> float:
	var d := 0.0
	for i in range(pts.size() - 1):
		d += pts[i].distance_to(pts[i + 1])
	return d


## Lanes for traffic: right-hand traffic, each road gives a forward and a backward lane.
## Returns [{road, points: PackedVector2Array, start_node, end_node, speed}]
func build_lanes() -> Array:
	var lanes: Array = []
	for ri in roads.size():
		var road: Dictionary = roads[ri]
		var pts: PackedVector2Array = road["points"]
		var off: float = road["lane_offset"]
		for dir in [1, -1]:
			var lane := PackedVector2Array()
			var n := pts.size()
			for k in n:
				var i := k if dir == 1 else n - 1 - k
				var a := pts[maxi(i - dir, 0) if dir == 1 else mini(i + 1, n - 1)]
				var b := pts[mini(i + 1, n - 1) if dir == 1 else maxi(i - 1, 0)]
				var t := (b - a).normalized()
				var right := Vector2(-t.y, t.x)
				lane.append(pts[i] + right * off)
			lanes.append({"road": ri, "points": lane,
				"start_node": road["nodes"][0] if dir == 1 else road["nodes"][-1],
				"end_node": road["nodes"][-1] if dir == 1 else road["nodes"][0],
				"speed": int(road["speed"]), "traffic": bool(road.get("traffic", true))})
	return lanes
