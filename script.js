const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const message = document.getElementById("message");
const overlay = document.getElementById("overlay");
const title = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const face = document.getElementById("face");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const restartButton = document.getElementById("restart");

const colors = ["#ff83b5", "#ffc83d", "#8b80ff", "#48cdb0"];
const cheers = [
  "Purr-fect! 😻",
  "Boing! You got it! 🌈",
  "Kitty says meow-wow! 🐾",
  "Super star catcher! ✨"
];

let stars = [];
let particles = [];
let score = 0;
let lives = 5;
let state = "ready";
let lastTime = 0;
let waveDelay = 0;
let kittyHappy = 0;
let audio;

// Sound is enabled by a real button press or tap.
function enableSound() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;

  if (!audio && AudioEngine) audio = new AudioEngine();

  if (audio?.state === "suspended") {
    audio.resume().catch(() => {});
  }
}

// Four different playful synthesized sounds.
function funnySound(kind) {
  if (!audio || audio.state !== "running") return;

  const patterns = [
    [350, 850, 450],
    [700, 500, 1100],
    [250, 450, 900],
    [1000, 650, 1300]
  ];

  const notes = patterns[kind % patterns.length];
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();

  oscillator.type = kind % 2 === 0 ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(notes[0], now);
  oscillator.frequency.exponentialRampToValueAtTime(notes[1], now + 0.09);
  oscillator.frequency.exponentialRampToValueAtTime(notes[2], now + 0.22);

  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  oscillator.connect(volume);
  volume.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.34);
}

function updateScoreboard() {
  scoreText.textContent = score;
  livesText.textContent = lives;
}

// Create two or three stars, spaced across the screen.
function createWave() {
  const count = Math.random() < 0.5 ? 2 : 3;
  const laneWidth = canvas.width / count;

  for (let i = 0; i < count; i++) {
    const kind = Math.floor(Math.random() * colors.length);

    stars.push({
      x: laneWidth * (i + 0.5),
      y: 35 + Math.random() * 35,
      radius: 25,
      vx: (i % 2 === 0 ? 1 : -1) * (22 + Math.random() * 20),
      vy: 58 + Math.random() * 22,
      angle: 0,
      kind,
      color: colors[kind]
    });
  }
}

function startGame() {
  enableSound();
  stars = [];
  particles = [];
  score = 0;
  lives = 5;
  waveDelay = 0;
  kittyHappy = 0;
  state = "playing";
  lastTime = performance.now();

  updateScoreboard();
  createWave();

  overlay.hidden = true;
  pauseButton.disabled = false;
  pauseButton.textContent = "⏸ Pause";
  message.textContent = "Tap the colorful stars! ⭐";
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    pauseButton.textContent = "▶ Resume";
    showOverlay("😴", "Little break!", "Kitty is taking a tiny nap.", "▶ Resume");
  } else if (state === "paused") {
    enableSound();
    state = "playing";
    lastTime = performance.now();
    overlay.hidden = true;
    pauseButton.textContent = "⏸ Pause";
  }
}

function showOverlay(emoji, heading, text, buttonText) {
  face.textContent = emoji;
  title.textContent = heading;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.hidden = false;
}

function endGame() {
  state = "over";
  pauseButton.disabled = true;

  showOverlay(
    "😻",
    "Lovely playing!",
    `You earned ${score} points! Kitty wants another turn!`,
    "Play Again! 🌈"
  );

  message.textContent = "Every try makes you better! 💖";
}

function burst(star) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 95;

    particles.push({
      x: star.x,
      y: star.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6,
      color: star.color
    });
  }
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (state !== "playing") return;

  enableSound();

  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;

  // Check the topmost star first; one tap catches one star.
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];

    if (Math.hypot(x - star.x, y - star.y) <= star.radius + 10) {
      burst(star);
      funnySound(star.kind);
      stars.splice(i, 1);

      score += 10;
      kittyHappy = 0.8;
      updateScoreboard();
      message.textContent = cheers[Math.floor(Math.random() * cheers.length)];

      // Short breathing space between groups.
      if (stars.length === 0) waveDelay = 0.7;
      break;
    }
  }
});

