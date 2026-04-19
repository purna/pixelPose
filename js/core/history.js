import { HistoryManager } from '../historyManager.js';
import { state } from './state.js';

const historyManager = new HistoryManager();

// Set handlers for nodes
historyManager.setNodeHandlers(
  () => state.nodes,
  (newNodes) => { state.nodes = newNodes; }
);

// Set handlers for sprite box
historyManager.setBoxHandlers(
  () => ({
    x: state.spriteBox.x,
    y: state.spriteBox.y,
    width: state.spriteBox.width,
    height: state.spriteBox.height,
    scale: state.view.charScale
  }),
  (box) => {
    state.spriteBox.x = box.x;
    state.spriteBox.y = box.y;
    state.spriteBox.width = box.width;
    state.spriteBox.height = box.height;
    state.view.charScale = box.scale || 1;
  }
);

export function saveHistory() {
  historyManager.saveState();
}

export function undo() {
  historyManager.undo();
}

export function redo() {
  historyManager.redo();
}

export function canUndo() {
  return historyManager.currentIndex > 0;
}

export function canRedo() {
  return historyManager.currentIndex < historyManager.history.length - 1;
}
