import { state } from './core/state.js';
import { render as doRender } from './core/renderer.js';
import * as interaction from './core/interaction.js';
import * as anim from './core/animation.js';
import * as hierarchy from './core/hierarchy.js';
import { saveHistory, undo, redo } from './core/history.js';
import { loadBodyDefinition, getCurrentNodes, getCurrentBones, getCurrentConstraints } from './skeleton.js';
import Config from './config.js';
import { DatabaseManager } from './databaseManager.js';

import * as sidebar from './ui/sidebar.js';
import { syncBoneLengthsFromNodes } from './ui/sidebar.js';
import * as timeline from './ui/timeline.js';
import * as modals from './ui/modals.js';
import * as importExport from './ui/importExport.js';
import { NotificationManager } from './notifications.js';
const notificationManager = new NotificationManager();

/** Shared DatabaseManager instance */
let dbManager = null;

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// ─── HELPERS ───
function screenToWorld(sx, sy) {
  const rect = canvas.getBoundingClientRect();
  const cx = canvas.width / 2 + state.view.panOffset.x;
  const cy = canvas.height / 2 + state.view.panOffset.y;
  return {
    x: (sx - rect.left - cx) / state.view.charScale,
    y: (sy - rect.top - cy) / state.view.charScale
  };
}

function render() {
  doRender(ctx, canvas, state);
}

