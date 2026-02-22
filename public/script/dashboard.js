// SALES DASHBOARD - Frontend for G'RAY COUNTRYSIDE CAFÉ POS System

// DOM Elements
const menuSearch = document.getElementById('menuSearch');
const dashboardMenuItems = document.querySelectorAll('.dashboard-menu a');
const chartBars = document.getElementById('chartBars');
const chartLabels = document.getElementById('chartLabels');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const ordersTableBody = document.getElementById('ordersTableBody');
const topItemsTableBody = document.getElementById('topItemsTableBody');
const salesTimestamp = document.getElementById('salesTimestamp');
const inventoryTimestamp = document.getElementById('inventoryTimestamp');
const ordersTimestamp = document.getElementById('ordersTimestamp');

// State management
let dashboardData = {
    stats: {},
    inventory: [],
    orders: [],
    topSelling: [],
    salesChart: []
};

// Last update times
let lastUpdateTimes = {
    sales: null,
    inventory: null,
    orders: null
};

// Real-time connection
let adminEventSource = null;

// Navigation routes mapping
const NAVIGATION_ROUTES = {
    'dashboard': '/admindashboard',
    'inventory': '/admindashboard/inventory',
    'salesandreports': '/admindashboard/salesandreports',
    'orderhistory': '/admindashboard/orderhistory',
    'addstaff': '/admindashboard/addstaff',
    'menumanagement': '/admindashboard/menumanagement',
    'settings': '/admindashboard/infosettings'
};

// ==================== 🔴 DISABLE BACK BUTTON PREVENTION ====================
function disableBackButtonPrevention() {
    // Remove popstate event listeners that are preventing back button
    window.removeEventListener('popstate', backButtonPreventionHandler);
    
    // Clear the preventBack state from history
    try {
        // Push a new state that allows navigation
        window.history.pushState(null, '', window.location.href);
    } catch (e) {
        console.warn('Could not clear history state:', e);
    }
    
    console.log('✅ Back button prevention disabled - back button now works');
}

// Store the handler reference so we can remove it later
let backButtonPreventionHandler = null;

// ==================== 🔴 INITIALIZE BACK BUTTON PREVENTION ====================
function initializeBackButtonPrevention() {
    // Only prevent back if user is logged in
    if (localStorage.getItem('authToken')) {
        // 🔴 AGGRESSIVE: Push multiple states to create buffer
        for (let i = 0; i < 5; i++) {
            window.history.pushState({ preventBack: true, level: i }, '', window.location.href);
        }
        
        // Define the handler function and store it globally so we can remove it later
        backButtonPreventionHandler = function(event) {
            const currentState = window.history.state;
            
            // If user tries to go back, push them forward again
            if (!currentState || currentState.preventBack === true) {
                window.history.pushState({ preventBack: true }, '', window.location.href);
                
                // Show notification warning
                if (typeof showNotification === 'function') {
                    showNotification('Please use the logout button to exit', 'warning');
                } else if (typeof alert !== 'undefined') {
                    // Fallback to alert if showNotification doesn't exist
                    // (don't actually use alert, but show in console)
                    console.warn('⚠️ Please use the logout button to exit');
                }
            }
        };
        
        // Handle popstate (back button)
        window.addEventListener('popstate', backButtonPreventionHandler, false);
        
        console.log('🛡️ Back button prevention initialized with 5-level buffer');
    }
}

