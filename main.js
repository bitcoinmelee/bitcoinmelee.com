// main.js  – full flow: xpub → table → dropdown → Continue (hero in sessionStorage)
//-------------------------------------------------------------

const $ = s => document.querySelector(s);
let HEROES = [];
const ROSTER_SIZE = 12;

/* helpers */
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
function flash(t,b=false){ const m=$("#msg"); m.textContent=t; m.style.color=b?"#ff7272":"#5ef35e"; }

/* 1) Load heroes.json */
fetch("heroes.json")
  .then(r=>r.json())
  .then(d=>{ HEROES = Array.isArray(d)?d:Object.values(d); flash("Paste your xpub!"); })
  .catch(e=>flash("Could not load heroes.json ➜ "+e,true));

/* 2) Discover Heroes */
$("#go").addEventListener("click", async ()=>{
  const xpub = $("#xpub").value.trim();
  if(!xpub.startsWith("xpub")) return flash("Please paste a valid xpub.", true);
  if(!HEROES.length)          return flash("Heroes not loaded yet…", true);

  const roster = await pickRoster(xpub, ROSTER_SIZE);
  renderTable(roster);
  fillDropdown(roster);
  flash("Here are your heroes:");
});

/* Deterministic picker */
async function pickRoster(xpub,count){
  const enc=new TextEncoder(), out=[];
  for(let i=0; out.length<count; i++){
    const buf   = await crypto.subtle.digest("SHA-256", enc.encode(xpub + i));
    const num   = new DataView(buf).getUint32(0,false);
    const hero  = HEROES[num % HEROES.length];
    if(!out.includes(hero)) out.push(hero);
  }
  return out;
}

/* Render roster table */
function renderTable(list){
  const R=$("#roster"); R.innerHTML="";
  const T=document.createElement("table");
  T.className="hero-table";
  T.innerHTML=`
    <thead><tr>
      <th>Name</th><th>STR</th><th>DEX</th><th>CON</th>
      <th>INT</th><th>WIS</th><th>CHA</th><th>HP</th><th>Mana</th>
      <th>Ability</th><th>Class</th>
      <th>Faction</th><th>Kingdom</th>
    </tr></thead><tbody></tbody>`;
  const B=T.querySelector("tbody");
  list.forEach(h=>{
    B.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${cap(h.Name)}</td>
        <td>${h.Strength}</td><td>${h.Dexterity}</td><td>${h.Constitution}</td>
        <td>${h.Intelligence}</td><td>${h.Wisdom}</td><td>${h.Charisma}</td>
        <td>${h.Health}</td><td>${h.Mana}</td>
        <td>${h["Ability"]}</td><td>${h["Class"]}</td>
        <td>${h["Faction"]}</td><td>${h["Kingdom"]}</td>
      </tr>`);
  });
  R.appendChild(T);
  R.classList.remove("hidden");
}

/* Populate <select> & enable Continue */
function fillDropdown(list){
  const sel=$("#heroSel"), btn=$("#continue");
  sel.innerHTML=""; sel.disabled=false;
  list.forEach(h=>{
    sel.insertAdjacentHTML("beforeend", `<option>${cap(h.Name)}</option>`);
  });
  btn.disabled=false;
  $("#picker").classList.remove("hidden");
}

/* Continue → store hero in sessionStorage and go to quest.html */
$("#continue").addEventListener("click", ()=>{
  const hero = $("#heroSel").value;
  sessionStorage.setItem("selectedHero", hero);
  window.location.href = "quest.html";
});
