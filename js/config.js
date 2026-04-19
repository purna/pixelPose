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

    // Body types and their JSON files
    BODIES: {
        'adult-male': { file: 'data/bodies/adult-male.json', label: 'Male' },
        'adult-female': { file: 'data/bodies/adult-female.json', label: 'Female' },
        'child': { file: 'data/bodies/child.json', label: 'Child' },
        'horse': { file: 'data/bodies/horse.json', label: 'Horse' },
        'dog': { file: 'data/bodies/dog.json', label: 'Dog' },
        'cat': { file: 'data/bodies/cat.json', label: 'Cat' }
    },

    // Animations mapped to body types
    ANIMATIONS: {
        'adult-male': [
            'data/animations/walk-cycle-male.json',
            'data/animations/walk-jump-cycle-male.json',
            'data/animations/run-cycle-male.json',
            'data/animations/run-jump-cycle-male.json'
        ],
        'adult-female': [
            'data/animations/walk-cycle-female.json',
            'data/animations/walk-jump-cycle-female.json',
            'data/animations/run-cycle-female.json',
            'data/animations/run-jump-cycle-female.json'
        ],
        'child': [
            'data/animations/walk-cycle-child.json',
            'data/animations/run-cycle-child.json'
        ],
        'horse': [
            'data/animations/walk-cycle-horse.json'
        ],
        'dog': [
            'data/animations/walk-cycle-dog.json'
        ],
        'cat': [
            'data/animations/walk-cycle-cat.json'
        ]
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