/**
 * export-manager.js - Export functionality for QR Code Generator
 */

class ExportManager {
    constructor(appInstance) {
        this.app = appInstance;
        this.config = window.Config;
    }

    /**
     * Main export function - handles different export formats
     */
    exportQRCode() {
        if (!this.app.currentQRCode) {
            notificationManager.error('No QR code to export');
            return;
        }

        const format = document.getElementById('export-format-select').value;

        switch (format) {
            case 'png':
                this.downloadQRCode();
                break;
            case 'svg':
                this.exportAsSVG();
                break;

            default:
                notificationManager.error('Unsupported export format');
        }
    }

    /**
     * Download QR code as PNG
     */
    downloadQRCode() {
        if (!this.app.currentQRCode) {
            notificationManager.error('No Pose to download');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = this.app.currentQRCode.canvas.toDataURL();
            link.click();

            notificationManager.success('Pose downloaded!');
        } catch (error) {
            console.error('Error downloading Pose:', error);
            notificationManager.error('Error downloading Pose');
        }
    }

    /**
     * Export QR code as SVG
     */
    exportAsSVG() {
        if (!this.app.currentQRCode) {
            notificationManager.error('No Pose to export');
            return;
        }

        try {
            const { qr, size, foregroundColor, backgroundColor } = this.app.currentQRCode;
            const cellSize = size / qr.getModuleCount();
            const margin = parseInt(this.config.QR_CODE.DEFAULT_MARGIN) * cellSize;
            const totalSize = size + (margin * 2);

            // Generate SVG path data
            let svgPath = '';
            for (let row = 0; row < qr.getModuleCount(); row++) {
                for (let col = 0; col < qr.getModuleCount(); col++) {
                    if (qr.isDark(row, col)) {
                        const x = Math.round(col * cellSize) + margin;
                        const y = Math.round(row * cellSize) + margin;
                        const width = Math.ceil(cellSize);
                        const height = Math.ceil(cellSize);
                        svgPath += `M${x} ${y}h${width}v${height}h-${width}z`;
                    }
                }
            }

            // Create SVG content
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
    <rect width="100%" height="100%" fill="${backgroundColor}"/>
    <path d="${svgPath}" fill="${foregroundColor}"/>
</svg>`;

            // Create and download file
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.svg`;
            link.href = URL.createObjectURL(blob);
            link.click();

            // Clean up
            URL.revokeObjectURL(link.href);

            notificationManager.success('SVG exported successfully!');
        } catch (error) {
            console.error('Error exporting SVG:', error);
            notificationManager.error('Error exporting SVG: ' + error.message);
        }
    }

}