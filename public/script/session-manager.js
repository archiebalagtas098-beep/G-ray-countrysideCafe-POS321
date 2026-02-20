// ==================== 🔐 SESSION MANAGER ====================
// Manages user session across browser windows and tabs
// Stores role and maintains persistent session state

class SessionManager {
    constructor() {
        this.roleKey = 'userRole';
        this.isLoggedInKey = 'isLoggedIn';
        this.lastActivityKey = 'lastActivity';
        this.init();
    }

    // Initialize session manager
    init() {
        this.listenForStorageChanges();
        this.setupBeforeUnload();
    }

    // Set user role (admin or staff)
    setRole(role) {
        if (['admin', 'staff'].includes(role)) {
            sessionStorage.setItem(this.roleKey, role);
            sessionStorage.setItem(this.isLoggedInKey, 'true');
            sessionStorage.setItem(this.lastActivityKey, new Date().toISOString());
            console.log(`✅ User role set to: ${role}`);
            return true;
        }
        return false;
    }

    // Get current user role
    getRole() {
        return sessionStorage.getItem(this.roleKey);
    }

    // Check if user is logged in
    isLoggedIn() {
        return sessionStorage.getItem(this.isLoggedInKey) === 'true';
    }

    // Clear session (on logout)
    clearSession() {
        sessionStorage.removeItem(this.roleKey);
        sessionStorage.removeItem(this.isLoggedInKey);
        sessionStorage.removeItem(this.lastActivityKey);
        console.log('🔓 Session cleared');
    }

    // Get appropriate dashboard URL based on role
    getDashboardUrl() {
        const role = this.getRole();
        if (role === 'admin') {
            return '/admindashboard/dashboard';
        } else if (role === 'staff') {
            return '/staffdashboard';
        }
        return '/login';
    }

    // Listen for storage changes from other tabs
    listenForStorageChanges() {
        window.addEventListener('storage', (event) => {
            if (event.key === this.roleKey) {
                console.log('🔄 Role changed in another tab: ' + event.newValue);
            }
            if (event.key === this.isLoggedInKey) {
                if (!event.newValue) {
                    console.log('📴 User logged out in another tab');
                }
            }
        });
    }

    // Track last activity for session timeout (optional)
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem(this.lastActivityKey, new Date().toISOString());
        });
    }

    // Update last activity timestamp
    updateActivity() {
        sessionStorage.setItem(this.lastActivityKey, new Date().toISOString());
    }

    // Get last activity time
    getLastActivity() {
        const lastActivity = sessionStorage.getItem(this.lastActivityKey);
        return lastActivity ? new Date(lastActivity) : null;
    }
}

// Create global instance
const sessionManager = new SessionManager();

console.log('🔐 Session Manager initialized');
