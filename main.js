(() => {
  // canvas overlay
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  // set canvas size to window size, and add event listener for window resize
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const ctx = canvas.getContext("2d");

  // for tracking mouse position
  let mouseX = 0,
    mouseY = 0;

  // load cursor images
  const cursorImg = new Image(),
    textCursorImg = new Image(),
    clickableCursorImg = new Image();
  cursorImg.src =
    "https://help.apple.com/assets/67D1B1065D0706C4AD080C54/67D1B10E5D0706C4AD080C79/en_US/a0d5e859e5f2b01dbbf81dfc38a3a92f.png";
  textCursorImg.src =
    "https://help.apple.com/assets/67D1B1065D0706C4AD080C54/67D1B10E5D0706C4AD080C79/en_US/4595d039c945c563537aaf948a15b365.png";
  clickableCursorImg.src =
    "https://help.apple.com/assets/67D1B1065D0706C4AD080C54/67D1B10E5D0706C4AD080C79/en_US/ef7e7351ec881269ade953411d7b04e1.png";

  // current active cursor image
  let activeCursorImg = cursorImg;

  // event listener for mouse movement
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // get element under cursor
    const element = document.elementFromPoint(mouseX, mouseY);

    if (element) {
      // see if it already has a cursor set
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.cursor === "text") {
        activeCursorImg = textCursorImg;
      } else if (computedStyle.cursor === "pointer") {
        activeCursorImg = clickableCursorImg;
      }
      // if element is text-esque, use text cursor
      else if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName.startsWith("H") ||
        element.tagName === "P" ||
        element.tagName === "SPAN" ||
        element.isContentEditable
      ) {
        activeCursorImg = textCursorImg;
      }
      // if element is clickable, use clickable cursor
      else if (
        element.onclick ||
        element.tagName === "BUTTON" ||
        element.tagName === "A" ||
        element.role === "button" ||
        element.getAttribute("role") === "button"
      ) {
        activeCursorImg = clickableCursorImg;
      } else {
        activeCursorImg = cursorImg;
      }
    }
  });

  // boid class
  class Boid {
    constructor() {
      // spawn randomly in viewport
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.size = 8;

      // add some random variation to each boid's behavior
      this.separationStrength = 0.08 + Math.random() * 0.4;
      this.alignmentStrength = 0.05 + Math.random() * 0.02;
      this.cohesionStrength = 0.01 + Math.random() * 0.005;
      this.separationDistance = this.size * 10;
    }

    update(boids) {
      // calculate flock center
      let centerX = 0,
        centerY = 0;
      for (let boid of boids) {
        centerX += boid.x;
        centerY += boid.y;
      }
      centerX /= boids.length;
      centerY /= boids.length;

      // separation
      let sepX = 0,
        sepY = 0,
        count = 0;

      // alignment
      let alignX = 0,
        alignY = 0;
      count = 0;

      for (let other of boids) {
        // skip if the boid is the same as the current boid
        if (other === this) continue;

        // calculate distance between boids
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // if the distance is less than the separation distance, add to the separation force
        if (dist < this.separationDistance) {
          // makes it so that the boids don't overlap
          const force = 1 - dist / this.separationDistance;
          sepX += (dx / dist) * force;
          sepY += (dy / dist) * force;
          count++;
        }

        // if the distance is less than 50, add to the alignment force
        if (dist < 50) {
          // ensures that the boids are moving in the same direction collectively
          alignX += other.vx;
          alignY += other.vy;
          count++;
        }
      }

      // if there are other boids, average the separation force and alignment force
      if (count > 0) {
        sepX /= count;
        sepY /= count;

        alignX /= count;
        alignY /= count;
        // also add some randomness to the alignment force
        alignX += (Math.random() - 0.5) * 0.5;
        alignY += (Math.random() - 0.5) * 0.5;
      }

      // cohesion (towards flock center)
      const cohX = centerX - this.x,
        cohY = centerY - this.y;

      // flock movement towards mouse
      const flockToMouseX = mouseX - centerX,
        flockToMouseY = mouseY - centerY;

      // apply forces with individual variations
      this.vx +=
        sepX * this.separationStrength +
        alignX * this.alignmentStrength +
        cohX * this.cohesionStrength +
        flockToMouseX * 0.005;
      this.vy +=
        sepY * this.separationStrength +
        alignY * this.alignmentStrength +
        cohY * this.cohesionStrength +
        flockToMouseY * 0.005;

      // add small random movement
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vy += (Math.random() - 0.5) * 0.1;

      // cap on speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 3) {
        this.vx = (this.vx / speed) * 3;
        this.vy = (this.vy / speed) * 3;
      }

      // update position
      this.x += this.vx;
      this.y += this.vy;

      // keep within bounds
      this.x = Math.max(0, Math.min(canvas.width, this.x));
      this.y = Math.max(0, Math.min(canvas.height, this.y));
    }

    draw() {
      // draw the image centered and scaled
      const size = this.size * 5;
      ctx.drawImage(
        activeCursorImg,
        this.x - size / 2,
        this.y - size / 2,
        size,
        size
      );
    }
  }

  // wait for all images to load before starting animation
  Promise.all([
    new Promise((resolve) => (cursorImg.onload = resolve)),
    new Promise((resolve) => (textCursorImg.onload = resolve)),
    new Promise((resolve) => (clickableCursorImg.onload = resolve)),
  ]).then(() => {
    const boids = [];
    let lastSpawnTime = 0;

    function animate() {
      // clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // spawn new boids every 3-5 seconds
      const now = Date.now();
      if (now - lastSpawnTime > Math.random() * 2000 + 3000) {
        boids.push(new Boid());
        lastSpawnTime = now;
      }

      // update and draw boids
      for (let boid of boids) {
        boid.update(boids);
        boid.draw();
      }

      // get next frame
      requestAnimationFrame(animate);
    }

    animate();
  });
})();
