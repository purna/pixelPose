// app.js - Main application logic for PoseForge
import { loadBodyDefinition, getCurrentNodes, getCurrentBones, getCurrentConstraints, NODE_RADIUS } from './skeleton.js';
import Config from './config.js';

// ─── STATE ─────────────────────────────────────────────────────────────
let nodes = [];
let bones = [];
let constraints = {};
let frames = []; // array of snapshots
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;
let savedAnimations = [];
let isDragging = false;
let dragNode = null;
let mode = 'move'; // 'move' | 'pan'
let panStart = null;
let panOffset = { x: 0, y: 0 };
let viewRotation = 0;
let viewScale = 1.0;
let charScale = 1.0;
let showLabels = true;
let showGrid = true;
let showShadow = false;
let onionSkin = false;
let currentAnimName = null; // Track currently loaded animation name

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// ─── RESIZE ────────────────────────────────────────────────────────────
function resize() {
  const wrap = document.getElementById('canvasWrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  render();
}
window.addEventListener('resize', resize);

// ─── SNAPSHOT ──────────────────────────────────────────────────────────
function snapshotNodes() {
  return JSON.parse(JSON.stringify(nodes));
}

function restoreNodes(snap) {
  nodes = JSON.parse(JSON.stringify(snap));
}

function saveCurrentToFrame() {
  if (frames.length === 0) return;
  frames[currentFrame].nodes = snapshotNodes();
  renderThumb(currentFrame);
}

function gotoFrame(idx) {
  if (frames.length === 0) return;
  saveCurrentToFrame();
  currentFrame = Math.max(0, Math.min(idx, frames.length - 1));
  restoreNodes(frames[currentFrame].nodes);
  updateTimelineUI();
  render();
  updateFrameBadge();
}

// ─── FRAMES ────────────────────────────────────────────────────────────
function addFrame() {
  saveCurrentToFrame();
  const snap = snapshotNodes();
  frames.push({ nodes: snap, label: `Frame ${frames.length + 1}` });
  currentFrame = frames.length - 1;
  updateTimelineUI();
  renderThumb(currentFrame);
  updateFrameBadge();
  render();
}

function dupFrame() {
  if (frames.length === 0) return;
  saveCurrentToFrame();
  const snap = snapshotNodes();
  frames.splice(currentFrame + 1, 0, {
    nodes: JSON.parse(JSON.stringify(snap)),
    label: `Frame ${frames.length + 1}`
  });
  currentFrame = currentFrame + 1;
  updateTimelineUI();
  render();
  updateFrameBadge();
}

function deleteFrame() {
  if (frames.length <= 1) return;
  frames.splice(currentFrame, 1);
  currentFrame = Math.min(currentFrame, frames.length - 1);
  restoreNodes(frames[currentFrame].nodes);
  updateTimelineUI();
  render();
  updateFrameBadge();
}

function updateFrameBadge() {
  document.getElementById('frameBadge').textContent =
    `Frame ${currentFrame + 1} / ${frames.length}`;
}

// ─── TIMELINE UI ───────────────────────────────────────────────────────
function updateTimelineUI() {
  const tl = document.getElementById('timeline');
  tl.innerHTML = '';
  frames.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'frame-item' + (i === currentFrame ? ' current' : '');
    item.dataset.idx = i;

    const num = document.createElement('span');
    num.className = 'frame-num';
    num.textContent = i + 1;

    const thumb = document.createElement('canvas');
    thumb.className = 'frame-thumb';
    thumb.width = 50;
    thumb.height = 36;
    thumb.id = `thumb-${i}`;

    const label = document.createElement('span');
    label.className = 'frame-label';
    label.textContent = f.label;

    const del = document.createElement('button');
    del.className = 'frame-del';
    del.textContent = '×';
    del.onclick = (e) => { e.stopPropagation(); if (frames.length > 1) { frames.splice(i,1); if(currentFrame >= frames.length) currentFrame = frames.length-1; restoreNodes(frames[currentFrame].nodes); updateTimelineUI(); render(); updateFrameBadge(); } };

    item.appendChild(num);
    item.appendChild(thumb);
    item.appendChild(label);
    item.appendChild(del);
    item.addEventListener('click', () => gotoFrame(i));
    tl.appendChild(item);
  });

  frames.forEach((_, i) => renderThumb(i));
}

