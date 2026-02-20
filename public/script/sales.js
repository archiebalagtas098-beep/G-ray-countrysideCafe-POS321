// Sales Report Page Script with Animations

let salesData = {
    totalRevenue: 0,
    grossSalesRevenue: 0,      // ✅ Total money from sales
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    grossProfit: 0,
    margin: 0,
    dailySales: [],
    recentOrders: []
};

function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '₱0.00';
    return '₱' + parseFloat(amount).toFixed(2);
}

function formatPercent(value) {
    if (!value || isNaN(value)) return '0%';
    return parseFloat(value).toFixed(1) + '%';
}

// Animation functions
function animateValue(element, start, end, duration, prefix = '', suffix = '') {
    if (!element) return;
    
    const startTime = performance.now();
    const isCurrency = prefix === '₱';
    const isNumber = typeof end === 'number';
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
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

function fadeInElement(element, delay = 0) {
    if (!element) return;
    
    setTimeout(() => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        // Trigger reflow
        void element.offsetWidth;
        
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, delay);
}

function pulseElement(element) {
    if (!element) return;
    
    element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    element.style.transform = 'scale(1.05)';
    element.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    }, 300);
}

function animateProgressBar(bar, targetHeight, duration = 1000) {
    if (!bar) return;
    
    const startHeight = 0;
    const startTime = performance.now();
    
    function updateBar(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentHeight = startHeight + (targetHeight - startHeight) * easeOut;
        
        bar.style.height = `${currentHeight}%`;
        
        // Add glow effect for today's bar
        if (bar.dataset.isToday === 'true') {
            const intensity = 1 + (0.5 * easeOut);
            bar.style.boxShadow = `0 0 ${10 * intensity}px rgba(76, 175, 80, ${0.3 * easeOut})`;
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateBar);
        }
    }
    
    requestAnimationFrame(updateBar);
}

// Main export function
function exportSalesReport(format = 'pdf') {
    console.log(`📤 Exporting sales report as ${format.toUpperCase()}...`);
    
    // Get current date for filename
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // Show export loading state
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        const originalHTML = exportBtn.innerHTML;
        exportBtn.innerHTML = '<span class="loading-spinner"></span> Exporting...';
        exportBtn.disabled = true;
        
        // Restore button after export
        setTimeout(() => {
            exportBtn.innerHTML = originalHTML;
            exportBtn.disabled = false;
            
            // Show success animation
            exportBtn.classList.add('export-success');
            setTimeout(() => {
                exportBtn.classList.remove('export-success');
            }, 2000);
        }, 1500);
    }
    
    // Create report data object
    const reportData = {
        title: `Sales Report - ${today.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`,
        generated: today.toISOString(),
        cafeName: "Gray Countryside Cafe",
        summary: {
            totalRevenue: salesData.totalRevenue,
            totalOrders: salesData.totalOrders,
            totalCustomers: salesData.totalCustomers,
            averageOrderValue: salesData.avgOrderValue,
            grossProfit: salesData.grossProfit,
            profitMargin: salesData.margin
        },
        dailyData: salesData.dailySales || [],
        recentOrders: salesData.recentOrders || []
    };
    
    // Different export methods based on format
    switch(format.toLowerCase()) {
        case 'pdf':
            exportToPDF(reportData, dateStr, timeStr);
            break;
        case 'excel':
            exportToExcel(reportData, dateStr, timeStr);
            break;
        case 'csv':
            exportToCSV(reportData, dateStr, timeStr);
            break;
        case 'print':
            instantPrint(reportData); // Use instant print instead
            break;
        default:
            exportToPDF(reportData, dateStr, timeStr);
    }
}

