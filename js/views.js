/**
 * King Daily - Views Module
 * All UI rendering templates
 */

const Views = {
    /**
     * Render Dashboard View
     * @param {HTMLElement} container - Container element
     * @param {Object} data - App data
     */
    renderDashboard(container, data) {
        const today = Storage.getToday();
        const todayLog = data.logs[today] || { morning: null, evening: null };
        const quote = Utils.getRandomQuote();
        const analytics = Storage.getAnalytics(data);
        const last7Days = Storage.getLast7Days(data);

        // Calculate today's progress
        let todayTasks = 0;
        let todayCompleted = 0;
        if (todayLog.morning && todayLog.morning.tasks) {
            todayTasks = todayLog.morning.tasks.length;
            todayCompleted = todayLog.morning.tasks.filter(t => t.status === 'completed').length;
        }
        const progressPercent = todayTasks > 0 ? Math.round((todayCompleted / todayTasks) * 100) : 0;

        container.innerHTML = `
            <div class="page-header mb-8">
                <h2 class="page-title">The Kingdom at a Glance</h2>
                <p class="quote-block">"${quote}"</p>
            </div>

            <!-- Today's Progress -->
            ${todayTasks > 0 ? `
                <div class="glass-card p-6 mb-6">
                    <div class="progress-container">
                        <div class="progress-header">
                            <span class="progress-label">Today's Conquest</span>
                            <span class="progress-value">${todayCompleted}/${todayTasks} Tasks (${progressPercent}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Status Cards -->
            <div class="grid grid-1 grid-3 mb-8">
                <div class="glass-card stat-card">
                    <div class="stat-icon" style="position: absolute; right: 1rem; top: 1rem; opacity: 0.1;">
                        <i class="ph-fill ph-sun text-gold" style="font-size: 3rem;"></i>
                    </div>
                    <p class="stat-label">Morning Protocol</p>
                    ${todayLog.morning
                ? `<p class="text-success" style="font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="ph-bold ph-check-circle"></i> ${todayTasks} Tasks Set
                           </p>`
                : `<button onclick="app.navigate('morning')" class="text-gold" style="background: none; border: none; padding: 0; cursor: pointer; font-size: 0.875rem;">
                            Begin Protocol →
                           </button>`
            }
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon" style="position: absolute; right: 1rem; top: 1rem; opacity: 0.1;">
                        <i class="ph-fill ph-moon text-gold" style="font-size: 3rem;"></i>
                    </div>
                    <p class="stat-label">Evening Report</p>
                    ${todayLog.evening
                ? `<p class="text-success" style="font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="ph-bold ph-check-circle"></i> Submitted
                           </p>`
                : `<button onclick="app.navigate('evening')" class="text-gold" style="background: none; border: none; padding: 0; cursor: pointer; font-size: 0.875rem;">
                            Submit Report →
                           </button>`
            }
                </div>

                <div class="glass-card stat-card">
                    <p class="stat-label">Total Entries</p>
                    <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                        <span class="stat-value">${analytics.totalDays}</span>
                        <span class="stat-sublabel">Days Logged</span>
                    </div>
                </div>
            </div>

            <!-- Today's Tasks Quick View -->
            ${todayLog.morning && todayLog.morning.tasks && todayLog.morning.tasks.length > 0 ? `
                <div class="glass-card p-6 mb-8">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-family: var(--font-serif); font-weight: 700; color: white;">Today's Battles</h3>
                        ${todayLog.morning.sessionName ? `
                            <span class="session-name">
                                <i class="ph-bold ph-flag-banner"></i>
                                ${Utils.sanitize(todayLog.morning.sessionName)}
                            </span>
                        ` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${todayLog.morning.tasks.slice(0, 5).map(task => this.renderTaskCard(task, true)).join('')}
                        ${todayLog.morning.tasks.length > 5 ? `
                            <button onclick="app.navigate('morning')" class="btn btn-outline btn-sm" style="margin-top: 0.5rem;">
                                View All ${todayLog.morning.tasks.length} Tasks
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Charts -->
            <div class="grid grid-1 grid-lg-2 mb-8">
                <div class="glass-card p-6">
                    <h3 style="font-family: var(--font-serif); font-weight: 700; color: white; margin-bottom: 1rem;">Focus Intensity (Hours)</h3>
                    <div class="chart-container">
                        <canvas id="focusChart"></canvas>
                    </div>
                </div>
                <div class="glass-card p-6">
                    <h3 style="font-family: var(--font-serif); font-weight: 700; color: white; margin-bottom: 1rem;">Discipline Ratio</h3>
                    <div class="chart-container">
                        <canvas id="disciplineChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Category Breakdown -->
            ${Object.keys(analytics.categoryHours).length > 0 ? `
                <div class="glass-card p-6 mb-8">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-family: var(--font-serif); font-weight: 700; color: white;">Time Allocation by Category</h3>
                        <span class="text-muted" style="font-size: 0.75rem;">Avg: ${analytics.avgHours} hrs/session</span>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
            ` : ''}

            <!-- Upcoming Events -->
            <div class="glass-card p-6">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="font-family: var(--font-serif); font-weight: 700; color: white;">Impending Decrees</h3>
                    <button onclick="app.navigate('events')" class="text-gold" style="background: none; border: none; cursor: pointer; font-size: 0.75rem;">
                        View All
                    </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${this.renderUpcomingEvents(data.events)}
                </div>
            </div>
        `;

        // Initialize charts after render
        setTimeout(() => {
            Charts.destroyAll();
            Charts.createFocusChart('focusChart', last7Days);
            Charts.createDisciplineChart('disciplineChart', analytics);
            if (Object.keys(analytics.categoryHours).length > 0) {
                Charts.createCategoryChart('categoryChart', analytics.categoryHours);
            }
        }, 0);
    },

    /**
     * Render a single task card
     * @param {Object} task - Task object
     * @param {boolean} compact - Whether to show compact version
     * @returns {string} HTML string
     */
    renderTaskCard(task, compact = false) {
        const priorityInfo = Utils.getPriorityInfo(task.priority);
        const statusInfo = Utils.getStatusInfo(task.status);

        const checkboxClass = task.status === 'completed' ? 'checked' :
            task.status === 'in-progress' ? 'in-progress' : '';

        return `
            <div class="task-card ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${checkboxClass}" onclick="app.toggleTaskStatus('${task.id}')">
                    ${task.status === 'completed' ? '<i class="ph-bold ph-check" style="color: white;"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-title">${Utils.sanitize(task.title)}</span>
                    </div>
                    <div class="task-meta">
                        <span class="task-badge ${priorityInfo.class}">${priorityInfo.label}</span>
                        <span class="task-badge">${Utils.sanitize(task.category)}</span>
                        ${task.estimatedTime ? `
                            <span class="task-time">
                                <i class="ph-bold ph-clock"></i>
                                ${task.estimatedTime}h
                            </span>
                        ` : ''}
                    </div>
                </div>
                ${!compact ? `
                    <div class="task-actions">
                        <button class="task-action-btn" onclick="app.editTask('${task.id}')" title="Edit">
                            <i class="ph-bold ph-pencil-simple"></i>
                        </button>
                        <button class="task-action-btn delete" onclick="app.deleteTask('${task.id}')" title="Delete">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Render upcoming events preview
     * @param {Array} events - Events array
     * @returns {string} HTML string
     */
    renderUpcomingEvents(events) {
        const upcoming = events
            .filter(e => !Utils.isPast(e.date))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        if (upcoming.length === 0) {
            return '<p class="text-muted" style="font-style: italic;">The schedule is clear, my King.</p>';
        }

        return upcoming.map(e => {
            const dateParts = Utils.formatDateParts(e.date);
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: rgba(15, 23, 42, 0.5); border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="text-align: center; background: var(--royal-gold-10); padding: 0.5rem 0.75rem; border-radius: 0.375rem; border: 1px solid var(--royal-gold-20);">
                        <span style="display: block; font-size: 0.875rem; font-weight: 700; color: var(--royal-gold);">${dateParts.day}</span>
                        <span style="display: block; font-size: 0.625rem; color: #64748b; text-transform: uppercase;">${dateParts.month}</span>
                    </div>
                    <div>
                        <p style="font-size: 0.875rem; font-weight: 700; color: white;">${Utils.sanitize(e.title)}</p>
                        <span class="event-type">${Utils.sanitize(e.type)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render Morning Protocol View
     * @param {HTMLElement} container - Container element
     * @param {Object} data - App data
     */
    renderMorning(container, data) {
        const today = Storage.getToday();
        const log = data.logs[today] && data.logs[today].morning ? data.logs[today].morning : null;
        const tasks = log && log.tasks ? log.tasks : [];

        const completedCount = tasks.filter(t => t.status === 'completed').length;
        const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Morning Protocol</h2>
                <p class="page-subtitle">Set the coordinates for conquest.</p>
            </div>

            <div style="max-width: 800px; margin: 0 auto;">
                <!-- Session Info -->
                <div class="glass-card p-6 mb-6" style="border-top: 4px solid var(--royal-gold);">
                    <div class="grid grid-1 grid-2 gap-4 mb-4">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Session Name (Optional)</label>
                            <div class="form-input-icon">
                                <i class="ph-bold ph-flag-banner"></i>
                                <input type="text" 
                                       id="session-name" 
                                       class="form-input" 
                                       placeholder="e.g., Product Launch Day"
                                       value="${log ? Utils.sanitize(log.sessionName || '') : ''}"
                                       onchange="app.updateSessionInfo()">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Location</label>
                            <div class="form-input-icon">
                                <i class="ph-bold ph-map-pin"></i>
                                <input type="text" 
                                       id="session-location" 
                                       class="form-input" 
                                       placeholder="Home Office, Cafe..."
                                       value="${log ? Utils.sanitize(log.location || '') : ''}"
                                       onchange="app.updateSessionInfo()">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Progress Bar -->
                ${tasks.length > 0 ? `
                    <div class="progress-container mb-6">
                        <div class="progress-header">
                            <span class="progress-label">Battle Progress</span>
                            <span class="progress-value">${completedCount}/${tasks.length} Complete (${progressPercent}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                ` : ''}

                <!-- Tasks List -->
                <div class="glass-card p-6 mb-6">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-family: var(--font-serif); font-weight: 700; color: white;">Today's Tasks</h3>
                        <button onclick="app.openTaskModal()" class="btn btn-primary btn-sm">
                            <i class="ph-bold ph-plus"></i> Add Task
                        </button>
                    </div>

                    ${tasks.length === 0 ? `
                        <div class="empty-state">
                            <i class="ph-duotone ph-sword"></i>
                            <h3>No battles planned</h3>
                            <p>Add your first task to begin the conquest.</p>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${tasks.map(task => this.renderTaskCard(task, false)).join('')}
                        </div>
                    `}
                </div>

                <!-- Quick Actions -->
                <div class="grid grid-1 grid-2 gap-4">
                    <button onclick="app.navigate('dashboard')" class="btn btn-outline btn-block">
                        <i class="ph-bold ph-arrow-left"></i> Back to Throne
                    </button>
                    ${tasks.length > 0 ? `
                        <button onclick="app.navigate('evening')" class="btn btn-secondary btn-block">
                            <i class="ph-bold ph-moon"></i> Evening Report
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- Floating Add Button (Mobile) -->
            <button class="fab" onclick="app.openTaskModal()">
                <i class="ph-bold ph-plus"></i>
            </button>
        `;
    },

    /**
     * Render Evening Report View
     * @param {HTMLElement} container - Container element
     * @param {Object} data - App data
     */
    renderEvening(container, data) {
        const today = Storage.getToday();
        const log = data.logs[today] || { morning: null, evening: null };
        const morningTasks = log.morning && log.morning.tasks ? log.morning.tasks : [];
        const eveningData = log.evening || {};

        const completedCount = morningTasks.filter(t => t.status === 'completed').length;
        const totalTasks = morningTasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Evening Report</h2>
                <p class="page-subtitle">Review the battlefield.</p>
            </div>

            <div style="max-width: 800px; margin: 0 auto;">
                <!-- Task Review Summary -->
                ${morningTasks.length > 0 ? `
                    <div class="glass-card p-6 mb-6" style="border-top: 4px solid var(--indigo);">
                        <h3 style="font-family: var(--font-serif); font-weight: 700; color: white; margin-bottom: 1rem;">Task Review</h3>
                        <div class="progress-container mb-4">
                            <div class="progress-header">
                                <span class="progress-label">Completion Rate</span>
                                <span class="progress-value">${completedCount}/${totalTasks} (${completionRate}%)</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${completionRate}%; background: linear-gradient(90deg, #4f46e5, #6366f1);"></div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${morningTasks.map(task => `
                                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: rgba(15, 23, 42, 0.5); border-radius: 0.375rem;">
                                    ${task.status === 'completed'
                ? '<i class="ph-fill ph-check-circle" style="color: var(--success);"></i>'
                : task.status === 'in-progress'
                    ? '<i class="ph-fill ph-clock" style="color: var(--warning);"></i>'
                    : '<i class="ph-fill ph-circle" style="color: #475569;"></i>'
            }
                                    <span style="font-size: 0.875rem; color: ${task.status === 'completed' ? '#64748b' : 'white'}; ${task.status === 'completed' ? 'text-decoration: line-through;' : ''}">${Utils.sanitize(task.title)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Reflection Form -->
                <form onsubmit="app.saveEvening(event)" class="glass-card p-6 mb-6" style="border-top: 4px solid var(--indigo);">
                    <!-- Mood & Energy -->
                    <div class="grid grid-1 grid-2 gap-6 mb-6">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="color: #fbbf24;">
                                <i class="ph-fill ph-smiley"></i> Mood Level
                            </label>
                            <div class="rating-slider">
                                ${[1, 2, 3, 4, 5].map(n => `
                                    <button type="button" 
                                            class="rating-btn ${eveningData.mood === n ? 'active' : ''}" 
                                            onclick="app.setRating('mood', ${n})"
                                            data-rating="mood-${n}">
                                        ${n}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" name="mood" id="mood-input" value="${eveningData.mood || ''}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="color: #60a5fa;">
                                <i class="ph-fill ph-lightning"></i> Energy Level
                            </label>
                            <div class="rating-slider">
                                ${[1, 2, 3, 4, 5].map(n => `
                                    <button type="button" 
                                            class="rating-btn ${eveningData.energyLevel === n ? 'active' : ''}" 
                                            onclick="app.setRating('energy', ${n})"
                                            data-rating="energy-${n}">
                                        ${n}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" name="energyLevel" id="energy-input" value="${eveningData.energyLevel || ''}">
                        </div>
                    </div>

                    <!-- Text Reflections -->
                    <div class="form-group">
                        <label class="form-label" style="color: var(--success);">
                            <i class="ph-fill ph-trophy"></i> Major Successes
                        </label>
                        <textarea name="success" class="form-textarea" rows="3" required placeholder="What went well?">${Utils.sanitize(eveningData.success || '')}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label" style="color: var(--danger);">
                            <i class="ph-fill ph-warning-octagon"></i> Challenges / Blockers
                        </label>
                        <textarea name="challenges" class="form-textarea" rows="3" required placeholder="What stood in the way?">${Utils.sanitize(eveningData.challenges || '')}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label" style="color: var(--info);">
                            <i class="ph-fill ph-strategy"></i> Strategy for Tomorrow
                        </label>
                        <textarea name="strategy" class="form-textarea" rows="3" required placeholder="How do we improve?">${Utils.sanitize(eveningData.strategy || '')}</textarea>
                    </div>

                    <button type="submit" class="btn btn-secondary btn-lg btn-block">
                        <i class="ph-bold ph-paper-plane-right"></i> Submit Report
                    </button>
                </form>

                <button onclick="app.navigate('dashboard')" class="btn btn-outline btn-block">
                    <i class="ph-bold ph-arrow-left"></i> Back to Throne
                </button>
            </div>
        `;
    },

    /**
     * Render Archive View
     * @param {HTMLElement} container - Container element
     * @param {Object} data - App data
     */
    renderArchive(container, data) {
        const logs = Object.entries(data.logs).sort((a, b) => new Date(b[0]) - new Date(a[0]));

        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Journal Archive</h2>
                <p class="page-subtitle">The history of your reign.</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                ${logs.length === 0 ? `
                    <div class="glass-card empty-state">
                        <i class="ph-duotone ph-scroll"></i>
                        <h3>No history recorded yet</h3>
                        <p>Complete your first Morning Protocol to begin.</p>
                    </div>
                ` : logs.map(([date, log]) => {
            const tasks = log.morning && log.morning.tasks ? log.morning.tasks : [];
            const completedCount = tasks.filter(t => t.status === 'completed').length;
            const sessionName = log.morning && log.morning.sessionName ? log.morning.sessionName : '';

            return `
                        <div class="glass-card p-6">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div>
                                    <h3 class="text-gold" style="font-weight: 700;">${Utils.formatDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                    ${sessionName ? `<span class="text-muted" style="font-size: 0.75rem;">${Utils.sanitize(sessionName)}</span>` : ''}
                                </div>
                                ${tasks.length > 0 ? `
                                    <span class="status-badge ${completedCount === tasks.length ? 'status-completed' : 'status-pending'}">
                                        ${completedCount}/${tasks.length} Tasks
                                    </span>
                                ` : ''}
                            </div>

                            <div class="grid grid-1 grid-2 gap-6">
                                <!-- Morning Summary -->
                                <div>
                                    <p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 0.5rem;">Morning Tasks</p>
                                    ${tasks.length > 0 ? `
                                        <div style="display: flex; flex-direction: column; gap: 0.375rem;">
                                            ${tasks.slice(0, 3).map(task => `
                                                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
                                                    ${task.status === 'completed'
                    ? '<i class="ph-fill ph-check-circle" style="color: var(--success);"></i>'
                    : '<i class="ph-fill ph-circle" style="color: #475569;"></i>'
                }
                                                    <span style="color: ${task.status === 'completed' ? '#64748b' : 'white'};">${Utils.sanitize(task.title)}</span>
                                                </div>
                                            `).join('')}
                                            ${tasks.length > 3 ? `<span class="text-muted" style="font-size: 0.75rem;">+${tasks.length - 3} more</span>` : ''}
                                        </div>
                                    ` : '<p class="text-muted" style="font-size: 0.875rem; font-style: italic;">No tasks recorded</p>'}
                                </div>

                                <!-- Evening Summary -->
                                <div>
                                    ${log.evening ? `
                                        <p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 0.5rem;">Evening Reflection</p>
                                        <p style="font-size: 0.875rem; color: var(--success); margin-bottom: 0.25rem;">
                                            <i class="ph-bold ph-trophy"></i> ${Utils.sanitize(log.evening.success).substring(0, 80)}${log.evening.success.length > 80 ? '...' : ''}
                                        </p>
                                        ${log.evening.mood ? `
                                            <span style="font-size: 0.75rem; color: #64748b;">Mood: ${log.evening.mood}/5 | Energy: ${log.evening.energyLevel}/5</span>
                                        ` : ''}
                                    ` : '<p class="text-muted" style="font-size: 0.875rem; font-style: italic;">No evening report</p>'}
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * Render Events View
     * @param {HTMLElement} container - Container element
     * @param {Object} data - App data
     */
    renderEvents(container, data) {
        const sortedEvents = data.events.sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
                <div class="page-header" style="margin-bottom: 0;">
                    <h2 class="page-title">Royal Calendar</h2>
                    <p class="page-subtitle">Events, Birthdays, and Alliances.</p>
                </div>
                <button onclick="app.openEventModal()" class="btn btn-primary">
                    <i class="ph-bold ph-plus"></i> Add Event
                </button>
            </div>

            ${sortedEvents.length === 0 ? `
                <div class="glass-card empty-state" style="border-style: dashed;">
                    <i class="ph-duotone ph-calendar-blank"></i>
                    <h3>The royal agenda is empty</h3>
                    <p>Add events to track important dates.</p>
                </div>
            ` : `
                <div class="grid grid-1 grid-2 grid-3">
                    ${sortedEvents.map((evt, index) => {
            const isPast = Utils.isPast(evt.date);
            const colorClass = Utils.getEventColor(evt.type);

            return `
                            <div class="glass-card event-card ${colorClass} ${isPast ? 'past' : ''}">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div>
                                        <p class="event-date">${new Date(evt.date).toDateString()}</p>
                                        <h3 class="event-title">${Utils.sanitize(evt.title)}</h3>
                                        <span class="event-type">${Utils.sanitize(evt.type)}</span>
                                    </div>
                                    <div class="event-actions">
                                        <button class="task-action-btn" onclick="app.editEvent(${index})" title="Edit">
                                            <i class="ph-bold ph-pencil-simple"></i>
                                        </button>
                                        <button class="task-action-btn delete" onclick="app.deleteEvent(${index})" title="Delete">
                                            <i class="ph-bold ph-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            `}

            <!-- Floating Add Button (Mobile) -->
            <button class="fab" onclick="app.openEventModal()">
                <i class="ph-bold ph-plus"></i>
            </button>
        `;
    },

    /**
     * Get Task Modal HTML
     * @param {Object} task - Task to edit (null for new)
     * @returns {string} HTML string
     */
    getTaskModalHTML(task = null) {
        const isEdit = task !== null;

        return `
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? 'Edit Task' : 'Add New Task'}</h2>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="ph-bold ph-x" style="font-size: 1.25rem;"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="app.saveTask(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" name="taskId" value="${isEdit ? task.id : ''}">
                    
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Task Title</label>
                        <input type="text" name="title" class="form-input" required 
                               placeholder="What needs to be done?"
                               value="${isEdit ? Utils.sanitize(task.title) : ''}">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Category</label>
                            <select name="category" class="form-select">
                                <option value="Deep Work" ${isEdit && task.category === 'Deep Work' ? 'selected' : ''}>Deep Work</option>
                                <option value="Strategy" ${isEdit && task.category === 'Strategy' ? 'selected' : ''}>Strategy</option>
                                <option value="Meeting" ${isEdit && task.category === 'Meeting' ? 'selected' : ''}>Meeting</option>
                                <option value="Learning" ${isEdit && task.category === 'Learning' ? 'selected' : ''}>Learning</option>
                                <option value="Health" ${isEdit && task.category === 'Health' ? 'selected' : ''}>Health</option>
                                <option value="Admin" ${isEdit && task.category === 'Admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Priority</label>
                            <select name="priority" class="form-select">
                                <option value="high" ${isEdit && task.priority === 'high' ? 'selected' : ''}>🔴 High</option>
                                <option value="medium" ${isEdit && task.priority === 'medium' ? 'selected' : ''} ${!isEdit ? 'selected' : ''}>🟡 Medium</option>
                                <option value="low" ${isEdit && task.priority === 'low' ? 'selected' : ''}>⚪ Low</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Estimated Time (Hours)</label>
                        <input type="number" name="estimatedTime" class="form-input" 
                               step="0.5" min="0.5" max="12"
                               placeholder="e.g., 2"
                               value="${isEdit && task.estimatedTime ? task.estimatedTime : ''}">
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Notes (Optional)</label>
                        <textarea name="notes" class="form-textarea" rows="2" 
                                  placeholder="Additional details...">${isEdit && task.notes ? Utils.sanitize(task.notes) : ''}</textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: 0.5rem;">
                        <i class="ph-bold ph-check"></i> ${isEdit ? 'Update Task' : 'Add Task'}
                    </button>
                </form>
            </div>
        `;
    },

    /**
     * Get Event Modal HTML
     * @param {Object} event - Event to edit (null for new)  
     * @param {number} index - Event index (-1 for new)
     * @returns {string} HTML string
     */
    getEventModalHTML(event = null, index = -1) {
        const isEdit = event !== null;
        const today = Storage.getToday();

        return `
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? 'Edit Decree' : 'Declare Event'}</h2>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="ph-bold ph-x" style="font-size: 1.25rem;"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="app.saveEvent(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" name="eventIndex" value="${index}">
                    
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Title</label>
                        <input type="text" name="title" class="form-input" required 
                               placeholder="Meeting with Investors..."
                               value="${isEdit ? Utils.sanitize(event.title) : ''}">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Date</label>
                            <input type="date" name="date" class="form-input" required 
                                   value="${isEdit ? event.date : today}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Type</label>
                            <select name="type" class="form-select">
                                <option value="Meeting" ${isEdit && event.type === 'Meeting' ? 'selected' : ''}>Meeting</option>
                                <option value="Birthday" ${isEdit && event.type === 'Birthday' ? 'selected' : ''}>Birthday</option>
                                <option value="Deadline" ${isEdit && event.type === 'Deadline' ? 'selected' : ''}>Deadline</option>
                                <option value="Social" ${isEdit && event.type === 'Social' ? 'selected' : ''}>Social</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: 0.5rem;">
                        <i class="ph-bold ph-seal-check"></i> ${isEdit ? 'Update Decree' : 'Record Decree'}
                    </button>
                </form>
            </div>
        `;
    }
};

// Make available globally
window.Views = Views;
