/**
 * notifications.js - Notification system for Pixel Pose
 */
import Config from './config.js';

export class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.defaultDuration = Config.UI.NOTIFICATION_DURATION || 3000;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
            
            // Add container styles
            if (!document.querySelector('#notification-container-styles')) {
                const styles = document.createElement('style');
                styles.id = 'notification-container-styles';
                styles.textContent = `
                    #notification-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10000;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        pointer-events: none;
                    }
                    
                    #notification-container .notification {
                        pointer-events: auto;
                        background: var(--bg-light, #1a2233);
                        border-radius: 8px;
                        padding: 14px 18px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                        color: var(--text-primary, #e0e6ed);
                        font-family: 'Syne', -apple-system, sans-serif;
                        font-size: 14px;
                        max-width: 320px;
                        min-width: 250px;
                        opacity: 0;
                        transform: translateX(100%);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    
                    #notification-container .notification.show {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    
                    #notification-container .notification.success {
                        border-left: 4px solid #00ff88;
                    }
                    
                    #notification-container .notification.error {
                        border-left: 4px solid #ff4466;
                    }
                    
                    #notification-container .notification.info {
                        border-left: 4px solid #00ccff;
                    }
                    
                    #notification-container .notification.warning {
                        border-left: 4px solid #ffaa00;
                    }
                    
                    #notification-container .notification-title {
                        font-weight: 600;
                        margin-bottom: 4px;
                        font-size: 13px;
                        color: var(--accent, #00ffcc);
                    }
                    
                    #notification-container .notification-message {
                        line-height: 1.4;
                    }
                    
                    #notification-container .notification-close {
                        position: absolute;
                        top: 8px;
                        right: 10px;
                        background: none;
                        border: none;
                        color: var(--text-dim, #8899aa);
                        cursor: pointer;
                        font-size: 16px;
                        padding: 4px;
                        line-height: 1;
                    }
                    
                    #notification-container .notification-close:hover {
                        color: var(--text-primary, #e0e6ed);
                    }
                `;
                document.head.appendChild(styles);
            }
        }
    }

    /**
     * Show a notification
     * @param {string} message - The notification message
     * @param {string} type - Type: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in milliseconds (optional)
     */
    show(message, type = 'info', duration = null) {
        const notificationId = Date.now() + Math.random();
        const durationMs = duration || this.defaultDuration;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = notificationId;

        // Add icon based on type
        const icon = this.getIconForType(type);
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="notificationManager.hide('${notificationId}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to container
        this.container.appendChild(notification);

        // Store reference
        this.notifications.set(notificationId, {
            element: notification,
            timeout: null
        });

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-hide after duration
        const timeout = setTimeout(() => {
            this.hide(notificationId);
        }, durationMs);

        // Update timeout reference
        if (this.notifications.has(notificationId)) {
            this.notifications.get(notificationId).timeout = timeout;
        }

        return notificationId;
    }

    /**
     * Hide a notification
     * @param {string} notificationId - The notification ID
     */
    hide(notificationId) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        const { element, timeout } = notificationData;

        // Clear timeout if exists
        if (timeout) {
            clearTimeout(timeout);
        }

        // Remove show class to trigger hide animation
        element.classList.remove('show');

        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(notificationId);
        }, 300);
    }

    /**
     * Show success notification
     * @param {string} message - The success message
     * @param {number} duration - Duration in milliseconds
     */
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error notification
     * @param {string} message - The error message
     * @param {number} duration - Duration in milliseconds
     */
    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show info notification
     * @param {string} message - The info message
     * @param {number} duration - Duration in milliseconds
     */
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }

    /**
     * Show warning notification
     * @param {string} message - The warning message
     * @param {number} duration - Duration in milliseconds
     */
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach((_, id) => {
            this.hide(id);
        });
    }

    /**
     * Get icon class for notification type
     * @param {string} type - Notification type
     * @returns {string} - Font Awesome icon class
     */
    getIconForType(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            case 'info':
            default:
                return 'fas fa-info-circle';
        }
    }

    /**
     * Create a loading notification that can be updated
     * @param {string} message - The loading message
     * @returns {Object} - Object with update and hide methods
     */
    loading(message) {
        const notificationId = this.show(message, 'info', null);
        const notificationData = this.notifications.get(notificationId);

        return {
            update: (newMessage) => {
                if (notificationData) {
                    const span = notificationData.element.querySelector('span');
                    if (span) {
                        span.textContent = newMessage;
                    }
                }
            },
            success: (message) => {
                this.hide(notificationId);
                this.success(message);
            },
            error: (message) => {
                this.hide(notificationId);
                this.error(message);
            },
            hide: () => {
                this.hide(notificationId);
            }
        };
    }

    /**
     * Show a confirmation dialog using notifications
     * @param {string} message - The confirmation message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - Promise that resolves to true/false
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const notificationId = Date.now() + Math.random();
            const {
                confirmText = 'Yes',
                cancelText = 'No',
                type = 'info'
            } = options;

            // Create confirmation notification
            const notification = document.createElement('div');
            notification.className = `notification confirm-notification ${type}`;
            notification.dataset.id = notificationId;

            notification.innerHTML = `
                <div class="confirm-content">
                    <i class="${this.getIconForType(type)}"></i>
                    <span>${message}</span>
                </div>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-yes" onclick="notificationManager.handleConfirm('${notificationId}', true)">
                        ${confirmText}
                    </button>
                    <button class="confirm-btn confirm-no" onclick="notificationManager.handleConfirm('${notificationId}', false)">
                        ${cancelText}
                    </button>
                </div>
            `;

            // Add styles for confirmation notifications
            if (!document.querySelector('#confirm-notification-styles')) {
                const styles = document.createElement('style');
                styles.id = 'confirm-notification-styles';
                styles.textContent = `
                    .confirm-notification {
                        max-width: 400px;
                        min-width: 300px;
                    }
                    
                    .confirm-content {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    
                    .confirm-actions {
                        display: flex;
                        gap: 8px;
                        justify-content: flex-end;
                    }
                    
                    .confirm-btn {
                        padding: 6px 12px;
                        border: 1px solid var(--border-color);
                        background: var(--bg-light);
                        color: var(--text-primary);
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.3s ease;
                    }
                    
                    .confirm-btn:hover {
                        background: var(--accent-primary);
                        color: var(--bg-darkest);
                        border-color: var(--accent-primary);
                    }
                    
                    .confirm-yes:hover {
                        background: var(--accent-primary);
                        color: var(--bg-darkest);
                    }
                    
                    .confirm-no:hover {
                        background: var(--accent-secondary);
                        color: white;
                    }
                `;
                document.head.appendChild(styles);
            }

            this.container.appendChild(notification);
            this.notifications.set(notificationId, {
                element: notification,
                timeout: null,
                resolve: null
            });

            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            // Store the resolve function
            if (this.notifications.has(notificationId)) {
                this.notifications.get(notificationId).resolve = resolve;
            }

            // Auto-cancel after 10 seconds
            setTimeout(() => {
                if (this.notifications.has(notificationId)) {
                    this.handleConfirm(notificationId, false);
                }
            }, 10000);
        });
    }

    /**
     * Handle confirmation button clicks
     * @param {string} notificationId - The notification ID
     * @param {boolean} result - The confirmation result
     */
    handleConfirm(notificationId, result) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        const { element, resolve } = notificationData;

        // Call the resolve function if it exists
        if (resolve) {
            resolve(result);
        }

        // Hide the notification
        this.hide(notificationId);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}