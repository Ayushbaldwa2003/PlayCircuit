const User = require('../models/user');

let rooms = {}; // roomId: { roomId, players: [{id, name, socket}], stones, currentPlayer: id, lastMove: '' }
let onlineQueue = [];
let roomCounter = 0;

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomStoneCount() {
  return Math.floor(Math.random() * 31) + 20; // 20-50 inclusive
}

function pickRandomPlayer(room) {
  return Math.random() < 0.5 ? String(room.players[0].id) : String(room.players[1].id);
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinOnline', (data) => {
      onlineQueue.push({ ...data, socket, id: String(data.userId) });
      tryMatchOnline();
    });

    socket.on('createRoom', (data) => {
      const code = generateCode();
      const roomId = `room_${++roomCounter}`;
      rooms[roomId] = {
        roomId,
        code,
        players: [{ ...data, socket, id: String(data.userId) }],
        stones: 17,
        currentPlayer: null,
        lastMove: '',
        gameStarted: false
      };
      socket.join(roomId);
      socket.emit('roomCreated', { roomId, code });
    });

    socket.on('joinRoom', (data) => {
      const room = Object.values(rooms).find(r => r.code === data.code && r.players.length === 1);
      if (!room) {
        socket.emit('error', 'Invalid or full room code');
        return;
      }
      room.players.push({ ...data, socket, id: String(data.userId) });
      socket.join(room.roomId);
      socket.emit('joinedRoom', { roomId: room.roomId });
      startGame(room);
    });

    socket.on('makeMove', (data) => {
      const room = rooms[data.roomId];
      if (!room || String(room.currentPlayer) !== String(data.userId)) return;
      const move = data.move;
      if (move < 1 || move > 3 || move > room.stones) return;
      room.stones -= move;
      room.lastMove = `${room.players.find(p => String(p.id) === String(data.userId)).name} removed ${move} stone${move > 1 ? 's' : ''}.`;
      if (room.stones === 0) {
        const winner = room.players.find(p => String(p.id) === String(data.userId));
        io.to(data.roomId).emit('gameOver', { winnerName: winner.name });
        return;
      }
      room.currentPlayer = String(room.players.find(p => String(p.id) !== String(data.userId)).id);
      io.to(data.roomId).emit('gameUpdate', {
        stones: room.stones,
        currentPlayer: room.currentPlayer,
        currentPlayerName: room.players.find(p => String(p.id) === String(room.currentPlayer)).name,
        lastMove: room.lastMove
      });
    });

    socket.on('requestRematch', (data) => {
      const room = rooms[data.roomId];
      if (!room) return;
      // Auto-accept rematch with fresh random setup
      room.stones = getRandomStoneCount();
      room.currentPlayer = pickRandomPlayer(room);
      room.lastMove = '';
      io.to(data.roomId).emit('rematchAccepted', {
        stones: room.stones,
        currentPlayer: room.currentPlayer,
        currentPlayerName: room.players.find(p => String(p.id) === room.currentPlayer).name,
        lastMove: room.lastMove
      });
    });

    socket.on('leaveGame', (data) => {
      const room = rooms[data.roomId];
      if (room) {
        room.players.forEach(p => p.socket.leave(data.roomId));
        delete rooms[data.roomId];
      }
    });

    socket.on('disconnect', () => {
      // Remove from queue or room
      onlineQueue = onlineQueue.filter(p => p.socket !== socket);
      for (let roomId in rooms) {
        rooms[roomId].players = rooms[roomId].players.filter(p => p.socket !== socket);
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });

  function tryMatchOnline() {
    if (onlineQueue.length >= 2) {
      const player1 = onlineQueue.shift();
      const player2 = onlineQueue.shift();
      const roomId = `room_${++roomCounter}`;
      const stones = getRandomStoneCount();
      rooms[roomId] = {
        roomId,
        players: [player1, player2],
        stones,
        currentPlayer: null,
        lastMove: '',
        gameStarted: false
      };
      player1.socket.join(roomId);
      player2.socket.join(roomId);
      startGame(rooms[roomId]);
    }
  }

  function startGame(room) {
    room.gameStarted = true;
    room.currentPlayer = pickRandomPlayer(room);
    room.players.forEach((p, i) => {
      const opponent = room.players[1 - i];
      p.socket.emit('gameStart', {
        roomId: room.roomId,
        opponentName: opponent.name,
        stones: room.stones,
        currentPlayer: room.currentPlayer,
        currentPlayerName: room.players.find(pl => String(pl.id) === room.currentPlayer).name,
        lastMove: room.lastMove
      });
    });
  }
};
