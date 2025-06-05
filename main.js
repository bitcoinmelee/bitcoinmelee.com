// main.js — full replacement
import { supabase, PORTRAIT_BUCKET } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {

  /* ---------------- DOM helpers ------------------- */
  const $ = sel => document.querySelector(sel);
  const flash = (txt, err = false) => {
    const box = $('#msg');
    box.textContent = txt;
    box.style.color = err ? '#ff7272' : '#5ef35e';
  };

  /* ---------------- constants --------------------- */
  const ROSTER_SIZE = 12;
  const STAT_ABBR = {Strength:'STR',Dexterity:'DEX',Constitution:'CON',
                     Intelligence:'INT',Wisdom:'WIS',Charisma:'CHA'};

  /* ---------------- data holders ----------------- */
  let HEROES = [];
  let ABILITIES = {};
  let ARCHETYPES = [];

  /* ---------------- utility fns ------------------ */
  const toTitle = s => String(s).replace(/\b\w/g,c=>c.toUpperCase());
  const portraitUrl = n =>
    supabase.storage.from(PORTRAIT_BUCKET)
            .getPublicUrl(`characters/${encodeURIComponent(n)}.webp`).data.publicUrl;

  function heroArchetype(hero){
    for(const a of ARCHETYPES){
      const cell = a[hero.Kingdom];
      if(!cell||cell==='—') continue;
      const match = Array.isArray(cell) ? cell.includes(hero.Faction) : cell===hero.Faction;
      if(match) return a.Archetype;
    }
    return null;
  }

  /* ---------- roster picker (hash of xpub) -------- */
  async function pickRoster(xpub,count){
    const enc=new TextEncoder();
    const roster=[];
    for(let i=0;roster.length<count;i++){
      const hash  = await crypto.subtle.digest('SHA-256',enc.encode(xpub+i));
      const num   = new DataView(hash).getUint32(0,false);
      const hero  = HEROES[num % HEROES.length];
      if(!roster.some(h=>h.Name===hero.Name)) roster.push(hero);
    }
    return roster;
  }

  /* ---------------- grid renderer ---------------- */
  function renderGrid(list){
    const wrap=$('#roster');
    wrap.innerHTML='';
    const grid=document.createElement('div');
    grid.className='hero-grid';

    list.forEach(h=>{
      const name = toTitle(h.Name);
      const img  = portraitUrl(h.Name);
      const aObj = ABILITIES[h.Ability]||{};
      const arche= heroArchetype(h);
      const bg   = arche?`images/card_backgrounds/${arche}.webp`:'';
      const article=/^[aeiou]/i.test(h.Faction.trim())?'An':'A';

      /* ---- summarise ability effects ---- */
      const effByT={};
      Object.entries(aObj)
        .filter(([k,v])=>k!=='Description'&&v!==0)
        .forEach(([k,v])=>{
          const [stat,targetRaw]=k.split('_');
          const abbr=STAT_ABBR[stat]||stat.toUpperCase();
          const sign=v>0?`+${v}`:v;
          const tgt=targetRaw||'Self';
          (effByT[tgt]=effByT[tgt]||[]).push(`${sign} ${abbr}`);
        });
      const effectTxt = Object.entries(effByT)
            .map(([t,a])=>`${a.join(', ')} to ${t}`).join('; ')||'—';
      const desc=(aObj.Description||'').trim()||'No description.';

      /* ---- stats tooltip (narrow) ---- */
      const statsHTML=`
          <div style="display:grid;grid-template-columns:45px 45px;gap:1px;">
            <div>STR</div><div>${h.Strength}</div>
            <div>DEX</div><div>${h.Dexterity}</div>
            <div>CON</div><div>${h.Constitution}</div>
            <div>INT</div><div>${h.Intelligence}</div>
            <div>WIS</div><div>${h.Wisdom}</div>
            <div>CHA</div><div>${h.Charisma}</div>
          </div>`;

      grid.insertAdjacentHTML('beforeend',`
        <div class="hero-card" style="background-image:url('${bg}')">
          <div style="position:relative;display:inline-block">
            <img src="${img}" class="portrait" loading="lazy" alt="${name}">
            <div class="hero-subheading" style="position:absolute;bottom:2px;left:2px">
              HP: ${h.Health}<br>Mana: ${h.Mana}
            </div>
          </div>

          <div style="display:grid;grid-template-areas:'t' 'a';gap:4px;margin-top:4px">
            <div style="grid-area:t;text-align:center">
              <div class="hero-name-banner">
                <span class="name-container">
                  <span>${name}</span>
                  <span class="tooltip-box-stats">${statsHTML}</span>
                </span>
              </div>
              <div class="hero-subheading" style="margin-top:2px">
                ${article} ${h.Faction} ${h.Class}<br>from<br>${h.Kingdom}
              </div>
            </div>

            <div class="ability-block" style="grid-area:a;max-width:85%;margin:0 auto">
              <span class="ability-container">
                <span class="ability-name">${h.Ability}:</span>
                <span class="ability-effects">${effectTxt}</span>
                <span class="tooltip-box-ability">${desc}</span>
              </span>
            </div>
          </div>
        </div>`);
    });

    wrap.append(grid);
    wrap.classList.remove('hidden');
    activateTooltips();
  }

  /* ---- floating tooltips (ability + stats) ---- */
  function activateTooltips(){
    document.querySelectorAll('.ability-container').forEach(c=>{
      const tip=c.querySelector('.tooltip-box-ability');
      if(!tip) return;
      const mv=e=>{tip.style.top=`${e.clientY-12}px`;tip.style.left=`${e.clientX+14}px`;};
      c.addEventListener('mouseenter',e=>{document.body.append(tip);tip.style.display='block';tip.style.position='fixed';mv(e);});
      c.addEventListener('mousemove',mv);
      c.addEventListener('mouseleave',()=>{tip.style.display='none';c.append(tip);});
    });
    document.querySelectorAll('.name-container').forEach(c=>{
      const tip=c.querySelector('.tooltip-box-stats');
      if(!tip) return;
      tip.style.whiteSpace='nowrap'; tip.style.width='70px';
      const mv=e=>{tip.style.top=`${e.clientY-12}px`;tip.style.left=`${e.clientX+14}px`;};
      c.addEventListener('mouseenter',e=>{document.body.append(tip);tip.style.display='block';tip.style.position='fixed';mv(e);});
      c.addEventListener('mousemove',mv);
      c.addEventListener('mouseleave',()=>{tip.style.display='none';c.append(tip);});
    });
  }

  /* ---------------- data loading ------------------ */
  Promise.all([
    fetch('heroes.json').then(r=>r.json()),
    fetch('abilities.json').then(r=>r.json()),
    fetch('archetypes.json').then(r=>r.json())
  ]).then(([h,a,arc])=>{
    HEROES   = Array.isArray(h) ? h : Object.values(h);
    ABILITIES= Array.isArray(a) ? Object.fromEntries(a.map(x=>[x.Ability,x])) : a;
    ARCHETYPES = arc;
    flash('Discover heroes bound to your public key!');
  }).catch(err=>flash('Failed to load data: '+err,true));

  /* ---------------- UI actions -------------------- */
  $('#go').addEventListener('click', async () => {
    const xpub=$('#xpub').value.trim();
    if(!xpub)  return flash('Enter a public key first!',true);

    const roster = await pickRoster(xpub,ROSTER_SIZE);
    renderGrid(roster);

    /* hand off roster to draft.html */
    sessionStorage.setItem('roster', JSON.stringify(roster));

    /* reveal & wire the Continue button only once */
    const btn = $('#continue');
    btn.disabled=false;
    btn.classList.remove('hidden');
    if(!btn._wired){
      btn.addEventListener('click',()=>window.location.href='draft.html');
      btn._wired=true;
    }
  });
});
