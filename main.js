// main.js  –  client‑side roster picker (no backend)
const $   = sel => document.querySelector(sel);
let HEROES = [];   // global cache

// 1. Fetch heroes.json once when the page loads
fetch("heroes.json")
  .then(r => r.json())
  .then(data => HEROES = data)
  .catch(err => flash("Could not load heroes.json: "+err, true));

// 2. Listen for button
$("#go").addEventListener("click", async () => {
  const xpub = $("#xpub").value.trim();
  if (!xpub.startsWith("xpub") || HEROES.length === 0) {
    flash("Paste a valid xpub and wait for heroes.json to load.", true);
    return;
  }
  const roster = pickRoster(xpub, 3);   // 3 heroes
  showRoster(roster);
  flash("Choose your party!");
});

// ───────────────────────────────────────────────────────────
// Deterministic roster: SHA‑256(xpub || index) mod HEROES.length
async function pickRoster(xpub, count) {
  const enc = new TextEncoder();
  const roster = [];
  for (let i = 0; roster.length < count; i++) {
    const hash = await crypto.subtle.digest("SHA-256", enc.encode(xpub + i));
    const num  = new DataView(hash).getUint32(0, false); // first 4 bytes as int
    const hero = HEROES[num % HEROES.length];
    if (!roster.includes(hero)) roster.push(hero);
  }
  return roster;
}

// ───────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────
function flash(text, bad=false){
  const msg = $("#msg");
  msg.textContent = text;
  msg.style.color = bad ? "#ff7272" : "#5ef35e";
}
