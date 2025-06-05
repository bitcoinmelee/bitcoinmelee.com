// main.js
// — adds Archetype background images to hero cards
import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const ROSTER_SIZE = 12;

  let HEROES = [];
  let ABILITIES = {};
  let ARCHETYPES = [];

  /* ------------------------------- helpers */
  const STAT_ABBR = {
    Strength:'STR', Dexterity:'DEX', Constitution:'CON',
    Intelligence:'INT', Wisdom:'WIS', Charisma:'CHA'
  };

  const toTitleCase = str => String(str).replace(/\b\w/g,c=>c.toUpperCase());

  const flash = (txt, err=false) => {
    const box = $('#msg');
    box.textContent = txt;
    box.style.color = err ? '#ff7272' : '#5ef35e';
  };

  const portraitUrl = name => supabase.storage
    .from(PORTRAIT_BUCKET)
    .getPublicUrl(`characters/${encodeURIComponent(name)}.webp`).data.publicUrl;

  function heroArchetype(hero){
    for(const a of ARCHETYPES){
      const cell = a[hero.Kingdom];
      if(!cell || cell==='—') continue;
      if(Array.isArray(cell)?cell.includes(hero.Faction):cell===hero.Faction) return a.Archetype;
    }
    return null;
  }

  async function pickRoster(xpub,count){
    const enc = new TextEncoder();
    const roster=[];
    for(let i=0; roster.length<count; i++){
      const hash = await crypto.subtle.digest('SHA-256',enc.encode(xpub+i));
      const num  = new DataView(hash).getUint32(0,false);
      const hero = HEROES[num%HEROES.length];
      if(!roster.some(h=>h.Name===hero.Name)) roster.push(hero);
    }
    return roster;
  }

  function renderGrid(list){
    const wrap = $('#roster');
    wrap.innerHTML='';
    const grid=document.createElement('div');
    grid.className='hero-grid';

    list.forEach(h=>{
      const name=toTitleCase(h.Name);
      const imgSrc=portraitUrl(h.Name);
      const aObj=ABILITIES[h.Ability]||{};
      const arche=heroArchetype(h);
      const bgImg=arche?`images/card_backgrounds/${arche}.webp`:'';
      const article=['a','e','i','o','u'].includes(h.Faction.trim()[0]?.toLowerCase())?'An':'A';

      /* ability summary */
      const effectsByTarget={};
      Object.entries(aObj).filter(([k,v])=>k!=='Description'&&v!==0).forEach(([k,v])=>{
        const [stat,targetRaw]=k.split('_');
        const abbr=STAT_ABBR[stat]||stat.toUpperCase();
        const sign=v>0?`+${v}`:`${v}`;
        const target=targetRaw||'Self';
        (effectsByTarget[target]=effectsByTarget[target]||[]).push(`${sign} ${abbr}`);
      });
      const effectText=Object.entries(effectsByTarget).map(([t,arr])=>arr.length===1?`${arr[0]} to ${t}`:`${arr.slice(0,-1).join(' and ')} and ${arr.at(-1)} to ${t}`).join('; ')||'No effect data.';
      const abilityDesc=(aObj.Description||'').replace(/\bDESCRIPTION\b\.?$/i,'');

      /* stats tooltip (no HP/Mana) */
      const statsHtml=`<div style="display:grid;grid-template-columns:auto auto;gap:1px 1px;justify-items:start;">
        <div>STR</div><div>${h.Strength}</div>
        <div>DEX</div><div>${h.Dexterity}</div>
        <div>CON</div><div>${h.Constitution}</div>
        <div>INT</div><div>${h.Intelligence}</div>
        <div>WIS</div><div>${h.Wisdom}</div>
        <div>CHA</div><div>${h.Charisma}</div>
      </div>`;

      grid.insertAdjacentHTML('beforeend',`
        <div class="hero-card" style="background-image:url('${bgImg}');position:relative;">
          <!-- Portrait with HP/Mana badge -->
          <div style="position:relative;display:inline-block;overflow:hidden;">
            <img src="${imgSrc}" alt="${name}" class="portrait" loading="lazy">
            <div class="hero-subheading" style="position:absolute;bottom:2px;left:0px;z-index:2;padding:2px 2px;border-radius:8px;line-height:1;text-align:left;">
              HP: ${h.Health}<br>Mana: ${h.Mana}
            </div>
          </div>

          <!-- Bottom area -->
          <div class="bottom-info" style="display:grid;width:100%;grid-template-areas:'title' 'ability';gap:2px;margin-top:2px;">
            <div style="grid-area:title;text-align:center;display:flex;flex-direction:column;align-items:center;">
              <div class="hero-name-banner">
                <span class="name-container">
                  <span>${name}</span>
                  <span class="tooltip-box">${statsHtml}</span>
                </span>
              </div>
              <div class="hero-subheading" style="margin-top:2px;">${article} ${h.Faction} ${h.Class}<br>from<br>${h.Kingdom}</div>
            </div>
            <div class="ability-block" style="grid-area:ability;max-width:85%;margin:0 auto;">
              <span class="ability-container">
                <span class="ability-name">${h.Ability}:</span>
                <span class="ability-effects">${effectText}</span>
                <span class="tooltip-box">${abilityDesc||'No description available.'}</span>
              </span>
            </div>
          </div>
        </div>`);
    });

    wrap.appendChild(grid);
    wrap.classList.remove('hidden');
    activateFloatingTooltips();
  }

  /* ---------------- floating tooltips */
  function activateFloatingTooltips(){
    document.querySelectorAll('.ability-container, .name-container').forEach(container=>{
      const tip=container.querySelector('.tooltip-box');
      if(!tip) return;
      const moveTip=e=>{tip.style.top=`${e.clientY-12}px`;tip.style.left=`${e.clientX+14}px`;};
      container.addEventListener('mouseenter',e=>{document.body.appendChild(tip);tip.style.display='block';tip.style.position='fixed';tip.style.zIndex='2147483647';moveTip(e);});
      container.addEventListener('mousemove',moveTip);
      container.addEventListener('mouseleave',()=>{tip.style.display='none';container.appendChild(tip);});
    });
  }

  /* ---------------- data loading */
  Promise.all([
    fetch('heroes.json').then(r=>r.json()),
    fetch('abilities.json').then(r=>r.json()),
    fetch('archetypes.json').then(r=>r.json())
  ]).then(([heroesData,abilitiesData,archetypeData])=>{
    HEROES     = Array.isArray(heroesData)?heroesData:Object.values(heroesData);
    ABILITIES  = Array.isArray(abilitiesData)?Object.fromEntries(abilitiesData.map(a=>[a.Ability,a])):abilitiesData;
    ARCHETYPES = archetypeData;
    flash('Discover heroes bound to your public key!');
  }).catch(err=>flash('Could not load data ➜ '+err,true));

  /* ---------------- UI actions */
  $('#go').addEventListener('click',async()=>{
    const xpub=$('#xpub').value.trim();
    if(!xpub) return flash('Enter a public key first!',true);
    const roster=await pickRoster(xpub,ROSTER_SIZE);
    renderGrid(roster);
  });
});
