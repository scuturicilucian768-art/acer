#!/usr/bin/env python3
"""Convert an OpenStreetMap extract (.osm XML) into a Drumul Lung map file (data/maps/*.json).

Get the data (OpenStreetMap data is © OpenStreetMap contributors, ODbL — keep the attribution):
  1. openstreetmap.org → zoom to the area (e.g. Telciu) → "Export" → "Manually select a different area"
     → download map.osm. Or use Overpass Turbo / Geofabrik for bigger areas.
  2. python3 tools/osm_import.py map.osm data/maps/telciu_osm.json --name "Telciu (OSM)"
  3. In scripts/main.gd set MAP to the new file.

What is imported:
  - roads (highway=motorway/trunk/primary/secondary/tertiary/unclassified/residential/living_street/service)
    with names, refs and maxspeed (Romanian defaults when missing)
  - the longest waterway=river/stream as the valley river
  - bus stops (highway=bus_stop / public_transport=platform) as passenger stops
  - churches, town halls, schools, fuel stations as landmarks
  - villages/towns (place=*) as settlements with the 50 km/h limit

Not imported yet (planned): building footprints, terrain elevation (needs a DEM such as Copernicus GLO-30),
lanes, turn restrictions, traffic lights.
"""
import argparse
import json
import math
import sys
import xml.etree.ElementTree as ET

ROAD_TYPES = {
    "motorway": "motorway", "motorway_link": "motorway", "trunk": "national", "trunk_link": "national",
    "primary": "national", "primary_link": "national", "secondary": "county", "secondary_link": "county",
    "tertiary": "county", "tertiary_link": "county", "unclassified": "local", "residential": "local",
    "living_street": "local", "service": "local",
}
# Romanian general limits (km/h) used when a way has no maxspeed tag
DEFAULT_SPEED = {"motorway": 130, "national": 90, "county": 90, "local": 50}
PLACE_TYPES = {"church": ("amenity", "place_of_worship"), "townhall": ("amenity", "townhall"),
               "school": ("amenity", "school"), "fuel": ("amenity", "fuel")}
R_EARTH = 6371000.0


def project(lat, lon, lat0, lon0):
    """Local equirectangular projection in metres: x east, z south (the game's ground plane)."""
    x = math.radians(lon - lon0) * R_EARTH * math.cos(math.radians(lat0))
    z = -math.radians(lat - lat0) * R_EARTH
    return round(x, 2), round(z, 2)


def parse_speed(tag, road_type):
    if not tag:
        return DEFAULT_SPEED[road_type]
    digits = "".join(ch for ch in tag if ch.isdigit())
    return int(digits) if digits else DEFAULT_SPEED[road_type]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("osm")
    ap.add_argument("out")
    ap.add_argument("--name", default="Hartă importată din OpenStreetMap")
    ap.add_argument("--min-road-length", type=float, default=30.0, help="drop road pieces shorter than this (m)")
    args = ap.parse_args()

    root = ET.parse(args.osm).getroot()
    nodes = {}
    node_tags = {}
    for n in root.iter("node"):
        nodes[n.get("id")] = (float(n.get("lat")), float(n.get("lon")))
        tags = {t.get("k"): t.get("v") for t in n.iter("tag")}
        if tags:
            node_tags[n.get("id")] = tags
    if not nodes:
        sys.exit("Fișierul nu conține noduri OSM.")
    lats = [p[0] for p in nodes.values()]
    lons = [p[1] for p in nodes.values()]
    lat0 = (min(lats) + max(lats)) / 2
    lon0 = (min(lons) + max(lons)) / 2
    xy = {k: project(v[0], v[1], lat0, lon0) for k, v in nodes.items()}

    roads, rivers, used = [], [], set()
    for w in root.iter("way"):
        tags = {t.get("k"): t.get("v") for t in w.iter("tag")}
        refs = [nd.get("ref") for nd in w.iter("nd") if nd.get("ref") in xy]
        if len(refs) < 2:
            continue
        hw = tags.get("highway")
        if hw in ROAD_TYPES:
            rtype = ROAD_TYPES[hw]
            length = sum(math.dist(xy[a], xy[b]) for a, b in zip(refs, refs[1:]))
            if length < args.min_road_length:
                continue
            roads.append({"id": "w" + w.get("id"), "name": tags.get("name") or tags.get("ref") or "drum fără nume",
                          "ref": tags.get("ref", ""), "type": rtype, "speed": parse_speed(tags.get("maxspeed"), rtype),
                          "nodes": ["n" + r for r in refs]})
            used.update(refs)
        elif tags.get("waterway") in ("river", "stream"):
            length = sum(math.dist(xy[a], xy[b]) for a, b in zip(refs, refs[1:]))
            rivers.append((length, tags.get("name", "râu"), refs))

    stops, places, settlements = [], [], []
    for nid, tags in node_tags.items():
        if nid not in xy:
            continue
        p = list(xy[nid])
        if tags.get("highway") == "bus_stop" or tags.get("public_transport") == "platform":
            stops.append({"id": "s" + nid, "name": tags.get("name", "Stație"), "pos": p})
        for ptype, (k, v) in PLACE_TYPES.items():
            if tags.get(k) == v:
                places.append({"type": ptype, "name": tags.get("name", ptype), "pos": p})
        if tags.get("place") in ("village", "town", "city", "hamlet"):
            radius = {"hamlet": 400, "village": 1100, "town": 2500, "city": 6000}[tags["place"]]
            settlements.append({"name": tags.get("name", ""), "center": p, "radius": radius, "speed": 50})

    all_xy = [xy[r] for r in used] or list(xy.values())
    xs = [p[0] for p in all_xy]
    zs = [p[1] for p in all_xy]
    pad = 150
    out = {
        "id": args.out.rsplit("/", 1)[-1].replace(".json", ""),
        "name": args.name,
        "accuracy": "geometrie din OpenStreetMap",
        "source": "© OpenStreetMap contributors (ODbL). Importat cu tools/osm_import.py. Clădirile și relieful nu sunt încă importate.",
        "geo_reference": {"lat": round(lat0, 6), "lon": round(lon0, 6), "approx": False},
        "bounds": [min(xs) - pad, min(zs) - pad, max(xs) + pad, max(zs) + pad],
        "valley_half_width": max(max(xs) - min(xs), max(zs) - min(zs)),
        "settlements": settlements,
        "nodes": {"n" + r: list(xy[r]) for r in sorted(used)},
        "roads": roads,
        "river": {"name": "", "width": 10, "points": []},
        "stops": stops,
        "places": places,
        "signs": [],
    }
    if rivers:
        length, name, refs = max(rivers)
        out["river"] = {"name": name, "width": 10, "points": [list(xy[r]) for r in refs]}
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(roads)} drumuri, {len(stops)} stații, {len(places)} repere, {len(settlements)} localități → {args.out}")
    if not stops:
        print("Atenție: nicio stație de autobuz în zonă; adaugă manual în 'stops' pentru curse de pasageri.")


if __name__ == "__main__":
    main()
