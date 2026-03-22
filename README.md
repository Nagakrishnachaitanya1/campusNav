# 🚀 CampusNav – Intelligent Campus Navigation System

CampusNav is a web-based application designed to help users efficiently navigate large campus environments. It computes optimal routes between locations using graph algorithms and enhances usability with voice input and crowd-aware routing.

---

## 📌 Problem Statement
Students and visitors often struggle to locate buildings, labs, and facilities within large campuses. Traditional methods are inefficient and lack real-time guidance.

---

## 💡 Solution
CampusNav provides a simple interface where users can select a source and destination, and the system computes the most efficient route instantly.

---

## ✨ Features

### ✅ Core Features
- Select source and destination locations
- Shortest path calculation using Dijkstra’s algorithm
- Display route, total distance, and estimated time

### 🚀 Innovation Features
- 🎤 Voice Navigation (Web Speech API)
- 🧠 Crowd-Aware Routing (avoids congested paths)

---

## ⚙️ How It Works
- The campus is modeled as a graph:
  - Nodes → Locations (Library, Canteen, Labs, etc.)
  - Edges → Paths with distance and crowd values
- Route is calculated using:

  cost = distance + crowd_factor

---

## 🛠️ Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask) / Node.js
- Algorithm: Dijkstra’s Shortest Path

---

## 🖥️ Project Structure


campusNav/
│── app.py
│── graph.py
│── data/
│ └── campus.json
│── templates/
│ └── index.html
│── static/
│ ├── style.css
│ └── script.js



---

## 🚀 How to Run

1. Clone the repository

git clone <your-repo-link>


2. Navigate to project folder

cd campusNav


3. Install dependencies

pip install flask


4. Run the application

python app.py


5. Open in browser:

http://127.0.0.1:5000/


---

## 🎯 Demo Flow
1. Select source and destination  
2. Click "Find Route"  
3. View path, distance, and time  
4. Use voice input for navigation  

---

## 🚧 Future Enhancements
- Real-time crowd data integration  
- Indoor navigation support  
- Mobile application version  

---

## 📢 Conclusion
CampusNav provides a simple, efficient, and intelligent navigation system that enhances the campus experience using optimized routing and modern interaction methods.
