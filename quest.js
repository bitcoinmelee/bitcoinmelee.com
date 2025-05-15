// quest.js  –  solid light-green ground + boulders/trees + transparent sprite
window.addEventListener("DOMContentLoaded", () => {
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

  // Show hero name
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // Constants
  const WORLD_W    = 2000;
  const WORLD_H    = 2000;
  const ROWS       = 4;
  const COLS       = 4;
  const SCALE      = 0.1;
  const FRAME_RATE = 8;

  // State
  let frameW, frameH;
  let spriteCanvas;
  let grassColor = "#90EE90";  // solid light green
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

  // Helpers
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
        obs.push(rect);
      }
    }
    return obs;
  }

  // Main loop
  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    // Movement & facing
    let moving = false;
    if (keys.ArrowLeft||keys.a)  { player.dx = -player.speed; lastDir = 2; moving = true; }
    else if (keys.ArrowRight||keys.d){ player.dx = player.speed; lastDir = 3; moving = true; }
    else player.dx = 0;
    if (keys.ArrowUp||keys.w)    { player.dy = -player.speed; lastDir = 1; moving = true; }
    else if (keys.ArrowDown||keys.s){ player.dy = player.speed; lastDir = 0; moving = true; }
    else player.dy = 0;

    // Animate
    if (moving) {
      frameTimer += delta;
      if (frameTimer >= 1000/FRAME_RATE) {
        frameIndex = (frameIndex + 1) % COLS;
        frameTimer -= 1000/FRAME_RATE;
      }
    } else {
      frameIndex = 0;
    }

    // Collision + movement X
    let next = {...player, x: player.x + player.dx};
    if (!obstacles.some(o => rectsOverlap(next, o))) player.x = next.x;
    // Collision + movement Y
    next = {...player, y: player.y + player.dy};
    if (!obstacles.some(o => rectsOverlap(next, o))) player.y = next.y;

    // Draw
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // Solid ground
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Obstacles
    obstacles.forEach(o => {
      if (o.type === "boulder") {
        ctx.fillStyle   = "#888";
        ctx.strokeStyle = "#444";
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w/2, o.y + o.h/2, o.w/2, o.h/2, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        const tw = o.w*0.2, th = o.h*0.5;
        const tx = o.x + o.w/2 - tw/2, ty = o.y + o.h - th;
        ctx.fillStyle = "#8B5A2B";
        ctx.fillRect(tx, ty, tw, th);
        ctx.beginPath();
        ctx.fillStyle   = "#228822";
        ctx.strokeStyle = "#115511";
        ctx.lineWidth   = 2;
        ctx.arc(o.x + o.w/2, ty, o.w*0.5, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw sprite
    if (spriteCanvas && frameW && frameH) {
      ctx.drawImage(
        spriteCanvas,
        frameIndex * frameW,
        lastDir * frameH,
        frameW, frameH,
        player.x, player.y,
        player.w, player.h
      );
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // Load & preprocess sprite
  const sheet = new Image();
  sheet.src = "/sprites/characters/sprite.png";
  sheet.onload = () => {
    // Offscreen canvas for transparency
    spriteCanvas = document.createElement("canvas");
    spriteCanvas.width  = sheet.width;
    spriteCanvas.height = sheet.height;
    const sc = spriteCanvas.getContext("2d");
    sc.drawImage(sheet, 0, 0);
    const imgData = sc.getImageData(0, 0, sheet.width, sheet.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i]===255 && d[i+1]===255 && d[i+2]===255) {
        d[i+3] = 0;
      }
    }
    sc.putImageData(imgData, 0, 0);

    // Frame dims & player size
    frameW = sheet.width / COLS;
    frameH = sheet.height / ROWS;
    player.w = frameW * SCALE;
    player.h = frameH * SCALE;

    // Generate obstacles
    obstacles = genObstacles(50);

    // Start loop
    requestAnimationFrame(loop);
  };

  sheet.onerror = () => {
    console.error("Failed to load sprite:", sheet.src);
    player.w = player.h = 32;
    obstacles = genObstacles(50);
    requestAnimationFrame(loop);
  };
});
