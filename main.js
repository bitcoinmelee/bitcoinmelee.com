// main.js – full flow: xpub → table → Continue to battle.html (no single-character select)
window.addEventListener('DOMContentLoaded', () => {
  // shorthand selector
  const $ = s => document.querySelector(s);
  let HEROES = [];
  const ROSTER_SIZE = 12;

  /* status message */
  function flash(text, isError = false) {
    const msg = $('#msg');
    msg.textContent = text;
    msg.style.color = isError ? '#ff7272' : '#5ef35e';
  }

  /* load heroes list */
  fetch('heroes.json')
    .then(r => r.json())
    .then(data => {
      HEROES = Array.isArray(data) ? data : Object.values(data);
      flash('Paste your xpub!');
    })
    .catch(err => flash('Could not load heroes.json ➜ ' + err, true));

  /* deterministic roster picker */
  async function pickRoster(xpub, count) {
    const encoder = new TextEncoder();
    const out = [];
    for (let i = 0; out.length < count; i++) {
      const hash = await crypto.subtle.digest('SHA-256', encoder.encode(xpub + i));
      const num  = new DataView(hash).getUint32(0, false);
      const hero = HEROES[num % HEROES.length];
      if (!out.includes(hero)) out.push(hero);
    }
    return out;
  }

  /* render roster table */
  function renderTable(list) {
    const container = $('#roster');
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'hero-table';
    table.innerHTML = `
      <thead><tr>
        <th>Name</th><th>STR</th><th>DEX</th><th>CON</th>
        <th>INT</th><th>WIS</th><th>CHA</th><th>HP</th><th>Mana</th>
        <th>Ability</th><th>Class</th><th>Faction</th><th>Kingdom</th>
      </tr></thead>
      <tbody>
        ${list.map(h => `
          <tr>
            <td>${h.Name}</td>
            <td>${h.Strength}</td><td>${h.Dexterity}</td><td>${h.Constitution}</td>
            <td>${h.Intelligence}</td><td>${h.Wisdom}</td><td>${h.Charisma}</td>
            <td>${h.Health}</td><td>${h.Mana}</td>
            <td>${h.Ability}</td><td>${h.Class}</td>
            <td>${h.Faction}</td><td>${h.Kingdom}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    container.appendChild(table);
    container.classList.remove('hidden');
  }

  /* "Discover Heroes" button */
  $('#go').addEventListener('click', async () => {
    const xpub = $('#xpub').value.trim();
    if (!xpub.startsWith('xpub')) return flash('Please paste a valid xpub.', true);
    if (!HEROES.length) return flash('Heroes not loaded yet…', true);

    const roster = await pickRoster(xpub, ROSTER_SIZE);
    renderTable(roster);
    flash('Here are your heroes:');

    // enable Continue button
    const cont = $('#continue');
    cont.disabled = false;
    cont.classList.remove('hidden');
  });

  /* Continue → go to battle */
  $('#continue').addEventListener('click', () => {
    window.location.href = 'battle.html';
  });
});