// INSTANT PRINT FUNCTION (no new window)
function instantPrint(reportData) {
    try {
        console.log('Generating instant print...', reportData);
        
        // Helper functions for the report
        const formatCurrency = (amount) => {
            return '₱' + parseFloat(amount).toFixed(2);
        };
        
        const formatPercent = (value) => {
            return parseFloat(value).toFixed(1) + '%';
        };
        
        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportData.title}</title>
                <style>
                    @media print {
                        @page { 
                            margin: 15mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            font-size: 12px;
                            color: #000000 !important;
                            margin: 0;
                            padding: 10px;
                        }
                        * {
                            color: #000000 !important;
                        }
                        .print-only { 
                            display: block !important; 
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                    @media screen {
                        body { 
                            display: none; 
                        }
                    }
                    .print-only {
                        display: none;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 15px; 
                        margin-bottom: 20px; 
                    }
                    .header h1 { 
                        color: #000; 
                        margin: 0; 
                        font-size: 22px;
                    }
                    .header .cafe-name { 
                        color: #000; 
                        font-size: 14px; 
                        margin: 5px 0;
                    }
                    .header .subtitle { 
                        color: #000; 
                        font-size: 12px; 
                    }
                    .summary-grid { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 10px; 
                        margin: 20px 0; 
                    }
                    .summary-card { 
                        border: 1px solid #000; 
                        padding: 10px; 
                        border-radius: 3px; 
                        background: #fff;
                    }
                    .summary-card h3 { 
                        margin: 0 0 8px 0; 
                        color: #000; 
                        font-size: 12px; 
                        font-weight: bold;
                    }
                    .summary-card .value { 
                        font-size: 18px; 
                        font-weight: bold; 
                        color: #000; 
                        margin-bottom: 3px;
                    }
                    .summary-card .label { 
                        font-size: 10px; 
                        color: #000; 
                    }
                    .section { 
                        margin: 20px 0; 
                        page-break-inside: avoid;
                    }
                    .section h2 { 
                        color: #000; 
                        border-bottom: 1px solid #000; 
                        padding-bottom: 8px; 
                        margin-bottom: 15px;
                        font-size: 16px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 15px 0; 
                        border: 1px solid #000;
                        font-size: 11px;
                    }
                    th { 
                        background: #f0f0f0; 
                        color: #000; 
                        padding: 8px; 
                        text-align: left; 
                        font-weight: 600;
                        border: 1px solid #000;
                    }
                    td { 
                        padding: 6px; 
                        border: 1px solid #000;
                        color: #000;
                    }
                    .footer { 
                        margin-top: 30px; 
                        text-align: center; 
                        color: #000; 
                        font-size: 10px; 
                        border-top: 1px solid #000; 
                        padding-top: 15px; 
                    }
                </style>
            </head>
            <body class="print-only">
                <div class="header">
                    <h1>${reportData.title}</h1>
                    <div class="cafe-name">${reportData.cafeName}</div>
                    <div class="subtitle">Generated on ${new Date(reportData.generated).toLocaleString()}</div>
                </div>
                
                <div class="section">
                    <h2>Performance Summary</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <h3>Total Revenue</h3>
                            <div class="value">${formatCurrency(reportData.summary.totalRevenue)}</div>
                            <div class="label">Total revenue</div>
                        </div>
                        <div class="summary-card">
                            <h3>Total Orders</h3>
                            <div class="value">${reportData.summary.totalOrders}</div>
                            <div class="label">Completed orders</div>
                        </div>
                        <div class="summary-card">
                            <h3>Total Customers</h3>
                            <div class="value">${reportData.summary.totalCustomers}</div>
                            <div class="label">Unique customers</div>
                        </div>
                        <div class="summary-card">
                            <h3>Avg Order Value</h3>
                            <div class="value">${formatCurrency(reportData.summary.averageOrderValue)}</div>
                            <div class="label">Per order average</div>
                        </div>
                        <div class="summary-card">
                            <h3>Gross Profit</h3>
                            <div class="value">${formatCurrency(reportData.summary.grossProfit)}</div>
                            <div class="label">Estimated profit</div>
                        </div>
                        <div class="summary-card">
                            <h3>Profit Margin</h3>
                            <div class="value">${formatPercent(reportData.summary.profitMargin)}</div>
                            <div class="label">Profit percentage</div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Financial Summary</h2>
                    <table>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                        <tr>
                            <td>Total Revenue</td>
                            <td>${formatCurrency(reportData.summary.totalRevenue)}</td>
                        </tr>
                        <tr>
                            <td>Cost of Goods (70%)</td>
                            <td>${formatCurrency(reportData.summary.totalRevenue * 0.7)}</td>
                        </tr>
                        <tr style="background-color: #f9f9f9;">
                            <td><strong>Gross Profit (30%)</strong></td>
                            <td><strong>${formatCurrency(reportData.summary.grossProfit)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                ${reportData.recentOrders.length > 0 ? `
                    <div class="section">
                        <h2>Recent Orders (Last 5)</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.recentOrders.slice(0, 5).map(order => `
                                    <tr>
                                        <td>#${order.orderNumber || 'N/A'}</td>
                                        <td>${new Date(order.createdAt || new Date()).toLocaleDateString()}</td>
                                        <td>${order.customerName || 'Walk-in'}</td>
                                        <td>${order.itemCount || 0}</td>
                                        <td>${formatCurrency(order.total || 0)}</td>
                                        <td>${order.status || 'Completed'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>Generated by Gray Countryside Cafe POS System</p>
                    <p>Report ID: ${dateStr}-${timeStr}</p>
                    <p>© ${new Date().getFullYear()} For School Purposes Only</p>
                </div>
                
                <script>
                    // Auto-print when loaded
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                window.close ? window.close() : document.body.innerHTML = '';
                            }, 100);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        iframeDoc.close();
        
        // Trigger print after iframe loads
        iframe.onload = function() {
            setTimeout(function() {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Clean up after printing
                setTimeout(function() {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };
        
        showNotification('Opening print dialog...', 'info');
        
    } catch (error) {
        console.error('Error printing report:', error);
        showNotification('Failed to open print dialog. Please try again.', 'error');
    }
}

// Helper export functions
function exportToPDF(reportData, dateStr, timeStr) {
    try {
        console.log('Generating PDF report...', reportData);
        
        // Create a printable HTML report
        const printWindow = window.open('', '_blank');
        
        // Helper functions for the report
        const formatCurrency = (amount) => {
            return '₱' + parseFloat(amount).toFixed(2);
        };
        
        const formatPercent = (value) => {
            return parseFloat(value).toFixed(1) + '%';
        };
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportData.title}</title>
                <style>
                    /* Print-specific styles */
                    @media print {
                        body { 
                            margin: 15mm; 
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            font-size: 12px;
                        }
                        h1, h2, h3, h4, h5, h6, p, span, div, td, th {
                            color: #000000 !important;
                        }
                        .no-print { 
                            display: none !important; 
                        }
                        @page {
                            margin: 15mm;
                        }
                    }
                    
                    /* Screen styles */
                    @media screen {
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 40px; 
                            color: #333;
                        }
                        .no-print {
                            text-align: center; 
                            margin-top: 30px;
                            padding: 20px;
                            background: #f5f5f5;
                            border-radius: 10px;
                        }
                    }
                    
                    /* Common styles */
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 15px; 
                        margin-bottom: 20px; 
                    }
                    .header h1 { 
                        color: #000; 
                        margin: 0; 
                        font-size: 22px;
                    }
                    .header .cafe-name { 
                        color: #000; 
                        font-size: 14px; 
                        margin: 5px 0;
                    }
                    .header .subtitle { 
                        color: #000; 
                        font-size: 12px; 
                    }
                    .summary-grid { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 10px; 
                        margin: 20px 0; 
                    }
                    .summary-card { 
                        border: 1px solid #000; 
                        padding: 10px; 
                        border-radius: 3px; 
                        background: #fff;
                    }
                    .summary-card h3 { 
                        margin: 0 0 8px 0; 
                        color: #000; 
                        font-size: 12px; 
                        font-weight: bold;
                    }
                    .summary-card .value { 
                        font-size: 18px; 
                        font-weight: bold; 
                        color: #000; 
                        margin-bottom: 3px;
                    }
                    .summary-card .label { 
                        font-size: 10px; 
                        color: #000; 
                    }
                    .section { 
                        margin: 20px 0; 
                    }
                    .section h2 { 
                        color: #000; 
                        border-bottom: 1px solid #000; 
                        padding-bottom: 8px; 
                        margin-bottom: 15px;
                        font-size: 16px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 15px 0; 
                        border: 1px solid #000;
                        font-size: 11px;
                    }
                    th { 
                        background: #f0f0f0; 
                        color: #000; 
                        padding: 8px; 
                        text-align: left; 
                        font-weight: 600;
                        border: 1px solid #000;
                    }
                    td { 
                        padding: 6px; 
                        border: 1px solid #000;
                        color: #000;
                    }
                    .footer { 
                        margin-top: 30px; 
                        text-align: center; 
                        color: #000; 
                        font-size: 10px; 
                        border-top: 1px solid #000; 
                        padding-top: 15px; 
                    }
                    button {
                        padding: 10px 20px; 
                        margin: 5px;
                        border: 1px solid #000;
                        border-radius: 5px; 
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .print-btn {
                        background: #4CAF50;
                        color: white;
                    }
                    .close-btn {
                        background: #95a5a6;
                        color: white;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${reportData.title}</h1>
                    <div class="cafe-name">${reportData.cafeName}</div>
                    <div class="subtitle">Generated on ${new Date(reportData.generated).toLocaleString()}</div>
                </div>
                
                <div class="section">
                    <h2>Performance Summary</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <h3>Total Revenue</h3>
                            <div class="value">${formatCurrency(reportData.summary.totalRevenue)}</div>
                            <div class="label">Total revenue</div>
                        </div>
                        <div class="summary-card">
                            <h3>Total Orders</h3>
                            <div class="value">${reportData.summary.totalOrders}</div>
                            <div class="label">Completed orders</div>
                        </div>
                        <div class="summary-card">
                            <h3>Total Customers</h3>
                            <div class="value">${reportData.summary.totalCustomers}</div>
                            <div class="label">Unique customers</div>
                        </div>
                        <div class="summary-card">
                            <h3>Avg Order Value</h3>
                            <div class="value">${formatCurrency(reportData.summary.averageOrderValue)}</div>
                            <div class="label">Per order average</div>
                        </div>
                        <div class="summary-card">
                            <h3>Gross Profit</h3>
                            <div class="value">${formatCurrency(reportData.summary.grossProfit)}</div>
                            <div class="label">Estimated profit</div>
                        </div>
                        <div class="summary-card">
                            <h3>Profit Margin</h3>
                            <div class="value">${formatPercent(reportData.summary.profitMargin)}</div>
                            <div class="label">Profit percentage</div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Financial Summary</h2>
                    <table>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                        <tr>
                            <td>Total Revenue</td>
                            <td>${formatCurrency(reportData.summary.totalRevenue)}</td>
                        </tr>
                        <tr>
                            <td>Cost of Goods (70%)</td>
                            <td>${formatCurrency(reportData.summary.totalRevenue * 0.7)}</td>
                        </tr>
                        <tr style="background-color: #f9f9f9;">
                            <td><strong>Gross Profit (30%)</strong></td>
                            <td><strong>${formatCurrency(reportData.summary.grossProfit)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                ${reportData.recentOrders.length > 0 ? `
                    <div class="section">
                        <h2>Recent Orders (Last 5)</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.recentOrders.slice(0, 5).map(order => `
                                    <tr>
                                        <td>#${order.orderNumber || 'N/A'}</td>
                                        <td>${new Date(order.createdAt || new Date()).toLocaleDateString()}</td>
                                        <td>${order.customerName || 'Walk-in'}</td>
                                        <td>${order.itemCount || 0}</td>
                                        <td>${formatCurrency(order.total || 0)}</td>
                                        <td>${order.status || 'Completed'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>Generated by Gray Countryside Cafe POS System</p>
                    <p>Report ID: ${dateStr}-${timeStr}</p>
                    <p>© ${new Date().getFullYear()} For School Purposes Only</p>
                </div>
                
                <div class="no-print">
                    <button class="print-btn" onclick="window.print()">
                        🖨️ Print Report
                    </button>
                    <button class="close-btn" onclick="window.close()">
                        ✕ Close Window
                    </button>
                    <p style="margin-top: 10px; color: #666; font-size: 12px;">
                        Press Ctrl+P to print or save as PDF
                    </p>
                </div>
                
                <script>
                    // Auto-open print dialog for PDF
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        showNotification('Opening print dialog for PDF...', 'info');
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showNotification('Failed to export PDF. Please try again.', 'error');
    }
}

function exportToExcel(reportData, dateStr, timeStr) {
    try {
        console.log('Generating Excel report...', reportData);
        
        // Create CSV content
        let csvContent = "SALES REPORT - GRAY COUNTRYSIDE CAFE\n";
        csvContent += `Generated: ${new Date(reportData.generated).toLocaleString()}\n\n`;
        
        // Summary section
        csvContent += "PERFORMANCE SUMMARY\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Revenue,${reportData.summary.totalRevenue}\n`;
        csvContent += `Total Orders,${reportData.summary.totalOrders}\n`;
        csvContent += `Total Customers,${reportData.summary.totalCustomers}\n`;
        csvContent += `Average Order Value,${reportData.summary.averageOrderValue}\n`;
        csvContent += `Gross Profit,${reportData.summary.grossProfit}\n`;
        csvContent += `Profit Margin,${reportData.summary.profitMargin}%\n\n`;
        
        // Financial summary
        csvContent += "FINANCIAL SUMMARY\n";
        csvContent += "Description,Amount\n";
        csvContent += `Total Revenue,${reportData.summary.totalRevenue}\n`;
        csvContent += `Cost of Goods,${reportData.summary.totalRevenue * 0.7}\n`;
        csvContent += `Gross Profit,${reportData.summary.grossProfit}\n\n`;
        
        // Recent orders section
        if (reportData.recentOrders.length > 0) {
            csvContent += "RECENT ORDERS\n";
            csvContent += "Order Number,Date,Customer,Items,Total,Status\n";
            reportData.recentOrders.slice(0, 5).forEach(order => {
                csvContent += `${order.orderNumber || 'N/A'},`;
                csvContent += `${new Date(order.createdAt || new Date()).toLocaleDateString()},`;
                csvContent += `${order.customerName || 'Walk-in'},`;
                csvContent += `${order.itemCount || 0},`;
                csvContent += `${order.total || 0},`;
                csvContent += `${order.status || 'Completed'}\n`;
            });
        }
        
        // Create and download the file
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Sales_Report_${dateStr}_${timeStr}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Excel report downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showNotification('Failed to export Excel file. Please try again.', 'error');
    }
}

function exportToCSV(reportData, dateStr, timeStr) {
    // Use the same function as Excel
    exportToExcel(reportData, dateStr, timeStr);
}

// Notification function
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.export-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `export-notification export-notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="notification-text">${message}</span>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#export-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'export-notification-styles';
        style.textContent = `
            .export-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 300px;
                max-width: 400px;
            }
            
            .export-notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .export-notification-success {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                border-left: 4px solid #2E7D32;
            }
            
            .export-notification-error {
                background: linear-gradient(135deg, #f44336, #d32f2f);
                border-left: 4px solid #c62828;
            }
            
            .export-notification-info {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                border-left: 4px solid #1565C0;
            }
            
            .notification-icon {
                font-size: 18px;
                font-weight: bold;
            }
            
            .notification-text {
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

async function loadSalesReport() {
    try {
        console.log('📊 Loading sales report data...');
        
        // Show loading animation
        const loadingElements = document.querySelectorAll('.stat-card, .gross-profit-card, #salesTableBody, #chartBars');
        loadingElements.forEach(el => {
            if (el) el.classList.add('loading-pulse');
        });
        
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const stats = result.success ? result.data : result;
        
        console.log('Sales report stats:', stats);
        
        // Store old values for animation
        const oldData = { ...salesData };
        
        // Update with actual revenue calculations
        salesData.totalRevenue = stats.totalRevenue || 0;
        
        // Gross Sales Revenue = Total revenue received from sales
        salesData.grossSalesRevenue = salesData.totalRevenue;
        
        // Gross Profit = Total Revenue - Cost of Goods (estimated at 35%)
        salesData.grossProfit = salesData.totalRevenue * 0.65; // 65% profit margin
        
        // Margin % = (Gross Profit / Total Revenue) * 100
        salesData.margin = salesData.totalRevenue > 0 ? (salesData.grossProfit / salesData.totalRevenue) * 100 : 0;
        
        salesData.totalOrders = stats.totalOrders || 0;
        salesData.totalCustomers = stats.totalCustomers || 0;
        salesData.avgOrderValue = salesData.totalOrders > 0 ? salesData.totalRevenue / salesData.totalOrders : 0;
        
        if (stats.recentOrders && stats.recentOrders.length > 0) {
            salesData.recentOrders = stats.recentOrders;
        }
        
        console.log('✅ Calculated Sales Data:', {
            Gross: `₱${salesData.grossSalesRevenue.toFixed(2)}`,
            Profit: `₱${salesData.grossProfit.toFixed(2)}`,
            Margin: `${salesData.margin.toFixed(1)}%`,
            Orders: salesData.totalOrders,
            Customers: salesData.totalCustomers
        });
        
        // Remove loading animation
        loadingElements.forEach(el => {
            if (el) el.classList.remove('loading-pulse');
        });
        
        updateSalesReportDisplay(oldData);
        
        // Calculate and display revenue breakdown
        setTimeout(() => {
            calculateRevenueBreakdown();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error loading sales report:', error);
        
        // Remove loading animation
        document.querySelectorAll('.loading-pulse').forEach(el => {
            el.classList.remove('loading-pulse');
        });
        
        updateSalesReportDisplay();
    }
}

function updateSalesReportDisplay(oldData = null) {
    // Update report period with animation
    const today = new Date();
    const periodEl = document.getElementById('reportPeriod');
    if (periodEl) {
        periodEl.textContent = `Today's Report - ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        fadeInElement(periodEl, 100);
    }
    
    // Update total revenue with animation
    const totalRevenueEl = document.getElementById('totalRevenueCard');
    if (totalRevenueEl) {
        const startValue = oldData ? oldData.totalRevenue : 0;
        animateValue(totalRevenueEl, startValue, salesData.totalRevenue, 1000, '₱');
        fadeInElement(totalRevenueEl, 200);
        
        // Add subtle pulse on update
        setTimeout(() => pulseElement(totalRevenueEl.closest('.stat-card')), 1200);
    }
    
    // Update total orders with animation
    const totalOrdersEl = document.getElementById('totalOrdersCard');
    if (totalOrdersEl) {
        const startValue = oldData ? oldData.totalOrders : 0;
        animateValue(totalOrdersEl, startValue, salesData.totalOrders, 800);
        fadeInElement(totalOrdersEl, 300);
    }
    
    const ordersChangeEl = document.getElementById('ordersChange');
    if (ordersChangeEl) {
        ordersChangeEl.textContent = `${salesData.totalOrders} orders today`;
        fadeInElement(ordersChangeEl, 400);
    }
    
    // Update total customers with animation
    const totalCustomersEl = document.getElementById('totalCustomersCard');
    if (totalCustomersEl) {
        const startValue = oldData ? oldData.totalCustomers : 0;
        animateValue(totalCustomersEl, startValue, salesData.totalCustomers, 800);
        fadeInElement(totalCustomersEl, 400);
    }
    
    const customersChangeEl = document.getElementById('customersChange');
    if (customersChangeEl) {
        customersChangeEl.textContent = `${salesData.totalCustomers} customers today`;
        fadeInElement(customersChangeEl, 500);
    }
    
    // Update average order value with animation
    const avgOrderEl = document.getElementById('avgOrderValue');
    if (avgOrderEl) {
        const startValue = oldData ? oldData.avgOrderValue : 0;
        animateValue(avgOrderEl, startValue, salesData.avgOrderValue, 1000, '₱');
        fadeInElement(avgOrderEl, 600);
    }
    
    // Update Gross Sales Revenue (Total money from sales)
    const grossSalesEl = document.getElementById('grossSalesRevenue');
    if (grossSalesEl) {
        const startValue = oldData ? oldData.grossSalesRevenue : 0;
        animateValue(grossSalesEl, startValue, salesData.grossSalesRevenue, 1000, '₱');
        fadeInElement(grossSalesEl, 650);
    }
    
    // Update gross profit with animation
    const grossProfitEl = document.getElementById('grossProfit');
    if (grossProfitEl) {
        const startValue = oldData ? oldData.grossProfit : 0;
        animateValue(grossProfitEl, startValue, salesData.grossProfit, 1000, '₱');
        fadeInElement(grossProfitEl, 700);
    }
    
    // Update margin with animation
    const marginEl = document.getElementById('marginValue');
    if (marginEl) {
        const startValue = oldData ? oldData.margin : 0;
        animateValue(marginEl, startValue, salesData.margin, 800, '', '%');
        fadeInElement(marginEl, 800);
    }
    
    // Update Revenue Breakdown sections with animation
    updateRevenueBreakdown();
    
    // Update graph status
    const graphStatusEl = document.getElementById('graphStatus');
    if (graphStatusEl) {
        if (salesData.totalOrders > 0) {
            graphStatusEl.textContent = `${salesData.totalOrders} orders - ₱${salesData.totalRevenue.toFixed(2)} revenue`;
        } else {
            graphStatusEl.textContent = 'No sales data for today';
        }
        fadeInElement(graphStatusEl, 900);
    }
    
    // Render sales chart with animation
    renderSalesChart(salesData);
    
    // Update sales summary table with animation
    updateSalesTable();
}

// ==================== REVENUE BREAKDOWN FUNCTION WITH DONUT ====================
function updateRevenueBreakdown() {
    // Define category colors for all 11 categories
    const categoryColors = {
        'Rice': '#3b82f6',           // Blue
        'Sizzling': '#ef4444',       // Red
        'Party': '#8b5cf6',          // Purple
        'Drink': '#10b981',          // Green
        'Cafe': '#f59e0b',           // Amber
        'Milk': '#ec4899',           // Pink
        'Frappe': '#06b6d4',         // Cyan
        'Snack': '#f97316',          // Orange
        'Budget': '#6b7280',         // Gray
        'Specialty': '#d946ef',      // Magenta
        'Coffee': '#b45309'          // Brown
    };
    
    // Get today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Initialize all 11 categories
    const categories = [
        { name: 'Rice', label: 'Rice Bowl Meals', percentage: 0, amount: 0, color: categoryColors['Rice'] },
        { name: 'Sizzling', label: 'Hot Sizzlers', percentage: 0, amount: 0, color: categoryColors['Sizzling'] },
        { name: 'Party', label: 'Party Platters', percentage: 0, amount: 0, color: categoryColors['Party'] },
        { name: 'Drink', label: 'Beverages', percentage: 0, amount: 0, color: categoryColors['Drink'] },
        { name: 'Cafe', label: 'Cafe Specials', percentage: 0, amount: 0, color: categoryColors['Cafe'] },
        { name: 'Milk', label: 'Milk Drinks', percentage: 0, amount: 0, color: categoryColors['Milk'] },
        { name: 'Frappe', label: 'Frappe', percentage: 0, amount: 0, color: categoryColors['Frappe'] },
        { name: 'Snack', label: 'Snacks', percentage: 0, amount: 0, color: categoryColors['Snack'] },
        { name: 'Budget', label: 'Budget Meals', percentage: 0, amount: 0, color: categoryColors['Budget'] },
        { name: 'Specialty', label: 'Specialty Drinks', percentage: 0, amount: 0, color: categoryColors['Specialty'] },
        { name: 'Coffee', label: 'Coffee', percentage: 0, amount: 0, color: categoryColors['Coffee'] }
    ];
    
    // Initialize category revenue accumulator for all 11 categories
    const categoryRevenue = {
        'Rice': 0,
        'Sizzling': 0,
        'Party': 0,
        'Drink': 0,
        'Cafe': 0,
        'Milk': 0,
        'Frappe': 0,
        'Snack': 0,
        'Budget': 0,
        'Specialty': 0,
        'Coffee': 0
    };
    
    // Calculate revenue breakdown from recent orders based on actual products
    if (salesData.recentOrders && salesData.recentOrders.length > 0) {
        console.log('📦 Calculating revenue breakdown from orders:', salesData.recentOrders.length);
        
        salesData.recentOrders.forEach((order, orderIndex) => {
            // Try to find items in the order (check multiple possible structures)
            let orderItems = [];
            
            if (order.items && Array.isArray(order.items)) {
                orderItems = order.items;
            } else if (order.products && Array.isArray(order.products)) {
                orderItems = order.products;
            } else if (order.orderItems && Array.isArray(order.orderItems)) {
                orderItems = order.orderItems;
            } else if (order.cartItems && Array.isArray(order.cartItems)) {
                orderItems = order.cartItems;
            } else if (order.itemName || order.productName) {
                orderItems = [order];
            }
            
            // If we found items, process them
            if (orderItems.length > 0) {
                orderItems.forEach(item => {
                    // Get item details from various possible field names
                    const itemName = item.itemName || item.name || item.productName || '';
                    const itemCategory = item.category || item.itemCategory || item.productCategory || '';
                    const itemPrice = parseFloat(item.price || item.unitPrice || item.totalAmount || item.total || 0);
                    const itemQuantity = parseInt(item.quantity || item.qty || 1);
                    
                    // Calculate item total
                    const itemTotal = itemPrice * itemQuantity;
                    
                    // Determine category based on item name and category
                    let mappedCategory = null;
                    
                    // First try based on explicit category field
                    if (itemCategory) {
                        const catLower = itemCategory.toLowerCase();
                        if (catLower.includes('rice')) mappedCategory = 'Rice';
                        else if (catLower.includes('sizzl')) mappedCategory = 'Sizzling';
                        else if (catLower.includes('party')) mappedCategory = 'Party';
                        else if (catLower.includes('drink') || catLower.includes('beverage')) mappedCategory = 'Drink';
                        else if (catLower.includes('cafe')) mappedCategory = 'Cafe';
                        else if (catLower.includes('milk')) mappedCategory = 'Milk';
                        else if (catLower.includes('frappe')) mappedCategory = 'Frappe';
                        else if (catLower.includes('snack')) mappedCategory = 'Snack';
                        else if (catLower.includes('budget')) mappedCategory = 'Budget';
                        else if (catLower.includes('special')) mappedCategory = 'Specialty';
                        else if (catLower.includes('coffee')) mappedCategory = 'Coffee';
                    }
                    
                    // If no category from field, try based on item name
                    if (!mappedCategory && itemName) {
                        const nameLower = itemName.toLowerCase();
                        if (nameLower.includes('rice') || nameLower.includes('bowl')) mappedCategory = 'Rice';
                        else if (nameLower.includes('sizzl') || nameLower.includes('plate')) mappedCategory = 'Sizzling';
                        else if (nameLower.includes('party')) mappedCategory = 'Party';
                        else if (nameLower.includes('soda') || nameLower.includes('juice') || nameLower.includes('water')) mappedCategory = 'Drink';
                        else if (nameLower.includes('cafe') || nameLower.includes('house blend')) mappedCategory = 'Cafe';
                        else if (nameLower.includes('milk')) mappedCategory = 'Milk';
                        else if (nameLower.includes('frappe')) mappedCategory = 'Frappe';
                        else if (nameLower.includes('fries') || nameLower.includes('sandwich') || nameLower.includes('pastry')) mappedCategory = 'Snack';
                        else if (nameLower.includes('budget') || nameLower.includes('value')) mappedCategory = 'Budget';
                        else if (nameLower.includes('special') || nameLower.includes('premium')) mappedCategory = 'Specialty';
                        else if (nameLower.includes('coffee') || nameLower.includes('espresso') || nameLower.includes('latte') || nameLower.includes('cappuccino')) mappedCategory = 'Coffee';
                    }
                    
                    // If we determined a category, add to revenue
                    if (mappedCategory && categoryRevenue.hasOwnProperty(mappedCategory)) {
                        categoryRevenue[mappedCategory] += itemTotal;
                        console.log(`  Item: ${itemName || 'Unknown'} -> ${mappedCategory}: ₱${itemTotal.toFixed(2)}`);
                    } else {
                        // Default to Drink if unknown
                        console.log(`  Item: ${itemName || 'Unknown'} -> Unknown category, defaulting to Drink`);
                        categoryRevenue['Drink'] += itemTotal;
                    }
                });
            } else if (order.totalAmount) {
                // If order has no items but has total amount, try to determine from order level category
                const orderCategory = order.category || '';
                let mappedCategory = 'Drink'; // Default
                
                if (orderCategory) {
                    const catLower = orderCategory.toLowerCase();
                    if (catLower.includes('rice')) mappedCategory = 'Rice';
                    else if (catLower.includes('sizzl')) mappedCategory = 'Sizzling';
                    else if (catLower.includes('party')) mappedCategory = 'Party';
                    else if (catLower.includes('drink')) mappedCategory = 'Drink';
                    else if (catLower.includes('cafe')) mappedCategory = 'Cafe';
                    else if (catLower.includes('milk')) mappedCategory = 'Milk';
                    else if (catLower.includes('frappe')) mappedCategory = 'Frappe';
                    else if (catLower.includes('snack')) mappedCategory = 'Snack';
                    else if (catLower.includes('budget')) mappedCategory = 'Budget';
                    else if (catLower.includes('special')) mappedCategory = 'Specialty';
                    else if (catLower.includes('coffee')) mappedCategory = 'Coffee';
                }
                
                categoryRevenue[mappedCategory] += order.totalAmount;
                console.log(`  Order ${orderIndex + 1}: ${mappedCategory} - ₱${order.totalAmount.toFixed(2)}`);
            }
        });
        
        // Calculate percentages based on total revenue
        const totalRevenue = salesData.totalRevenue || 0;
        console.log(`\n💰 Category Revenue Totals (Total: ₱${totalRevenue.toFixed(2)}):`);
        
        categories.forEach(cat => {
            cat.amount = categoryRevenue[cat.name] || 0;
            cat.percentage = totalRevenue > 0 ? (cat.amount / totalRevenue) * 100 : 0;
            console.log(`  ${cat.label}: ₱${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`);
        });
    }
    
    // Update both Revenue Breakdown sections with calculated data
    updateBreakdownSection(1, dateStr, categories, salesData.totalRevenue);
    updateBreakdownSection(2, dateStr, categories, salesData.totalRevenue);
    
    // Update donut charts for both sections
    updateDonutChart(1, categories);
    updateDonutChart(2, categories);
}

function updateBreakdownSection(sectionNum, dateStr, categories, totalRevenue) {
    // Update period
    const periodEl = document.getElementById(`revenuePeriod${sectionNum}`);
    if (periodEl) {
        periodEl.textContent = dateStr;
        fadeInElement(periodEl, 200);
    }
    
    // Define category colors
    const categoryColors = {
        'Rice': '#3b82f6',           // Blue
        'Sizzling': '#ef4444',       // Red
        'Party': '#8b5cf6',          // Purple
        'Drink': '#10b981',          // Green
        'Cafe': '#f59e0b',           // Amber
        'Milk': '#ec4899',           // Pink
        'Frappe': '#06b6d4',         // Cyan
        'Snack': '#f97316',          // Orange
        'Budget': '#6b7280',         // Gray
        'Specialty': '#d946ef',      // Magenta
        'Coffee': '#b45309'          // Brown
    };
    
    // Update legend items with animation (now handling 11 categories)
    categories.forEach((cat, index) => {
        const delay = 300 + (index * 100);
        
        // Category name element - check if element exists (might need to adjust HTML to have 11 items)
        const nameEl = document.getElementById(`cat${sectionNum}_name${index + 1}`);
        if (nameEl) {
            nameEl.textContent = cat.label;
            fadeInElement(nameEl, delay);
        }
        
        // Category percentage element
        const percentEl = document.getElementById(`cat${sectionNum}_percent${index + 1}`);
        if (percentEl) {
            const displayPercent = cat.percentage > 0 ? `${cat.percentage.toFixed(1)}%` : '0%';
            percentEl.textContent = displayPercent;
            percentEl.style.color = categoryColors[cat.name] || '#94a3b8';
            fadeInElement(percentEl, delay + 50);
        }
        
        // Update color indicator
        const colorSquare = nameEl?.previousElementSibling;
        if (colorSquare) {
            colorSquare.style.backgroundColor = categoryColors[cat.name] || '#cbd5e1';
            colorSquare.style.transition = 'background-color 0.3s ease';
        }
    });
    
    // Update footer note
    const noteEl = document.getElementById(`revenueNote${sectionNum}`);
    if (noteEl) {
        if (totalRevenue > 0) {
            noteEl.textContent = `Total Revenue: ₱${totalRevenue.toFixed(2)}`;
        } else {
            noteEl.textContent = 'No sales data available';
        }
        fadeInElement(noteEl, 700);
    }
}

// ==================== DONUT CHART FUNCTION ====================
function updateDonutChart(sectionNum, categories) {
    const donutElement = document.getElementById(`donutChart${sectionNum}`);
    if (!donutElement) return;
    
    // Clear existing content
    donutElement.innerHTML = '';
    
    // Create SVG element
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = "block";
    
    // Donut parameters
    const centerX = 50;
    const centerY = 50;
    const radius = 38; // Outer radius
    const holeRadius = 25; // Inner radius for donut hole
    
    // Filter out categories with 0 percentage
    const activeCategories = categories.filter(cat => cat.percentage > 0);
    
    // If no active categories (all 0%), show empty donut
    if (activeCategories.length === 0) {
        // Create empty donut (gray ring)
        const path = document.createElementNS(svgNamespace, "path");
        const startAngle = 0;
        const endAngle = 2 * Math.PI;
        
        const pathData = [
            `M ${centerX + radius * Math.cos(startAngle)} ${centerY + radius * Math.sin(startAngle)}`,
            `A ${radius} ${radius} 0 1 1 ${centerX + radius * Math.cos(endAngle)} ${centerY + radius * Math.sin(endAngle)}`,
            `L ${centerX + holeRadius * Math.cos(endAngle)} ${centerY + holeRadius * Math.sin(endAngle)}`,
            `A ${holeRadius} ${holeRadius} 0 1 0 ${centerX + holeRadius * Math.cos(startAngle)} ${centerY + holeRadius * Math.sin(startAngle)}`,
            "Z"
        ].join(" ");
        
        path.setAttribute("d", pathData);
        path.setAttribute("fill", "#e0e0e0");
        path.setAttribute("stroke", "#ffffff");
        path.setAttribute("stroke-width", "0.5");
        
        svg.appendChild(path);
        
        // Add text in the middle
        const text = document.createElementNS(svgNamespace, "text");
        text.setAttribute("x", centerX);
        text.setAttribute("y", centerY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "8");
        text.setAttribute("fill", "#666666");
        text.textContent = "₱0";
        
        svg.appendChild(text);
    } else {
        // Calculate cumulative percentages for pie slices
        let cumulativeAngle = -Math.PI / 2; // Start from top (-90 degrees)
        
        activeCategories.forEach((cat, index) => {
            const percentage = cat.percentage / 100; // Convert to decimal
            const angleSize = percentage * 2 * Math.PI;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angleSize;
            
            // Create donut slice
            const path = document.createElementNS(svgNamespace, "path");
            
            // Calculate points for the donut slice
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            const x3 = centerX + holeRadius * Math.cos(endAngle);
            const y3 = centerY + holeRadius * Math.sin(endAngle);
            const x4 = centerX + holeRadius * Math.cos(startAngle);
            const y4 = centerY + holeRadius * Math.sin(startAngle);
            
            const largeArcFlag = angleSize <= Math.PI ? 0 : 1;
            
            // Create path data for donut slice
            const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${holeRadius} ${holeRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                "Z"
            ].join(" ");
            
            path.setAttribute("d", pathData);
            path.setAttribute("fill", cat.color);
            path.setAttribute("stroke", "#ffffff");
            path.setAttribute("stroke-width", "0.5");
            
            // Add animation
            path.style.opacity = "0";
            path.style.transform = "scale(0.9)";
            path.style.transition = `opacity 0.5s ease ${index * 100}ms, transform 0.5s ease ${index * 100}ms`;
            
            svg.appendChild(path);
            
            // Animate in
            setTimeout(() => {
                path.style.opacity = "1";
                path.style.transform = "scale(1)";
            }, 100);
            
            cumulativeAngle += angleSize;
        });
        
        // Add center white circle for donut hole
        const centerCircle = document.createElementNS(svgNamespace, "circle");
        centerCircle.setAttribute("cx", centerX);
        centerCircle.setAttribute("cy", centerY);
        centerCircle.setAttribute("r", holeRadius - 1);
        centerCircle.setAttribute("fill", "white");
        centerCircle.style.opacity = "0";
        centerCircle.style.transition = "opacity 0.5s ease 0.5s";
        
        svg.appendChild(centerCircle);
        
        // Add total in the middle
        const text = document.createElementNS(svgNamespace, "text");
        text.setAttribute("x", centerX);
        text.setAttribute("y", centerY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "8");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("fill", "#333333");
        text.textContent = `₱${salesData.totalRevenue.toFixed(0)}`;
        text.style.opacity = "0";
        text.style.transition = "opacity 0.5s ease 0.6s";
        
        svg.appendChild(text);
        
        // Fade in center elements
        setTimeout(() => {
            centerCircle.style.opacity = "1";
            text.style.opacity = "1";
        }, 500);
    }
    
    donutElement.appendChild(svg);
}

function updateSalesTable() {
    const tableBody = document.getElementById('salesTableBody');
    if (!tableBody) return;
    
    // Clear with fade out
    tableBody.style.opacity = '0';
    tableBody.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        if (salesData.totalOrders === 0) {
            tableBody.innerHTML = `
                <tr style="opacity: 0;">
                    <td colspan="6" style="text-align: center; padding: 20px;">No sales data available</td>
                </tr>
            `;
        } else {
            // Create today's sales summary row
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            tableBody.innerHTML = `
                <tr style="opacity: 0;">
                    <td>${dateStr}</td>
                    <td>${salesData.totalOrders}</td>
                    <td>${formatCurrency(salesData.totalRevenue)}</td>
                    <td>${formatCurrency(salesData.totalRevenue * 0.35)}</td>
                    <td>${formatCurrency(salesData.grossProfit)}</td>
                    <td>${salesData.totalCustomers}</td>
                </tr>
            `;
            
            // Add recent orders if available
            if (salesData.recentOrders && salesData.recentOrders.length > 0) {
                let summaryHTML = `
                    <tr style="opacity: 0; background-color: #f9f9f9; border-top: 2px solid #ddd;">
                        <td colspan="6" style="padding: 10px; font-size: 12px; color: #666;">
                            <strong>Recent Orders:</strong> 
                `;
                
                salesData.recentOrders.slice(0, 5).forEach((order, index) => {
                    const time = new Date(order.createdAt).toLocaleTimeString();
                    summaryHTML += `Order #${order.orderNumber} (${time}) - ₱${(order.total || 0).toFixed(2)}`;
                    if (index < Math.min(4, salesData.recentOrders.length - 1)) summaryHTML += ' | ';
                });
                
                summaryHTML += `</td></tr>`;
                
                tableBody.innerHTML += summaryHTML;
            }
        }
        
        // Fade in rows one by one
        setTimeout(() => {
            tableBody.style.opacity = '1';
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                row.style.transition = `opacity 0.5s ease ${index * 100}ms, transform 0.5s ease ${index * 100}ms`;
                row.style.transform = 'translateX(-20px)';
                void row.offsetWidth; // Trigger reflow
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            });
        }, 100);
    }, 300);
}

function renderSalesChart(stats) {
    // Update graph status
    const graphStatusEl = document.getElementById('graphStatus');
    if (graphStatusEl) {
        if (stats.totalOrders > 0) {
            graphStatusEl.textContent = `${stats.totalOrders} orders - ₱${(stats.totalRevenue || 0).toFixed(2)} revenue`;
        } else {
            graphStatusEl.textContent = 'No sales data for today';
        }
    }
    
    const chartBars = document.getElementById('chartBars');
    if (!chartBars) return;
    
    // Clear with fade out
    chartBars.style.opacity = '0';
    chartBars.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        chartBars.innerHTML = '';
        
        // Get today's date and last 7 days
        const today = new Date();
        
        // Get day names
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Calculate chart data
        const totalRevenue = stats.totalRevenue || 0;
        const hasSales = totalRevenue > 0;
        
        // Define bar heights based on sales data
        let barHeights;
        
        if (hasSales) {
            const maxRevenue = Math.max(totalRevenue * 1.2, 5000);
            const basePercentage = (totalRevenue / maxRevenue) * 100;
            barHeights = [
                basePercentage * 0.3,
                basePercentage * 0.4,
                basePercentage * 0.35,
                basePercentage * 0.5,
                basePercentage * 0.6,
                basePercentage * 0.75,
                basePercentage
            ];
            
            barHeights = barHeights.map(height => Math.min(height, 95));
        } else {
            barHeights = [5, 7, 6, 8, 5, 9, 10];
        }
        
        barHeights.forEach((targetHeight, index) => {
            const bar = document.createElement('div');
            const barValue = hasSales ? (targetHeight / 100) * (Math.max(totalRevenue * 1.2, 5000)) : 0;
            
            const initialHeight = hasSales ? 0 : 2;
            
            bar.style.cssText = `
                height: ${initialHeight}%;
                background: ${index === 6 ? (hasSales ? '#4CAF50' : '#FF9800') : '#E0E0E0'};
                margin: 0 3px;
                border-radius: 4px 4px 0 0;
                flex: 1;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
                padding-bottom: 2px;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.5s ease ${index * 100}ms, transform 0.5s ease ${index * 100}ms;
                position: relative;
                overflow: hidden;
            `;
            
            if (!hasSales && index === 6) {
                bar.style.background = 'linear-gradient(to top, #FF9800, #FFB74D)';
                bar.style.boxShadow = 'inset 0 -2px 5px rgba(0,0,0,0.1)';
            }
            
            bar.title = hasSales ? 
                `${dayNames[index]}: ₱${barValue.toFixed(2)}` : 
                `${dayNames[index]}: No sales`;
            
            bar.textContent = '';
            bar.dataset.isToday = (index === 6).toString();
            bar.dataset.hasSales = hasSales.toString();
            
            chartBars.appendChild(bar);
            
            setTimeout(() => {
                if (hasSales) {
                    animateProgressBar(bar, targetHeight, 800);
                } else {
                    const startTime = performance.now();
                    const duration = 1200;
                    
                    function updateZeroBar(currentTime) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 2);
                        const currentHeight = 2 + (targetHeight - 2) * easeOut;
                        
                        bar.style.height = `${currentHeight}%`;
                        
                        if (index === 6) {
                            const pulse = Math.sin(progress * Math.PI * 2) * 0.1;
                            bar.style.opacity = `${0.7 + pulse}`;
                        }
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateZeroBar);
                        }
                    }
                    
                    requestAnimationFrame(updateZeroBar);
                }
                
                bar.style.opacity = hasSales ? '1' : '0.8';
                bar.style.transform = 'translateY(0)';
                
                if (!hasSales && index === 6) {
                    setTimeout(() => {
                        const zeroIndicator = document.createElement('div');
                        zeroIndicator.textContent = '₱0';
                        zeroIndicator.style.cssText = `
                            position: absolute;
                            top: -20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(255, 0, 0, 0.9);
                            color: white;
                            padding: 2px 6px;
                            border-radius: 10px;
                            font-size: 9px;
                            font-weight: bold;
                            opacity: 0;
                            transition: opacity 0.5s ease, top 0.5s ease;
                        `;
                        bar.appendChild(zeroIndicator);
                        
                        setTimeout(() => {
                            zeroIndicator.style.opacity = '1';
                            zeroIndicator.style.top = '-15px';
                        }, 100);
                    }, 500);
                }
            }, index * 150);
        });
        
        const chartSummary = document.getElementById('chartSummary');
        if (chartSummary) {
            if (hasSales) {
                chartSummary.textContent = `Today: ₱${totalRevenue.toFixed(2)}`;
            } else {
                chartSummary.textContent = `Today: ₱0.00 • No sales yet`;
                chartSummary.style.color = '#000000ff';
                chartSummary.style.fontWeight = 'bold';
            }
            fadeInElement(chartSummary, 1200);
        }
        
        chartBars.style.opacity = '1';
        
        if (!hasSales) {
            setTimeout(() => {
                const zeroMessage = document.createElement('div');
                zeroMessage.textContent = 'No sales recorded today';
                zeroMessage.style.cssText = `
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: rgba(247, 7, 7, 1);
                    font-size: 11px;
                    font-weight: bold;
                    opacity: 0;
                    animation: fadeInZeroMessage 1s ease 1.5s forwards;
                `;
                chartBars.parentElement.style.position = 'relative';
                chartBars.parentElement.appendChild(zeroMessage);
            }, 1000);
        }
    }, 300);
}

