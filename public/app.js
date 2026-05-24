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
const brushType = document.getElementById('brush-type');
const brushOpacity = document.getElementById('brush-opacity');
const brushOpacityValue = document.getElementById('brush-opacity-value');
const brushSmoothing = document.getElementById('brush-smoothing');
const brushSmoothingValue = document.getElementById('brush-smoothing-value');
const eyedropperBtn = document.getElementById('eyedropper-btn');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');
const addLayerBtn = document.getElementById('add-layer-btn');
const layersList = document.getElementById('layers-list');

const roomTitle = document.getElementById('room-title');
const userName = document.getElementById('user-name');
const usersElement = document.getElementById('users');

// Создаем кастомный курсор для кисти
const brushCursor = document.createElement('div');
brushCursor.className = 'brush-cursor';
document.body.appendChild(brushCursor);

let isDrawing = false;
let currentColor = '#000000';
let currentSize = 5;
let currentBrushType = 'normal';
let currentOpacity = 1.0;
let currentSmoothing = 0;
let isEraser = false;
let isEyedropper = false;

const cursors = new Map();
let layers = [];
let currentLayerId = null;
let layerCanvases = new Map();
let smoothingPoints = [];

let undoStack = [];
let redoStack = [];
const MAX_UNDO_STEPS = 50;

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

  layerCanvases.forEach((layerCanvas) => {
    layerCanvas.width = CANVAS_WIDTH;
    layerCanvas.height = CANVAS_HEIGHT;
    const layerCtx = layerCanvas.getContext('2d');
    layerCtx.lineCap = 'round';
    layerCtx.lineJoin = 'round';
  });

  redrawCanvas();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  layers.forEach(layer => {
    if (!layer.visible) return;

    const layerCanvas = layerCanvases.get(layer.id);
    if (!layerCanvas) return;

    const layerCtx = layerCanvas.getContext('2d');
    layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);

    layer.drawingData.forEach(data => {
      drawLineOnContext(
        layerCtx,
        data.x0 * layerCanvas.width,
        data.y0 * layerCanvas.height,
        data.x1 * layerCanvas.width,
        data.y1 * layerCanvas.height,
        data.color,
        data.size,
        data.brushType || 'normal',
        data.opacity !== undefined ? data.opacity : 1.0,
        data.isEraser || false
      );
    });

    ctx.globalAlpha = layer.opacity;
    ctx.drawImage(layerCanvas, 0, 0);
    ctx.globalAlpha = 1.0;
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

socket.on('room-joined', ({ roomName, username, users, layers: serverLayers, cursors }) => {
  loginScreen.classList.add('hidden');
  canvasScreen.classList.remove('hidden');

  roomTitle.textContent = `Room: ${roomName}`;
  userName.textContent = `You: ${username}`;
  usersElement.textContent = users.join(', ');

  // Сброс всех настроек к дефолтным значениям
  currentColor = '#000000';
  currentSize = 5;
  currentBrushType = 'normal';
  currentOpacity = 1.0;
  currentSmoothing = 0;
  isEraser = false;
  isEyedropper = false;

  // Обновление UI элементов
  colorPicker.value = currentColor;
  brushSize.value = currentSize;
  brushSizeValue.textContent = currentSize;
  brushType.value = currentBrushType;
  brushOpacity.value = currentOpacity * 100;
  brushOpacityValue.textContent = (currentOpacity * 100) + '%';
  brushSmoothing.value = currentSmoothing;
  brushSmoothingValue.textContent = currentSmoothing;
  eraserBtn.classList.remove('active');
  eyedropperBtn.classList.remove('active');

  layers = serverLayers;
  layers.forEach(layer => {
    const layerCanvas = document.createElement('canvas');
    layerCanvases.set(layer.id, layerCanvas);
  });

  if (layers.length > 0) {
    currentLayerId = layers[0].id;
  }

  updateLayersList();
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
  const layer = layers.find(l => l.id === data.layerId);
  if (!layer) return;

  layer.drawingData.push(data);

  const layerCanvas = layerCanvases.get(data.layerId);
  if (!layerCanvas) return;

  const layerCtx = layerCanvas.getContext('2d');
  drawLineOnContext(
    layerCtx,
    data.x0 * layerCanvas.width,
    data.y0 * layerCanvas.height,
    data.x1 * layerCanvas.width,
    data.y1 * layerCanvas.height,
    data.color,
    data.size,
    data.brushType || 'normal',
    data.opacity !== undefined ? data.opacity : 1.0,
    data.isEraser || false
  );

  scheduleComposite();
});

socket.on('draw-batch', (batch) => {
  batch.forEach(data => {
    const layer = layers.find(l => l.id === data.layerId);
    if (!layer) return;

    layer.drawingData.push(data);

    const layerCanvas = layerCanvases.get(data.layerId);
    if (!layerCanvas) return;

    const layerCtx = layerCanvas.getContext('2d');
    drawLineOnContext(
      layerCtx,
      data.x0 * layerCanvas.width,
      data.y0 * layerCanvas.height,
      data.x1 * layerCanvas.width,
      data.y1 * layerCanvas.height,
      data.color,
      data.size,
      data.brushType || 'normal',
      data.opacity !== undefined ? data.opacity : 1.0,
      data.isEraser || false
    );
  });

  scheduleComposite();
});

socket.on('clear-canvas', () => {
  layers.forEach(layer => {
    layer.drawingData = [];
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  layerCanvases.forEach(layerCanvas => {
    const layerCtx = layerCanvas.getContext('2d');
    layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  });
});

socket.on('layer-added', (layer) => {
  layers.push(layer);
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = canvas.width;
  layerCanvas.height = canvas.height;
  const layerCtx = layerCanvas.getContext('2d');
  layerCtx.lineCap = 'round';
  layerCtx.lineJoin = 'round';
  layerCanvases.set(layer.id, layerCanvas);
  updateLayersList();
  redrawCanvas();
});

socket.on('layer-deleted', ({ layerId }) => {
  layers = layers.filter(l => l.id !== layerId);
  layerCanvases.delete(layerId);
  if (currentLayerId === layerId && layers.length > 0) {
    currentLayerId = layers[0].id;
  }
  updateLayersList();
  redrawCanvas();
});

socket.on('layer-updated', ({ layerId, updates }) => {
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    Object.assign(layer, updates);
    updateLayersList();
    redrawCanvas();
  }
});

socket.on('layers-reordered', ({ layers: layerIds }) => {
  const reorderedLayers = [];
  layerIds.forEach(id => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      reorderedLayers.push(layer);
    }
  });
  layers = reorderedLayers;
  updateLayersList();
  redrawCanvas();
});

