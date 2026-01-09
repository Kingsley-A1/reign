/**
 * King Daily - Utilities Module
 * Helper functions for common operations
 */

const Utils = {
    /**
     * Sanitize string to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitize(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Generate UUID
     * @returns {string} UUID string
     */
    generateId() {
        return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        );
    },

    /**
     * Format time display
     * @returns {string} Formatted time
     */
    formatTime() {
        return new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format date display
     * @param {Date|string} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const defaults = {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        };
        return d.toLocaleDateString(undefined, { ...defaults, ...options });
    },

    /**
     * Format date for display in cards
     * @param {string} dateStr - ISO date string
     * @returns {Object} { day, month }
     */
    formatDateParts(dateStr) {
        const d = new Date(dateStr);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString(undefined, { month: 'short' })
        };
    },

    /**
     * Check if date is today
     * @param {string} dateStr - ISO date string
     * @returns {boolean}
     */
    isToday(dateStr) {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    },

    /**
     * Check if date is in the past
     * @param {string} dateStr - ISO date string
     * @returns {boolean}
     */
    isPast(dateStr) {
        const today = new Date().setHours(0, 0, 0, 0);
        return new Date(dateStr) < today;
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'gold', 'indigo', 'success', 'danger'
     */
    showToast(message, type = 'gold') {
        if (typeof Toastify === 'undefined') {
            console.warn('Toastify not available; toast suppressed:', message);
            return;
        }
        const isQueen = document.body.classList.contains('queen-theme');
        const goldGradient = isQueen 
            ? 'linear-gradient(to right, #b76e79, #9a525c)' 
            : 'linear-gradient(to right, #D4AF37, #C5A028)';
        const goldTextColor = isQueen ? '#1a0a18' : '#0B0F19';
        
        const colors = {
            gold: {
                background: goldGradient,
                color: goldTextColor
            },
            indigo: {
                background: '#4f46e5',
                color: '#fff'
            },
            success: {
                background: '#10b981',
                color: '#fff'
            },
            danger: {
                background: '#ef4444',
                color: '#fff'
            }
        };

        const style = colors[type] || colors.gold;

        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'center',
            style: {
                background: style.background,
                color: style.color,
                fontWeight: 'bold',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                fontFamily: "'Manrope', sans-serif"
            }
        }).showToast();
    },

    /**
     * Update header time display
     */
    updateHeaderTime() {
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');

        if (timeEl) {
            timeEl.textContent = this.formatTime();
        }
        if (dateEl) {
            dateEl.textContent = this.formatDate(new Date());
        }
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get priority label and class
     * @param {string} priority - 'high', 'medium', 'low'
     * @returns {Object} { label, class }
     */
    getPriorityInfo(priority) {
        const info = {
            high: { label: 'High', class: 'priority-high' },
            medium: { label: 'Medium', class: 'priority-medium' },
            low: { label: 'Low', class: 'priority-low' }
        };
        return info[priority] || info.medium;
    },

    /**
     * Get status label and class
     * @param {string} status - Task status
     * @returns {Object} { label, class }
     */
    getStatusInfo(status) {
        const info = {
            'pending': { label: 'Pending', class: 'status-pending' },
            'in-progress': { label: 'In Progress', class: 'status-in-progress' },
            'completed': { label: 'Completed', class: 'status-completed' },
            'deferred': { label: 'Deferred', class: 'status-deferred' }
        };
        return info[status] || info.pending;
    },

    /**
     * Get event border color class
     * @param {string} type - Event type
     * @returns {string} CSS class
     */
    getEventColor(type) {
        const colors = {
            'Meeting': 'border-blue',
            'Birthday': 'border-pink',
            'Deadline': 'border-red',
            'Social': 'border-indigo'
        };
        return colors[type] || 'border-gold';
    },

    /**
     * Category icons mapping
     */
    categoryIcons: {
        'Deep Work': 'ph-duotone ph-brain',
        'Strategy': 'ph-duotone ph-strategy',
        'Meeting': 'ph-duotone ph-users-three',
        'Learning': 'ph-duotone ph-books',
        'Health': 'ph-duotone ph-heartbeat',
        'Admin': 'ph-duotone ph-clipboard-text'
    },

    /**
     * Get icon for category
     * @param {string} category - Category name
     * @returns {string} Icon class
     */
    getCategoryIcon(category) {
        return this.categoryIcons[category] || 'ph-duotone ph-circle';
    },

    /**
     * Inspirational quotes
     */
    quotes: [
        "We suffer more often in imagination than in reality. – Seneca",
        "Waste no more time arguing about what a good man should be. Be one. – Marcus Aurelius",
        "Discipline is the bridge between goals and accomplishment. – Jim Rohn",
        "The key is not to prioritize what's on your schedule, but to schedule your priorities. – Stephen Covey",
        "He who has a why to live can bear almost any how. – Nietzsche",
        "The only way to do great work is to love what you do. – Steve Jobs",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. – Churchill",
        "Your time is limited, don't waste it living someone else's life. – Steve Jobs",
        "It is not that we have a short time to live, but that we waste a lot of it. – Seneca",
        "The best time to plant a tree was 20 years ago. The second best time is now. – Chinese Proverb",
        "You have power over your mind – not outside events. Realize this, and you will find strength. – Marcus Aurelius",
        "The man who moves a mountain begins by carrying away small stones. – Confucius",
        "Do not go where the path may lead, go instead where there is no path and leave a trail. – Ralph Waldo Emerson",
        "Greatness is not in never falling, but in rising every time we fall. – Nelson Mandela",
        "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times. – Bruce Lee",
        "The impediment to action advances action. What stands in the way becomes the way. – Marcus Aurelius",
        "First say to yourself what you would be; and then do what you have to do. – Epictetus",
        "It does not matter how slowly you go as long as you do not stop. – Confucius",
        "Difficulties strengthen the mind, as labor does the body. – Seneca",
        "Begin at once to live, and count each separate day as a separate life. – Seneca",
        "The secret of getting ahead is getting started. – Mark Twain",
        "What lies behind us and what lies before us are tiny matters compared to what lies within us. – Ralph Waldo Emerson",
        "Energy and persistence conquer all things. – Benjamin Franklin",
        "The world makes way for the man who knows where he is going. – Ralph Waldo Emerson"
    ],

    /**
     * Current quote index for rotation
     */
    currentQuoteIndex: 0,

    /**
     * Quote rotation interval ID
     */
    quoteRotationInterval: null,

    /**
     * Get random quote
     * @returns {string} Quote
     */
    getRandomQuote() {
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    },

    /**
     * Get next quote in sequence (for rotation)
     * @returns {string} Quote
     */
    getNextQuote() {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
        return this.quotes[this.currentQuoteIndex];
    },

    /**
     * Parse quote into text and author
     * @param {string} fullQuote - Full quote string
     * @returns {Object} { text, author }
     */
    parseQuote(fullQuote) {
        const parts = fullQuote.split(' – ');
        return {
            text: parts[0],
            author: parts[1] || ''
        };
    },

    /**
     * Start quote rotation (every 40 seconds)
     * Call this on dashboard/landing page load
     */
    startQuoteRotation() {
        // Clear any existing interval
        if (this.quoteRotationInterval) {
            clearInterval(this.quoteRotationInterval);
        }

        // Set initial random index
        this.currentQuoteIndex = Math.floor(Math.random() * this.quotes.length);

        // Rotate every 40 seconds
        this.quoteRotationInterval = setInterval(() => {
            this.rotateQuote();
        }, 40000);
    },

    /**
     * Stop quote rotation
     */
    stopQuoteRotation() {
        if (this.quoteRotationInterval) {
            clearInterval(this.quoteRotationInterval);
            this.quoteRotationInterval = null;
        }
    },

    /**
     * Rotate to next quote with fade animation
     */
    rotateQuote() {
        const quoteContainer = document.getElementById('quote-container');
        const quoteTextEl = document.getElementById('quote-text');
        const quoteAuthorEl = document.getElementById('quote-author');

        if (!quoteContainer || !quoteTextEl) return;

        // Fade out
        quoteContainer.style.opacity = '0';

        setTimeout(() => {
            // Get next quote
            const nextQuote = this.getNextQuote();
            const { text, author } = this.parseQuote(nextQuote);

            // Update content
            quoteTextEl.textContent = `"${text}"`;
            
            if (quoteAuthorEl) {
                quoteAuthorEl.textContent = author ? `— ${author}` : '';
                quoteAuthorEl.style.display = author ? 'block' : 'none';
            } else if (author) {
                // Create author element if it doesn't exist
                const newAuthorEl = document.createElement('p');
                newAuthorEl.className = 'quote-author';
                newAuthorEl.id = 'quote-author';
                newAuthorEl.textContent = `— ${author}`;
                quoteTextEl.parentNode.appendChild(newAuthorEl);
            }

            // Fade in
            quoteContainer.style.opacity = '1';
        }, 300);
    },

    /**
     * Get time-based greeting
     * @returns {string} Greeting based on current hour
     */
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    },

    /**
     * Get user's first name
     * @returns {string} User's first name or empty string
     */
    getUserName() {
        const user = Config.getUser();
        if (user && user.name) {
            return user.name.split(' ')[0];
        }
        return '';
    },

    /**
     * Get personalized greeting with role and name
     * @returns {string} Complete personalized greeting
     */
    getPersonalizedGreeting() {
        const greeting = this.getGreeting();
        const user = Config.getUser();
        const data = Storage.getData();
        const role = data.settings?.role;

        // Case 1: Registered user with role
        if (user && user.name) {
            const firstName = user.name.split(' ')[0];
            const roleTitle = role === 'queen' ? 'Queen' : 'King';
            return `${greeting} ${roleTitle} ${firstName}`;
        }

        // Case 2: Role selected but not registered
        if (role && !user) {
            const roleTitle = role === 'queen' ? 'Queen' : 'King';
            return `${greeting} ${roleTitle}`;
        }

        // Case 3: Not registered, no role
        return greeting;
    }
};

// Make available globally
window.Utils = Utils;
