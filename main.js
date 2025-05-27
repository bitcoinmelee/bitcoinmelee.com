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

  /* ─── load heroes.json + abilities.json in parallel ─── */
  Promise.all([
    fetch('heroes.json').then(r => r.json()),
    fetch('abilities.json').then(r => r.json())
  ])
  .then(([heroesData, abilitiesData]) => {
    HEROES = Array.isArray(heroesData)
      ? heroesData
      : Object.values(heroesData);

    // build map: Ability name → effect object (or string)
    if (Array.isArray(abilitiesData)) {
      abilitiesData.forEach(a => {
        ABILITIES[a.Ability] = a.Effect;
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
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  /* ───────── render 4×3 grid with labeled effects ───────── */
  function renderGrid(list) {
    const container = $('#roster');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'hero-grid';

    list.forEach(h => {
      const name      = toTitleCase(h.Name);
      const imgSrc    = portraitUrl(h.Name);
      const rawEffect = ABILITIES[h.Ability];
      let effectHtml  = '';

      // if effect is an object, list non-zero entries; else show as text
      if (rawEffect && typeof rawEffect === 'object') {
        effectHtml = Object.entries(rawEffect)
          .filter(([key, val]) => val !== 0 && val !== null && val !== false && val !== '')
          .map(([key, val]) => `<p><strong>${key}:</strong> ${val}</p>`)
          .join('');
      } else if (rawEffect) {
        effectHtml = `<p>${rawEffect}</p>`;
      } else {
        effectHtml = `<p>No effect data.</p>`;
      }

      const card = document.createElement('div');
      card.className = 'hero-card';
      card.innerHTML = `
        <div class="portrait-wrap">
          <img src="${imgSrc}" alt="${name}" class="portrait" loading="lazy">
          <div class="hero-name-banner"><span>${name}</span></div>
        </div>

        <div class="stats">
          STR ${h.Strength}  DEX ${h.Dexterity}  CON ${h.Constitution}<br>
          INT ${h.Intelligence}  WIS ${h.Wisdom}  CHA ${h.Charisma}<br>
          HP ${h.Health}  Mana ${h.Mana}
        </div>

        <div class="meta">
          <p><strong>Kingdom:</strong> ${h.Kingdom}</p>
          <p><strong>Faction:</strong> ${h.Faction}</p>
          <p><strong>Class:</strong> ${h.Class}</p>
        </div>

        <div class="meta ability-block">
          <p><strong>Ability:</strong> ${h.Ability}</p>
          <div class="ability-effect">
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

    const btnContinue = $('#continue');
    btnContinue.disabled = false;
    btnContinue.classList.remove('hidden');
  });

  /* ─── Continue → draft.html ─── */
  $('#continue').addEventListener('click', () => {
    window.location.href = 'draft.html';
  });
});