function renderThumb(idx) {
  const tc = document.getElementById(`thumb-${idx}`);
  if (!tc) return;
  const tctx = tc.getContext('2d');
  const w = tc.width, h = tc.height;
  tctx.clearRect(0, 0, w, h);
  tctx.fillStyle = '#0a0a14';
  tctx.fillRect(0, 0, w, h);

  const snap = frames[idx].nodes;
  const cx = w / 2, cy = h / 2;
  const sc = 0.18 * charScale;

  tctx.save();
  tctx.translate(cx, cy);
  tctx.scale(sc, sc);

  // draw shaped limbs in thumbnail
  function thumbLimb(ax, ay, bx, by, wa, wb, color) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    if (len < 1) return;
    const nx = -dy / len, ny = dx / len;
    tctx.beginPath();
    tctx.moveTo(ax + nx * wa, ay + ny * wa);
    tctx.lineTo(bx + nx * wb, by + ny * wb);
    tctx.lineTo(bx - nx * wb, by - ny * wb);
    tctx.lineTo(ax - nx * wa, ay - ny * wa);
    tctx.closePath();
    tctx.fillStyle = color;
    tctx.fill();
  }
  const sn = id => snap.find(n => n.id === id);
  // back leg
  if (sn('hip_r') && sn('knee_r')) thumbLimb(sn('hip_r').x, sn('hip_r').y, sn('knee_r').x, sn('knee_r').y, 4, 3, '#002211');
  if (sn('knee_r') && sn('foot_r')) thumbLimb(sn('knee_r').x, sn('knee_r').y, sn('foot_r').x, sn('foot_r').y, 3, 2, '#001108');
  // back arm
  if (sn('shoulder_r') && sn('elbow_r')) thumbLimb(sn('shoulder_r').x, sn('shoulder_r').y, sn('elbow_r').x, sn('elbow_r').y, 3, 2, '#002211');
  if (sn('elbow_r') && sn('hand_r')) thumbLimb(sn('elbow_r').x, sn('elbow_r').y, sn('hand_r').x, sn('hand_r').y, 2, 1, '#001108');
  // torso
  if (sn('chest') && sn('pelvis')) thumbLimb(sn('chest').x, sn('chest').y, sn('pelvis').x, sn('pelvis').y, 8, 6, '#0d2233');
  if (sn('pelvis') && sn('bum')) thumbLimb(sn('pelvis').x, sn('pelvis').y, sn('bum').x, sn('bum').y, 6, 7, '#1a3344');
  if (sn('neck') && sn('chest')) thumbLimb(sn('neck').x, sn('neck').y, sn('chest').x, sn('chest').y, 3, 5, '#0d2233');
  // front leg
  if (sn('hip_l') && sn('knee_l')) thumbLimb(sn('hip_l').x, sn('hip_l').y, sn('knee_l').x, sn('knee_l').y, 5, 4, '#0044cc');
  if (sn('knee_l') && sn('foot_l')) thumbLimb(sn('knee_l').x, sn('knee_l').y, sn('foot_l').x, sn('foot_l').y, 4, 2, '#0044cc');
  // front arm
  if (sn('shoulder_l') && sn('elbow_l')) thumbLimb(sn('shoulder_l').x, sn('shoulder_l').y, sn('elbow_l').x, sn('elbow_l').y, 4, 3, '#0055aa');
  if (sn('elbow_l') && sn('hand_l')) thumbLimb(sn('elbow_l').x, sn('elbow_l').y, sn('hand_l').x, sn('hand_l').y, 3, 2, '#0055aa');
  // head
  if (sn('head')) {
    tctx.beginPath();
    tctx.arc(sn('head').x, sn('head').y, 10, 0, Math.PI * 2);
    tctx.fillStyle = '#0d2233';
    tctx.fill();
    tctx.strokeStyle = '#00ffcc';
    tctx.lineWidth = 1;
    tctx.stroke();
  }
  tctx.restore();
}

