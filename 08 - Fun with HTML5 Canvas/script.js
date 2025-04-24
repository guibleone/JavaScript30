const canvas = document.querySelector("#draw");
const ctx = canvas.getContext("2d");

const resetBtn = document.querySelector("#reset");
const icons = document.querySelectorAll("svg");

const shapes = [];

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

let isDrawing = false;
let isDragging = false;
let isResizing = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let shape = "";
let savedImageData;
let selectedShape = null;
let selectedCorner = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redrawAll();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.lineWidth = 10;
ctx.strokeStyle = "#000";

// EVENT LISTENERS
resetBtn.addEventListener("click", () => {
  shapes.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function selectShape() {
  icons.forEach((icon) => icon.classList.remove("active"));
  shape = this.dataset.shape;
  this.classList.add("active");
  selectedShape = null;
  canvas.style.cursor = shape === "mouse" ? "default" : "crosshair";
  redrawAll();
}

icons.forEach((icon) => icon.addEventListener("click", selectShape));

document.addEventListener("keydown", (e) => {
  if ((e.key === "Delete" || e.key === "Backspace") && selectedShape) {
    shapes.splice(shapes.indexOf(selectedShape), 1);
    selectedShape = null;
    redrawAll();
  }
});

canvas.addEventListener("mousedown", (e) => {
  const x = (e.offsetX - offsetX) / scale;
  const y = (e.offsetY - offsetY) / scale;

  startX = x;
  startY = y;

  if (shape === "mouse") {
    if (!selectedShape) {
      isPanning = true;
      panStartX = e.offsetX;
      panStartY = e.offsetY;
      return;
    }

    selectedShape = null;
    selectedCorner = null;

    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];

      if (s.type === "square") {
        const corners = getSquareCorners(s);
        for (let corner of corners) {
          if (isNear(startX, startY, corner.x, corner.y)) {
            selectedShape = s;
            selectedCorner = corner.position;
            isResizing = true;
            redrawAll();
            return;
          }
        }

        if (
          startX >= s.x &&
          startX <= s.x + s.w &&
          startY >= s.y &&
          startY <= s.y + s.h
        ) {
          selectedShape = s;
          dragOffsetX = startX - s.x;
          dragOffsetY = startY - s.y;
          isDragging = true;
          canvas.style.cursor = "move";
          redrawAll();
          return;
        }
      }

      if (s.type === "line") {
        const tolerance = 10 / scale;
        const minX = Math.min(s.x1, s.x2) - tolerance;
        const maxX = Math.max(s.x1, s.x2) + tolerance;
        const minY = Math.min(s.y1, s.y2) - tolerance;
        const maxY = Math.max(s.y1, s.y2) + tolerance;

        if (
          startX >= minX &&
          startX <= maxX &&
          startY >= minY &&
          startY <= maxY
        ) {
          selectedShape = s;
          dragOffsetX = startX - s.x1;
          dragOffsetY = startY - s.y1;
          isDragging = true;
          canvas.style.cursor = "move";
          redrawAll();
          return;
        }
      }
    }

    canvas.style.cursor = "default";
    return;
  } else {
    isDrawing = true;
    savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isPanning) {
    offsetX += e.offsetX - panStartX;
    offsetY += e.offsetY - panStartY;
    panStartX = e.offsetX;
    panStartY = e.offsetY;
    requestAnimationFrame(redrawAll);
    return;
  }

  currentX = (e.offsetX - offsetX) / scale;
  currentY = (e.offsetY - offsetY) / scale;

  if (isDrawing && shape !== "mouse") {
    ctx.putImageData(savedImageData, 0, 0);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.beginPath();

    if (shape === "square") {
      let x = startX;
      let y = startY;
      let w = currentX - startX;
      let h = currentY - startY;

      if (w < 0) {
        x = currentX;
        w = -w;
      }
      if (h < 0) {
        y = currentY;
        h = -h;
      }

      ctx.rect(x, y, w, h);
    } else if (shape === "line") {
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
    }

    ctx.stroke();
    ctx.restore();
  }

  if (isDragging && selectedShape) {
    if (selectedShape.type === "square") {
      selectedShape.x = currentX - dragOffsetX;
      selectedShape.y = currentY - dragOffsetY;
    } else if (selectedShape.type === "line") {
      const dx = currentX - dragOffsetX - selectedShape.x1;
      const dy = currentY - dragOffsetY - selectedShape.y1;

      selectedShape.x1 += dx;
      selectedShape.y1 += dy;
      selectedShape.x2 += dx;
      selectedShape.y2 += dy;

      dragOffsetX = currentX - selectedShape.x1;
      dragOffsetY = currentY - selectedShape.y1;
    }

    requestAnimationFrame(redrawAll);
  }

  if (isResizing && selectedShape && selectedShape.type === "square") {
    let x = selectedShape.x;
    let y = selectedShape.y;
    let w = selectedShape.w;
    let h = selectedShape.h;

    if (selectedCorner === "top-left") {
      w += x - currentX;
      h += y - currentY;
      x = currentX;
      y = currentY;
    } else if (selectedCorner === "top-right") {
      w = currentX - x;
      h += y - currentY;
      y = currentY;
    } else if (selectedCorner === "bottom-left") {
      w += x - currentX;
      h = currentY - y;
      x = currentX;
    } else if (selectedCorner === "bottom-right") {
      w = currentX - x;
      h = currentY - y;
    }

    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }

    selectedShape.x = x;
    selectedShape.y = y;
    selectedShape.w = w;
    selectedShape.h = h;

    requestAnimationFrame(redrawAll);
  }

  if (shape === "mouse" && !isDrawing && !isDragging && !isResizing) {
    let cursorSet = false;
    for (let s of shapes) {
      if (s.type === "square") {
        const corners = getSquareCorners(s);
        for (let corner of corners) {
          if (isNear(currentX, currentY, corner.x, corner.y)) {
            canvas.style.cursor =
              corner.position.includes("top-left") ||
              corner.position.includes("bottom-right")
                ? "nwse-resize"
                : "nesw-resize";
            cursorSet = true;
            break;
          }
        }
        if (cursorSet) break;
      }
    }
    if (!cursorSet) {
      canvas.style.cursor = "default";
    }
  }
});

