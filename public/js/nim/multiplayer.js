const socket = io();

let currentRoom = null;
let isMyTurn = false;
let gameOver = false;
let opponentName = 'Opponent';

// DOM elements
const menu = document.getElementById('menu');
const friendsMenu = document.getElementById('friendsMenu');
const joinGame = document.getElementById('joinGame');
const game = document.getElementById('game');
const waiting = document.getElementById('waiting');
const gameContent = document.getElementById('gameContent');
const statusEl = document.getElementById('status');
const sticksCount = document.getElementById('sticks-count');
const infoEl = document.getElementById('info');
const rematchBtn = document.getElementById('rematchBtn');
const leaveBtn = document.getElementById('leaveBtn');
const moveButtons = document.querySelectorAll('.btn-group button');

document.querySelector('#player1 .name').textContent = user.name;

// Event listeners
document.getElementById('playOnlineBtn').addEventListener('click', () => {
  socket.emit('joinOnline', { userId: user._id, name: user.name });
  showGame();
});

document.getElementById('playFriendsBtn').addEventListener('click', () => {
  showFriendsMenu();
});

document.getElementById('createGameBtn').addEventListener('click', () => {
  socket.emit('createRoom', { userId: user._id, name: user.name });
});

document.getElementById('joinGameBtn').addEventListener('click', () => {
  showJoinGame();
});

document.getElementById('joinBtn').addEventListener('click', () => {
  const code = document.getElementById('gameCodeInput').value.trim().toUpperCase();
  if (code) {
    socket.emit('joinRoom', { code, userId: user._id, name: user.name });
  }
});

document.getElementById('backToMenuBtn').addEventListener('click', showMenu);
document.getElementById('backToFriendsBtn').addEventListener('click', showFriendsMenu);

// Socket events
socket.on('roomCreated', (data) => {
  currentRoom = data.roomId;
  alert(`Game created! Share this code: ${data.code}`);
  showGame();
});

socket.on('joinedRoom', (data) => {
  currentRoom = data.roomId;
  showGame();
});

socket.on('gameStart', (data) => {
  currentRoom = data.roomId;
  opponentName = data.opponentName;
  document.querySelector('#player2 .name').textContent = opponentName;
  waiting.classList.add('hidden');
  gameContent.classList.remove('hidden');
  updateGameState(data);
});

socket.on('gameUpdate', (data) => {
  updateGameState(data);
});

socket.on('gameOver', (data) => {
  gameOver = true;
  enableButtons(false);
  rematchBtn.style.display = 'block';
  leaveBtn.style.display = 'block';
  setStatus(`${data.winnerName} Wins!`, 'gameover');
  infoEl.textContent = `${data.winnerName} took the last stone.`;
});

socket.on('rematchRequested', () => {
  infoEl.textContent = `${opponentName} wants a rematch.`;
});

socket.on('rematchAccepted', (data) => {
  gameOver = false;
  rematchBtn.style.display = 'none';
  leaveBtn.style.display = 'none';
  updateGameState(data);
});

socket.on('error', (msg) => {
  alert(msg);
});

// Functions
function showMenu() {
  menu.classList.remove('hidden');
  friendsMenu.classList.add('hidden');
  joinGame.classList.add('hidden');
  game.classList.add('hidden');
}

function showFriendsMenu() {
  menu.classList.add('hidden');
  friendsMenu.classList.remove('hidden');
  joinGame.classList.add('hidden');
  game.classList.add('hidden');
}

function showJoinGame() {
  friendsMenu.classList.add('hidden');
  joinGame.classList.remove('hidden');
}

function showGame() {
  menu.classList.add('hidden');
  friendsMenu.classList.add('hidden');
  joinGame.classList.add('hidden');
  game.classList.remove('hidden');
  waiting.classList.remove('hidden');
  gameContent.classList.add('hidden');
}

function updateGameState(data) {
  sticksCount.textContent = data.stones;
  isMyTurn = String(data.currentPlayer) === String(user._id);
  setStatus(`${data.currentPlayerName}'s Turn`, isMyTurn ? 'player' : 'opponent');
  enableButtons(isMyTurn && !gameOver);
  updateTurnIndicators(isMyTurn);
  infoEl.textContent = data.lastMove || '';
}

function setStatus(text, mode) {
  statusEl.textContent = text;
  statusEl.className = '';
  if (mode === 'opponent') statusEl.classList.add('waiting');
  if (mode === 'gameover') statusEl.classList.add('game-over');
}

function enableButtons(state) {
  moveButtons.forEach(btn => btn.disabled = !state);
}

function updateTurnIndicators(myTurn) {
  document.getElementById('player1').classList.toggle('turn', myTurn);
  document.getElementById('player2').classList.toggle('turn', !myTurn);
}

function makeMove(n) {
  if (!isMyTurn || gameOver) return;
  socket.emit('makeMove', { roomId: currentRoom, move: n, userId: user._id });
}

function requestRematch() {
  socket.emit('requestRematch', { roomId: currentRoom, userId: user._id });
}

function leaveGame() {
  socket.emit('leaveGame', { roomId: currentRoom, userId: user._id });
  location.reload();
}