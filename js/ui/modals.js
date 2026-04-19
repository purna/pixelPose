import { state } from '../core/state.js';

let callbacks = null;
let editingIndex = -1;

export function initModals(state, cb) {
  callbacks = cb;

  // Save modal - open
  document.getElementById('saveAnimBtn').addEventListener('click', () => {
    openSaveModal(-1);
  });

  // Add input listeners for char count
  document.getElementById('animNameInput').addEventListener('input', () => updateCharCount('animNameInput', 64));
  document.getElementById('animAuthorInput').addEventListener('input', () => updateCharCount('animAuthorInput', 32));
  document.getElementById('animDescInput').addEventListener('input', () => updateCharCount('animDescInput', 200));

  // Save modal - confirm
  document.getElementById('confirmSaveBtn').addEventListener('click', () => {
    const data = getSaveFormData();
    callbacks.onSave(data, editingIndex);
    closeSaveModal();
  });

  // Save modal - cancel
  document.getElementById('cancelSaveBtn').addEventListener('click', () => {
    closeSaveModal();
  });

  // Settings modal - close
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('open');
  });
}

export function openSaveModal(editIndex = -1) {
  editingIndex = editIndex;
  const modal = document.getElementById('saveModal');
  const title = document.getElementById('saveModalTitle');
  
  if (editIndex >= 0) {
    // Edit existing saved animation
    title.textContent = '✏️ Edit Animation';
    const anim = JSON.parse(localStorage.getItem('poseforge_anims') || '[]')[editIndex];
    if (anim) {
      document.getElementById('animNameInput').value = anim.name || '';
      document.getElementById('animAuthorInput').value = anim.author || '';
      document.getElementById('animDescInput').value = anim.description || '';
      document.getElementById('animHeightInput').value = anim.height || 180;
      document.getElementById('animCategorySelect').value = anim.category || 'human';
      document.getElementById('animBodyTypeSelect').value = anim.bodyType || 'adult-male';
    }
  } else {
    // New save
    title.textContent = '💾 Save Animation';
    document.getElementById('animNameInput').value = state.meta.name || '';
    document.getElementById('animAuthorInput').value = state.meta.author || '';
    document.getElementById('animDescInput').value = state.meta.description || '';
    document.getElementById('animHeightInput').value = state.meta.height || 180;
    document.getElementById('animCategorySelect').value = state.meta.category || 'human';
    document.getElementById('animBodyTypeSelect').value = state.meta.bodyType || 'adult-male';
  }
  
  // Update char counts
  updateCharCount('animNameInput', 64);
  updateCharCount('animAuthorInput', 32);
  updateCharCount('animDescInput', 200);
  
  modal.classList.add('open');
  setTimeout(() => document.getElementById('animNameInput').focus(), 50);
}

export function closeSaveModal() {
  document.getElementById('saveModal').classList.remove('open');
  editingIndex = -1;
  document.getElementById('saveModalTitle').textContent = '💾 Save Animation';
}

export function getSaveFormData() {
  return {
    name: document.getElementById('animNameInput').value.trim() || 'Untitled',
    author: document.getElementById('animAuthorInput').value.trim(),
    description: document.getElementById('animDescInput').value.trim(),
    height: parseInt(document.getElementById('animHeightInput').value) || 180,
    category: document.getElementById('animCategorySelect').value,
    bodyType: document.getElementById('animBodyTypeSelect').value
  };
}

function updateCharCount(inputId, max) {
  const input = document.getElementById(inputId);
  const countSpan = input.parentElement.querySelector('.char-count');
  if (countSpan) {
    countSpan.textContent = `${input.value.length}/${max}`;
  }
}
