// main.js  –  static‑site roster picker for bitcoinmelee.com
//-------------------------------------------------------------

const $ = sel => document.querySelector(sel);
let HEROES = [];               // loaded from heroes.json
const ROSTER_SIZE = 3;         // how many heroes to show

//-------------------------------------------------------------
// 1.  Load heroes.json once
fetch("heroes.json")
  .then(r => r.json())
  .then(data => {
    HEROES = data;
    flash(`Loaded ${HEROES.length} heroes. Paste your xpub!`);
  })
  .catch(err => flash("Could not load heroes.json ➜ " + err, true));

//-------------------------------------------------------------
// 2.  Button event
$("#go").addEventListener("click", async () => {
  const xpub = $("#xpub").value.trim();
  if (!xpub.startsWith("xpub")) {
    flash("Please paste a valid xpub.", true);
    return;
  }
  if (HEROES.length === 0) {
    flash("Heroes not loaded yet… wait a moment.", true);
    return;
  }
  const roster = await pickRoster(xpub, ROSTER_SIZE);
  showRoster(roster);
  flash("Choose your party!");
});

//-------------------------------------------------------------
// Deterministic roster: SHA‑256(xpub + index) → integer → hero
async function pickRoster(xpub, count) {
  const enc = new TextEncoder();
  const roster = [];
  for (let i = 0; roster.length < count; i++) {
    const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(xpub + i));
    const view    = new DataView(hashBuf);
    const num     = view.getUint32(0, false);           // use first 4 bytes
    const hero    = HEROES[num % HEROES.length];
    if (!roster.includes(hero)) roster.push(hero);      // avoid duplicates
  }
  return roster;
}

//-------------------------------------------------------------
// Render hero cards
function showRoster(list) {
  const rosterEl = $("#roster");
  rosterEl.innerHTML = "";
  list.forEach(h => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="sprite"></div>
      <strong>${h.Name}</strong><br/>
      <span class="stat">STR ${h.Strength}</span><br/>
      <span class="stat">DEX ${h.Dexterity}</span><br/>
      <span class="stat">CON ${h.Constitution}</span>
    `;
    rosterEl.appendChild(card);
  });
  rosterEl.classList.remove("hidden");
}

//-------------------------------------------------------------
// Flash helper
function flash(text, bad = false) {
  const msg = $("#msg");
  msg.textContent = text;
  msg.style.color = bad ? "#ff7272" : "#5ef35e";
}
