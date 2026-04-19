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
