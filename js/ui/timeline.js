import { state } from '../core/state.js';

let callbacks = null;

export function initTimeline(state, cb) {
  callbacks = cb;

  document.getElementById('fpsInput').addEventListener('input', (e) => {
    const fps = parseInt(e.target.value) || 12;
    state.playback.fps = fps;
    callbacks.onFPSChange(fps);
    if (state.playback.isPlaying) restartPlayback();
  });

  document.getElementById('loopToggle').addEventListener('change', (e) => {
    state.playback.loop = e.target.checked;
    callbacks.onLoopToggle(e.target.checked);
  });

  document.getElementById('onionToggle').addEventListener('change', (e) => {
    state.view.onionSkin = e.target.checked;
    callbacks.onOnionToggle(e.target.checked);
  });

  document.getElementById('addFrameBtn').addEventListener('click', () => {
    callbacks.onAddFrame();
    updateTimeline();
    updateFrameBadge();
  });

  document.getElementById('delFrameBtn').addEventListener('click', () => {
    if (state.frames.length > 1) {
      callbacks.onDeleteFrame(state.currentFrame);
      updateTimeline();
      updateFrameBadge();
    }
  });

  document.getElementById('dupFrameBtn').addEventListener('click', () => {
    callbacks.onDupFrame();
    updateTimeline();
    updateFrameBadge();
  });

  document.getElementById('playBtn').addEventListener('click', () => {
    if (state.playback.isPlaying) {
      callbacks.onPause();
      stopPlayback();
    } else {
      callbacks.onPlay();
      startPlayback();
    }
  });

  document.getElementById('prevFrameBtn').addEventListener('click', () => {
    const prev = Math.max(0, state.currentFrame - 1);
    callbacks.onFrameSelect(prev);
    updateFrameBadge();
  });

  document.getElementById('nextFrameBtn').addEventListener('click', () => {
    const next = Math.min(state.frames.length - 1, state.currentFrame + 1);
    callbacks.onFrameSelect(next);
    updateFrameBadge();
  });
}

function startPlayback() {
  state.playback.isPlaying = true;
  document.getElementById('playBadge').style.display = 'block';
  document.getElementById('playBtn').textContent = '⏸';
  
  const interval = 1000 / state.playback.fps;
  state.playback.interval = setInterval(() => {
    if (!state.playback.isPlaying) return;
    let next = state.currentFrame + 1;
    if (next >= state.frames.length) {
      if (state.playback.loop) {
        next = 0;
      } else {
        stopPlayback();
        return;
      }
    }
    state.currentFrame = next;
    // Use the callback to actually switch frames (ensures proper restoration)
    callbacks.onFrameSelect(next);
    updateFrameBadge();
  }, interval);
}

function stopPlayback() {
  state.playback.isPlaying = false;
  document.getElementById('playBadge').style.display = 'none';
  document.getElementById('playBtn').textContent = '▶';
  if (state.playback.interval) {
    clearInterval(state.playback.interval);
    state.playback.interval = null;
  }
}

function restartPlayback() {
  stopPlayback();
  startPlayback();
}

export function updateTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  const existing = timeline.querySelectorAll('.frame-item');
  existing.forEach(t => t.remove());
  
  state.frames.forEach((frame, index) => {
    const item = document.createElement('div');
    item.className = `frame-item ${index === state.currentFrame ? 'current' : ''}`;
    
    const thumb = document.createElement('canvas');
    thumb.className = 'frame-thumb';
    thumb.width = 50;
    thumb.height = 36;
    renderFrameThumb(thumb, frame.nodes);
    
    const num = document.createElement('span');
    num.className = 'frame-num';
    num.textContent = index + 1;
    
    const label = document.createElement('span');
    label.className = 'frame-label';
    label.textContent = frame.label || `Frame ${index + 1}`;
    
    const del = document.createElement('button');
    del.className = 'frame-del';
    del.textContent = '×';
    del.title = 'Delete frame';
    del.onclick = (e) => {
      e.stopPropagation();
      if (state.frames.length > 1) {
        callbacks.onDeleteFrame(index);
        updateTimeline();
        updateFrameBadge();
      }
    };
    
    item.appendChild(thumb);
    item.appendChild(num);
    item.appendChild(label);
    item.appendChild(del);
    
    item.addEventListener('click', () => {
      callbacks.onFrameSelect(index);
      updateTimeline();
      updateFrameBadge();
    });
    
    timeline.appendChild(item);
  });
}

function renderFrameThumb(canvas, nodes) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const sc = 0.18 * state.view.charScale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);

  function thumbLimb(ax, ay, bx, by, wa, wb, color) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    if (len < 1) return;
    const nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(ax + nx * wa, ay + ny * wa);
    ctx.lineTo(bx + nx * wb, by + ny * wb);
    ctx.lineTo(bx - nx * wb, by - ny * wb);
    ctx.lineTo(ax - nx * wa, ay - ny * wa);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  const sn = id => nodes.find(n => n.id === id);
  const C = state.charColors;
  
  // Back leg (right)
  if (sn('hip_r') && sn('knee_r')) thumbLimb(sn('hip_r').x, sn('hip_r').y, sn('knee_r').x, sn('knee_r').y, 4, 3, '#002211');
  if (sn('knee_r') && sn('foot_r')) thumbLimb(sn('knee_r').x, sn('knee_r').y, sn('foot_r').x, sn('foot_r').y, 3, 2, '#001108');
  // Back arm
  if (sn('shoulder_r') && sn('elbow_r')) thumbLimb(sn('shoulder_r').x, sn('shoulder_r').y, sn('elbow_r').x, sn('elbow_r').y, 3, 2, '#002211');
  if (sn('elbow_r') && sn('hand_r')) thumbLimb(sn('elbow_r').x, sn('elbow_r').y, sn('hand_r').x, sn('hand_r').y, 2, 1, '#001108');
  // Torso
  if (sn('chest') && sn('pelvis')) thumbLimb(sn('chest').x, sn('chest').y, sn('pelvis').x, sn('pelvis').y, 8, 6, '#0d2233');
  if (sn('pelvis') && sn('bum')) thumbLimb(sn('pelvis').x, sn('pelvis').y, sn('bum').x, sn('bum').y, 6, 7, '#1a3344');
  if (sn('neck') && sn('chest')) thumbLimb(sn('neck').x, sn('neck').y, sn('chest').x, sn('chest').y, 3, 5, '#0d2233');
  // Front leg
  if (sn('hip_l') && sn('knee_l')) thumbLimb(sn('hip_l').x, sn('hip_l').y, sn('knee_l').x, sn('knee_l').y, 5, 4, C.legL);
  if (sn('knee_l') && sn('foot_l')) thumbLimb(sn('knee_l').x, sn('knee_l').y, sn('foot_l').x, sn('foot_l').y, 4, 2, C.legL);
  // Front arm
  if (sn('shoulder_l') && sn('elbow_l')) thumbLimb(sn('shoulder_l').x, sn('shoulder_l').y, sn('elbow_l').x, sn('elbow_l').y, 4, 3, C.armL);
  if (sn('elbow_l') && sn('hand_l')) thumbLimb(sn('elbow_l').x, sn('elbow_l').y, sn('hand_l').x, sn('hand_l').y, 3, 2, C.armL);
  // Head
  if (sn('head')) {
    ctx.beginPath();
    ctx.arc(sn('head').x, sn('head').y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0d2233';
    ctx.fill();
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

export function updateFrameBadge() {
  const badge = document.getElementById('frameBadge');
  if (badge) {
    badge.textContent = `Frame ${state.currentFrame + 1} / ${state.frames.length}`;
  }
}
