// quest.js  –  walking demo with debug logging for sprite loading
//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

window.addEventListener("DOMContentLoaded", () => {
  const infoDiv = document.getElementById("info");
  const canvas  = document.getElementById("gameCanvas");
  if (!canvas || !infoDiv) {
    console.error("Missing #gameCanvas or #info in quest.html");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Resize
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Hero name
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // World
  const WORLD_W = 2000, WORLD_H = 2000;

  // Player
  const player = { x: WORLD_W/2, y: WORLD_H/2, w: 0, h: 0, speed: 4, dx:0, dy:0 };

  // Load sprite sheet
  const sprite = new Image();
  sprite.onload = () => {
    console.log("✅ Sprite loaded:", sprite.src, "size=", sprite.width, "×", sprite.height);
    frameW = sprite.width / COLS;
    frameH = sprite.height / ROWS;
    player.w = frameW;
    player.h = frameH;
    requestAnimationFrame(loop);
  };
  sprite.onerror = () => {
    console.error("❌ Failed to load sprite at:", sprite.src);
    // fallback to block
    frameW = frameH = 32;
    player.w = player.h = 32;
    requestAnimationFrame(loop);
  };
  // Use absolute path from site root:
  sprite.src = "/sprites/characters/sprite.png";

  const ROWS = 4, COLS = 4;
  let frameW, frameH;
  let frameIndex = 0, frameTimer = 0, lastTime = 0;
  const FRAME_RATE = 8;
  let lastDirection = 0; // 0=down,1=up,2=left,3=right

  // Obstacles
  const obstacles = [];
  for (let i = 0; i < 50; i++) {
    const w = 50 + Math.random() * 150;
    const h = 50 + Math.random() * 150;
    const x = Math.random() * (WORLD_W - w);
    const y = Math.random() * (WORLD_H - h);
    obstacles.push({ x,y,w,h });
  }

  // Input
  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup",   e => keys[e.key] = false);

  function rectsOverlap(a,b){
    return !(
      a.x + a.w <= b.x ||
      a.x >= b.x + b.w ||
      a.y + a.h <= b.y ||
      a.y >= b.y + b.h
    );
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // Determine velocity & direction
    let moving = false;
    if (keys.ArrowLeft||keys.a)  { player.dx = -player.speed; lastDirection = 2; moving = true; }
    else if (keys.ArrowRight||keys.d){ player.dx = player.speed; lastDirection = 3; moving = true; }
    else { player.dx = 0; }

    if (keys.ArrowUp||keys.w)    { player.dy = -player.speed; lastDirection = 1; moving = true; }
    else if (keys.ArrowDown||keys.s){ player.dy = player.speed; lastDirection = 0; moving = true; }
    else { player.dy = 0; }

    // Animate
    if (moving) {
      frameTimer += delta;
      if (frameTimer >= 1000 / FRAME_RATE) {
        frameIndex = (frameIndex + 1) % COLS;
        frameTimer -= 1000 / FRAME_RATE;
      }
    } else {
      frameIndex = 0;
    }

    // Movement + collision
    let next = { ...player, x: player.x + player.dx, w:player.w, h:player.h };
    if (!obstacles.some(o=>rectsOverlap(next,o))) player.x = next.x;
    next = { ...player, y: player.y + player.dy, w:player.w, h:player.h };
    if (!obstacles.some(o=>rectsOverlap(next,o))) player.y = next.y;

    // Draw scene
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save();
    ctx.translate(-camX, -camY);

    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0,0,WORLD_W,WORLD_H);

    obstacles.forEach(o=>{
      ctx.fillStyle="#d22"; ctx.fillRect(o.x,o.y,o.w,o.h);
      ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.strokeRect(o.x,o.y,o.w,o.h);
    });

    // Draw sprite / fallback
    if (sprite.complete && frameW && frameH) {
      ctx.drawImage(
        sprite,
        frameIndex * frameW,
        lastDirection * frameH,
        frameW, frameH,
        player.x, player.y,
        frameW, frameH
      );
    } else {
      ctx.fillStyle="#ffcc00"; ctx.fillRect(player.x,player.y,player.w,player.h);
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }
});