// Add CSS for animations
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes loadingPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes exportSuccess {
            0% { background-color: #4CAF50; }
            50% { background-color: #45a049; }
            100% { background-color: #4CAF50; }
        }
        
        .loading-pulse {
            animation: loadingPulse 1s ease-in-out infinite;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        .export-success {
            animation: exportSuccess 0.5s ease-in-out;
        }
        
        @keyframes fadeInZeroMessage {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// ==================== REAL-TIME UPDATES VIA EVENT SOURCE ====================
let salesEventSource = null;

function setupSalesRealTimeUpdates() {
    try {
        console.log('🔗 Setting up real-time updates for sales report...');
        
        // Close any existing connection
        if (salesEventSource) {
            salesEventSource.close();
            salesEventSource = null;
        }
        
        salesEventSource = new EventSource('/api/admin/events');
        
        salesEventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Real-time event received:', data.type);
                
                if (data.type === 'new_order') {
                    console.log('🆕 New order detected! Refreshing sales report...');
                    // Reload sales data immediately when new order arrives
                    loadSalesReport();
                } else if (data.type === 'stats_update') {
                    console.log('📊 Stats update detected! Refreshing sales report...');
                    loadSalesReport();
                }
            } catch (error) {
                console.error('❌ Error parsing real-time event:', error);
            }
        };
        
        salesEventSource.onerror = (error) => {
            console.warn('⚠️ Real-time connection error, attempting to reconnect...');
            
            if (salesEventSource) {
                salesEventSource.close();
                salesEventSource = null;
            }
            
            // Retry connection after 5 seconds
            setTimeout(() => {
                console.log('🔄 Reconnecting to real-time updates...');
                setupSalesRealTimeUpdates();
            }, 5000);
        };
        
        salesEventSource.onopen = () => {
            console.log('✅ Real-time connection established for sales report');
        };
        
        window.salesEventSource = salesEventSource;
        
    } catch (error) {
        console.error('❌ Error setting up real-time updates:', error);
    }
}

// ==================== 📊 REVENUE BREAKDOWN FUNCTIONS ====================

/**
 * Maps item names to their category based on keywords
 * @param {string} itemName - The name of the menu item
 * @returns {string} - The category of the item
 */
function getItemCategory(itemName) {
    const lowerName = itemName.toLowerCase();
    
    // Coffee category
    if (lowerName.includes('coffee') || lowerName.includes('latte') || 
        lowerName.includes('espresso') || lowerName.includes('americano') || 
        lowerName.includes('macchiato')) {
        return 'Coffee';
    }
    
    // Snacks category
    if (lowerName.includes('snack') || lowerName.includes('fries') || 
        lowerName.includes('pancit') || lowerName.includes('bihon') ||
        lowerName.includes('shanghai') || lowerName.includes('lumpia') ||
        lowerName.includes('nachos') || lowerName.includes('clubhouse') ||
        lowerName.includes('sandwich')) {
        return 'Snacks & Appetizers';
    }
    
    // Rice Bowl Meals category
    if (lowerName.includes('rice') || lowerName.includes('bowl') || 
        lowerName.includes('korean') || lowerName.includes('bulgogi') || 
        lowerName.includes('salt and pepper') || lowerName.includes('lechon') ||
        lowerName.includes('adobo') || lowerName.includes('cream dory') ||
        lowerName.includes('buttered')) {
        return 'Rice Bowl Meals';
    }
    
    // Hot Sizzlers category
    if (lowerName.includes('sizzling') || lowerName.includes('sisig') || 
        lowerName.includes('liempo') || lowerName.includes('porkchop')) {
        return 'Hot Sizzlers';
    }
    
    // Party Platters category
    if (lowerName.includes('party') || lowerName.includes('canton') ||
        lowerName.includes('spaghetti') || lowerName.includes('large')) {
        return 'Party Platters';
    }
    
    // Budget Meals category
    if (lowerName.includes('budget') || lowerName.includes('tinapa') || 
        lowerName.includes('tuyo') || lowerName.includes('fried rice') ||
        lowerName.includes('plain rice')) {
        return 'Budget Meals';
    }
    
    // Specialty Drinks/Specialties category
    if (lowerName.includes('bulalo') || lowerName.includes('sinigang') ||
        lowerName.includes('paknet') || lowerName.includes('pakbet')) {
        return 'Specialty Dishes';
    }
    
    // Milk Tea category
    if (lowerName.includes('milk tea') || lowerName.includes('matcha')) {
        return 'Milk Tea';
    }
    
    // Frappe category
    if (lowerName.includes('frappe') || lowerName.includes('cookies & cream') ||
        lowerName.includes('strawberry') || lowerName.includes('mango')) {
        return 'Frappe';
    }
    
    // Beverages category
    if (lowerName.includes('beverage') || lowerName.includes('soda') || 
        lowerName.includes('juice') || lowerName.includes('iced tea') ||
        lowerName.includes('lemonade') || lowerName.includes('red tea')) {
        return 'Beverages';
    }
    
    // Default category
    return 'Other';
}

/**
 * Calculates revenue breakdown for the current day (Feb 20, 2026)
 * @returns {Object} - Revenue breakdown by category
 */
async function calculateRevenueBreakdown() {
    try {
        console.log('📊 Calculating revenue breakdown for Feb 20, 2026...');
        
        // Fetch orders for today
        const response = await fetch('/api/orders?date=today');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const orders = Array.isArray(result) ? result : result.data || [];
        
        console.log('📦 Total orders fetched:', orders.length);
        
        // Initialize breakdown structure
        const breakdown = {
            'Coffee': { amount: 0, count: 0 },
            'Snacks & Appetizers': { amount: 0, count: 0 },
            'Rice Bowl Meals': { amount: 0, count: 0 },
            'Hot Sizzlers': { amount: 0, count: 0 },
            'Party Platters': { amount: 0, count: 0 },
            'Budget Meals': { amount: 0, count: 0 },
            'Specialty Dishes': { amount: 0, count: 0 },
            'Milk Tea': { amount: 0, count: 0 },
            'Frappe': { amount: 0, count: 0 },
            'Beverages': { amount: 0, count: 0 },
            'Other': { amount: 0, count: 0 }
        };
        
        let totalRevenue = 0;
        
        // Process each order
        orders.forEach(order => {
            // Skip if order is not from today (Feb 20, 2026)
            if (order.createdAt) {
                const orderDate = new Date(order.createdAt);
                const today = new Date('2026-02-20');
                if (orderDate.toDateString() !== today.toDateString()) {
                    return; // Skip orders not from today
                }
            }
            
            // Process items in the order
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const itemName = item.name || item.itemName || '';
                    const itemPrice = parseFloat(item.price) || 0;
                    const itemQuantity = parseInt(item.quantity) || 1;
                    const itemTotal = itemPrice * itemQuantity;
                    
                    const category = getItemCategory(itemName);
                    
                    breakdown[category].amount += itemTotal;
                    breakdown[category].count += itemQuantity;
                    totalRevenue += itemTotal;
                });
            }
        });
        
        // Calculate percentages
        const breakdownWithPercentage = {};
        Object.keys(breakdown).forEach(category => {
            const percentage = totalRevenue > 0 
                ? (breakdown[category].amount / totalRevenue * 100) 
                : 0;
            
            breakdownWithPercentage[category] = {
                amount: breakdown[category].amount,
                count: breakdown[category].count,
                percentage: percentage
            };
        });
        
        console.log('✅ Revenue Breakdown Calculated:', {
            totalRevenue: totalRevenue,
            breakdown: breakdownWithPercentage
        });
        
        // Update display
        updateRevenueBreakdownDisplay(breakdownWithPercentage, totalRevenue);
        
        return { breakdown: breakdownWithPercentage, totalRevenue };
        
    } catch (error) {
        console.error('❌ Error calculating revenue breakdown:', error);
        return { breakdown: {}, totalRevenue: 0 };
    }
}

