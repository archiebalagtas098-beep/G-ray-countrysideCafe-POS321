// Order History Page Script

// Check if this is the order history page to avoid conflicts
if (window.location.pathname.includes('orderhistory')) {
    
    let orderHistoryAllOrders = [];
    let orderHistoryFilteredOrders = [];
    let orderHistoryCurrentPage = 1;
    const orderHistoryItemsPerPage = 10;

    // DOM Elements
    const ordersTable = document.getElementById('ordersTable');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    const pagination = document.getElementById('pagination');
    const topItemsBody = document.getElementById('topItemsBody');
    const inventoryStatusBody = document.getElementById('inventoryStatusBody');
    const todaysOrdersBody = document.getElementById('todaysOrdersBody');

    // Load orders on page load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📋 Order History page loaded');
        
        const isOrderHistoryPage = window.location.pathname.includes('orderhistory');
        
        if (isOrderHistoryPage) {
            console.log('🏁 Loading orders...');
            
            // Only load if elements exist
            if (ordersTableBody && noOrdersMessage) {
                // Load initial data
                loadOrders();
                
                if (inventoryStatusBody || topItemsBody || todaysOrdersBody) {
                    loadInventoryStatus();
                    loadTopItems();
                    loadTodaysOrders();
                }
                
                // Setup real-time updates for orders and top items
                setupRealTimeUpdates();
                
                // Refresh every 30 seconds
                setInterval(() => {
                    console.log('🔄 Refreshing orders...');
                    loadOrders();
                    
                    if (inventoryStatusBody || topItemsBody || todaysOrdersBody) {
                        loadInventoryStatus();
                        loadTopItems();
                        loadTodaysOrders();
                    }
                }, 30000);
            }
        }
    });

    // Setup real-time updates via Server-Sent Events
    function setupRealTimeUpdates() {
        try {
            console.log('🔗 Setting up real-time updates...');
            
            // Check if the endpoint exists before connecting
            fetch('/api/admin/events', { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        const eventSource = new EventSource('/api/admin/events');
                        
                        eventSource.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                handleRealTimeEvent(data);
                            } catch (error) {
                                console.error('❌ Error parsing event data:', error);
                            }
                        };
                        
                        eventSource.onerror = (error) => {
                            console.warn('⚠️ Real-time connection error, reconnecting...');
                            eventSource.close();
                            
                            // Retry connection after 5 seconds
                            setTimeout(() => {
                                setupRealTimeUpdates();
                            }, 5000);
                        };
                        
                        window.orderHistoryEventSource = eventSource;
                        console.log('✅ Real-time updates connected');
                    } else {
                        console.log('ℹ️ Real-time updates not available (endpoint not found)');
                    }
                })
                .catch(() => {
                    console.log('ℹ️ Real-time updates not available');
                });
            
        } catch (error) {
            console.error('❌ Error setting up real-time updates:', error);
        }
    }

    // Handle real-time events
    function handleRealTimeEvent(event) {
        console.log('📨 Real-time event received:', event.type);
        
        switch (event.type) {
            case 'new_order':
                console.log('📦 New order received, updating tables...');
                // Reload orders and top items when new order comes in
                loadOrders();
                loadTopItems();
                loadTodaysOrders();
                loadInventoryStatus();
                break;
                
            case 'inventory_update':
                console.log('📦 Inventory updated, refreshing...');
                loadInventoryStatus();
                break;
                
            case 'menu_update':
                console.log('🍽️ Menu updated, refreshing...');
                loadTopItems();
                break;
                
            case 'stats_update':
                console.log('📊 Stats updated, refreshing top items...');
                loadTopItems();
                break;
        }
    }

    async function loadOrders() {
        try {
            console.log('📦 Loading orders from database...');
            
            const response = await fetch('/api/orders', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error(`❌ HTTP error! status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Response received:', result);
            
            orderHistoryAllOrders = result.success ? result.data : [];
            
            console.log('📦 Orders loaded from database:', orderHistoryAllOrders.length);
            
            orderHistoryFilteredOrders = [...orderHistoryAllOrders];
            orderHistoryCurrentPage = 1;
            displayOrders();
            
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            displayNoOrders();
        }
    }

    function displayOrders() {
        if (orderHistoryFilteredOrders.length === 0) {
            displayNoOrders();
            return;
        }
        
        // Sort by date descending
        orderHistoryFilteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Calculate pagination
        const totalPages = Math.ceil(orderHistoryFilteredOrders.length / orderHistoryItemsPerPage);
        const startIndex = (orderHistoryCurrentPage - 1) * orderHistoryItemsPerPage;
        const endIndex = startIndex + orderHistoryItemsPerPage;
        const pageOrders = orderHistoryFilteredOrders.slice(startIndex, endIndex);
        
        // Clear table body
        ordersTableBody.innerHTML = '';
        
        // Add rows
        pageOrders.forEach(order => {
            const itemsList = order.items
                .map(item => `${item.name} (x${item.quantity})`)
                .join(', ');
            
            const dateTime = new Date(order.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const statusClass = `status-${order.status}`;
            const isPaid = order.payment?.status === 'completed';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderNumber || 'N/A'}</td>
                <td>${order.customerName || 'Walk-in'}</td>
                <td>${itemsList}</td>
                <td>₱${(order.total || 0).toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>${dateTime}</td>
                <td>${order.payment?.method || 'Cash'}</td>
                <td>
                    <button class="btn-view" onclick="viewOrderDetails('${order._id}')">View</button>
                    ${!isPaid ? `<button class="btn-pay" onclick="openPaymentModal('${order._id}', '${order.orderNumber}', ${order.total})">Pay</button>` : '<span class="status-badge status-completed">Paid</span>'}
                    <button class="btn-receipt" onclick="printReceipt('${order._id}')">Receipt</button>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
        
        // Show table and hide no orders message
        ordersTable.style.display = 'table';
        noOrdersMessage.style.display = 'none';
        
        // Update pagination
        updatePagination(totalPages);
    }

    function displayNoOrders() {
        ordersTable.style.display = 'none';
        noOrdersMessage.style.display = 'block';
        pagination.style.display = 'none';
        
        // Show message based on error state
        if (orderHistoryAllOrders.length === 0) {
            noOrdersMessage.innerHTML = ``;
        }
    }

    function updatePagination(totalPages) {
        const currentPageSpan = document.getElementById('currentPage');
        const totalPagesSpan = document.getElementById('totalPages');
        
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            currentPageSpan.textContent = orderHistoryCurrentPage;
            totalPagesSpan.textContent = totalPages;
        } else {
            pagination.style.display = 'none';
        }
    }

    function changePage(direction) {
        const totalPages = Math.ceil(orderHistoryFilteredOrders.length / orderHistoryItemsPerPage);
        const newPage = orderHistoryCurrentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            orderHistoryCurrentPage = newPage;
            displayOrders();
            window.scrollTo(0, 0);
        }
    }

    function searchOrders(query) {
        if (!query.trim()) {
            orderHistoryFilteredOrders = [...orderHistoryAllOrders];
        } else {
            const searchTerm = query.toLowerCase();
            orderHistoryFilteredOrders = orderHistoryAllOrders.filter(order => 
                order.orderNumber?.toLowerCase().includes(searchTerm) ||
                order.customerName?.toLowerCase().includes(searchTerm) ||
                order.items?.some(item => item.name?.toLowerCase().includes(searchTerm))
            );
        }
        orderHistoryCurrentPage = 1;
        displayOrders();
    }

    function filterOrders() {
        const statusFilter = document.getElementById('statusFilter').value;
        
        if (!statusFilter) {
            orderHistoryFilteredOrders = [...orderHistoryAllOrders];
        } else {
            orderHistoryFilteredOrders = orderHistoryAllOrders.filter(order => order.status === statusFilter);
        }
        orderHistoryCurrentPage = 1;
        displayOrders();
    }

    function filterByDate() {
        const dateFilter = document.getElementById('dateFilter').value;
        
        if (!dateFilter) {
            orderHistoryFilteredOrders = [...orderHistoryAllOrders];
        } else {
            const filterDate = new Date(dateFilter);
            filterDate.setHours(0, 0, 0, 0);
            
            orderHistoryFilteredOrders = orderHistoryAllOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.getTime() === filterDate.getTime();
            });
        }
        orderHistoryCurrentPage = 1;
        displayOrders();
    }

    function refreshOrders() {
        console.log('🔄 Manual refresh');
        loadOrders();
    }

    function viewOrderDetails(orderId) {
        const order = orderHistoryAllOrders.find(o => o._id === orderId);
        if (order) {
            // Create a modal or show details
            const itemsList = order.items.map(item => 
                `${item.name} - ${item.quantity} x ₱${item.price.toFixed(2)} = ₱${(item.price * item.quantity).toFixed(2)}`
            ).join('\n');
            
            alert(`Order #${order.orderNumber}\n\nCustomer: ${order.customerName || 'Walk-in'}\n\nItems:\n${itemsList}\n\nTotal: ₱${order.total.toFixed(2)}\nStatus: ${order.status}\nPayment: ${order.payment?.method || 'Cash'}`);
        }
    }

    async function loadInventoryStatus() {
        try {
            if (!inventoryStatusBody) return;
            
            const response = await fetch('/api/inventory');
            if (!response.ok) throw new Error('Failed to load inventory');
            
            const result = await response.json();
            const items = result.success ? result.data : [];
            
            inventoryStatusBody.innerHTML = '';
            
            if (items.length === 0) {
                inventoryStatusBody.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; color: #999; padding: 20px;">
                            No inventory items found
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Sort by stock level (lowest first - out of stock items first)
            items.sort((a, b) => a.currentStock - b.currentStock);
            
            items.slice(0, 5).forEach(item => {
                let status = 'In Stock';
                let statusClass = 'status-in-stock';
                
                if (item.currentStock === 0) {
                    status = 'Out of Stock';
                    statusClass = 'status-out-of-stock';
                } else if (item.currentStock <= 10) {
                    status = 'Low Stock';
                    statusClass = 'status-low-stock';
                }
                
                // Ensure unit has a default value if not provided
                const unit = item.unit || item.measurementUnit || 'pieces';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.itemName || item.name || 'Unknown'}</td>
                    <td>${item.currentStock} ${unit}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                `;
                inventoryStatusBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading inventory:', error);
            if (inventoryStatusBody) {
                inventoryStatusBody.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; color: #f44336; padding: 20px;">
                            Failed to load inventory data
                        </td>
                    </tr>
                `;
            }
        }
    }

    async function loadTopItems() {
        try {
            console.log('📊 Loading top items from MongoDB...');
            
            if (!topItemsBody) {
                console.warn('⚠️ topItemsBody element not found');
                return;
            }
            
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) throw new Error('Failed to load stats');
            
            const result = await response.json();
            const stats = result.success ? result.data : {};
            
            console.log('📦 Stats received from API:', stats);
            
            topItemsBody.innerHTML = '';
            
            // Get top selling items from response
            let topProducts = [];
            
            if (stats.topSellingProducts && Array.isArray(stats.topSellingProducts)) {
                topProducts = stats.topSellingProducts;
                console.log(`✅ Found ${topProducts.length} topSellingProducts from API`);
            } else if (stats.topItems && Array.isArray(stats.topItems)) {
                topProducts = stats.topItems;
                console.log(`✅ Found ${topProducts.length} topItems from API`);
            } else if (stats.topSellingItems && Array.isArray(stats.topSellingItems)) {
                topProducts = stats.topSellingItems;
                console.log(`✅ Found ${topProducts.length} topSellingItems from API`);
            }
            
            console.log('📋 Top Products raw data:', topProducts);
            
            if (topProducts.length > 0) {
                console.log('📋 Displaying top products from database:', topProducts.length);
                
                // Filter out items with invalid names, then take top 5
                const validProducts = topProducts.filter(product => {
                    let name = product._id || product.name || product.productName || product.itemName || '';
                    // Filter out if name is empty, null, 'Unknown', or just an ObjectID-like string
                    return name && name.trim() !== '' && name !== 'Unknown' && !/^[a-f0-9]{24}$/.test(name);
                }).slice(0, 5);
                
                console.log(`✅ Valid products after filtering: ${validProducts.length}`, validProducts);
                
                validProducts.forEach((product, index) => {
                    const row = document.createElement('tr');
                    
                    // Extract product information
                    let productName = 'Unknown';
                    let revenue = 0;
                    let quantity = 0;
                    
                    // Get product name from any available field
                    if (product._id && product._id.trim()) {
                        productName = product._id;
                    } else if (product.name && product.name.trim()) {
                        productName = product.name;
                    } else if (product.productName && product.productName.trim()) {
                        productName = product.productName;
                    } else if (product.itemName && product.itemName.trim()) {
                        productName = product.itemName;
                    }
                    
                    if (product.totalRevenue !== undefined) {
                        revenue = product.totalRevenue;
                    } else if (product.revenue !== undefined) {
                        revenue = product.revenue;
                    } else if (product.totalSales !== undefined) {
                        revenue = product.totalSales;
                    } else if (product.sales !== undefined) {
                        revenue = product.sales;
                    }
                    
                    if (product.totalQuantity !== undefined) {
                        quantity = product.totalQuantity;
                    } else if (product.quantity !== undefined) {
                        quantity = product.quantity;
                    } else if (product.count !== undefined) {
                        quantity = product.count;
                    }
                    
                    // Determine status
                    let status = 'Normal';
                    let statusClass = 'status-instock';
                    
                    if (index === 0) {
                        status = 'Top Seller';
                        statusClass = 'status-top';
                    } else if (revenue > 5000) {
                        status = 'High Sales';
                        statusClass = 'status-high';
                    } else if (revenue > 1000) {
                        status = 'Good Sales';
                        statusClass = 'status-good';
                    } else if (revenue > 0) {
                        status = 'Low Sales';
                        statusClass = 'status-low';
                    } else {
                        status = 'No Sales';
                        statusClass = 'status-out-of-stock';
                    }
                    
                    // Truncate long product names
                    const displayName = productName.length > 25 
                        ? productName.substring(0, 22) + '...' 
                        : productName;
                    
                    // Format revenue
                    const formattedRevenue = new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        minimumFractionDigits: 2
                    }).format(revenue);
                    
                    row.innerHTML = `
                        <td>
                            <div class="product-name">${displayName}</div>
                            ${quantity > 0 ? `<small class="text-muted">Sold: ${quantity} units</small>` : ''}
                        </td>
                        <td class="revenue-cell">${formattedRevenue}</td>
                        <td><span class="status-badge ${statusClass}">${status}</span></td>
                    `;
                    topItemsBody.appendChild(row);
                });
                
            } else {
                topItemsBody.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; color: #999; padding: 30px;">
                            <div style="margin-bottom: 10px;">
                                <i class="fas fa-chart-bar" style="font-size: 24px; color: #ccc;"></i>
                            </div>
                            No sales data available yet
                            <div style="margin-top: 10px; font-size: 12px;">
                                Sales data will appear here once you start making sales
                            </div>
                        </td>
                    </tr>
                `;
            }
            
        } catch (error) {
            console.error('❌ Error loading top items:', error);
            if (topItemsBody) {
                topItemsBody.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; color: #f44336; padding: 20px;">
                            <div style="margin-bottom: 10px;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                            </div>
                            Error loading sales data
                            <div style="margin-top: 10px; font-size: 12px;">
                                ${error.message}
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Load today's orders separately
    async function loadTodaysOrders() {
        try {
            if (!todaysOrdersBody) return;
            
            // Fetch today's orders from API
            const response = await fetch('/api/orders/today?limit=5');
            if (!response.ok) throw new Error('Failed to load today\'s orders');
            
            const result = await response.json();
            const todayOrders = result.success ? result.data : [];
            
            todaysOrdersBody.innerHTML = '';
            
            if (todayOrders.length > 0) {
                todayOrders.slice(0, 5).forEach(order => {
                    const time = new Date(order.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${order.orderNumber || 'N/A'}</td>
                        <td>${time}</td>
                        <td>${order.customerName || 'Walk-in'}</td>
                        <td>₱${(order.total || 0).toFixed(2)}</td>
                    `;
                    todaysOrdersBody.appendChild(row);
                });
            } else {
                todaysOrdersBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: #999; padding: 20px;">
                            No orders today
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error loading today\'s orders:', error);
            if (todaysOrdersBody) {
                todaysOrdersBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: #f44336; padding: 20px;">
                            Failed to load today's orders
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Payment Modal Functions
    function openPaymentModal(orderId, orderNumber, totalAmount) {
        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-content">
                <div class="modal-header">
                    <h2>Process Payment</h2>
                    <button class="close-btn" onclick="closePaymentModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="payment-details">
                        <p><strong>Order Number:</strong> ${orderNumber}</p>
                        <p><strong>Total Amount:</strong> <span class="amount">₱${totalAmount.toFixed(2)}</span></p>
                    </div>
                    <form id="paymentForm">
                        <div class="form-group">
                            <label>Payment Method:</label>
                            <select id="paymentMethod" required>
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount Paid (₱):</label>
                            <input type="number" id="amountPaid" placeholder="Enter amount" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Change:</label>
                            <input type="text" id="changeDisplay" readonly placeholder="₱0.00" class="change-display">
                        </div>
                        <div id="paymentError" class="error-message" style="display: none;"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="closePaymentModal()">Cancel</button>
                    <button class="btn-process" onclick="processPayment('${orderId}', ${totalAmount})">Process Payment</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener for change calculation
        document.getElementById('amountPaid').addEventListener('input', function() {
            const amountPaid = parseFloat(this.value) || 0;
            const change = amountPaid - totalAmount;
            const changeDisplay = document.getElementById('changeDisplay');
            
            if (change < 0) {
                changeDisplay.value = '₱' + Math.abs(change).toFixed(2) + ' (Shortfall)';
                changeDisplay.style.color = 'red';
            } else {
                changeDisplay.value = '₱' + change.toFixed(2);
                changeDisplay.style.color = 'green';
            }
        });
    }

    function closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.remove();
        }
    }

    async function processPayment(orderId, totalAmount) {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value);
        const paymentMethod = document.getElementById('paymentMethod').value;
        const errorDiv = document.getElementById('paymentError');
        
        // Validate
        if (!amountPaid || amountPaid <= 0) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Please enter a valid amount';
            return;
        }
        
        if (amountPaid < totalAmount) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Insufficient payment amount';
            return;
        }
        
        try {
            const response = await fetch(`/api/orders/${orderId}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amountPaid: amountPaid,
                    paymentMethod: paymentMethod
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Close modal
                closePaymentModal();
                
                // Show success message
                alert('Payment processed successfully!\nChange: ₱' + result.receipt.change.toFixed(2));
                
                // Reload orders to update the table
                loadOrders();
                
                // Generate and print receipt
                if (result.receipt) {
                    generateReceipt(result.receipt);
                }
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = result.message || 'Failed to process payment';
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Error processing payment: ' + error.message;
        }
    }

    function generateReceipt(receiptData) {
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${receiptData.orderNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-header h1 { margin: 0; font-size: 24px; }
                    .receipt-header p { margin: 5px 0; color: #666; }
                    .receipt-items { margin: 20px 0; border-top: 1px dashed #ddd; border-bottom: 1px dashed #ddd; padding: 10px 0; }
                    .receipt-item { display: flex; justify-content: space-between; margin: 8px 0; }
                    .receipt-item-name { flex: 1; }
                    .receipt-item-qty { width: 40px; text-align: center; }
                    .receipt-item-price { width: 80px; text-align: right; }
                    .receipt-totals { margin: 20px 0; }
                    .receipt-total-row { display: flex; justify-content: space-between; margin: 8px 0; }
                    .receipt-total-amount { font-weight: bold; font-size: 18px; }
                    .receipt-payment { margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ddd; }
                    .receipt-payment-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .receipt-footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    @media print {
                        body { margin: 0; }
                        .btn { display: none; }
                    }
                    .btn { 
                        background: #007bff; 
                        color: white; 
                        padding: 10px 20px; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        margin: 10px 5px;
                        width: calc(50% - 10px);
                    }
                    .btn:hover { background: #0056b3; }
                    .btn-container { text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="receipt-header">
                        <h1>RECEIPT</h1>
                        <p>Order #${receiptData.orderNumber}</p>
                        <p>${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div class="receipt-items">
                        <h3>Items:</h3>
                        ${receiptData.items.map(item => `
                            <div class="receipt-item">
                                <div class="receipt-item-name">${item.name}</div>
                                <div class="receipt-item-qty">x${item.quantity}</div>
                                <div class="receipt-item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="receipt-totals">
                        <div class="receipt-total-row">
                            <span>Subtotal:</span>
                            <span>₱${receiptData.subtotal.toFixed(2)}</span>
                        </div>
                        ${receiptData.tax > 0 ? `
                            <div class="receipt-total-row">
                                <span>Tax:</span>
                                <span>₱${receiptData.tax.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="receipt-total-row receipt-total-amount">
                            <span>Total:</span>
                            <span>₱${receiptData.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="receipt-payment">
                        <h3>Payment:</h3>
                        <div class="receipt-payment-row">
                            <span>Method:</span>
                            <span>${receiptData.paymentMethod.toUpperCase()}</span>
                        </div>
                        <div class="receipt-payment-row">
                            <span>Amount Paid:</span>
                            <span>₱${receiptData.amountPaid.toFixed(2)}</span>
                        </div>
                        <div class="receipt-payment-row receipt-total-amount">
                            <span>Change:</span>
                            <span>₱${receiptData.change.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="receipt-footer">
                        <p>Thank you for your purchase!</p>
                        <p>Gray Countryside Cafe</p>
                    </div>
                    
                    <div class="btn-container">
                        <button class="btn" onclick="window.print()">Print Receipt</button>
                        <button class="btn" onclick="window.close()">Close</button>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Open receipt in new window
        const receiptWindow = window.open('', 'Receipt', 'width=600,height=800');
        receiptWindow.document.write(receiptHTML);
        receiptWindow.document.close();
    }

    function printReceipt(orderId) {
        const order = orderHistoryAllOrders.find(o => o._id === orderId);
        if (order) {
            const receiptData = {
                orderNumber: order.orderNumber,
                items: order.items,
                subtotal: order.subtotal || order.total,
                tax: order.tax || 0,
                total: order.total,
                paymentMethod: order.payment?.method || 'Cash',
                amountPaid: order.payment?.amountPaid || order.total,
                change: order.payment?.change || 0
            };
            generateReceipt(receiptData);
        } else {
            alert('Order not found');
        }
    }

    // Expose functions to global scope for inline onclick handlers
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
    window.processPayment = processPayment;
    window.generateReceipt = generateReceipt;
    window.printReceipt = printReceipt;
    window.loadOrders = loadOrders;
    window.displayOrders = displayOrders;
    window.changePage = changePage;
    window.searchOrders = searchOrders;
    window.filterOrders = filterOrders;
    window.filterByDate = filterByDate;
    window.refreshOrders = refreshOrders;
    window.viewOrderDetails = viewOrderDetails;

} // End of order history page check