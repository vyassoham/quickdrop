/* ============================================================
   QuickDrop — Mock Data Factories & Simulation Engines
   ============================================================ */

const QuickDropData = (() => {
  // --- Utility Helpers ---
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const uuid = () => 'QD-' + Date.now().toString(36).toUpperCase() + '-' + rand(1000, 9999);

  // --- Seed Data ---
  const FIRST_NAMES = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Diya', 'Karan', 'Neha', 'Soham', 'Ishaan', 'Riya', 'Aditya', 'Kavya'];
  const LAST_NAMES = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Verma', 'Joshi', 'Mehta', 'Reddy', 'Nair', 'Vyas', 'Rao', 'Iyer', 'Shah', 'Das'];
  const STREETS = ['MG Road', 'Park Street', 'Anna Salai', 'FC Road', 'Linking Road', 'Brigade Road', 'Connaught Place', 'Residency Road', 'Hill Road', 'Church Street', 'Marine Drive', 'Jubilee Hills', 'Banjara Hills', 'Koramangala', 'Indiranagar'];
  const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'];
  const VEHICLES = ['Honda Activa', 'Bajaj Pulsar', 'TVS Apache', 'Maruti Swift', 'Tata Ace', 'Mahindra Bolero', 'Royal Enfield', 'Hero Splendor'];
  const VEHICLE_TYPES = ['Bike', 'Scooter', 'Mini Van', 'Sedan', 'Truck'];
  const PACKAGE_TYPES = ['Document', 'Small Parcel', 'Medium Box', 'Large Box', 'Fragile Item', 'Electronics', 'Food Delivery', 'Medicine'];
  const STATUSES = ['placed', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const DRIVER_STATUSES = ['available', 'en_route', 'offline', 'on_break'];

  const STATUS_LABELS = {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered'
  };

  // --- Generator Functions ---
  function generateAddress() {
    return `${rand(1, 500)}, ${pick(STREETS)}, ${pick(CITIES)}`;
  }

  function generateDriver(id) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    return {
      id: id || `DRV-${rand(1000, 9999)}`,
      name: `${first} ${last}`,
      initials: `${first[0]}${last[0]}`,
      phone: `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
      vehicle: pick(VEHICLES),
      vehicleType: pick(VEHICLE_TYPES),
      licensePlate: `${pick(['MH','KA','DL','TN','AP'])} ${rand(1,99)} ${String.fromCharCode(rand(65,90))}${String.fromCharCode(rand(65,90))} ${rand(1000,9999)}`,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      totalTrips: rand(50, 2000),
      status: pick(DRIVER_STATUSES),
      joinDate: new Date(Date.now() - rand(30, 730) * 86400000).toISOString().split('T')[0],
      earnings: rand(15000, 85000),
      completionRate: rand(88, 100)
    };
  }

  function generateOrder(id, driverPool) {
    const statusIdx = rand(0, STATUSES.length - 1);
    const currentStatus = STATUSES[statusIdx];
    const createdAt = new Date(Date.now() - rand(0, 72) * 3600000);
    const estimatedMins = rand(15, 90);
    const costBase = rand(50, 500);
    const driver = driverPool ? pick(driverPool) : generateDriver();

    return {
      id: id || uuid(),
      customerName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      customerPhone: `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
      pickupAddress: generateAddress(),
      dropoffAddress: generateAddress(),
      packageType: pick(PACKAGE_TYPES),
      weight: (Math.random() * 15 + 0.5).toFixed(1),
      status: currentStatus,
      statusIndex: statusIdx,
      statusLabel: STATUS_LABELS[currentStatus],
      createdAt: createdAt.toISOString(),
      estimatedDelivery: new Date(createdAt.getTime() + estimatedMins * 60000).toISOString(),
      estimatedMinutes: estimatedMins,
      cost: costBase,
      tip: rand(0, 1) ? rand(10, 100) : 0,
      driver: driver,
      priority: pick(['standard', 'express', 'priority']),
      notes: rand(0, 1) ? pick(['Handle with care', 'Ring doorbell', 'Leave at door', 'Call before delivery', 'Fragile contents']) : '',
      rating: currentStatus === 'delivered' ? rand(3, 5) : null
    };
  }

  function generateDriverPool(count = 12) {
    const pool = [];
    for (let i = 0; i < count; i++) {
      pool.push(generateDriver(`DRV-${1001 + i}`));
    }
    return pool;
  }

  function generateOrderPool(count = 25, drivers = null) {
    const pool = [];
    const driverPool = drivers || generateDriverPool();
    for (let i = 0; i < count; i++) {
      pool.push(generateOrder(null, driverPool));
    }
    // Sort by creation time, newest first
    pool.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return pool;
  }

  // --- Analytics Generators ---
  function generateRevenueData(days = 14) {
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      data.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: rand(8000, 45000),
        orders: rand(15, 120),
        avgDeliveryTime: rand(18, 55)
      });
    }
    return data;
  }

  function generateHourlyHeatmap() {
    const data = [];
    for (let h = 0; h < 24; h++) {
      let baseLoad = 0;
      if (h >= 7 && h <= 10) baseLoad = rand(15, 40);
      else if (h >= 11 && h <= 14) baseLoad = rand(30, 80);
      else if (h >= 17 && h <= 21) baseLoad = rand(40, 100);
      else if (h >= 22 || h <= 5) baseLoad = rand(2, 12);
      else baseLoad = rand(8, 25);

      data.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        deliveries: baseLoad
      });
    }
    return data;
  }

  function generateTopRoutes() {
    const routes = [];
    for (let i = 0; i < 8; i++) {
      routes.push({
        from: pick(CITIES),
        to: pick(CITIES),
        count: rand(20, 200),
        avgTime: rand(15, 60),
        revenue: rand(5000, 50000)
      });
    }
    routes.sort((a, b) => b.count - a.count);
    return routes;
  }

  function generateActivityFeed(count = 15) {
    const types = [
      { icon: '📦', text: (o) => `Order ${o} was placed`, bg: 'rgba(99,102,241,0.15)' },
      { icon: '✅', text: (o) => `Order ${o} delivered successfully`, bg: 'rgba(16,185,129,0.15)' },
      { icon: '🚗', text: (o) => `Driver assigned to ${o}`, bg: 'rgba(6,182,212,0.15)' },
      { icon: '📍', text: (o) => `Order ${o} picked up`, bg: 'rgba(245,158,11,0.15)' },
      { icon: '⚠️', text: (o) => `Delivery delay on ${o}`, bg: 'rgba(239,68,68,0.15)' },
      { icon: '⭐', text: (o) => `5-star rating received for ${o}`, bg: 'rgba(245,158,11,0.15)' },
    ];
    const items = [];
    for (let i = 0; i < count; i++) {
      const type = pick(types);
      const orderId = uuid();
      items.push({
        icon: type.icon,
        bg: type.bg,
        text: type.text(orderId),
        time: `${rand(1, 59)}m ago`
      });
    }
    return items;
  }

  // --- Delivery Cost Estimator ---
  function estimateCost(packageType, priority, weightKg) {
    const baseCosts = {
      'Document': 30, 'Small Parcel': 50, 'Medium Box': 80,
      'Large Box': 120, 'Fragile Item': 150, 'Electronics': 200,
      'Food Delivery': 40, 'Medicine': 60
    };
    const priorityMultipliers = { 'standard': 1.0, 'express': 1.5, 'priority': 2.0 };
    const base = baseCosts[packageType] || 80;
    const multiplier = priorityMultipliers[priority] || 1.0;
    const weightSurcharge = Math.max(0, (weightKg - 2)) * 10;
    return Math.round((base + weightSurcharge) * multiplier);
  }

  // --- Dashboard KPIs ---
  function getDashboardKPIs(orders) {
    const active = orders.filter(o => !['delivered', 'placed'].includes(o.status)).length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.reduce((s, o) => s + o.cost + o.tip, 0);
    const avgTime = orders.filter(o => o.status === 'delivered').length > 0
      ? Math.round(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.estimatedMinutes, 0) / delivered)
      : 0;
    const avgRating = orders.filter(o => o.rating).length > 0
      ? (orders.filter(o => o.rating).reduce((s, o) => s + o.rating, 0) / orders.filter(o => o.rating).length).toFixed(1)
      : '0.0';
    return {
      activeDeliveries: active,
      completedToday: delivered,
      totalRevenue: totalRevenue,
      avgDeliveryTime: avgTime,
      avgRating: avgRating,
      totalOrders: orders.length
    };
  }

  // --- LocalStorage Persistence ---
  const STORAGE_KEY = 'quickdrop_data';

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { console.warn('Storage save failed:', e); }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearState() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // --- Public API ---
  return {
    rand, pick, uuid,
    generateDriver, generateOrder,
    generateDriverPool, generateOrderPool,
    generateRevenueData, generateHourlyHeatmap,
    generateTopRoutes, generateActivityFeed,
    estimateCost, getDashboardKPIs,
    saveState, loadState, clearState,
    STATUS_LABELS, STATUSES, PACKAGE_TYPES, VEHICLE_TYPES, CITIES
  };
})();
