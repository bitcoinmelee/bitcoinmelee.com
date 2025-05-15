// quest.js  –  walking demo with heroName from URL

;(function(){
  const canvas = document.getElementById("gameCanvas");
  const ctx    = canvas.getContext("2d");

  // resize
  function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // read hero name from ?hero=…
  const params   = new URLSearchParams(location.search);
  const heroName = params.get("hero") || "Adventurer";
  document.getElementById("info").textContent =
    `${heroName} explores the realm — Use ←↑→↓ or WASD to move`;

  // world dimensions
  const WORLD_W = 2000, WORLD_H = 2000;

  // player state
  const player = {
    x: WORLD_W/2, y: WORLD_H/2,
    w: 32, h: 32,
    speed: 4,
    dx: 0, dy: 0
  };

  // random obstacles
  const obstacles = [];
  for(let i=0;i<50;i++){
    const w = 50 + Math.random()*150;
    const h = 50 + Math.random()*150;
    const x = Math.random()*(WORLD_W - w);
    const y = Math.random()*(WORLD_H - h);
    obstacles.push({ x,y,w,h });
  }

  // input tracking
  const keys = {};
  window.addEventListener("keydown", e => { keys[e.key] = true; });
  window.addEventListener("keyup",   e => { keys[e.key] = false; });

  // AABB collision
  function rectsOverlap(a,b){
    return !(
      a.x + a.w <= b.x ||
      a.x >= b.x + b.w ||
      a.y + a.h <= b.y ||
      a.y >= b.y + b.h
    );
  }

  // main loop
  function loop(){
    // update velocity
    player.dx = (keys.ArrowLeft||keys.a)  ? -player.speed :
                (keys.ArrowRight||keys.d) ?  player.speed : 0;
    player.dy = (keys.ArrowUp||keys.w)    ? -player.speed :
                (keys.ArrowDown||keys.s)  ?  player.speed : 0;

    // try move X
    let next = { ...player, x: player.x + player.dx };
    if(!obstacles.some(o=>rectsOverlap(next,o))){
      player.x = next.x;
    }
    // try move Y
    next = { ...player, y: player.y + player.dy };
    if(!obstacles.some(o=>rectsOverlap(next,o))){
      player.y = next.y;
    }

    // clear screen
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // camera to center on player
    const camX = player.x - canvas.width/2 + player.w/2;
    const camY = player.y - canvas.height/2 + player.h/2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // draw ground
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0,0,WORLD_W,WORLD_H);

    // draw obstacles
    ctx.fillStyle = "#555";
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // draw player
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // start
  loop();

})();
