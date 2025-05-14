// quest.js — full-screen walk with dynamic 4×4 slicing of your 1334×1997 sheet

document.addEventListener("DOMContentLoaded", () => {
  // 1) Hero check
  const hero = sessionStorage.getItem("selectedHero");
  if (!hero) {
    location.replace("index.html");
    return;
  }

  // 2) DOM refs
  const msg    = document.getElementById("message");
  const canvas = document.getElementById("gameCanvas");
  const ctx    = canvas.getContext("2d");

  // 3) Load sheet
  const sprite = new Image();
  sprite.src = "/sprites/characters/sprite.png";

  // 4) Constants for grid
  const COLS = 4, ROWS = 4, SCALE = 3;
  const ROW_DOWN  = 0, ROW_UP = 1, ROW_LEFT = 2, ROW_RIGHT = 3;

  // 5) State
  let FRAME_W, FRAME_H;
  let x, y, dir = ROW_DOWN, frame = 0, timer = 0;
  const keys = {};

  // 6) Resize to viewport
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    x = canvas.width  / 2;
    y = canvas.height / 2;
  }
  window.addEventListener("resize", resize);

  // 7) When sheet is ready
  sprite.onload = () => {
    // compute frame size from actual sheet dimensions
    FRAME_W = Math.floor(sprite.naturalWidth  / COLS);
    FRAME_H = Math.floor(sprite.naturalHeight / ROWS);
    resize();

    // show message for 3 s, then start
    setTimeout(() => {
      msg.style.display    = "none";
      canvas.style.display = "block";
      requestAnimationFrame(loop);
    }, 3000);
  };

  // 8) Input
  window.addEventListener("keydown", e => {
    if (e.key.startsWith("Arrow")) { keys[e.key] = true; e.preventDefault(); }
  });
  window.addEventListener("keyup", e => {
    if (e.key.startsWith("Arrow")) { delete keys[e.key]; e.preventDefault(); }
  });

  // 9) Update position & animation
  function update() {
    const speed = 4;
    let moving = false;

    if (keys["ArrowUp"])    { y -= speed; dir = ROW_UP;    moving = true; }
    else if (keys["ArrowDown"])  { y += speed; dir = ROW_DOWN;  moving = true; }
    else if (keys["ArrowLeft"])  { x -= speed; dir = ROW_LEFT;  moving = true; }
    else if (keys["ArrowRight"]) { x += speed; dir = ROW_RIGHT; moving = true; }

    if (moving) {
      timer++;
      if (timer > 6) { frame = (frame + 1) % COLS; timer = 0; }
    } else {
      frame = 0;
      timer = 0;
    }

    // clamp inside canvas
    x = Math.max(FRAME_W*SCALE/2, Math.min(canvas.width - FRAME_W*SCALE/2, x));
    y = Math.max(FRAME_H*SCALE/2, Math.min(canvas.height - FRAME_H*SCALE/2, y));
  }

  // 10) Draw sprite
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sprite,
      frame * FRAME_W,      // sx
      dir   * FRAME_H,      // sy
      FRAME_W, FRAME_H,     // sWidth, sHeight
      x - (FRAME_W*SCALE)/2,// dx
      y - (FRAME_H*SCALE)/2,// dy
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
