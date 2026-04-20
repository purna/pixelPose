/**
 * Tutorial Configuration System
 * 
 * PixelPose tutorial configuration
 * 
 * App Features:
 * - 2D skeletal character animation
 * - Multiple body types: adult-male, adult-female, child, horse, dog, cat
 * - Timeline-based frame animation with onion skinning
 * - IK and limb length constraints
 * - Export to JSON, PNG sprite sheets, APNG
 */

class TutorialConfig {
    constructor() {
        this.tutorials = {
            'main': {
                enabled: false,
                steps: [
                    {
                        id: 'welcome',
                        elementId: 'canvasWrap',
                        position: 'center',
                        heading: 'Welcome to PixelPose!',
                        content: 'A 2D character animator for creating pose animations. Drag nodes to pose characters, add frames, and export as video or sprite sheets.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'body-types',
                        elementId: 'bodyTypeSelect',
                        position: 'left',
                        heading: 'Body Types',
                        content: 'Choose from Human (Male, Female, Child) or Animal (Horse, Dog, Cat) body types. Each has a unique skeletal structure.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'move-mode',
                        elementId: 'modeMove',
                        position: 'left',
                        heading: 'Move Tool',
                        content: 'Select Move Node tool, then drag any joint (blue/green circles) to pose the character. The joints follow the skeleton.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'pan-mode',
                        elementId: 'modePan',
                        position: 'left',
                        heading: 'Pan Tool',
                        content: 'Use Pan tool to pan around the canvas. Or hold Space + drag to pan quickly.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'ik-constraints',
                        elementId: 'ikToggle',
                        position: 'right',
                        heading: 'IK & Constraints',
                        content: 'Enable "Use IK" for inverse kinematics, or "Lock limb lengths" to preserve bone distances. This prevents limbs from stretching.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'anchor-feet',
                        elementId: 'footAnchor',
                        position: 'left',
                        heading: 'Anchor Feet',
                        content: 'Enable "Anchor feet to ground" to keep feet planted when moving the pelvis. Feet stay at their Y position while the body moves.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'sprite-mode',
                        elementId: 'spriteMode',
                        position: 'right',
                        heading: 'Sprite Mode',
                        content: 'Sprite mode renders detailed body parts instead of simple shapes. Enable for richer visuals when exporting sprites.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'scale',
                        elementId: 'scaleSlider',
                        position: 'left',
                        heading: 'Character Scale',
                        content: 'Adjust the character size with the Scale slider. This affects the export size but not the skeleton.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'timeline',
                        elementId: 'playBtn',
                        position: 'right',
                        heading: 'Timeline',
                        content: 'Add frames with the + Frame button. Use "Dup" to copy the current pose, then modify it for the next frame.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'playback',
                        elementId: 'playBtn',
                        position: 'right',
                        heading: 'Playback',
                        content: 'Click Play to preview your animation. Adjust FPS for speed. Enable Loop for continuous playback.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'onion-skin',
                        elementId: 'onionToggle',
                        position: 'right',
                        heading: 'Onion Skin',
                        content: 'Enable "Onion skin" to see the previous frame as a shadow. Helps with smooth animation transitions.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'flip',
                        elementId: 'flipHBtn',
                        position: 'left',
                        heading: 'Flip Pose',
                        content: 'Use "Flip" to mirror the pose horizontally. Useful for walk cycles.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'mirror',
                        elementId: 'symmetryBtn',
                        position: 'left',
                        heading: 'Mirror Mode',
                        content: 'Enable "Mirror" to move both left and right limbs symmetrically. Speeds up posing.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'bone-lengths',
                        elementId: 'boneLengthsContainer',
                        position: 'left',
                        heading: 'Bone Lengths',
                        content: 'Adjust individual bone lengths in the sidebar. These constraints maintain the skeleton proportions.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'save',
                        elementId: 'saveAnimBtn',
                        position: 'left',
                        heading: 'Save Animation',
                        content: 'Click Save to store your animation locally. Includes all frames, body type, and metadata.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'export',
                        elementId: 'exportBtn',
                        position: 'left',
                        heading: 'Export',
                        content: 'Export as JSON (data), PNG sprite sheet (image sequence), or APNG (animated PNG).',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'import',
                        elementId: 'importBtn',
                        position: 'left',
                        heading: 'Import',
                        content: 'Import previously exported JSON files to continue working on animations.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'undo',
                        elementId: 'undoBtn',
                        position: 'left',
                        heading: 'Undo/Redo',
                        content: 'Use Undo (↶) and Redo (↷) to revert or reapply changes. Keyboard: Ctrl+Z / Ctrl+Y.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'labels',
                        elementId: 'showLabels',
                        position: 'right',
                        heading: 'Display Options',
                        content: 'Toggle Node labels, distances, grid, ground shadow, and bounding box for reference.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'done',
                        elementId: 'canvasWrap',
                        position: 'center',
                        heading: 'Ready!',
                        content: 'You\'re all set! Drag nodes to pose, add frames, and create amazing animations. Have fun!',
                        showNext: false,
                        showSkip: false
                    }
                ]
            },
            'quick': {
                enabled: false,
                steps: [
                    {
                        id: 'quick-welcome',
                        elementId: 'canvasWrap',
                        position: 'center',
                        heading: 'Quick Start',
                        content: 'Drag nodes to pose the character. Add frames to create animation.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'quick-move',
                        elementId: 'modeMove',
                        position: 'left',
                        heading: 'Drag to Pose',
                        content: 'Click and drag any joint to move it. The skeleton follows naturally.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'quick-frames',
                        elementId: 'addFrameBtn',
                        position: 'right',
                        heading: 'Add Frames',
                        content: 'Click + Frame, then modify the pose. Click Play to preview.',
                        showNext: false,
                        showSkip: false
                    }
                ]
            }
        };

        this.currentTutorial = 'main';
        this.currentStep = 0;
        this.isActive = false;
    }

    addTutorial(tutorialId, config) {
        this.tutorials[tutorialId] = config;
    }

    getTutorial(tutorialId) {
        return this.tutorials[tutorialId] || null;
    }

    getCurrentStep() {
        const tutorial = this.getTutorial(this.currentTutorial);
        if (!tutorial || !tutorial.steps || this.currentStep >= tutorial.steps.length) {
            return null;
        }
        return tutorial.steps[this.currentStep];
    }

    nextStep() {
        const tutorial = this.getTutorial(this.currentTutorial);
        if (!tutorial || !tutorial.steps) return null;

        this.currentStep++;
        if (this.currentStep >= tutorial.steps.length) {
            return null;
        }
        return this.getCurrentStep();
    }

    prevStep() {
        if (this.currentStep <= 0) return null;
        this.currentStep--;
        return this.getCurrentStep();
    }

    resetTutorial() {
        this.currentStep = 0;
    }

    startTutorial(tutorialId) {
        if (this.tutorials[tutorialId]) {
            this.currentTutorial = tutorialId;
            this.currentStep = 0;
            this.isActive = true;
        }
    }

    stopTutorial() {
        this.isActive = false;
    }

    isTutorialActive() {
        return this.isActive;
    }
}

export { TutorialConfig };