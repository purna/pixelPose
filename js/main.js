/**
 * main.js - Main application logic for Pixel Pose
 */

class QRCodeGenerator {
    constructor() {
        this.currentQRCode = null;
        this.databaseManager = new DatabaseManager(this);
        this.exportManager = new ExportManager(this);
        this.savedCodes = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedCodes();
        this.updateDatabaseStatus();

        // Show welcome notification
        notificationManager.success('Pixel Pose ready!');
    }

    bindEvents() {
        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateQRCode();
        });

        // Download button
        document.getElementById('download-btn').addEventListener('click', () => {
            this.exportManager.downloadQRCode();
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveQRCode();
        });

        // Connect GitHub button
        document.getElementById('connect-github-btn').addEventListener('click', () => {
            this.connectToDatabase();
        });

        // Load all button
        document.getElementById('load-all-btn').addEventListener('click', () => {
            this.loadAllFromDatabase();
        });

        // Sync button
        document.getElementById('sync-btn').addEventListener('click', () => {
            this.syncCurrentCode();
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportManager.exportQRCode();
        });

        // Auto-generate on input change (with debounce)
        let generateTimeout;
        document.getElementById('content-input').addEventListener('input', () => {
            clearTimeout(generateTimeout);
            generateTimeout = setTimeout(() => {
                if (document.getElementById('content-input').value.trim()) {
                    this.generateQRCode();
                }
            }, 500);
        });

        // Settings panel toggle
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.toggleSettingsPanel();
        });
    }

    generateQRCode() {
        const content = document.getElementById('content-input').value.trim();

        if (!content) {
            notificationManager.error('Please enter text or URL to generate QR code');
            return;
        }

        const size = parseInt(document.getElementById('size-select').value);
        const errorCorrection = document.getElementById('error-correction-select').value;
        const foregroundColor = document.getElementById('foreground-color').value;
        const backgroundColor = document.getElementById('background-color').value;

        try {
            // Show loading state
            this.showLoadingState(true);

            // Generate QR code using qrcode-generator library
            const qr = qrcode(0, errorCorrection);
            qr.addData(content);
            qr.make();

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const cellSize = size / qr.getModuleCount();
            const margin = parseInt(Config.QR_CODE.DEFAULT_MARGIN) * cellSize;

            canvas.width = size + (margin * 2);
            canvas.height = size + (margin * 2);

            // Fill background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR code modules
            ctx.fillStyle = foregroundColor;
            for (let row = 0; row < qr.getModuleCount(); row++) {
                for (let col = 0; col < qr.getModuleCount(); col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(
                            Math.round(col * cellSize) + margin,
                            Math.round(row * cellSize) + margin,
                            Math.ceil(cellSize),
                            Math.ceil(cellSize)
                        );
                    }
                }
            }

            // Update preview
            this.updatePreview(canvas);

            // Store current QR code data
            this.currentQRCode = {
                content: content,
                size: size,
                errorCorrection: errorCorrection,
                foregroundColor: foregroundColor,
                backgroundColor: backgroundColor,
                canvas: canvas,
                qr: qr, // Store QR code object for SVG generation
                timestamp: new Date().toISOString()
            };

            // Enable action buttons
            this.toggleActionButtons(true);

            notificationManager.success('QR code generated successfully!');

        } catch (error) {
            console.error('Error generating QR code:', error);
            notificationManager.error('Error generating QR code: ' + error.message);
        } finally {
            this.showLoadingState(false);
        }
    }

    updatePreview(canvas) {
        const preview = document.getElementById('qr-preview');
        preview.innerHTML = '';
        preview.appendChild(canvas);
    }

    toggleActionButtons(enabled) {
        const buttons = ['download-btn', 'save-btn', 'export-btn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = !enabled;
                if (enabled) {
                    btn.classList.remove('btn-secondary');
                } else {
                    btn.classList.add('btn-secondary');
                }
            }
        });
    }

    showLoadingState(loading) {
        const generateBtn = document.getElementById('generate-btn');
        if (loading) {
            generateBtn.innerHTML = '<div class="spinner"></div>Generating...';
            generateBtn.disabled = true;
        } else {
            generateBtn.innerHTML = '<i class="fas fa-magic"></i>Generate QR Code';
            generateBtn.disabled = false;
        }
    }

    saveQRCode() {
        if (!this.currentQRCode) {
            notificationManager.error('No QR code to save');
            return;
        }

        // Generate unique ID for the QR code
        const qrId = Date.now();

        // Create QR code data object
        const qrData = {
            id: qrId,
            content: this.currentQRCode.content,
            size: this.currentQRCode.size,
            errorCorrection: this.currentQRCode.errorCorrection,
            foregroundColor: this.currentQRCode.foregroundColor,
            backgroundColor: this.currentQRCode.backgroundColor,
            timestamp: this.currentQRCode.timestamp,
            name: this.generateQRName(this.currentQRCode.content)
        };

        // Save to database
        this.databaseManager.saveQRCodeToDatabase(qrData)
            .then(() => {
                this.savedCodes.push(qrData);
                this.updateSavedCodesList();
                notificationManager.success('QR code saved to database!');
            })
            .catch(error => {
                console.error('Error saving QR code:', error);
                notificationManager.error('Error saving QR code: ' + error.message);
            });
    }

    generateQRName(content) {
        // Generate a readable name from the content
        const maxLength = 30;
        let name = content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content;

        // Clean up the name
        name = name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

        return name || 'QR_Code_' + Date.now();
    }

    loadSavedCodes() {
        // Load from localStorage initially
        const saved = localStorage.getItem(Config.DATABASE.LOCAL_STORAGE_PREFIX + 'saved_codes');
        if (saved) {
            this.savedCodes = JSON.parse(saved);
            this.updateSavedCodesList();
        }
    }

    updateSavedCodesList() {
        const container = document.getElementById('saved-codes-list');

        if (this.savedCodes.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="color: var(--text-secondary); padding: 20px;">
                    <i class="fas fa-database" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <p>No saved QR codes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.savedCodes
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(qr => `
                <div class="saved-code-item" data-id="${qr.id}">
                    <div class="code-info">
                        <div class="code-title">${qr.name}</div>
                        <div class="code-date">${this.formatDate(qr.timestamp)}</div>
                    </div>
                    <div class="code-actions">
                        <button class="action-btn" onclick="app.loadQRCode(${qr.id})" title="Load">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" onclick="app.deleteQRCode(${qr.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    }

    loadQRCode(qrId) {
        const qr = this.savedCodes.find(q => q.id === qrId);
        if (!qr) {
            notificationManager.error('QR code not found');
            return;
        }

        // Load data into form
        document.getElementById('content-input').value = qr.content;
        document.getElementById('size-select').value = qr.size;
        document.getElementById('error-correction-select').value = qr.errorCorrection;
        document.getElementById('foreground-color').value = qr.foregroundColor;
        document.getElementById('background-color').value = qr.backgroundColor;

        // Regenerate the QR code
        this.generateQRCode();

        notificationManager.success('QR code loaded!');
    }

    deleteQRCode(qrId) {
        notificationManager.confirm('Are you sure you want to delete this QR code?', {
            confirmText: 'Delete',
            cancelText: 'Cancel'
        }).then(result => {
            if (!result) return;

            const index = this.savedCodes.findIndex(q => q.id === qrId);
            if (index === -1) {
                notificationManager.error('QR code not found');
                return;
            }

            // Remove from local array
            this.savedCodes.splice(index, 1);

            // Update localStorage
            localStorage.setItem(Config.DATABASE.LOCAL_STORAGE_PREFIX + 'saved_codes',
                JSON.stringify(this.savedCodes));

            // Update UI
            this.updateSavedCodesList();

            notificationManager.success('QR code deleted!');
        });
    }

    async connectToDatabase() {
        try {
            const result = await this.databaseManager.connectToGitHub();
            if (result) {
                this.updateDatabaseStatus();
                notificationManager.success('Connected to database!');
            }
        } catch (error) {
            console.error('Error connecting to database:', error);
            notificationManager.error('Error connecting to database: ' + error.message);
        }
    }

    async loadAllFromDatabase() {
        try {
            const count = await this.databaseManager.loadAllQRCodesFromDatabase();
            if (count > 0) {
                this.loadSavedCodes(); // Reload from localStorage after database sync
                notificationManager.success(`${count} QR codes loaded from database!`);
            } else {
                notificationManager.info('No QR codes found in database');
            }
        } catch (error) {
            console.error('Error loading from database:', error);
            notificationManager.error('Error loading from database: ' + error.message);
        }
    }

    async syncCurrentCode() {
        if (!this.currentQRCode) {
            notificationManager.error('No QR code to sync');
            return;
        }

        try {
            const qrData = {
                id: Date.now(),
                content: this.currentQRCode.content,
                size: this.currentQRCode.size,
                errorCorrection: this.currentQRCode.errorCorrection,
                foregroundColor: this.currentQRCode.foregroundColor,
                backgroundColor: this.currentQRCode.backgroundColor,
                timestamp: this.currentQRCode.timestamp,
                name: this.generateQRName(this.currentQRCode.content)
            };

            await this.databaseManager.saveQRCodeToDatabase(qrData);
            notificationManager.success('QR code synced to database!');
        } catch (error) {
            console.error('Error syncing QR code:', error);
            notificationManager.error('Error syncing QR code: ' + error.message);
        }
    }

    updateDatabaseStatus() {
        const indicator = document.getElementById('db-status-indicator');
        const statusText = document.getElementById('db-status-text');
        const connectBtn = document.getElementById('connect-github-btn');

        if (this.databaseManager.isGitHubConnected()) {
            indicator.classList.add('connected');
            statusText.textContent = 'Connected to GitHub';
            connectBtn.textContent = 'Disconnect';
            connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
            connectBtn.onclick = () => {
                this.databaseManager.disconnectFromGitHub();
                this.updateDatabaseStatus();
                notificationManager.info('Disconnected from database');
            };
        } else {
            indicator.classList.remove('connected');
            statusText.textContent = 'Not connected';
            connectBtn.textContent = 'Connect';
            connectBtn.innerHTML = '<i class="fab fa-github"></i> Connect';
            connectBtn.onclick = () => {
                this.connectToDatabase();
            };
        }
    }

    toggleSettingsPanel() {
        // Toggle the settings panel visibility
        const settingsPanel = document.querySelector('.settings-panel');
        settingsPanel.classList.toggle('hidden');
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QRCodeGenerator();
});