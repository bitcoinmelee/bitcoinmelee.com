// quest.js  –  walking demo with scaled sprite and safe obstacle generation

window.addEventListener("DOMContentLoaded", () => {
  const infoDiv = document.getElementById("info");
  const canvas  = document.getElementById("gameCanvas");
  if (!canvas || !infoDiv) {
    console.error("Missing #gameCanvas or #info in quest.html");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Resize to fill window
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Hero name from URL
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // World size
  const WORLD_W = 200000, WORLD_H = 200000;

  // Player state (w/h set after sprite loads)
  const player = { x: WORLD_W/2, y: WORLD_H/2, w: 0, h: 0, speed: 4, dx: 0, dy: 0 };

  // Sprite-sheet setup
  const sprite = new Image();
  sprite.src   = "/sprites/characters/sprite.png";  // your path
  const ROWS   = 4, COLS = 4;
  const SCALE  = 0.1;       // 10× smaller
  let frameW, frameH;

  // Animation state
  let frameIndex = 0, frameTimer = 0, lastTime = 0;
  const FRAME_RATE   = 8;    // fps
  let lastDirection = 0;     // 0=down,1=up,2=left,3=right

  // Input tracking
  const keys = {};
  window.addEventListener("keydown", e => keys[e.key] = true);
  window.addEventListener("keyup",   e => keys[e.key] = false);

  // AABB collision test
  function rectsOverlap(a, b) {
    return !(
      a.x + a.w <= b.x ||
      a.x >= b.x + b.w ||
      a.y + a.h <= b.y ||
      a.y >= b.y + b.h
    );
  }

  // Placeholder obstacles array; will fill after sprite loads
  let obstacles = [];

  // Generate obstacles, skipping any that overlap the player’s start rect
  function genObstacles(count) {
    const obs = [];
    while (obs.length < count) {
      const w = 50 + Math.random() * 150;
      const h = 50 + Math.random() * 150;
      const x = Math.random() * (WORLD_W - w);
      const y = Math.random() * (WORLD_H - h);
      const rect = { x, y, w, h };
      // Use current player.x/y/w/h for initial box
      if (!rectsOverlap(rect, player)) {
        obs.push(rect);
      }
    }
    return obs;
  }

  // Main render loop
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // Determine dx/dy and facing row
    let moving = false;
    if (keys.ArrowLeft || keys.a) {
      player.dx = -player.speed; lastDirection = 2; moving = true;
    } else if (keys.ArrowRight || keys.d) {
      player.dx = player.speed; lastDirection = 3; moving = true;
    } else {
      player.dx = 0;
    }
    if (keys.ArrowUp || keys.w) {
      player.dy = -player.speed; lastDirection = 1; moving = true;
    } else if (keys.ArrowDown || keys.s) {
      player.dy = player.speed; lastDirection = 0; moving = true;
    } else {
      player.dy = 0;
    }

    // Advance frame if moving
    if (moving) {
      frameTimer += delta;
      if (frameTimer >= 1000 / FRAME_RATE) {
        frameIndex = (frameIndex + 1) % COLS;
        frameTimer -= 1000 / FRAME_RATE;
      }
    } else {
      frameIndex = 0;
    }

    // Move X with collision
    let next = { ...player, x: player.x + player.dx };
    if (!obstacles.some(o => rectsOverlap(next, o))) {
      player.x = next.x;
    }
    // Move Y with collision
    next = { ...player, y: player.y + player.dy };
    if (!obstacles.some(o => rectsOverlap(next, o))) {
      player.y = next.y;
    }

    // Draw scene
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const camX = player.x - canvas.width / 2 + player.w / 2;
    const camY = player.y - canvas.height / 2 + player.h / 2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // Ground
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Obstacles (red fill + black border)
    ctx.fillStyle   = "#d22";
    ctx.strokeStyle = "#000";
    ctx.lineWidth   = 2;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // Draw sprite frame if ready
    if (frameW && frameH) {
      ctx.drawImage(
        sprite,
        frameIndex * frameW,          // source x
        lastDirection * frameH,       // source y
        frameW, frameH,               // source w/h
        player.x, player.y,           // dest x/y
        player.w, player.h            // dest w/h (scaled)
      );
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // Once the sprite has loaded, set up sizes and obstacles, then start
  sprite.onload = () => {
    frameW = sprite.width / COLS;
    frameH = sprite.height / ROWS;
    player.w = frameW * SCALE;
    player.h = frameH * SCALE;
    // Center player (w/h updated)
    player.x = WORLD_W / 2;
    player.y = WORLD_H / 2;
    obstacles = genObstacles(50);
    requestAnimationFrame(loop);
  };

  sprite.onerror = () => {
    console.error("Failed to load sprite from", sprite.src);
    // fallback to a small block
    player.w = player.h = 32;
    player.x = WORLD_W / 2;
    player.y = WORLD_H / 2;
    obstacles = genObstacles(50);
    requestAnimationFrame(loop);
  };
});
