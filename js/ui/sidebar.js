import { state } from '../core/state.js';
import Config from '../config.js';

export function initSidebar(state, callbacks) {
  // Body type select
  const bodySelect = document.getElementById('bodyTypeSelect');
  bodySelect.addEventListener('change', async (e) => {
    callbacks.onBodyChange(e.target.value);
  });

  // Animation preset select + button
  const animSelect = document.getElementById('animationPresetSelect');
  document.getElementById('loadPresetBtn').addEventListener('click', () => {
    callbacks.onAnimPreset(animSelect.value);
  });

  // Tool mode buttons
  document.getElementById('modeMove').addEventListener('click', () => {
    callbacks.onModeChange('move');
    setActiveTool('modeMove');
  });
  document.getElementById('modePan').addEventListener('click', () => {
    callbacks.onModeChange('pan');
    setActiveTool('modePan');
  });

  document.getElementById('ikToggle').addEventListener('change', (e) => {
    state.useIK = e.target.checked;
  });

  document.getElementById('lockLengthsToggle').addEventListener('change', (e) => {
    state.lockLimbLengths = e.target.checked;
  });

  // Render helper
  function render() {
    if (callbacks.onRender) callbacks.onRender();
  }

  // Scale slider
  const scaleSlider = document.getElementById('scaleSlider');
  scaleSlider.addEventListener('input', (e) => {
    const scale = e.target.value / 100;
    state.view.charScale = scale;
    document.getElementById('scaleVal').textContent = e.target.value + '%';
    render();
  });

  // Toggles
  document.getElementById('footAnchor').addEventListener('change', (e) => {
    state.footAnchor = e.target.checked;
    if (state.footAnchor) {
      let feet = state.currentFootNodes
        .map(fid => state.nodes.find(n => n.id === fid))
        .filter(Boolean);
      if (feet.length === 0) {
        feet = state.nodes.filter(n => n.id.startsWith('foot'));
      }
      if (feet.length > 0) {
        state.currentGroundY = Math.max(...feet.map(f => f.y));
        state.currentFootNodes = feet.map(f => f.id);
        feet.forEach(f => f.y = state.currentGroundY);
      }
      callbacks.onRender();
    }
    callbacks.onFootAnchorChange(e.target.checked);
  });

  document.getElementById('showLabels').addEventListener('change', (e) => {
    state.view.showLabels = e.target.checked;
    render();
  });

  document.getElementById('showDistances').addEventListener('change', (e) => {
    state.view.showDistances = e.target.checked;
    render();
  });

  document.getElementById('showGrid').addEventListener('change', (e) => {
    state.view.showGrid = e.target.checked;
    render();
  });

  document.getElementById('displayBoundingBox').addEventListener('change', (e) => {
    state.view.showBoundingBox = e.target.checked;
    render();
  });

  document.getElementById('showShadow').addEventListener('change', (e) => {
    state.view.showShadow = e.target.checked;
    render();
  });

  document.getElementById('showSpritesToggle').addEventListener('change', (e) => {
    state.view.showSprites = e.target.checked;
    render();
  });

  // Sync checkboxes with initial state values (skip disabled spriteMode)
  document.getElementById('showGrid').checked = state.view.showGrid;
  document.getElementById('showLabels').checked = state.view.showLabels;
  document.getElementById('showDistances').checked = state.view.showDistances;
  document.getElementById('showShadow').checked = state.view.showShadow;
  document.getElementById('displayBoundingBox').checked = state.view.showBoundingBox;
  document.getElementById('showSpritesToggle').checked = state.view.showSprites;

  // Sprite frame size
  document.getElementById('spriteFrameSize').addEventListener('input', (e) => {
    const size = parseInt(e.target.value);
    state.spriteBox.width = size;
    state.spriteBox.height = size;
    document.getElementById('spriteFrameSizeVal').textContent = size;
  });

  // Background color + transparency
  document.getElementById('spriteBgColor').addEventListener('input', (e) => {
    // Would affect export, not rendering
  });
  document.getElementById('spriteBgTransparent').addEventListener('change', (e) => {
    // Would affect export
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('open');
  });

  // Close settings
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('open');
  });

  // Save animation button
  document.getElementById('saveAnimBtn').addEventListener('click', () => {
    callbacks.onSave();
  });
}

