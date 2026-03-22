const sourceSel  = $("source");
const destSel    = $("destination");
const findBtn    = $("find-btn");
const swapBtn    = $("swap-btn");
const resultSec  = $("result-section");
const resDist    = $("result-distance");
const resTime    = $("result-time");
const pathDisp   = $("path-display");
const crowdBadge = $("crowd-badge");
const routeErr   = $("route-err");
const clearBtn   = $("clear-route-btn");
const unionCard  = $("union-section");
const cvs        = $("campus-map");
const ctx        = cvs.getContext("2d");

const W  = () => cvs.width;
const H  = () => cvs.height;
const sx = v => v / 900 * W();
const sy = v => v / 560 * H();
const sr = v => v / 900 * W();
const xL=140, xC=340, xR=540;
const yT=38,  yM1=155, yM2=240, yB=395;
const ANCHOR = {
  "Medical Center":    {x:80,  y:109},
  "Admin Block":       {x:80,  y:197},
  "Parking Lot":       {x:80,  y:292},
  "Main Gate":         {x:80,  y:427},
  "Library":           {x:217, y:112},
  "Cafeteria":         {x:217, y:287},
  "Lecture Hall A":    {x:440, y:112},
  "Engineering Block": {x:440, y:287},
  "Sports Complex":    {x:615, y:67},
  "Lecture Hall B":    {x:615, y:127},
  "Workshop":          {x:615, y:185},
  "Labs":              {x:615, y:287},
  "Hostel Block":      {x:487, y:431},
};
const BUILDINGS = [
  {n:"Medical Center",    b:[40,  82,  80,  55,  5]},
  {n:"Admin Block",       b:[40,  170, 80,  55,  5]},
  {n:"Parking Lot",       b:[40,  260, 80,  65,  5]},
  {n:"Main Gate",         b:[40,  400, 80,  55,  5]},
  {n:"Library",           b:[160, 82,  115, 60,  5]},
  {n:"Cafeteria",         b:[160, 255, 115, 65,  5]},
  {n:"Lecture Hall A",    b:[375, 82,  130, 60,  5]},
  {n:"Engineering Block", b:[375, 255, 130, 65,  5]},
  {n:"Hostel Block",      b:[375, 410, 235, 42,  4]},
  {n:"Sports Complex",    b:[562, 40,  98,  55,  5]},
  {n:"Lecture Hall B",    b:[562, 100, 98,  55,  5]},
  {n:"Workshop",          b:[562, 158, 98,  55,  5]},
  {n:"Labs",              b:[562, 255, 98,  65,  5]},
];
const GRASS = [
  {pts:[[160,155],[340,155],[340,255],[160,255]]},
  {pts:[[375,155],[540,155],[540,255],[375,255]]},
];
const ROADS = [
  [[xL, yT],[xL, 465]],
  [[xC, yT],[xC, 465]],
  [[xR, yT],[xR, 465]],
  [[14, yT], [668, yT]],
  [[14, yM1],[668, yM1]],
  [[14, yM2],[668, yM2]],
  [[14, yB], [668, yB]],
];
const TREES = [
  [190,185,6],[220,190,7],[260,188,6],[300,185,7],[190,230,7],[240,235,6],[295,230,7],
  [390,185,6],[430,190,7],[475,185,6],[510,190,7],[400,230,6],[455,235,7],[505,230,6],
  [55,135,5],[55,395,5],[55,440,5],
  [660,195,5],[660,240,6],[660,395,5],
  [230,420,5],[300,425,6],[340,420,5],
];

const EDGES = {
  "Main Gate|Parking Lot":         [[80,400],[xL,400],[xL,292],[80,292]],
  "Main Gate|Admin Block":         [[80,400],[xL,400],[xL,197],[80,197]],
  "Parking Lot|Admin Block":       [[80,260],[xL,260],[xL,197],[80,197]],
  "Parking Lot|Medical Center":    [[80,260],[xL,260],[xL,109],[80,109]],
  "Parking Lot|Engineering Block": [[80,292],[xL,292],[xL,yM2],[xC,yM2],[440,yM2],[440,255]],
  "Admin Block|Library":           [[80,197],[xL,197],[xL,yM1],[217,yM1],[217,142]],
  "Admin Block|Cafeteria":         [[80,197],[xL,197],[xL,287],[217,287]],
  "Library|Medical Center":        [[217,112],[xL,112],[80,112]],
  "Library|Lecture Hall A":        [[217,112],[440,112]],
  "Library|Engineering Block":     [[217,142],[xC,142],[xC,287],[440,287]],
  "Lecture Hall A|Lecture Hall B": [[440,112],[xR,112],[xR,127],[615,127]],
  "Lecture Hall A|Cafeteria":      [[440,112],[440,yM1],[217,yM1],[217,255]],
  "Lecture Hall B|Engineering Block": [[615,127],[xR,127],[xR,287],[440,287]],
  "Lecture Hall B|Sports Complex": [[615,127],[xR,127],[xR,67],[615,67]],
  "Engineering Block|Labs":        [[440,287],[xR,287],[615,287]],
  "Engineering Block|Parking Lot": [[440,255],[xC,255],[xC,yM2],[xL,yM2],[xL,292],[80,292]],
  "Labs|Workshop":                 [[615,255],[xR,255],[xR,185],[615,185]],
  "Workshop|Sports Complex":       [[615,185],[xR,185],[xR,67],[615,67]],
  "Sports Complex|Hostel Block":   [[615,67],[xR,67],[xR,yB],[487,yB],[487,410]],
  "Hostel Block|Cafeteria":        [[487,410],[xC,410],[xC,287],[217,287]],
  "Hostel Block|Medical Center":   [[487,410],[xL,410],[xL,109],[80,109]],
  "Medical Center|Parking Lot":    [[80,109],[xL,109],[xL,292],[80,292]],
};