socket.on('cursor-move', ({ socketId, username, x, y, color, isEraser }) => {
  updateCursor(socketId, username, x, y, color, isEraser);
});

socket.on('undo', ({ layerId, drawingData }) => {
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    layer.drawingData = drawingData;
    redrawCanvas();
  }
});

socket.on('redo', ({ layerId, drawingData }) => {
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    layer.drawingData = drawingData;
    redrawCanvas();
  }
});

let lastX = 0;
let lastY = 0;
let currentStroke = [];

function saveUndoState() {
  if (!currentLayerId) return;

  const layer = layers.find(l => l.id === currentLayerId);
  if (!layer) return;

  undoStack.push({
    layerId: currentLayerId,
    drawingData: JSON.parse(JSON.stringify(layer.drawingData))
  });

  if (undoStack.length > MAX_UNDO_STEPS) {
    undoStack.shift();
  }

  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;

  const currentState = undoStack.pop();
  const layer = layers.find(l => l.id === currentState.layerId);
  if (!layer) return;

  redoStack.push({
    layerId: currentState.layerId,
    drawingData: JSON.parse(JSON.stringify(layer.drawingData))
  });

  const previousState = undoStack[undoStack.length - 1];
  if (previousState && previousState.layerId === currentState.layerId) {
    layer.drawingData = JSON.parse(JSON.stringify(previousState.drawingData));
  } else {
    layer.drawingData = [];
  }

  socket.emit('undo', { layerId: currentState.layerId, drawingData: layer.drawingData });
  redrawCanvas();
}

