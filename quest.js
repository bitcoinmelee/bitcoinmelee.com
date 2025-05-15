// quest.js  – walking demo with obstacles and safe DOM access

window.addEventListener("DOMContentLoaded", () => {
  // Grab elements
  const infoDiv = document.getElementById("info");
  const canvas  = document.getElementById("gameCanvas");
  if (!canvas || !infoDiv) {
    console.error("Missing #gameCanvas or #info in quest.html");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Handle resize
  function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Read hero name from URL
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  infoDiv.textContent = `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // World dimensions
  const WORLD_W = 2000, WORLD_H = 2000;

  // Player state
  const player = {
    x: WORLD_W/2, y: WORLD_H/2,
    w: 32, h: 32,
    speed: 4,
    dx: 0, dy: 0
  };

  // Generate random obstacles
  const obstacles = [];
  for (let i = 0; i < 50; i++) {
    const w = 50 + Math.random() * 150;
    const h = 50 + Math.random() * 150;
    const x = Math.random() * (WORLD_W - w);
    const y = Math.random() * (WORLD_H - h);
    obstacles.push({ x, y, w, h });
  }

  // Input tracking
  const keys = {};
  window.addEventListener("keydown", e => { keys[e.key] = true; });
  window.addEventListener("keyup",   e => { keys[e.key] = false; });

  // AABB collision test
  function rectsOverlap(a, b) {
    return !(
      a.x + a.w <= b.x ||
      a.x >= b.x + b.w ||
      a.y + a.h <= b.y ||
      a.y >= b.y + b.h
    );
  }

  // Main loop
  function loop() {
    // Determine velocity
    player.dx = (keys.ArrowLeft || keys.a)  ? -player.speed :
                (keys.ArrowRight || keys.d) ?  player.speed : 0;
    player.dy = (keys.ArrowUp || keys.w)    ? -player.speed :
                (keys.ArrowDown || keys.s)  ?  player.speed : 0;

    // Attempt X move
    let next = { ...player, x: player.x + player.dx };
    if (!obstacles.some(o => rectsOverlap(next, o))) {
      player.x = next.x;
    }
    // Attempt Y move
    next = { ...player, y: player.y + player.dy };
    if (!obstacles.some(o => rectsOverlap(next, o))) {
      player.y = next.y;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Camera centered on player
    const camX = player.x - canvas.width / 2 + player.w / 2;
    const camY = player.y - canvas.height / 2 + player.h / 2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // Draw ground
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Draw obstacles (red with black border)
    obstacles.forEach(o => {
      ctx.fillStyle   = "#d22";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = "#000";
      ctx.lineWidth   = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // Draw player
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // Start animation
  loop();
});
