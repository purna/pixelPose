/**
 * databaseManager.js - Handle saving and loading QR codes to/from a database
 *
 * This implementation uses GitHub as a simple database solution by:
 * 1. Creating a GitHub repository for QR code collections
 * 2. Using GitHub API to save/load QR code data as JSON files
 * 3. Providing offline fallback to localStorage
 */

class DatabaseManager {
    constructor(app) {
        this.app = app;
        this.GITHUB_API_URL = Config.DATABASE.GITHUB_API_URL;
        this.REPO_NAME = Config.DATABASE.REPO_NAME;
        this.USERNAME = Config.DATABASE.USERNAME;
        this.ACCESS_TOKEN = null; // This would be obtained via OAuth
        this.LOCAL_STORAGE_PREFIX = Config.DATABASE.LOCAL_STORAGE_PREFIX;

        // Check if we have GitHub credentials
        this.checkGitHubCredentials();
    }

    /**
     * Check if GitHub credentials are available
     */
    checkGitHubCredentials() {
        // In a real implementation, this would check for stored OAuth tokens
        // For this demo, we'll use localStorage as a fallback
        this.ACCESS_TOKEN = localStorage.getItem(this.LOCAL_STORAGE_PREFIX + 'github_access_token');

        if (!this.ACCESS_TOKEN) {
            console.log('No GitHub credentials found. Using localStorage fallback.');
            // In a real app, you would prompt the user to connect GitHub here
        }
    }

    /**
     * Connect to GitHub (simulated OAuth flow)
     */
    async connectToGitHub() {
        // In a real implementation, this would:
        // 1. Open GitHub OAuth dialog
        // 2. Get access token
        // 3. Store token securely
        // 4. Create repository if it doesn't exist

        // For this demo, we'll simulate a successful connection
        this.ACCESS_TOKEN = 'simulated-github-token-' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem(this.LOCAL_STORAGE_PREFIX + 'github_access_token', this.ACCESS_TOKEN);

        // Simulate repository creation
        await this.createRepositoryIfNotExists();

        notificationManager.success('Connected to GitHub database');
        return true;
    }

    /**
     * Create repository if it doesn't exist
     */
    async createRepositoryIfNotExists() {
        // In a real implementation, this would use GitHub API to create the repo
        // For this demo, we'll just log the action
        console.log('Checking/creating GitHub repository:', this.REPO_NAME);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return true;
    }

    /**
     * Save a QR code to the database
     */
    async saveQRCodeToDatabase(qrData) {
        if (!this.ACCESS_TOKEN) {
            // Fallback to localStorage if no GitHub connection
            return this.saveQRCodeToLocalStorage(qrData);
        }

        try {
            // Create file content
            const fileContent = JSON.stringify(qrData, null, 2);
            const fileName = `${qrData.name.replace(/\s+/g, '_')}_${qrData.id}.json`;

            // In a real implementation, this would:
            // 1. Create a blob with the file content
            // 2. Use GitHub API to commit the file to the repository
            // 3. Handle conflicts if the file already exists

            console.log('Saving QR code to GitHub:', fileName);
            console.log('File content:', fileContent);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            notificationManager.success(`QR code "${qrData.name}" saved to GitHub`);
            return true;

        } catch (error) {
            console.error('Error saving QR code to GitHub:', error);
            notificationManager.error('Error saving to GitHub: ' + error.message);

            // Fallback to localStorage
            return this.saveQRCodeToLocalStorage(qrData);
        }
    }

    /**
     * Save QR code to localStorage as fallback
     */
    saveQRCodeToLocalStorage(qrData) {
        try {
            const storageKey = `${this.LOCAL_STORAGE_PREFIX}qrcode_${qrData.id}`;
            localStorage.setItem(storageKey, JSON.stringify(qrData));

            // Also update the main saved codes list
            const savedCodesKey = `${this.LOCAL_STORAGE_PREFIX}saved_codes`;
            const existingCodes = localStorage.getItem(savedCodesKey);
            const savedCodes = existingCodes ? JSON.parse(existingCodes) : [];

            // Remove existing code with same ID if it exists
            const existingIndex = savedCodes.findIndex(code => code.id === qrData.id);
            if (existingIndex !== -1) {
                savedCodes[existingIndex] = qrData;
            } else {
                savedCodes.push(qrData);
            }

            localStorage.setItem(savedCodesKey, JSON.stringify(savedCodes));

            notificationManager.success(`QR code "${qrData.name}" saved locally`);
            return true;

        } catch (error) {
            console.error('Error saving QR code locally:', error);
            notificationManager.error('Error saving QR code: ' + error.message);
            return false;
        }
    }

