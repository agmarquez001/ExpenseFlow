/* =========================================================
   ExpenseFlow — Fase 2: Maquetación
   Datos ESTÁTICOS de ejemplo. Sin integración de API/localStorage
   (persistencia real y CRUD completo quedan para Fase 3).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

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

  /* ---------- RF-6: Gráfica de pastel — gastos por categoría ---------- */
  const categoryData = {
    labels: ['Comida', 'Transporte', 'Ocio', 'Salud', 'Otros'],
    values: [1365, 720, 479, 680, 95]
  };

  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx && window.Chart) {
    new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: categoryData.labels,
        datasets: [{
          data: categoryData.values,
          backgroundColor: categoryData.labels.map(l => CATEGORY_COLORS[l]),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: $${ctx.parsed.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  /* ---------- RF-7: Gráfica de barras — gastos por día ---------- */
  const dailyData = {
    labels: ['02 Sep', '03 Sep', '04 Sep', '05 Sep', '06 Sep', '07 Sep', '08 Sep'],
    values: [180, 199, 450, 600, 500, 400, 850]
  };

  const dailyCtx = document.getElementById('dailyChart');
  if (dailyCtx && window.Chart) {
    new Chart(dailyCtx, {
      type: 'bar',
      data: {
        labels: dailyData.labels,
        datasets: [{
          label: 'Gasto diario',
          data: dailyData.values,
          backgroundColor: '#2196F3',
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${ctx.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '$' + v }
          }
        }
      }
    });
  }

  /* ---------- Toast de retroalimentación visual ---------- */
  const toastEl = document.getElementById('feedbackToast');
  const toastBody = document.getElementById('feedbackToastBody');
  const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 2500 }) : null;

  function showFeedback(message) {
    if (!toast) return;
    toastBody.textContent = message;
    toast.show();
  }

  /* ---------- RF-5: Filtro por estado (Todas / Completadas / Pendientes) ---------- */
  const filterButtons = document.querySelectorAll('#statusFilter [data-filter]');
  const tableRows = () => document.querySelectorAll('#expenseTable tbody tr');
  const emptyState = document.getElementById('emptyState');

  function applyFilter(filter) {
    let visibleCount = 0;
    tableRows().forEach(row => {
      const matches = filter === 'todas' || row.dataset.status === filter;
      row.classList.toggle('d-none', !matches);
      if (matches) visibleCount++;
    });
    if (emptyState) emptyState.classList.toggle('d-none', visibleCount > 0);
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });

  /* ---------- RF-4: Editar gasto (modal) ---------- */
  const editModalEl = document.getElementById('editModal');
  let editingRow = null;

  editModalEl.addEventListener('show.bs.modal', (event) => {
    const triggerBtn = event.relatedTarget;
    editingRow = triggerBtn ? triggerBtn.closest('tr') : null;
    if (!editingRow) return;

    document.getElementById('editDesc').value = editingRow.dataset.desc;
    document.getElementById('editAmount').value = editingRow.dataset.amount;
    document.getElementById('editCategory').value = editingRow.dataset.category;
    document.getElementById('editDate').value = editingRow.dataset.date;
  });

  document.getElementById('saveEditBtn').addEventListener('click', () => {
    if (!editingRow) return;

    const desc = document.getElementById('editDesc').value.trim();
    const amount = parseFloat(document.getElementById('editAmount').value || 0);
    const category = document.getElementById('editCategory').value;
    const dateVal = document.getElementById('editDate').value;

    if (!desc || !dateVal) return;

    const [y, m, d] = dateVal.split('-');
    editingRow.dataset.desc = desc;
    editingRow.dataset.amount = amount.toFixed(2);
    editingRow.dataset.category = category;
    editingRow.dataset.date = dateVal;

    editingRow.children[0].textContent = `${d}/${m}/${y}`;
    editingRow.children[1].textContent = desc;
    editingRow.children[2].innerHTML = `<span class="badge ${CATEGORY_BADGE_CLASS[category]}">${CATEGORY_ICONS[category]} ${category}</span>`;
    editingRow.children[3].textContent = `$${amount.toFixed(2)}`;

    bootstrap.Modal.getInstance(editModalEl).hide();
    showFeedback('Gasto actualizado (vista previa — la persistencia se implementará en Fase 3).');
  });

  /* ---------- RF-4: Eliminar gasto (modal de confirmación) ---------- */
  const deleteModalEl = document.getElementById('deleteModal');
  const deleteItemName = document.getElementById('deleteItemName');
  let deletingRow = null;

  deleteModalEl.addEventListener('show.bs.modal', (event) => {
    const triggerBtn = event.relatedTarget;
    deletingRow = triggerBtn ? triggerBtn.closest('tr') : null;
    deleteItemName.textContent = deletingRow ? `"${deletingRow.dataset.desc}"` : 'este gasto';
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (!deletingRow) return;
    deletingRow.remove();
    bootstrap.Modal.getInstance(deleteModalEl).hide();
    showFeedback('Gasto eliminado (vista previa — la persistencia se implementará en Fase 3).');
    if (document.querySelectorAll('#expenseTable tbody tr').length === 0 && emptyState) {
      emptyState.classList.remove('d-none');
    }
  });

  /* ---------- RF-1: Nuevo gasto (inserción visual en la tabla) ---------- */
  document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value || 0);
    const category = document.getElementById('expCategory').value;
    const dateVal = document.getElementById('expDate').value;

    if (!desc || !dateVal || amount <= 0) return;

    const [y, m, d] = dateVal.split('-');
    const tbody = document.querySelector('#expenseTable tbody');
    const newRow = document.createElement('tr');
    newRow.dataset.status = 'pendiente';
    newRow.dataset.desc = desc;
    newRow.dataset.amount = amount.toFixed(2);
    newRow.dataset.category = category;
    newRow.dataset.date = dateVal;

    newRow.innerHTML = `
      <td>${d}/${m}/${y}</td>
      <td>${desc}</td>
      <td class="d-none d-md-table-cell"><span class="badge ${CATEGORY_BADGE_CLASS[category]}">${CATEGORY_ICONS[category]} ${category}</span></td>
      <td class="fw-semibold">$${amount.toFixed(2)}</td>
      <td class="d-none d-sm-table-cell"><span class="badge bg-warning-subtle text-warning">Pendiente</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary ef-action-btn" data-bs-toggle="modal" data-bs-target="#editModal" title="Editar"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger ef-action-btn" data-bs-toggle="modal" data-bs-target="#deleteModal" title="Eliminar"><i class="bi bi-trash"></i></button>
      </td>
    `;

    tbody.prepend(newRow);
    if (emptyState) emptyState.classList.add('d-none');

    const activeFilter = document.querySelector('#statusFilter .active')?.dataset.filter || 'todas';
    if (activeFilter !== 'todas' && activeFilter !== 'pendiente') {
      newRow.classList.add('d-none');
    }

    e.target.reset();
    document.getElementById('expDate').value = '2026-09-08';
    showFeedback('Gasto agregado (vista previa — el guardado permanente llegará en Fase 3).');
  });

});
