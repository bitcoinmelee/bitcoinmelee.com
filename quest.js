// quest.js  –  boulder (5×6) & tree (5×5) sprites + transparent character
window.addEventListener("DOMContentLoaded", () => {
  // ─── DOM & CANVAS ───────────────────────────────────────────────────────────
  const infoDiv = document.getElementById("info");
  const canvas  = document.getElementById("gameCanvas");
  if (!infoDiv || !canvas) {
    console.error("Missing #info or #gameCanvas");
    return;
  }
  const ctx = canvas.getContext("2d");
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // ─── SHOW HERO NAME ──────────────────────────────────────────────────────────
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // ─── CONSTANTS ────────────────────────────────────────────────────────────────
  const WORLD_W    = 2000, WORLD_H = 2000;
  const CHAR_ROWS  = 4, CHAR_COLS = 4, CHAR_SCALE = 0.1;
  const FRAME_RATE = 8;              // fps
  const GRASS_COLOR = "#90EE90";

  const BOULDER_COLS = 5, BOULDER_ROWS = 6;
  const TREE_COLS    = 5, TREE_ROWS    = 5;

  // ─── STATE ───────────────────────────────────────────────────────────────────
  let charFrameW, charFrameH;
  let spriteCanvas;
  let envCellW, envCellH, treeCellW, treeCellH;
  let obstacles = [];
  let frameIndex = 0, frameTimer = 0, lastTime = 0, lastDir = 0;

  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup",   e => keys[e.key] = false);

  const player = {
    x: WORLD_W/2,
    y: WORLD_H/2,
    w: 0,
    h: 0,
    speed: 4,
    dx: 0,
    dy: 0
  };

  function rectsOverlap(a,b) {
    return !(
      a.x + a.w <= b.x ||
      a.x >= b.x + b.w ||
      a.y + a.h <= b.y ||
      a.y >= b.y + b.h
    );
  }

  function genObstacles(count) {
    const obs = [];
    while (obs.length < count) {
      const w = 50 + Math.random()*150;
      const h = 50 + Math.random()*150;
      const x = Math.random()*(WORLD_W - w);
      const y = Math.random()*(WORLD_H - h);
      const rect = { x,y,w,h };
      if (!rectsOverlap(rect, player)) {
        rect.type = Math.random() < 0.5 ? "boulder" : "tree";
        rect.spriteIndex = Math.floor(Math.random() * (rect.type === "boulder" ? BOULDER_COLS*BOULDER_ROWS : TREE_COLS*TREE_ROWS));
        obs.push(rect);
      }
    }
    return obs;
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    // movement & facing
    let moving = false;
    if (keys.ArrowLeft||keys.a)  { player.dx=-player.speed; lastDir=2; moving=true; }
    else if (keys.ArrowRight||keys.d){ player.dx=player.speed; lastDir=3; moving=true; }
    else player.dx=0;
    if (keys.ArrowUp||keys.w)    { player.dy=-player.speed; lastDir=1; moving=true; }
    else if (keys.ArrowDown||keys.s){ player.dy=player.speed; lastDir=0; moving=true; }
    else player.dy=0;

    // animate frames
    if (moving) {
      frameTimer += delta;
      if (frameTimer >= 1000/FRAME_RATE) {
        frameIndex = (frameIndex + 1) % CHAR_COLS;
        frameTimer -= 1000/FRAME_RATE;
      }
    } else {
      frameIndex = 0;
    }

    // collision + move X
    let next = { ...player, x: player.x + player.dx };
    if (!obstacles.some(o=>rectsOverlap(next,o))) player.x = next.x;
    // collision + move Y
    next = { ...player, y: player.y + player.dy };
    if (!obstacles.some(o=>rectsOverlap(next,o))) player.y = next.y;

    // draw world
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // ground
    ctx.fillStyle = GRASS_COLOR;
    ctx.fillRect(0,0,WORLD_W,WORLD_H);

    // draw obstacles
    obstacles.forEach(o => {
      const idx = o.spriteIndex;
      const col = idx % (o.type==="boulder" ? BOULDER_COLS : TREE_COLS);
      const row = Math.floor(idx / (o.type==="boulder" ? BOULDER_COLS : TREE_COLS));
      if (o.type === "boulder") {
        ctx.drawImage(
          boulderSheet,
          col * envCellW, row * envCellH, envCellW, envCellH,
          o.x, o.y, o.w, o.h
        );
      } else {
        ctx.drawImage(
          treeSheet,
          col * treeCellW, row * treeCellH, treeCellW, treeCellH,
          o.x, o.y, o.w, o.h
        );
      }
    });

    // draw character
    if (spriteCanvas) {
      ctx.drawImage(
        spriteCanvas,
        frameIndex * charFrameW,
        lastDir    * charFrameH,
        charFrameW, charFrameH,
        player.x,   player.y,
        player.w,   player.h
      );
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // ─── LOAD & INITIALIZE SHEETS ─────────────────────────────────────────────
  let loadCount = 0;
  function onImgLoad() {
    if (++loadCount === 3) initialize();
  }

  // character sheet
  const sheet = new Image();
  sheet.src = "/sprites/characters/sprite.png";
  sheet.onload = onImgLoad;

  // boulder sheet
  const boulderSheet = new Image();
  boulderSheet.src = "/sprites/environment/boulders.png";
  boulderSheet.onload = () => {
    envCellW = boulderSheet.width  / BOULDER_COLS;
    envCellH = boulderSheet.height / BOULDER_ROWS;
    onImgLoad();
  };

  // tree sheet
  const treeSheet = new Image();
  treeSheet.src = "/sprites/environment/trees.png";
  treeSheet.onload = () => {
    treeCellW = treeSheet.width  / TREE_COLS;
    treeCellH = treeSheet.height / TREE_ROWS;
    onImgLoad();
  };

  function initialize() {
    // preprocess character transparency
    spriteCanvas = document.createElement("canvas");
    spriteCanvas.width  = sheet.width;
    spriteCanvas.height = sheet.height;
    const sc = spriteCanvas.getContext("2d");
    sc.drawImage(sheet, 0, 0);
    const imgData = sc.getImageData(0, 0, sheet.width, sheet.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 240 && d[i+1] > 240 && d[i+2] > 240) d[i+3] = 0;
    }
    sc.putImageData(imgData, 0, 0);

    // compute char frames & player size
    charFrameW = sheet.width  / CHAR_COLS;
    charFrameH = sheet.height / CHAR_ROWS;
    player.w   = charFrameW * CHAR_SCALE;
    player.h   = charFrameH * CHAR_SCALE;

    // spawn obstacles
    obstacles = genObstacles(50);

    // kick off loop
    requestAnimationFrame(loop);
  }
});
