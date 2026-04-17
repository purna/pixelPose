/**
 * History Manager
 * 
 * Manages undo/redo for node pose changes and bounding box state
 */

class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.nodesGetter = null;
        this.nodesSetter = null;
        this.boxStateGetter = null;
        this.boxStateSetter = null;
    }

    setNodeHandlers(getter, setter) {
        this.nodesGetter = getter;
        this.nodesSetter = setter;
    }

    setBoxHandlers(getter, setter) {
        this.boxStateGetter = getter;
        this.boxStateSetter = setter;
    }

    saveState() {
        const state = {};
        
        if (this.nodesGetter) {
            const currentNodes = this.nodesGetter();
            state.nodes = JSON.parse(JSON.stringify(currentNodes));
        }
        
        if (this.boxStateGetter) {
            state.box = this.boxStateGetter();
        }

        if (!state.nodes && !state.box) return;

        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push(state);
        this.currentIndex++;

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.updateButtons();
    }

    undo() {
        if (!this.canUndo()) return false;
        
        this.currentIndex--;
        const state = this.history[this.currentIndex];
        
        if (state) {
            if (this.nodesSetter && state.nodes) {
                this.nodesSetter(JSON.parse(JSON.stringify(state.nodes)));
            }
            if (this.boxStateSetter && state.box) {
                this.boxStateSetter(state.box);
            }
        }
        
        this.updateButtons();
        return true;
    }

    redo() {
        if (!this.canRedo()) return false;
        
        this.currentIndex++;
        const state = this.history[this.currentIndex];
        
        if (state) {
            if (this.nodesSetter && state.nodes) {
                this.nodesSetter(JSON.parse(JSON.stringify(state.nodes)));
            }
            if (this.boxStateSetter && state.box) {
                this.boxStateSetter(state.box);
            }
        }
        
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