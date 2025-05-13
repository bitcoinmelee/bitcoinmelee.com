// main.js  – text‑only roster display
//-------------------------------------------------------------

const $ = sel => document.querySelector(sel);
let HEROES = [];
const ROSTER_SIZE = 3;

// 1) Load heroes.json
fetch("heroes.json")
  .then(r => r.json())
  .then(data => {
    HEROES = data;
    flash(`Loaded ${HEROES.length} heroes. Paste your xpub!`);
  })
  .catch(err => flash("Could not load heroes.json ➜ " + err, true));

// 2) Button click
$("#go").addEventListener("click", async () => {
  const xpub = $("#xpub").value.trim();
  if (!xpub.startsWith("xpub")) return flash("Please paste a valid xpub.", true);
  if (HEROES.length === 0)      return flash("Heroes not loaded yet…", true);

  const roster = await pickRoster(xpub, ROSTER_SIZE);
  showRoster(roster);
  flash("Your deterministic party:");
});

// Deterministic picker
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

// Text‑only display
function showRoster(list) {
  const rosterEl = $("#roster");
  rosterEl.innerHTML = "";             // clear previous
  list.forEach(h => {
    const line = document.createElement("pre");
    line.textContent =
      `${h.Name.padEnd(12)} – STR ${h.Strength.toString().padEnd(2)} ` +
      `DEX ${h.Dexterity.toString().padEnd(2)} CON ${h.Constitution}`;
    rosterEl.appendChild(line);
  });
  rosterEl.classList.remove("hidden");
}

// Helper
function flash(text, bad=false){
  const msg = $("#msg");
  msg.textContent = text;
  msg.style.color = bad ? "#ff7272" : "#5ef35e";
}
