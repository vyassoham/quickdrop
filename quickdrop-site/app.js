/* ============================================================
   QuickDrop — Core Application Logic
   ============================================================ */

const App = (() => {
  let state = { orders: [], drivers: [], currentTab: 'dashboard', wizardStep: 0 };

  // --- Init ---
  function init() {
    const saved = QuickDropData.loadState();
    if (saved && saved.orders && saved.orders.length) {
      state = { ...state, ...saved };
    } else {
      state.drivers = QuickDropData.generateDriverPool(12);
      state.orders = QuickDropData.generateOrderPool(25, state.drivers);
      QuickDropData.saveState(state);
    }
    setupNav();
    renderDashboard();
    startLiveSimulation();
  }

  // --- SPA Router ---
  function setupNav() {
    document.querySelectorAll('.topbar-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        navigateTo(tab);
      });
    });
  }

  function navigateTo(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.topbar-nav a').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.topbar-nav a[data-tab="${tab}"]`);
    if (activeLink) activeLink.classList.add('active');
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(`page-${tab}`);
    if (activePage) activePage.classList.add('active');

    const renderers = {
      dashboard: renderDashboard, track: renderTrack, neworder: renderNewOrder,
      fleet: renderFleet, analytics: renderAnalytics, settings: renderSettings
    };
    if (renderers[tab]) renderers[tab]();
  }

  // --- Toast System ---
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // --- Live Simulation ---
  function startLiveSimulation() {
    setInterval(() => {
      const pending = state.orders.filter(o => o.status !== 'delivered');
      if (pending.length > 0) {
        const order = QuickDropData.pick(pending);
        const idx = QuickDropData.STATUSES.indexOf(order.status);
        if (idx < QuickDropData.STATUSES.length - 1) {
          order.status = QuickDropData.STATUSES[idx + 1];
          order.statusIndex = idx + 1;
          order.statusLabel = QuickDropData.STATUS_LABELS[order.status];
          if (order.status === 'delivered') order.rating = QuickDropData.rand(3, 5);
          QuickDropData.saveState(state);
          if (state.currentTab === 'dashboard') renderDashboard();
        }
      }
    }, 12000);
  }

  // =====================================================================
  // DASHBOARD
  // =====================================================================
  function renderDashboard() {
    const kpis = QuickDropData.getDashboardKPIs(state.orders);
    const el = document.getElementById('dashboard-kpis');
    el.innerHTML = `
      <div class="kpi-card"><span class="kpi-label">Active Deliveries</span><span class="kpi-value">${kpis.activeDeliveries}</span><span class="kpi-change up">&#9650; Live</span></div>
      <div class="kpi-card"><span class="kpi-label">Completed Today</span><span class="kpi-value">${kpis.completedToday}</span><span class="kpi-change up">&#9650; ${QuickDropData.rand(5,20)}%</span></div>
      <div class="kpi-card"><span class="kpi-label">Revenue</span><span class="kpi-value">&#8377;${kpis.totalRevenue.toLocaleString('en-IN')}</span><span class="kpi-change up">&#9650; ${QuickDropData.rand(3,15)}%</span></div>
      <div class="kpi-card"><span class="kpi-label">Avg Delivery Time</span><span class="kpi-value">${kpis.avgDeliveryTime}m</span><span class="kpi-change down">&#9660; ${QuickDropData.rand(1,8)}%</span></div>
      <div class="kpi-card"><span class="kpi-label">Avg Rating</span><span class="kpi-value">${kpis.avgRating} &#9733;</span><span class="kpi-change up">&#9650; Excellent</span></div>
      <div class="kpi-card"><span class="kpi-label">Total Orders</span><span class="kpi-value">${kpis.totalOrders}</span><span class="kpi-change up">&#9650; Growing</span></div>
    `;
    renderMapPlaceholder();
    renderActivityFeed();
  }

  function renderMapPlaceholder() {
    const container = document.getElementById('dashboard-map');
    container.innerHTML = '';
    // Grid lines
    for (let i = 1; i < 8; i++) {
      const h = document.createElement('div');
      h.className = 'map-grid-line h';
      h.style.top = `${(i / 8) * 100}%`;
      container.appendChild(h);
      const v = document.createElement('div');
      v.className = 'map-grid-line v';
      v.style.left = `${(i / 8) * 100}%`;
      container.appendChild(v);
    }
    // Animated pins
    const active = state.orders.filter(o => !['delivered', 'placed'].includes(o.status));
    active.slice(0, 8).forEach((o, i) => {
      const pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.style.left = `${QuickDropData.rand(10, 85)}%`;
      pin.style.top = `${QuickDropData.rand(10, 85)}%`;
      pin.style.animationDelay = `${i * 0.3}s`;
      pin.title = `${o.id} - ${o.statusLabel}`;
      container.appendChild(pin);
    });
    // Label
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;bottom:12px;left:12px;font-size:0.75rem;color:var(--text-muted);';
    label.textContent = `${active.length} active deliveries on map`;
    container.appendChild(label);
  }

  function renderActivityFeed() {
    const feed = QuickDropData.generateActivityFeed(10);
    const el = document.getElementById('dashboard-feed');
    el.innerHTML = feed.map(f => `
      <div class="feed-item">
        <div class="feed-icon" style="background:${f.bg}">${f.icon}</div>
        <div class="feed-content">
          <div class="feed-title">${f.text}</div>
          <div class="feed-time">${f.time}</div>
        </div>
      </div>
    `).join('');
  }

  // =====================================================================
  // TRACK ORDER
  // =====================================================================
  function renderTrack() {
    const container = document.getElementById('track-results');
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Enter an Order ID above to track your delivery</p></div>`;
    // Recent orders table
    const recent = state.orders.slice(0, 10);
    const table = document.getElementById('track-recent');
    table.innerHTML = `<table class="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Package</th><th>Cost</th><th>Action</th></tr></thead><tbody>
      ${recent.map(o => `<tr>
        <td style="color:var(--accent-primary);font-weight:600">${o.id}</td>
        <td>${o.customerName}</td>
        <td>${statusBadge(o.status)}</td>
        <td>${o.packageType}</td>
        <td>&#8377;${o.cost}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="App.trackOrder('${o.id}')">Track</button></td>
      </tr>`).join('')}
    </tbody></table>`;
  }

  function trackOrder(orderId) {
    const id = orderId || document.getElementById('track-input').value.trim();
    if (!id) { toast('Please enter an Order ID', 'error'); return; }
    const order = state.orders.find(o => o.id === id);
    if (!order) { toast(`Order "${id}" not found`, 'error'); return; }

    const container = document.getElementById('track-results');
    const steps = QuickDropData.STATUSES;
    container.innerHTML = `
      <div class="grid-2">
        <div class="glass-card">
          <h3>Delivery Timeline</h3>
          <div class="timeline">
            ${steps.map((s, i) => {
              const cls = i < order.statusIndex ? 'completed' : i === order.statusIndex ? 'active' : '';
              return `<div class="timeline-step ${cls}"><div class="timeline-dot"></div><div class="timeline-label">${QuickDropData.STATUS_LABELS[s]}</div><div class="timeline-desc">${i <= order.statusIndex ? 'Completed' : 'Pending'}</div></div>`;
            }).join('')}
          </div>
        </div>
        <div>
          <div class="glass-card" style="margin-bottom:16px">
            <h3>Order Details</h3>
            <p style="margin-bottom:8px"><strong>ID:</strong> ${order.id}</p>
            <p style="margin-bottom:8px"><strong>Customer:</strong> ${order.customerName}</p>
            <p style="margin-bottom:8px"><strong>Package:</strong> ${order.packageType} (${order.weight} kg)</p>
            <p style="margin-bottom:8px"><strong>Priority:</strong> ${order.priority.toUpperCase()}</p>
            <p style="margin-bottom:8px"><strong>Cost:</strong> &#8377;${order.cost} ${order.tip ? '+ &#8377;' + order.tip + ' tip' : ''}</p>
            <p style="margin-bottom:8px"><strong>Pickup:</strong> ${order.pickupAddress}</p>
            <p><strong>Dropoff:</strong> ${order.dropoffAddress}</p>
          </div>
          <div class="glass-card">
            <h3>Assigned Driver</h3>
            <div class="driver-card">
              <div class="driver-avatar">${order.driver.initials}</div>
              <div class="driver-info"><div class="driver-name">${order.driver.name}</div><div class="driver-vehicle">${order.driver.vehicle} &middot; ${order.driver.licensePlate}</div></div>
              <div class="driver-meta"><div class="driver-rating">&#9733; ${order.driver.rating}</div><div class="driver-trips">${order.driver.totalTrips} trips</div></div>
            </div>
          </div>
        </div>
      </div>`;
    toast(`Tracking order ${order.id}`, 'success');
  }

  function statusBadge(status) {
    const map = { placed: 'badge-purple', confirmed: 'badge-blue', picked_up: 'badge-amber', in_transit: 'badge-blue', out_for_delivery: 'badge-amber', delivered: 'badge-green' };
    return `<span class="badge ${map[status] || 'badge-blue'}">${QuickDropData.STATUS_LABELS[status]}</span>`;
  }

  // =====================================================================
  // NEW ORDER WIZARD
  // =====================================================================
  function renderNewOrder() { state.wizardStep = 0; updateWizard(); }

  function updateWizard() {
    document.querySelectorAll('.wizard-step').forEach((s, i) => {
      s.className = 'wizard-step' + (i < state.wizardStep ? ' done' : i === state.wizardStep ? ' active' : '');
    });
    document.querySelectorAll('.wizard-panel').forEach((p, i) => {
      p.className = 'wizard-panel' + (i === state.wizardStep ? ' active' : '');
    });
    // Cost estimator on step 3
    if (state.wizardStep === 2) updateCostEstimate();
  }

  function wizardNext() {
    if (state.wizardStep < 3) { state.wizardStep++; updateWizard(); }
  }

  function wizardBack() {
    if (state.wizardStep > 0) { state.wizardStep--; updateWizard(); }
  }

  function updateCostEstimate() {
    const pkg = document.getElementById('pkg-type')?.value || 'Small Parcel';
    const pri = document.getElementById('pkg-priority')?.value || 'standard';
    const wt = parseFloat(document.getElementById('pkg-weight')?.value) || 1;
    const cost = QuickDropData.estimateCost(pkg, pri, wt);
    const el = document.getElementById('cost-estimate');
    if (el) el.textContent = `₹${cost}`;
  }

  function submitOrder() {
    const pickup = document.getElementById('pickup-addr')?.value;
    const dropoff = document.getElementById('dropoff-addr')?.value;
    if (!pickup || !dropoff) { toast('Please fill in all address fields', 'error'); return; }

    const pkg = document.getElementById('pkg-type')?.value || 'Small Parcel';
    const pri = document.getElementById('pkg-priority')?.value || 'standard';
    const wt = parseFloat(document.getElementById('pkg-weight')?.value) || 1;
    const cost = QuickDropData.estimateCost(pkg, pri, wt);

    const newOrder = QuickDropData.generateOrder(null, state.drivers);
    newOrder.pickupAddress = pickup;
    newOrder.dropoffAddress = dropoff;
    newOrder.packageType = pkg;
    newOrder.priority = pri;
    newOrder.weight = wt;
    newOrder.cost = cost;
    newOrder.status = 'placed';
    newOrder.statusIndex = 0;
    newOrder.statusLabel = 'Order Placed';

    state.orders.unshift(newOrder);
    QuickDropData.saveState(state);
    toast(`Order ${newOrder.id} created successfully!`, 'success');
    navigateTo('track');
  }

  // =====================================================================
  // FLEET MANAGER
  // =====================================================================
  function renderFleet() {
    const container = document.getElementById('fleet-list');
    const counts = { available: 0, en_route: 0, offline: 0, on_break: 0 };
    state.drivers.forEach(d => counts[d.status]++);

    document.getElementById('fleet-stats').innerHTML = `
      <div class="kpi-card"><span class="kpi-label">Available</span><span class="kpi-value" style="color:var(--accent-green)">${counts.available}</span></div>
      <div class="kpi-card"><span class="kpi-label">En Route</span><span class="kpi-value" style="color:var(--accent-cyan)">${counts.en_route}</span></div>
      <div class="kpi-card"><span class="kpi-label">On Break</span><span class="kpi-value" style="color:var(--accent-amber)">${counts.on_break}</span></div>
      <div class="kpi-card"><span class="kpi-label">Offline</span><span class="kpi-value" style="color:var(--accent-red)">${counts.offline}</span></div>
    `;

    container.innerHTML = state.drivers.map(d => {
      const badgeCls = { available: 'badge-green', en_route: 'badge-blue', offline: 'badge-red', on_break: 'badge-amber' }[d.status];
      return `
        <div class="driver-card">
          <div class="driver-avatar">${d.initials}</div>
          <div class="driver-info">
            <div class="driver-name">${d.name} <span class="badge ${badgeCls}">${d.status.replace('_',' ')}</span></div>
            <div class="driver-vehicle">${d.vehicle} &middot; ${d.vehicleType} &middot; ${d.licensePlate}</div>
          </div>
          <div class="driver-meta">
            <div class="driver-rating">&#9733; ${d.rating} &middot; ${d.completionRate}%</div>
            <div class="driver-trips">${d.totalTrips} trips &middot; &#8377;${d.earnings.toLocaleString('en-IN')}</div>
          </div>
        </div>`;
    }).join('');
  }

  // =====================================================================
  // ANALYTICS
  // =====================================================================
  function renderAnalytics() {
    renderRevenueChart();
    renderHeatmap();
    renderTopRoutes();
    renderSatisfaction();
  }

  function renderRevenueChart() {
    const canvas = document.getElementById('chart-revenue');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = QuickDropData.generateRevenueData(14);
    const W = canvas.width = canvas.parentElement.offsetWidth;
    const H = canvas.height = 280;
    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;
    const maxVal = Math.max(...data.map(d => d.revenue)) * 1.1;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (ch / 5) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '10px Inter';
      ctx.fillText(`₹${Math.round(maxVal - (maxVal / 5) * i).toLocaleString()}`, 4, y + 4);
    }

    // Bars
    const barW = Math.max(8, (cw / data.length) - 6);
    data.forEach((d, i) => {
      const x = pad.left + (cw / data.length) * i + (cw / data.length - barW) / 2;
      const barH = (d.revenue / maxVal) * ch;
      const y = pad.top + ch - barH;

      const grad = ctx.createLinearGradient(x, y, x, pad.top + ch);
      grad.addColorStop(0, 'rgba(99,102,241,0.9)');
      grad.addColorStop(1, 'rgba(139,92,246,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = '#64748b'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, H - 8);
    });
  }

  function renderHeatmap() {
    const canvas = document.getElementById('chart-heatmap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = QuickDropData.generateHourlyHeatmap();
    const W = canvas.width = canvas.parentElement.offsetWidth;
    const H = canvas.height = 280;
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;
    const maxVal = Math.max(...data.map(d => d.deliveries));

    ctx.clearRect(0, 0, W, H);

    // Line chart
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    const points = data.map((d, i) => ({
      x: pad.left + (cw / (data.length - 1)) * i,
      y: pad.top + ch - (d.deliveries / maxVal) * ch
    }));

    points.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.stroke();

    // Fill area
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    areaGrad.addColorStop(0, 'rgba(16,185,129,0.2)');
    areaGrad.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.lineTo(points[points.length - 1].x, pad.top + ch);
    ctx.lineTo(points[0].x, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Dots
    points.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; ctx.fill();
    });

    // X labels
    ctx.fillStyle = '#64748b'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    data.forEach((d, i) => {
      if (i % 3 === 0) ctx.fillText(d.label, points[i].x, H - 8);
    });
  }

  function renderTopRoutes() {
    const routes = QuickDropData.generateTopRoutes();
    const el = document.getElementById('analytics-routes');
    if (!el) return;
    el.innerHTML = `<table class="data-table"><thead><tr><th>Route</th><th>Orders</th><th>Avg Time</th><th>Revenue</th></tr></thead><tbody>
      ${routes.map(r => `<tr><td>${r.from} → ${r.to}</td><td>${r.count}</td><td>${r.avgTime}m</td><td>₹${r.revenue.toLocaleString('en-IN')}</td></tr>`).join('')}
    </tbody></table>`;
  }

  function renderSatisfaction() {
    const el = document.getElementById('analytics-satisfaction');
    if (!el) return;
    const ratings = [0, 0, 0, 0, 0];
    state.orders.filter(o => o.rating).forEach(o => ratings[o.rating - 1]++);
    const total = ratings.reduce((s, v) => s + v, 0) || 1;

    el.innerHTML = [5, 4, 3, 2, 1].map(star => {
      const count = ratings[star - 1];
      const pct = Math.round((count / total) * 100);
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="width:20px;text-align:right;font-size:0.85rem;color:var(--accent-amber)">${star}&#9733;</span>
        <div style="flex:1;height:8px;background:var(--bg-glass);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--accent-amber);border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <span style="width:36px;font-size:0.8rem;color:var(--text-muted)">${pct}%</span>
      </div>`;
    }).join('');
  }

  // =====================================================================
  // SETTINGS
  // =====================================================================
  function renderSettings() {
    document.querySelectorAll('.toggle').forEach(t => {
      t.addEventListener('click', () => { t.classList.toggle('on'); toast('Setting updated', 'success'); });
    });
  }

  function resetAllData() {
    if (confirm('This will clear all stored data. Continue?')) {
      QuickDropData.clearState();
      state.drivers = QuickDropData.generateDriverPool(12);
      state.orders = QuickDropData.generateOrderPool(25, state.drivers);
      QuickDropData.saveState(state);
      toast('All data has been reset', 'info');
      navigateTo('dashboard');
    }
  }

  // =====================================================================
  // ORDER MANAGEMENT — Filter, Search, Delete, Export
  // =====================================================================
  function filterOrders(statusFilter) {
    const filtered = statusFilter === 'all'
      ? state.orders
      : state.orders.filter(o => o.status === statusFilter);
    renderFilteredOrderTable(filtered, statusFilter);
  }

  function renderFilteredOrderTable(orders, activeFilter) {
    const table = document.getElementById('track-recent');
    if (!table) return;

    const filterBar = `
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        ${['all', ...QuickDropData.STATUSES].map(s => {
          const label = s === 'all' ? 'All Orders' : QuickDropData.STATUS_LABELS[s];
          const isActive = s === activeFilter;
          return `<button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}" 
                    onclick="App.filterOrders('${s}')">${label}</button>`;
        }).join('')}
      </div>`;

    const tableHTML = `<table class="data-table">
      <thead><tr>
        <th>Order ID</th><th>Customer</th><th>Status</th>
        <th>Package</th><th>Priority</th><th>Cost</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${orders.map(o => `<tr>
          <td style="color:var(--accent-primary);font-weight:600">${o.id}</td>
          <td>${o.customerName}</td>
          <td>${statusBadge(o.status)}</td>
          <td>${o.packageType} (${o.weight}kg)</td>
          <td><span class="badge ${o.priority === 'priority' ? 'badge-red' : o.priority === 'express' ? 'badge-amber' : 'badge-blue'}">${o.priority}</span></td>
          <td>&#8377;${o.cost}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="App.trackOrder('${o.id}')" title="Track">&#128270;</button>
            <button class="btn btn-sm btn-danger" onclick="App.deleteOrder('${o.id}')" title="Delete">&#128465;</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

    table.innerHTML = filterBar + tableHTML;
  }

  function searchOrders(query) {
    if (!query || query.trim() === '') {
      renderTrack();
      return;
    }
    const q = query.toLowerCase().trim();
    const results = state.orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.packageType.toLowerCase().includes(q) ||
      o.pickupAddress.toLowerCase().includes(q) ||
      o.dropoffAddress.toLowerCase().includes(q)
    );
    renderFilteredOrderTable(results, 'search');
    toast(`Found ${results.length} matching orders`, 'info');
  }

  function deleteOrder(orderId) {
    if (!confirm(`Delete order ${orderId}? This cannot be undone.`)) return;
    state.orders = state.orders.filter(o => o.id !== orderId);
    QuickDropData.saveState(state);
    toast(`Order ${orderId} deleted`, 'info');
    renderTrack();
  }

  function cancelOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) { toast('Order not found', 'error'); return; }
    if (order.status === 'delivered') { toast('Cannot cancel a delivered order', 'error'); return; }
    order.status = 'placed';
    order.statusIndex = 0;
    order.statusLabel = 'Order Placed';
    QuickDropData.saveState(state);
    toast(`Order ${orderId} has been cancelled and reset`, 'info');
    renderTrack();
  }

  // =====================================================================
  // EXPORT SYSTEM — CSV Download
  // =====================================================================
  function exportOrdersCSV() {
    const headers = ['Order ID', 'Customer', 'Phone', 'Status', 'Package Type',
                     'Weight (kg)', 'Priority', 'Cost (INR)', 'Tip (INR)',
                     'Pickup Address', 'Dropoff Address', 'Driver', 'Created At'];
    const rows = state.orders.map(o => [
      o.id, o.customerName, o.customerPhone, o.statusLabel, o.packageType,
      o.weight, o.priority, o.cost, o.tip,
      `"${o.pickupAddress}"`, `"${o.dropoffAddress}"`, o.driver.name,
      new Date(o.createdAt).toLocaleString('en-IN')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.join(',') + '\n'; });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quickdrop_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Orders exported to CSV', 'success');
  }

  function exportDriversCSV() {
    const headers = ['Driver ID', 'Name', 'Phone', 'Vehicle', 'Type',
                     'License Plate', 'Rating', 'Trips', 'Status',
                     'Earnings (INR)', 'Completion Rate (%)', 'Join Date'];
    const rows = state.drivers.map(d => [
      d.id, d.name, d.phone, d.vehicle, d.vehicleType,
      d.licensePlate, d.rating, d.totalTrips, d.status,
      d.earnings, d.completionRate, d.joinDate
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.join(',') + '\n'; });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quickdrop_drivers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Drivers exported to CSV', 'success');
  }

  // =====================================================================
  // DRIVER STATUS MANAGEMENT
  // =====================================================================
  function toggleDriverStatus(driverId) {
    const driver = state.drivers.find(d => d.id === driverId);
    if (!driver) return;
    const cycle = ['available', 'en_route', 'on_break', 'offline'];
    const currentIdx = cycle.indexOf(driver.status);
    driver.status = cycle[(currentIdx + 1) % cycle.length];
    QuickDropData.saveState(state);
    toast(`${driver.name} status changed to: ${driver.status.replace('_', ' ')}`, 'info');
    renderFleet();
  }

  function getDriverPerformanceStats() {
    const stats = {
      totalDrivers: state.drivers.length,
      avgRating: 0,
      avgTrips: 0,
      avgEarnings: 0,
      avgCompletionRate: 0,
      topPerformer: null,
      mostTrips: null
    };

    if (stats.totalDrivers === 0) return stats;

    let totalRating = 0, totalTrips = 0, totalEarnings = 0, totalCompletion = 0;
    let bestRating = 0, bestTrips = 0;

    state.drivers.forEach(d => {
      const rating = parseFloat(d.rating);
      totalRating += rating;
      totalTrips += d.totalTrips;
      totalEarnings += d.earnings;
      totalCompletion += d.completionRate;

      if (rating > bestRating) { bestRating = rating; stats.topPerformer = d; }
      if (d.totalTrips > bestTrips) { bestTrips = d.totalTrips; stats.mostTrips = d; }
    });

    stats.avgRating = (totalRating / stats.totalDrivers).toFixed(1);
    stats.avgTrips = Math.round(totalTrips / stats.totalDrivers);
    stats.avgEarnings = Math.round(totalEarnings / stats.totalDrivers);
    stats.avgCompletionRate = Math.round(totalCompletion / stats.totalDrivers);

    return stats;
  }

  // =====================================================================
  // DELIVERY PERFORMANCE CHART (Canvas)
  // =====================================================================
  function renderDeliveryPerformanceChart() {
    const canvas = document.getElementById('chart-performance');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = QuickDropData.generateRevenueData(14);
    const W = canvas.width = canvas.parentElement.offsetWidth;
    const H = canvas.height = 280;
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;
    const maxVal = Math.max(...data.map(d => d.orders)) * 1.15;

    ctx.clearRect(0, 0, W, H);

    // Background grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.left - 8, y + 4);
    }

    // Compute points
    const points = data.map((d, i) => ({
      x: pad.left + (cw / (data.length - 1)) * i,
      y: pad.top + ch - (d.orders / maxVal) * ch,
      label: d.label,
      value: d.orders
    }));

    // Draw smooth bezier curve
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
      }
    });
    ctx.stroke();

    // Gradient fill under curve
    const fillGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    fillGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
    fillGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.lineTo(points[points.length - 1].x, pad.top + ch);
    ctx.lineTo(points[0].x, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Data points
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0e1a';
      ctx.fill();
    });

    // X-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter';
    ctx.textAlign = 'center';
    points.forEach((p, i) => {
      if (i % 2 === 0) ctx.fillText(p.label, p.x, H - 8);
    });
  }

  // =====================================================================
  // ORDER STATISTICS CALCULATOR
  // =====================================================================
  function getOrderStatistics() {
    const stats = {
      total: state.orders.length,
      byStatus: {},
      byPriority: { standard: 0, express: 0, priority: 0 },
      byPackageType: {},
      totalRevenue: 0,
      totalTips: 0,
      avgCost: 0,
      avgWeight: 0,
      deliverySuccessRate: 0,
      avgRating: 0
    };

    let ratingSum = 0, ratingCount = 0;
    let weightSum = 0;

    QuickDropData.STATUSES.forEach(s => { stats.byStatus[s] = 0; });

    state.orders.forEach(o => {
      stats.byStatus[o.status] = (stats.byStatus[o.status] || 0) + 1;
      stats.byPriority[o.priority] = (stats.byPriority[o.priority] || 0) + 1;
      stats.byPackageType[o.packageType] = (stats.byPackageType[o.packageType] || 0) + 1;
      stats.totalRevenue += o.cost;
      stats.totalTips += o.tip;
      weightSum += parseFloat(o.weight);
      if (o.rating) { ratingSum += o.rating; ratingCount++; }
    });

    stats.avgCost = stats.total > 0 ? Math.round(stats.totalRevenue / stats.total) : 0;
    stats.avgWeight = stats.total > 0 ? (weightSum / stats.total).toFixed(1) : 0;
    stats.avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : 'N/A';
    stats.deliverySuccessRate = stats.total > 0
      ? Math.round((stats.byStatus.delivered / stats.total) * 100) : 0;

    return stats;
  }

  // =====================================================================
  // KEYBOARD SHORTCUTS
  // =====================================================================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only trigger if not typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const shortcuts = {
        '1': 'dashboard',
        '2': 'track',
        '3': 'neworder',
        '4': 'fleet',
        '5': 'analytics',
        '6': 'settings'
      };

      if (shortcuts[e.key]) {
        e.preventDefault();
        navigateTo(shortcuts[e.key]);
        return;
      }

      // Ctrl+E = Export orders
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportOrdersCSV();
        return;
      }

      // Ctrl+R = Reset data (with confirmation)
      if (e.ctrlKey && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        resetAllData();
        return;
      }

      // Escape = Go to dashboard
      if (e.key === 'Escape') {
        navigateTo('dashboard');
        return;
      }

      // / = Focus search
      if (e.key === '/') {
        e.preventDefault();
        navigateTo('track');
        setTimeout(() => {
          const input = document.getElementById('track-input');
          if (input) input.focus();
        }, 100);
      }
    });
  }

  // =====================================================================
  // NOTIFICATION CENTER
  // =====================================================================
  const notifications = [];

  function addNotification(title, message, type = 'info') {
    const notification = {
      id: QuickDropData.uuid(),
      title: title,
      message: message,
      type: type,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.unshift(notification);

    // Keep only last 50 notifications
    if (notifications.length > 50) notifications.pop();

    updateNotificationBadge();
    return notification;
  }

  function markNotificationRead(notifId) {
    const notif = notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
    updateNotificationBadge();
  }

  function markAllNotificationsRead() {
    notifications.forEach(n => { n.read = true; });
    updateNotificationBadge();
    toast('All notifications marked as read', 'success');
  }

  function getUnreadCount() {
    return notifications.filter(n => !n.read).length;
  }

  function updateNotificationBadge() {
    const count = getUnreadCount();
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  // =====================================================================
  // THEME MANAGER
  // =====================================================================
  let currentTheme = 'dark';

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'light') {
      document.documentElement.style.setProperty('--bg-primary', '#f8fafc');
      document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
      document.documentElement.style.setProperty('--bg-glass', 'rgba(0, 0, 0, 0.03)');
      document.documentElement.style.setProperty('--bg-glass-hover', 'rgba(0, 0, 0, 0.06)');
      document.documentElement.style.setProperty('--border-glass', 'rgba(0, 0, 0, 0.08)');
      document.documentElement.style.setProperty('--border-glass-hover', 'rgba(0, 0, 0, 0.15)');
      document.documentElement.style.setProperty('--text-primary', '#0f172a');
      document.documentElement.style.setProperty('--text-secondary', '#475569');
      document.documentElement.style.setProperty('--text-muted', '#94a3b8');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#0a0e1a');
      document.documentElement.style.setProperty('--bg-secondary', '#111827');
      document.documentElement.style.setProperty('--bg-glass', 'rgba(255, 255, 255, 0.04)');
      document.documentElement.style.setProperty('--bg-glass-hover', 'rgba(255, 255, 255, 0.08)');
      document.documentElement.style.setProperty('--border-glass', 'rgba(255, 255, 255, 0.08)');
      document.documentElement.style.setProperty('--border-glass-hover', 'rgba(255, 255, 255, 0.15)');
      document.documentElement.style.setProperty('--text-primary', '#f1f5f9');
      document.documentElement.style.setProperty('--text-secondary', '#94a3b8');
      document.documentElement.style.setProperty('--text-muted', '#64748b');
    }
    toast(`Switched to ${currentTheme} theme`, 'info');
  }

  // =====================================================================
  // DATE/TIME UTILITIES
  // =====================================================================
  function formatRelativeTime(isoString) {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  // --- Public API ---
  return {
    init, navigateTo, trackOrder,
    wizardNext, wizardBack, submitOrder, updateCostEstimate,
    resetAllData, toast,
    filterOrders, searchOrders, deleteOrder, cancelOrder,
    exportOrdersCSV, exportDriversCSV,
    toggleDriverStatus, toggleTheme,
    addNotification, markAllNotificationsRead
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
