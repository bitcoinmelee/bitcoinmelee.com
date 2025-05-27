// main.js – xpub → hero grid → store roster → draft.html
// Uses “characters/characters/<Name>.webp” inside the Supabase bucket.

import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);

  const ROSTER_SIZE = 12;
  let HEROES = [];

  /* ───────── flash helper ───────── */
  function flash(text, isError = false) {
    const msg = $('#msg');
    msg.textContent = text;
    msg.style.color = isError ? '#ff7272' : '#5ef35e';
  }

  /* ───────── load hero data ─────── */
  fetch('heroes.json')
    .then(r => r.json())
    .then(data => {
      HEROES = Array.isArray(data) ? data : Object.values(data);
      flash('Discover heroes bound to your public key!');
    })
    .catch(err => flash('Could not load heroes.json ➜ ' + err, true));

  /* ─ deterministic roster picker ─ */
  async function pickRoster(xpub, count) {
    const enc   = new TextEncoder();
    const roster = [];

    for (let i = 0; roster.length < count; i++) {
      const hash = await crypto.subtle.digest('SHA-256', enc.encode(xpub + i));
      const num  = new DataView(hash).getUint32(0, false);
      const hero = HEROES[num % HEROES.length];
      if (!roster.some(h => h.Name === hero.Name)) roster.push(hero);
    }
    return roster;
  }

  /* ─── helper → Supabase public URL ─── */
  function portraitUrl(name) {
    // stored at  characters/characters/<Name>.webp
    const path = `characters/${encodeURIComponent(name)}.webp`;
    const { data } = supabase
      .storage
      .from(PORTRAIT_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

/* turn “aaron” → “Aaron”, “mary ann” → “Mary Ann” */
function toTitleCase(str){
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/* ───── render 4×3 grid with fancy name banner & labeled fields ───── */
function renderGrid(list) {
  const container = $('#roster');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'hero-grid';

  list.forEach(h => {
    const imgSrc = portraitUrl(h.Name);
    const name   = toTitleCase(h.Name);          // helper you already added

    const card = document.createElement('div');
    card.className = 'hero-card';

    card.innerHTML = `
      <div class="portrait-wrap">
        <img src="${imgSrc}" alt="${name}" class="portrait" loading="lazy">
        <div class="hero-name-banner"><span>${name}</span></div>
      </div>

      <div class="stats">
        STR ${h.Strength}  DEX ${h.Dexterity}  CON ${h.Constitution}<br>
        INT ${h.Intelligence}  WIS ${h.Wisdom}  CHA ${h.Charisma}<br>
        HP ${h.Health}  Mana ${h.Mana}
      </div>

      <div class="meta">
        <p><strong>Ability:</strong> ${h.Ability}</p>
        <p><strong>Class:</strong> ${h.Class}</p>
        <p><strong>Faction:</strong> ${h.Faction}</p>
        <p><strong>Kingdom:</strong> ${h.Kingdom}</p>
      </div>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
  container.classList.remove('hidden');
}
  /* ─ “Discover Heroes” button ─ */
  $('#go').addEventListener('click', async () => {
    const xpub = $('#xpub').value.trim();
    if (!xpub)          return flash('Please paste a public key first…', true);
    if (!HEROES.length) return flash('Heroes not loaded yet…', true);

    const roster = await pickRoster(xpub, ROSTER_SIZE);
    renderGrid(roster);

    sessionStorage.setItem('roster', JSON.stringify(roster));
    flash('These are the heroes bound to your key:');

    const btnContinue = $('#continue');
    btnContinue.disabled = false;
    btnContinue.classList.remove('hidden');
  });

  /* ─ Continue → draft.html ─ */
  $('#continue').addEventListener('click', () => {
    window.location.href = 'draft.html';
  });
});