/**
 * Updates the HTML display with revenue breakdown data
 * @param {Object} breakdown - Revenue breakdown by category
 * @param {number} totalRevenue - Total revenue amount
 */
function updateRevenueBreakdownDisplay(breakdown, totalRevenue) {
    try {
        // Update date display
        const dateEl = document.getElementById('revenueDate');
        if (dateEl) {
            const today = new Date('2026-02-20');
            dateEl.textContent = today.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            fadeInElement(dateEl, 100);
        }
        
        // Update total revenue display
        const totalRevenueEl = document.getElementById('revenueBreakdownTotal');
        if (totalRevenueEl) {
            animateValue(totalRevenueEl, 0, totalRevenue, 1000, '₱');
            fadeInElement(totalRevenueEl, 200);
        }
        
        // Update breakdown table/list
        const breakdownContainer = document.getElementById('revenueBreakdownContainer');
        if (breakdownContainer) {
            let breakdownHTML = '';
            
            Object.keys(breakdown)
                .filter(category => breakdown[category].amount > 0) // Only show categories with revenue
                .sort((a, b) => breakdown[b].amount - breakdown[a].amount) // Sort by amount descending
                .forEach((category, index) => {
                    const data = breakdown[category];
                    const delay = 300 + (index * 100);
                    
                    breakdownHTML += `
                        <div class="revenue-breakdown-row" style="animation-delay: ${delay}ms;">
                            <div class="breakdown-category">
                                <span class="category-name">${category}</span>
                                <span class="category-count">${data.count} items</span>
                            </div>
                            <div class="breakdown-amounts">
                                <span class="breakdown-amount">₱${data.amount.toFixed(2)}</span>
                                <span class="breakdown-percentage">${data.percentage.toFixed(1)}%</span>
                            </div>
                            <div class="breakdown-bar">
                                <div class="bar-fill" style="width: ${data.percentage}%;"></div>
                            </div>
                        </div>
                    `;
                });
            
            breakdownContainer.innerHTML = breakdownHTML || '<p>No revenue data available for today.</p>';
            fadeInElement(breakdownContainer, 250);
        }
        
    } catch (error) {
        console.error('❌ Error updating revenue breakdown display:', error);
    }
}

// ==================== END REVENUE BREAKDOWN FUNCTIONS ====================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Sales Report page loaded');
    
    // Add animation styles
    addAnimationStyles();
    
    const isSalesPage = window.location.pathname.includes('salesandreports');
    
    if (isSalesPage) {
        console.log('🏁 Loading sales report...');
        
        // Load initial data
        setTimeout(() => {
            loadSalesReport();
        }, 500);
        
        // ✅ Setup real-time updates via EventSource
        setTimeout(() => {
            setupSalesRealTimeUpdates();
        }, 1000);
        
        // Refresh every 30 seconds as fallback
        setInterval(() => {
            console.log('🔄 Periodic refresh of sales report (30s interval)');
            loadSalesReport();
        }, 30000);
        
        // Add keyboard shortcut for export (Ctrl+E)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                exportSalesReport('pdf');
            }
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (salesEventSource) {
            salesEventSource.close();
            salesEventSource = null;
        }
    });
});

// Make functions available globally
window.exportSalesReport = exportSalesReport;
window.showNotification = showNotification;
window.calculateRevenueBreakdown = calculateRevenueBreakdown;
window.updateRevenueBreakdownDisplay = updateRevenueBreakdownDisplay;
window.getItemCategory = getItemCategory;