// quest.js — green field + dynamic 4×4 sprite walk

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

  // 3) Load sprite sheet
  const rawSprite = new Image();
  rawSprite.src = "/sprites/characters/sprite.png";

  // 4) Grid + scale
  const COLS = 4, ROWS = 4;
  const SCALE = 0.1;           // 10× smaller
  const ROW_DOWN  = 0, ROW_UP = 1, ROW_LEFT = 2, ROW_RIGHT = 3;

  // 5) Variables to be set on load
  let FRAME_W, FRAME_H, sheetCanvas, sheetCtx;

  // 6) Hero state
  let x, y, dir = ROW_DOWN, frame = 0, timer = 0;
  const keys = {};

  // 7) Resize
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    x = canvas.width  / 2;
    y = canvas.height / 2;
  }
  window.addEventListener("resize", resize);

  // 8) Process sprite sheet when loaded
  rawSprite.onload = () => {
    // offscreen canvas to filter transparency
    sheetCanvas = document.createElement("canvas");
    sheetCanvas.width  = rawSprite.naturalWidth;
    sheetCanvas.height = rawSprite.naturalHeight;
    sheetCtx = sheetCanvas.getContext("2d");

    sheetCtx.drawImage(rawSprite, 0, 0);
    const imgData = sheetCtx.getImageData(0, 0, sheetCanvas.width, sheetCanvas.height);
    const data    = imgData.data;

    // make near-white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] >= 250 && data[i+1] >= 250 && data[i+2] >= 250) {
        data[i+3] = 0;
      }
    }
    sheetCtx.putImageData(imgData, 0, 0);

    // compute frame size
    FRAME_W = Math.floor(sheetCanvas.width  / COLS);
    FRAME_H = Math.floor(sheetCanvas.height / ROWS);

    // start after 3s
    resize();
    setTimeout(() => {
      msg.style.display    = "none";
      canvas.style.display = "block";
      requestAnimationFrame(loop);
    }, 3000);
  };

  // 9) Input
  window.addEventListener("keydown", e => {
    if (e.key.startsWith("Arrow")) {
      keys[e.key] = true; e.preventDefault();
    }
  });
  window.addEventListener("keyup", e => {
    if (e.key.startsWith("Arrow")) {
      delete keys[e.key]; e.preventDefault();
    }
  });

  // 10) Update
  function update() {
    const speed = 4;
    let moving = false;

    if (keys["ArrowUp"])    { y -= speed; dir = ROW_UP;    moving = true; }
    else if (keys["ArrowDown"])  { y += speed; dir = ROW_DOWN;  moving = true; }
    else if (keys["ArrowLeft"])  { x -= speed; dir = ROW_LEFT;  moving = true; }
    else if (keys["ArrowRight"]) { x += speed; dir = ROW_RIGHT; moving = true; }

    if (moving) {
      timer++;
      if (timer > 6) {
        frame = (frame + 1) % COLS;
        timer = 0;
      }
    } else {
      frame = 0;
      timer = 0;
    }

    // clamp
    x = Math.max(FRAME_W*SCALE/2, Math.min(canvas.width - FRAME_W*SCALE/2, x));
    y = Math.max(FRAME_H*SCALE/2, Math.min(canvas.height - FRAME_H*SCALE/2, y));
  }

  // 11) Draw (green field comes from CSS background)
  function draw() {
    // clear drawing area
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw sprite frame
    ctx.drawImage(
      sheetCanvas,
      frame * FRAME_W,    // sx
      dir   * FRAME_H,    // sy
      FRAME_W, FRAME_H,   // sw, sh
      x - (FRAME_W*SCALE)/2,
      y - (FRAME_H*SCALE)/2,
      FRAME_W * SCALE,
      FRAME_H * SCALE
    );
  }

  // 12) Loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
});
