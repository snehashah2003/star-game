const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const message = document.getElementById("message");
const startButton = document.getElementById("start");

const basket = {
  x: 140,
  y: 430,
  width: 80,
  height: 24,
  speed: 280
};

let stars = [];
let score = 0;
let lives = 3;
let running = false;
let spawnTimer = 0;
let lastTime = 0;

const keys = new Set();
const touches = new Map();

function clearControls() {
  keys.clear();
  touches.clear();
}

function updateScoreboard() {
  scoreText.textContent = score;
  livesText.textContent = lives;
}

function startGame() {
  stars = [];
  score = 0;
  lives = 3;
  basket.x = (canvas.width - basket.width) / 2;
  spawnTimer = 0;
  running = true;

  clearControls();
  updateScoreboard();

  startButton.textContent = "Restart";
  message.textContent = "Catch the stars! Each catch earns 10 points.";
}

function createStar() {
  stars.push({
    x: 16 + Math.random() * (canvas.width - 32),
    y: -16,
    radius: 12,
    speed: 120 + Math.min(score * 0.3, 160)
  });
}

function drawStar(star) {
  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.beginPath();

  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? star.radius : star.radius / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fillStyle = "#fde047";
  ctx.shadowColor = "#facc15";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Small background lights.
  ctx.fillStyle = "#ffffff55";

  for (let i = 0; i < 30; i++) {
    const x = (i * 73 + 19) % canvas.width;
    const y = (i * 97 + 31) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  stars.forEach(drawStar);

  // Draw the basket.
  ctx.fillStyle = "#a78bfa";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

  ctx.fillStyle = "#ddd6fe";
  ctx.fillRect(basket.x - 4, basket.y, basket.width + 8, 6);

  if (!running) {
    ctx.fillStyle = "#080f28bb";
    ctx.fillRect(0, 170, canvas.width, 110);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(
      lives === 0 ? "Game Over!" : "Ready to catch?",
      canvas.width / 2,
      215
    );

    ctx.font = "16px Arial";
    ctx.fillText(
      lives === 0 ? `Final score: ${score}` : "Press Start Game below",
      canvas.width / 2,
      250
    );
  }
}

function update(dt) {
  const touchDirections = [...touches.values()];
  const left = keys.has("ArrowLeft") || touchDirections.includes("left");
  const right = keys.has("ArrowRight") || touchDirections.includes("right");

  const direction = Number(right) - Number(left);
  basket.x += direction * basket.speed * dt;

  // Keep the basket inside the game area.
  basket.x = Math.max(
    0,
    Math.min(canvas.width - basket.width, basket.x)
  );

  spawnTimer += dt;

  if (spawnTimer >= 0.9) {
    createStar();
    spawnTimer -= 0.9;
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    const previousBottom = star.y + star.radius;

    star.y += star.speed * dt;

    const overlapsBasket =
      star.x + star.radius >= basket.x &&
      star.x - star.radius <= basket.x + basket.width;

    const reachesBasket =
      previousBottom <= basket.y &&
      star.y + star.radius >= basket.y;

    if (overlapsBasket && reachesBasket) {
      stars.splice(i, 1);
      score += 10;
      updateScoreboard();
    } else if (star.y - star.radius > canvas.height) {
      stars.splice(i, 1);
      lives--;
      updateScoreboard();

      if (lives === 0) {
        running = false;
        clearControls();
        message.textContent = `You scored ${score}! Press Restart to try again.`;
        break;
      }
    }
  }
}

function gameLoop(time) {
  // Use elapsed time so movement stays consistent across screens.
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (running) {
    update(dt);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// Keyboard controls.
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    if (document.activeElement?.tagName === "BUTTON") return;

    event.preventDefault();
    keys.add(event.key);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

// Buttons work with a mouse or a finger.
function setupButton(id, direction) {
  const button = document.getElementById(id);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, direction);
  });

  const release = (event) => {
    touches.delete(event.pointerId);
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

setupButton("left", "left");
setupButton("right", "right");

startButton.addEventListener("click", () => {
  startGame();
  startButton.blur();
});

window.addEventListener("blur", clearControls);

document.addEventListener("visibilitychange", () => {
  clearControls();
  lastTime = performance.now();
});

requestAnimationFrame(gameLoop);