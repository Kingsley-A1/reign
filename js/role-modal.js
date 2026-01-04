/**
 * REIGN - Role Selection Modal
 * Shows after 40 seconds of activity for guest users
 */

const RoleModal = {
    timer: null,
    shown: false,
    activityStartTime: null,
    SHOW_DELAY: 40000, // 40 seconds

    /**
     * Initialize the role modal timer
     */
    init() {
        // Only show for guest users
        const isGuest = !Config.getUser();
        const dismissed = sessionStorage.getItem('reign_role_modal_dismissed');

        if (isGuest && !dismissed) {
            this.activityStartTime = Date.now();
            this.startTimer();
            this.trackActivity();
        }
    },

    /**
     * Start the 40-second timer
     */
    startTimer() {
        this.timer = setTimeout(() => {
            if (!this.shown) {
                this.show();
            }
        }, this.SHOW_DELAY);
    },

    /**
     * Track user activity (scroll, mouse move, clicks)
     */
    trackActivity() {
        let lastActivity = Date.now();

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        // Track various activities
        document.addEventListener('scroll', updateActivity, { passive: true });
        document.addEventListener('mousemove', updateActivity, { passive: true });
        document.addEventListener('click', updateActivity);
        document.addEventListener('keydown', updateActivity);
    },

    /**
     * Show the role selection modal
     */
    show() {
        if (this.shown) return;

        this.shown = true;

        const modal = document.createElement('div');
        modal.id = 'role-modal';
        modal.className = 'role-modal-overlay';
        modal.innerHTML = `
            <div class="role-modal-content">
                <button class="role-modal-close" onclick="RoleModal.dismiss()" aria-label="Close">
                    <i class="ph-bold ph-x"></i>
                </button>
                
                <div class="role-modal-header">
                    <i class="ph-fill ph-crown" style="font-size: 3rem; color: var(--royal-gold);"></i>
                    <h2>Choose Your Royal Path</h2>
                    <p>Select your role to unlock the full REIGN experience</p>
                </div>
                
                <div class="role-cards-container">
                    <a href="auth.html?role=king" class="role-card king-card">
                        <div class="role-card-icon">
                            <i class="ph-fill ph-crown"></i>
                        </div>
                        <h3>King</h3>
                        <p>Rule with strength, wisdom, and discipline</p>
                        <div class="role-card-gradient"></div>
                    </a>
                    
                    <a href="auth.html?role=queen" class="role-card queen-card">
                        <div class="role-card-icon">
                            <i class="ph-fill ph-crown"></i>
                        </div>
                        <h3>Queen</h3>
                        <p>Lead with grace, power, and elegance</p>
                        <div class="role-card-gradient"></div>
                    </a>
                </div>
                
                <button class="role-modal-dismiss-btn" onclick="RoleModal.dismiss()">
                    Maybe Later
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Fade in
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
    },

    /**
     * Dismiss the modal
     */
    dismiss() {
        const modal = document.getElementById('role-modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }

        // Mark as dismissed for this session
        sessionStorage.setItem('reign_role_modal_dismissed', 'true');
        this.shown = false;
    },

    /**
     * Clear the timer
     */
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RoleModal.init());
} else {
    RoleModal.init();
}
