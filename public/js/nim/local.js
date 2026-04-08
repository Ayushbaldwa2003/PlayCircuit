const TOTAL_STONES =Math.floor(Math.random() * (35 - 15 + 1)) + 15;

let stones     = TOTAL_STONES;
let playerTurn = true;
let gameOver   = false;

const statusEl    = document.getElementById("status");
const countEl     = document.getElementById("sticks-count");
const infoEl      = document.getElementById("start-info");
const rematchBtn  = document.getElementById("rematchBtn");
const moveButtons = document.querySelectorAll(".btn-group button");

// ── Status badge helper ───────────────────────
function setStatus(text, mode) {
  statusEl.textContent = text;
  statusEl.className   = "";
  if (mode === "bot")      statusEl.classList.add("bot-turn");
  if (mode === "gameover") statusEl.classList.add("game-over");
}

// ── Init ──────────────────────────────────────
function initGame() {
  stones   = TOTAL_STONES;
  gameOver = false;
  rematchBtn.style.display = "none";
  updateDisplay();

  playerTurn = Math.random() < 0.5;

  if (playerTurn) {
    infoEl.textContent = "Coin flip — you go first!";
    setStatus("Your Turn", "player");
    enableButtons(true);
  } else {
    infoEl.textContent = "Coin flip — bot goes first!";
    setStatus("Bot is thinking...", "bot");
    enableButtons(false);
    setTimeout(botMove, 900);
  }
}

function updateDisplay() {
  countEl.textContent = stones;
}

function enableButtons(state) {
  moveButtons.forEach(btn => {
    btn.disabled = !state;
  });
}

// ── Player move ───────────────────────────────
function playerMove(n) {
  if (gameOver || !playerTurn) return;
  if (n > stones) return;

  stones    -= n;
  playerTurn = false;
  updateDisplay();

  if (stones === 0) { endGame("player"); return; }

  setStatus("Bot is thinking...", "bot");
  enableButtons(false);
  setTimeout(botMove, 900);
}

// ── Bot move (mod-4 strategy) ─────────────────
function botMove() {
  if (gameOver) return;

  const rem = stones % 4;
  const temp=Math.floor(Math.random() * 3) + 1;
  let pick  = rem === 0 ? temp : rem;
  pick      = Math.min(Math.max(pick, 1), Math.min(stones, 3));

  stones    -= pick;
  playerTurn = true;
  updateDisplay();

  infoEl.textContent = `Bot removed ${pick} stone${pick > 1 ? "s" : ""}.`;

  if (stones === 0) { endGame("bot"); return; }

  setStatus("Your Turn", "player");
  enableButtons(true);
}

// ── End game ──────────────────────────────────
function endGame(winner) {
  gameOver = true;
  enableButtons(false);
  rematchBtn.style.display = "block";

  if (winner === "player") {
    setStatus("You Win!", "gameover");
    infoEl.textContent = "You took the last stone. Well played!";
  } else {
    setStatus("Bot Wins!", "gameover");
    infoEl.textContent = "Bot took the last stone. Try again!";
  }
}

// ── Restart ───────────────────────────────────
function restartGame() {
  initGame();
}

initGame();