function redo() {
  if (redoStack.length === 0) return;

  const state = redoStack.pop();
  const layer = layers.find(l => l.id === state.layerId);
  if (!layer) return;

  undoStack.push({
    layerId: state.layerId,
    drawingData: JSON.parse(JSON.stringify(layer.drawingData))
  });

  layer.drawingData = JSON.parse(JSON.stringify(state.drawingData));
  socket.emit('redo', { layerId: state.layerId, drawingData: layer.drawingData });
  redrawCanvas();
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * (canvas.width / rect.width)));
  const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * (canvas.height / rect.height)));

  if (isEyedropper) {
    pickColor(x, y);
    return;
  }

  isDrawing = true;
  smoothingPoints = [];
  currentStroke = [];
  lastX = x;
  lastY = y;
  smoothingPoints.push({ x: lastX, y: lastY });
  updateBrushCursor();
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const rawX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const rawY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const x = Math.max(0, Math.min(canvas.width, rawX));
  const y = Math.max(0, Math.min(canvas.height, rawY));

  socket.emit('cursor-move', {
    x: x / canvas.width,
    y: y / canvas.height,
    color: currentColor,
    isEraser: isEraser
  });

  if (!isDrawing || !currentLayerId) return;

  smoothingPoints.push({ x, y });
  if (smoothingPoints.length > currentSmoothing + 1) {
    smoothingPoints.shift();
  }

  let drawX = x;
  let drawY = y;

  if (currentSmoothing > 0 && smoothingPoints.length > 1) {
    drawX = smoothingPoints.reduce((sum, p) => sum + p.x, 0) / smoothingPoints.length;
    drawY = smoothingPoints.reduce((sum, p) => sum + p.y, 0) / smoothingPoints.length;
  }

  const color = currentColor;

  const layer = layers.find(l => l.id === currentLayerId);
  if (!layer) return;

  const layerCanvas = layerCanvases.get(currentLayerId);
  if (!layerCanvas) return;

  const layerCtx = layerCanvas.getContext('2d');
  drawLineOnContext(layerCtx, lastX, lastY, drawX, drawY, color, currentSize, currentBrushType, currentOpacity, isEraser);

  const drawData = {
    layerId: currentLayerId,
    x0: lastX / canvas.width,
    y0: lastY / canvas.height,
    x1: drawX / canvas.width,
    y1: drawY / canvas.height,
    color: color,
    size: currentSize,
    brushType: currentBrushType,
    opacity: currentOpacity,
    isEraser: isEraser
  };

  layer.drawingData.push(drawData);
  drawBatch.push(drawData);
  currentStroke.push(drawData);

  if (!batchTimeout) {
    batchTimeout = setTimeout(flushDrawBatch, 16);
  }

  scheduleComposite();

  lastX = drawX;
  lastY = drawY;
});

document.addEventListener('mousemove', (e) => {
  if (!isDrawing || !currentLayerId) return;

  const rect = canvas.getBoundingClientRect();
  const rawX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const rawY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const x = Math.max(0, Math.min(canvas.width, rawX));
  const y = Math.max(0, Math.min(canvas.height, rawY));

  smoothingPoints.push({ x, y });
  if (smoothingPoints.length > currentSmoothing + 1) {
    smoothingPoints.shift();
  }

  let drawX = x;
  let drawY = y;

  if (currentSmoothing > 0 && smoothingPoints.length > 1) {
    drawX = smoothingPoints.reduce((sum, p) => sum + p.x, 0) / smoothingPoints.length;
    drawY = smoothingPoints.reduce((sum, p) => sum + p.y, 0) / smoothingPoints.length;
  }

  const color = currentColor;

  const layer = layers.find(l => l.id === currentLayerId);
  if (!layer) return;

  const layerCanvas = layerCanvases.get(currentLayerId);
  if (!layerCanvas) return;

  const layerCtx = layerCanvas.getContext('2d');
  drawLineOnContext(layerCtx, lastX, lastY, drawX, drawY, color, currentSize, currentBrushType, currentOpacity, isEraser);

  const drawData = {
    layerId: currentLayerId,
    x0: lastX / canvas.width,
    y0: lastY / canvas.height,
    x1: drawX / canvas.width,
    y1: drawY / canvas.height,
    color: color,
    size: currentSize,
    brushType: currentBrushType,
    opacity: currentOpacity,
    isEraser: isEraser
  };

  layer.drawingData.push(drawData);
  drawBatch.push(drawData);
  currentStroke.push(drawData);

  if (!batchTimeout) {
    batchTimeout = setTimeout(flushDrawBatch, 16);
  }

  scheduleComposite();

  lastX = drawX;
  lastY = drawY;
});

