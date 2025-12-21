/**
 * REIGN - Shared Header Component
 * This file contains the shared header HTML that is injected into all pages
 * Use: Include this script and call HeaderComponent.render()
 */

const HeaderComponent = {
    /**
     * Render the header into a container
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Configuration options
     */
    render(containerId = 'header-container', options = {}) {
        const {
            showBreadcrumb = true,
            pageTitle = '',
            pageIcon = 'ph-crown'
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Header container not found:', containerId);
            return;
        }

        const isLoggedIn = Auth.isLoggedIn();
        const user = Auth.getUser();
        const basePath = window.location.pathname.includes('/pages/') ? '../' : '';

        container.innerHTML = `
            <header class="header">
                <button class="mobile-menu-btn" onclick="UI.toggleSidebar()" title="Menu">
                    <i class="ph-bold ph-list"></i>
                </button>
                
                <a href="${basePath}index.html" class="header-brand">
                    <i class="ph-fill ph-crown"></i>
                    <div>
                        <h1>REIGN</h1>
                        <p class="tagline hidden-mobile">Rule Your Day</p>
                    </div>
                </a>

                ${showBreadcrumb && pageTitle ? `
                    <div class="breadcrumb hidden-mobile">
                        <i class="ph-bold ph-caret-right"></i>
                        <span><i class="ph-duotone ${pageIcon}"></i> ${pageTitle}</span>
                    </div>
                ` : ''}

                <div class="header-actions">
                    <!-- Learning Streak Badge -->
                    <div id="streak-badge" class="streak-badge hidden" onclick="Nav.goto('learning')">
                        <i class="ph-fill ph-fire"></i>
                        <span id="streak-count">0</span>
                    </div>

                    <!-- Sync Status -->
                    ${isLoggedIn ? `
                        <div class="sync-indicator" title="Data synced">
                            <div class="avatar-wrapper">
                                <button id="user-avatar-btn" class="user-avatar-btn" onclick="HeaderComponent.toggleUserMenu()">
                                    <span class="user-initials">${Auth.getInitials()}</span>
                                </button>
                            </div>
                            <span id="sync-status" class="sync-status"></span>
                        </div>
                    ` : ''}

                    <!-- Guest Prompt -->
                    <a href="${basePath}auth.html" id="guest-prompt" class="guest-prompt ${isLoggedIn ? 'hidden' : ''}" style="display: ${isLoggedIn ? 'none' : 'flex'}">
                        <i class="ph-bold ph-cloud-arrow-up"></i>
                        <span class="hidden-mobile">Sync Data</span>
                    </a>

                    <!-- Settings -->
                    <div class="header-settings hidden-mobile">
                        <label class="theme-toggle" title="Toggle Theme">
                            <input type="checkbox" id="theme-toggle" onchange="HeaderComponent.toggleTheme()">
                            <i class="ph-duotone ph-moon"></i>
                        </label>
                    </div>
                </div>

                <!-- User Dropdown Menu -->
                ${isLoggedIn ? `
                    <div id="user-dropdown" class="user-dropdown hidden">
                        <div class="dropdown-header">
                            <strong>${user?.name || 'User'}</strong>
                            <small>${user?.email || ''}</small>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="${basePath}pages/settings.html" class="dropdown-item">
                            <i class="ph-bold ph-gear"></i> Settings
                        </a>
                        <button class="dropdown-item" onclick="Auth.logout()">
                            <i class="ph-bold ph-sign-out"></i> Logout
                        </button>
                    </div>
                ` : ''}
            </header>
        `;

        // Update streak badge
        this.updateStreakBadge();
    },

    /**
     * Toggle user dropdown menu
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    },

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const data = Storage.getData();
        const newTheme = data.settings?.theme === 'dark' ? 'light' : 'dark';
        data.settings = data.settings || {};
        data.settings.theme = newTheme;
        Storage.saveData(data);
        document.documentElement.setAttribute('data-theme', newTheme);
    },

    /**
     * Update the streak badge display
     */
    updateStreakBadge() {
        const data = Storage.getData();
        const streak = data.learning?.streak || 0;
        const badge = document.getElementById('streak-badge');
        const count = document.getElementById('streak-count');

        if (badge && count) {
            if (streak > 0) {
                badge.classList.remove('hidden');
                count.textContent = streak;
            } else {
                badge.classList.add('hidden');
            }
        }
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    const avatarBtn = document.getElementById('user-avatar-btn');
    if (dropdown && !dropdown.contains(e.target) && !avatarBtn?.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});