const getEdge = (a,b) => {
  if (EDGES[`${a}|${b}`]) return EDGES[`${a}|${b}`];
  if (EDGES[`${b}|${a}`]) return [...EDGES[`${b}|${a}`]].reverse();
  return null;
};
const buildLine = p => {
  const pts = [];
  for (let i = 0; i < p.length - 1; i++) {
    const w = getEdge(p[i], p[i+1]);
    if (w) pts.push(...(i === 0 ? w : w.slice(1)));
  }
  return pts;
};

let currentRoute = [];

function drawMap(hl = []) {
  const p = cvs.parentElement;
  cvs.width  = p.clientWidth;
  cvs.height = p.clientHeight || 500;

  ctx.fillStyle = "#141d2b";
  ctx.fillRect(0, 0, W(), H());

  GRASS.forEach(({pts}) => {
    ctx.beginPath();
    pts.forEach(([px,py],i) => i===0 ? ctx.moveTo(sx(px),sy(py)) : ctx.lineTo(sx(px),sy(py)));
    ctx.closePath();
    ctx.fillStyle = "#1a2e20";
    ctx.fill();
    ctx.strokeStyle = "rgba(60,110,70,0.25)";
    ctx.lineWidth = sr(1);
    ctx.stroke();
  });

  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ROADS.forEach(pts => {
    ctx.beginPath();
    pts.forEach(([px,py],i) => i===0 ? ctx.moveTo(sx(px),sy(py)) : ctx.lineTo(sx(px),sy(py)));
    ctx.strokeStyle = "#1f2e42"; ctx.lineWidth = sr(22); ctx.stroke();
    ctx.strokeStyle = "#2e4260"; ctx.lineWidth = sr(16); ctx.stroke();
  });

  TREES.forEach(([tx,ty,tr]) => {
    const cx2=sx(tx), cy2=sy(ty), r=sr(tr);
    ctx.beginPath(); ctx.ellipse(cx2, cy2+r*0.9, r*0.7, r*0.25, 0, 0, Math.PI*2);
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fill();
    const g = ctx.createRadialGradient(cx2-r*.25, cy2-r*.25, r*.05, cx2, cy2, r);
    g.addColorStop(0, "#2e5c3e"); g.addColorStop(0.6, "#224530"); g.addColorStop(1, "#162c1f");
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(cx2-r*.22, cy2-r*.22, r*.2, 0, Math.PI*2);
    ctx.fillStyle = "rgba(80,160,90,0.18)"; ctx.fill();
  });

  BUILDINGS.forEach(({n, b:[bx,by,bw,bh,cr]}) => {
    const x=sx(bx), y=sy(by), w=sx(bx+bw)-sx(bx), h=sy(by+bh)-sy(by), r=sr(cr);
    ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = sr(12);
    ctx.shadowOffsetX = sr(2); ctx.shadowOffsetY = sr(5);
    rRect(x,y,w,h,r); ctx.fillStyle = "#1e2d3e"; ctx.fill();
    ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
    rRect(x+sr(2), y+sr(2), w-sr(4), h-sr(4), Math.max(1,r-1));
    ctx.fillStyle = "#3a5068"; ctx.fill();
    rRect(x+w*.1, y+h*.1, w*.80, h*.78, Math.max(1,r-2));
    ctx.fillStyle = "#435e78"; ctx.fill();
    ctx.strokeStyle = "rgba(140,185,230,0.22)"; ctx.lineWidth = sr(1.5);
    rRect(x+.5, y+.5, w-1, h-1, r); ctx.stroke();
    const fs = Math.max(9, Math.round(sr(9.5)));
    ctx.font = `600 ${fs}px Inter,sans-serif`;
    ctx.fillStyle = "#c8dff0"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const words = n.split(" "), mw = w * .82;
    if (words.length > 1 && ctx.measureText(n).width > mw) {
      const m = Math.ceil(words.length/2), lh = fs*1.35;
      ctx.fillText(words.slice(0,m).join(" "), x+w/2, y+h/2 - lh*.38);
      ctx.fillText(words.slice(m).join(" "),   x+w/2, y+h/2 + lh*.52);
    } else ctx.fillText(n, x+w/2, y+h/2);
    ctx.textBaseline = "alphabetic";
  });

  if (hl.length > 1) {
    const wpts = buildLine(hl);
    if (wpts.length) {
      const draw = () => {
        ctx.beginPath();
        wpts.forEach(([px,py],i) => i===0 ? ctx.moveTo(sx(px),sy(py)) : ctx.lineTo(sx(px),sy(py)));
      };
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(59,130,246,.4)"; ctx.shadowBlur = sr(14);
      draw(); ctx.strokeStyle = "rgba(59,130,246,.3)"; ctx.lineWidth = sr(14); ctx.stroke();
      ctx.shadowBlur = 0;
      draw(); ctx.strokeStyle = "#1d3a7a"; ctx.lineWidth = sr(9);  ctx.stroke();
      draw(); ctx.strokeStyle = "#4a90f5"; ctx.lineWidth = sr(6.5); ctx.stroke();
      const s = ANCHOR[hl[0]], e = ANCHOR[hl[hl.length-1]];
      if (s) drawStartPin(sx(s.x), sy(s.y));
      if (e) drawEndPin(sx(e.x), sy(e.y));
    }
    if (unionCard) unionCard.classList.remove("hidden");
  } else {
    if (unionCard) unionCard.classList.add("hidden");
  }
}

