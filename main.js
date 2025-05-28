import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const ROSTER_SIZE = 12;

  let HEROES = [];
  let ABILITIES = {};
  let ARCHETYPES = [];  // loaded from archetype.json

  const STAT_ABBR = {
    Strength: 'STR', Dexterity: 'DEX', Constitution: 'CON',
    Intelligence: 'INT', Wisdom: 'WIS', Charisma: 'CHA',
    Health: 'HP', Mana: 'Mana'
  };

  const toTitleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());

  const flash = (txt, err = false) => {
    const msg = $('#msg');
    msg.textContent = txt;
    msg.style.color = err ? '#ff7272' : '#5ef35e';
  };

  // builds public URL for each hero portrait
  const portraitUrl = name => {
    const { data } = supabase
      .storage
      .from(PORTRAIT_BUCKET)
      .getPublicUrl(`characters/${encodeURIComponent(name)}.webp`);
    return data.publicUrl;
  };

  function heroArchetype(hero) {
    for (const a of ARCHETYPES) {
      const cell = a[hero.Kingdom];
      if (!cell || cell === '—') continue;
      if (Array.isArray(cell) ? cell.includes(hero.Faction) : cell === hero.Faction) {
        return a.Archetype;
      }
    }
    return null;
  }

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

  function renderGrid(list) {
    const wrap = $('#roster');
    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'hero-grid';

    list.forEach(h => {
      const name = toTitleCase(h.Name);
      const imgSrc = portraitUrl(h.Name);
      const ability = ABILITIES[h.Ability] || {};
      const arche  = heroArchetype(h);
      const bgImg  = arche
        ? `images/card_backgrounds/${encodeURIComponent(arche)}.webp`
        : '';

      grid.insertAdjacentHTML('beforeend', `
        <div class="hero-card" style="background-image: url('${bgImg}');">
          <img src="${imgSrc}" alt="${name}" class="portrait" loading="lazy" />
          <div class="hero-name-banner"><span>${name}</span></div>

          <div class="card-body">
            <div class="stats-primary">
              <div>STR ${h.Strength}</div><div>DEX ${h.Dexterity}</div><div>CON ${h.Constitution}</div>
              <div>INT ${h.Intelligence}</div><div>WIS ${h.Wisdom}</div><div>CHA ${h.Charisma}</div>
            </div>
            <div class="stats-secondary">
              <div>HP ${h.Health}</div><div>Mana ${h.Mana}</div>
            </div>

            <div class="meta">
              <p><strong>Kingdom:</strong> ${h.Kingdom}</p>
              <p><strong>Faction:</strong>  ${h.Faction}</p>
              <p><strong>Class:</strong>    ${h.Class}</p>
            </div>

            <div class="ability-block">
              <span class="ability-name">${h.Ability}</span>
              <span class="ability-effects">${ability.Description || 'No effect data.'}</span>
            </div>
          </div>
        </div>
      `);
    });

    wrap.appendChild(grid);
    wrap.classList.remove('hidden');
  }

  // Load data files (note: singular "archetype.json")
  Promise.all([
    fetch('heroes.json').then(r => r.json()),
    fetch('abilities.json').then(r => r.json()),
    fetch('archetype.json').then(r => r.json())
  ]).then(([heroesData, abilitiesData, archetypeData]) => {
      HEROES     = Array.isArray(heroesData) ? heroesData : Object.values(heroesData);
      ABILITIES  = Array.isArray(abilitiesData)
        ? Object.fromEntries(abilitiesData.map(a => [a.Ability, a]))
        : abilitiesData;
      ARCHETYPES = archetypeData;
      flash('Discover heroes bound to your public key!');
  }).catch(err => flash('Could not load data ➜ ' + err, true));

  $('#go').addEventListener('click', async () => {
    const xpub = $('#xpub').value.trim();
    if (!xpub)           return flash('Please paste a public key first…', true);
    if (!HEROES.length)   return flash('Data still loading…',    true);

    const roster = await pickRoster(xpub, ROSTER_SIZE);
    renderGrid(roster);
    sessionStorage.setItem('roster', JSON.stringify(roster));
    flash('These are the heroes bound to your key:');
    $('#continue').disabled = false;
    $('#continue').classList.remove('hidden');
  });

  $('#continue').addEventListener('click', () => window.location.href = 'draft.html');
});
