/**
 * databaseManager.js — Save / load PixelPose animations to a persistent store.
 *
 * Strategy:
 *  • Primary: localStorage (always available, no credentials needed)
 *  • Auto-save: timer-based, fires every N seconds when enabled
 *
 * The module exports a single DatabaseManager class.
 */

import Config from './config.js';

const STORAGE_KEY = `${Config.DATABASE.LOCAL_STORAGE_PREFIX}animations`;
const SETTINGS_KEY = `${Config.DATABASE.LOCAL_STORAGE_PREFIX}db_settings`;

export class DatabaseManager {
    /**
     * @param {object} app  The PixelPose state object (state from core/state.js)
     *                      Passed so save() can snapshot the current working state.
     */
    constructor(getState) {
        this._getState = getState;      // () => state
        this._autoSaveTimer = null;
        this._autoSaveInterval = 30;    // seconds – overridden by stored settings
        this._autoSaveEnabled = false;

        this._loadSettings();
    }

    // ─── SETTINGS ────────────────────────────────────────────────────────────

    _loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                this._autoSaveEnabled  = !!s.autoSaveEnabled;
                this._autoSaveInterval = parseInt(s.autoSaveInterval, 10) || 30;
            }
        } catch {
            // ignore corrupt settings
        }
    }

    _persistSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            autoSaveEnabled:  this._autoSaveEnabled,
            autoSaveInterval: this._autoSaveInterval
        }));
    }

    // ─── AUTO-SAVE ───────────────────────────────────────────────────────────

    /** Enable or disable auto-save. */
    setAutoSave(enabled, intervalSeconds) {
        this._autoSaveEnabled = !!enabled;
        if (intervalSeconds !== undefined) {
            this._autoSaveInterval = Math.max(5, parseInt(intervalSeconds, 10) || 30);
        }
        this._persistSettings();
        this._restartTimer();
    }

    get autoSaveEnabled()  { return this._autoSaveEnabled; }
    get autoSaveInterval() { return this._autoSaveInterval; }

    _restartTimer() {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
        if (this._autoSaveEnabled) {
            this._autoSaveTimer = setInterval(() => {
                const state = this._getState();
                if (state && state.frames && state.frames.length > 0) {
                    this._autoSaveSnapshot(state);
                }
            }, this._autoSaveInterval * 1000);
        }
    }

    _autoSaveSnapshot(state) {
        const name = (state.meta && state.meta.name) || 'Auto-save';
        const record = this._buildRecord(state, name + ' (auto)');
        record._autoSave = true;
        this._upsertRecord(record, /* isAutoSave */ true);
        console.log('[DB] Auto-saved:', record.name, new Date().toLocaleTimeString());
        this._dispatchEvent('db:autosaved', { record });
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    /**
     * Save current animation state manually.
     * @param {string} [name]  Optional override for the animation name.
     * @returns {object} The saved record.
     */
    save(state, name) {
        const record = this._buildRecord(state, name);
        this._upsertRecord(record, false);
        this._dispatchEvent('db:saved', { record });
        return record;
    }

    /**
     * Load all saved animations.
     * @returns {object[]}
     */
    loadAll() {
        return this._readAll();
    }

    /**
     * Load a single animation by id.
     * @param {string} id
     * @returns {object|null}
     */
    loadById(id) {
        return this._readAll().find(r => r.id === id) || null;
    }

    /**
     * Delete a saved animation by id.
     * @param {string} id
     * @returns {boolean}
     */
    delete(id) {
        const all = this._readAll().filter(r => r.id !== id);
        this._writeAll(all);
        this._dispatchEvent('db:deleted', { id });
        return true;
    }

    /**
     * Delete all saved animations.
     */
    deleteAll() {
        this._writeAll([]);
        this._dispatchEvent('db:cleared', {});
    }

    // ─── EXPORT / IMPORT ─────────────────────────────────────────────────────

    /**
     * Export all records to a JSON backup file download.
     */
    exportBackup() {
        const all = this._readAll();
        const blob = new Blob([JSON.stringify({ version: Config.VERSION, records: all }, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelpose-db-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return all.length;
    }

    /**
     * Import records from a backup JSON file object.
     * @param {File} file
     * @returns {Promise<number>} Number of records imported.
     */
    async importBackup(file) {
        const text = await file.text();
        const data = JSON.parse(text);
        const incoming = Array.isArray(data.records) ? data.records : (Array.isArray(data) ? data : []);
        if (incoming.length === 0) throw new Error('No valid records found in backup file.');
        const existing = this._readAll();
        const merged = [...existing];
        for (const rec of incoming) {
            const idx = merged.findIndex(r => r.id === rec.id);
            if (idx >= 0) merged[idx] = rec;
            else merged.push(rec);
        }
        this._writeAll(merged);
        this._dispatchEvent('db:imported', { count: incoming.length });
        return incoming.length;
    }

    // ─── STATS ───────────────────────────────────────────────────────────────

    getStats() {
        const all = this._readAll();
        return {
            count:    all.length,
            autoOnly: all.filter(r => r._autoSave).length,
            manual:   all.filter(r => !r._autoSave).length
        };
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    _buildRecord(state, nameOverride) {
        const name = nameOverride || (state.meta && state.meta.name) || 'Untitled';
        return {
            id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            savedAt:   new Date().toISOString(),
            meta:      { ...(state.meta || {}) },
            frames:    JSON.parse(JSON.stringify(state.frames || [])),
            bones:     JSON.parse(JSON.stringify(state.bones || [])),
            constraints: JSON.parse(JSON.stringify(state.constraints || {})),
            _autoSave: false
        };
    }

    _upsertRecord(record, isAutoSave) {
        const all = this._readAll();
        if (isAutoSave) {
            // Keep only the latest auto-save (replace existing auto-save for the same animation name)
            const autoIdx = all.findIndex(r => r._autoSave && r.name === record.name);
            if (autoIdx >= 0) { all[autoIdx] = record; }
            else { all.push(record); }
        } else {
            all.push(record);
        }
        this._writeAll(all);
    }

    _readAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    _writeAll(records) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    _dispatchEvent(type, detail) {
        window.dispatchEvent(new CustomEvent(type, { detail }));
    }
}