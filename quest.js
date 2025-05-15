// quest.js  –  solid light-green world with 8×8 boulders & 4×4 trees + transparent character
window.addEventListener("DOMContentLoaded", () => {
  // ─── DOM & CANVAS ───────────────────────────────────────────────────────────
  const infoDiv = document.getElementById("info");
  const canvas  = document.getElementById("gameCanvas");
  if (!infoDiv || !canvas) {
    console.error("Missing #info or #gameCanvas");
    return;
  }
  const ctx = canvas.getContext("2d");
  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  window.addEventListener("resize", resize);
  resize();

  // ─── SHOW HERO NAME ──────────────────────────────────────────────────────────
  const heroName = new URLSearchParams(location.search).get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // ─── CONSTANTS & STATE ───────────────────────────────────────────────────────
  const WORLD_W     = 2000, WORLD_H = 2000;
  const CHAR_ROWS   = 4, CHAR_COLS = 4, CHAR_SCALE = 0.1;
  const FRAME_RATE  = 8;   // fps
  const GRASS_COLOR = "#90EE90";

  const BOULDER_COLS = 8, BOULDER_ROWS = 8;  // 1024×1024 → 8×8
  const TREE_COLS    = 4, TREE_ROWS    = 4;  // 512×512 → 4×4

  let charFrameW, charFrameH;
  let spriteCanvas, boulderCanvas, treeCanvas;
  let envCellW, envCellH, treeCellW, treeCellH;
  let obstacles = [];

  let frameIndex = 0, frameTimer = 0, lastTime = 0, lastDir = 0;
  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup",   e => keys[e.key] = false);

  const player = { x:WORLD_W/2, y:WORLD_H/2, w:0, h:0, speed:4, dx:0, dy:0 };

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  function rectsOverlap(a,b){
    return !(a.x+a.w<=b.x||a.x>=b.x+b.w||a.y+a.h<=b.y||a.y>=b.y+b.h);
  }
  function genObstacles(count){
    const obs=[];
    while(obs.length<count){
      const w=50+Math.random()*150, h=50+Math.random()*150;
      const x=Math.random()*(WORLD_W-w), y=Math.random()*(WORLD_H-h);
      const rect={x,y,w,h};
      if(!rectsOverlap(rect,player)){
        rect.type = Math.random()<0.5?"boulder":"tree";
        const maxIdx = rect.type==="boulder"
          ? BOULDER_COLS*BOULDER_ROWS
          : TREE_COLS*TREE_ROWS;
        rect.spriteIndex = Math.floor(Math.random()*maxIdx);
        obs.push(rect);
      }
    }
    return obs;
  }

  // ─── MAIN LOOP ─────────────────────────────────────────────────────────────
  function loop(ts){
    if(!lastTime) lastTime=ts;
    const delta = ts - lastTime;
    lastTime = ts;

    // movement & facing
    let moving=false;
    if(keys.ArrowLeft||keys.a){ player.dx=-player.speed; lastDir=2; moving=true; }
    else if(keys.ArrowRight||keys.d){ player.dx=player.speed; lastDir=3; moving=true; }
    else player.dx=0;
    if(keys.ArrowUp||keys.w){ player.dy=-player.speed; lastDir=1; moving=true; }
    else if(keys.ArrowDown||keys.s){ player.dy=player.speed; lastDir=0; moving=true; }
    else player.dy=0;

    // animate
    if(moving){
      frameTimer += delta;
      if(frameTimer >= 1000/FRAME_RATE){
        frameIndex = (frameIndex + 1) % CHAR_COLS;
        frameTimer -= 1000/FRAME_RATE;
      }
    } else frameIndex = 0;

    // collision + move X
    let next={...player, x:player.x+player.dx};
    if(!obstacles.some(o=>rectsOverlap(next,o))) player.x = next.x;
    // collision + move Y
    next={...player, y:player.y+player.dy};
    if(!obstacles.some(o=>rectsOverlap(next,o))) player.y = next.y;

    // draw world
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save(); ctx.translate(-camX, -camY);

    // ground
    ctx.fillStyle = GRASS_COLOR;
    ctx.fillRect(0,0,WORLD_W,WORLD_H);

    // obstacles via sprites
    obstacles.forEach(o=>{
      const idx = o.spriteIndex;
      if(o.type==="boulder"){
        const col = idx % BOULDER_COLS,
              row = Math.floor(idx/BOULDER_COLS);
        ctx.drawImage(
          boulderCanvas,
          col*envCellW, row*envCellH, envCellW, envCellH,
          o.x, o.y, envCellW, envCellH
        );
      } else {
        const col = idx % TREE_COLS,
              row = Math.floor(idx/TREE_COLS);
        ctx.drawImage(
          treeCanvas,
          col*treeCellW, row*treeCellH, treeCellW, treeCellH,
          o.x, o.y, treeCellW, treeCellH
        );
      }
    });

    // character
    if(spriteCanvas){
      ctx.drawImage(
        spriteCanvas,
        frameIndex*charFrameW, lastDir*charFrameH,
        charFrameW, charFrameH,
        player.x, player.y,
        player.w, player.h
      );
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // ─── LOAD & PREPROCESS SHEETS ─────────────────────────────────────────────
  let loadCount=0;
  function onImgLoad(){ if(++loadCount===3) initialize(); }

  // character sheet
  const sheet = new Image();
  sheet.src    = "/sprites/characters/sprite.png";
  sheet.onload = onImgLoad;

  // boulder sheet (8×8)
  const boulderSheet = new Image();
  boulderSheet.src    = "/sprites/environment/boulders.png";
  boulderSheet.onload = () => {
    envCellW = boulderSheet.width  / BOULDER_COLS;
    envCellH = boulderSheet.height / BOULDER_ROWS;
    // strip near-white
    boulderCanvas = document.createElement("canvas");
    boulderCanvas.width  = boulderSheet.width;
    boulderCanvas.height = boulderSheet.height;
    const bc = boulderCanvas.getContext("2d");
    bc.drawImage(boulderSheet, 0, 0);
    const bd = bc.getImageData(0, 0, boulderSheet.width, boulderSheet.height),
          db = bd.data;
    for(let i=0;i<db.length;i+=4){
      if(db[i]>240&&db[i+1]>240&&db[i+2]>240) db[i+3]=0;
    }
    bc.putImageData(bd, 0, 0);
    onImgLoad();
  };

  // tree sheet (4×4)
  const treeSheet = new Image();
  treeSheet.src    = "/sprites/environment/trees.png";
  treeSheet.onload = () => {
    treeCellW = treeSheet.width  / TREE_COLS;
    treeCellH = treeSheet.height / TREE_ROWS;
    // strip near-white
    treeCanvas = document.createElement("canvas");
    treeCanvas.width  = treeSheet.width;
    treeCanvas.height = treeSheet.height;
    const tc = treeCanvas.getContext("2d");
    tc.drawImage(treeSheet, 0, 0);
    const td = tc.getImageData(0, 0, treeSheet.width, treeSheet.height),
          dt = td.data;
    for(let i=0;i<dt.length;i+=4){
      if(dt[i]>240&&dt[i+1]>240&&dt[i+2]>240) dt[i+3]=0;
    }
    tc.putImageData(td, 0, 0);
    onImgLoad();
  };

  function initialize(){
    // preprocess character
    spriteCanvas = document.createElement("canvas");
    spriteCanvas.width  = sheet.width;
    spriteCanvas.height = sheet.height;
    const sc = spriteCanvas.getContext("2d");
    sc.drawImage(sheet, 0, 0);
    const cd = sc.getImageData(0, 0, sheet.width, sheet.height),
          dd = cd.data;
    for(let i=0;i<dd.length;i+=4){
      if(dd[i]>240&&dd[i+1]>240&&dd[i+2]>240) dd[i+3]=0;
    }
    sc.putImageData(cd, 0, 0);

    // char frames & player size
    charFrameW = sheet.width  / CHAR_COLS;
    charFrameH = sheet.height / CHAR_ROWS;
    player.w   = charFrameW * CHAR_SCALE;
    player.h   = charFrameH * CHAR_SCALE;

    // spawn obstacles
    obstacles = genObstacles(50);

    // start loop
    requestAnimationFrame(loop);
  }
});