// ─── RENDER ────────────────────────────────────────────────────────────
function render() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2 + panOffset.x;
  const cy = h / 2 + panOffset.y;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(viewRotation * Math.PI / 180);
  ctx.scale(viewScale, viewScale);

  // Grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(40,40,60,0.8)';
    ctx.lineWidth = 1;
    const step = 40;
    const range = 1200;
    for (let x = -range; x <= range; x += step) {
      ctx.beginPath(); ctx.moveTo(x, -range); ctx.lineTo(x, range); ctx.stroke();
    }
    for (let y = -range; y <= range; y += step) {
      ctx.beginPath(); ctx.moveTo(-range, y); ctx.lineTo(range, y); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = 'rgba(0,255,204,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-range, 0); ctx.lineTo(range, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -range); ctx.lineTo(0, range); ctx.stroke();
  }

  // Ground line
  const groundY = 145 * charScale;
  ctx.strokeStyle = 'rgba(0,255,204,0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.moveTo(-300, groundY); ctx.lineTo(300, groundY); ctx.stroke();
  ctx.setLineDash([]);

  // Ground shadow
  if (showShadow) {
    ctx.save();
    ctx.scale(charScale, charScale);
    ctx.beginPath();
    ctx.ellipse(0, 142, 45, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,204,0.06)';
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.scale(charScale, charScale);

  // Onion skin
  if (onionSkin && currentFrame > 0 && frames.length > 1) {
    const prevSnap = frames[currentFrame - 1].nodes;
    drawSkeleton(ctx, prevSnap, 0.15, '#7b61ff');
  }

  // Main skeleton
  drawSkeleton(ctx, nodes, 1, null);

  ctx.restore();
  ctx.restore();
}

