// main.js  – text‑only roster display (no “deterministic” wording)
//-------------------------------------------------------------

const $ = sel => document.querySelector(sel);
let HEROES = [];
const ROSTER_SIZE = 12;

// 1)  Load heroes.json
fetch("heroes.json")
  .then(r => r.json())
  .then(data => {
    HEROES = Array.isArray(data) ? data : Object.values(data);
    flash("Paste your xpub!");
  })
  .catch(err => flash("Could not load heroes.json ➜ " + err, true));

// 2)  Button click
$("#go").addEventListener("click", async () => {
  const xpub = $("#xpub").value.trim();
  if (!xpub.startsWith("xpub")) return flash("Please paste a valid xpub.", true);
  if (HEROES.length === 0)      return flash("Heroes not loaded yet…", true);

  const roster = await pickRoster(xpub, ROSTER_SIZE);
  showRoster(roster);
  flash("Here are your heroes:");
});

// 3)  Deterministic picker – SHA‑256(xpub + index) → integer → hero
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

// 4)  Text list with stats and abilities
function showRoster(list) {
  const rosterEl = $("#roster");
  rosterEl.innerHTML = "";

  list.forEach(h => {
    const line = document.createElement("pre");
    line.textContent =
      `${pad(h.Name, 12)}  ` +
      `STR ${pad(h.Strength,2)}  DEX ${pad(h.Dexterity,2)}  CON ${pad(h.Constitution,2)}  ` +
      `INT ${pad(h.Intelligence,2)}  WIS ${pad(h.Wisdom,2)}  CHA ${pad(h.Charisma,2)}  ` +
      `HP ${pad(h.Health,3)}  MP ${pad(h.Mana,3)}  |  ` +
      `${h["Common Ability"]}  |  ${h["Rare Ability"]}`;
    rosterEl.appendChild(line);
  });

  rosterEl.classList.remove("hidden");
}

// 5)  Helpers
const pad = (val, len) => String(val).padEnd(len);
function flash(text, bad = false) {
  const msg = $("#msg");
  msg.textContent = text;
  msg.style.color = bad ? "#ff7272" : "#5ef35e";
}