function resize() {
  const wrap = document.getElementById('canvasWrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

// ─── BODY LOADING ───
async function loadBody(bodyType) {
  const bodyData = await loadBodyDefinition(bodyType);
  if (!bodyData) return;

  state.nodes = getCurrentNodes();
  state.bones = getCurrentBones();
  state.constraints = getCurrentConstraints();
  state.meta.bodyType = bodyType;
  state.meta.height = bodyData.height || 180;
  if (!state.meta.name) state.meta.name = bodyData.name;

  // Compute dynamic hierarchy from bones
  if (state.bones.length > 0) {
    const rootNode = state.nodes.find(n => n.id === 'pelvis') ? 'pelvis' : state.bones[0][0];
    const tree = hierarchy.buildTree(state.bones, rootNode);
    const hierarchyMap = hierarchy.computeAllDescendants(tree.children);
    state.currentHierarchy = hierarchyMap;
    state.currentPelvisChildren = hierarchyMap[rootNode] ? [...hierarchyMap[rootNode]] : [];
    
    // Build dynamic NODE_HIERARCHY from tree.children (parent -> children map)
    state.NODE_HIERARCHY = {};
    Object.keys(tree.children).forEach(parent => {
      state.NODE_HIERARCHY[parent] = tree.children[parent] || [];
    });
    
    const isHuman = ['adult-male', 'adult-female', 'child'].includes(bodyType);
    // Build set of all node IDs that appear as parents (i.e., have children)
    const parentNodeIds = new Set(state.bones.map(bone => bone[0]));
    state.currentFootNodes = state.nodes
      .filter(n => {
        const isFootCandidate = n.id.startsWith('foot') || (n.id.startsWith('hand') && !isHuman) || n.id.includes('paw');
        const isLeaf = !parentNodeIds.has(n.id); // no children
        return isFootCandidate && isLeaf;
      })
      .map(n => n.id);
    state.currentGroundY = hierarchy.calculateGroundY(state.nodes);
  }

  anim.initFrames(state);
  timeline.updateTimeline();
  timeline.updateFrameBadge();
  sidebar.updateAnimationList(bodyType);
  sidebar.updateBoneLengthsUI(state, render);
  saveHistory();
  render();
}

// ─── ANIMATION LOADING ───
async function loadAnimationPreset(presetName) {
  if (!presetName) return;
  try {
    let filePath = presetName;
    if (!filePath.endsWith('.json')) filePath = presetName + '.json';
    if (!filePath.includes('/')) filePath = 'data/animations/' + filePath;
    
    const resp = await fetch(filePath);
    if (!resp.ok) throw new Error('Not found');
    const animData = await resp.json();

    // Load bones & constraints
    if (animData.bones && animData.bones.length > 0) {
      state.bones = animData.bones;
    }
    if (animData.constraints) {
      state.constraints = animData.constraints;
    }

    // Meta
    state.meta.name = animData.name || presetName;
    state.meta.author = animData.author || '';
    state.meta.description = animData.description || '';
    state.meta.height = animData.height || 180;
    state.meta.category = animData.category || 'human';
    state.meta.bodyType = animData.bodyType || state.meta.bodyType;
    state.meta.direction = animData.direction || 'left';

    // Merge node labels from current skeleton
    state.frames = [];
    animData.frames.forEach((frameData, idx) => {
      const animNodes = JSON.parse(JSON.stringify(frameData.nodes));
      const merged = mergeNodeLabels(state.nodes, animNodes);
      state.frames.push({
        nodes: merged,
        label: frameData.label || `Frame ${idx + 1}`
      });
    });

    state.currentFrame = 0;
    state.nodes = JSON.parse(JSON.stringify(state.frames[0].nodes));
    
    // Recompute hierarchy from bones (already in state.bones)
    if (state.bones.length > 0) {
      const rootNode = state.nodes.find(n => n.id === 'pelvis') ? 'pelvis' : state.bones[0][0];
      const tree = hierarchy.buildTree(state.bones, rootNode);
      const hierarchyMap = hierarchy.computeAllDescendants(tree.children);
      state.currentHierarchy = hierarchyMap;
      state.currentPelvisChildren = hierarchyMap[rootNode] || [];
      const isHuman = ['adult-male', 'adult-female', 'child'].includes(state.meta.bodyType);
      const parentNodeIds = new Set(state.bones.map(bone => bone[0]));
      state.currentFootNodes = state.nodes
        .filter(n => {
          const isFootCandidate = n.id.startsWith('foot') || (n.id.startsWith('hand') && !isHuman) || n.id.includes('paw');
          const isLeaf = !parentNodeIds.has(n.id);
          return isFootCandidate && isLeaf;
        })
        .map(n => n.id);
      state.currentGroundY = hierarchy.calculateGroundY(state.nodes);
    }

    timeline.updateTimeline();
    timeline.updateFrameBadge();
    sidebar.updateAnimationList(state.meta.bodyType);
    saveHistory();
    updateDirectionUI();
    render();
  } catch (err) {
    console.error('Error loading animation:', err);
    alert('Failed to load animation');
  }
}

function mergeNodeLabels(sourceNodes, targetNodes) {
  const labelMap = {};
  sourceNodes.forEach(n => { if (n.id && n.label) labelMap[n.id] = n.label; });
  targetNodes.forEach(n => { 
    if (n.id && labelMap[n.id] && !n.label) n.label = labelMap[n.id]; 
  });
  return targetNodes;
}

// ─── FRAME MANAGEMENT ───
function deleteFrame(index) {
  if (state.frames.length <= 1) return;
  state.frames.splice(index, 1);
  if (state.currentFrame >= state.frames.length) {
    state.currentFrame = state.frames.length - 1;
  }
  state.nodes = JSON.parse(JSON.stringify(state.frames[state.currentFrame].nodes));
  timeline.updateTimeline();
  timeline.updateFrameBadge();
  saveHistory();
  render();
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
      if (state.playback.loop) next = 0;
      else { stopPlayback(); return; }
    }
    anim.gotoFrame(state, next);
    timeline.updateFrameBadge();
    render();
  }, interval);
}

function stopPlayback() {
  state.playback.isPlaying = false;
  document.getElementById('playBadge').style.display = 'none';
  document.getElementById('playBtn').textContent = '▶';
  if (state.playback.interval) clearInterval(state.playback.interval);
}

// ─── SAVE / LOAD ANIMATION ───
function saveNewAnimation(data) {
  let constraints = state.constraints;
  if (data.updateDistances && state.nodes.length > 0 && state.bones.length > 0) {
    constraints = {
      ...state.constraints,
      distances: modals.calculateCurrentDistances(state.nodes, state.bones)
    };
  }
  const animData = {
    name: data.name,
    author: data.author,
    description: data.description,
    height: data.height,
    category: data.category,
    bodyType: data.bodyType,
    direction: state.meta.direction || 'left',
    frames: state.frames,
    bones: state.bones,
    constraints: constraints,
    created: Date.now()
  };
  const saved = JSON.parse(localStorage.getItem('poseforge_anims') || '[]');
  saved.push(animData);
  localStorage.setItem('poseforge_anims', JSON.stringify(saved));
  renderSavedList();
}

