/**
 * King Daily - Storage Module
 * Handles all data persistence with localStorage
 */

const Storage = {
    STORAGE_KEY: 'kingDailyData',
    
    // Default data structure
    defaultData: {
        logs: {},      // Daily logs keyed by date "YYYY-MM-DD"
        events: [],    // Calendar events
        settings: {
            theme: 'dark',
            userName: 'King'
        }
    },

    /**
     * Load data from localStorage
     * @returns {Object} The stored data or default structure
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Merge with defaults to ensure all keys exist
                return { ...this.defaultData, ...data };
            }
            return { ...this.defaultData };
        } catch (e) {
            console.error('Storage load error:', e);
            return { ...this.defaultData };
        }
    },

    /**
     * Save data to localStorage
     * @param {Object} data - The data to save
     * @returns {boolean} Success status
     */
    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            Utils.showToast('Storage full! Export data then clear.', 'danger');
            return false;
        }
    },

    /**
     * Clear all stored data
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Get today's date in ISO format
     * @returns {string} Date string "YYYY-MM-DD"
     */
    getToday() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Get or create today's log entry
     * @param {Object} data - The app data object
     * @returns {Object} Today's log
     */
    getTodayLog(data) {
        const today = this.getToday();
        if (!data.logs[today]) {
            data.logs[today] = {
                morning: null,
                evening: null
            };
        }
        return data.logs[today];
    },

    /**
     * Save morning data
     * @param {Object} data - App data
     * @param {Object} morningData - Morning log data
     */
    saveMorning(data, morningData) {
        const today = this.getToday();
        if (!data.logs[today]) {
            data.logs[today] = { morning: null, evening: null };
        }
        data.logs[today].morning = morningData;
        this.save(data);
    },

    /**
     * Save evening data
     * @param {Object} data - App data
     * @param {Object} eveningData - Evening log data
     */
    saveEvening(data, eveningData) {
        const today = this.getToday();
        if (!data.logs[today]) {
            data.logs[today] = { morning: null, evening: null };
        }
        data.logs[today].evening = eveningData;
        this.save(data);
    },

    /**
     * Add a new task to today's morning
     * @param {Object} data - App data
     * @param {Object} task - Task object
     */
    addTask(data, task) {
        const log = this.getTodayLog(data);
        if (!log.morning) {
            log.morning = {
                sessionName: '',
                location: '',
                startTime: '',
                tasks: []
            };
        }
        if (!log.morning.tasks) {
            log.morning.tasks = [];
        }
        log.morning.tasks.push(task);
        this.save(data);
    },

    /**
     * Update a task
     * @param {Object} data - App data
     * @param {string} taskId - Task ID
     * @param {Object} updates - Fields to update
     */
    updateTask(data, taskId, updates) {
        const log = this.getTodayLog(data);
        if (log.morning && log.morning.tasks) {
            const taskIndex = log.morning.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                log.morning.tasks[taskIndex] = { ...log.morning.tasks[taskIndex], ...updates };
                this.save(data);
            }
        }
    },

    /**
     * Delete a task
     * @param {Object} data - App data
     * @param {string} taskId - Task ID
     */
    deleteTask(data, taskId) {
        const log = this.getTodayLog(data);
        if (log.morning && log.morning.tasks) {
            log.morning.tasks = log.morning.tasks.filter(t => t.id !== taskId);
            this.save(data);
        }
    },

    /**
     * Toggle task status
     * @param {Object} data - App data
     * @param {string} taskId - Task ID
     */
    toggleTaskStatus(data, taskId) {
        const log = this.getTodayLog(data);
        if (log.morning && log.morning.tasks) {
            const task = log.morning.tasks.find(t => t.id === taskId);
            if (task) {
                // Cycle: pending -> in-progress -> completed -> pending
                const statusCycle = ['pending', 'in-progress', 'completed'];
                const currentIndex = statusCycle.indexOf(task.status);
                task.status = statusCycle[(currentIndex + 1) % statusCycle.length];
                this.save(data);
            }
        }
    },

    /**
     * Add an event
     * @param {Object} data - App data
     * @param {Object} event - Event object
     */
    addEvent(data, event) {
        data.events.push(event);
        this.save(data);
    },

    /**
     * Update an event
     * @param {Object} data - App data
     * @param {number} index - Event index
     * @param {Object} eventData - Updated event data
     */
    updateEvent(data, index, eventData) {
        if (data.events[index]) {
            data.events[index] = eventData;
            this.save(data);
        }
    },

    /**
     * Delete an event
     * @param {Object} data - App data
     * @param {number} index - Event index
     */
    deleteEvent(data, index) {
        data.events.splice(index, 1);
        this.save(data);
    },

    /**
     * Export data as JSON file
     * @param {Object} data - App data
     */
    exportData(data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `king_daily_backup_${this.getToday()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        Utils.showToast('Backup exported successfully.', 'gold');
    },

    /**
     * Import data from JSON file
     * @param {File} file - The JSON file
     * @param {Function} callback - Callback on success
     */
    importData(file, callback) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.logs && imported.events !== undefined) {
                    this.save(imported);
                    Utils.showToast('Data restored successfully!', 'gold');
                    if (callback) callback(imported);
                } else {
                    throw new Error('Invalid format');
                }
            } catch (err) {
                Utils.showToast('Invalid backup file format.', 'danger');
            }
        };
        reader.readAsText(file);
    },

    /**
     * Calculate analytics from stored data
     * @param {Object} data - App data
     * @returns {Object} Analytics summary
     */
    getAnalytics(data) {
        const logs = Object.entries(data.logs);
        const totalDays = logs.length;
        
        let morningCount = 0;
        let eveningCount = 0;
        let totalTasks = 0;
        let completedTasks = 0;
        let totalHours = 0;
        let hoursCount = 0;
        
        const categoryHours = {};
        
        logs.forEach(([date, log]) => {
            if (log.morning) {
                morningCount++;
                
                if (log.morning.tasks) {
                    log.morning.tasks.forEach(task => {
                        totalTasks++;
                        if (task.status === 'completed') {
                            completedTasks++;
                        }
                        if (task.estimatedTime) {
                            const hours = parseFloat(task.estimatedTime);
                            if (!isNaN(hours)) {
                                totalHours += hours;
                                hoursCount++;
                                
                                const cat = task.category || 'Uncategorized';
                                categoryHours[cat] = (categoryHours[cat] || 0) + hours;
                            }
                        }
                    });
                }
            }
            if (log.evening) {
                eveningCount++;
            }
        });
        
        return {
            totalDays,
            morningCount,
            eveningCount,
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            avgHours: hoursCount > 0 ? (totalHours / hoursCount).toFixed(1) : 0,
            totalHours: totalHours.toFixed(1),
            categoryHours
        };
    },

    /**
     * Get last 7 days of task data
     * @param {Object} data - App data
     * @returns {Array} Array of daily stats
     */
    getLast7Days(data) {
        const stats = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            const log = data.logs[iso];
            let hours = 0;
            let completed = 0;
            let total = 0;
            
            if (log && log.morning && log.morning.tasks) {
                log.morning.tasks.forEach(task => {
                    total++;
                    if (task.status === 'completed') completed++;
                    if (task.estimatedTime) {
                        hours += parseFloat(task.estimatedTime) || 0;
                    }
                });
            }
            
            stats.push({
                date: iso,
                label: dayLabel,
                hours,
                completed,
                total
            });
        }
        
        return stats;
    }
};

// Make available globally
window.Storage = Storage;
