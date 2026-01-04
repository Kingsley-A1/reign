/**
 * REIGN - Analytics Module
 * Comprehensive analytics and progress tracking
 */

const Analytics = {
    /**
     * Calculate comprehensive analytics
     * @param {Object} data - App data
     * @returns {Object} Analytics summary
     */
    getComprehensiveAnalytics(data) {
        const logs = data.logs || {};
        const now = new Date();

        return {
            overall: this.getOverallStats(logs),
            weekly: this.getWeeklyStats(logs, now),
            monthly: this.getMonthlyStats(logs, now),
            categories: this.getCategoryBreakdown(logs),
            streaks: this.getStreakInfo(logs, now),
            trends: this.getTrends(logs, now)
        };
    },

    /**
     * Get overall statistics
     * @param {Object} logs - All logs
     * @returns {Object} Overall stats
     */
    getOverallStats(logs) {
        const totalDays = Object.keys(logs).length;
        let totalTasks = 0;
        let completedTasks = 0;
        let totalHours = 0;

        Object.values(logs).forEach(log => {
            if (log.morning?.tasks) {
                totalTasks += log.morning.tasks.length;
                completedTasks += log.morning.tasks.filter(t => t.status === 'completed').length;
                totalHours += log.morning.tasks.reduce((sum, t) => sum + (parseFloat(t.estimatedTime) || 0), 0);
            }
        });

        return {
            totalDays,
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            totalHours: Math.round(totalHours * 10) / 10,
            avgTasksPerDay: totalDays > 0 ? Math.round((totalTasks / totalDays) * 10) / 10 : 0
        };
    },

    /**
     * Get weekly statistics
     * @param {Object} logs - All logs
     * @param {Date} now - Current date
     * @returns {Object} Weekly stats
     */
    getWeeklyStats(logs, now) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekLogs = this.filterLogsByDateRange(logs, weekAgo, now);
        return this.getOverallStats(weekLogs);
    },

    /**
     * Get monthly statistics
     * @param {Object} logs - All logs
     * @param {Date} now - Current date
     * @returns {Object} Monthly stats
     */
    getMonthlyStats(logs, now) {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthLogs = this.filterLogsByDateRange(logs, monthAgo, now);
        return this.getOverallStats(monthLogs);
    },

    /**
     * Filter logs by date range
     * @param {Object} logs - All logs
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Object} Filtered logs
     */
    filterLogsByDateRange(logs, startDate, endDate) {
        const filtered = {};
        Object.entries(logs).forEach(([date, log]) => {
            const logDate = new Date(date);
            if (logDate >= startDate && logDate <= endDate) {
                filtered[date] = log;
            }
        });
        return filtered;
    },

    /**
     * Get category breakdown
     * @param {Object} logs - All logs
     * @returns {Object} Category stats
     */
    getCategoryBreakdown(logs) {
        const categories = {};

        Object.values(logs).forEach(log => {
            if (log.morning?.tasks) {
                log.morning.tasks.forEach(task => {
                    const cat = task.category || 'Uncategorized';
                    if (!categories[cat]) {
                        categories[cat] = { count: 0, completed: 0, hours: 0 };
                    }
                    categories[cat].count++;
                    if (task.status === 'completed') categories[cat].completed++;
                    categories[cat].hours += parseFloat(task.estimatedTime) || 0;
                });
            }
        });

        return categories;
    },

    /**
     * Get streak information
     * @param {Object} logs - All logs
     * @param {Date} now - Current date
     * @returns {Object} Streak info
     */
    getStreakInfo(logs, now) {
        const dates = Object.keys(logs).sort().reverse();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Calculate current streak
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (dates.includes(today) || dates.includes(yesterday)) {
            let checkDate = dates.includes(today) ? new Date(now) : new Date(now.getTime() - 24 * 60 * 60 * 1000);

            for (let date of dates) {
                const logDate = new Date(date);
                const expectedDate = checkDate.toISOString().split('T')[0];

                if (date === expectedDate) {
                    currentStreak++;
                    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const current = new Date(dates[i]);
                const previous = new Date(dates[i - 1]);
                const diffDays = Math.round((previous - current) / (24 * 60 * 60 * 1000));

                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return { currentStreak, longestStreak };
    },

    /**
     * Get 30-day trends
     * @param {Object} logs - All logs
     * @param {Date} now - Current date
     * @returns {Array} Trend data
     */
    getTrends(logs, now) {
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            const log = logs[dateKey];

            const tasks = log?.morning?.tasks || [];
            const completed = tasks.filter(t => t.status === 'completed').length;

            last30Days.push({
                date: dateKey,
                total: tasks.length,
                completed,
                rate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
            });
        }

        return last30Days;
    },

    /**
     * Export analytics data
     * @param {Object} analytics - Analytics data
     * @param {string} format - 'json' or 'csv'
     */
    exportData(analytics, format = 'json') {
        const dataStr = format === 'json'
            ? JSON.stringify(analytics, null, 2)
            : this.convertToCSV(analytics);

        const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reign-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        URL.revokeObjectURL(url);

        Utils.showToast(`Analytics exported as ${format.toUpperCase()}`, 'success');
    },

    /**
     * Convert analytics to CSV format
     * @param {Object} analytics - Analytics data
     * @returns {string} CSV string
     */
    convertToCSV(analytics) {
        let csv = 'Metric,Value\n';
        csv += `Total Days,${analytics.overall.totalDays}\n`;
        csv += `Total Tasks,${analytics.overall.totalTasks}\n`;
        csv += `Completed Tasks,${analytics.overall.completedTasks}\n`;
        csv += `Completion Rate,${analytics.overall.completionRate}%\n`;
        csv += `Total Hours,${analytics.overall.totalHours}\n`;
        csv += `Current Streak,${analytics.streaks.currentStreak}\n`;
        csv += `Longest Streak,${analytics.streaks.longestStreak}\n`;
        csv += `\nWeekly Stats\n`;
        csv += `Weekly Tasks,${analytics.weekly.totalTasks}\n`;
        csv += `Weekly Completed,${analytics.weekly.completedTasks}\n`;
        csv += `Weekly Rate,${analytics.weekly.completionRate}%\n`;
        csv += `\nMonthly Stats\n`;
        csv += `Monthly Tasks,${analytics.monthly.totalTasks}\n`;
        csv += `Monthly Completed,${analytics.monthly.completedTasks}\n`;
        csv += `Monthly Rate,${analytics.monthly.completionRate}%\n`;
        return csv;
    }
};

// Make available globally
window.Analytics = Analytics;