canvas.addEventListener("mouseup", (e) => {
  isPanning = false;
  if (isDrawing && shape !== "mouse") {
    isDrawing = false;
    currentX = (e.offsetX - offsetX) / scale;
    currentY = (e.offsetY - offsetY) / scale;

    if (shape === "square") {
      let x = startX;
      let y = startY;
      let w = currentX - startX;
      let h = currentY - startY;

      if (w < 0) {
        x = currentX;
        w = -w;
      }
      if (h < 0) {
        y = currentY;
        h = -h;
      }

      if (w > 5 && h > 5) {
        shapes.push({ type: "square", x, y, w, h });
      }
    } else if (shape === "line") {
      if (Math.abs(currentX - startX) > 5 || Math.abs(currentY - startY) > 5) {
        shapes.push({
          type: "line",
          x1: startX,
          y1: startY,
          x2: currentX,
          y2: currentY,
        });
      }
    }

    ctx.putImageData(savedImageData, 0, 0);
    redrawAll();
  }

  isDragging = false;
  isResizing = false;
  canvas.style.cursor = shape === "mouse" ? "default" : "crosshair";
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const mx = e.offsetX;
  const my = e.offsetY;
  const x = (mx - offsetX) / scale;
  const y = (my - offsetY) / scale;
  scale *= zoomFactor;
  offsetX = mx - x * scale;
  offsetY = my - y * scale;
  requestAnimationFrame(redrawAll);
});

function redrawAll() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // resetar transformações

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Aplicar a escala manualmente apenas nas coordenadas
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  for (let s of shapes) {
    ctx.beginPath();

    // Define uma lineWidth que se mantém constante em relação ao zoom
    ctx.lineWidth = 2 / scale;
    ctx.strokeStyle = s === selectedShape ? "red" : "#000";

    if (s.type === "square") {
      ctx.rect(s.x, s.y, s.w, s.h);
    } else if (s.type === "line") {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }

    ctx.stroke();
  }

  // Restaurar antes de desenhar alças de resize (que são em coordenadas de tela)
  ctx.restore();

  // Desenhar as alças de redimensionamento
  if (selectedShape && selectedShape.type === "square") {
    const corners = getSquareCorners(selectedShape);
    ctx.fillStyle = "blue";
    for (let c of corners) {
      const screenX = c.x * scale + offsetX;
      const screenY = c.y * scale + offsetY;
      ctx.fillRect(screenX - 5, screenY - 5, 10, 10);
    }
    ctx.fillStyle = "#000";
  }
}

function getSquareCorners(s) {
  return [
    { x: s.x, y: s.y, position: "top-left" },
    { x: s.x + s.w, y: s.y, position: "top-right" },
    { x: s.x, y: s.y + s.h, position: "bottom-left" },
    { x: s.x + s.w, y: s.y + s.h, position: "bottom-right" },
  ];
}

function isNear(x, y, targetX, targetY, screenTolerance = 10) {
  const tolerance = screenTolerance / scale;
  return (
    x >= targetX - tolerance &&
    x <= targetX + tolerance &&
    y >= targetY - tolerance &&
    y <= targetY + tolerance
  );
}