function setActiveTool(toolId) {
  document.querySelectorAll('.tool-btn, .float-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(toolId).classList.add('active');
}

export function updateAnimationList(bodyType) {
  const animSelect = document.getElementById('animationPresetSelect');
  const animations = Config.ANIMATIONS[bodyType] || [];
  
  animSelect.innerHTML = '<option value="">Select Animation...</option>';
  animations.forEach(file => {
    const name = file.replace('.json', '').replace('data/animations/', '').replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const opt = document.createElement('option');
    opt.value = file;
    opt.textContent = name;
    animSelect.appendChild(opt);
  });
}

export function updateNodeInfo(node) {
  const infoDiv = document.getElementById('nodeInfo');
  if (!node) {
    infoDiv.innerHTML = 'No node selected.<br>Click &amp; drag a node to pose.';
    return;
  }
  infoDiv.innerHTML = `
    <strong>${node.label || node.id}</strong><br>
    X: ${Math.round(node.x)}<br>
    Y: ${Math.round(node.y)}
  `;
}

export async function updateBoneLengthsUI(state, renderFn) {
  const container = document.getElementById('boneLengthsContainer');
  if (!container) return;
  
  const distances = state.constraints?.distances || {};
  const bones = state.bones || [];
  
  if (bones.length === 0) {
    container.innerHTML = '<p class="dim">No bones loaded</p>';
    return;
  }
  
  container.innerHTML = '';
  
  const { solveIK } = await import('../core/kinematics.js');
  
  bones.forEach(([nodeA, nodeB]) => {
    const key = `${nodeA}-${nodeB}`;
    const keyRev = `${nodeB}-${nodeA}`;
    const length = distances[key] || distances[keyRev];
    if (length === undefined) return;
    
    const item = document.createElement('div');
    item.className = 'bone-length-item';
    item.dataset.boneKey = key;
    item.innerHTML = `
      <label title="${nodeA} → ${nodeB}">${nodeA.slice(0,6)}-${nodeB.slice(0,6)}</label>
      <input type="range" min="10" max="200" value="${Math.round(length)}" data-bone="${key}">
      <input type="number" min="10" max="200" value="${Math.round(length)}" data-bone="${key}">
    `;
    
    const rangeInput = item.querySelector('input[type="range"]');
    const numberInput = item.querySelector('input[type="number"]');
    
    const updateConstraint = (value) => {
      const v = parseFloat(value);
      if (isNaN(v) || v < 10 || v > 200) return;
      state.constraints.distances[key] = v;
      state.constraints.distances[keyRev] = v;
      solveIK(state);
      if (renderFn) renderFn();
    };
    
    rangeInput.addEventListener('input', (e) => {
      numberInput.value = e.target.value;
      updateConstraint(e.target.value);
    });
    
    numberInput.addEventListener('change', (e) => {
      rangeInput.value = e.target.value;
      updateConstraint(e.target.value);
    });
    
    container.appendChild(item);
  });
}

export function syncBoneLengthsFromNodes(state) {
  const container = document.getElementById('boneLengthsContainer');
  if (!container) return;
  
  const items = container.querySelectorAll('.bone-length-item');
  items.forEach(item => {
    const key = item.dataset.boneKey;
    const nodeA = key.split('-')[0];
    const nodeB = key.split('-')[1];
    const nodeObjA = state.nodes.find(n => n.id === nodeA);
    const nodeObjB = state.nodes.find(n => n.id === nodeB);
    if (!nodeObjA || !nodeObjB) return;
    
    const actualLength = Math.hypot(nodeObjB.x - nodeObjA.x, nodeObjB.y - nodeObjA.y);
    if (actualLength < 5) return;
    
    const rangeInput = item.querySelector('input[type="range"]');
    const numberInput = item.querySelector('input[type="number"]');
    if (rangeInput && numberInput) {
      rangeInput.value = Math.round(actualLength);
      numberInput.value = Math.round(actualLength);
    }
  });
}
