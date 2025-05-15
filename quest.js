// quest.js  –  solid light-green world with boulder/tree sprites + transparent character
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
  const WORLD_W    = 2000;
  const WORLD_H    = 2000;
  const ROWS       = 4;
  const COLS       = 4;
  const SCALE      = 0.1;   // character at 10% of raw sprite size
  const FRAME_RATE = 8;     // fps
  const grassColor = "#90EE90";

  // ─── STATE VARIABLES ─────────────────────────────────────────────────────────
  let frameW, frameH;              // character frame size
  let envCellW, envCellH;          // boulder cell size
  let treeCellW, treeCellH;        // tree cell size
  let spriteCanvas;                // offscreen canvas for character
  let obstacles = [];              // { x,y,w,h,type,spriteIndex }
  let frameIndex = 0, frameTimer = 0, lastTime = 0, lastDir = 0;

  const keys = {};
  window.addEventListener("keydown",  e => keys[e.key] = true);
  window.addEventListener("keyup",    e => keys[e.key] = false);

  const player = {
    x: WORLD_W/2,
    y: WORLD_H/2,
    w: 0, h: 0,
    speed: 4,
    dx: 0, dy: 0
  };

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  function rectsOverlap(a, b) {
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
      const rect = { x, y, w, h };
      if (!rectsOverlap(rect, player)) {
        rect.type = Math.random() < 0.5 ? "boulder" : "tree";
        rect.spriteIndex = Math.floor(Math.random()*25);
        obs.push(rect);
      }
    }
    return obs;
  }

  // ─── MAIN LOOP ───────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    // Movement & facing
    let moving = false;
    if (keys.ArrowLeft||keys.a)  { player.dx = -player.speed; lastDir = 2; moving = true; }
    else if (keys.ArrowRight||keys.d) { player.dx = player.speed; lastDir = 3; moving = true; }
    else player.dx = 0;
    if (keys.ArrowUp||keys.w)    { player.dy = -player.speed; lastDir = 1; moving = true; }
    else if (keys.ArrowDown||keys.s) { player.dy = player.speed; lastDir = 0; moving = true; }
    else player.dy = 0;

    // Animate frames
    if (moving) {
      frameTimer += delta;
      if (frameTimer >= 1000/FRAME_RATE) {
        frameIndex = (frameIndex + 1) % COLS;
        frameTimer -= 1000/FRAME_RATE;
      }
    } else {
      frameIndex = 0;
    }

    // Collision + move X
    let next = { ...player, x: player.x + player.dx };
    if (!obstacles.some(o => rectsOverlap(next, o))) {
      player.x = next.x;
    }
    // Collision + move Y
    next = { ...player, y: player.y + player.dy };
    if (!obstacles.some(o => rectsOverlap(next, o))) {
      player.y = next.y;
    }

    // Draw frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // Solid ground
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Draw obstacles via sprites
    obstacles.forEach(o => {
      const idx = o.spriteIndex;
      const col = idx % 5;
      const row = Math.floor(idx / 5);
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

    // Draw transparent character sprite
    if (spriteCanvas) {
      ctx.drawImage(
        spriteCanvas,
        frameIndex * frameW,
        lastDir   * frameH,
        frameW, frameH,
        player.x, player.y,
        player.w, player.h
      );
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // ─── IMAGE LOADING & INITIALIZATION ────────────────────────────────────────
  let loadCount = 0;
  function onImgLoad() {
    if (++loadCount === 3) init();
  }

  // Character sheet
  const sheet = new Image();
  sheet.src = "/sprites/characters/sprite.png";
  sheet.onload = onImgLoad;

  // Boulder sheet (5×5 in 1024×1024)
  const boulderSheet = new Image();
  boulderSheet.src = "/sprites/environment/boulders.png";
  boulderSheet.onload = () => {
    envCellW = boulderSheet.width  / 5;
    envCellH = boulderSheet.height / 5;
    onImgLoad();
  };

  // Tree sheet (5×5 in 1024×1024)
  const treeSheet = new Image();
  treeSheet.src = "/sprites/environment/trees.png";
  treeSheet.onload = () => {
    treeCellW = treeSheet.width  / 5;
    treeCellH = treeSheet.height / 5;
    onImgLoad();
  };

  function init() {
    // 1) Preprocess character sheet to remove near-white
    spriteCanvas = document.createElement("canvas");
    spriteCanvas.width  = sheet.width;
    spriteCanvas.height = sheet.height;
    const sc = spriteCanvas.getContext("2d");
    sc.drawImage(sheet, 0, 0);
    const imgData = sc.getImageData(0, 0, sheet.width, sheet.height);
    const d       = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // strip any very light pixel
      if (d[i] > 240 && d[i+1] > 240 && d[i+2] > 240) {
        d[i+3] = 0;
      }
    }
    sc.putImageData(imgData, 0, 0);

    // 2) Compute frame dims & set player size
    frameW = sheet.width  / COLS;
    frameH = sheet.height / ROWS;
    player.w = frameW * SCALE;
    player.h = frameH * SCALE;

    // 3) Spawn obstacles
    obstacles = genObstacles(50);

    // 4) Kick off the rendering loop
    requestAnimationFrame(loop);
  }
});