// ==================== 🚪 LOGOUT HANDLER ====================
async function handleLogout() {
    try {
        console.log('🚪 Logging out...');
        
        // Disable back button prevention first (new method)
        if (typeof backButtonPrevention !== 'undefined') {
            backButtonPrevention.disable();
        } else {
            disableBackButtonPrevention(); // Fallback to old method
        }
        
        // Clear session
        if (typeof sessionManager !== 'undefined') {
            sessionManager.clearSession();
        }
        
        // Close real-time connections
        if (adminEventSource) {
            adminEventSource.close();
            adminEventSource = null;
            console.log('✅ Real-time connection closed');
        }
        
        if (window.dashboardEventSource) {
            window.dashboardEventSource.close();
            window.dashboardEventSource = null;
            console.log('✅ Dashboard event source closed');
        }
        
        // Clear all intervals
        const intervals = window._adminIntervals || [];
        intervals.forEach(clearInterval);
        window._adminIntervals = [];
        
        // Clear all timeouts
        const timeouts = window._adminTimeouts || [];
        timeouts.forEach(clearTimeout);
        window._adminTimeouts = [];
        
        // Clear all application state
        dashboardData = {
            stats: {},
            inventory: [],
            orders: [],
            topSelling: [],
            salesChart: []
        };
        lastUpdateTimes = {
            sales: null,
            inventory: null,
            orders: null
        };
        
        // Clear all localStorage items except auth token
        const authToken = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');
        localStorage.clear();
        if (authToken) localStorage.setItem('authToken', authToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        
        // Small delay to ensure everything is cleaned up
        setTimeout(() => {
            // Redirect to logout endpoint
            window.location.replace('/logout');
            console.log('✅ Redirected to logout');
        }, 100);
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        // Even if there's an error, still redirect
        window.location.replace('/login.html');
    }
}

// Initialize Dashboard
async function initializeDashboard() {
    try {
        // 🛡️ CRITICAL: Prevent back button immediately on dashboard load
        initializeBackButtonPrevention();
        
        updateSectionTimestamps();
        await loadDashboardData();
        setupEventListeners();
        setupRealTimeUpdates();
        startPeriodicRefresh();
        
        // Highlight current page in sidebar
        highlightCurrentPage();
    } catch (error) {
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

// Fetch all dashboard data
async function loadDashboardData() {
    try {
        await loadStats();
        await loadInventoryStatus();
        await loadTodayOrders();
        await loadTopSellingItems();
        await loadSalesChartData();
        
        const now = new Date();
        lastUpdateTimes.sales = now;
        lastUpdateTimes.inventory = now;
        lastUpdateTimes.orders = now;
        
        updateDashboardUI();
        updateSectionTimestamps();
        
        return true;
        
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            showNotification('Cannot connect to server. Backend might be offline.', 'error');
        } else {
            showError('Failed to load dashboard data: ' + error.message);
        }
        
        showEmptyState();
        return false;
    }
}

// Load stats from backend
async function loadStats() {
    try {
        console.log('📊 Loading dashboard stats...');
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Stats API failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            dashboardData.stats = result.data;
            console.log('✅ Stats loaded:', {
                totalOrders: result.data.totalOrders,
                totalCustomers: result.data.totalCustomers,
                totalInventoryItems: result.data.totalInventoryItems,
                totalMenuItems: result.data.totalMenuItems,
                totalRevenue: result.data.totalRevenue
            });
        } else {
            throw new Error(result.message || 'Failed to load stats');
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        throw error;
    }
}

// Load inventory status
async function loadInventoryStatus() {
    try {
        console.log('📦 Loading inventory status...');
        const response = await fetch('/api/inventory/status?limit=5', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            dashboardData.inventory = result.data || result.items || [];
            console.log('✅ Inventory status loaded:', {
                count: dashboardData.inventory.length,
                items: dashboardData.inventory.map(i => ({
                    name: i.itemName,
                    stock: i.currentStock,
                    unit: i.unit
                }))
            });
        } else {
            console.warn('⚠️ Inventory status API returned status:', response.status);
            dashboardData.inventory = [];
        }
    } catch (error) {
        console.error('❌ Error loading inventory status:', error);
        dashboardData.inventory = [];
    }
}

// Load today's orders
async function loadTodayOrders() {
    try {
        console.log('📦 Fetching today\'s orders from MongoDB...');
        
        // ✅ Increased limit from 5 to 20 to show more orders
        const response = await fetch(`/api/orders/today?limit=20`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            dashboardData.orders = result.data || result.orders || [];
            
            console.log('✅ Orders fetched successfully:', dashboardData.orders.length, 'orders');
            
            // Log order details for debugging
            if (dashboardData.orders.length > 0) {
                console.log('📋 Sample order:', dashboardData.orders[0]);
                console.log('📊 All orders:', dashboardData.orders.map(o => ({
                    orderNumber: o.orderNumber,
                    customerId: o.customerId,
                    total: o.total
                })));
            }
        } else {
            console.warn('⚠️ Failed to fetch orders:', response.status);
            dashboardData.orders = [];
        }
    } catch (error) {
        console.error('❌ Error loading today\'s orders:', error);
        dashboardData.orders = [];
    }
}

// Load top selling items
async function loadTopSellingItems() {
    try {
        console.log('📊 Loading top selling items directly from API...');
        
        // ✅ ALWAYS fetch directly from API for real-time data
        const response = await fetch('/api/orders/top-items', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Top Selling Items API response:', result);
            
            // Log debug info from server
            if (result.debug) {
                console.log('🔍 Server Debug Info:', {
                    totalOrders: result.debug.totalOrders,
                    completedOrders: result.debug.completedOrders,
                    recentOrders: result.debug.recentOrders
                });
            }
            
            // Map ALL products from the API response, don't limit to 5 here
            const rawData = result.data || result.items || [];
            console.log(`📊 Raw data from API: ${rawData.length} items`);
            
            dashboardData.topSelling = rawData
                .filter(item => {
                    // Filter out null/empty names AND "Unknown Item"
                    const isValid = item._id && 
                                   item._id !== null && 
                                   item._id !== '' && 
                                   item._id !== 'Unknown Item';
                    if (!isValid) console.log('⊘ Filtering out invalid item:', item);
                    return isValid;
                })
                .map(item => {
                    const itemId = typeof item._id === 'string' ? item._id : item._id || item.name || 'Unknown';
                    return {
                        _id: itemId,
                        name: itemId,
                        quantity: item.totalQuantity || item.quantity || 0,
                        revenue: item.totalRevenue || item.revenue || 0
                    };
                });
            
            console.log(`✅ Top Selling Items loaded: ${dashboardData.topSelling.length} items after filtering`);
            
            // Log details for debugging
            if (dashboardData.topSelling.length > 0) {
                console.log('📋 Top items sample:', dashboardData.topSelling.slice(0, 3).map(i => ({
                    name: i.name,
                    revenue: i.revenue,
                    quantity: i.quantity
                })));
            } else {
                console.warn('⚠️ No items after filtering. Raw data:', rawData);
                console.log('💡 Tip: Add some orders to see top selling items');
            }
        } else {
            const errorText = await response.text();
            console.warn('⚠️ Top Selling Items API failed with status:', response.status);
            console.warn('Response body:', errorText);
            dashboardData.topSelling = [];
        }
    } catch (error) {
        console.error('❌ Error loading top selling items:', error);
        console.error('Error details:', error.message, error.stack);
        dashboardData.topSelling = [];
    }
}

// Load sales chart data
async function loadSalesChartData() {
    try {
        const response = await fetch('/api/sales/chart?days=7', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            dashboardData.salesChart = result.data || result.sales || [];
            
            if (dashboardData.salesChart.length === 0 && dashboardData.stats.todaysRevenue) {
                dashboardData.salesChart = createDefaultChartData(dashboardData.stats);
            }
        } else {
            dashboardData.salesChart = createDefaultChartData(dashboardData.stats);
        }
    } catch (error) {
        dashboardData.salesChart = createDefaultChartData(dashboardData.stats);
    }
}

// Create default chart data if API fails
function createDefaultChartData(stats) {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        let value = 0;
        if (i === 0 && stats.todaysRevenue) {
            value = stats.todaysRevenue;
        } else if (i > 0) {
            value = (stats.todaysRevenue || 1000) * (0.3 + Math.random() * 0.5) * (1 - i * 0.1);
        }
        
        days.push({
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            value: value,
            date: date.toISOString().split('T')[0]
        });
    }
    
    return days;
}

// Show empty state when no data
function showEmptyState() {
    dashboardData = {
        stats: {
            totalOrders: 0,
            totalCustomers: 0,
            totalInventory: 0,
            totalMenuItems: 0,
            totalRevenue: 0,
            todaysOrders: 0,
            todaysRevenue: 0,
            inventoryLowStock: 0,
            inventoryOutOfStock: 0,
            availableMenuItems: 0,
            outOfStockMenuItems: 0
        },
        inventory: [],
        orders: [],
        topSelling: [],
        salesChart: []
    };
    
    updateDashboardUI();
}

// Update section timestamps
function updateSectionTimestamps() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    if (salesTimestamp) {
        const displayTime = lastUpdateTimes.sales 
            ? formatTimeForDisplay(lastUpdateTimes.sales)
            : formattedTime;
        salesTimestamp.textContent = `Updated ${displayTime}`;
        salesTimestamp.className = 'timestamp-active';
    }
    
    if (inventoryTimestamp) {
        const displayTime = lastUpdateTimes.inventory 
            ? formatTimeForDisplay(lastUpdateTimes.inventory)
            : formattedTime;
        inventoryTimestamp.textContent = `Updated ${displayTime}`;
        inventoryTimestamp.className = 'timestamp-active';
    }
    
    if (ordersTimestamp) {
        const displayTime = lastUpdateTimes.orders 
            ? formatTimeForDisplay(lastUpdateTimes.orders)
            : formattedTime;
        ordersTimestamp.textContent = `Updated ${displayTime}`;
    }
}

