// Settings Management Script
let currentUser = null;
let settingsChanged = false;
let originalUserData = null;
let passwordAttempts = 0;
let passwordCooldown = false;
let cooldownTimer = null;

// Element references
let elements = {
    // Form elements
    fullNameDisplay: null,
    emailDisplay: null,
    phoneDisplay: null,
    usernameDisplay: null,
    currentPassword: null,
    newPassword: null,
    confirmPassword: null,
    
    // Buttons
    saveBtn: null,
    logoutBtn: null,
    passwordChangeBtn: null,
    changePasswordModalBtn: null,
    cancelPasswordChangeBtn: null,
    
    // Containers
    passwordFormContainer: null,
    passwordActionContainer: null,
    
    // Forms
    passwordChangeForm: null,
    
    // Status indicators
    autoSaveStatus: null,
    lastSavedTime: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loaded');
    
    // Initialize element references FIRST
    initializeElements();
    
    // Then load user data with retry mechanism
    loadUserDataWithRetry(3);
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize auto-save features
    setupAutoSave();
    
    // Check for existing cooldown from session AFTER everything is loaded
    checkSessionCooldown();
});

// Check if user is in cooldown from current session
function checkSessionCooldown() {
    try {
        const cooldownEnd = sessionStorage.getItem('passwordCooldownEnd');
        if (cooldownEnd) {
            const now = Date.now();
            const remainingSeconds = Math.max(0, (parseInt(cooldownEnd) - now) / 1000);
            
            if (remainingSeconds > 0) {
                // Initialize passwordCooldown state
                passwordCooldown = true;
                passwordAttempts = 3; // Set to max since we're in cooldown
                
                // Start the countdown
                startCooldown(remainingSeconds);
                console.log(`Cooldown active: ${remainingSeconds.toFixed(0)}s remaining`);
            } else {
                // Cooldown expired, clean up
                sessionStorage.removeItem('passwordCooldownEnd');
                passwordCooldown = false;
                passwordAttempts = 0;
                console.log('Previous cooldown has expired');
            }
        } else {
            // No cooldown in session storage
            passwordCooldown = false;
            passwordAttempts = 0;
        }
    } catch (error) {
        console.error('Error checking session cooldown:', error);
        // Reset states on error
        passwordCooldown = false;
        passwordAttempts = 0;
        sessionStorage.removeItem('passwordCooldownEnd');
    }
}

// Start cooldown timer (session only, not persistent)
function startCooldown(seconds = 30) {
    try {
        passwordCooldown = true;
        const cooldownEnd = Date.now() + (seconds * 1000);
        
        // Store in session storage
        sessionStorage.setItem('passwordCooldownEnd', cooldownEnd.toString());
        
        // Update UI if elements exist
        if (elements.passwordChangeBtn) {
            elements.passwordChangeBtn.disabled = true;
            console.log('Password change button disabled due to cooldown');
        }
        
        if (elements.currentPassword) elements.currentPassword.disabled = true;
        if (elements.newPassword) elements.newPassword.disabled = true;
        if (elements.confirmPassword) elements.confirmPassword.disabled = true;
        
        // Start countdown
        let remaining = Math.ceil(seconds);
        
        // Clear existing timer
        if (cooldownTimer) clearInterval(cooldownTimer);
        
        cooldownTimer = setInterval(() => {
            remaining--;
            
            // Update button text
            if (elements.passwordChangeBtn) {
                elements.passwordChangeBtn.textContent = `Try again in ${remaining}s`;
            }
            
            // Check if cooldown is over
            if (remaining <= 0) {
                clearInterval(cooldownTimer);
                endCooldown();
            }
        }, 1000);
        
        console.log(`Cooldown started for ${seconds} seconds`);
        
    } catch (error) {
        console.error('Error starting cooldown:', error);
        // Clean up on error
        if (cooldownTimer) clearInterval(cooldownTimer);
        sessionStorage.removeItem('passwordCooldownEnd');
        passwordCooldown = false;
    }
}

