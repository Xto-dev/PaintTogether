const socket = io();

const loginScreen = document.getElementById('login-screen');
const canvasScreen = document.getElementById('canvas-screen');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');

const roomTitle = document.getElementById('room-title');
const userName = document.getElementById('user-name');
const usersElement = document.getElementById('users');

let isDrawing = false;
let currentColor = '#000000';
let currentSize = 5;
let isEraser = false;

const cursors = new Map();
let currentDrawingData = [];

function resizeCanvas() {
  const container = canvas.parentElement;
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 200;

  const CANVAS_WIDTH = 1600;
  const CANVAS_HEIGHT = 900;
  const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

  let displayWidth = Math.min(1200, maxWidth);
  let displayHeight = displayWidth / aspectRatio;

  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  redrawCanvas();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentDrawingData.forEach(data => {
    drawLine(
      data.x0 * canvas.width,
      data.y0 * canvas.height,
      data.x1 * canvas.width,
      data.y1 * canvas.height,
      data.color,
      data.size
    );
  });
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const roomName = document.getElementById('room-name').value.trim();
  const password = document.getElementById('room-password').value;

  if (username && roomName && password) {
    socket.emit('join-room', { roomName, password, username });
    errorMessage.textContent = '';
  }
});

socket.on('room-joined', ({ roomName, username, users, drawingData, cursors }) => {
  loginScreen.classList.add('hidden');
  canvasScreen.classList.remove('hidden');

  roomTitle.textContent = `Room: ${roomName}`;
  userName.textContent = `You: ${username}`;
  usersElement.textContent = users.join(', ');

  currentDrawingData = drawingData;
  resizeCanvas();

  cursors.forEach(cursor => {
    updateCursor(cursor.socketId, cursor.username, cursor.x, cursor.y, cursor.color, cursor.isEraser);
  });
});

socket.on('user-joined', ({ username, users }) => {
  usersElement.textContent = users.join(', ');
  console.log(`${username} joined the room`);
});

socket.on('user-left', ({ username, socketId, users }) => {
  usersElement.textContent = users.join(', ');
  console.log(`${username} left the room`);

  const cursorElement = document.getElementById(`cursor-${socketId}`);
  if (cursorElement) {
    cursorElement.remove();
  }
  cursors.delete(socketId);
});

socket.on('error', ({ message }) => {
  errorMessage.textContent = message;
});

socket.on('draw', (data) => {
  currentDrawingData.push(data);
  drawLine(
    data.x0 * canvas.width,
    data.y0 * canvas.height,
    data.x1 * canvas.width,
    data.y1 * canvas.height,
    data.color,
    data.size
  );
});

socket.on('clear-canvas', () => {
  currentDrawingData = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('cursor-move', ({ socketId, username, x, y, color, isEraser }) => {
  updateCursor(socketId, username, x, y, color, isEraser);
});

let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
  lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  socket.emit('cursor-move', {
    x: x / canvas.width,
    y: y / canvas.height,
    color: currentColor,
    isEraser: isEraser
  });

  if (!isDrawing) return;

  const color = isEraser ? '#FFFFFF' : currentColor;

  drawLine(lastX, lastY, x, y, color, currentSize);

  const drawData = {
    x0: lastX / canvas.width,
    y0: lastY / canvas.height,
    x1: x / canvas.width,
    y1: y / canvas.height,
    color: color,
    size: currentSize
  };

  currentDrawingData.push(drawData);

  socket.emit('draw', drawData);

  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
  lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

  socket.emit('cursor-move', {
    x: x / canvas.width,
    y: y / canvas.height,
    color: currentColor,
    isEraser: isEraser
  });

  if (!isDrawing) return;

  const color = isEraser ? '#FFFFFF' : currentColor;

  drawLine(lastX, lastY, x, y, color, currentSize);

  const drawData = {
    x0: lastX / canvas.width,
    y0: lastY / canvas.height,
    x1: x / canvas.width,
    y1: y / canvas.height,
    color: color,
    size: currentSize
  };

  currentDrawingData.push(drawData);

  socket.emit('draw', drawData);

  lastX = x;
  lastY = y;
});

canvas.addEventListener('touchend', () => {
  isDrawing = false;
});

function drawLine(x0, y0, x1, y1, color, size) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.stroke();
  ctx.closePath();
}

colorPicker.addEventListener('change', (e) => {
  currentColor = e.target.value;
  isEraser = false;
  eraserBtn.classList.remove('active');
});

brushSize.addEventListener('input', (e) => {
  currentSize = e.target.value;
  brushSizeValue.textContent = currentSize;
});

eraserBtn.addEventListener('click', () => {
  isEraser = !isEraser;
  eraserBtn.classList.toggle('active');
});

clearBtn.addEventListener('click', () => {
  if (confirm('Clear the entire canvas for everyone?')) {
    socket.emit('clear-canvas');
  }
});

function updateCursor(socketId, username, normalizedX, normalizedY, color, isEraser) {
  let cursorElement = document.getElementById(`cursor-${socketId}`);

  if (!cursorElement) {
    cursorElement = document.createElement('div');
    cursorElement.id = `cursor-${socketId}`;
    cursorElement.className = 'remote-cursor';

    const cursorIcon = document.createElement('div');
    cursorIcon.className = 'cursor-icon';

    const cursorName = document.createElement('div');
    cursorName.className = 'cursor-name';
    cursorName.textContent = username;

    cursorElement.appendChild(cursorIcon);
    cursorElement.appendChild(cursorName);
    document.body.appendChild(cursorElement);

    cursors.set(socketId, cursorElement);
  }

  const rect = canvas.getBoundingClientRect();
  const x = normalizedX * rect.width;
  const y = normalizedY * rect.height;

  cursorElement.style.left = (rect.left + x) + 'px';
  cursorElement.style.top = (rect.top + y) + 'px';

  const cursorIcon = cursorElement.querySelector('.cursor-icon');
  const cursorName = cursorElement.querySelector('.cursor-name');

  if (isEraser) {
    cursorIcon.innerHTML = '';
    cursorIcon.classList.add('eraser-icon');
    cursorIcon.style.backgroundColor = '#e74c3c';
  } else {
    cursorIcon.innerHTML = '●';
    cursorIcon.classList.remove('eraser-icon');
    cursorIcon.style.backgroundColor = color;
    cursorIcon.style.color = color;
  }

  cursorName.style.backgroundColor = isEraser ? '#e74c3c' : color;
}