canvas.addEventListener('mouseup', () => {
  if (isDrawing && currentStroke.length > 0) {
    saveUndoState();
  }
  isDrawing = false;
});

document.addEventListener('mouseup', () => {
  if (isDrawing && currentStroke.length > 0) {
    saveUndoState();
  }
  isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
  // Не останавливаем рисование при выходе за пределы canvas
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = Math.max(0, Math.min(canvas.width, (touch.clientX - rect.left) * (canvas.width / rect.width)));
  const y = Math.max(0, Math.min(canvas.height, (touch.clientY - rect.top) * (canvas.height / rect.height)));

  if (isEyedropper) {
    pickColor(x, y);
    return;
  }

  isDrawing = true;
  smoothingPoints = [];
  currentStroke = [];
  lastX = x;
  lastY = y;
  smoothingPoints.push({ x: lastX, y: lastY });
  updateBrushCursor();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = Math.max(0, Math.min(canvas.width, (touch.clientX - rect.left) * (canvas.width / rect.width)));
  const y = Math.max(0, Math.min(canvas.height, (touch.clientY - rect.top) * (canvas.height / rect.height)));

  socket.emit('cursor-move', {
    x: x / canvas.width,
    y: y / canvas.height,
    color: currentColor,
    isEraser: isEraser
  });

  if (!isDrawing || !currentLayerId) return;

  smoothingPoints.push({ x, y });
  if (smoothingPoints.length > currentSmoothing + 1) {
    smoothingPoints.shift();
  }

  let drawX = x;
  let drawY = y;

  if (currentSmoothing > 0 && smoothingPoints.length > 1) {
    drawX = smoothingPoints.reduce((sum, p) => sum + p.x, 0) / smoothingPoints.length;
    drawY = smoothingPoints.reduce((sum, p) => sum + p.y, 0) / smoothingPoints.length;
  }

  const color = currentColor;

  const layer = layers.find(l => l.id === currentLayerId);
  if (!layer) return;

  const layerCanvas = layerCanvases.get(currentLayerId);
  if (!layerCanvas) return;

  const layerCtx = layerCanvas.getContext('2d');
  drawLineOnContext(layerCtx, lastX, lastY, drawX, drawY, color, currentSize, currentBrushType, currentOpacity, isEraser);

  const drawData = {
    layerId: currentLayerId,
    x0: lastX / canvas.width,
    y0: lastY / canvas.height,
    x1: drawX / canvas.width,
    y1: drawY / canvas.height,
    color: color,
    size: currentSize,
    brushType: currentBrushType,
    opacity: currentOpacity,
    isEraser: isEraser
  };

  layer.drawingData.push(drawData);
  drawBatch.push(drawData);
  currentStroke.push(drawData);

  if (!batchTimeout) {
    batchTimeout = setTimeout(flushDrawBatch, 16);
  }

  scheduleComposite();

  lastX = drawX;
  lastY = drawY;
});

canvas.addEventListener('touchend', () => {
  if (isDrawing && currentStroke.length > 0) {
    saveUndoState();
  }
  isDrawing = false;
});

function drawLineOnContext(context, x0, y0, x1, y1, color, size, brushType = 'normal', opacity = 1.0, isErasing = false) {
  const previousAlpha = context.globalAlpha;
  const previousComposite = context.globalCompositeOperation;

  if (isErasing) {
    context.globalCompositeOperation = 'destination-out';
    context.globalAlpha = 1.0;
  } else {
    context.globalAlpha = opacity;
  }

  context.strokeStyle = color;
  context.lineWidth = size;

  switch (brushType) {
    case 'calligraphy':
      drawCalligraphy(context, x0, y0, x1, y1, color, size, isErasing);
      break;
    case 'marker':
      drawMarker(context, x0, y0, x1, y1, color, size, isErasing);
      break;
    case 'normal':
    default:
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.stroke();
      context.closePath();
      break;
  }

  context.globalAlpha = previousAlpha;
  context.globalCompositeOperation = previousComposite;
}