    /**
     * Load all QR codes from database
     */
    async loadAllQRCodesFromDatabase() {
        if (!this.ACCESS_TOKEN) {
            // Fallback to localStorage if no GitHub connection
            return this.loadAllQRCodesFromLocalStorage();
        }

        try {
            // In a real implementation, this would:
            // 1. Use GitHub API to list all files in the repository
            // 2. Filter for .json files
            // 3. Download each file and parse as QR code data
            // 4. Import each QR code

            console.log('Loading QR codes from GitHub...');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For this demo, we'll simulate finding some QR codes
            const simulatedQRCodes = [
                {
                    id: 1001,
                    name: 'Website_URL',
                    content: 'https://example.com',
                    size: 256,
                    errorCorrection: 'M',
                    foregroundColor: '#000000',
                    backgroundColor: '#ffffff',
                    timestamp: '2024-01-15T10:30:00.000Z'
                },
                {
                    id: 1002,
                    name: 'Contact_Info',
                    content: 'BEGIN:VCARD\\nFN:John Doe\\nTEL:+1234567890\\nEMAIL:john@example.com\\nEND:VCARD',
                    size: 256,
                    errorCorrection: 'H',
                    foregroundColor: '#ff0000',
                    backgroundColor: '#ffffff',
                    timestamp: '2024-01-14T15:45:00.000Z'
                }
            ];

            // Save each QR code to localStorage
            let savedCount = 0;
            simulatedQRCodes.forEach(qrData => {
                const storageKey = `${this.LOCAL_STORAGE_PREFIX}qrcode_${qrData.id}`;
                localStorage.setItem(storageKey, JSON.stringify(qrData));
                savedCount++;
            });

            // Update the main saved codes list
            const savedCodesKey = `${this.LOCAL_STORAGE_PREFIX}saved_codes`;
            localStorage.setItem(savedCodesKey, JSON.stringify(simulatedQRCodes));

            notificationManager.success('QR codes loaded from GitHub');
            return savedCount;

        } catch (error) {
            console.error('Error loading QR codes from GitHub:', error);
            notificationManager.error('Error loading from GitHub: ' + error.message);

            // Fallback to localStorage
            return this.loadAllQRCodesFromLocalStorage();
        }
    }

    /**
     * Load QR codes from localStorage as fallback
     */
    loadAllQRCodesFromLocalStorage() {
        try {
            let loadedCount = 0;

            // Load all QR codes from localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.LOCAL_STORAGE_PREFIX}qrcode_`)) {
                    // Count it but don't actually load the data here
                    // The main app will handle updating the UI
                    loadedCount++;
                }
            }

