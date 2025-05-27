// main.js – xpub → hero grid → store roster → draft.html
// Uses “characters/characters/<Name>.webp” inside the Supabase bucket.

import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const ROSTER_SIZE = 12;

  let HEROES    = [];
  let ABILITIES = {};

  function flash(text, isError = false) {
    const msg = $('#msg');
    msg.textContent = text;
    msg.style.color = isError ? '#ff7272' : '#5ef35e';
  }

  // load heroes + abilities
  Promise.all([
    fetch('heroes.json').then(r => r.json()),
    fetch('abilities.json').then(r => r.json())
  ])
  .then(([heroesData, abilitiesData]) => {
    HEROES = Array.isArray(heroesData) ? heroesData : Object.values(heroesData);
    if (Array.isArray(abilitiesData)) {
      abilitiesData.forEach(a => { ABILITIES[a.Ability] = a.Effect; });
    } else {
      Object.assign(ABILITIES, abilitiesData);
    }
    flash('Discover heroes bound to your public key!');
  })
  .catch(err => flash('Could not load data ➜ ' + err, true));

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

  function portraitUrl(name) {
    const path = `characters/${encodeURIComponent(name)}.webp`;
    const { data } = supabase
      .storage
      .from(PORTRAIT_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  function toTitleCase(str) {
    return String(str).replace(/\b\w/g, c => c.toUpperCase());
  }

  function renderGrid(list) {
    const container = $('#roster');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'hero-grid';

    // stat abbreviations
    const STAT_ABBR = {
      Strength: 'STR', Dexterity: 'DEX', Constitution: 'CON',
      Intelligence: 'INT', Wisdom: 'WIS', Charisma: 'CHA',
      HP: 'HP', Mana: 'Mana'
    };

    list.forEach(h => {
      const name      = toTitleCase(h.Name);
      const imgSrc    = portraitUrl(h.Name);
      const rawEffect = ABILITIES[h.Ability];

      // build effectHtml but do not inject inline
      let effectHtml = '';
      if (rawEffect && typeof rawEffect === 'object') {
        effectHtml = Object.entries(rawEffect)
          .filter(([k,v]) => v && v !== 0)
          .map(([k,v]) => {
            const [stat, target] = k.split('_');
            const abbr = STAT_ABBR[stat] || stat.toUpperCase();
            const sign = v > 0 ? `+${v}` : `${v}`;
            return `<p>${sign} ${abbr}${target ? ` to ${toTitleCase(target)}` : ''}</p>`;
          }).join('');
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
          <p><strong>Ability:</strong></p>
          <div class="ability-container">
            <span class="ability-name">${h.Ability}</span>
            <div class="tooltip-box">${effectHtml}</div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);
    container.classList.remove('hidden');
  }

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

  $('#continue').addEventListener('click', () => {
    window.location.href = 'draft.html';
  });
});