function drawCalligraphy(context, x0, y0, x1, y1, color, size, isErasing = false) {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const perpAngle = angle + Math.PI / 2;

  const width = size * 2;
  const height = size * 0.5;

  const dx1 = Math.cos(perpAngle) * width / 2;
  const dy1 = Math.sin(perpAngle) * width / 2;
  const dx2 = Math.cos(perpAngle) * height / 2;
  const dy2 = Math.sin(perpAngle) * height / 2;

  if (!isErasing) {
    context.fillStyle = color;
  }
  context.beginPath();
  context.moveTo(x0 + dx1, y0 + dy1);
  context.lineTo(x1 + dx1, y1 + dy1);
  context.lineTo(x1 - dx2, y1 - dy2);
  context.lineTo(x0 - dx2, y0 - dy2);
  context.closePath();
  context.fill();
}

function drawMarker(context, x0, y0, x1, y1, color, size, isErasing = false) {
  const prevAlpha = context.globalAlpha;
  if (!isErasing) {
    context.globalAlpha = 0.3;
  }
  context.lineWidth = size * 1.5;
  if (!isErasing) {
    context.strokeStyle = color;
  }
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.stroke();
  context.closePath();
  if (!isErasing) {
    context.globalAlpha = prevAlpha;
  }
}

function drawLine(x0, y0, x1, y1, color, size) {
  drawLineOnContext(ctx, x0, y0, x1, y1, color, size, 'normal');
}

colorPicker.addEventListener('change', (e) => {
  currentColor = e.target.value;
  isEraser = false;
  eraserBtn.classList.remove('active');
});

brushSize.addEventListener('input', (e) => {
  currentSize = e.target.value;
  brushSizeValue.textContent = currentSize;
  updateBrushCursor();
});

brushType.addEventListener('change', (e) => {
  currentBrushType = e.target.value;
});

brushOpacity.addEventListener('input', (e) => {
  currentOpacity = e.target.value / 100;
  brushOpacityValue.textContent = e.target.value + '%';
});

brushSmoothing.addEventListener('input', (e) => {
  currentSmoothing = parseInt(e.target.value);
  brushSmoothingValue.textContent = e.target.value;
});

function updateBrushCursor() {
  const rect = canvas.getBoundingClientRect();
  const scale = rect.width / canvas.width;
  const size = currentSize * scale;
  brushCursor.style.width = size + 'px';
  brushCursor.style.height = size + 'px';

  if (isEraser) {
    brushCursor.classList.add('eraser-mode');
  } else {
    brushCursor.classList.remove('eraser-mode');
  }
}

canvas.addEventListener('mouseenter', () => {
  brushCursor.style.display = 'block';
  updateBrushCursor();
});

canvas.addEventListener('mouseleave', () => {
  brushCursor.style.display = 'none';
});

canvas.addEventListener('mousemove', (e) => {
  brushCursor.style.left = e.clientX + 'px';
  brushCursor.style.top = e.clientY + 'px';
});

eyedropperBtn.addEventListener('click', () => {
  isEyedropper = !isEyedropper;
  eyedropperBtn.classList.toggle('active');
  if (isEyedropper) {
    canvas.style.cursor = 'crosshair';
    brushCursor.style.display = 'none';
    isEraser = false;
    eraserBtn.classList.remove('active');
  } else {
    canvas.style.cursor = 'none';
  }
});

eraserBtn.addEventListener('click', () => {
  isEraser = !isEraser;
  eraserBtn.classList.toggle('active');
  if (isEraser) {
    isEyedropper = false;
    eyedropperBtn.classList.remove('active');
  }
  updateBrushCursor();
});

clearBtn.addEventListener('click', () => {
  if (confirm('Clear the entire canvas for everyone?')) {
    socket.emit('clear-canvas');
  }
});

addLayerBtn.addEventListener('click', () => {
  socket.emit('add-layer');
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault();
    redo();
  }
});

let draggedLayer = null;
let compositeScheduled = false;
let drawBatch = [];
let batchTimeout = null;

function scheduleComposite() {
  if (!compositeScheduled) {
    compositeScheduled = true;
    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      layers.forEach(layer => {
        if (!layer.visible) return;
        const lc = layerCanvases.get(layer.id);
        if (lc) {
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(lc, 0, 0);
          ctx.globalAlpha = 1.0;
        }
      });
      compositeScheduled = false;
    });
  }
}