function editSavedAnimation(index, data) {
  const saved = JSON.parse(localStorage.getItem('poseforge_anims') || '[]');
  if (saved[index]) {
    saved[index].name = data.name;
    saved[index].author = data.author;
    saved[index].description = data.description;
    saved[index].height = data.height;
    saved[index].category = data.category;
    saved[index].bodyType = data.bodyType;
    saved[index].direction = state.meta.direction || 'left';
    if (data.updateDistances && state.nodes.length > 0 && state.bones.length > 0) {
      saved[index].constraints = {
        ...saved[index].constraints,
        distances: modals.calculateCurrentDistances(state.nodes, state.bones)
      };
    }
    localStorage.setItem('poseforge_anims', JSON.stringify(saved));
    renderSavedList();
  }
}

function loadSavedAnimation(index) {
  const saved = JSON.parse(localStorage.getItem('poseforge_anims') || '[]');
  const anim = saved[index];
  if (!anim) return;
  
  state.frames = anim.frames || [];
  state.bones = anim.bones || [];
  state.constraints = anim.constraints || { distances: {}, angles: {} };
  state.meta.name = anim.name;
  state.meta.author = anim.author || '';
  state.meta.description = anim.description || '';
  state.meta.height = anim.height || 180;
  state.meta.category = anim.category || 'human';
  state.meta.bodyType = anim.bodyType || state.meta.bodyType;
  state.meta.direction = anim.direction || 'left';
  
  state.currentFrame = 0;
  if (state.frames.length > 0) {
    state.nodes = JSON.parse(JSON.stringify(state.frames[0].nodes));
  }
  
  // Rebuild hierarchy
  if (state.bones.length > 0) {
    const rootNode = state.nodes.find(n => n.id === 'pelvis') ? 'pelvis' : state.bones[0][0];
    const tree = hierarchy.buildTree(state.bones, rootNode);
    const hierarchyMap = hierarchy.computeAllDescendants(tree.children);
    state.currentHierarchy = hierarchyMap;
    state.currentPelvisChildren = hierarchyMap[rootNode] || [];
    const isHuman = ['adult-male', 'adult-female', 'child'].includes(state.meta.bodyType);
    // Build set of all node IDs that appear as parents (i.e., have children)
    const parentNodeIds = new Set(state.bones.map(bone => bone[0]));
    state.currentFootNodes = state.nodes
      .filter(n => {
        const isFootCandidate = n.id.startsWith('foot') || (n.id.startsWith('hand') && !isHuman) || n.id.includes('paw');
        const isLeaf = !parentNodeIds.has(n.id); // no children
        return isFootCandidate && isLeaf;
      })
      .map(n => n.id);
    state.currentGroundY = hierarchy.calculateGroundY(state.nodes);
  }
  
  timeline.updateTimeline();
  timeline.updateFrameBadge();
  sidebar.updateAnimationList(state.meta.bodyType);
  saveHistory();
  render();
}

function deleteSavedAnimation(index) {
  const saved = JSON.parse(localStorage.getItem('poseforge_anims') || '[]');
  saved.splice(index, 1);
  localStorage.setItem('poseforge_anims', JSON.stringify(saved));
  renderSavedList();
}

function renderSavedList() {
  importExport.renderSavedList();
}

// ─── IMPORT ───
async function importAnimation(file) {
  let text;
  try {
    text = await file.text();
  } catch (e) {
    console.error('File read error:', e);
    notificationManager.error('Import failed: could not read file. Try serving over HTTPS.');
    return;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', e);
    notificationManager.error('Invalid file: could not parse JSON');
    return;
  }
  if (!data || !data.frames) {
    console.error('Invalid file: no frames found', data);
    notificationManager.error('Invalid file: no frames data found');
    return;
  }
  state.frames = data.frames;
  state.currentFrame = 0;
  state.nodes = JSON.parse(JSON.stringify(state.frames[0].nodes));
  if (data.bones) state.bones = data.bones;
  if (data.constraints) state.constraints = data.constraints;
  state.meta.name = data.name || 'Imported';
  state.meta.author = data.author || '';
  state.meta.description = data.description || '';
  state.meta.height = data.height || 180;
  state.meta.category = data.category || 'human';
  state.meta.bodyType = data.bodyType || state.meta.bodyType;
  state.meta.direction = data.direction || 'left';
  if (data.spriteBox) {
    Object.assign(state.spriteBox, data.spriteBox);
    state.view.charScale = state.spriteBox.scale || 1;
  }
  timeline.updateTimeline();
  timeline.updateFrameBadge();
  renderSavedList();
  saveHistory();
  updateDirectionUI();
  render();
  notificationManager.success(`Imported: ${data.name || 'animation'} (${data.frames.length} frames)`);
}

