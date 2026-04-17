/**
 * Tutorial Configuration System
 * 
 * PixelPose tutorial configuration
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
                        content: 'This tutorial will guide you through the main features of the Character Animator.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'move-node',
                        elementId: 'modeMove',
                        position: 'left',
                        heading: 'Move Nodes',
                        content: 'Select the Move Node tool to drag individual body parts like arms, legs, and head to create poses.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'pelvis',
                        elementId: 'canvasWrap',
                        position: 'center',
                        heading: 'Move the Whole Body',
                        content: 'Drag the pelvis node to move the entire body together. Enable "Anchor feet to ground" to keep feet planted.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'timeline',
                        elementId: 'playBtn',
                        position: 'right',
                        heading: 'Timeline & Frames',
                        content: 'Add frames to create animation. Use Duplicate to copy the current pose, then modify it for the next frame.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'playback',
                        elementId: 'playBtn',
                        position: 'right',
                        heading: 'Play Animation',
                        content: 'Click Play to preview your animation. Adjust FPS and enable Loop for smooth playback.',
                        showNext: true,
                        showSkip: true
                    },
                    {
                        id: 'save',
                        elementId: 'saveAnimBtn',
                        position: 'left',
                        heading: 'Save & Export',
                        content: 'Save your animation locally or export as JSON to share or use in other applications.',
                        showNext: true,
                        showSkip: true
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