function drawStar(star) {
  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.rotate(star.angle);
  ctx.beginPath();

  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? star.radius : star.radius * 0.53;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fillStyle = star.color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  // A happy face on every star.
  ctx.fillStyle = "#553651";
  ctx.beginPath();
  ctx.arc(-6, -2, 2, 0, Math.PI * 2);
  ctx.arc(6, -2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 3, 6, 0, Math.PI);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#553651";
  ctx.stroke();
  ctx.restore();
}

function drawKitty() {
  const y = 402 - (kittyHappy > 0 ? 5 : 0);
  ctx.save();
  ctx.translate(180, y);

  // Pointy ears.
  ctx.fillStyle = "#ffb873";
  ctx.beginPath();
  ctx.moveTo(-32, -10);
  ctx.lineTo(-30, -43);
  ctx.lineTo(-9, -24);
  ctx.lineTo(9, -24);
  ctx.lineTo(30, -43);
  ctx.lineTo(32, -10);
  ctx.fill();

  // Head.
  ctx.beginPath();
  ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff8fab";
  ctx.beginPath();
  ctx.arc(-22, 7, 6, 0, Math.PI * 2);
  ctx.arc(22, 7, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#623b46";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  // Eyes.
  for (const x of [-12, 12]) {
    ctx.beginPath();

    if (kittyHappy > 0) {
      ctx.arc(x, -3, 4, Math.PI, Math.PI * 2);
    } else {
      ctx.moveTo(x, -6);
      ctx.lineTo(x, -1);
    }

    ctx.stroke();
  }

  ctx.fillStyle = "#b55875";
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.lineTo(4, 4);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 9, 7, 0, Math.PI);
  ctx.stroke();

  // Whiskers.
  for (const side of [-1, 1]) {
    for (const offset of [0, 7]) {
      ctx.beginPath();
      ctx.moveTo(side * 25, 4 + offset);
      ctx.lineTo(side * 43, offset);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#d9f2ff");
  background.addColorStop(1, "#ffe5f1");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft clouds.
  ctx.fillStyle = "#ffffffaa";

  for (const [x, y] of [[55, 80], [290, 160], [85, 290]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 43, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 12, y - 10, 20, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 13, y - 9, 23, 19, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  stars.forEach(drawStar);

  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 0.6);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 6, 6);
  }

  ctx.globalAlpha = 1;
  drawKitty();
}

function update(dt) {
  kittyHappy = Math.max(0, kittyHappy - dt);

  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];

    star.x += star.vx * dt;
    star.y += star.vy * dt;
    star.angle += dt * 0.35;

    // Bounce sideways and continue falling.
    if (star.x < 30) {
      star.x = 30;
      star.vx = Math.abs(star.vx);
    }

    if (star.x > canvas.width - 30) {
      star.x = canvas.width - 30;
      star.vx = -Math.abs(star.vx);
    }

    if (star.y - star.radius > canvas.height) {
      stars.splice(i, 1);
      lives = Math.max(0, lives - 1);
      updateScoreboard();

      if (lives === 0) {
        endGame();
        return;
      }

      message.textContent = "Oops! Let’s catch the next one! 🐾";
      if (stars.length === 0) waveDelay = 0.7;
    }
  }

  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }

  particles = particles.filter(particle => particle.life > 0);

  if (stars.length === 0) {
    waveDelay -= dt;
    if (waveDelay <= 0) createWave();
  }
}

function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.04);
  lastTime = time;

  if (state === "playing" && !document.hidden) update(dt);

  draw();
  requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", () => {
  if (state === "paused") togglePause();
  else startGame();
});

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", startGame);

// Automatically pause if the player switches tabs or apps.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") togglePause();
});

requestAnimationFrame(gameLoop);