// ─── EXPORT ───
function exportAnimation(format) {
  if (format === 'json') {
    importExport.exportJSON();
  } else if (format === 'sprite') {
    importExport.exportSpriteSheet();
  } else if (format === 'apng') {
    importExport.exportAPNG();
  }
}

// ─── FLIP ───
function flipHorizontal() {
  state.nodes.forEach(n => n.x = -n.x);
  state.frames.forEach(frame => {
    frame.nodes.forEach(n => n.x = -n.x);
  });
  anim.saveFrame(state);
  saveHistory();
  timeline.updateTimeline();
  render();
}

function flipDirection() {
  const frameCount = state.frames.length;
  const msg = `This will flip all ${frameCount} frame(s) to face the opposite direction.\n\nAre you sure you want to continue?`;
  if (!confirm(msg)) return;
  
  state.nodes.forEach(n => n.x = -n.x);
  state.frames.forEach(frame => {
    frame.nodes.forEach(n => n.x = -n.x);
  });
  state.meta.direction = state.meta.direction === 'left' ? 'right' : 'left';
  anim.saveFrame(state);
  saveHistory();
  updateDirectionUI();
  timeline.updateTimeline();
  render();
}

function updateDirectionUI() {
  const btn = document.getElementById('flipDirectionBtn');
  const status = document.getElementById('directionStatus');
  const dir = state.meta.direction || 'left';
  if (btn) {
    btn.textContent = dir === 'left' ? '→ Flip to Right' : '← Flip to Left';
    btn.title = `Facing ${dir}. Click to flip.`;
  }
  if (status) {
    status.textContent = `Facing ${dir}`;
  }
}

function mirrorHorizontal() {
  const pairs = [
    ['shoulder_l','shoulder_r'],['elbow_l','elbow_r'],
    ['hand_l','hand_r'],['hip_l','hip_r'],
    ['knee_l','knee_r'],['foot_l','foot_r']
  ];
  pairs.forEach(([l, r]) => {
    const nl = state.nodes.find(n => n.id === l);
    const nr = state.nodes.find(n => n.id === r);
    if (!nl || !nr) return;
    const avg_y = (nl.y + nr.y) / 2;
    const dist = Math.abs(nl.x);
    nl.x = -dist; nr.x = dist;
    nl.y = avg_y; nr.y = avg_y;
  });
  anim.saveFrame(state);
  saveHistory();
  timeline.updateTimeline();
  render();
}

// ─── KEYBOARD ───
function handleKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
    anim.saveFrame(state);
    render();
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    redo();
    anim.saveFrame(state);
    render();
  } else if (e.key === ' ') {
    e.preventDefault();
    if (state.playback.isPlaying) { callbacks.onPause(); stopPlayback(); }
    else { callbacks.onPlay(); startPlayback(); }
  } else if (e.key === 'ArrowLeft') {
    const prev = Math.max(0, state.currentFrame - 1);
    anim.gotoFrame(state, prev);
    timeline.updateFrameBadge();
    render();
  } else if (e.key === 'ArrowRight') {
    const next = Math.min(state.frames.length - 1, state.currentFrame + 1);
    anim.gotoFrame(state, next);
    timeline.updateFrameBadge();
    render();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteFrame(state.currentFrame);
  } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    modals.openSaveModal(-1);
  }
}

