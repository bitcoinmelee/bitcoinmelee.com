// main.js  – full flow: xpub → table → dropdown → continue
//-------------------------------------------------------------

const $ = s => document.querySelector(s);
let HEROES = [];
const ROSTER_SIZE = 12;

/* helpers up front */
const cap  = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const pad  = (v,l)=>String(v).padEnd(l);
function flash(t,bad=false){ const m=$("#msg"); m.textContent=t; m.style.color=bad?"#ff7272":"#5ef35e"; }

/* ---- load heroes.json once ---- */
fetch("heroes.json")
  .then(r=>r.json())
  .then(d=>{ HEROES = Array.isArray(d)?d:Object.values(d); flash("Paste your xpub!"); })
  .catch(e=>flash("Could not load heroes.json ➜ "+e,true));

/* ---- Discover Heroes ---- */
$("#go").addEventListener("click", async ()=>{
  const xpub=$("#xpub").value.trim();
  if(!xpub.startsWith("xpub")) return flash("Please paste a valid xpub.",true);
  if(!HEROES.length)          return flash("Heroes not loaded yet…",true);

  const roster=await pickRoster(xpub,ROSTER_SIZE);
  renderTable(roster);
  fillDropdown(roster);
  flash("Here are your heroes:");
});

/* deterministic pick */
async function pickRoster(xpub,count){
  const enc=new TextEncoder(), roster=[];
  for(let i=0; roster.length<count; i++){
    const buf=await crypto.subtle.digest("SHA-256",enc.encode(xpub+i));
    const num=new DataView(buf).getUint32(0,false);
    const hero=HEROES[num%HEROES.length];
    if(!roster.includes(hero)) roster.push(hero);
  }
  return roster;
}

/* table render */
function renderTable(list){
  const rem=$("#roster"); rem.innerHTML="";
  const t=document.createElement("table");
  t.className="hero-table";
  t.innerHTML=`
    <thead><tr>
      <th>Name</th><th>STR</th><th>DEX</th><th>CON</th>
      <th>INT</th><th>WIS</th><th>CHA</th><th>HP</th><th>MP</th>
      <th>Common Ability</th><th>Rare Ability</th>
    </tr></thead><tbody></tbody>`;
  const tb=t.querySelector("tbody");
  list.forEach(h=>{
    tb.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${cap(h.Name)}</td>
        <td>${h.Strength}</td><td>${h.Dexterity}</td><td>${h.Constitution}</td>
        <td>${h.Intelligence}</td><td>${h.Wisdom}</td><td>${h.Charisma}</td>
        <td>${h.Health}</td><td>${h.Mana}</td>
        <td>${h["Common Ability"]}</td><td>${h["Rare Ability"]}</td>
      </tr>`);
  });
  rem.appendChild(t); rem.classList.remove("hidden");
}

/* dropdown + button logic */
function fillDropdown(list){
  const sel=$("#heroSel"); sel.innerHTML=""; sel.disabled=false;
  list.forEach(h=>{
    sel.insertAdjacentHTML("beforeend",`<option>${cap(h.Name)}</option>`);
  });
  $("#continue").disabled=false;
  $("#picker").classList.remove("hidden");
}

   /* Continue button → quest page */
+  $("#continue").addEventListener("click", () => {
+    // store selection in sessionStorage instead of URL
+    const hero = $("#heroSel").value;
+    sessionStorage.setItem("selectedHero", hero);
+    window.location.href = "quest.html";
+  });
