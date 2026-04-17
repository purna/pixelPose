/**
 * Tutorial System
 * 
 * Handles the display and interaction of tutorial steps for PixelPose
 */

class TutorialSystem {
    constructor(config) {
        this.config = config;
        this.currentTutorialStep = null;
        this.tutorialElement = null;
        this.overlayElement = null;
        this.isInitialized = false;
    }

    init() {
        this.createTutorialElements();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    createTutorialElements() {
        // Create overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'tutorial-overlay';
        this.overlayElement.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:none;';
        document.body.appendChild(this.overlayElement);

        // Create tutorial container
        this.tutorialElement = document.createElement('div');
        this.tutorialElement.id = 'tutorial-container';
        this.tutorialElement.style.cssText = `
            position: fixed;
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            width: 280px;
            z-index: 9999;
            display: none;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(this.tutorialElement);

        this.tutorialElement.innerHTML = `
            <div id="tutorial-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <h3 id="tutorial-heading" style="font-family:'Syne',sans-serif;font-size:0.9rem;color:var(--accent);margin:0;"></h3>
                <button id="tutorial-close" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem;padding:0;">×</button>
            </div>
            <div id="tutorial-content" style="font-size:0.7rem;color:var(--text-dim);line-height:1.5;margin-bottom:1rem;"></div>
            <div id="tutorial-controls" style="display:flex;justify-content:space-between;align-items:center;">
                <button id="tutorial-prev" class="btn" style="font-size:0.6rem;padding:0.3rem 0.5rem;display:none;">Prev</button>
                <div id="tutorial-progress-dots" style="display:flex;gap:4px;"></div>
                <button id="tutorial-next" class="btn primary" style="font-size:0.6rem;padding:0.3rem 0.5rem;">Next</button>
            </div>
        `;
    }

    setupEventListeners() {
        const closeBtn = document.getElementById('tutorial-close');
        const nextBtn = document.getElementById('tutorial-next');
        const prevBtn = document.getElementById('tutorial-prev');

        if (closeBtn) closeBtn.addEventListener('click', () => this.hideTutorial());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());

        document.addEventListener('keydown', (e) => {
            if (!this.config.isTutorialActive()) return;
            if (e.key === 'Escape') this.hideTutorial();
            else if (e.key === 'ArrowRight') this.nextStep();
            else if (e.key === 'ArrowLeft') this.prevStep();
        });
    }

    startTutorial(tutorialId) {
        if (!this.config.tutorials[tutorialId]?.enabled) {
            console.log('Tutorial is not enabled');
            return;
        }
        this.config.startTutorial(tutorialId);
        this.showCurrentStep();
    }

    showCurrentStep() {
        const step = this.config.getCurrentStep();
        if (!step) {
            this.hideTutorial();
            return;
        }

        this.currentTutorialStep = step;
        this.positionTutorial(step);

        const headingElement = document.getElementById('tutorial-heading');
        const contentElement = document.getElementById('tutorial-content');
        const prevBtn = document.getElementById('tutorial-prev');
        
        if (headingElement) headingElement.textContent = step.heading;
        if (contentElement) contentElement.textContent = step.content;
        if (prevBtn) prevBtn.style.display = this.config.currentStep > 0 ? 'inline-block' : 'none';

        const nextBtn = document.getElementById('tutorial-next');
        const tutorial = this.config.getTutorial(this.config.currentTutorial);
        if (nextBtn && tutorial && this.config.currentStep >= tutorial.steps.length - 1) {
            nextBtn.textContent = 'Done';
        } else if (nextBtn) {
            nextBtn.textContent = 'Next';
        }

        this.tutorialElement.style.display = 'block';
        this.overlayElement.style.display = 'block';
        this.updateProgressDots();
    }

    positionTutorial(step) {
        const targetElement = document.getElementById(step.elementId);
        if (!targetElement || !this.tutorialElement) return;

        const targetRect = targetElement.getBoundingClientRect();
        const tutorialRect = this.tutorialElement.getBoundingClientRect();
        const margin = 15;
        let top, left;

        switch(step.position) {
            case 'top':
                top = targetRect.top - tutorialRect.height - margin;
                left = targetRect.left + (targetRect.width / 2) - (tutorialRect.width / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + margin;
                left = targetRect.left + (targetRect.width / 2) - (tutorialRect.width / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tutorialRect.height / 2);
                left = targetRect.left - tutorialRect.width - margin;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tutorialRect.height / 2);
                left = targetRect.right + margin;
                break;
            case 'center':
                top = window.innerHeight / 2 - tutorialRect.height / 2;
                left = window.innerWidth / 2 - tutorialRect.width / 2;
                break;
            default:
                top = targetRect.top + (targetRect.height / 2) - (tutorialRect.height / 2);
                left = targetRect.right + margin;
        }

        top = Math.max(10, Math.min(top, window.innerHeight - tutorialRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tutorialRect.width - 10));

        this.tutorialElement.style.top = top + 'px';
        this.tutorialElement.style.left = left + 'px';
    }

    updateProgressDots() {
        const dotsContainer = document.getElementById('tutorial-progress-dots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';
        const tutorial = this.config.getTutorial(this.config.currentTutorial);
        if (!tutorial || !tutorial.steps) return;

        tutorial.steps.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: ${index === this.config.currentStep ? 'var(--accent)' : 'var(--border)'};
                transition: background 0.2s;
            `;
            dotsContainer.appendChild(dot);
        });
    }

    nextStep() {
        const nextStep = this.config.nextStep();
        if (nextStep) {
            this.showCurrentStep();
        } else {
            this.hideTutorial();
        }
    }

    prevStep() {
        const prevStep = this.config.prevStep();
        if (prevStep) {
            this.showCurrentStep();
        }
    }

    hideTutorial() {
        this.tutorialElement.style.display = 'none';
        this.overlayElement.style.display = 'none';
        this.config.stopTutorial();
    }
}

export { TutorialSystem };