function rRect(x,y,w,h,r=4) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function drawStartPin(cx, cy) {
  const r = sr(9);
  ctx.beginPath(); ctx.arc(cx,cy,r+sr(4),0,Math.PI*2);
  ctx.fillStyle="rgba(74,144,245,.2)"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle="#3b82f6"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*.55,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*.2,0,Math.PI*2); ctx.fillStyle="#3b82f6"; ctx.fill();
}

function drawEndPin(cx, cy) {
  const r = sr(13);
  ctx.shadowColor="rgba(0,0,0,.5)"; ctx.shadowBlur=sr(8); ctx.shadowOffsetY=sr(3);
  ctx.beginPath();
  ctx.arc(cx, cy-r*.35, r, Math.PI, 0);
  ctx.bezierCurveTo(cx+r, cy-r*.35+r, cx, cy+r*1.5, cx, cy+r*1.5);
  ctx.bezierCurveTo(cx, cy+r*1.5, cx-r, cy-r*.35+r, cx-r, cy-r*.35);
  ctx.fillStyle="#3b82f6"; ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  ctx.beginPath(); ctx.arc(cx,cy-r*.35,r*.42,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
}

swapBtn.onclick = () => { const t=sourceSel.value; sourceSel.value=destSel.value; destSel.value=t; };

findBtn.onclick = async () => {
  routeErr.textContent = "";
  const s=sourceSel.value, d=destSel.value;
  if(!s||!d) return;
  if(s===d){routeErr.textContent="Pick different locations."; return;}
  findBtn.textContent="Calculating…"; findBtn.disabled=true;
  try {
    const r=await fetch("/route",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:s,destination:d,type:"campus",prefs:window.getPrefs()})});
    const res=await r.json();
    if(!r.ok){routeErr.textContent=res.error||"Error"; return;}
    resTime.textContent=res.time; resDist.textContent=`${res.distance} m`;
    crowdBadge.textContent=res.crowd_avoided?"✓ CROWD-OPTIMIZED":"DIRECT ROUTE";
    crowdBadge.className=`rc-badge ${res.crowd_avoided?"crowd":"normal"}`;
    pathDisp.innerHTML="";
    res.path.forEach((n,i)=>{
      if(i>0){const a=document.createElement("span"); a.className="path-arrow"; a.textContent="→"; pathDisp.appendChild(a);}
      const e=document.createElement("span"); e.className="path-node"; e.textContent=n; pathDisp.appendChild(e);
    });
    currentRoute=res.path; resultSec.classList.remove("hidden"); drawMap(res.path);
  } catch { routeErr.textContent="Cannot connect to server."; }
  finally { findBtn.innerHTML="ROUTE ME &nbsp;➤"; findBtn.disabled=false; }
};

if(clearBtn) clearBtn.onclick=()=>{resultSec.classList.add("hidden"); currentRoute=[]; drawMap();};