// End cooldown
function endCooldown() {
    try {
        passwordCooldown = false;
        passwordAttempts = 0;
        
        // Remove from session storage
        sessionStorage.removeItem('passwordCooldownEnd');
        
        // Clear timer
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
        }
        
        // Update UI
        if (elements.passwordChangeBtn) {
            elements.passwordChangeBtn.disabled = false;
            elements.passwordChangeBtn.textContent = 'Change Password';
            console.log('Password change button re-enabled');
        }
        
        if (elements.currentPassword) elements.currentPassword.disabled = false;
        if (elements.newPassword) elements.newPassword.disabled = false;
        if (elements.confirmPassword) elements.confirmPassword.disabled = false;
        
        // Show notification
        showToast('You can now try changing your password again', 'success');
        
        console.log('Cooldown ended');
        
    } catch (error) {
        console.error('Error ending cooldown:', error);
    }
}

// Initialize all DOM element references
function initializeElements() {
    elements.fullNameDisplay = document.getElementById('fullNameDisplay');
    elements.emailDisplay = document.getElementById('emailDisplay');
    elements.phoneDisplay = document.getElementById('phoneDisplay');
    elements.usernameDisplay = document.getElementById('usernameDisplay');
    elements.currentPassword = document.getElementById('currentPassword');
    elements.newPassword = document.getElementById('newPassword');
    elements.confirmPassword = document.getElementById('confirmPassword');
    elements.saveBtn = document.getElementById('saveBtn');
    elements.logoutBtn = document.getElementById('logoutBtn');
    elements.passwordChangeBtn = document.getElementById('passwordChangeBtn');
    elements.changePasswordModalBtn = document.getElementById('changePasswordModalBtn');
    elements.cancelPasswordChangeBtn = document.getElementById('cancelPasswordChangeBtn');
    elements.passwordFormContainer = document.getElementById('passwordFormContainer');
    elements.passwordActionContainer = document.getElementById('passwordActionContainer');
    elements.passwordChangeForm = document.getElementById('passwordChangeForm');
    elements.autoSaveStatus = document.getElementById('autoSaveStatus');
    elements.lastSavedTime = document.getElementById('lastSavedTime');
    
    // Log missing elements for debugging
    Object.keys(elements).forEach(key => {
        if (!elements[key] && key !== 'autoSaveStatus' && key !== 'lastSavedTime') {
            console.warn(`Element not found: ${key}`);
        }
    });
}

// Load user data with retry mechanism
async function loadUserDataWithRetry(maxRetries) {
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            await loadUserData();
            return; // Success, exit function
        } catch (error) {
            retries++;
            console.warn(`Failed to load user data (attempt ${retries}/${maxRetries})`);
            
            if (retries < maxRetries) {
                // Wait before retrying (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, retries), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // All retries failed
                console.error('All attempts to load user data failed');
                showToast('Failed to load user data. Please refresh the page.', 'error');
                
                // Show placeholder data
                showPlaceholderData();
            }
        }
    }
}

