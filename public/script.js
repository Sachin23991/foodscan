// script.js (Updated to call the real backend)

class FoodScanApp {
    constructor() {
        this.analysisTimeout = null;
        this.initializeElements();
        this.bindEvents();
        this.initAnimations();
    }

    initializeElements() {
        // Main sections
        this.uploadSection = document.getElementById('uploadSection');
        this.analysisScreen = document.getElementById('analysisScreen');
        this.resultsSection = document.getElementById('resultsSection');
        
        // Upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadCore = document.querySelector('.upload-core');
        this.magneticField = document.querySelector('.magnetic-field');
        this.fabButton = document.getElementById('fabButton');
        
        // Results elements
        this.mealImage = document.getElementById('mealImage');
        this.healthScoreOrb = document.getElementById('healthScore');
        
        // Nutrition elements
        this.caloriesElement = document.getElementById('calories');
        this.proteinElement = document.getElementById('protein');
        this.carbsElement = document.getElementById('carbs');
        this.fatElement = document.getElementById('fat');
        
        // Progress rings
        this.caloriesRing = document.querySelector('.calories-ring');
        this.proteinRing = document.querySelector('.protein-ring');
        this.carbsRing = document.querySelector('.carbs-ring');
        this.fatRing = document.querySelector('.fat-ring');
        
        // Containers
        this.warningsList = document.getElementById('warningsList');
        this.recommendationsList = document.getElementById('recommendationsList');
        this.warningsSection = document.getElementById('warningsSection');
        
        // Analysis elements
        this.statusIndicators = document.querySelectorAll('.indicator');
        this.progressFill = document.querySelector('.progress-fill');
        
        // Action button
        this.actionButton = document.querySelector('.action-button');
    }

    bindEvents() {
        this.magneticField.addEventListener('click', () => this.triggerFileInput());
        this.fabButton.addEventListener('click', () => this.triggerFileInput());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (this.actionButton) {
            this.actionButton.addEventListener('click', () => this.resetApp());
        }
    }

