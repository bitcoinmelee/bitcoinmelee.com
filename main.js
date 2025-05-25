
// main.js – full flow: xpub → grid → store roster → Continue to draft.html
// (renders a 4 × 3 gallery with portraits and stats instead of a plain table)

window.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const ROSTER_SIZE = 12;
  let HEROES = [];

  /* ───────────────────────── flash helper ───────────────────────── */
  function flash(text, isError = false) {
    const msg = $('#msg');
    msg.textContent = text;
    msg.style.color = isError ? '#ff7272' : '#5ef35e';
  }

  /* ───────────────────────── load hero data ─────────────────────── */
  fetch('heroes.json')
    .then(r => r.json())
    .then(data => {
      HEROES = Array.isArray(data) ? data : Object.values(data);
      flash('Discover heroes bound to your public key!');
    })
    .catch(err => flash('Could not load heroes.json ➜ ' + err, true));

  /* ─────────── deterministic roster picker (SHA‑256 hash) ───────── */
  async function pickRoster(xpub, count) {
    const enc = new TextEncoder();
    const roster = [];

    for (let i = 0; roster.length < count; i++) {
      const hash = await crypto.subtle.digest('SHA-256', enc.encode(xpub + i));
      const num  = new DataView(hash).getUint32(0, false);
      const hero = HEROES[num % HEROES.length];
      if (!roster.some(h => h.Name === hero.Name)) roster.push(hero);
    }
    return roster;
  }

  /* ───────────────────── render 4 × 3 portrait grid ─────────────── */
  function renderGrid(list) {
    const container = $('#roster');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'hero-grid';

    list.forEach(h => {
      const card = document.createElement('div');
      card.className = 'hero-card';

      card.innerHTML = `
        <img src="images/portraits/${encodeURIComponent(h.Name)}.jpg" alt="${h.Name}" class="portrait">
        <h3>${h.Name}</h3>
        <p class="stats">
          STR ${h.Strength} | DEX ${h.Dexterity} | CON ${h.Constitution}<br>
          INT ${h.Intelligence} | WIS ${h.Wisdom} | CHA ${h.Charisma}<br>
          HP ${h.Health} | Mana ${h.Mana}<br>
          <em>${h.Ability}</em><br>
          ${h.Class} – ${h.Faction}<br>
          ${h.Kingdom}
        </p>`;
      grid.appendChild(card);
    });

    container.appendChild(grid);
    container.classList.remove('hidden');
  }

  /* ──────────────── "Discover Heroes" button handler ───────────── */
  $('#go').addEventListener('click', async () => {
    const xpub = $('#xpub').value.trim();
    if (!xpub) return flash('Please paste a public key first…', true);
    if (!HEROES.length) return flash('Heroes not loaded yet…', true);

    const roster = await pickRoster(xpub, ROSTER_SIZE);
    renderGrid(roster);

    // keep roster for the draft page
    sessionStorage.setItem('roster', JSON.stringify(roster));

    flash('These are the heroes bound to your key:');

    const btnContinue = $('#continue');
    btnContinue.disabled = false;
    btnContinue.classList.remove('hidden');
  });

  /* ─────────────────── Continue → draft.html ────────────────────── */
  $('#continue').addEventListener('click', () => {
    window.location.href = 'draft.html';
  });
});
