import os

# --- HTML Splitting ---
with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Map block
map_start_str = '<section class="view" id="view-map">'
map_end_str = '</section>\n      <section class="view" id="view-indoor">'
map_idx1 = html.find(map_start_str)
map_idx2 = html.find(map_end_str)
map_content = html[map_idx1 + len(map_start_str):map_idx2]

# Indoor block
in_start_str = '<section class="view" id="view-indoor">'
in_end_str = '</section>\n      <section class="view" id="view-parking">'
in_idx1 = html.find(in_start_str)
in_idx2 = html.find(in_end_str)
indoor_content = html[in_idx1 + len(in_start_str):in_idx2]

# Parking block
pk_start_str = '<section class="view" id="view-parking">'
pk_end_str = '</section>\n\n    </div>'
pk_idx1 = html.find(pk_start_str)
pk_idx2 = html.find(pk_end_str)
parking_content = html[pk_idx1 + len(pk_start_str):pk_idx2]

with open('templates/map.html', 'w', encoding='utf-8') as f: f.write(map_content.strip())
with open('templates/indoor.html', 'w', encoding='utf-8') as f: f.write(indoor_content.strip())
with open('templates/parking.html', 'w', encoding='utf-8') as f: f.write(parking_content.strip())

new_html = html[:map_idx1] + \
    '<section class="view" id="view-map">\n        {% include "map.html" %}\n      </section>\n      ' + \
    '<section class="view" id="view-indoor">\n        {% include "indoor.html" %}\n      </section>\n      ' + \
    '<section class="view" id="view-parking">\n        {% include "parking.html" %}\n      </section>\n\n    </div>' + \
    html[pk_idx2 + len(pk_end_str):]

# inject css and js links
new_html = new_html.replace('<link rel="stylesheet" href="/static/style.css">', 
    '<link rel="stylesheet" href="/static/style.css">\n  <link rel="stylesheet" href="/static/map.css">\n  <link rel="stylesheet" href="/static/indoor.css">\n  <link rel="stylesheet" href="/static/parking.css">')

new_html = new_html.replace('<script src="/static/app.js"></script>',
    '<script src="/static/app.js"></script>\n<script src="/static/map.js"></script>\n<script src="/static/indoor.js"></script>\n<script src="/static/parking.js"></script>')

with open('templates/index.html', 'w', encoding='utf-8') as f: f.write(new_html)

# --- CSS Splitting ---
with open('static/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

map_css_start = css.find('/* CAMPUS MAP VIEW')
indoor_css_start = css.find('/* INDOOR VIEW')
parking_css_start = css.find('#view-parking { flex-direction: column; }')

map_css = css[map_css_start:indoor_css_start]
indoor_css = css[indoor_css_start:parking_css_start]
parking_css = css[parking_css_start:]

base_css = css[:map_css_start]

with open('static/map.css', 'w', encoding='utf-8') as f: f.write(map_css.strip())
with open('static/indoor.css', 'w', encoding='utf-8') as f: f.write(indoor_css.strip())
with open('static/parking.css', 'w', encoding='utf-8') as f: f.write(parking_css.strip())
with open('static/style.css', 'w', encoding='utf-8') as f: f.write(base_css.strip())

# --- JS Splitting ---
with open('static/app.js', 'r', encoding='utf-8') as f:
    js_lines = f.readlines()

map_js_lines = js_lines[1:231] + js_lines[308:310] + js_lines[317:340] + js_lines[363:364]
indoor_js_lines = js_lines[231:293] + js_lines[310:317] + js_lines[340:363] + js_lines[364:372]
parking_js_lines = ["// Parking JS logic goes here\n"]

app_js_lines = [js_lines[0]] + js_lines[294:308] + js_lines[372:]

with open('static/map.js', 'w', encoding='utf-8') as f: f.write("".join(map_js_lines))
with open('static/indoor.js', 'w', encoding='utf-8') as f: f.write("".join(indoor_js_lines))
with open('static/parking.js', 'w', encoding='utf-8') as f: f.write("".join(parking_js_lines))

# app.js needs slight tweaks since variables like sourceSel are no longer global to it in the same scope easily if we just cut it. Actually, wait!
# If map.js, indoor.js, parking.js are loaded AFTER app.js, then loadLocs() in app.js trying to access sourceSel will fail if sourceSel is defined in map.js with `const`.
# Let's fix app.js loadLocs inside the python script.

app_js_out = """const $ = id => document.getElementById(id);

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
loadLocs();
"""
with open('static/app.js', 'w', encoding='utf-8') as f: f.write(app_js_out)

print("Split complete!")
