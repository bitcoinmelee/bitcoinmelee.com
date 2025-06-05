// main.js
// — adds Archetype background images to hero cards
// Uses “characters/characters/<Name>.webp” for portraits
// and “images/card_backgrounds/<Archetype>.webp” for card backdrops.
import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const ROSTER_SIZE = 12;

  let HEROES = [];
  let ABILITIES = {};
  let ARCHETYPES = [];

  /* -------------------------------------------------- helpers */
  const STAT_ABBR = {
    Strength:'STR', Dexterity:'DEX', Constitution:'CON',
    Intelligence:'INT', Wisdom:'WIS', Charisma:'CHA',
    Health:'HP', Mana:'Mana'
  };

  const toTitleCase = str =>
    String(str).replace(/\b\w/g,c=>c.toUpperCase());

  const flash = (txt, err=false) => {
    const box = $('#msg');
    box.textContent = txt;
    box.style.color = err ? '#ff7272' : '#5ef35e';
  };

  const portraitUrl = name => {
    const { data } = supabase
      .storage
      .from(PORTRAIT_BUCKET)
      .getPublicUrl(`characters/${encodeURIComponent(name)}.webp`);
    return data.publicUrl;
  };

  /* -------- find Archetype for a hero (Kingdom + Faction) */
  function heroArchetype(hero){
    for(const a of ARCHETYPES){
      const cell = a[hero.Kingdom];          
      if(!cell || cell === '—') continue;
      if(Array.isArray(cell)
         ? cell.includes(hero.Faction)
         : cell === hero.Faction){
        return a.Archetype;
      }
    }
    return null;
  }

  /* ----------------------------------------- deterministic picker */
  async function pickRoster(xpub, count){
    const enc = new TextEncoder();
    const roster = [];
    for(let i=0; roster.length<count; i++){
      const hash = await crypto.subtle.digest(
        'SHA-256',
        enc.encode(xpub + i)
      );
      const num  = new DataView(hash).getUint32(0,false);
      const hero = HEROES[num % HEROES.length];
      if(!roster.some(h=>h.Name===hero.Name))
        roster.push(hero);
    }
    return roster;
  }

  /* --------------------------------------------------- render grid */
  function renderGrid(list){
    const wrap = $('#roster');
    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'hero-grid';

    list.forEach(h => {
      const name   = toTitleCase(h.Name);
      const imgSrc = portraitUrl(h.Name);
      const aObj   = ABILITIES[h.Ability] || {};
      const arche  = heroArchetype(h);
      const bgImg  = arche
        ? `images/card_backgrounds/${arche}.webp`
        : '';

      /* ——— compute article “A” vs “An” ——— */
      const firstLetter = h.Faction.trim().charAt(0).toLowerCase();
      const useAn = ['a','e','i','o','u'].includes(firstLetter);
      const article = useAn ? 'An' : 'A';

      /* ——— build flattened effects string ——— */
      const effectsByTarget = {};
      Object.entries(aObj)
        .filter(([k,v]) => k !== 'Description' && v !== 0)
        .forEach(([k,v]) => {
          const [stat, targetRaw] = k.split('_');
          const abbr = STAT_ABBR[stat] || stat.toUpperCase();
          const sign = v > 0 ? `+${v}` : `${v}`;
          const target = targetRaw || 'Self';
          (effectsByTarget[target] = effectsByTarget[target] || [])
            .push(`${sign} ${abbr}`);
        });

      const effectLines = Object.entries(effectsByTarget).map(([t, arr]) => {
        if (arr.length === 1) {
          return `${arr[0]} to ${t}`;
        } else {
          return `${arr.slice(0, -1).join(' and ')} and ${arr.at(-1)} to ${t}`;
        }
      });
      const effectText = effectLines.length
        ? effectLines.join('; ')
        : 'No effect data.';

      /* ——— pull description for the tooltip ——— */
      const desc = (aObj.Description || '').replace(/\bDESCRIPTION\b\.?$/i, '');

      /* ——— insert each card ——— */
      grid.insertAdjacentHTML('beforeend', `
        <div class="hero-card" style="background-image:url('${bgImg}'); display:flex; gap:0.75rem;">
          <!-- LEFT COLUMN -->
          <div class="hero-main" style="flex:1; display:flex; flex-direction:column;">
            <!-- 1) Portrait -->
            <img src="${imgSrc}"
                 alt="${name}"
                 class="portrait"
                 loading="lazy">

            <!-- 2) Name Banner -->
            <div class="hero-name-banner">
              <span>${name}</span>
            </div>

            <!-- 3) Subheading with badge-style background -->
            <div class="hero-subheading">
              ${article} ${h.Faction} ${h.Class} from ${h.Kingdom}
            </div>

            <!-- 4) Ability “button”: [ABILITY]: [EFFECT TEXT], with hover tooltip -->
            <div class="ability-block">
              <span class="ability-container">
                <span class="ability-name">${h.Ability}:</span>
                <span class="ability-effects">${effectText}</span>
                <span class="tooltip-box">${desc || 'No description available.'}</span>
              </span>
            </div>
          </div>

          <!-- RIGHT COLUMN (STATS) -->
          <div class="stats" style="min-width:120px; display:flex; flex-direction:column; margin-left:auto;">
            <div class="stats-primary">
              <div>STR ${h.Strength}</div>
              <div>DEX ${h.Dexterity}</div>
              <div>CON ${h.Constitution}</div>
              <div>INT ${h.Intelligence}</div>
              <div>WIS ${h.Wisdom}</div>
              <div>CHA ${h.Charisma}</div>
            </div>
            <div class="stats-secondary" style="margin-top:4px;">
              <div>HP ${h.Health}</div>
              <div>Mana ${h.Mana}</div>
            </div>
          </div>
        </div>
      `);
    });

    wrap.appendChild(grid);
    wrap.classList.remove('hidden');
    activateFloatingTooltips();
  }


  /* ---------------------------------- floating tooltip behaviour */
  function activateFloatingTooltips(){
    document.querySelectorAll('.ability-container').forEach(container=>{
      const tip = container.querySelector('.tooltip-box');
      if(!tip) return;
      const moveTip = e=>{
        tip.style.top  = `${e.clientY - 12}px`;
        tip.style.left = `${e.clientX + 14}px`;
      };
      container.addEventListener('mouseenter',e=>{
        document.body.appendChild(tip);
        tip.style.display='block';
        tip.style.position='fixed';
        tip.style.zIndex='2147483647';
        moveTip(e);
      });
      container.addEventListener('mousemove',moveTip);
      container.addEventListener('mouseleave',()=>{
        tip.style.display='none';
        container.appendChild(tip);
      });
    });
  }

  /* ------------------------------------------------ data loading */
  Promise.all([
    fetch('heroes.json').then(r=>r.json()),
    fetch('abilities.json').then(r=>r.json()),
    fetch('archetypes.json').then(r=>r.json())
  ]).then(([heroesData, abilitiesData, archetypeData])=>{
      HEROES     = Array.isArray(heroesData) ? heroesData : Object.values(heroesData);
      ABILITIES  = Array.isArray(abilitiesData)
                    ? Object.fromEntries(abilitiesData.map(a=>[a.Ability,a]))
                    : abilitiesData;
      ARCHETYPES = archetypeData;
      flash('Discover heroes bound to your public key!');
  }).catch(err=>flash('Could not load data ➜ '+err,true));

  /* ------------------------------------------------ UI actions */
  $('#go').addEventListener('click', async ()=>{
    const xpub = $('#xpub').value.trim();
    if(!xpub) return flash('Enter a public key first!', true);
    const roster = await pickRoster(xpub, ROSTER_SIZE);
    renderGrid(roster);
  });
});