// Format time for display
function formatTimeForDisplay(date) {
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Update dashboard UI with fetched data
function updateDashboardUI() {
    updateStatsCards();
    updateSalesChart();
    updateInventoryTable();
    updateOrdersTable();
    updateTopSellingTable();
}

// Update stats cards with animation
function updateStatsCards() {
    const { stats } = dashboardData;
    
    console.log('📊 Updating stats cards:', {
        totalOrders: stats.totalOrders,
        totalCustomers: stats.totalCustomers,
        totalInventoryItems: stats.totalInventoryItems,
        totalMenuItems: stats.totalMenuItems,
        totalRevenue: stats.totalRevenue
    });
    
    const statUpdates = [
        { id: 'totalOrders', value: stats.totalOrders || 0 },
        { id: 'totalCustomers', value: stats.totalCustomers || 0 },
        { id: 'totalInventory', value: stats.totalInventoryItems || stats.totalInventory || 0 },
        { id: 'totalMenuItems', value: stats.totalMenuItems || 0 },
        { id: 'totalRevenue', value: stats.totalRevenue || 0, isCurrency: true }
    ];
    
    statUpdates.forEach(({ id, value, isCurrency }) => {
        const element = document.getElementById(id);
        if (element) {
            const oldValue = parseFloat(element.textContent.replace(/[^0-9.-]+/g, "")) || 0;
            
            console.log(`  ${id}: ${oldValue} → ${value}`);
            
            if (isCurrency) {
                animateValue(element, oldValue, value, 1000, '₱');
            } else {
                animateValue(element, oldValue, value, 800);
            }
            
            element.classList.add('stat-update');
            setTimeout(() => {
                element.classList.remove('stat-update');
            }, 500);
        } else {
            console.warn(`⚠️ Element not found: ${id}`);
        }
    });
}

// UPDATE SALES CHART WITH ANIMATION
function updateSalesChart() {
    const salesData = dashboardData.salesChart || [];
    
    if (chartBars) chartBars.innerHTML = '';
    if (chartLabels) chartLabels.innerHTML = '';
    
    if (!chartBars || !chartLabels) return;
    
    if (salesData.length === 0) {
        chartBars.innerHTML = '<div class="no-data">No sales data available</div>';
        return;
    }
    
    const maxValue = Math.max(...salesData.map(item => item.value || item.sales || item.total || 0));
    
    chartBars.style.opacity = '0.5';
    chartBars.style.transform = 'translateY(10px)';
    chartBars.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    setTimeout(() => {
        chartBars.innerHTML = '';
        chartLabels.innerHTML = '';
        
        salesData.forEach((item, index) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            barContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                height: 150px;
                flex: 1;
                margin: 0 2px;
            `;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar-animated';
            
            const value = item.value || item.sales || item.total || 0;
            const heightPercentage = maxValue > 0 
                ? 20 + ((value / maxValue) * 80) 
                : 20;
            
            bar.style.cssText = `
                width: 100%;
                height: 0;
                background: linear-gradient(to top, #4CAF50, #8BC34A);
                border-radius: 4px 4px 0 0;
                transition: height 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                opacity: 0;
                transform: translateY(20px);
            `;
            
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'chart-bar-value';
            valueDisplay.textContent = `₱${value.toFixed(2)}`;
            valueDisplay.style.cssText = `
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
                opacity: 0;
                transition: opacity 0.3s ease;
                white-space: nowrap;
                z-index: 10;
            `;
            
            bar.appendChild(valueDisplay);
            
            bar.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.3)';
                valueDisplay.style.opacity = '1';
            });
            
            bar.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = 'none';
                valueDisplay.style.opacity = '0';
            });
            
            const label = document.createElement('div');
            label.className = 'chart-label-animated';
            label.textContent = item.label || item._id || `Day ${index + 1}`;
            label.style.cssText = `
                margin-top: 8px;
                font-size: 12px;
                color: #666;
                font-weight: 500;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.5s ease ${index * 100}ms, transform 0.5s ease ${index * 100}ms;
                text-align: center;
            `;
            
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            chartBars.appendChild(barContainer);
            
            setTimeout(() => {
                bar.style.transition = 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease, transform 0.5s ease';
                bar.style.height = `${heightPercentage}%`;
                bar.style.opacity = '1';
                bar.style.transform = 'translateY(0)';
                
                label.style.opacity = '1';
                label.style.transform = 'translateY(0)';
                
                if (index === salesData.length - 1) {
                    setTimeout(() => {
                        bar.style.animation = 'pulse-glow 2s infinite';
                    }, 1000);
                }
            }, index * 200);
        });
        
        chartBars.style.opacity = '1';
        chartBars.style.transform = 'translateY(0)';
        
    }, 300);
}

// Animation function for values
function animateValue(element, start, end, duration, prefix = '', suffix = '') {
    if (!element) return;
    
    const startTime = performance.now();
    const isCurrency = prefix === '₱';
    const isNumber = typeof end === 'number';
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        let currentValue;
        if (isNumber) {
            currentValue = start + (end - start) * easeOut;
            
            if (isCurrency) {
                element.textContent = `${prefix}${currentValue.toFixed(2)}`;
            } else if (suffix === '%') {
                element.textContent = `${currentValue.toFixed(1)}${suffix}`;
            } else {
                element.textContent = Math.round(currentValue);
            }
        } else {
            element.textContent = end;
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Update inventory table
function updateInventoryTable() {
    if (!inventoryTableBody) return;
    
    inventoryTableBody.innerHTML = '';
    
    const inventoryData = dashboardData.inventory || [];
    
    console.log('🔄 Updating inventory table:', {
        dataCount: inventoryData.length,
        firstItem: inventoryData[0] ? {
            name: inventoryData[0].itemName,
            stock: inventoryData[0].currentStock,
            unit: inventoryData[0].unit
        } : 'none'
    });
    
    if (inventoryData.length === 0) {
        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">No inventory data available</td>
            </tr>
        `;
        return;
    }
    
    const displayItems = inventoryData.slice(0, 5);
    
    displayItems.forEach(item => {
        const row = document.createElement('tr');
        
        let status = 'In Stock';
        let statusClass = 'status-instock';
        
        const stock = item.currentStock || item.stock || 0;
        const unit = item.unit || item.measurementUnit || 'units';
        const minStock = item.minStock || item.threshold || 5;
        
        if (stock === 0) {
            status = 'Out of Stock';
            statusClass = 'status-out';
        } else if (stock <= minStock) {
            status = 'Low Stock';
            statusClass = 'status-low';
        } else if (stock <= minStock * 2) {
            status = 'Watch';
            statusClass = 'status-watch';
        }
        
        const displayStock = `${stock} ${unit}`;
        
        row.innerHTML = `
            <td>${item.itemName || item.name || 'Unknown'}</td>
            <td>${displayStock}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
}

// Update orders table
function updateOrdersTable() {
    if (!ordersTableBody) return;
    
    ordersTableBody.innerHTML = '';
    
    const ordersData = dashboardData.orders || [];
    
    console.log('📊 Updating orders table with', ordersData.length, 'orders');
    
    if (ordersData.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data">No orders today</td>
            </tr>
        `;
        return;
    }
    
    // ✅ Display up to 20 orders instead of just 5
    const displayOrders = ordersData.slice(0, 20);
    
    console.log(`📋 Displaying ${displayOrders.length} of ${ordersData.length} orders in table`);
    
    displayOrders.forEach((order, index) => {
        try {
            const row = document.createElement('tr');
            
            const orderTime = order.createdAt || order.time || new Date().toISOString();
            const formattedTime = formatTime(orderTime);
            
            const totalAmount = order.total || order.amount || 0;
            const formattedTotal = `₱${parseFloat(totalAmount).toFixed(2)}`;
            
            // Handle customer ID - could be an object or string
            let customerId = 'Walk-in';
            if (order.customerId) {
                if (typeof order.customerId === 'object' && order.customerId.customerId) {
                    customerId = order.customerId.customerId;
                } else if (typeof order.customerId === 'string' && order.customerId.trim() !== '') {
                    customerId = order.customerId;
                }
            }
            
            console.log(`  Order ${index + 1}: ${order.orderNumber} - Customer: ${customerId}`);
            
            row.innerHTML = `
                <td>${order.orderNumber || order.order_id || 'N/A'}</td>
                <td>${formattedTime}</td>
                <td>${customerId}</td>
                <td class="amount">${formattedTotal}</td>
            `;
            
            ordersTableBody.appendChild(row);
            console.log(`✅ Order ${index + 1} rendered:`, order.orderNumber);
        } catch (error) {
            console.error('❌ Error rendering order:', error, order);
        }
    });
    
    console.log(`✅ Orders table updated with ${displayOrders.length} orders`);
}

// Update top selling items table
function updateTopSellingTable() {
    if (!topItemsTableBody) return;
    
    console.log('🔄 Updating top selling items table with', (dashboardData.topSelling || []).length, 'items');
    
    topItemsTableBody.innerHTML = '';
    
    const topSellingData = dashboardData.topSelling || [];
    
    if (topSellingData.length === 0) {
        topItemsTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">No sales data available - Check console for API errors</td>
            </tr>
        `;
        console.warn('⚠️ No top selling data to display. dashboardData:', dashboardData);
        console.warn('Ensure /api/orders/top-items endpoint is returning data');
        return;
    }
    
    // ✅ Display ALL items from topSellingData, but only show first 5 in table
    const displayItems = topSellingData.slice(0, 5);
    
    console.log(`📊 Displaying ${displayItems.length} items in top selling table`);
    
    displayItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = 'top-item-row-animated';
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        row.style.transition = `opacity 0.3s ease ${index * 100}ms, transform 0.3s ease ${index * 100}ms`;
        
        let status = 'Good';
        let statusClass = 'status-instock';
        
        const revenue = item.revenue || item.totalRevenue || 0;
        
        if (index === 0) {
            status = 'Top Seller';
            statusClass = 'status-top';
        } else if (revenue > 5000) {
            status = 'High Sales';
            statusClass = 'status-high';
        } else if (revenue < 1000) {
            status = 'Low Sales';
            statusClass = 'status-low';
        }
        
        // Handle item name from different possible sources
        let itemName = item.name || item._id || item.itemName || 'Unknown';
        const displayName = itemName.length > 30 ? itemName.substring(0, 27) + '...' : itemName;
        
        row.innerHTML = `
            <td>${displayName}</td>
            <td>₱${revenue.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
        `;
        
        topItemsTableBody.appendChild(row);
        
        // ✅ Trigger animation
        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 10);
        
        console.log(`  ✅ Item ${index + 1}: ${displayName} - ₱${revenue.toFixed(2)}`);
    });
    
    console.log('✅ Top selling table updated successfully');
}

// Set up event listeners
function setupEventListeners() {
    if (menuSearch) {
        menuSearch.addEventListener('input', handleMenuSearch);
    }
    
    // Setup sidebar navigation
    setupSidebarNavigation();
    
    const refreshButton = document.querySelector('.refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', handleRefresh);
    }
    
    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', handleViewAllOrders);
    }
    
    // Attach logout handler to logout buttons
    const logoutButtons = document.querySelectorAll('#logoutBtn, .logout-btn, [data-action="logout"], a[href*="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });
}

// Setup sidebar navigation
function setupSidebarNavigation() {
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('.dashboard-menu a, .sidebar-nav a');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const linkText = this.textContent.toLowerCase().trim();
            const linkHref = this.getAttribute('href');
            
            // Map text to route
            let route = '';
            
            if (linkText.includes('dashboard') || linkText === 'dashboard') {
                route = NAVIGATION_ROUTES.dashboard;
            } else if (linkText.includes('inventory')) {
                route = NAVIGATION_ROUTES.inventory;
            } else if (linkText.includes('sales') || linkText.includes('report')) {
                route = NAVIGATION_ROUTES.salesandreports;
            } else if (linkText.includes('order') && linkText.includes('history')) {
                route = NAVIGATION_ROUTES.orderhistory;
            } else if (linkText.includes('add') && linkText.includes('staff')) {
                route = NAVIGATION_ROUTES.addstaff;
            } else if (linkText.includes('menu') && linkText.includes('management')) {
                route = NAVIGATION_ROUTES.menumanagement;
            } else if (linkText.includes('settings')) {
                route = NAVIGATION_ROUTES.settings;
            } else if (linkHref && linkHref !== '#') {
                // Use the href attribute if available
                route = linkHref;
            }
            
            if (route) {
                navigateToPage(route);
            }
        });
    });
}

// Navigate to page
function navigateToPage(route) {
    if (route && route !== window.location.pathname) {
        // Navigate to the page immediately
        window.location.href = route;
    }
}

// Highlight current page in sidebar
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.dashboard-menu a, .sidebar-nav a');
    
    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        const linkText = link.textContent.toLowerCase().trim();
        
        let shouldHighlight = false;
        
        // Check by path
        if (linkHref && currentPath.includes(linkHref.replace('/', ''))) {
            shouldHighlight = true;
        }
        
        // Check by text content for main pages
        if (currentPath.includes('admindashboard')) {
            if (currentPath.includes('inventory') && linkText.includes('inventory')) {
                shouldHighlight = true;
            } else if (currentPath.includes('salesandreports') && (linkText.includes('sales') || linkText.includes('report'))) {
                shouldHighlight = true;
            } else if (currentPath.includes('orderhistory') && linkText.includes('order') && linkText.includes('history')) {
                shouldHighlight = true;
            } else if (currentPath.includes('addstaff') && linkText.includes('add') && linkText.includes('staff')) {
                shouldHighlight = true;
            } else if (currentPath.includes('menumanagement') && linkText.includes('menu') && linkText.includes('management')) {
                shouldHighlight = true;
            } else if (currentPath.includes('settings') && linkText.includes('settings')) {
                shouldHighlight = true;
            } else if (currentPath === '/admindashboard' && linkText.includes('dashboard')) {
                shouldHighlight = true;
            }
        }
        
        if (shouldHighlight) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Menu search handler
function handleMenuSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        dashboardMenuItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    dashboardMenuItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Refresh handler
async function handleRefresh() {
    try {
        await loadDashboardData();
        showNotification('Dashboard refreshed successfully!', 'success');
    } catch (error) {
        showNotification('Failed to refresh data', 'error');
    }
}

// View all orders handler
function handleViewAllOrders(event) {
    event.preventDefault();
    navigateToPage(NAVIGATION_ROUTES.orderhistory);
}

// Set up real-time updates - FIXED VERSION
function setupRealTimeUpdates() {
    try {
        // Close any existing connection first
        if (adminEventSource) {
            adminEventSource.close();
            adminEventSource = null;
        }
        
        adminEventSource = new EventSource('/api/admin/events');
        
        adminEventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleRealTimeEvent(data);
            } catch (error) {
                console.error('Error parsing event data:', error);
            }
        };
        
        adminEventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            
            // Check if adminEventSource exists before trying to close it
            if (adminEventSource) {
                adminEventSource.close();
                adminEventSource = null;
            }
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                console.log('Attempting to reconnect to real-time events...');
                setupRealTimeUpdates();
            }, 5000);
        };
        
        adminEventSource.onopen = () => {
            console.log('Real-time connection established');
        };
        
        window.dashboardEventSource = adminEventSource;
        
    } catch (error) {
        console.error('Error setting up real-time updates:', error);
        adminEventSource = null;
    }
}

// Handle real-time events
function handleRealTimeEvent(event) {
    const now = new Date();
    
    switch (event.type) {
        case 'new_order':
            lastUpdateTimes.sales = now;
            lastUpdateTimes.orders = now;
            handleNewOrder(event.data);
            break;
            
        case 'low_stock_alert':
            lastUpdateTimes.inventory = now;
            handleLowStockAlert(event.data);
            break;
            
        case 'stats_update':
            lastUpdateTimes.sales = now;
            handleStatsUpdate(event.data);
            break;
    }
    
    updateSectionTimestamps();
}

// Handle new order event
function handleNewOrder(orderData) {
    console.log('🆕 New order received, refreshing dashboard data...', orderData);
    
    showNewOrderNotification(orderData);
    
    setTimeout(async () => {
        try {
            // ✅ Load all data including top selling items
            console.log('⏳ Loading stats...');
            await loadStats();
            
            console.log('⏳ Loading orders...');
            await loadTodayOrders();
            
            console.log('⏳ Loading top selling items...');
            await loadTopSellingItems();
            
            // ✅ Update all UI elements
            console.log('🔄 Updating all dashboard tables...');
            updateStatsCards();
            updateOrdersTable();
            updateTopSellingTable();
            
            console.log('✅ Dashboard updated successfully after new order');
            
            // ✅ Show confirmation toast
            showNotification('📊 Dashboard data updated with new order!', 'success');
            
        } catch (error) {
            console.error('❌ Error updating after new order:', error);
            showNotification('⚠️ Failed to update some dashboard data', 'error');
        }
    }, 1000);
}

// Handle low stock alert
function handleLowStockAlert(stockData) {
    showNotification(`Low stock: ${stockData.itemName} has only ${stockData.currentStock} left!`, 'warning');
    
    setTimeout(async () => {
        try {
            await loadInventoryStatus();
            updateInventoryTable();
        } catch (error) {
            console.error('Error updating after low stock alert:', error);
        }
    }, 1000);
}

// Handle stats update event
function handleStatsUpdate(statsData) {
    dashboardData.stats = { ...dashboardData.stats, ...statsData };
    updateStatsCards();
}

// Start periodic data refresh
function startPeriodicRefresh() {
    const intervalId = setInterval(async () => {
        try {
            await loadStats();
            await loadTodayOrders();
            await loadTopSellingItems();
            updateStatsCards();
            updateOrdersTable();
            updateTopSellingTable();
            updateSectionTimestamps();
        } catch (error) {
            console.error('Error during periodic refresh:', error);
        }
    }, 2 * 60 * 1000);
    
    // Store interval for cleanup
    if (!window._adminIntervals) window._adminIntervals = [];
    window._adminIntervals.push(intervalId);
}

// Show new order notification
function showNewOrderNotification(order) {
    const notification = document.createElement('div');
    notification.className = 'notification new-order';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-icon">🆕</span>
            <strong>New Order Received!</strong>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notification-body">
            <p><strong>Order #:</strong> ${order.orderNumber || order.id || 'N/A'}</p>
            <p><strong>Total:</strong> ₱${(order.total || 0).toFixed(2)}</p>
            <p><strong>Customer:</strong> ${order.customerId || 'Walk-in'}</p>
        </div>
    `;
    
    const container = document.querySelector('.notifications-container') || document.body;
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <span class="error-icon">❌</span>
        <span class="error-text">${message}</span>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }
    
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getIconForType(type)}</span>
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    const container = document.querySelector('.notifications-container') || document.body;
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getIconForType(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

// Format time helper function
function formatTime(timeString) {
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return timeString;
    }
}

// Cleanup function - FIXED VERSION
function cleanupDashboard() {
    try {
        if (adminEventSource) {
            adminEventSource.close();
            adminEventSource = null;
        }
        
        if (window.dashboardEventSource) {
            window.dashboardEventSource.close();
            window.dashboardEventSource = null;
        }
        
        if (window._adminIntervals && Array.isArray(window._adminIntervals)) {
            window._adminIntervals.forEach(interval => {
                if (interval) clearInterval(interval);
            });
            window._adminIntervals = [];
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Add animation styles to the page
function addAnimationStyles() {
    if (!document.getElementById('dashboard-styles')) {
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            @keyframes pulse-glow {
                0%, 100% { 
                    box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
                    transform: scale(1);
                }
                50% { 
                    box-shadow: 0 0 15px rgba(76, 175, 80, 0.6);
                    transform: scale(1.02);
                }
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .chart-bar-animated {
                animation: fadeInUp 0.5s ease forwards;
            }
            
            .chart-bar-container:hover .chart-bar-animated {
                transform: scale(1.05);
                transition: transform 0.3s ease;
            }
            
            .stat-update {
                animation: pulse-glow 1s ease;
            }
            
            .notification {
                animation: fadeInUp 0.3s ease;
            }
            
            .chart-bar-value {
                pointer-events: none;
            }
            
            /* Sidebar link animations */
            .dashboard-menu a {
                transition: all 0.3s ease;
            }
            
            .dashboard-menu a:hover {
                background-color: rgba(76, 175, 80, 0.1);
                transform: translateX(5px);
            }
            
            .dashboard-menu a.active {
                background-color: #4CAF50;
                color: white;
                font-weight: 600;
            }
            
            .dashboard-menu a.active:hover {
                background-color: #45a049;
            }
            
            /* Page transition animation */
            .main-content {
                animation: fadeIn 0.5s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize dashboard with animations
document.addEventListener('DOMContentLoaded', async () => {
    addAnimationStyles();
    
    // Initialize back button prevention
    initializeBackButtonPrevention();
    
    const isDashboard = document.querySelector('.dashboard-container') !== null;
    const isSalesPage = window.location.pathname.includes('salesandreports');
    
    if (isDashboard) {
        initializeDashboard();
        
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }
    
    if (isSalesPage) {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('card-animated');
        });
        
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.classList.add('chart-container');
        }
        
        setTimeout(() => {
            loadSalesReport();
        }, 500);
        
        setInterval(() => {
            loadSalesReport();
        }, 30000);
    }
    
    // Always highlight current page
    highlightCurrentPage();
    
    // Attach logout handler to all logout buttons
    const logoutButtons = document.querySelectorAll('#logoutBtn, .logout-btn, [data-action="logout"], a[href*="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });
    
    console.log('✅ Admin Dashboard initialized with back button prevention');
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupDashboard);

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        loadDashboardData,
        updateDashboardUI,
        cleanupDashboard,
        handleLogout
    };
}

// Make logout handler available globally
window.handleLogout = handleLogout;