// ─── MOUSE EVENTS ───
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const world = screenToWorld(e.clientX, e.clientY);
  
  if (e.button === 1 || e.altKey || state.interactionMode === 'pan') {
    interaction.startPan(state, screenPos);
    return;
  }
  
  if (state.view.showBoundingBox) {
    const handle = interaction.hitBoxHandle(state, world.x, world.y);
    if (handle) {
      state.dragState.boxDragHandle = handle;
      interaction.startDragBox(state, world);
      state.isDragging = true;
      return;
    }
    if (interaction.hitBoxBody(state, world.x, world.y)) {
      state.dragState.boxDragHandle = 'move';
      interaction.startDragBox(state, world);
      state.isDragging = true;
      return;
    }
  }
  
  const node = interaction.hitNode(state.nodes, world.x, world.y);
  if (node) {
    interaction.startDrag(state, node, world);
    sidebar.updateNodeInfo(node);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (state.dragState.isDraggingBox) {
    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(e.clientX, e.clientY);
    interaction.moveDragBox(state, { x: world.x, y: world.y });
    render();
    return;
  }
  
  if (state.isDragging && state.dragNode) {
    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(e.clientX, e.clientY);
    const dx = world.x - state.dragNode.x;
    const dy = world.y - state.dragNode.y;
    interaction.moveDrag(state, dx, dy);
    syncBoneLengthsFromNodes(state);
    sidebar.updateNodeInfo(state.dragNode);
    render();
  } else if (state.dragState.panStart) {
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left - state.dragState.panStart.x) / state.view.charScale;
    const dy = (e.clientY - rect.top - state.dragState.panStart.y) / state.view.charScale;
    interaction.pan(state, dx, dy);
    state.dragState.panStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    render();
  } else {
    // Show node info on hover
    const world = screenToWorld(e.clientX, e.clientY);
    const hoverNode = interaction.hitNode(state.nodes, world.x, world.y);
    if (hoverNode) {
      sidebar.updateNodeInfo(hoverNode);
    } else if (!state.isDragging) {
      sidebar.updateNodeInfo(null);
    }
  }
});

canvas.addEventListener('mouseup', () => {
  if (state.dragState.isDraggingBox) {
    interaction.endDragBox(state);
    state.isDragging = false;
  } else if (state.isDragging) {
    interaction.endDrag(state);
    anim.saveFrame(state);
    syncBoneLengthsFromNodes(state);
    sidebar.updateNodeInfo(null);
  }
  if (state.dragState.panStart) {
    interaction.endPan(state);
  }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('resize', () => {
  const wrap = document.getElementById('canvasWrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  render();
});

// ─── SETTINGS TABS ────────────────────────────────────────────────────────────
function initSettingsTabs() {
  const tabs   = document.querySelectorAll('.settings-tab');
  const panels = document.querySelectorAll('.settings-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
      // Refresh DB list whenever the user switches to database tab
      if (target === 'database') refreshDatabaseUI();
    });
  });
}

// ─── DATABASE UI ──────────────────────────────────────────────────────────────
function refreshDatabaseUI() {
  if (!dbManager) return;

  const stats   = dbManager.getStats();
  const records = dbManager.loadAll();

  // Status dot & label
  const dot   = document.getElementById('dbStatusDot');
  const label = document.getElementById('dbStatusLabel');
  const badge = document.getElementById('dbStatBadge');
  const count = document.getElementById('dbCountBadge');

  dot.className   = 'db-status-dot online';
  label.textContent = 'Local database ready';
  badge.textContent = `${stats.count} record${stats.count !== 1 ? 's' : ''}`;
  if (count) count.textContent = stats.count;

  // Record list
  const list = document.getElementById('dbRecordList');
  if (!list) return;

  if (records.length === 0) {
    list.innerHTML = '<div class="db-empty">No saved animations yet.</div>';
    return;
  }

  list.innerHTML = records
    .slice()
    .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    .map(rec => {
      const date = new Date(rec.savedAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const frames = rec.frames ? rec.frames.length : 0;
      const autoBadge = rec._autoSave
        ? '<span class="db-record-auto-badge">AUTO</span>'
        : '';
      return `
        <div class="db-record-item" data-id="${rec.id}">
          <div class="db-record-info">
            <div class="db-record-name">${escapeHtml(rec.name)}</div>
            <div class="db-record-meta">${date} · ${frames} frame${frames !== 1 ? 's' : ''}</div>
          </div>
          ${autoBadge}
          <div class="db-record-actions">
            <button class="db-rec-btn load" title="Load animation" data-load="${rec.id}">↩</button>
            <button class="db-rec-btn del"  title="Delete record"  data-del="${rec.id}">✕</button>
          </div>
        </div>`;
    })
    .join('');

  // Wire up the micro-buttons inside the list
  list.querySelectorAll('.db-rec-btn.load').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = dbManager.loadById(btn.dataset.load);
      if (rec) applyDbRecord(rec);
    });
  });
  list.querySelectorAll('.db-rec-btn.del').forEach(btn => {
    btn.addEventListener('click', () => {
      dbManager.delete(btn.dataset.del);
      refreshDatabaseUI();
    });
  });
}

