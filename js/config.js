/**
 * config.js - Configuration file for Pixel Pose
 */

const Config = {
    // Application settings
    APP_NAME: 'PixelPose',
    VERSION: '1.0.0',

    // Database settings
    DATABASE: {
        GITHUB_API_URL: 'https://api.github.com',
        REPO_NAME: 'pixel-pose-codes',
        USERNAME: 'pixel-pose-user',
        ACCESS_TOKEN: null,
        LOCAL_STORAGE_PREFIX: 'pixelPose_'
    },

    // UI settings
    UI: {
        NOTIFICATION_DURATION: 3000,
        ANIMATION_DURATION: 300,
        THEME: 'dark'
    },

    // CSS variables for theming
    THEME: {
        bgDarkest: '#0f0f1b',
        bgDark: '#1a1a2e',
        bgMedium: '#16213e',
        bgLight: '#1e293b',
        accentPrimary: '#00ff41',
        accentSecondary: '#ff006e',
        accentTertiary: '#00d9ff',
        textPrimary: '#e0e7ff',
        textSecondary: '#94a3b8',
        borderColor: '#2d3748'
    },

    // Export settings
    EXPORT: {
        FORMATS: ['png', 'svg'],
        DEFAULT_FORMAT: 'png',
        INCLUDE_BORDER: true
    }
};

// Export for module usage
export default Config;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}