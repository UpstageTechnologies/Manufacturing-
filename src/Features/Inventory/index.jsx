import { useState } from 'react';
import { FiArrowDown, FiBox, FiDownload, FiFilter, FiPlus, FiSearch, FiTrendingDown } from 'react-icons/fi';
import { formatCurrency, useERP } from '../../State/ERPContext';
import './Inventory.css';

const defaultStageForm = {
  stageName: '',
  description: '',
  workerType: '',
  quantity: '',
  unit: 'KG',
  status: 'Pending',
  image: '',
};

const MAX_PROGRESS_STEPS = 9;

function InventoryPage() {
  const {
    inventory,
    addInventory,
    updateInventory,
    deleteInventory,
    manufacturingStages,
    addManufacturingStage,
    updateManufacturingStage,
    deleteManufacturingStage,
  } = useERP();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ item: '', qty: '', price: '', category: 'Raw Materials' });

  const [stageQuery, setStageQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState(null);
  const [stageForm, setStageForm] = useState(defaultStageForm);

  const inventoryCards = [
    { title: 'Raw Materials', value: inventory.filter((item) => item.category === 'Raw Materials').length, icon: FiBox },
    { title: 'Products', value: inventory.filter((item) => item.category === 'Products').length, icon: FiBox },
    { title: 'Manufacturing', value: inventory.length ? '100%' : '0%', icon: FiTrendingDown },
    { title: 'Stock', value: inventory.reduce((total, item) => total + Number(item.qty), 0).toLocaleString('en-IN'), icon: FiDownload },
    { title: 'Low Stock', value: inventory.filter((item) => item.qty < 50).length, icon: FiFilter },
  ];

  const getStatus = (qty) => qty <= 20 ? { label: 'Critical', tone: 'danger' } : qty <= 80 ? { label: 'Low Stock', tone: 'warning' } : { label: 'In Stock', tone: 'good' };
  const visibleItems = inventory.filter((item) => item.item.toLowerCase().includes(query.toLowerCase())).filter((item) => filter === 'All' || getStatus(item.qty).label === filter);

  const stageSummary = {
    total: manufacturingStages.length,
    completed: manufacturingStages.filter((stage) => stage.status === 'Completed').length,
    inProgress: manufacturingStages.filter((stage) => stage.status === 'In Progress').length,
    pending: manufacturingStages.filter((stage) => stage.status === 'Pending').length,
  };

  const visibleStages = manufacturingStages
    .filter((stage) => {
      const haystack = `${stage.stageName} ${stage.description} ${stage.workerType}`.toLowerCase();
      return haystack.includes(stageQuery.toLowerCase());
    })
    .filter((stage) => stageFilter === 'All' || stage.status === stageFilter);
  const progressStages = visibleStages.slice(0, MAX_PROGRESS_STEPS);

  const openNew = () => { setEditingId(null); setForm({ item: '', qty: '', price: '', category: 'Raw Materials' }); setIsOpen(true); };
  const openEdit = (item) => { setEditingId(item.id); setForm({ item: item.item, qty: item.qty, price: item.price, category: item.category }); setIsOpen(true); };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.item.trim() || Number(form.qty) < 0 || Number(form.price) < 0) return;
    const record = { ...form, item: form.item.trim(), qty: Number(form.qty), price: Number(form.price) };
    if (editingId) updateInventory(editingId, record); else addInventory(record);
    setIsOpen(false);
  };

  const openStageNew = () => {
    setEditingStageId(null);
    setStageForm(defaultStageForm);
    setIsStageModalOpen(true);
  };

  const openStageEdit = (stage) => {
    setEditingStageId(stage.id);
    setStageForm({
      stageName: stage.stageName,
      description: stage.description,
      workerType: stage.workerType,
      quantity: stage.quantity ?? '',
      unit: stage.unit || 'KG',
      status: stage.status,
      image: stage.image || '',
    });
    setIsStageModalOpen(true);
  };

  const handleStageSubmit = (event) => {
    event.preventDefault();
    const trimmedName = stageForm.stageName.trim();
    const trimmedDescription = stageForm.description.trim();
    const trimmedWorker = stageForm.workerType.trim();
    const quantityValue = stageForm.quantity === '' ? 0 : Number(stageForm.quantity);

    if (!trimmedName || !trimmedDescription || !trimmedWorker || Number.isNaN(quantityValue) || quantityValue < 0) {
      return;
    }

    const record = {
      stageName: trimmedName,
      description: trimmedDescription,
      workerType: trimmedWorker,
      quantity: quantityValue,
      unit: stageForm.unit.trim() || 'Units',
      status: stageForm.status,
      image: stageForm.image.trim(),
    };

    if (editingStageId) {
      updateManufacturingStage(editingStageId, record);
    } else {
      addManufacturingStage(record);
    }

    setIsStageModalOpen(false);
    setStageForm(defaultStageForm);
    setEditingStageId(null);
  };

  const handleStageDelete = (id) => {
    if (window.confirm('Delete this manufacturing stage?')) {
      deleteManufacturingStage(id);
    }
  };

  const handleStageStatusChange = (id, nextStatus) => {
    updateManufacturingStage(id, { status: nextStatus });
  };

  const statusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Warehouse</p>
          <h1 className="page-title">Inventory</h1>
        </div>
        <button type="button" className="primary-button" onClick={openNew}>
          <FiPlus /> Add Item
        </button>
      </div>

      <div className="inventory-cards">
        {inventoryCards.map(({ title, value, icon: Icon }) => (
          <div key={title} className="inventory-card">
            <div className="inventory-card-icon">
              <Icon />
            </div>
            <div>
              <small>{title}</small>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="content-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <FiSearch />
            <input type="text" placeholder="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="secondary-button" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter inventory">
            <option>All</option><option>In Stock</option><option>Low Stock</option><option>Critical</option>
          </select>
        </div>

        <table className="erp-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => {
              const status = getStatus(item.qty);
              return <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.qty}</td>
                <td>{formatCurrency(item.price)}/unit</td>
                <td>
                  <span className={`status-badge ${status.tone}`}>{status.label}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="table-action" onClick={() => openEdit(item)}>Edit</button>
                    <button type="button" className="table-action danger" onClick={() => deleteInventory(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <section className="manufacturing-process">
        <div className="manufacturing-header">
          <div>
            <p className="eyebrow">Production Flow</p>
            <h2 className="page-title">Manufacturing Process</h2>
            <p className="subtitle">From Raw Timber to Packed Match Splints</p>
          </div>
          <button type="button" className="primary-button" onClick={openStageNew}>
            <FiPlus /> Add Process Stage
          </button>
        </div>

        <div className="process-summary">
          <div className="summary-card">
            <span>Total Stages</span>
            <strong>{stageSummary.total}</strong>
          </div>
          <div className="summary-card success">
            <span>Completed</span>
            <strong>{stageSummary.completed}</strong>
          </div>
          <div className="summary-card warning">
            <span>In Progress</span>
            <strong>{stageSummary.inProgress}</strong>
          </div>
          <div className="summary-card danger">
            <span>Pending</span>
            <strong>{stageSummary.pending}</strong>
          </div>
        </div>

        <div className="table-toolbar manufacturing-toolbar">
          <div className="search-box">
            <FiSearch />
            <input type="text" placeholder="Search stages..." value={stageQuery} onChange={(event) => setStageQuery(event.target.value)} />
          </div>
          <div className="process-filters">
            {['All', 'Completed', 'In Progress', 'Pending'].map((option) => (
              <button
                key={option}
                type="button"
                className={`filter-pill ${stageFilter === option ? 'active' : ''}`}
                onClick={() => setStageFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="process-flow">
          {progressStages.map((stage, index) => (
            <div key={stage.id} className="process-step-wrap">
              <div className="process-step-card">
                <div className="process-image-box">
                  {stage.image ? (
                    <img src={stage.image} alt={stage.stageName} />
                  ) : (
                    <div className="process-image-placeholder">
                      {stage.stageName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="process-step-content">
                  <div className="process-step-header">
                    <div>
                      <h3>{stage.stageName}</h3>
                      {stage.workerType && <span className="worker-type">{stage.workerType}</span>}
                    </div>
                    <span className={`status-badge ${statusClass(stage.status)}`}>{stage.status}</span>
                  </div>

                  <p className="process-description">{stage.description}</p>

                  <div className="process-quantity">
                    <span>{Number(stage.quantity) || 0}</span>
                    <small>{stage.unit || 'Units'}</small>
                  </div>

                  <div className="process-actions-row">
                    <select
                      className="status-select"
                      aria-label={`Update status for ${stage.stageName}`}
                      value={stage.status}
                      onChange={(event) => handleStageStatusChange(stage.id, event.target.value)}
                    >
                      <option>Completed</option>
                      <option>In Progress</option>
                      <option>Pending</option>
                    </select>

                    <div className="table-actions compact">
                      <button type="button" className="table-action" onClick={() => openStageEdit(stage)}>Edit</button>
                      <button type="button" className="table-action danger" onClick={() => handleStageDelete(stage.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>

              {index < progressStages.length - 1 && (
                <div className="process-arrow">
                  <FiArrowDown />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {isOpen && <div className="modal-overlay" onClick={() => setIsOpen(false)}>
        <div className="modal-card" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header"><h3>{editingId ? 'Edit Item' : 'Add Item'}</h3><button type="button" className="modal-close" onClick={() => setIsOpen(false)}>×</button></div>
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="field-group"><label>Item Name</label><input value={form.item} onChange={(event) => setForm({ ...form, item: event.target.value })} /></div>
            <div className="field-group"><label>Quantity</label><input type="number" min="0" value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></div>
            <div className="field-group"><label>Price</label><input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
            <div className="field-group"><label>Category</label><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Raw Materials</option><option>Products</option></select></div>
            <button type="submit" className="primary-button full-width">Save Item</button>
          </form>
        </div>
      </div>}

      {isStageModalOpen && <div className="modal-overlay" onClick={() => setIsStageModalOpen(false)}>
        <div className="modal-card manufacturing-stage-modal" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <h3>{editingStageId ? 'Edit Process Stage' : 'Add Process Stage'}</h3>
            <button type="button" className="modal-close" onClick={() => setIsStageModalOpen(false)}>×</button>
          </div>

          <form className="modal-form" onSubmit={handleStageSubmit}>
            <div className="field-group"><label>Stage Name</label><input value={stageForm.stageName} onChange={(event) => setStageForm({ ...stageForm, stageName: event.target.value })} /></div>
            <div className="field-group"><label>Description</label><textarea value={stageForm.description} rows="3" onChange={(event) => setStageForm({ ...stageForm, description: event.target.value })} /></div>
            <div className="field-group"><label>Worker Type</label><input value={stageForm.workerType} onChange={(event) => setStageForm({ ...stageForm, workerType: event.target.value })} /></div>
            <div className="field-grid-manufacturing">
              <div className="field-group"><label>Quantity</label><input type="number" min="0" value={stageForm.quantity} onChange={(event) => setStageForm({ ...stageForm, quantity: event.target.value })} /></div>
              <div className="field-group"><label>Unit</label><input value={stageForm.unit} onChange={(event) => setStageForm({ ...stageForm, unit: event.target.value })} /></div>
            </div>
            <div className="field-grid-manufacturing">
              <div className="field-group"><label>Status</label><select value={stageForm.status} onChange={(event) => setStageForm({ ...stageForm, status: event.target.value })}>
                <option>Completed</option><option>In Progress</option><option>Pending</option>
              </select></div>
              <div className="field-group"><label>Image URL</label><input value={stageForm.image} onChange={(event) => setStageForm({ ...stageForm, image: event.target.value })} placeholder="Optional image URL" /></div>
            </div>
            <button type="submit" className="primary-button full-width">Save Stage</button>
          </form>
        </div>
      </div>}
    </div>
  );
}

export default InventoryPage;