function applyDbRecord(rec) {
  if (!rec) return;
  state.frames      = rec.frames      || [];
  state.bones       = rec.bones       || [];
  state.constraints = rec.constraints || { distances: {}, angles: {} };
  Object.assign(state.meta, rec.meta || {});
  state.currentFrame = 0;
  if (state.frames.length > 0) {
    state.nodes = JSON.parse(JSON.stringify(state.frames[0].nodes));
  }
  // Rebuild hierarchy
  if (state.bones.length > 0) {
    const rootNode = state.nodes.find(n => n.id === 'pelvis') ? 'pelvis' : state.bones[0][0];
    const tree = hierarchy.buildTree(state.bones, rootNode);
    const hierarchyMap = hierarchy.computeAllDescendants(tree.children);
    state.currentHierarchy = hierarchyMap;
    state.currentPelvisChildren = hierarchyMap[rootNode] || [];
    const isHuman = ['adult-male', 'adult-female', 'child'].includes(state.meta.bodyType);
    const parentNodeIds = new Set(state.bones.map(b => b[0]));
    state.currentFootNodes = state.nodes
      .filter(n => {
        const isFootCandidate = n.id.startsWith('foot') || (n.id.startsWith('hand') && !isHuman) || n.id.includes('paw');
        return isFootCandidate && !parentNodeIds.has(n.id);
      })
      .map(n => n.id);
    state.currentGroundY = hierarchy.calculateGroundY(state.nodes);
  }
  timeline.updateTimeline();
  timeline.updateFrameBadge();
  sidebar.updateAnimationList(state.meta.bodyType);
  saveHistory();
  render();
}

function initDatabaseUI() {
  dbManager = new DatabaseManager(() => state);

  // ── Auto-save toggle ──
  const autoToggle   = document.getElementById('dbAutoSaveToggle');
  const intervalSlider = document.getElementById('dbAutoSaveInterval');
  const intervalVal  = document.getElementById('dbAutoSaveIntervalVal');
  const intervalRow  = document.querySelector('.db-autosave-interval');

  // Init from stored settings
  autoToggle.checked     = dbManager.autoSaveEnabled;
  intervalSlider.value   = dbManager.autoSaveInterval;
  intervalVal.textContent = dbManager.autoSaveInterval + 's';
  intervalRow.classList.toggle('disabled', !dbManager.autoSaveEnabled);

  // Start timer if it was enabled before
  if (dbManager.autoSaveEnabled) {
    dbManager.setAutoSave(true, dbManager.autoSaveInterval);
  }

  autoToggle.addEventListener('change', () => {
    dbManager.setAutoSave(autoToggle.checked, parseInt(intervalSlider.value, 10));
    intervalRow.classList.toggle('disabled', !autoToggle.checked);
  });

  intervalSlider.addEventListener('input', () => {
    const v = parseInt(intervalSlider.value, 10);
    intervalVal.textContent = v + 's';
    if (autoToggle.checked) {
      dbManager.setAutoSave(true, v);
    } else {
      // Just persist the value without starting the timer
      dbManager._autoSaveInterval = v;
      dbManager._persistSettings();
    }
  });

  // ── Save Now ──
  document.getElementById('dbSaveNowBtn').addEventListener('click', () => {
    const dot   = document.getElementById('dbStatusDot');
    const label = document.getElementById('dbStatusLabel');
    dot.className = 'db-status-dot saving';
    label.textContent = 'Saving…';
    const rec = dbManager.save(state);
    setTimeout(() => {
      refreshDatabaseUI();
    }, 300);
  });

  // ── Export backup ──
  document.getElementById('dbExportBtn').addEventListener('click', () => {
    const n = dbManager.exportBackup();
    console.log(`[DB] Exported ${n} records`);
  });

  // ── Import backup ──
  document.getElementById('dbImportBtn').addEventListener('click', () => {
    document.getElementById('dbImportFile').click();
  });
  document.getElementById('dbImportFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const n = await dbManager.importBackup(file);
      console.log(`[DB] Imported ${n} records`);
      refreshDatabaseUI();
    } catch (err) {
      console.error('[DB] Import failed', err);
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  });

  // ── Clear All ──
  document.getElementById('dbClearAllBtn').addEventListener('click', () => {
    if (confirm('Delete all saved animations from the local database? This cannot be undone.')) {
      dbManager.deleteAll();
      refreshDatabaseUI();
    }
  });

  // Listen for auto-save events to update UI
  window.addEventListener('db:autosaved', () => refreshDatabaseUI());

  // Initial render
  refreshDatabaseUI();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── INIT ───
