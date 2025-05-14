// quest.js — dynamic sprite slicing & full-screen walk

document.addEventListener("DOMContentLoaded", () => {
  // no hero → bounce back
  const hero = sessionStorage.getItem("selectedHero");
  if (!hero) {
    location.replace("index.html");
    return;
  }

  // DOM refs
  const msg    = document.getElementById("message");
  const canvas = document.getElementById("gameCanvas");
  const ctx    = canvas.getContext("2d");

  // load the sheet
  const sprite = new Image();
  sprite.src = "/sprites/characters/sprite.png";

  // will be set once loaded
  let FRAME_W, FRAME_H;
  const SCALE = 3;

  // direction rows
  const ROW_DOWN  = 0;
  const ROW_UP    = 1;
  const ROW_LEFT  = 2;
  const ROW_RIGHT = 3;

  // position + anim state
  let x, y, dir = ROW_DOWN, frame = 0, timer = 0;
  const keys = {};

  // resize canvas + center hero
  function resize() {
    canvas.width  = innerWidth;
    canvas.height = innerHeight;
    x = canvas.width / 2;
    y = canvas.height / 2;
  }
  window.addEventListener("resize", resize);

  // once the image is ready, compute frame size and start after 3s
  sprite.onload = () => {
    FRAME_W = sprite.naturalWidth  / 4;   // 4 columns
    FRAME_H = sprite.naturalHeight / 4;   // 4 rows
    resize();
    setTimeout(() => {
      msg.style.display    = "none";
      canvas.style.display = "block";
      requestAnimationFrame(loop);
    }, 3000);
  };

  // arrow-key input
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

  // update hero position + animation
  function update() {
    const speed = 4;
    let moving = false;

    if (keys["ArrowUp"])    { y -= speed; dir = ROW_UP;    moving = true; }
    else if (keys["ArrowDown"]){ y += speed; dir = ROW_DOWN;  moving = true; }
    else if (keys["ArrowLeft"]){ x -= speed; dir = ROW_LEFT;  moving = true; }
    else if (keys["ArrowRight"]){ x += speed; dir = ROW_RIGHT; moving = true; }

    if (moving) {
      timer++;
      if (timer > 6) {           // adjust for walk-cycle speed
        frame = (frame + 1) % 4; // cycle through 4 frames in that row
        timer = 0;
      }
    } else {
      frame = 0;
      timer = 0;
    }

    // clamp so the sprite stays on screen
    x = Math.max(FRAME_W * SCALE/2, Math.min(canvas.width - FRAME_W * SCALE/2, x));
    y = Math.max(FRAME_H * SCALE/2, Math.min(canvas.height - FRAME_H * SCALE/2, y));
  }

  // draw the proper sub-image
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sprite,
      frame       * FRAME_W,   // sx
      dir         * FRAME_H,   // sy
      FRAME_W, FRAME_H,        // sWidth, sHeight
      x - (FRAME_W*SCALE)/2,   // dx
      y - (FRAME_H*SCALE)/2,   // dy
      FRAME_W * SCALE,
      FRAME_H * SCALE
    );
  }

  // game loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
});
