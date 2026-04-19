import { state } from '../core/state.js';

let callbacks = null;

export function initImportExport(state, cb) {
  callbacks = cb;
  
  // Import button
  document.getElementById('importBtn').addEventListener('click', () => {
    callbacks.onImport();
  });

  // File input change
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      callbacks.onImportFile(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  const exportDropdown = document.querySelector('.export-dropdown');

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });

  // Export options
  document.querySelectorAll('.export-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format');
      callbacks.onExport(format);
      exportMenu.classList.remove('open');
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (exportDropdown && !exportDropdown.contains(e.target)) {
      exportMenu.classList.remove('open');
    }
  });
}

export function renderSavedList() {
  const list = document.getElementById('savedAnimList');
  if (!list) return;
  list.innerHTML = '';
  
  const saved = JSON.parse(localStorage.getItem('poseforge_anims') || '[]');
  if (saved.length === 0) {
    list.innerHTML = '<div class="empty-state">No saved animations yet</div>';
    return;
  }
  
  saved.forEach((anim, index) => {
    const item = document.createElement('div');
    item.className = 'sa-item';
    item.innerHTML = `
      <div class="sa-info">
        <span class="sa-name">${anim.name || 'Untitled'}</span>
        <span class="sa-meta">${anim.author || 'Unknown'} · ${anim.frames?.length || 0} frames</span>
      </div>
      <div class="sa-actions">
        <button class="sa-btn sa-edit edit" title="Edit">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="sa-btn sa-del delete" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    `;
    
    item.onclick = () => callbacks.onLoadSaved(index);
    item.querySelector('.edit').onclick = (e) => { e.stopPropagation(); callbacks.onEditSaved(index); };
    item.querySelector('.delete').onclick = (e) => { e.stopPropagation(); callbacks.onDeleteSaved(index); };
    list.appendChild(item);
  });
}

export function exportJSON() {
  const data = {
    name: state.meta.name || 'Untitled',
    author: state.meta.author || '',
    description: state.meta.description || '',
    category: state.meta.category || 'human',
    bodyType: state.meta.bodyType || 'adult-male',
    height: state.meta.height || 180,
    frames: state.frames,
    bones: state.bones,
    constraints: state.constraints,
    savedAnimations: JSON.parse(localStorage.getItem('poseforge_anims') || '[]'),
    spriteBox: state.spriteBox
  };
  downloadJSON(JSON.stringify(data, null, 2), (state.meta.name || 'animation').replace(/\s+/g, '_') + '.json');
}

export function exportPNG() {
  // Would render canvas to PNG - placeholder
  alert('PNG export not yet implemented in refactored version');
}

export function exportSpriteSheet() {
  const canvas = document.getElementById('mainCanvas');
  if (!canvas) return;
  
  const frameCount = state.frames.length;
  if (frameCount === 0) return;
  
  const frameSize = state.spriteBox.width || 375;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = frameSize * frameCount;
  exportCanvas.height = frameSize;
  const ctx = exportCanvas.getContext('2d');
  
  // Store current state
  const originalNodes = JSON.parse(JSON.stringify(state.nodes));
  const originalFrame = state.currentFrame;
  
  // Render each frame
  state.frames.forEach((frame, i) => {
    state.nodes = frame.nodes;
    
    // Clear frame area
    ctx.clearRect(i * frameSize, 0, frameSize, frameSize);
    
    // Draw skeleton
    ctx.save();
    ctx.translate(i * frameSize + frameSize / 2, frameSize / 2);
    ctx.scale(state.view.charScale, state.view.charScale);
    
    // Draw bones
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    state.bones.forEach(([parentId, childId]) => {
      const parent = state.nodes.find(n => n.id === parentId);
      const child = state.nodes.find(n => n.id === childId);
      if (parent && child) {
        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        ctx.lineTo(child.x, child.y);
        ctx.stroke();
      }
    });
    
    // Draw nodes
    ctx.fillStyle = '#00ffcc';
    state.nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  });
  
  // Restore state
  state.nodes = originalNodes;
  state.currentFrame = originalFrame;
  
  // Download
  const link = document.createElement('a');
  link.download = (state.meta.name || 'spritesheet') + '.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}

export function exportAPNG() {
  // For APNG export, we'd need a library like UPNG.js which is already loaded
  // This is a placeholder - full APNG requires frame timing data
  alert('APNG export requires additional implementation. Use Sprite Sheet for PNG export.');
}

function downloadJSON(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