function flushDrawBatch() {
  if (drawBatch.length > 0) {
    socket.emit('draw-batch', drawBatch);
    drawBatch = [];
  }
  batchTimeout = null;
}

function updateLayersList() {
  layersList.innerHTML = '';

  layers.slice().reverse().forEach((layer, index) => {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item' + (layer.id === currentLayerId ? ' active' : '');
    layerItem.draggable = true;
    layerItem.dataset.layerId = layer.id;

    const layerName = document.createElement('span');
    layerName.textContent = layer.name;
    layerName.className = 'layer-name';

    layerName.ondblclick = (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = layer.name;
      input.className = 'layer-name-input';
      input.onblur = () => {
        const newName = input.value.trim() || layer.name;
        socket.emit('update-layer', { layerId: layer.id, updates: { name: newName } });
      };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      };
      layerName.replaceWith(input);
      input.focus();
      input.select();
    };

    const layerControls = document.createElement('div');
    layerControls.className = 'layer-controls';

    const visibilityBtn = document.createElement('button');
    visibilityBtn.textContent = layer.visible ? '👁' : '👁‍🗨';
    visibilityBtn.className = 'layer-btn';
    visibilityBtn.onclick = (e) => {
      e.stopPropagation();
      socket.emit('update-layer', { layerId: layer.id, updates: { visible: !layer.visible } });
    };

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = layer.opacity * 100;
    opacitySlider.className = 'opacity-slider';

    let isDraggingSlider = false;

    opacitySlider.onmousedown = (e) => {
      e.stopPropagation();
      isDraggingSlider = true;
    };

    opacitySlider.oninput = (e) => {
      e.stopPropagation();
      if (isDraggingSlider) {
        socket.emit('update-layer', { layerId: layer.id, updates: { opacity: e.target.value / 100 } });
      }
    };

    opacitySlider.onchange = (e) => {
      e.stopPropagation();
      socket.emit('update-layer', { layerId: layer.id, updates: { opacity: e.target.value / 100 } });
      isDraggingSlider = false;
    };

    opacitySlider.onmouseup = (e) => {
      e.stopPropagation();
      isDraggingSlider = false;
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'layer-btn delete-btn';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (layers.length > 1) {
        socket.emit('delete-layer', { layerId: layer.id });
      } else {
        alert('Cannot delete the last layer');
      }
    };

    layerControls.appendChild(visibilityBtn);
    layerControls.appendChild(opacitySlider);
    layerControls.appendChild(deleteBtn);

    layerItem.appendChild(layerName);
    layerItem.appendChild(layerControls);

    layerItem.onclick = (e) => {
      if (e.target === layerItem || e.target === layerName) {
        currentLayerId = layer.id;
        updateLayersList();
      }
    };

    layerItem.ondragstart = (e) => {
      draggedLayer = layer.id;
      layerItem.classList.add('dragging');
    };

    layerItem.ondragend = (e) => {
      layerItem.classList.remove('dragging');
      draggedLayer = null;
    };

    layerItem.ondragover = (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(layersList, e.clientY);
      if (afterElement == null) {
        layersList.appendChild(layerItem);
      }
    };

    layerItem.ondrop = (e) => {
      e.preventDefault();
      if (draggedLayer && draggedLayer !== layer.id) {
        const draggedIndex = layers.findIndex(l => l.id === draggedLayer);
        const targetIndex = layers.findIndex(l => l.id === layer.id);

        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [removed] = layers.splice(draggedIndex, 1);
          layers.splice(targetIndex, 0, removed);
          socket.emit('reorder-layers', { layers: layers.map(l => l.id) });
          updateLayersList();
          redrawCanvas();
        }
      }
    };

    layersList.appendChild(layerItem);
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.layer-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

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

function pickColor(x, y) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  layers.forEach(layer => {
    if (!layer.visible) return;
    const layerCanvas = layerCanvases.get(layer.id);
    if (layerCanvas) {
      tempCtx.globalAlpha = layer.opacity;
      tempCtx.drawImage(layerCanvas, 0, 0);
    }
  });

  const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
  const r = pixelData[0];
  const g = pixelData[1];
  const b = pixelData[2];

  const hexColor = '#' + [r, g, b].map(c => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');

  currentColor = hexColor;
  colorPicker.value = hexColor;
  isEyedropper = false;
  eyedropperBtn.classList.remove('active');
}
