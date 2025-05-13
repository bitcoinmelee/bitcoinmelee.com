// main.js  – Table roster display + hero picker
//-------------------------------------------------------------

const $ = sel => document.querySelector(sel);
let HEROES = [];
const ROSTER_SIZE = 12;

// 1) Load heroes.json
fetch("heroes.json")
  .then(r => r.json())
  .then(data => {
    HEROES = Array.isArray(data) ? data : Object.values(data);
    flash("Paste your xpub!");
  })
  .catch(err => flash("Could not load heroes.json ➜ " + err, true));

// 2) Discover Heroes button
$("#go").addEventListener("click", async () => {
  const xpub = $("#xpub").value.trim();
  if (!xpub.startsWith("xpub")) return flash("Please paste a valid xpub.", true);
  if (HEROES.length === 0)      return flash("Heroes not loaded yet…", true);

  const roster = await pickRoster(xpub, ROSTER_SIZE);
  renderTable(roster);
  populateDropdown(roster);
  flash("Here are your heroes:");
});

//-------------------------------------------------------------
// Deterministic roster picker
async function pickRoster(xpub, count) {
  const enc = new TextEncoder();
  const roster = [];
  for (let i = 0; roster.length < count; i++) {
    const buf  = await crypto.subtle.digest("SHA-256", enc.encode(xpub + i));
    const num  = new DataView(buf).getUint32(0, false);
    const hero = HEROES[num % HEROES.length];
    if (!roster.includes(hero)) roster.push(hero);
  }
  return roster;
}

//-------------------------------------------------------------
// Render hero table
function renderTable(list) {
  const rosterEl = $("#roster");
  rosterEl.innerHTML = "";

  const table = document.createElement("table");
  table.className = "hero-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th><th>STR</th><th>DEX</th><th>CON</th>
        <th>INT</th><th>WIS</th><th>CHA</th><th>HP</th><th>MP</th>
        <th>Common Ability</th><th>Rare Ability</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  list.forEach(h => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cap(h.Name)}</td>
      <td>${h.Strength}</td>
      <td>${h.Dexterity}</td>
      <td>${h.Constitution}</td>
      <td>${h.Intelligence}</td>
      <td>${h.Wisdom}</td>
      <td>${h.Charisma}</td>
      <td>${h.Health}</td>
      <td>${h.Mana}</td>
      <td>${h["Common Ability"]}</td>
      <td>${h["Rare Ability"]}</td>
    `;
    tbody.appendChild(row);
  });

  rosterEl.appendChild(table);
  rosterEl.classList.remove("hidden");
}

//-------------------------------------------------------------
// Populate hero dropdown and reveal picker
function populateDropdown(list){
  const sel = $("#heroSel");
  sel.innerHTML = "";
  list.forEach(h => {
    const opt = document.createElement("option");
    opt.textContent = cap(h.Name);
    sel.appendChild(opt);
  });
  $("#picker").classList.remove("hidden");
}

//-------------------------------------------------------------
// Continue button → quest.html
$("#continue").addEventListener("click", () => {
  const hero = $("#heroSel").value;
  window.location.href = `quest.html?hero=${encodeURIComponent(hero)}`;
});

//-------------------------------------------------------------
// Helpers
const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
function flash(text, bad=false){
  const msg = $("#msg");
  msg.textContent = text;
  msg.style.color = bad ? "#ff7272" : "#5ef35e";
}
