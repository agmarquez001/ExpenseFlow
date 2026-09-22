/* =========================================================
   ExpenseFlow — Fase 3: Integración de API RESTful y Persistencia
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const API_URL = 'https://open.er-api.com/v6/latest/MXN'; // API RESTful pública
  let exchangeRates = { USD: 0.05, EUR: 0.045 }; // Valores fallback en caso de falla
  
  // Categorías y colores
  const CATEGORY_COLORS = {
    Comida: '#FF9800',
    Transporte: '#2196F3',
    Ocio: '#9C27B0',
    Salud: '#F44336',
    Otros: '#607D8B'
  };

  const CATEGORY_ICONS = {
    Comida: '🍔',
    Transporte: '🚌',
    Ocio: '🎬',
    Salud: '💊',
    Otros: '📦'
  };

  const CATEGORY_BADGE_CLASS = {
    Comida: 'ef-badge-comida',
    Transporte: 'ef-badge-transporte',
    Ocio: 'ef-badge-ocio',
    Salud: 'ef-badge-salud',
    Otros: 'ef-badge-otros'
  };

  // 1. Cargar datos desde LocalStorage o usar valores iniciales
  let expenses = JSON.parse(localStorage.getItem('ef_expenses')) || [
    { id: 1, desc: 'Supermercado semanal', amount: 850.00, category: 'Comida', date: '2026-09-08', status: 'completada' },
    { id: 2, desc: 'Uber al trabajo', amount: 120.00, category: 'Transporte', date: '2026-09-07', status: 'completada' },
    { id: 3, desc: 'Cine con amigos', amount: 280.00, category: 'Ocio', date: '2026-09-07', status: 'completada' },
    { id: 4, desc: 'Consulta médica', amount: 500.00, category: 'Salud', date: '2026-09-06', status: 'pendiente' },
    { id: 5, desc: 'Gasolina', amount: 600.00, category: 'Transporte', date: '2026-09-05', status: 'completada' }
  ];

  let categoryChartInstance = null;

  // 2. Consumo de API RESTful mediante Fetch API
  async function fetchExchangeRates() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al conectar con la API');
      const data = await response.json();
      exchangeRates.USD = data.rates.USD;
      exchangeRates.EUR = data.rates.EUR;
      showFeedback('API RESTful conectada: Tipos de cambio actualizados.');
    } catch (error) {
      console.warn('Uso de valores de respaldo por error en API:', error);
    }
  }

  // Guardar en LocalStorage
  function saveToStorage() {
    localStorage.setItem('ef_expenses', JSON.stringify(expenses));
    renderAll();
  }

  // 3. Renderizado general de la interfaz
  function renderAll() {
    renderTable();
    updateSummary();
    renderCharts();
  }

  // Renderizar la tabla con filtros
  function renderTable() {
    const tbody = document.querySelector('#expenseTable tbody');
    const emptyState = document.getElementById('emptyState');
    if (!tbody) return;

    tbody.innerHTML = '';
    const activeFilter = document.querySelector('#statusFilter .active')?.dataset.filter || 'todas';

    let visibleCount = 0;
    expenses.forEach(exp => {
      const matches = activeFilter === 'todas' || exp.status === activeFilter;
      if (matches) visibleCount++;

      const [y, m, d] = exp.date.split('-');
      const tr = document.createElement('tr');
      if (!matches) tr.classList.add('d-none');

      tr.innerHTML = `
        <td>${d}/${m}/${y}</td>
        <td>${exp.desc}</td>
        <td class="d-none d-md-table-cell"><span class="badge ${CATEGORY_BADGE_CLASS[exp.category]}">${CATEGORY_ICONS[exp.category]} ${exp.category}</span></td>
        <td class="fw-semibold">$${parseFloat(exp.amount).toFixed(2)} MXN</td>
        <td class="d-none d-sm-table-cell">
          <span class="badge ${exp.status === 'completada' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}">
            ${exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger ef-action-btn" onclick="deleteExpense(${exp.id})" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (emptyState) emptyState.classList.toggle('d-none', visibleCount > 0);
  }

  // Actualizar tarjetas de resumen con la conversión de la API
  function updateSummary() {
    const total = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalInUSD = (total * exchangeRates.USD).toFixed(2);

    const totalEl = document.querySelector('.ef-summary-value');
    if (totalEl) {
      totalEl.innerHTML = `$${total.toLocaleString('es-MX', {minimumFractionDigits: 2})} <small class="text-muted fs-6">($${totalInUSD} USD)</small>`;
    }
  }

  // Renderizar gráfica con Chart.js
  function renderCharts() {
    const categories = ['Comida', 'Transporte', 'Ocio', 'Salud', 'Otros'];
    const totalsByCategory = categories.map(cat => 
      expenses.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount), 0)
    );

    const catCtx = document.getElementById('categoryChart');
    if (catCtx && window.Chart) {
      if (categoryChartInstance) categoryChartInstance.destroy();
      categoryChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: categories,
          datasets: [{
            data: totalsByCategory,
            backgroundColor: categories.map(c => CATEGORY_COLORS[c]),
            borderWidth: 2
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
      });
    }
  }

  // Operación para eliminar gasto
  window.deleteExpense = function(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveToStorage();
    showFeedback('Gasto eliminado dinámicamente.');
  };

  // Registro de nuevo gasto desde el formulario
  document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value || 0);
    const category = document.getElementById('expCategory').value;
    const date = document.getElementById('expDate').value;

    if (!desc || amount <= 0 || !date) return;

    const newExp = { id: Date.now(), desc, amount, category, date, status: 'pendiente' };
    expenses.unshift(newExp);
    saveToStorage();
    e.target.reset();
    showFeedback('Nuevo gasto registrado exitosamente.');
  });

  // Mostrar mensaje emergente Toast
  function showFeedback(msg) {
    const toastEl = document.getElementById('feedbackToast');
    const toastBody = document.getElementById('feedbackToastBody');
    if (toastEl && toastBody) {
      toastBody.textContent = msg;
      new bootstrap.Toast(toastEl, { delay: 2500 }).show();
    }
  }

  // Inicialización
  fetchExchangeRates().then(() => renderAll());
});
