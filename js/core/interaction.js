import { state } from './state.js';
import { saveHistory } from './history.js';
import { solveIK } from './kinematics.js';

const NODE_RADIUS = 7;

export function hitNode(nodes, x, y) {
  let closest = null;
  let minDist = NODE_RADIUS * 2.5;
  nodes.forEach(n => {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < minDist) { minDist = d; closest = n; }
  });
  return closest;
}

export function startDrag(state, node, worldPos) {
  state.dragNode = node;
  state.isDragging = true;
  
  if (!state.selectedNodes.some(n => n.id === node.id)) {
    state.selectedNodes = [node];
  }
}

export function moveDrag(state, dx, dy) {
  if (!state.dragNode) return;

  const dragNode = state.dragNode;

  if (state.useIK && dragNode.id !== 'pelvis') {
    dragNode.x += dx;
    dragNode.y += dy;
    solveIK(state);
  } else if (dragNode.id === 'pelvis') {
    const movingChildren = state.footAnchor 
      ? state.PELVIS_CHILDREN.filter(id => !state.FOOT_NODES.includes(id))
      : state.PELVIS_CHILDREN;
      
    state.nodes.forEach(n => {
      if (movingChildren.includes(n.id)) {
        n.x += dx;
        n.y += dy;
      }
    });
    dragNode.x += dx;
    dragNode.y += dy;
    
    if (state.footAnchor) {
      state.FOOT_NODES.forEach(fid => {
        const f = state.nodes.find(n => n.id === fid);
        if (f) f.y = state.GROUND_Y;
      });
    }
  } else {
    // Move the dragged node freely (constraints disabled)
    dragNode.x += dx;
    dragNode.y += dy;
    
    if (state.NODE_HIERARCHY[dragNode.id]) {
      state.NODE_HIERARCHY[dragNode.id].forEach(childId => {
        const child = state.nodes.find(n => n.id === childId);
        if (child) {
          child.x += dx;
          child.y += dy;
        }
      });
    }
    
    state.selectedNodes.forEach(n => {
      if (n.id !== dragNode.id) {
        n.x += dx;
        n.y += dy;
      }
    });
  }
}

export function endDrag(state) {
  if (state.isDragging) {
    saveHistory();
  }
  state.dragNode = null;
  state.isDragging = false;
}

export function startPan(state, screenPos) {
  state.dragState.isDraggingBox = false;
  state.dragState.panStart = { x: screenPos.x, y: screenPos.y };
  state.dragState.panStartOffset = { ...state.view.panOffset };
}

export function pan(state, dx, dy) {
  state.view.panOffset.x += dx;
  state.view.panOffset.y += dy;
}

export function endPan(state) {
  state.dragState.panStart = null;
}

export function hitBoxHandle(state, wx, wy) {
  const { spriteBox, view } = state;
  const boxW = spriteBox.width / view.charScale;
  const boxH = spriteBox.height / view.charScale;
  const boxX = spriteBox.x / view.charScale;
  const boxBottom = spriteBox.y / view.charScale;
  const top = boxBottom - boxH;
  const left = boxX - boxW/2;
  const handleHitSize = 30 / view.charScale;
  
  const handles = [
    { id: 'top', x: boxX, y: top },
    { id: 'bottom', x: boxX, y: top + boxH },
    { id: 'left', x: left, y: boxBottom },
    { id: 'right', x: left + boxW, y: boxBottom },
    { id: 'top-left', x: left, y: top },
    { id: 'top-right', x: left + boxW, y: top },
    { id: 'bottom-left', x: left, y: top + boxH },
    { id: 'bottom-right', x: left + boxW, y: top + boxH },
  ];
  
  for (const h of handles) {
    if (Math.abs(wx - h.x) < handleHitSize && Math.abs(wy - h.y) < handleHitSize) {
      return h.id;
    }
  }
  return null;
}

export function hitBoxBody(state, wx, wy) {
  const { spriteBox, view } = state;
  const boxW = spriteBox.width / view.charScale;
  const boxH = spriteBox.height / view.charScale;
  const boxX = spriteBox.x / view.charScale;
  const boxBottom = spriteBox.y / view.charScale;
  const top = boxBottom - boxH;
  const left = boxX - boxW/2;
  
  return wx >= left && wx <= left + boxW && wy >= top && wy <= top + boxH;
}

export function startDragBox(state, worldPos) {
  state.dragState.isDraggingBox = true;
  state.dragState.boxDragStart = { x: worldPos.x, y: worldPos.y };
  state.dragState.boxStartState = {
    x: state.spriteBox.x,
    y: state.spriteBox.y,
    width: state.spriteBox.width,
    height: state.spriteBox.height
  };
}

export function moveDragBox(state, worldPos) {
  if (!state.dragState.isDraggingBox) return;
  
  const dx = worldPos.x - state.dragState.boxDragStart.x;
  const dy = worldPos.y - state.dragState.boxDragStart.y;
  const start = state.dragState.boxStartState;
  const handle = state.dragState.boxDragHandle;

  if (handle === 'move' || !handle) {
    state.spriteBox.x = start.x + dx;
    state.spriteBox.y = start.y + dy;
  } else {
    if (handle === 'top') {
      const newH = Math.max(50, start.height - dy);
      state.spriteBox.height = newH;
    } else if (handle === 'left') {
      const newW = Math.max(50, start.width + dx);
      state.spriteBox.x -= (newW - start.width) / 2;
      state.spriteBox.width = newW;
    } else if (handle === 'right') {
      const newW = Math.max(50, start.width + dx);
      state.spriteBox.x += (newW - start.width) / 2;
      state.spriteBox.width = newW;
    } else if (handle === 'top-left') {
      const newW = Math.max(50, start.width + dx);
      const newH = Math.max(50, start.height - dy);
      state.spriteBox.x -= (newW - start.width) / 2;
      state.spriteBox.width = newW;
      state.spriteBox.height = newH;
    } else if (handle === 'top-right') {
      const newW = Math.max(50, start.width - dx);
      const newH = Math.max(50, start.height - dy);
      state.spriteBox.x += (newW - start.width) / 2;
      state.spriteBox.width = newW;
      state.spriteBox.height = newH;
    }
    
    const sizeEl = document.getElementById('spriteFrameSize');
    const sizeValEl = document.getElementById('spriteFrameSizeVal');
    if (sizeEl) sizeEl.value = Math.max(state.spriteBox.width, state.spriteBox.height);
    if (sizeValEl) sizeValEl.textContent = Math.round(Math.max(state.spriteBox.width, state.spriteBox.height));
  }
}

export function endDragBox(state) {
  if (state.dragState.isDraggingBox) {
    saveHistory();
  }
  state.dragState.isDraggingBox = false;
  state.dragState.boxDragHandle = null;
}

export { NODE_RADIUS };