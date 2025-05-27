// main.js – xpub → hero grid → store roster → draft.html
// Uses “characters/characters/<Name>.webp” inside the Supabase bucket.

import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const ROSTER_SIZE = 12;

  let HEROES    = [];
  let ABILITIES = {};

  /* ───────── flash helper ───────── */
  function flash(text, isError = false) {
    const msg = $('#msg');
    msg.textContent = text;
    msg.style.color = isError ? '#ff7272' : '#5ef35e';
  }

  /* ─── load heroes.json + abilities.json ─── */
  Promise.all([
    fetch('heroes.json').then(r => r.json()),
    fetch('abilities.json').then(r => r.json())
  ])
  .then(([heroesData, abilitiesData]) => {
    HEROES = Array.isArray(heroesData)
      ? heroesData
      : Object.values(heroesData);

    // Map ability name → full object { Description, ...numeric keys }
    if (Array.isArray(abilitiesData)) {
      abilitiesData.forEach(a => {
        ABILITIES[a.Ability] = a;
      });
    } else {
      Object.assign(ABILITIES, abilitiesData);
    }

    flash('Discover heroes bound to your public key!');
  })
  .catch(err => flash('Could not load data ➜ ' + err, true));

  /* ───────── deterministic roster picker ───────── */
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

  /* ───────── Supabase public URL helper ───────── */
  function portraitUrl(name) {
    const path = `characters/${encodeURIComponent(name)}.webp`;
    const { data } = supabase
      .storage
      .from(PORTRAIT_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  /* ───────── title-case helper ───────── */
  function toTitleCase(str) {
    return String(str).replace(/\b\w/g, c => c.toUpperCase());
  }

  /* ───────── render 4×3 grid ───────── */
  function renderGrid(list) {
    const container = $('#roster');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'hero-grid';

    // map full stat names to abbreviations
    const STAT_ABBR = {
      Strength:    'STR',
      Dexterity:   'DEX',
      Constitution:'CON',
      Intelligence:'INT',
      Wisdom:      'WIS',
      Charisma:    'CHA',
      Health:      'HP',
      Mana:        'Mana'
    };

    list.forEach(h => {
      const name       = toTitleCase(h.Name);
      const imgSrc     = portraitUrl(h.Name);
      const abilityObj = ABILITIES[h.Ability] || {};

      // extract and format all non-zero numeric effects
      const effects = Object.entries(abilityObj)
        .filter(([key,val]) => key !== 'Description' && val !== 0)
        .map(([key,val]) => {
          const [statRaw, targetRaw] = key.split('_');
          const abbr   = STAT_ABBR[statRaw] || statRaw.toUpperCase();
          const sign   = val > 0 ? `+${val}` : `${val}`;
          const target = targetRaw ? ` to ${toTitleCase(targetRaw)}` : '';
          return `<p>${sign} ${abbr}${target}</p>`;
        });

      const effectHtml = effects.length
        ? effects.join('')
        : `<p>No effect data.</p>`;

      // tooltip shows only the Description text
      let description = abilityObj.Description || '';
      description = description.replace(/\bDESCRIPTION\b\.?$/i, '');

      const card = document.createElement('div');
      card.className = 'hero-card';
      card.innerHTML = `
        <div class="portrait-wrap">
          <img src="${imgSrc}" alt="${name}" class="portrait" loading="lazy">
          <div class="hero-name-banner"><span>${name}</span></div>
        </div>

        <div class="stats">
    <!-- primary: STR, DEX, CON / INT, WIS, CHA -->
    <div class="stats-primary">
      <div>STR ${h.Strength}</div>
      <div>DEX ${h.Dexterity}</div>
      <div>CON ${h.Constitution}</div>
      <div>INT ${h.Intelligence}</div>
      <div>WIS ${h.Wisdom}</div>
      <div>CHA ${h.Charisma}</div>
    </div>
    <!-- secondary: HP, Mana in a 2×2 grid (two empty cells) -->
    <div class="stats-secondary">
      <div>HP ${h.Health}</div>
      <div>Mana ${h.Mana}</div>
      <div></div>
      <div></div>
    </div>
  </div>

        <div class="meta">
          <p><strong>Kingdom:</strong> ${h.Kingdom}</p>
          <p><strong>Faction:</strong> ${h.Faction}</p>
          <p><strong>Class:</strong> ${h.Class}</p>
        </div>

        <div class="meta ability-block">
          <p><strong>Ability:</strong></p>
          <div class="ability-container">
            <span class="ability-name">${h.Ability}</span>
            <span class="tooltip-box">${description}</span>
          </div>
          <div class="ability-effects">
            ${effectHtml}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);
    container.classList.remove('hidden');
  }

  /* ───── “Discover Heroes” button ───── */
  $('#go').addEventListener('click', async () => {
    const xpub = $('#xpub').value.trim();
    if (!xpub)          return flash('Please paste a public key first…', true);
    if (!HEROES.length) return flash('Data still loading…', true);

    const roster = await pickRoster(xpub, ROSTER_SIZE);
    renderGrid(roster);

    sessionStorage.setItem('roster', JSON.stringify(roster));
    flash('These are the heroes bound to your key:');

    $('#continue').disabled = false;
    $('#continue').classList.remove('hidden');
  });

  /* ───── Continue → draft.html ───── */
  $('#continue').addEventListener('click', () => {
    window.location.href = 'draft.html';
  });
});