async function init() {
  resize();
  
  // Initialize UI modules
  sidebar.initSidebar(state, {
    onBodyChange: async (bodyType) => await loadBody(bodyType),
    onAnimPreset: () => loadAnimationPreset(document.getElementById('animationPresetSelect').value),
    onSave: () => modals.openSaveModal(-1),
    onModeChange: (mode) => { state.interactionMode = mode; },
    onFootAnchorChange: (enabled) => { state.footAnchor = enabled; },
    onRender: render,
    onExport: exportAnimation
  });
  
  timeline.initTimeline(state, {
    onFrameSelect: (i) => { anim.gotoFrame(state, i); timeline.updateFrameBadge(); render(); },
    onAddFrame: () => { anim.addFrame(state); saveHistory(); },
    onDeleteFrame: (i) => deleteFrame(i),
    onDupFrame: () => { anim.dupFrame(state); saveHistory(); },
    onPlay: startPlayback,
    onPause: stopPlayback,
    onFPSChange: (fps) => { state.playback.fps = fps; },
    onLoopToggle: (enabled) => { state.playback.loop = enabled; },
    onOnionToggle: (enabled) => { state.view.onionSkin = enabled; }
  });
  
  modals.initModals(state, {
    onSave: (data, editIndex) => {
      if (editIndex >= 0) editSavedAnimation(editIndex, data);
      else saveNewAnimation(data);
      renderSavedList();
    }
  });
  
  importExport.initImportExport(state, {
    onImport: () => document.getElementById('importFile').click(),
    onImportFile: importAnimation,
    onExport: exportAnimation,
    onLoadSaved: loadSavedAnimation,
    onEditSaved: (i) => modals.openSaveModal(i),
    onDeleteSaved: deleteSavedAnimation
  });
  
  // Header button handlers
  document.getElementById('flipHBtn').addEventListener('click', flipHorizontal);
  document.getElementById('flipDirectionBtn').addEventListener('click', flipDirection);
  document.getElementById('symmetryBtn').addEventListener('click', mirrorHorizontal);
  document.getElementById('undoBtn').addEventListener('click', () => {
    undo();
    anim.saveFrame(state);
    render();
  });
  document.getElementById('redoBtn').addEventListener('click', () => {
    redo();
    anim.saveFrame(state);
    render();
  });
  document.getElementById('resetPoseBtn').addEventListener('click', async () => {
    const bodyType = state.meta.bodyType;
    await loadBody(bodyType);
  });
  
  // Display toggles
  document.getElementById('displayBoundingBox').addEventListener('change', (e) => {
    state.view.showBoundingBox = e.target.checked;
    render();
  });
  
  // Settings color inputs
  document.getElementById('armLColor').addEventListener('input', (e) => {
    state.charColors.armL = e.target.value;
    render();
  });
  document.getElementById('armRColor').addEventListener('input', (e) => {
    state.charColors.armR = e.target.value;
    render();
  });
  document.getElementById('legLColor').addEventListener('input', (e) => {
    state.charColors.legL = e.target.value;
    render();
  });
  document.getElementById('legRColor').addEventListener('input', (e) => {
    state.charColors.legR = e.target.value;
    render();
  });
  document.getElementById('bodyColor').addEventListener('input', (e) => {
    state.charColors.body = e.target.value;
    render();
  });

  // Settings tabs
  initSettingsTabs();

  // Database UI
  initDatabaseUI();
  
  // Load default body
  const defaultBody = Object.keys(Config.BODIES)[0];
  await loadBody(defaultBody);
  document.getElementById('bodyTypeSelect').value = defaultBody;
  renderSavedList();
  
  // History setup
  saveHistory();
  updateDirectionUI();
  
  // Start loop
  requestAnimationFrame(render);
}

init();
