/**
 * History Manager
 * 
 * Manages undo/redo for node pose changes
 */

class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.nodesGetter = null;
        this.nodesSetter = null;
    }

    setNodeHandlers(getter, setter) {
        this.nodesGetter = getter;
        this.nodesSetter = setter;
    }

    saveState() {
        if (!this.nodesGetter) return;
        
        const currentNodes = this.nodesGetter();
        const snapshot = JSON.parse(JSON.stringify(currentNodes));

        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push(snapshot);
        this.currentIndex++;

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.updateButtons();
    }

    undo() {
        if (!this.canUndo() || !this.nodesGetter || !this.nodesSetter) return false;
        
        this.currentIndex--;
        const snapshot = this.history[this.currentIndex];
        this.nodesSetter(JSON.parse(JSON.stringify(snapshot)));
        
        this.updateButtons();
        return true;
    }

    redo() {
        if (!this.canRedo() || !this.nodesGetter || !this.nodesSetter) return false;
        
        this.currentIndex++;
        const snapshot = this.history[this.currentIndex];
        this.nodesSetter(JSON.parse(JSON.stringify(snapshot)));
        
        this.updateButtons();
        return true;
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateButtons();
    }

    updateButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.style.opacity = this.canUndo() ? '1' : '0.4';
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.style.opacity = this.canRedo() ? '1' : '0.4';
        }
    }
}

export { HistoryManager };