// Load user data
async function loadUserData() {
  try {
    console.log('Attempting to load user data...');
    console.log('Current user token status: Token present');
    
    // Try endpoints in order (prefer specific endpoint first)
    const endpoints = [
      '/api/infosettings/user',  // Primary endpoint
      '/api/user/profile',       // Secondary endpoint
      '/api/user',               // Fallback endpoint
      '/api/user/data',          // Alternative endpoint
      '/api/auth/user'           // Last resort
    ];
    
    let response = null;
    let successfulEndpoint = null;
    let lastError = null;
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          cache: 'no-cache'
        });
        
        console.log(`Response status for ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          successfulEndpoint = endpoint;
          console.log(`✅ Endpoint ${endpoint} returned OK status`);
          break;
        } else {
          // Try to get error text
          let errorText = '';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const jsonError = await response.json();
              errorText = JSON.stringify(jsonError);
            } else {
              errorText = await response.text();
            }
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          
          console.warn(`⚠️ Endpoint ${endpoint} returned status ${response.status}`);
          lastError = { endpoint, status: response.status, text: errorText };
        }
      } catch (fetchError) {
        console.warn(`❌ Endpoint ${endpoint} failed:`, fetchError.message);
        lastError = { endpoint, error: fetchError.message };
        continue;
      }
    }
    
    if (!response || !response.ok) {
      const errorMsg = lastError 
        ? `All endpoints failed. Last error: ${lastError.endpoint} (${lastError.status || lastError.error})`
        : 'No valid API endpoint found';
      
      console.error('❌ ' + errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`✅ Successfully got response from: ${successfulEndpoint}`);
    
    const result = await response.json();
    console.log('Response data:', result);
    
    // Handle different response structures
    let userData;
    if (result.data) {
      userData = result.data; // For /api/infosettings/user and similar endpoints
    } else if (Array.isArray(result)) {
      userData = result[0]; // For array responses
    } else {
      userData = result; // Direct response
    }
    
    console.log('Extracted user data:', userData);
    
    if (!userData || !userData.username) {
      throw new Error('Invalid user data structure');
    }
    
    // Map database fields to form fields
    currentUser = {
      _id: userData._id || userData.id || 'N/A',
      username: userData.username || userData.email || 'User',
      email: userData.email || '',
      fullName: userData.fullName || userData.name || userData.displayName || userData.username,
      phoneNumber: userData.phoneNumber || userData.phone || userData.telephone || '',
      role: userData.role || userData.type || 'User',
      isActive: userData.isActive !== undefined ? userData.isActive : (userData.status === 'active'),
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
    
    console.log('✅ Current user object created:', currentUser);
    
    originalUserData = JSON.parse(JSON.stringify(currentUser));
    
    // Update UI with fresh data
    populateUserData();
    
    // Update last saved time on load
    if (elements.lastSavedTime && currentUser.updatedAt) {
      const lastUpdate = new Date(currentUser.updatedAt);
      const timeString = lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      elements.lastSavedTime.textContent = `Last saved: ${timeString}`;
      elements.lastSavedTime.style.display = 'block';
    }
    
  } catch (error) {
    console.error('❌ Error loading user data:', error.message);
    throw error;
  }
}

// Update handlePersonalInfoChange function:
async function handlePersonalInfoChange() {
  if (!currentUser || !originalUserData) {
    showToast('Cannot save: User data not loaded', 'error');
    return;
  }
  
  const fullName = elements.fullNameDisplay ? elements.fullNameDisplay.value.trim() : '';
  const email = elements.emailDisplay ? elements.emailDisplay.value.trim() : '';
  const phone = elements.phoneDisplay ? elements.phoneDisplay.value.trim() : '';
  
  // Basic validation
  if (!fullName || !email) {
    updateAutoSaveStatus('error', 'Full name and email are required');
    return;
  }
  
  if (!email.includes('@')) {
    updateAutoSaveStatus('error', 'Please enter a valid email address');
    return;
  }
  
  // Check if values have actually changed
  const hasChanges = 
    fullName !== originalUserData.fullName ||
    email !== originalUserData.email ||
    phone !== originalUserData.phoneNumber;
  
  if (!hasChanges) {
    updateAutoSaveStatus('idle', 'No changes detected');
    return;
  }
  
  // Update UI to show saving status
  updateAutoSaveStatus('saving', 'Saving changes...');
  
  try {
    // Try multiple update endpoints
    const endpoints = [
      '/api/infosettings/update',  // New endpoint
      '/api/user/update',          // Alternative
      '/api/user/profile/update',  // Another alternative
      '/api/me/update'             // Common pattern
    ];
    
    let response = null;
    
    for (const endpoint of endpoints) {
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            fullName,
            email,
            phoneNumber: phone
          })
        });
        
        if (response.ok) break;
      } catch (error) {
        console.warn(`Endpoint ${endpoint} failed:`, error.message);
        continue;
      }
    }
    
    if (!response || !response.ok) {
      const error = response ? await response.json().catch(() => ({message: `HTTP ${response.status}`})) : {message: 'Network error'};
      throw new Error(error.message || 'Update failed');
    }

    // Get updated user data
    const result = await response.json();
    
    // Handle different response structures
    let updatedUser;
    if (result.data) {
      updatedUser = result.data; // For /api/infosettings/update
    } else if (result.user) {
      updatedUser = result.user; // For some endpoints
    } else {
      updatedUser = result; // For others
    }
    
    // Update currentUser with fresh data
    currentUser.fullName = updatedUser.fullName || updatedUser.name || fullName;
    currentUser.email = updatedUser.email || email;
    currentUser.phoneNumber = updatedUser.phoneNumber || updatedUser.phone || phone;
    currentUser.updatedAt = updatedUser.updatedAt || new Date().toISOString();
    
    // Update originalUserData
    originalUserData = JSON.parse(JSON.stringify(currentUser));
    
    // Update success status
    updateAutoSaveStatus('success', 'Changes saved successfully!');
    
    // Update last saved time
    updateLastSavedTime();
    
    // Send email notification after successful profile update
    try {
      console.log('📧 Sending profile update notification...');
      const notifyResponse = await fetch('/api/notify/profile-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: currentUser.email,
          fullName: currentUser.fullName,
          phone: currentUser.phoneNumber
        })
      });

      if (notifyResponse.ok) {
        const notifyResult = await notifyResponse.json();
        if (notifyResult.emailSent) {
          console.log('✅ Profile update email sent to', currentUser.email);
        }
        if (notifyResult.smsSent) {
          console.log('✅ Profile update SMS sent to', currentUser.phoneNumber);
        }
      }
    } catch (notifyError) {
      console.warn('⚠️ Notification sending failed (non-critical):', notifyError);
      // Don't block the main flow if notifications fail
    }
    
  } catch (error) {
    console.error('Error saving changes:', error);
    updateAutoSaveStatus('error', 'Update failed. Please check your connection.');
    
    // Revert to original values on error
    if (originalUserData) {
      if (elements.fullNameDisplay) elements.fullNameDisplay.value = originalUserData.fullName || '';
      if (elements.emailDisplay) elements.emailDisplay.value = originalUserData.email || '';
      if (elements.phoneDisplay) elements.phoneDisplay.value = originalUserData.phoneNumber || '';
    }
  }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();

    // Check if in cooldown
    if (passwordCooldown) {
        showToast('Please wait before trying again', 'error');
        return;
    }

    if (!elements.currentPassword || !elements.newPassword || !elements.confirmPassword) {
        showToast('Password form elements not found', 'error');
        return;
    }

    const currentPassword = elements.currentPassword.value;
    const newPassword = elements.newPassword.value;
    const confirmPassword = elements.confirmPassword.value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('All password fields are required', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (currentPassword === newPassword) {
        showToast('New password cannot be the same as old password', 'error');
        return;
    }

    // Password strength validation
    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength.score < 3) {
        showToast(`Password too weak: ${passwordStrength.feedback}`, 'warning');
        return;
    }

    try {
        // Show loading state
        if (elements.passwordChangeBtn) {
            elements.passwordChangeBtn.disabled = true;
            elements.passwordChangeBtn.textContent = 'Changing Password...';
        }

        // Try multiple common password change endpoints
            const endpoints = [
            '/api/infosettings/change-password',  // New endpoint
            '/api/user/change-password',          // Alternative
            '/api/auth/change-password',          // Auth endpoint
            '/api/me/password',                   // Common pattern
            '/api/settings/password'              // Settings endpoint
            ];
        
        let response = null;
        
        for (const endpoint of endpoints) {
            try {
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });
                
                if (response.ok) break;
            } catch (error) {
                console.warn(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }
        
        if (!response || !response.ok) {
            const error = response ? await response.json().catch(() => ({message: `HTTP ${response.status}`})) : {message: 'Network error'};
            
            // Check if error is due to wrong current password
            if (error.message && (error.message.toLowerCase().includes('current password') || 
                error.message.toLowerCase().includes('incorrect password') ||
                error.message.toLowerCase().includes('wrong password') ||
                error.message.toLowerCase().includes('invalid credentials'))) {
                
                passwordAttempts++;
                
                if (passwordAttempts >= 3) {
                    showToast('Too many failed attempts. 30-second cooldown activated.', 'error');
                    startCooldown(30);
                } else {
                    const attemptsLeft = 3 - passwordAttempts;
                    showToast(`Wrong current password. ${attemptsLeft} attempt(s) left.`, 'error');
                }
            } else {
                showToast('Error: ' + (error.message || 'Failed to change password'), 'error');
            }
            
            // Clear only old password field on failed attempt
            elements.currentPassword.value = '';
            return;
        }

        // Success
        passwordAttempts = 0;
        passwordCooldown = false;
        sessionStorage.removeItem('passwordCooldownEnd');
        
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
        }

        showToast('✅ Password changed successfully!', 'success');
        
        // Clear all password fields
        elements.currentPassword.value = '';
        elements.newPassword.value = '';
        elements.confirmPassword.value = '';
        
        // Send password change notification email and SMS
        try {
          console.log('📧 Sending password change notification...');
          const notifyResponse = await fetch('/api/notify/password-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              email: currentUser.email,
              fullName: currentUser.fullName,
              phone: currentUser.phoneNumber
            })
          });

          if (notifyResponse.ok) {
            const notifyResult = await notifyResponse.json();
            if (notifyResult.emailSent) {
              console.log('✅ Password change email sent to', currentUser.email);
            }
            if (notifyResult.smsSent) {
              console.log('✅ Password change SMS sent to', currentUser.phoneNumber);
            }
          }
        } catch (notifyError) {
          console.warn('⚠️ Notification sending failed (non-critical):', notifyError);
          // Don't block the main flow if notifications fail
        }
        
        // Show success message for 2 seconds before hiding form
        setTimeout(() => {
            hidePasswordChangeForm();
        }, 2000);
        
    } catch (error) {
        console.error('Error changing password:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showToast('Cannot connect to server. Please try again later.', 'error');
        } else {
            showToast('Error changing password: ' + error.message, 'error');
        }
        
        // Clear only old password field on error
        if (elements.currentPassword) elements.currentPassword.value = '';
    } finally {
        // Reset button state
        if (elements.passwordChangeBtn) {
            elements.passwordChangeBtn.disabled = false;
            elements.passwordChangeBtn.textContent = 'Change Password';
        }
    }
}

// Check password strength
function checkPasswordStrength(password) {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Add lowercase letters');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Add uppercase letters');
    
    if (/[0-9]/.test(password)) score++;
    else feedback.push('Add numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Add special characters');
    
    return {
        score,
        feedback: feedback.join(', ')
    };
}

// Show toast notification
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        padding: 12px 16px;
        border-radius: 6px;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-size: 14px;
        min-width: 200px;
        max-width: 300px;
    `;

    // Add animation styles
    if (!document.getElementById('toastAnimations')) {
        const style = document.createElement('style');
        style.id = 'toastAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .toast-success { background-color: #28a745; }
            .toast-error { background-color: #dc3545; }
            .toast-info { background-color: #17a2b8; }
            .toast-warning { background-color: #ffc107; color: #000; }
        `;
        document.head.appendChild(style);
    }

    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Logout handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
    }
}

// Before unload warning
window.addEventListener('beforeunload', function(e) {
    if (settingsChanged) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// Check for unsaved changes periodically
setInterval(function() {
    if (!elements.fullNameDisplay || !elements.emailDisplay || !elements.phoneDisplay || !originalUserData) return;
    
    const hasChanges = 
        elements.fullNameDisplay.value !== originalUserData.fullName ||
        elements.emailDisplay.value !== originalUserData.email ||
        elements.phoneDisplay.value !== originalUserData.phoneNumber;
    
    settingsChanged = hasChanges;
}, 1000);

// Add some CSS for auto-save status
const style = document.createElement('style');
style.textContent = `
    .auto-save-status {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-left: 10px;
        transition: all 0.3s ease;
    }
    
    .auto-save-status.saving {
        background-color: #ffc107;
        color: #000;
    }
    
    .auto-save-status.success {
        background-color: #28a745;
        color: white;
    }
    
    .auto-save-status.error {
        background-color: #dc3545;
        color: white;
    }
    
    .auto-save-status.idle {
        background-color: #6c757d;
        color: white;
        opacity: 0.7;
    }
    
    #lastSavedTime {
        font-size: 11px;
        color: #6c757d;
        font-style: italic;
        margin-top: 5px;
        display: none;
    }
    
    .form-field {
        margin-bottom: 15px;
    }
    
    .form-field label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    .form-field input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .form-field input:focus {
        border-color: #80bdff;
        outline: 0;
        box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    }
    
    .form-field input:read-only {
        background-color: #e9ecef;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeElements,
        handlePersonalInfoChange,
        handlePasswordChange,
        showToast,
        handleLogout,
        checkPasswordStrength
    };
}

// Populate UI with user data
function populateUserData() {
    if (!currentUser) return;
    if (elements.fullNameDisplay) elements.fullNameDisplay.value = currentUser.fullName || '';
    if (elements.emailDisplay) elements.emailDisplay.value = currentUser.email || '';
    if (elements.phoneDisplay) elements.phoneDisplay.value = currentUser.phoneNumber || '';
    if (elements.usernameDisplay) {
        // Set as value for input field
        if (elements.usernameDisplay.tagName === 'INPUT') {
            elements.usernameDisplay.value = currentUser.username || '';
        } else {
            // Or as text content for display element
            elements.usernameDisplay.textContent = currentUser.username || '';
        }
    }
}

// Show placeholder data when user data cannot be loaded
function showPlaceholderData() {
    if (elements.fullNameDisplay) elements.fullNameDisplay.value = 'User Name';
    if (elements.emailDisplay) elements.emailDisplay.value = 'user@example.com';
    if (elements.phoneDisplay) elements.phoneDisplay.value = '';
    if (elements.usernameDisplay) {
        if (elements.usernameDisplay.tagName === 'INPUT') {
            elements.usernameDisplay.value = 'guest';
            elements.usernameDisplay.disabled = true;
        } else {
            elements.usernameDisplay.textContent = 'guest';
        }
    }
}

// Update auto-save status indicator
function updateAutoSaveStatus(status = 'idle', message = '') {
    if (!elements.autoSaveStatus) return;
    elements.autoSaveStatus.className = `auto-save-status ${status}`;
    elements.autoSaveStatus.textContent = message || (status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved' : status === 'error' ? 'Error' : 'Idle');
}

// Update last saved time UI
function updateLastSavedTime() {
    if (!elements.lastSavedTime) return;
    const now = new Date();
    elements.lastSavedTime.textContent = `Last saved: ${now.toLocaleString()}`;
    elements.lastSavedTime.style.display = 'block';
}

// Show password change form
function showPasswordChangeForm() {
    if (elements.passwordFormContainer) elements.passwordFormContainer.style.display = 'block';
    if (elements.passwordActionContainer) elements.passwordActionContainer.style.display = 'none';
    if (elements.currentPassword) elements.currentPassword.focus();
}

// Hide password change form
function hidePasswordChangeForm() {
    if (elements.passwordFormContainer) elements.passwordFormContainer.style.display = 'none';
    if (elements.passwordActionContainer) elements.passwordActionContainer.style.display = 'block';
    if (elements.currentPassword) elements.currentPassword.value = '';
    if (elements.newPassword) elements.newPassword.value = '';
    if (elements.confirmPassword) elements.confirmPassword.value = '';
}

// Setup event listeners for buttons and form inputs
function setupEventListeners() {
    if (elements.saveBtn) elements.saveBtn.addEventListener('click', handlePersonalInfoChange);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);
    if (elements.changePasswordModalBtn) elements.changePasswordModalBtn.addEventListener('click', showPasswordChangeForm);
    if (elements.cancelPasswordChangeBtn) elements.cancelPasswordChangeBtn.addEventListener('click', (e) => { e.preventDefault(); hidePasswordChangeForm(); });
    if (elements.passwordChangeForm) elements.passwordChangeForm.addEventListener('submit', handlePasswordChange);

    // Input listeners to mark settingsChanged
    ['fullNameDisplay','emailDisplay','phoneDisplay'].forEach(key => {
        const el = elements[key];
        if (!el) return;
        el.addEventListener('input', () => {
            settingsChanged = true;
            updateAutoSaveStatus('idle', 'Unsaved changes');
        });
    });
}

// Setup simple auto-save: if settingsChanged, save every 8 seconds
function setupAutoSave() {
    setInterval(async () => {
        if (settingsChanged) {
            updateAutoSaveStatus('saving', 'Auto-saving...');
            try {
                await handlePersonalInfoChange();
                settingsChanged = false;
                updateAutoSaveStatus('success', 'Auto-saved');
            } catch (err) {
                updateAutoSaveStatus('error', 'Auto-save failed');
            }
        }
    }, 8000);
}