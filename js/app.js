/**
 * King Daily - Main Application Controller
 * Coordinates all modules and handles user interactions
 */

const app = {
    data: null,

    /**
     * Initialize the application
     */
    init() {
        // Load stored data
        this.data = Storage.load();

        // Initialize time display
        Utils.updateHeaderTime();
        setInterval(() => Utils.updateHeaderTime(), 60000);

        // Initialize Chart.js defaults
        Charts.init();

        // Navigate to dashboard
        this.navigate('dashboard');

        console.log('King Daily initialized successfully.');
    },

    /**
     * Navigate to a view
     * @param {string} view - View name
     */
    navigate(view) {
        // Destroy existing charts before switching
        Charts.destroyAll();

        Router.navigate(view, () => {
            const container = document.getElementById('main-view');

            switch (view) {
                case 'dashboard':
                    Views.renderDashboard(container, this.data);
                    break;
                case 'morning':
                    Views.renderMorning(container, this.data);
                    break;
                case 'evening':
                    Views.renderEvening(container, this.data);
                    break;
                case 'archive':
                    Views.renderArchive(container, this.data);
                    break;
                case 'events':
                    Views.renderEvents(container, this.data);
                    break;
                default:
                    Views.renderDashboard(container, this.data);
            }
        });
    },

    // ==========================================
    // TASK MANAGEMENT
    // ==========================================

    /**
     * Open task modal for add/edit
     * @param {string} taskId - Task ID to edit (optional)
     */
    openTaskModal(taskId = null) {
        const modal = document.getElementById('modal');
        const modalContent = document.querySelector('.modal-content');

        let task = null;
        if (taskId) {
            const todayLog = Storage.getTodayLog(this.data);
            if (todayLog.morning && todayLog.morning.tasks) {
                task = todayLog.morning.tasks.find(t => t.id === taskId);
            }
        }

        modalContent.innerHTML = Views.getTaskModalHTML(task);
        modal.classList.add('active');
    },

    /**
     * Edit a task
     * @param {string} taskId - Task ID
     */
    editTask(taskId) {
        this.openTaskModal(taskId);
    },

    /**
     * Save task from modal form
     * @param {Event} e - Form submit event
     */
    saveTask(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskId = formData.get('taskId');

        const taskData = {
            id: taskId || Utils.generateId(),
            title: formData.get('title'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            estimatedTime: formData.get('estimatedTime') ? parseFloat(formData.get('estimatedTime')) : null,
            notes: formData.get('notes'),
            status: 'pending'
        };

        if (taskId) {
            // Update existing task
            Storage.updateTask(this.data, taskId, taskData);
            Utils.showToast('Task updated successfully.', 'gold');
        } else {
            // Add new task
            Storage.addTask(this.data, taskData);
            Utils.showToast('New task added!', 'gold');
        }

        this.closeModal();
        this.navigate('morning');
    },

    /**
     * Toggle task status (pending -> in-progress -> completed)
     * @param {string} taskId - Task ID
     */
    toggleTaskStatus(taskId) {
        Storage.toggleTaskStatus(this.data, taskId);

        // Re-render current view
        const currentView = Router.getCurrentView();
        this.navigate(currentView);
    },

    /**
     * Delete a task
     * @param {string} taskId - Task ID
     */
    deleteTask(taskId) {
        if (confirm('Remove this task from the battle plan?')) {
            Storage.deleteTask(this.data, taskId);
            Utils.showToast('Task removed.', 'indigo');
            this.navigate('morning');
        }
    },

    /**
     * Update session info (location, session name)
     */
    updateSessionInfo() {
        const sessionName = document.getElementById('session-name')?.value || '';
        const location = document.getElementById('session-location')?.value || '';

        const log = Storage.getTodayLog(this.data);
        if (!log.morning) {
            log.morning = { sessionName: '', location: '', tasks: [] };
        }

        log.morning.sessionName = sessionName;
        log.morning.location = location;
        Storage.save(this.data);
    },

    // ==========================================
    // EVENING REPORT
    // ==========================================

    /**
     * Set rating value (mood or energy)
     * @param {string} type - 'mood' or 'energy'
     * @param {number} value - Rating value 1-5
     */
    setRating(type, value) {
        // Update hidden input
        const inputId = type === 'mood' ? 'mood-input' : 'energy-input';
        const input = document.getElementById(inputId);
        if (input) input.value = value;

        // Update button states
        for (let i = 1; i <= 5; i++) {
            const btn = document.querySelector(`[data-rating="${type}-${i}"]`);
            if (btn) {
                btn.classList.toggle('active', i === value);
            }
        }
    },

    /**
     * Save evening report
     * @param {Event} e - Form submit event
     */
    saveEvening(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const eveningData = {
            mood: parseInt(formData.get('mood')) || null,
            energyLevel: parseInt(formData.get('energyLevel')) || null,
            success: formData.get('success'),
            challenges: formData.get('challenges'),
            strategy: formData.get('strategy')
        };

        Storage.saveEvening(this.data, eveningData);
        Utils.showToast('Evening report filed. Rest well, King.', 'indigo');
        this.navigate('dashboard');
    },

    // ==========================================
    // EVENT MANAGEMENT
    // ==========================================

    /**
     * Open event modal for add/edit
     * @param {number} index - Event index to edit (-1 for new)
     */
    openEventModal(index = -1) {
        const modal = document.getElementById('modal');
        const modalContent = document.querySelector('.modal-content');

        let event = null;
        if (index > -1 && this.data.events[index]) {
            event = this.data.events[index];
        }

        modalContent.innerHTML = Views.getEventModalHTML(event, index);
        modal.classList.add('active');
    },

    /**
     * Edit an event
     * @param {number} index - Event index
     */
    editEvent(index) {
        this.openEventModal(index);
    },

    /**
     * Save event from modal form
     * @param {Event} e - Form submit event
     */
    saveEvent(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const index = parseInt(formData.get('eventIndex'));

        const eventData = {
            title: formData.get('title'),
            date: formData.get('date'),
            type: formData.get('type')
        };

        if (index > -1) {
            Storage.updateEvent(this.data, index, eventData);
            Utils.showToast('Decree updated.', 'gold');
        } else {
            Storage.addEvent(this.data, eventData);
            Utils.showToast('Decree declared.', 'gold');
        }

        this.closeModal();
        this.navigate('events');
    },

    /**
     * Delete an event
     * @param {number} index - Event index
     */
    deleteEvent(index) {
        if (confirm('Revoke this decree?')) {
            Storage.deleteEvent(this.data, index);
            Utils.showToast('Decree revoked.', 'indigo');
            this.navigate('events');
        }
    },

    // ==========================================
    // MODAL MANAGEMENT
    // ==========================================

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
    },

    // ==========================================
    // DATA MANAGEMENT
    // ==========================================

    /**
     * Export data backup
     */
    exportData() {
        Storage.exportData(this.data);
    },

    /**
     * Import data from file
     * @param {HTMLInputElement} input - File input element
     */
    importData(input) {
        const file = input.files[0];
        Storage.importData(file, (importedData) => {
            this.data = importedData;
            this.navigate('dashboard');
        });
        input.value = ''; // Reset file input
    },

    /**
     * Reset all data
     */
    resetData() {
        if (confirm('Abdicate the throne? This clears ALL records irrecoverably.')) {
            Storage.clear();
            location.reload();
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        app.closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        app.closeModal();
    }
});

// Make app globally available
window.app = app;