    triggerFileInput() {
        this.fileInput.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImage(file);
        } else {
            this.showError('Please select a valid image file');
        }
    }
    
    // ===================================================================
    // === CORE LOGIC: FROM MOCK TO REAL API CALL ========================
    // ===================================================================

    async processImage(file) {
        // Create a temporary URL to show the selected image immediately
        const imageUrl = URL.createObjectURL(file);
        this.mealImage.src = imageUrl;
        
        this.showAnalysisScreen();

        try {
            // Prepare form data to send the image
            const formData = new FormData();
            formData.append('foodImage', file);

            // *** This is the REAL API call to your server ***
            const response = await fetch('http://localhost:3000/api/analyze-food', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!result.success) {
                // Handle errors from the server (e.g., Gemini API fails)
                throw new Error(result.error || 'Analysis failed on the server.');
            }

            // Successfully received data, now show it
            this.showResults(result.data);

        } catch (error) {
            console.error('Error during analysis:', error);
            this.showError(error.message);
            // If something goes wrong, reset the app to the start screen
            this.resetApp();
        }
    }

    showResults(data) {
        // Hide analysis screen
        this.analysisScreen.style.animation = 'fadeOutDown 0.6s ease-in forwards';
        
        setTimeout(() => {
            this.analysisScreen.classList.add('hidden');
            this.resultsSection.classList.remove('hidden');
            
            // Update all UI elements with REAL data from the server
            this.updateHealthScore(data.healthScore);
            this.animateNutritionValues(data.nutrition);
            this.displayWarnings(data.warnings);
            this.displayRecommendations(data.recommendations);
            this.animateProgressRings(data.nutrition);
        }, 600);
    }
    
    // ===================================================================
    // === UI and ANIMATION FUNCTIONS (Largely Unchanged) ================
    // ===================================================================

    showAnalysisScreen() {
        this.uploadSection.style.animation = 'fadeOutUp 0.8s ease-in forwards';
        setTimeout(() => {
            this.uploadSection.classList.add('hidden');
            this.analysisScreen.classList.remove('hidden');
            this.progressFill.style.width = '0%';
            setTimeout(() => { this.progressFill.style.width = '100%'; }, 100);
            this.animateStatusIndicators();
        }, 800);
    }
    
    updateHealthScore(healthScore) {
        const scoreText = this.healthScoreOrb.querySelector('.score-text');
        
        this.healthScoreOrb.style.background = healthScore.color;
        this.healthScoreOrb.style.boxShadow = `0 10px 30px ${healthScore.color}40`;
        scoreText.textContent = healthScore.rating;
    }

    animateNutritionValues(nutrition) {
        this.animateCountUp(this.caloriesElement, nutrition.calories, 1500);
        this.animateCountUp(this.proteinElement, nutrition.protein_g, 1600);
        this.animateCountUp(this.carbsElement, nutrition.carbs_g, 1700);
        this.animateCountUp(this.fatElement, nutrition.fat_g, 1800);
    }
    
    animateProgressRings(nutrition) {
        const rings = [
            { element: this.caloriesRing, value: nutrition.calories, max: 1000 },
            { element: this.proteinRing, value: nutrition.protein_g, max: 70 },
            { element: this.carbsRing, value: nutrition.carbs_g, max: 150 },
            { element: this.fatRing, value: nutrition.fat_g, max: 80 }
        ];
        rings.forEach((ring, index) => {
            if (ring.element) {
                const percentage = Math.min((ring.value / ring.max) * 100, 100);
                const circumference = 2 * Math.PI * 25; // radius = 25
                const offset = circumference - (percentage / 100) * circumference;
                setTimeout(() => { ring.element.style.strokeDashoffset = offset; }, index * 200 + 500);
            }
        });
    }

    displayWarnings(warnings) {
        this.warningsList.innerHTML = '';
        this.warningsSection.style.display = warnings.length > 0 ? 'block' : 'none';
        warnings.forEach((warning, index) => {
            const el = document.createElement('div');
            el.className = 'alert-item';
            el.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 10px; color: var(--warning-color);"></i>${warning}`;
            this.warningsList.appendChild(el);
        });
    }

    displayRecommendations(recommendations) {
        this.recommendationsList.innerHTML = '';
        recommendations.forEach((rec, index) => {
            const el = document.createElement('div');
            el.className = 'recommendation-item';
            el.innerHTML = `<i class="fas fa-lightbulb" style="margin-right: 10px; color: #667eea;"></i>${rec}`;
            this.recommendationsList.appendChild(el);
        });
    }

    resetApp() {
        this.resultsSection.classList.add('hidden');
        this.analysisScreen.classList.add('hidden');
        this.uploadSection.classList.remove('hidden');
        this.fileInput.value = '';
        
        // Force reset animations
        this.uploadSection.style.animation = 'none';
        this.analysisScreen.style.animation = 'none';
        
        // Revoke the temporary image URL to free up memory
        if (this.mealImage.src) {
            URL.revokeObjectURL(this.mealImage.src);
            this.mealImage.src = '';
        }
    }
    
    // Helper/Utility functions (mostly unchanged)
    animateStatusIndicators() {
        this.statusIndicators.forEach(ind => ind.classList.remove('active'));
        let currentIndex = 0;
        const animateNext = () => {
            if (currentIndex > 0) this.statusIndicators[currentIndex - 1].classList.remove('active');
            if (currentIndex < this.statusIndicators.length) {
                this.statusIndicators[currentIndex].classList.add('active');
                currentIndex++;
                this.analysisTimeout = setTimeout(animateNext, 800);
            }
        };
        animateNext();
    }

    animateCountUp(element, targetValue, duration) {
        let startValue = 0;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            element.textContent = Math.floor(progress * targetValue);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
        errorDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4); z-index: 10000; animation: slideInRight 0.5s ease-out;`;
        document.body.appendChild(errorDiv);
        setTimeout(() => { errorDiv.remove(); }, 4000);
    }
    
    initAnimations() {
        const style = document.createElement('style');
        style.textContent = `@keyframes slideInRight { 0% { transform: translateX(100%); } 100% { transform: translateX(0); } } @keyframes fadeOutUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-50px); } } @keyframes fadeOutDown { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(50px); } }`;
        document.head.appendChild(style);
    }
}

// Global reset function required by your HTML's onclick attribute
function resetApp() {
    if (window.foodScanApp) {
        window.foodScanApp.resetApp();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.foodScanApp = new FoodScanApp();
});