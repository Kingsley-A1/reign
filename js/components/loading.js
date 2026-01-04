/**
 * REIGN - Global Loading Component
 * Beautiful loading states for the entire platform
 */

const LoadingComponent = {
    overlay: null,

    /**
     * Show loading overlay
     * @param {string} type - Type of loader: 'spinner', 'skeleton', 'bar'
     * @param {string} message - Optional message to display
     */
    show(type = 'spinner', message = '') {
        // Remove existing overlay if any
        this.hide();

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = this.getLoaderHTML(type, message);

        document.body.appendChild(this.overlay);

        // Fade in
        requestAnimationFrame(() => {
            this.overlay.classList.add('visible');
        });
    },

    /**
     * Hide loading overlay
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('visible');
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
            }, 300);
        }
    },

    /**
     * Get HTML for different loader types
     */
    getLoaderHTML(type, message) {
        const user = Config.getUser();
        const isQueen = user?.role === 'queen';

        switch (type) {
            case 'spinner':
                return `
                    <div class="loading-content">
                        <div class="loading-spinner">
                            <i class="ph-fill ph-crown"></i>
                        </div>
                        ${message ? `<p class="loading-message">${message}</p>` : ''}
                    </div>
                `;

            case 'bar':
                return `
                    <div class="loading-content">
                        <div class="loading-bar">
                            <div class="loading-bar-fill"></div>
                        </div>
                        ${message ? `<p class="loading-message">${message}</p>` : ''}
                    </div>
                `;

            case 'skeleton':
                return `
                    <div class="loading-skeleton">
                        <div class="skeleton-header"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>
                    </div>
                `;

            default:
                return this.getLoaderHTML('spinner', message);
        }
    },

    /**
     * Show inline skeleton for specific element
     * @param {string|HTMLElement} target - Element or selector
     */
    showSkeleton(target) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (element) {
            element.classList.add('loading-skeleton-state');
            element.setAttribute('aria-busy', 'true');
        }
    },

    /**
     * Hide inline skeleton
     * @param {string|HTMLElement} target - Element or selector
     */
    hideSkeleton(target) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (element) {
            element.classList.remove('loading-skeleton-state');
            element.removeAttribute('aria-busy');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingComponent;
}
