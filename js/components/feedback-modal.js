/**
 * REIGN - Feedback Modal Component
 * Beautiful, role-aware feedback collection with 30-day cooldown
 */

const FeedbackModal = {
    // Modal state
    isExpanded: false,
    modalElement: null,

    // Configuration
    config: {
        cooldownDays: 30,
        storageKey: 'reign_feedback_last_shown',
        firstUseKey: 'reign_first_use_date'
    },

    /**
     * Initialize the feedback system
     */
    init() {
        this.createModal();
        this.setupEventListeners();
        this.trackFirstUse();
    },

    /**
     * Track first use date
     */
    trackFirstUse() {
        if (!localStorage.getItem(this.config.firstUseKey)) {
            localStorage.setItem(this.config.firstUseKey, Date.now().toString());
        }
    },

    /**
     * Check if modal should be shown (30 days since last feedback or first use)
     */
    shouldShowModal() {
        const lastShown = localStorage.getItem(this.config.storageKey);
        const firstUse = localStorage.getItem(this.config.firstUseKey);

        // If never shown, check if 30 days since first use
        if (!lastShown && firstUse) {
            const daysSinceFirstUse = (Date.now() - parseInt(firstUse)) / (1000 * 60 * 60 * 24);
            return daysSinceFirstUse >= this.config.cooldownDays;
        }

        // If shown before, check if 30 days since last shown
        if (lastShown) {
            const daysSinceLastShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
            return daysSinceLastShown >= this.config.cooldownDays;
        }

        return false;
    },

    /**
     * Get current persona (king/queen)
     */
    getPersona() {
        return localStorage.getItem('reign_persona') || 'king';
    },

    /**
     * Create the modal HTML
     */
    createModal() {
        const persona = this.getPersona();
        const isQueen = persona === 'queen';

        const modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = 'feedback-modal' + (isQueen ? ' queen-theme' : '');
        modal.innerHTML = `
            <div class="feedback-overlay"></div>
            <div class="feedback-content">
                <!-- Collapsed State -->
                <div class="feedback-collapsed">
                    <div class="feedback-header">
                        <div class="feedback-icon">
                            <i class="ph-fill ph-chat-heart"></i>
                        </div>
                        <div class="feedback-title">
                            <h3>Your Voice Matters</h3>
                            <p>Help us make REIGN even better</p>
                        </div>
                    </div>
                    <div class="feedback-actions-collapsed">
                        <button class="feedback-btn primary" onclick="FeedbackModal.expand()">
                            <i class="ph-bold ph-sparkle"></i>
                            Give Feedback
                        </button>
                        <button class="feedback-btn secondary" onclick="FeedbackModal.dismiss()">
                            Not Now
                        </button>
                    </div>
                </div>

                <!-- Expanded State -->
                <div class="feedback-expanded">
                    <button class="feedback-close" onclick="FeedbackModal.collapse()">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    
                    <div class="feedback-header expanded">
                        <i class="ph-fill ph-crown"></i>
                        <h3>Share Your Royal Thoughts</h3>
                        <p>Your feedback shapes the future of REIGN</p>
                    </div>

                    <form class="feedback-form" onsubmit="FeedbackModal.submit(event)">
                        <!-- Rating -->
                        <div class="feedback-rating">
                            <label>How's your experience?</label>
                            <div class="rating-stars">
                                <button type="button" class="star" data-rating="1"><i class="ph-bold ph-star"></i></button>
                                <button type="button" class="star" data-rating="2"><i class="ph-bold ph-star"></i></button>
                                <button type="button" class="star" data-rating="3"><i class="ph-bold ph-star"></i></button>
                                <button type="button" class="star" data-rating="4"><i class="ph-bold ph-star"></i></button>
                                <button type="button" class="star" data-rating="5"><i class="ph-bold ph-star"></i></button>
                            </div>
                            <input type="hidden" name="rating" id="feedback-rating" value="">
                        </div>

                        <div class="feedback-group">
                            <label for="feedback-name">Your Name</label>
                            <input type="text" id="feedback-name" name="name" placeholder="Enter your name" required>
                        </div>

                        <div class="feedback-group">
                            <label for="feedback-email">Email</label>
                            <input type="email" id="feedback-email" name="email" placeholder="your@email.com" required>
                        </div>

                        <div class="feedback-group">
                            <label for="feedback-message">Your Feedback</label>
                            <textarea id="feedback-message" name="message" rows="4" 
                                placeholder="What do you love? What can we improve? We're all ears..." required></textarea>
                        </div>

                        <button type="submit" class="feedback-btn primary submit-btn">
                            <i class="ph-bold ph-paper-plane-tilt"></i>
                            Send Feedback
                        </button>
                    </form>
                </div>

                <!-- Success State -->
                <div class="feedback-success">
                    <i class="ph-fill ph-check-circle"></i>
                    <h3>Thank You!</h3>
                    <p>Your feedback has been received. We truly appreciate you taking the time to help us improve.</p>
                    <button class="feedback-btn primary" onclick="FeedbackModal.close()">
                        Continue Reigning
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modalElement = modal;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Star rating
        document.querySelectorAll('.rating-stars .star').forEach(star => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
            });
        });

        // Close on overlay click
        document.querySelector('.feedback-overlay')?.addEventListener('click', () => {
            this.dismiss();
        });

        // Pre-fill user data if logged in
        this.prefillUserData();
    },

    /**
     * Pre-fill user data if logged in
     */
    prefillUserData() {
        try {
            const userStr = localStorage.getItem('kingdaily_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const nameInput = document.getElementById('feedback-name');
                const emailInput = document.getElementById('feedback-email');

                if (user.name && nameInput) nameInput.value = user.name;
                if (user.email && emailInput) emailInput.value = user.email;
            }
        } catch (e) {
            // Ignore errors
        }
    },

    /**
     * Set star rating
     */
    setRating(rating) {
        document.getElementById('feedback-rating').value = rating;

        document.querySelectorAll('.rating-stars .star').forEach((star, index) => {
            const starIcon = star.querySelector('i');
            if (index < rating) {
                star.classList.add('active');
                starIcon.className = 'ph-fill ph-star';
            } else {
                star.classList.remove('active');
                starIcon.className = 'ph-bold ph-star';
            }
        });
    },

    /**
     * Show the modal
     */
    show() {
        if (!this.modalElement) this.createModal();

        this.modalElement.classList.add('show');
        this.isExpanded = false;
        this.modalElement.classList.remove('expanded');

        // Update timestamp
        localStorage.setItem(this.config.storageKey, Date.now().toString());
    },

    /**
     * Trigger modal on page unload (if criteria met)
     */
    triggerOnExit() {
        if (this.shouldShowModal()) {
            this.show();
            return true;
        }
        return false;
    },

    /**
     * Expand the modal to show form
     */
    expand() {
        this.isExpanded = true;
        this.modalElement.classList.add('expanded');
        this.prefillUserData();
    },

    /**
     * Collapse back to initial state
     */
    collapse() {
        this.isExpanded = false;
        this.modalElement.classList.remove('expanded');
    },

    /**
     * Dismiss modal (Not Now)
     */
    dismiss() {
        this.close();
    },

    /**
     * Close the modal
     */
    close() {
        this.modalElement?.classList.remove('show', 'expanded', 'success');
    },

    /**
     * Submit feedback
     */
    async submit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('.submit-btn');

        // Get form data
        const formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            message: form.message.value.trim(),
            rating: parseInt(document.getElementById('feedback-rating').value) || null,
            persona: this.getPersona(),
            pageContext: window.location.pathname
        };

        // Validate
        if (!formData.name || !formData.email || !formData.message) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:3001/api'
                : '/api';

            const response = await fetch(`${apiUrl}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('kingdaily_token')
                        ? `Bearer ${localStorage.getItem('kingdaily_token')}`
                        : ''
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit feedback');
            }

            // Show success state
            this.modalElement.classList.add('success');

        } catch (error) {
            this.showError(error.message || 'Failed to submit feedback. Please try again.');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: message,
                duration: 3000,
                gravity: 'top',
                position: 'center',
                style: {
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderRadius: '0.75rem'
                }
            }).showToast();
        } else {
            alert(message);
        }
    },

    /**
     * Force show modal (for testing)
     */
    forceShow() {
        if (!this.modalElement) this.init();
        this.show();
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FeedbackModal.init());
} else {
    FeedbackModal.init();
}

// Make available globally
window.FeedbackModal = FeedbackModal;