function drawSkeleton(ctx, nodeList, alpha, overrideColor) {
  const ghost = !!overrideColor;

  // Helper: get node by id
  const N = id => nodeList.find(n => n.id === id);

  // --- Draw tapered limb segment (thick at top, thin at bottom) ---
  function drawLimb(ax, ay, bx, by, widthA, widthB, color, alphaVal) {
    ctx.globalAlpha = alphaVal;
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const nx = -dy / len, ny = dx / len; // normal

    ctx.beginPath();
    ctx.moveTo(ax + nx * widthA, ay + ny * widthA);
    ctx.lineTo(bx + nx * widthB, by + ny * widthB);
    ctx.lineTo(bx - nx * widthB, by - ny * widthB);
    ctx.lineTo(ax - nx * widthA, ay - ny * widthA);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // --- Color scheme ---
  const C = {
    body:    ghost ? overrideColor : '#1a3344',
    torso:   ghost ? overrideColor : '#0d2233',
    armL:    ghost ? overrideColor : '#0055aa',
    armR:    ghost ? overrideColor : '#005533',
    legL:    ghost ? overrideColor : '#0044cc',
    legR:    ghost ? overrideColor : '#006644',
    head:    ghost ? overrideColor : '#00ffcc',
    joint:   ghost ? overrideColor : '#00ffcc',
    jointL:  ghost ? overrideColor : '#0088ff',
    jointR:  ghost ? overrideColor : '#00ff88',
  };

  const baseAlpha = alpha;

  // ---- BACK LEG (right = farther in side view, draw first) ----
  const hip_r = N('hip_r'), knee_r = N('knee_r'), foot_r = N('foot_r');
  if (hip_r && knee_r) drawLimb(hip_r.x, hip_r.y, knee_r.x, knee_r.y, 7, 5, ghost ? overrideColor : '#003322', baseAlpha * 0.7);
  if (knee_r && foot_r) drawLimb(knee_r.x, knee_r.y, foot_r.x, foot_r.y, 5, 3, ghost ? overrideColor : '#002211', baseAlpha * 0.7);

  // ---- BACK ARM (right = back arm) ----
  const shr = N('shoulder_r'), elr = N('elbow_r'), handr = N('hand_r');
  if (shr && elr) drawLimb(shr.x, shr.y, elr.x, elr.y, 5, 4, ghost ? overrideColor : '#003311', baseAlpha * 0.65);
  if (elr && handr) drawLimb(elr.x, elr.y, handr.x, handr.y, 4, 3, ghost ? overrideColor : '#002200', baseAlpha * 0.65);

  // ---- TORSO ----
  const chest = N('chest'), pelvis = N('pelvis'), bum = N('bum');
  if (chest && pelvis) drawLimb(chest.x, chest.y, pelvis.x, pelvis.y, 14, 11, C.torso, baseAlpha);
  if (pelvis && bum)   drawLimb(pelvis.x, pelvis.y, bum.x, bum.y, 11, 13, C.body, baseAlpha);

  // Neck line
  const neck = N('neck');
  if (chest && neck) drawLimb(neck.x, neck.y, chest.x, chest.y, 5, 7, C.body, baseAlpha);

  // ---- FRONT LEG (left) ----
  const hip_l = N('hip_l'), knee_l = N('knee_l'), foot_l = N('foot_l');
  if (hip_l && knee_l) drawLimb(hip_l.x, hip_l.y, knee_l.x, knee_l.y, 8, 6, C.legL, baseAlpha);
  if (knee_l && foot_l) drawLimb(knee_l.x, knee_l.y, foot_l.x, foot_l.y, 6, 3, C.legL, baseAlpha);

  // ---- FRONT ARM (left) ----
  const shl = N('shoulder_l'), ell = N('elbow_l'), handl = N('hand_l');
  if (shl && ell) drawLimb(shl.x, shl.y, ell.x, ell.y, 6, 5, C.armL, baseAlpha);
  if (ell && handl) drawLimb(ell.x, ell.y, handl.x, handl.y, 5, 3, C.armL, baseAlpha);

  // ---- HEAD ----
  const head = N('head');
  if (head && !ghost) {
    ctx.globalAlpha = baseAlpha;
    // Head circle
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#0d2233';
    ctx.fill();
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye dot
    ctx.beginPath();
    ctx.arc(head.x - 5, head.y - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.fill();

    // Nose nub
    ctx.beginPath();
    ctx.arc(head.x - 18, head.y + 4, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.fill();
  } else if (head && ghost) {
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = overrideColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ---- JOINT DOTS (only on main render, not ghost) ----
  if (!ghost) {
    nodeList.forEach(n => {
      const isSelected = dragNode && dragNode.id === n.id;
      if (n.id === 'head') return; // already drawn

      let jColor = C.joint;
      if (n.id.includes('_l')) jColor = C.jointL;
      else if (n.id.includes('_r')) jColor = C.jointR;

      const r = isSelected ? NODE_RADIUS + 2 : NODE_RADIUS - 2;

      if (isSelected) {
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffcc';
        ctx.fill();
      }

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : jColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Labels
    if (showLabels) {
      nodeList.forEach(n => {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#aabbcc';
        ctx.font = '9px Space Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y - NODE_RADIUS - 4);
      });
    }
  }

  ctx.globalAlpha = 1;
}

// ─── REMOVED CONSTRAINTS ──────────────────────────────────────────────

// ─── WORLD ↔ SCREEN COORDS ────────────────────────────────────────────
function screenToWorld(sx, sy) {
  const w = canvas.width, h = canvas.height;
  const cx = w / 2 + panOffset.x;
  const cy = h / 2 + panOffset.y;
  let dx = (sx - cx) / viewScale;
  let dy = (sy - cy) / viewScale;
  const rad = -viewRotation * Math.PI / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  return { x: rx / charScale, y: ry / charScale };
}

// ─── HIT TEST ─────────────────────────────────────────────────────────
function hitNode(wx, wy) {
  let closest = null, minDist = NODE_RADIUS * 2.5;
  nodes.forEach(n => {
    const d = Math.hypot(n.x - wx, n.y - wy);
    if (d < minDist) { minDist = d; closest = n; }
  });
  return closest;
}

// ─── MOUSE / TOUCH ────────────────────────────────────────────────────
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('mousedown', startInteract);
canvas.addEventListener('touchstart', startInteract, { passive: true });

canvas.addEventListener('mousemove', doInteract);
canvas.addEventListener('touchmove', doInteract, { passive: false });

canvas.addEventListener('mouseup', endInteract);
canvas.addEventListener('touchend', endInteract);
canvas.addEventListener('mouseleave', endInteract);

function startInteract(e) {
  const pos = getPos(e);
  if (mode === 'pan') {
    panStart = { x: pos.x - panOffset.x, y: pos.y - panOffset.y };
    isDragging = true;
    return;
  }
  const w = screenToWorld(pos.x, pos.y);
  dragNode = hitNode(w.x, w.y);
  if (dragNode) {
    isDragging = true;
    updateNodeInfo(dragNode);
  }
}

function doInteract(e) {
  if (e.cancelable) e.preventDefault();
  if (!isDragging) return;
  const pos = getPos(e);
  if (mode === 'pan') {
    panOffset.x = pos.x - panStart.x;
    panOffset.y = pos.y - panStart.y;
    render();
    return;
  }
  if (!dragNode) return;
  const w = screenToWorld(pos.x, pos.y);
  dragNode.x = w.x;
  dragNode.y = w.y;
  updateNodeInfo(dragNode);
  render();
}

function endInteract() {
  if (isDragging && dragNode) {
    saveCurrentToFrame();
    renderThumb(currentFrame);
  }
  isDragging = false;
  dragNode = null;
  panStart = null;
}

function updateNodeInfo(n) {
  document.getElementById('nodeInfo').innerHTML =
    `<b style="color:var(--accent)">${n.label}</b><br>x: ${Math.round(n.x)}&nbsp; y: ${Math.round(n.y)}`;
}

// ─── PLAYBACK ──────────────────────────────────────────────────────────
function play() {
  if (frames.length < 2) return;
  isPlaying = true;
  document.getElementById('playBtn').textContent = '⏹ Stop';
  document.getElementById('playBadge').style.display = '';
  const fps = parseInt(document.getElementById('fpsInput').value) || 12;
  const loop = document.getElementById('loopToggle').checked;
  playInterval = setInterval(() => {
    let next = currentFrame + 1;
    if (next >= frames.length) {
      if (loop) next = 0;
      else { stopPlay(); return; }
    }
    currentFrame = next;
    restoreNodes(frames[currentFrame].nodes);
    updateTimelineUI();
    render();
    updateFrameBadge();
  }, 1000 / fps);
}

function stopPlay() {
  isPlaying = false;
  clearInterval(playInterval);
  document.getElementById('playBtn').textContent = '▶ Play';
  document.getElementById('playBadge').style.display = 'none';
}

// ─── SAVE / LOAD ANIMATIONS ────────────────────────────────────────────
function loadSavedAnimations() {
  try {
    savedAnimations = JSON.parse(localStorage.getItem('poseforge_anims') || '[]');
  } catch(e) { savedAnimations = []; }
  renderSavedList();
}

function saveAnimation(name) {
  saveCurrentToFrame();
  const anim = { name, frames: JSON.parse(JSON.stringify(frames)), created: Date.now() };
  savedAnimations.push(anim);
  localStorage.setItem('poseforge_anims', JSON.stringify(savedAnimations));
  renderSavedList();
}

function deleteAnimation(idx) {
  savedAnimations.splice(idx, 1);
  localStorage.setItem('poseforge_anims', JSON.stringify(savedAnimations));
  renderSavedList();
}

function loadAnimation(idx) {
    stopPlay();
    const anim = savedAnimations[idx];
    frames = JSON.parse(JSON.stringify(anim.frames));
    currentFrame = 0;
    currentAnimName = anim.name; // Track current animation name
    restoreNodes(frames[0].nodes);
    updateTimelineUI();
    render();
    updateFrameBadge();
}

function renderSavedList() {
  const list = document.getElementById('savedAnimList');
  list.innerHTML = '';
  if (savedAnimations.length === 0) {
    list.innerHTML = '<div style="font-size:0.6rem;color:var(--text-dim)">No saved animations yet.</div>';
    return;
  }
  savedAnimations.forEach((a, i) => {
    const item = document.createElement('div');
    item.className = 'anim-item';
    item.innerHTML = `<span class="anim-name" title="${a.name}">${a.name}</span>
      <span style="font-size:0.55rem;color:var(--text-dim)">${a.frames.length}f</span>
      <button class="anim-del" title="Delete">×</button>`;
    item.querySelector('.anim-name').onclick = () => loadAnimation(i);
    item.querySelector('.anim-del').onclick = (e) => { e.stopPropagation(); if(confirm('Delete "'+a.name+'"?')) deleteAnimation(i); };
    list.appendChild(item);
  });
}

// ─── EXPORT / IMPORT ──────────────────────────────────────────────────
function exportJSON() {
    saveCurrentToFrame();
    const data = JSON.stringify({ 
        frames, 
        savedAnimations, 
        currentAnimName, // Include the name of the currently loaded animation
        version: 1 
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    // Use current animation name for filename if available, otherwise default
    const filename = currentAnimName ? `${currentAnimName.replace(/\s+/g, '_')}.json` : 'poseforge_animation.json';
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.frames) {
                frames = data.frames;
                currentFrame = 0;
                restoreNodes(frames[0].nodes);
                updateTimelineUI();
                render();
                updateFrameBadge();
            }
            if (data.savedAnimations) {
                savedAnimations = data.savedAnimations;
                localStorage.setItem('poseforge_anims', JSON.stringify(savedAnimations));
                renderSavedList();
            }
            // Set current animation name if present in imported data
            if (data.currentAnimName !== undefined) {
                currentAnimName = data.currentAnimName;
            } else {
                currentAnimName = null;
            }
        } catch(err) { alert('Invalid file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ─── VIEW CONTROLS ────────────────────────────────────────────────────
document.getElementById('rotateSlider').addEventListener('input', e => {
  viewRotation = parseInt(e.target.value);
  document.getElementById('rotateVal').textContent = viewRotation + '°';
  render();
});

document.getElementById('zoomSlider').addEventListener('input', e => {
  viewScale = parseInt(e.target.value) / 100;
  document.getElementById('zoomVal').textContent = e.target.value + '%';
  render();
});

document.getElementById('resetViewBtn').addEventListener('click', () => {
  viewRotation = 0; viewScale = 1; panOffset = {x:0,y:0};
  document.getElementById('rotateSlider').value = 0;
  document.getElementById('zoomSlider').value = 100;
  document.getElementById('rotateVal').textContent = '0°';
  document.getElementById('zoomVal').textContent = '100%';
  render();
});

document.getElementById('zoomSlider').addEventListener('input', e => {
  viewScale = parseInt(e.target.value) / 100;
  document.getElementById('zoomVal').textContent = e.target.value + '%';
  render();
});

document.getElementById('scaleSlider').addEventListener('input', e => {
  charScale = parseInt(e.target.value) / 100;
  document.getElementById('scaleVal').textContent = e.target.value + '%';
  render();
});

document.getElementById('resetViewBtn').addEventListener('click', () => {
  viewRotation = 0; viewScale = 1; panOffset = {x:0,y:0};
  document.getElementById('rotateSlider').value = 0;
  document.getElementById('zoomSlider').value = 100;
  document.getElementById('rotateVal').textContent = '0°';
  document.getElementById('zoomVal').textContent = '100%';
  render();
});

document.getElementById('resetPoseBtn').addEventListener('click', () => {
  // Reset to default pose for current body type
  nodes = getCurrentNodes();
  frames[currentFrame].nodes = snapshotNodes();
  renderThumb(currentFrame);
  render();
});

document.getElementById('symmetryBtn').addEventListener('click', () => {
  // Mirror left from right based on current body structure
  const pairs = [
    ['shoulder_l','shoulder_r'],['elbow_l','elbow_r'],
    ['hand_l','hand_r'],['hip_l','hip_r'],
    ['knee_l','knee_r'],['foot_l','foot_r']
  ];
  pairs.forEach(([l, r]) => {
    const nl = nodes.find(n => n.id === l);
    const nr = nodes.find(n => n.id === r);
    if (!nl || !nr) return;
    const avg_y = (nl.y + nr.y) / 2;
    const dist = Math.abs(nl.x);
    nl.x = -dist; nr.x = dist;
    nl.y = avg_y; nr.y = avg_y;
  });
  saveCurrentToFrame();
  renderThumb(currentFrame);
  render();
});

document.getElementById('showLabels').addEventListener('change', e => { showLabels = e.target.checked; render(); });
document.getElementById('showGrid').addEventListener('change', e => { showGrid = e.target.checked; render(); });
document.getElementById('showShadow').addEventListener('change', e => { showShadow = e.target.checked; render(); });
document.getElementById('onionToggle').addEventListener('change', e => { onionSkin = e.target.checked; render(); });

document.getElementById('addFrameBtn').addEventListener('click', addFrame);
document.getElementById('dupFrameBtn').addEventListener('click', dupFrame);
document.getElementById('delFrameBtn').addEventListener('click', deleteFrame);

document.getElementById('playBtn').addEventListener('click', () => {
  if (isPlaying) stopPlay(); else play();
});

document.getElementById('prevFrameBtn').addEventListener('click', () => {
  if (!isPlaying) gotoFrame(currentFrame - 1);
});

document.getElementById('nextFrameBtn').addEventListener('click', () => {
  if (!isPlaying) gotoFrame(currentFrame + 1);
});

document.getElementById('modeMove').addEventListener('click', () => {
  mode = 'move';
  document.getElementById('modeMove').classList.add('active');
  document.getElementById('modePan').classList.remove('active');
  canvas.style.cursor = 'crosshair';
});

document.getElementById('modePan').addEventListener('click', () => {
  mode = 'pan';
  document.getElementById('modePan').classList.add('active');
  document.getElementById('modeMove').classList.remove('active');
  canvas.style.cursor = 'grab';
});

// Save modal
document.getElementById('saveAnimBtn').addEventListener('click', () => {
  document.getElementById('animNameInput').value = '';
  document.getElementById('saveModal').classList.add('open');
  setTimeout(() => document.getElementById('animNameInput').focus(), 50);
});

document.getElementById('cancelSaveBtn').addEventListener('click', () => {
  document.getElementById('saveModal').classList.remove('open');
});

document.getElementById('confirmSaveBtn').addEventListener('click', () => {
    const name = document.getElementById('animNameInput').value.trim() || 'Untitled';
    saveAnimation(name);
    currentAnimName = name; // Set current animation name when saved
    document.getElementById('saveModal').classList.remove('open');
});

document.getElementById('animNameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('confirmSaveBtn').click();
  if (e.key === 'Escape') document.getElementById('cancelSaveBtn').click();
});

// Body type selection
document.getElementById('viewPerspectiveSelect').addEventListener('change', async (e) => {
  const bodyType = document.getElementById('bodyTypeSelect').value;
  await loadBody(bodyType);
});

document.getElementById('bodyTypeSelect').addEventListener('change', async (e) => {
  await loadBody(e.target.value);
});

document.getElementById('loadPresetBtn').addEventListener('click', () => {
  const presetName = document.getElementById('animationPresetSelect').value;
  loadAnimationPreset(presetName);
});

document.getElementById('exportBtn').addEventListener('click', exportJSON);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());

// Modal bg click to close
document.getElementById('saveModal').addEventListener('click', e => {
  if (e.target === document.getElementById('saveModal'))
    document.getElementById('saveModal').classList.remove('open');
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft' && !isPlaying) gotoFrame(currentFrame - 1);
  if (e.key === 'ArrowRight' && !isPlaying) gotoFrame(currentFrame + 1);
  if (e.key === ' ') { e.preventDefault(); if (isPlaying) stopPlay(); else play(); }
  if (e.key === 'n' || e.key === 'N') addFrame();
});

// Mouse wheel zoom
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -5 : 5;
  const slider = document.getElementById('zoomSlider');
  slider.value = Math.max(50, Math.min(200, parseInt(slider.value) + delta));
  viewScale = parseInt(slider.value) / 100;
  document.getElementById('zoomVal').textContent = slider.value + '%';
  render();
}, { passive: false });

// ─── BODY LOADING ────────────────────────────────────────────────────
async function loadBody(bodyType) {
  const viewPerspective = document.getElementById('viewPerspectiveSelect').value;
  const fullBodyType = viewPerspective === 'side' ? `${bodyType}-side` : bodyType;

  const bodyData = await loadBodyDefinition(fullBodyType);
  if (bodyData) {
    nodes = getCurrentNodes();
    bones = getCurrentBones();
    constraints = getCurrentConstraints();

    // Reset frames with new skeleton
    frames = [{ nodes: snapshotNodes(), label: 'Frame 1' }];
    currentFrame = 0;

    // Update UI
    updateTimelineUI();
    updateFrameBadge();
    render();

    // Update animation preset options based on body type and perspective
    updateAnimationPresets(bodyType, viewPerspective);

    console.log(`Loaded ${bodyData.name} body`);
  }
}

// ─── ANIMATION PRESETS ────────────────────────────────────────────────
function updateAnimationPresets(bodyType, viewPerspective) {
   const select = document.getElementById('animationPresetSelect');
   const options = select.querySelectorAll('option:not(:first-child)');
   options.forEach(option => {
     const isHuman = bodyType.includes('male') || bodyType.includes('female') || bodyType === 'child';
     const isQuadruped = bodyType === 'quadruped';
     const isFront = viewPerspective === 'front';
     const isSide = viewPerspective === 'side';

     // Check if the option matches the current body type and view perspective
     const isHumanOption = option.value.includes('human') && !option.value.includes('-side');
     const isHumanSideOption = option.value.includes('human') && option.value.includes('-side');
     const isQuadrupedOption = option.value.includes('quadruped') && !option.value.includes('-side');
     const isQuadrupedSideOption = option.value.includes('quadruped') && option.value.includes('-side');

     if ((isHumanOption && !isHuman) || (isHumanSideOption && (!isHuman || !isSide)) ||
         (isQuadrupedOption && !isQuadruped) || (isQuadrupedSideOption && (!isQuadruped || !isSide))) {
       option.style.display = 'none';
     } else {
       option.style.display = 'block';
     }
   });
   select.value = '';
 }

async function loadAnimationPreset(presetName) {
   if (!presetName) return;

   try {
     const response = await fetch(`data/animations/${presetName}.json`);
     const animData = await response.json();

     // Clear current frames
     frames = [];

     // Load frames from preset
     animData.frames.forEach((frameData, index) => {
       frames.push({
         nodes: JSON.parse(JSON.stringify(frameData.nodes)),
         label: frameData.label || `Frame ${index + 1}`
       });
     });

     currentFrame = 0;
     restoreNodes(frames[0].nodes);
     currentAnimName = animData.name; // Set current animation name

     // Update UI
     updateTimelineUI();
     updateFrameBadge();
     render();

     console.log(`Loaded ${animData.name} animation`);

   } catch (error) {
     console.error('Error loading animation preset:', error);
   }
 }

// ─── INIT ─────────────────────────────────────────────────────────────
async function init() {
  // Set CSS variables from config
  const root = document.documentElement;
  Object.entries(Config.THEME).forEach(([key, value]) => {
    const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(cssKey, value);
  });

  resize();
  await loadBody('adult-male'); // Load default body
  updateTimelineUI();
  updateFrameBadge();
  loadSavedAnimations();
  render();
}

init();