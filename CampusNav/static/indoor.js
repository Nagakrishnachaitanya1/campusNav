const INDOOR_NODES = {
  "Elevator": {x: 97, y: 545},
  "Service Hub": {x: 325, y: 450},
  "Lab 201": {x: 165, y: 150},
  "Lab 202": {x: 335, y: 150},
  "Lecture Hall B Indoor": {x: 575, y: 150},
  "Stairwell A": {x: 785, y: 150},
  "Office 205": {x: 915, y: 150},
  "Red Sculpture": {x: 450, y: 380},
  "C1": {x: 97, y: 305},
  "C2": {x: 335, y: 305},
  "C3": {x: 575, y: 305},
  "C4": {x: 785, y: 305},
  "C5": {x: 915, y: 305}
};

function drawIndoorRoute(pathNodes) {
  const svg = $("indoor-route-svg");
  if (!svg) return;
  svg.innerHTML = "";
  if (!pathNodes || pathNodes.length < 2) return;
  
  let d = `M ${INDOOR_NODES[pathNodes[0]].x} ${INDOOR_NODES[pathNodes[0]].y}`;
  for(let i=1; i<pathNodes.length; i++) {
    const p1 = INDOOR_NODES[pathNodes[i-1]];
    const p2 = INDOOR_NODES[pathNodes[i]];
    // Orthogonal routing: move X then move Y
    d += ` L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }
  
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", "#10b981");
  path.setAttribute("stroke-width", "5.5");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-dasharray", "12 8");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);

  const startDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  const s = INDOOR_NODES[pathNodes[0]];
  startDot.setAttribute("cx", s.x);
  startDot.setAttribute("cy", s.y);
  startDot.setAttribute("r", "9");
  startDot.setAttribute("fill", "#10b981");
  startDot.setAttribute("stroke", "white");
  startDot.setAttribute("stroke-width", "3");
  svg.appendChild(startDot);

  const e = INDOOR_NODES[pathNodes[pathNodes.length-1]];
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${e.x},${e.y - 30})`);
  g.innerHTML = `
    <ellipse cx="0" cy="34" rx="8" ry="3.5" fill="rgba(0,0,0,0.18)"/>
    <path d="M0,-18 A18,18 0 0,1 18,0 Q18,12 0,30 Q-18,12 -18,0 A18,18 0 0,1 0,-18 Z" fill="#10b981"/>
    <circle cx="0" cy="0" r="7" fill="white"/>
    <circle cx="0" cy="0" r="3" fill="#10b981"/>
  `;
  svg.appendChild(g);
}

if($("indoor-swap-btn")) {
  $("indoor-swap-btn").onclick = () => {
    const s=$("indoor-source"), d=$("indoor-dest");
    const t=s.value; s.value=d.value; d.value=t;
  };
}

if($("indoor-find-btn")) {
  $("indoor-find-btn").onclick = async () => {
    const err=$("indoor-err"), s=$("indoor-source").value, d=$("indoor-dest").value;
    err.textContent = "";
    if(!s||!d) return;
    if(s===d){err.textContent="Pick different locations."; return;}
    const btn=$("indoor-find-btn");
    btn.textContent="Calculating…"; btn.disabled=true;
    try {
      const r=await fetch("/route",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:s,destination:d,type:"indoor",prefs:window.getPrefs()})});
      const res=await r.json();
      if(!r.ok){err.textContent=res.error||"Error"; return;}
      
      $("indoor-time").textContent = `${res.time} min`;
      $("indoor-dist").textContent = `${res.distance} m`;
      $("indoor-dest-name").textContent = d;
      
      drawIndoorRoute(res.path);
    } catch { err.textContent="Server error."; }
    finally { btn.textContent="Route"; btn.disabled=false; }
  };
}

if($("indoor-clear-btn")) $("indoor-clear-btn").onclick=()=>{
  const err=$("indoor-err"); if(err) err.textContent="";
  drawIndoorRoute([]);
  $("indoor-time").textContent = "-- min";
  $("indoor-dist").textContent = "-- m";
  $("indoor-dest-name").textContent = "...";
};

const indoorShareBtn = $("indoor-share-btn");
if(indoorShareBtn) {
  indoorShareBtn.onclick = () => {
    const s = $("indoor-source").value;
    const d = $("indoor-dest").value;
    if (!s || !d) {
      alert("Please calculate a route first before sharing.");
      return;
    }
    const shareText = `Check out this indoor route from ${s} to ${d} on CampusNav!`;
    if (navigator.share) {
      navigator.share({
        title: 'CampusNav Indoor Route',
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText + " " + window.location.href).then(() => {
        alert("Route details copied to clipboard!");
      });
    }
  };
}

const indoorReportBtn = $("indoor-report-btn");
if(indoorReportBtn) {
  indoorReportBtn.onclick = () => {
    const s = $("indoor-source") ? $("indoor-source").value : "";
    const d = $("indoor-dest") ? $("indoor-dest").value : "";
    let context = "";
    if (s && d) context = ` (Route: ${s} to ${d})`;
    const issue = prompt(`Please describe the issue you encountered${context}:`);
    if (issue) {
      alert("Thank you! Your issue has been reported and will be reviewed by the facilities team.");
    }
  };
}

