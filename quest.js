// quest.js  –  walking demo with 4×4 sprite-sheet animation
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

window.addEventListener("DOMContentLoaded", () => {
  const infoDiv = document.getElementById("info");
  const canvas  = document.getElementById("gameCanvas");
  if (!canvas || !infoDiv) {
    console.error("Missing #gameCanvas or #info in quest.html");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Resize canvas
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Read heroName from URL
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // World dimensions
  const WORLD_W = 2000, WORLD_H = 2000;

  // Player state
  const player = { x: WORLD_W/2, y: WORLD_H/2, w: 0, h: 0, speed: 4, dx:0, dy:0 };

  // Load 4×4 sprite-sheet
  const sprite = new Image();
  sprite.src   = "sprites/characters/sprite.png";   // ← your path here
  const ROWS    = 4, COLS = 4;
  let frameW, frameH;

  // Animation state
  let frameIndex = 0, frameTimer = 0, lastTime = 0;
  const FRAME_RATE = 8; // frames per second
  let lastDirection = 0; // 0:down,1:up,2:left,3:right

  // Obstacles
  const obstacles = [];
  for (let i=0; i<50; i++){
    const w = 50 + Math.random()*150;
    const h = 50 + Math.random()*150;
    const x = Math.random()*(WORLD_W - w);
    const y = Math.random()*(WORLD_H - h);
    obstacles.push({ x,y,w,h });
  }

  // Input
  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup",   e => keys[e.key] = false);

  // Collision
  function rectsOverlap(a,b){
    return !(a.x+a.w<=b.x||a.x>=b.x+b.w||a.y+a.h<=b.y||a.y>=b.y+b.h);
  }

  // Main loop
  function loop(timestamp){
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

    // Animate only when moving
    if (moving) {
      frameTimer += delta;
      if (frameTimer >= 1000/FRAME_RATE) {
        frameIndex = (frameIndex + 1) % COLS;
        frameTimer -= 1000/FRAME_RATE;
      }
    } else {
      frameIndex = 0; // reset to first frame
    }

    // Move X
    let next = { ...player, x: player.x + player.dx, w:player.w, h:player.h };
    if (!obstacles.some(o=>rectsOverlap(next,o))) player.x = next.x;
    // Move Y
    next = { ...player, y: player.y + player.dy, w:player.w, h:player.h };
    if (!obstacles.some(o=>rectsOverlap(next,o))) player.y = next.y;

    // Draw
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // Draw ground
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0,0,WORLD_W,WORLD_H);

    // Draw obstacles (bright red + black border)
    obstacles.forEach(o => {
      ctx.fillStyle   = "#d22";
      ctx.fillRect(o.x,o.y,o.w,o.h);
      ctx.strokeStyle = "#000";
      ctx.lineWidth   = 2;
      ctx.strokeRect(o.x,o.y,o.w,o.h);
    });

    // Draw animated sprite frame (once loaded)
    if (frameW && frameH) {
      ctx.drawImage(
        sprite,
        frameIndex * frameW,     // sx
        lastDirection * frameH,  // sy
        frameW, frameH,          // sw, sh
        player.x, player.y,      // dx, dy
        frameW, frameH           // dw, dh
      );
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // Initialize frame dimensions & start loop after sprite load
  sprite.onload = () => {
    frameW = sprite.width / COLS;
    frameH = sprite.height / ROWS;
    player.w = frameW;
    player.h = frameH;
    requestAnimationFrame(loop);
  };
});
