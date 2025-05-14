// quest.js  – CSP‐friendly, full‐screen canvas with 4×4 sprite walk

document.addEventListener("DOMContentLoaded", () => {
  // 1) Retrieve hero (hidden in sessionStorage)
  const hero = sessionStorage.getItem("selectedHero");
  if (!hero) {
    location.replace("index.html");
    return;
  }

  // 2) Constants
  const SPRITE_SRC = "/sprites/characters/sprite.png";  // absolute path
  const FRAME_W = 16, FRAME_H = 16, SCALE = 3;
  const ROW_DOWN = 0, ROW_UP = 1, ROW_LEFT = 2, ROW_RIGHT = 3;

  // 3) DOM refs
  const msg = document.getElementById("message");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // 4) Load sprite sheet
  const sprite = new Image();
  sprite.src = SPRITE_SRC;

  // 5) State
  let x, y, dir = ROW_DOWN, frame = 0, timer = 0;
  const keys = {};

  // 6) Resize to fill viewport
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    x = canvas.width / 2;
    y = canvas.height / 2;
  }
  window.addEventListener("resize", resize);

  // 7) Start after sprite loaded + 3 s
  sprite.onload = () => {
    resize();
    setTimeout(() => {
      msg.style.display = "none";
      canvas.style.display = "block";
      requestAnimationFrame(loop);
    }, 3000);
  };

  // 8) Input handling
  window.addEventListener("keydown", e => {
    if (e.key.startsWith("Arrow")) {
      keys[e.key] = true;
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", e => {
    if (e.key.startsWith("Arrow")) {
      delete keys[e.key];
      e.preventDefault();
    }
  });

  // 9) Update position & animation frame
  function update() {
    const speed = 4;
    let moving = false;
    if (keys["ArrowUp"])       { y -= speed; dir = ROW_UP;    moving = true; }
    else if (keys["ArrowDown"]) { y += speed; dir = ROW_DOWN;  moving = true; }
    else if (keys["ArrowLeft"]) { x -= speed; dir = ROW_LEFT;  moving = true; }
    else if (keys["ArrowRight"]){ x += speed; dir = ROW_RIGHT; moving = true; }

    if (moving) {
      timer++;
      if (timer > 6) {
        frame = (frame + 1) % 4;  // cycle 0→1→2→3 in that row
        timer = 0;
      }
    } else {
      frame = 0;
      timer = 0;
    }

    // clamp inside canvas
    x = Math.max(FRAME_W*SCALE/2, Math.min(canvas.width - FRAME_W*SCALE/2, x));
    y = Math.max(FRAME_H*SCALE/2, Math.min(canvas.height - FRAME_H*SCALE/2, y));
  }

  // 10) Draw current frame
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sprite,
      frame * FRAME_W,           // source x
      dir   * FRAME_H,           // source y (row)
      FRAME_W, FRAME_H,          // source w,h
      x - (FRAME_W*SCALE)/2,     // dest x
      y - (FRAME_H*SCALE)/2,     // dest y
      FRAME_W * SCALE, FRAME_H * SCALE
    );
  }

  // 11) Main loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
});
