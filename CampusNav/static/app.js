const $ = id => document.getElementById(id);

// Preferences Management
window.getPrefs = () => {
  const saved = localStorage.getItem("campusnav_prefs");
  return saved ? JSON.parse(saved) : {
    routeType: "balanced",
    walkingSpeed: 80,
    highContrast: false
  };
};

function applyPrefs() {
  const p = window.getPrefs();
  if (p.highContrast) document.body.classList.add("high-contrast");
  else document.body.classList.remove("high-contrast");
  
  // Update modal inputs to match saved state
  if($("pref-route-type")) $("pref-route-type").value = p.routeType;
  if($("pref-speed")) $("pref-speed").value = p.walkingSpeed;
  if($("pref-contrast")) $("pref-contrast").checked = p.highContrast;
}

async function loadLocs() {
  try {
    const d=await(await fetch("/locations")).json(), l=d.locations;
    const sourceSel = $("source"), destSel = $("destination");
    if(sourceSel && destSel) {
      l.forEach(c=>{sourceSel.append(new Option(c,c));destSel.append(new Option(c,c));});
      if(l.length>1){sourceSel.value=l[0]; destSel.value=l[3]||l[1];}
    }

    const din=await(await fetch("/locations?type=indoor")).json(), lin=din.locations;
    const inSrc=$("indoor-source"), inDst=$("indoor-dest");
    if(inSrc && inDst) {
      lin.forEach(c=>{inSrc.append(new Option(c,c));inDst.append(new Option(c,c));});
      if(lin.length>1){inSrc.value="Elevator"; inDst.value="Office 205";}
    }
  } catch(e){console.error(e);}
  if(typeof drawMap === "function") drawMap();
}

// Modal Handlers
const settingsBtn = $("settings-btn");
const settingsModal = $("settings-modal");
const closeSettings = $("close-settings");
const saveSettings = $("save-settings");

if(settingsBtn && settingsModal) {
  settingsBtn.onclick = (e) => {
    e.preventDefault();
    applyPrefs();
    settingsModal.classList.add("active");
  };
}

if(closeSettings) {
  closeSettings.onclick = () => settingsModal.classList.remove("active");
}

if(saveSettings) {
  saveSettings.onclick = () => {
    const prefs = {
      routeType: $("pref-route-type").value,
      walkingSpeed: parseInt($("pref-speed").value),
      highContrast: $("pref-contrast").checked
    };
    localStorage.setItem("campusnav_prefs", JSON.stringify(prefs));
    applyPrefs();
    settingsModal.classList.remove("active");
    // Trigger redraws if active
    if($("view-map").classList.contains("active") && typeof drawMap === "function") drawMap(window.currentRoute || []);
  };
}

// Tab Switching
document.querySelectorAll(".sb-item").forEach(tab=>{
  tab.addEventListener("click", e=>{
    e.preventDefault();
    document.querySelectorAll(".sb-item").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    const v=tab.getAttribute("data-view");
    document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
    const tgt=$(`view-${v}`); if(tgt) tgt.classList.add("active");
    if(v==="map" && typeof drawMap === "function") setTimeout(()=>drawMap(window.currentRoute || []),50);
  });
});

document.querySelectorAll(".flr").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll(".flr").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
  });
});

window.addEventListener("resize",()=>{
  if($("view-map").classList.contains("active") && typeof drawMap === "function") drawMap(window.currentRoute || []);
});

// Run
applyPrefs();
loadLocs();
