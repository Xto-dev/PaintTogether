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

function resizeCanvas() {
  const container = canvas.parentElement;
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 200;

  canvas.width = Math.min(1200, maxWidth);
  canvas.height = Math.min(700, maxHeight);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

socket.on('room-joined', ({ roomName, username, users, drawingData }) => {
  loginScreen.classList.add('hidden');
  canvasScreen.classList.remove('hidden');

  roomTitle.textContent = `Room: ${roomName}`;
  userName.textContent = `You: ${username}`;
  usersElement.textContent = users.join(', ');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawingData.forEach(data => {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
  });
});

socket.on('user-joined', ({ username, users }) => {
  usersElement.textContent = users.join(', ');
  console.log(`${username} joined the room`);
});

socket.on('user-left', ({ username, users }) => {
  usersElement.textContent = users.join(', ');
  console.log(`${username} left the room`);
});

socket.on('error', ({ message }) => {
  errorMessage.textContent = message;
});

socket.on('draw', (data) => {
  drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
});

socket.on('clear-canvas', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const color = isEraser ? '#FFFFFF' : currentColor;

  drawLine(lastX, lastY, x, y, color, currentSize);

  socket.emit('draw', {
    x0: lastX,
    y0: lastY,
    x1: x,
    y1: y,
    color: color,
    size: currentSize
  });

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
  lastX = touch.clientX - rect.left;
  lastY = touch.clientY - rect.top;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  const color = isEraser ? '#FFFFFF' : currentColor;

  drawLine(lastX, lastY, x, y, color, currentSize);

  socket.emit('draw', {
    x0: lastX,
    y0: lastY,
    x1: x,
    y1: y,
    color: color,
    size: currentSize
  });

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
