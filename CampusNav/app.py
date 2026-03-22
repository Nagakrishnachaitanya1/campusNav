from flask import Flask, request, jsonify, render_template, send_from_directory
import heapq
import os

app = Flask(__name__, template_folder="templates", static_folder="static")


graph = {
    "Main Gate":          [("Admin Block", 120, 3), ("Parking Lot", 80, 2)],
    "Admin Block":        [("Main Gate", 120, 3), ("Library", 200, 5), ("Cafeteria", 150, 7)],
    "Library":            [("Admin Block", 200, 5), ("Lecture Hall A", 100, 4), ("Engineering Block", 300, 3), ("Medical Center", 180, 2)],
    "Lecture Hall A":     [("Library", 100, 4), ("Lecture Hall B", 80, 6), ("Cafeteria", 130, 8)],
    "Lecture Hall B":     [("Lecture Hall A", 80, 6), ("Engineering Block", 150, 4), ("Sports Complex", 200, 2)],
    "Engineering Block":  [("Library", 300, 3), ("Lecture Hall B", 150, 4), ("Labs", 90, 5), ("Parking Lot", 250, 2)],
    "Labs":               [("Engineering Block", 90, 5), ("Workshop", 110, 3)],
    "Workshop":           [("Labs", 110, 3), ("Sports Complex", 180, 2)],
    "Sports Complex":     [("Lecture Hall B", 200, 2), ("Workshop", 180, 2), ("Hostel Block", 220, 4)],
    "Hostel Block":       [("Sports Complex", 220, 4), ("Cafeteria", 160, 9), ("Medical Center", 130, 3)],
    "Cafeteria":          [("Admin Block", 150, 7), ("Lecture Hall A", 130, 8), ("Hostel Block", 160, 9)],
    "Medical Center":     [("Library", 180, 2), ("Hostel Block", 130, 3), ("Parking Lot", 200, 1)],
    "Parking Lot":        [("Main Gate", 80, 2), ("Engineering Block", 250, 2), ("Medical Center", 200, 1)],
}

indoor_graph = {
    "Elevator": [("C1", 240, 2)],
    "Lab 201": [("C1", 155, 1)],
    "C1": [("Elevator", 240, 2), ("Lab 201", 155, 1), ("C2", 168, 5)],
    "Service Hub": [("C2", 145, 1)],
    "Lab 202": [("C2", 155, 1)],
    "C2": [("Service Hub", 145, 1), ("Lab 202", 155, 1), ("C1", 168, 5), ("C3", 175, 4)],
    "Lecture Hall B Indoor": [("C3", 155, 7)],
    "Red Sculpture": [("C3", 75, 3)],
    "C3": [("Lecture Hall B Indoor", 155, 7), ("Red Sculpture", 75, 3), ("C2", 175, 4), ("C4", 345, 2)],
    "Stairwell A": [("C4", 155, 1)],
    "C4": [("Stairwell A", 155, 1), ("C3", 345, 2), ("C5", 130, 2)],
    "Office 205": [("C5", 155, 1)],
    "C5": [("Office 205", 155, 1), ("C4", 130, 2)],
}

WALKING_SPEED = 80  


def dijkstra(source, destination, graph_data, route_type="balanced"):
    heap = [(0, 0, source, [source])]
    visited = set()

    # Determine crowd penalty multiplier based on route type
    crowd_multiplier = 10
    if route_type == "quickest":
        crowd_multiplier = 0
    elif route_type == "uncrowded":
        crowd_multiplier = 25

    while heap:
        cost, dist, node, path = heapq.heappop(heap)

        if node in visited:
            continue
        visited.add(node)

        if node == destination:
            return path, dist

        for neighbor, edge_dist, crowd in graph_data.get(node, []):
            if neighbor not in visited:
                new_cost = cost + edge_dist + (crowd * crowd_multiplier)
                new_dist = dist + edge_dist
                heapq.heappush(heap, (new_cost, new_dist, neighbor, path + [neighbor]))

    return None, 0


def crowd_avoided(path, graph_data):
    if len(path) < 2:
        return False
    for i in range(len(path) - 1):
        for neighbor, _, crowd in graph_data.get(path[i], []):
            if neighbor == path[i + 1] and crowd > 6:
                return True
    return False


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/locations", methods=["GET"])
def get_locations():
    graph_type = request.args.get("type", "campus")
    graph_data = indoor_graph if graph_type == "indoor" else graph
    locs = [k for k in graph_data.keys() if not k.startswith("C")]
    return jsonify({"locations": sorted(locs)})


@app.route("/route", methods=["POST"])
def find_route():
    data = request.get_json(silent=True) or {}
    source      = data.get("source", "").strip()
    destination = data.get("destination", "").strip()
    graph_type  = data.get("type", "campus")
    graph_data  = indoor_graph if graph_type == "indoor" else graph
    
    prefs       = data.get("prefs", {})
    route_type  = prefs.get("routeType", "balanced")
    speed       = int(prefs.get("walkingSpeed", WALKING_SPEED))

    if not source or not destination:
        return jsonify({"error": "Source and destination are required."}), 400

    if source not in graph_data:
        return jsonify({"error": f"Unknown location: {source}"}), 400

    if destination not in graph_data:
        return jsonify({"error": f"Unknown location: {destination}"}), 400

    if source == destination:
        return jsonify({"error": "Source and destination cannot be the same."}), 400

    path, distance = dijkstra(source, destination, graph_data, route_type)

    if path is None:
        return jsonify({"error": "No path found between the selected locations."}), 404

    time_minutes    = round(distance / speed, 1)
    avoided_crowds  = crowd_avoided(path, graph_data)

    return jsonify({
        "path":          path,
        "distance":      distance,
        "time":          time_minutes,
        "crowd_avoided": avoided_crowds
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)