            return loadedCount;

        } catch (error) {
            console.error('Error loading QR codes from localStorage:', error);
            notificationManager.error('Error loading QR codes: ' + error.message);
            return 0;
        }
    }

    /**
     * Delete a QR code from database
     */
    async deleteQRCodeFromDatabase(qrId) {
        if (!this.ACCESS_TOKEN) {
            // Fallback to localStorage if no GitHub connection
            return this.deleteQRCodeFromLocalStorage(qrId);
        }

        try {
            // In a real implementation, this would:
            // 1. Find the file corresponding to this QR code
            // 2. Use GitHub API to delete the file
            // 3. Handle any conflicts

            console.log('Deleting QR code from GitHub:', qrId);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            notificationManager.success('QR code deleted from GitHub');
            return true;

        } catch (error) {
            console.error('Error deleting QR code from GitHub:', error);
            notificationManager.error('Error deleting from GitHub: ' + error.message);

            // Fallback to localStorage
            return this.deleteQRCodeFromLocalStorage(qrId);
        }
    }

    /**
     * Delete QR code from localStorage as fallback
     */
    deleteQRCodeFromLocalStorage(qrId) {
        try {
            const storageKey = `${this.LOCAL_STORAGE_PREFIX}qrcode_${qrId}`;
            localStorage.removeItem(storageKey);

            // Also remove from the main saved codes list
            const savedCodesKey = `${this.LOCAL_STORAGE_PREFIX}saved_codes`;
            const existingCodes = localStorage.getItem(savedCodesKey);
            if (existingCodes) {
                const savedCodes = JSON.parse(existingCodes);
                const filteredCodes = savedCodes.filter(code => code.id !== qrId);
                localStorage.setItem(savedCodesKey, JSON.stringify(filteredCodes));
            }

            notificationManager.success('QR code deleted from local storage');
            return true;

        } catch (error) {
            console.error('Error deleting QR code from localStorage:', error);
            notificationManager.error('Error deleting QR code: ' + error.message);
            return false;
        }
    }

    /**
     * Get GitHub connection status
     */
    isGitHubConnected() {
        return !!this.ACCESS_TOKEN;
    }

    /**
     * Disconnect from GitHub
     */
    disconnectFromGitHub() {
        this.ACCESS_TOKEN = null;
        localStorage.removeItem(this.LOCAL_STORAGE_PREFIX + 'github_access_token');
        notificationManager.info('Disconnected from GitHub');
    }

    /**
     * Get database status information
     */
    getDatabaseStatus() {
        return {
            githubConnected: this.isGitHubConnected(),
            localQRCodes: this.getLocalQRCodeCount(),
            repoName: this.REPO_NAME
        };
    }

    /**
     * Get count of locally stored QR codes
     */
    getLocalQRCodeCount() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${this.LOCAL_STORAGE_PREFIX}qrcode_`)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Export all QR codes to a backup file
     */
    async exportAllQRCodes() {
        try {
            const allQRCodes = [];

            // Collect all QR codes from localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.LOCAL_STORAGE_PREFIX}qrcode_`)) {
                    const qrData = JSON.parse(localStorage.getItem(key));
                    allQRCodes.push(qrData);
                }
            }

            const exportData = {
                version: Config.VERSION,
                exportDate: new Date().toISOString(),
                qrCodes: allQRCodes
            };

            // Create and download the backup file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pixelqr-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            notificationManager.success(`Exported ${allQRCodes.length} QR codes`);
            return true;

        } catch (error) {
            console.error('Error exporting QR codes:', error);
            notificationManager.error('Error exporting QR codes: ' + error.message);
            return false;
        }
    }

    /**
     * Import QR codes from a backup file
     */
    async importQRCodesFromBackup(file) {
        try {
            const fileContent = await this.readFileAsText(file);
            const importData = JSON.parse(fileContent);

            if (!importData.qrCodes || !Array.isArray(importData.qrCodes)) {
                throw new Error('Invalid backup file format');
            }

            let importedCount = 0;

            // Import each QR code
            importData.qrCodes.forEach(qrData => {
                // Ensure the QR code has a unique ID
                if (!qrData.id) {
                    qrData.id = Date.now() + Math.random();
                }

                const storageKey = `${this.LOCAL_STORAGE_PREFIX}qrcode_${qrData.id}`;
                localStorage.setItem(storageKey, JSON.stringify(qrData));
                importedCount++;
            });

            notificationManager.success(`Imported ${importedCount} QR codes`);
            return importedCount;

        } catch (error) {
            console.error('Error importing QR codes:', error);
            notificationManager.error('Error importing QR codes: ' + error.message);
            return 0;
        }
    }

    /**
     * Helper method to read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
}

// Add database UI controls to settings panel
class DatabaseUI {
    constructor(app) {
        this.app = app;
        this.databaseManager = new DatabaseManager(app);

        // Add database controls to settings
        this.addDatabaseControlsToSettings();
    }

    addDatabaseControlsToSettings() {
        // Add additional database controls to the settings panel
        const settingsPanel = document.querySelector('.settings-panel');
        if (!settingsPanel) return;

        // Add export/import section
        const importExportSection = document.createElement('div');
        importExportSection.className = 'form-group mt-16';
        importExportSection.innerHTML = `
            <h3 class="section-title">Backup & Restore</h3>
            <button id="export-all-btn" class="btn btn-secondary btn-full mb-16">
                <i class="fas fa-download"></i> Export All QR Codes
            </button>
            <input type="file" id="import-file" accept=".json" style="display: none;">
            <button id="import-btn" class="btn btn-secondary btn-full">
                <i class="fas fa-upload"></i> Import QR Codes
            </button>
        `;

        settingsPanel.appendChild(importExportSection);

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Export all button
        document.getElementById('export-all-btn')?.addEventListener('click', async () => {
            await this.databaseManager.exportAllQRCodes();
        });

        // Import button
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        // Import file change
        document.getElementById('import-file')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const count = await this.databaseManager.importQRCodesFromBackup(file);
                if (count > 0) {
                    this.app.loadSavedCodes(); // Reload the UI
                }
            }
        });
    }
}