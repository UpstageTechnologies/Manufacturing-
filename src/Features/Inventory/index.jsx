import { useEffect, useMemo, useState } from 'react';
import { FaRupeeSign } from 'react-icons/fa';
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowRight,
  FiBarChart2,
  FiBox,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDroplet,
  FiEdit2,
  FiFileText,
  FiGrid,
  FiLayers,
  FiPackage,
  FiPlus,
  FiPrinter,
  FiScissors,
  FiSettings,
  FiShoppingCart,
  FiTrash2,
  FiUsers,
  FiWind,
  FiX,
} from 'react-icons/fi';
import { formatDate, useERP } from '../../State/ERPContext';
import { getCurrentUser, recordOwnerActivity, ROLES } from '../../State/auth';
import './Inventory.css';

const STORAGE_KEY = 'manufacture-erp-inventory-workflow';
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const number = (value) => Number(value || 0);
const quantity = (value) => number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const money = (value) => `₹ ${number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const measure = (value, unit = 'KG') => `${quantity(value)} ${unit}`;
const measures = (records) => {
  const totals = records.reduce((groups, record) => groups.set(record.unit || 'units', (groups.get(record.unit || 'units') || 0) + number(record.quantity)), new Map());
  return [...totals].filter(([, amount]) => amount > 0).map(([unit, amount]) => measure(amount, unit)).join(' · ') || '0 units';
};
const emptyPurchase = () => ({
  supplier: '',
  material: '',
  quantity: '',
  unit: 'KG',
  amount: '',
  date: today(),
  invoiceNumber: '',
  billNumber: '',
  quality: '',
  notes: '',
});
const stageNames = [
  'Wood Cutting',
  'Bark / Skin Removing',
  'Sheet Cutting',
  'Alignment / Machine Processing',
  'Stick Cutting',
  'Chemical / Colour Process + Drying',
  'Size Sorting',
  'Packing',
];
const stageIcons = [FiScissors, FiLayers, FiGrid, FiSettings, FiScissors, FiDroplet, FiBarChart2, FiPackage];

function blankStages(inputQuantity) {
  return stageNames.map((name, index) => ({
    id: createId(),
    name,
    status: 'Pending',
    inputQty: number(inputQuantity),
    processedQty: 0,
    outputQty: 0,
    unit: 'KG',
    workers: [],
    material: '',
    output: '',
    labourCost: 0,
    machineCost: 0,
    otherCost: 0,
    machine: '',
    startDate: '',
    endDate: '',
    notes: '',
    index,
  }));
}

function createDemoWorkflow() {
  const mainStages = blankStages(5000).map((stage, index) => ({
    ...stage,
    status: index < 2 ? 'Completed' : index === 2 ? 'Active' : 'Pending',
    inputQty: [5000, 5000, 5000, 2800, 2800, 2800, 2800, 2800][index],
    processedQty: [5000, 5000, 2800, 0, 0, 0, 0, 0][index],
    outputQty: [5000, 4500, 2800, 0, 0, 0, 0, 0][index],
    labourCost: [0, 0, 0, 0, 0, 0, 0, 0][index],
    machineCost: [500, 500, 0, 0, 0, 0, 0, 0][index],
    otherCost: [200, 200, 0, 0, 0, 0, 0, 0][index],
    startDate: index < 3 ? '2026-09-28' : '',
    endDate: index < 2 ? '2026-09-29' : '',
    workers: index < 3 ? [{
      id: `wp001-worker-${index}`,
      employeeId: index === 1 ? 2 : 1,
      employeeName: index === 1 ? 'Theva' : 'Ram',
      hours: index === 2 ? 6 : 8,
      cost: index < 2 ? 1800 : 0,
    }] : [],
    index,
  }));
  const finishedStages = blankStages(3000).map((stage, index) => ({
    ...stage,
    status: 'Completed',
    inputQty: 3000,
    processedQty: 3000,
    outputQty: index === 7 ? 2000 : 3000,
    startDate: '2026-09-20',
    endDate: '2026-09-22',
    labourCost: index === 7 ? 0 : 350,
    machineCost: index === 7 ? 400 : 150,
    otherCost: index === 7 ? 100 : 0,
    sizeBreakdown: index === 6 ? [
      { label: 'Small', quantity: 800 },
      { label: 'Medium', quantity: 1200 },
      { label: 'Large', quantity: 700 },
      { label: 'Rejected / other', quantity: 300 },
    ] : undefined,
    workers: index === 7 ? [{
      id: 'wp002-worker-1',
      employeeId: 3,
      employeeName: 'Priya',
      hours: 7,
      cost: 1300,
    }] : [],
    index,
  }));

  return {
    purchases: [
      {
        id: 'demo-wp-001',
        number: 'WP-001',
        supplier: 'ABC Woods',
        material: 'Pine wood',
        quantity: 5000,
        unit: 'KG',
        amount: 100000,
        date: '2026-09-27',
        invoiceNumber: 'ABC-0927',
        billNumber: '',
        quality: 'Grade A softwood',
        notes: '',
        stages: mainStages,
        transfers: [],
      },
      {
        id: 'demo-wp-002',
        number: 'WP-002',
        supplier: 'Greenfield Timber',
        material: 'Poplar wood',
        quantity: 3000,
        unit: 'KG',
        amount: 54000,
        date: '2026-09-20',
        invoiceNumber: 'GFT-2084',
        billNumber: '',
        quality: 'Grade A',
        notes: '',
        stages: finishedStages,
        transfers: [
          {
            id: 'demo-transfer-1',
            stageId: finishedStages[7].id,
            product: 'Matchstick Type A',
            variant: 'Standard',
            size: 'Medium',
            color: 'Natural',
            packaging: 'Retail box',
            unit: 'Boxes',
            quantity: 1200,
            available: 1200,
            unitCost: 0.45,
            ready: true,
            readyDate: '2026-09-23',
          },
          {
            id: 'demo-transfer-2',
            stageId: finishedStages[7].id,
            product: 'Matchstick Type B',
            variant: 'Long burn',
            size: 'Large',
            color: 'Red',
            packaging: 'Retail box',
            unit: 'Boxes',
            quantity: 500,
            available: 500,
            unitCost: 0.6,
            ready: true,
            readyDate: '2026-09-23',
          },
        ],
      },
    ],
    sales: [],
    bills: [],
  };
}

function normalisePurchase(purchase, index) {
  const stages = (Array.isArray(purchase.stages) ? purchase.stages : []).map((stage, stageIndex) => ({
    ...stage,
    id: stage.id || createId(),
    name: stage.name || stage.stageName || `Stage ${stageIndex + 1}`,
    status: stage.status === 'In Progress' ? 'Active' : stage.status || 'Pending',
    inputQty: number(stage.inputQty ?? purchase.quantity),
    processedQty: number(stage.processedQty ?? stage.quantity),
    outputQty: number(stage.outputQty ?? stage.quantity),
    unit: stage.unit || purchase.unit || 'KG',
    material: stage.material || '',
    output: stage.output || '',
    workers: (stage.workers || []).map((worker) => ({
      ...worker,
      id: worker.id || createId(),
      employeeName: worker.employeeName || worker.employee || 'Employee',
      hours: number(worker.hours),
      cost: number(worker.cost),
    })),
    labourCost: number(stage.labourCost),
    machineCost: number(stage.machineCost),
    otherCost: number(stage.otherCost),
  }));
  return {
    ...purchase,
    id: purchase.id || createId(),
    number: purchase.number || `WP-${String(index + 1).padStart(3, '0')}`,
    quantity: number(purchase.quantity),
    amount: number(purchase.amount),
    unit: purchase.unit || 'KG',
    stages,
    transfers: Array.isArray(purchase.transfers) ? purchase.transfers.map((transfer) => ({
      ...transfer,
      id: transfer.id || createId(),
      stageId: transfer.stageId || stages.at(-1)?.id,
      quantity: number(transfer.quantity),
      available: number(transfer.available ?? transfer.quantity),
      unitCost: transfer.unitCost == null || transfer.unitCost === '' ? null : number(transfer.unitCost),
      ready: Boolean(transfer.ready),
      variant: transfer.variant || '',
      size: transfer.size || '',
      color: transfer.color || '',
      packaging: transfer.packaging || '',
    })) : [],
  };
}

function loadWorkflow() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createDemoWorkflow();
    const parsed = JSON.parse(saved);
    const hasWorkflowData = Boolean(
      parsed?.purchases?.length || parsed?.sales?.length || parsed?.bills?.length,
    );
    if (!hasWorkflowData) return createDemoWorkflow();
    return {
      purchases: (Array.isArray(parsed?.purchases) ? parsed.purchases : []).map(normalisePurchase),
      sales: Array.isArray(parsed?.sales) ? parsed.sales : [],
      bills: Array.isArray(parsed?.bills) ? parsed.bills : [],
    };
  } catch (error) {
    console.error('Unable to load saved inventory workflow.', error);
    return createDemoWorkflow();
  }
}

function stageSummary(purchase) {
  const stages = purchase.stages || [];
  const active = stages.find((stage) => stage.status === 'Active');
  const next = stages.find((stage) => stage.status === 'Pending');
  const current = active || next;
  const stageProgress = current?.status === 'Active' && current.inputQty > 0
    ? Math.min(100, Math.round(current.processedQty * 100 / current.inputQty))
    : 0;
  const complete = stages.filter((stage) => stage.status === 'Completed').length;
  const percent = active ? stageProgress : stages.length ? Math.round(complete * 100 / stages.length) : 0;
  const processed = active ? active.processedQty : complete ? stages.filter((stage) => stage.status === 'Completed').at(-1)?.outputQty || 0 : 0;
  const remaining = active ? Math.max(0, active.inputQty - active.processedQty) : Math.max(0, purchase.quantity - processed);
  return {
    active,
    complete,
    percent,
    current: current?.name || (stages.length ? 'Production complete' : 'Production not started'),
    processed,
    remaining,
  };
}

function totalProductionCost(purchase) {
  return number(purchase.amount) + purchase.stages.reduce((sum, stage) => (
    sum + number(stage.labourCost) + number(stage.machineCost) + number(stage.otherCost)
      + stage.workers.reduce((workerSum, worker) => workerSum + number(worker.cost), 0)
  ), 0);
}

function IconButton({ label, children, onClick, danger = false, disabled = false }) {
  return (
    <button type="button" className={`inv-icon-button${danger ? ' is-danger' : ''}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Modal({ title, close, children, wide = false }) {
  return (
    <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className={`inv-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="inv-modal-header">
          <div><span className="inv-overline">INVENTORY WORKSPACE</span><h2>{title}</h2></div>
          <IconButton label="Close dialog" onClick={close}><FiX /></IconButton>
        </header>
        {children}
      </section>
    </div>
  );
}

function FormActions({ close, label }) {
  return (
    <div className="inv-form-actions">
      <button type="button" className="inv-button is-light" onClick={close}>Cancel</button>
      <button type="submit" className="inv-button is-primary">{label}</button>
    </div>
  );
}

function PurchaseForm({ save, close }) {
  const [form, setForm] = useState(emptyPurchase);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    save({ ...form, quantity: number(form.quantity), amount: number(form.amount) });
  };
  return (
    <Modal title="Record a new purchase" close={close}>
      <form className="inv-form" onSubmit={submit}>
        <div className="inv-form-grid">
          <label>Supplier name<input name="supplier" value={form.supplier} onChange={change} required /></label>
          <label>Material / product<input name="material" value={form.material} onChange={change} required /></label>
          <label>Purchased quantity<input name="quantity" type="number" min="0.01" step="any" value={form.quantity} onChange={change} required /></label>
          <label>Unit<input name="unit" value={form.unit} onChange={change} placeholder="KG, boxes, pieces" required /></label>
          <label>Purchase amount (₹)<input name="amount" type="number" min="0" step="any" value={form.amount} onChange={change} required /></label>
          <label>Purchase date<input name="date" type="date" value={form.date} onChange={change} required /></label>
          <label>Invoice number <span className="inv-optional">Optional</span><input name="invoiceNumber" value={form.invoiceNumber} onChange={change} /></label>
          <label>Bill number <span className="inv-optional">Optional</span><input name="billNumber" value={form.billNumber} onChange={change} /></label>
          <label>Quality<input name="quality" value={form.quality} onChange={change} placeholder="Grade or material quality" /></label>
          <label className="inv-field-wide">Notes<textarea name="notes" rows="3" value={form.notes} onChange={change} /></label>
        </div>
        <FormActions close={close} label="Save purchase" />
      </form>
    </Modal>
  );
}

function StageForm({ stage, employees, allocatedQuantity, allocatedUnit, save, close }) {
  const [form, setForm] = useState(stage);
  const [error, setError] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateWorker = (workerId, field, value) => setForm((current) => ({
    ...current,
    workers: current.workers.map((worker) => worker.id === workerId ? { ...worker, [field]: value } : worker),
  }));
  const submit = (event) => {
    event.preventDefault();
    if (number(form.processedQty) > number(form.inputQty)) {
      setError('Processed quantity cannot exceed the input quantity.');
      return;
    }
    if (number(form.outputQty) > number(form.processedQty)) {
      setError('Output quantity cannot exceed the processed quantity.');
      return;
    }
    if (number(form.outputQty) < allocatedQuantity) {
      setError(`Output quantity cannot be lower than the ${measure(allocatedQuantity, allocatedUnit)} already split from this stage.`);
      return;
    }
    if (allocatedQuantity > 0 && form.unit !== allocatedUnit) {
      setError('The stage unit cannot change while output has already been split.');
      return;
    }
    const workers = form.workers.filter((worker) => worker.employeeId).map((worker) => ({
      ...worker,
      employeeName: employees.find((employee) => String(employee.id) === String(worker.employeeId))?.name || worker.employeeName,
      hours: number(worker.hours),
      cost: number(worker.cost),
    }));
    save({
      ...form,
      inputQty: number(form.inputQty),
      processedQty: number(form.processedQty),
      outputQty: number(form.outputQty),
      labourCost: number(form.labourCost),
      machineCost: number(form.machineCost),
      otherCost: number(form.otherCost),
      workers,
    });
  };
  const addWorker = () => update('workers', [...form.workers, { id: createId(), employeeId: '', employeeName: '', hours: '', cost: '' }]);
  return (
    <Modal title={stage.id ? `Stage: ${stage.name}` : 'Add production stage'} close={close} wide>
      <form className="inv-form" onSubmit={submit}>
        <div className="inv-form-grid">
          <label>Stage name<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
          <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Pending</option><option>Active</option><option>Completed</option></select></label>
          <label>Input quantity<input type="number" min="0" step="any" value={form.inputQty} onChange={(event) => update('inputQty', event.target.value)} /></label>
          <label>Processed quantity<input type="number" min="0" max={form.inputQty} step="any" value={form.processedQty} onChange={(event) => update('processedQty', event.target.value)} /></label>
          <label>Output quantity<input type="number" min="0" max={form.processedQty} step="any" value={form.outputQty} onChange={(event) => update('outputQty', event.target.value)} /></label>
          <label>Unit<input value={form.unit} onChange={(event) => update('unit', event.target.value)} required /></label>
          <label>Material used<input value={form.material || ''} onChange={(event) => update('material', event.target.value)} placeholder="Optional" /></label>
          <label>Output / result<input value={form.output || ''} onChange={(event) => update('output', event.target.value)} placeholder="Optional" /></label>
          <label>Machine<input value={form.machine || ''} onChange={(event) => update('machine', event.target.value)} placeholder="Optional" /></label>
          <label>Started<input type="date" value={form.startDate || ''} onChange={(event) => update('startDate', event.target.value)} /></label>
          <label>Completed<input type="date" value={form.endDate || ''} onChange={(event) => update('endDate', event.target.value)} /></label>
          <label className="inv-field-wide">Notes<textarea rows="3" value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} /></label>
        </div>

        <section className="inv-form-section">
          <div className="inv-subsection-heading"><div><h3>Stage costs</h3><p>Record only the costs that apply to this step.</p></div></div>
          <div className="inv-form-grid inv-cost-grid">
            <label>Labour (₹)<input type="number" min="0" step="any" value={form.labourCost} onChange={(event) => update('labourCost', event.target.value)} /></label>
            <label>Machine (₹)<input type="number" min="0" step="any" value={form.machineCost} onChange={(event) => update('machineCost', event.target.value)} /></label>
            <label>Other (₹)<input type="number" min="0" step="any" value={form.otherCost} onChange={(event) => update('otherCost', event.target.value)} /></label>
          </div>
        </section>

        <section className="inv-form-section">
          <div className="inv-subsection-heading">
            <div><h3>Workers on this stage</h3><p>Workers are selected from your existing employee records.</p></div>
            <button type="button" className="inv-button is-light inv-button-small" onClick={addWorker}><FiPlus /> Add worker</button>
          </div>
          {form.workers.map((worker) => {
            const employee = employees.find((item) => String(item.id) === String(worker.employeeId));
            return (
              <div className="inv-worker-edit" key={worker.id}>
                <label>Employee<select value={worker.employeeId} onChange={(event) => updateWorker(worker.id, 'employeeId', event.target.value)}><option value="">Select employee</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label>Hours worked<input type="number" min="0" step="any" value={worker.hours} onChange={(event) => updateWorker(worker.id, 'hours', event.target.value)} /></label>
                <label>Labour cost (₹)<input type="number" min="0" step="any" value={worker.cost} onChange={(event) => updateWorker(worker.id, 'cost', event.target.value)} /></label>
                <IconButton label="Remove worker" danger onClick={() => update('workers', form.workers.filter((item) => item.id !== worker.id))}><FiTrash2 /></IconButton>
                {employee && <small className="inv-worker-link">Linked employee · {employee.salaryPeriod || 'Monthly'} salary {money(employee.salary)}</small>}
              </div>
            );
          })}
        </section>
        {error && <p className="inv-form-error" role="alert">{error}</p>}
        <FormActions close={close} label="Save stage" />
      </form>
    </Modal>
  );
}

function StageDetail({ purchase, stage, employees, attendance, close, edit, addWorker, remove }) {
  const stageWorkers = stage.workers || [];
  const totalCost = number(stage.labourCost) + number(stage.machineCost) + number(stage.otherCost)
    + stageWorkers.reduce((sum, worker) => sum + number(worker.cost), 0);
  return (
    <Modal title={stage.name} close={close} wide>
      <div className="inv-stage-detail">
        <div className="inv-stage-detail-intro">
          <span className={`inv-status is-${stage.status.toLowerCase()}`}>{stage.status === 'Active' ? 'In progress' : stage.status}</span>
          <p>Step in <strong>{purchase.material} · Purchase {purchase.number}</strong></p>
        </div>
        <div className="inv-quantity-grid">
          <div><span>Input</span><strong>{measure(stage.inputQty, stage.unit)}</strong></div>
          <div><span>Processed</span><strong>{measure(stage.processedQty, stage.unit)}</strong></div>
          <div><span>Output</span><strong>{measure(stage.outputQty, stage.unit)}</strong></div>
          <div><span>Unprocessed</span><strong>{measure(Math.max(0, stage.inputQty - stage.processedQty), stage.unit)}</strong></div>
        </div>
        <div className="inv-stage-meta-grid">
          <div><FiCalendar /><span>Started<strong>{stage.startDate ? formatDate(stage.startDate) : 'Not recorded'}</strong></span></div>
          <div><FiCheckCircle /><span>Completed<strong>{stage.endDate ? formatDate(stage.endDate) : 'Not completed'}</strong></span></div>
          <div><FiClock /><span>Working time<strong>{quantity(stageWorkers.reduce((sum, worker) => sum + number(worker.hours), 0))} hours</strong></span></div>
          <div><FiSettings /><span>Machine<strong>{stage.machine || 'Not specified'}</strong></span></div>
        </div>
        {(stage.material || stage.output) && <div className="inv-stage-material-output">
          {stage.material && <div><span>Material / input</span><strong>{stage.material}</strong></div>}
          {stage.output && <div><span>Output / result</span><strong>{stage.output}</strong></div>}
        </div>}
        <div className="inv-cost-summary">
          <div><span>Labour</span><strong>{money(stage.labourCost + stageWorkers.reduce((sum, worker) => sum + number(worker.cost), 0))}</strong></div>
          <div><span>Machine</span><strong>{money(stage.machineCost)}</strong></div>
          <div><span>Other</span><strong>{money(stage.otherCost)}</strong></div>
          <div className="is-total"><span>Total stage cost</span><strong>{money(totalCost)}</strong></div>
        </div>
        {stageWorkers.length > 0 && (
          <section className="inv-worker-list">
            <div className="inv-subsection-heading"><div><h3>Workers on this stage</h3><p>These records are linked to your Employee and Attendance modules.</p></div></div>
            {stageWorkers.map((worker) => {
              const employee = employees.find((item) => String(item.id) === String(worker.employeeId));
              const attendanceStatus = attendance?.[today()]?.[worker.employeeId] || 'Not marked today';
              return (
                <div className="inv-worker-card" key={worker.id}>
                  <div className="inv-worker-avatar">{worker.employeeName?.slice(0, 1).toUpperCase() || 'W'}</div>
                  <div className="inv-worker-identity"><strong>{worker.employeeName}</strong><span>{attendanceStatus} · {employee ? `${employee.salaryPeriod || 'Monthly'} salary ${money(employee.salary)}` : 'Employee record unavailable'}</span></div>
                  <div><span>Hours</span><strong>{quantity(worker.hours)} h</strong></div>
                  <div><span>Stage labour</span><strong>{money(worker.cost)}</strong></div>
                </div>
              );
            })}
          </section>
        )}
        {stage.notes && <div className="inv-stage-note"><span>Stage note</span><p>{stage.notes}</p></div>}
        <div className="inv-detail-actions">
          <button type="button" className="inv-button is-light" onClick={addWorker}><FiUsers /> Add worker</button>
          <button type="button" className="inv-button is-light" onClick={edit}><FiEdit2 /> Edit stage</button>
          <button type="button" className="inv-button is-light" onClick={edit}><FaRupeeSign /> Add cost</button>
          <button type="button" className="inv-button is-light" onClick={edit}><FiFileText /> Add note</button>
          <button type="button" className="inv-button is-danger-light" onClick={remove}><FiTrash2 /> Delete stage</button>
        </div>
      </div>
    </Modal>
  );
}

function TransferForm({ purchase, stage, alreadyAllocated, save, close }) {
  const [form, setForm] = useState({ product: '', variant: '', size: '', color: '', packaging: '', quantity: '', unitCost: '' });
  const [error, setError] = useState('');
  const available = Math.max(0, number(stage.outputQty) - alreadyAllocated);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const remaining = Math.max(0, available - number(form.quantity));
  const submit = (event) => {
    event.preventDefault();
    const value = number(form.quantity);
    if (!form.product.trim() || value <= 0 || value > available) {
      setError(value > available ? 'The split cannot exceed the unallocated stage output.' : 'Enter a product and a quantity greater than zero.');
      return;
    }
    save({
      ...form,
      id: createId(),
      stageId: stage.id,
      quantity: value,
      available: value,
      unitCost: form.unitCost === '' ? null : number(form.unitCost),
      unit: stage.unit || purchase.unit,
      ready: false,
      readyDate: '',
    });
  };
  return (
    <Modal title="Split stage output" close={close}>
      <form className="inv-form" onSubmit={submit}>
        <div className="inv-transfer-available"><FiArrowDownRight /><span>Unallocated output<strong>{measure(available, stage.unit)}</strong></span></div>
        <div className="inv-form-grid">
          <label>Product / destination<input name="product" value={form.product} onChange={change} placeholder="e.g. Matchstick Type A" required /></label>
          <label>Variant<input name="variant" value={form.variant} onChange={change} placeholder="Variety or type" /></label>
          <label>Size<input name="size" value={form.size} onChange={change} placeholder="Small, medium, large" /></label>
          <label>Color<input name="color" value={form.color} onChange={change} placeholder="Optional" /></label>
          <label>Packaging<input name="packaging" value={form.packaging} onChange={change} placeholder="Retail box, bulk pack…" /></label>
          <label>Quantity ({stage.unit})<input name="quantity" type="number" min="0.01" max={available} step="any" value={form.quantity} onChange={change} required /></label>
          <label>Production cost per unit (₹) <span className="inv-optional">Optional</span><input name="unitCost" type="number" min="0" step="any" value={form.unitCost} onChange={change} /></label>
        </div>
        <p className="inv-field-hint">{measure(remaining, stage.unit)} remains unallocated after this split.</p>
        {error && <p className="inv-form-error" role="alert">{error}</p>}
        <FormActions close={close} label="Confirm split" />
      </form>
    </Modal>
  );
}

function SortingDistribution({ distribution, unit }) {
  const total = distribution.reduce((sum, item) => sum + number(item.quantity), 0);
  return (
    <div className="inv-sort-distribution">
      <div className="inv-sort-heading"><span>SIZE SORTING OUTPUT</span><strong>Total · {measure(total, unit)}</strong></div>
      {distribution.map((item) => {
        const percent = total ? Math.round(number(item.quantity) * 100 / total) : 0;
        return (
          <div className="inv-sort-row" key={item.label}>
            <span>{item.label}</span>
            <div className="inv-sort-bar"><span className={item.label.toLowerCase().includes('reject') ? 'is-rejected' : ''} style={{ width: `${percent}%` }} /></div>
            <strong>{measure(item.quantity, unit)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function PurchaseDetails({ purchase, employees, attendance, update, close }) {
  const [stageForm, setStageForm] = useState(null);
  const [detailStageId, setDetailStageId] = useState(null);
  const [transferStageId, setTransferStageId] = useState(null);
  const summary = stageSummary(purchase);
  const detailStage = purchase.stages.find((stage) => stage.id === detailStageId);
  const transferStage = purchase.stages.find((stage) => stage.id === transferStageId);
  const currentStockValue = purchase.transfers.every((transfer) => transfer.unitCost != null)
    ? money(purchase.transfers.reduce((sum, transfer) => sum + transfer.unitCost * transfer.available, 0))
    : 'Unit cost not set';
  const finishedStock = measures(purchase.transfers.map((transfer) => ({ quantity: transfer.quantity, unit: transfer.unit })));
  const soldQuantity = measures(purchase.transfers.map((transfer) => ({ quantity: transfer.quantity - transfer.available, unit: transfer.unit })));
  const availableStock = measures(purchase.transfers.map((transfer) => ({ quantity: transfer.available, unit: transfer.unit })));
  const allocatedForStage = (stageId) => purchase.transfers
    .filter((transfer) => transfer.stageId === stageId)
    .reduce((sum, transfer) => sum + number(transfer.quantity), 0);
  const saveStage = (nextStage) => {
    let stages = nextStage.id
      ? purchase.stages.map((stage) => stage.id === nextStage.id ? nextStage : stage)
      : [...purchase.stages, { ...nextStage, id: createId(), index: purchase.stages.length }];
    if (nextStage.status === 'Active') stages = stages.map((stage) => stage.id !== nextStage.id && stage.status === 'Active' ? { ...stage, status: 'Pending' } : stage);
    update({ ...purchase, stages });
    setStageForm(null);
    setDetailStageId(null);
  };
  const setStatus = (stageId, status) => {
    const stages = purchase.stages.map((stage) => ({
      ...stage,
      status: stage.id === stageId ? status : status === 'Active' && stage.status === 'Active' ? 'Pending' : stage.status,
    }));
    update({ ...purchase, stages });
  };
  const moveStage = (stageId, direction) => {
    const from = purchase.stages.findIndex((stage) => stage.id === stageId);
    const to = from + direction;
    if (to < 0 || to >= purchase.stages.length) return;
    const stages = [...purchase.stages];
    [stages[from], stages[to]] = [stages[to], stages[from]];
    update({ ...purchase, stages: stages.map((stage, index) => ({ ...stage, index })) });
  };
  const removeStage = (stage) => {
    const hasOutputs = purchase.transfers.some((transfer) => transfer.stageId === stage.id);
    const warning = hasOutputs ? ' Its split outputs will also be removed.' : '';
    if (!window.confirm(`Delete the "${stage.name}" stage?${warning}`)) return;
    update({
      ...purchase,
      stages: purchase.stages.filter((item) => item.id !== stage.id),
      transfers: purchase.transfers.filter((transfer) => transfer.stageId !== stage.id),
    });
    setDetailStageId(null);
  };
  const startProduction = () => {
    const first = purchase.stages[0];
    if (!first) return;
    setStatus(first.id, 'Active');
  };
  return (
    <div className="inv-detail-page">
      <div className="inv-detail-toolbar">
        <button type="button" className="inv-back-button" onClick={close}><FiChevronLeft /> All production</button>
        <div className="inv-detail-actions">
          {!purchase.stages.some((stage) => stage.status === 'Active') && purchase.stages.some((stage) => stage.status === 'Pending') && (
            <button type="button" className="inv-button is-primary" onClick={startProduction}><FiActivity /> Start production</button>
          )}
          <button type="button" className="inv-button is-light" onClick={() => setStageForm({
            id: '',
            name: '',
            status: purchase.stages.some((stage) => stage.status === 'Active') ? 'Pending' : 'Active',
            inputQty: purchase.quantity,
            processedQty: 0,
            outputQty: 0,
            unit: purchase.unit,
            material: '',
            output: '',
            workers: [],
            labourCost: 0,
            machineCost: 0,
            otherCost: 0,
            machine: '',
            startDate: '',
            endDate: '',
            notes: '',
          })}><FiPlus /> Add stage</button>
        </div>
      </div>

      <section className="inv-production-banner">
        <div className="inv-banner-copy">
          <span className="inv-overline">PRODUCTION JOURNEY · {purchase.number}</span>
          <h1>{purchase.material}</h1>
          <p>{purchase.supplier} <span>·</span> Purchased {formatDate(purchase.date)}</p>
          <div className="inv-banner-value"><strong>{measure(purchase.quantity, purchase.unit)}</strong><span>purchased</span><i /><strong>{money(purchase.amount)}</strong><span>purchase value</span></div>
        </div>
        <div className="inv-banner-progress">
          <div className="inv-progress-circle" style={{ '--progress': `${summary.percent}%` }}><strong>{summary.percent}%</strong></div>
          <span>Current stage progress</span>
        </div>
      </section>

      <div className="inv-detail-kpis">
        <div><span>Current stage</span><strong>{summary.current}</strong></div>
        <div><span>Processed</span><strong>{measure(summary.processed, summary.active?.unit || purchase.unit)}</strong></div>
        <div><span>Remaining in stage</span><strong>{measure(summary.remaining, summary.active?.unit || purchase.unit)}</strong></div>
        <div><span>Total production cost</span><strong>{money(totalProductionCost(purchase))}</strong></div>
      </div>

      <section className="inv-panel inv-timeline-panel">
        <div className="inv-section-heading">
          <div><span className="inv-overline">MATERIAL TO FINISHED GOODS</span><h2>Production timeline</h2><p>{summary.complete} stages complete · {purchase.stages.filter((stage) => stage.status === 'Pending').length} pending</p></div>
          <span className="inv-total-stage-count">{purchase.stages.length} stages</span>
        </div>
        <div className="inv-timeline">
          <article className="inv-purchase-milestone">
            <div className="inv-timeline-marker is-purchase"><FiShoppingCart /></div>
            <div className="inv-timeline-line-copy"><span className="inv-stage-index">PURCHASE SOURCE</span><h3>{purchase.material}</h3><p>{measure(purchase.quantity, purchase.unit)} · {money(purchase.amount)} · {purchase.supplier}</p></div>
          </article>
          {purchase.stages.map((stage, index) => {
            const StageIcon = stageIcons[index % stageIcons.length];
            const stagePercent = stage.inputQty ? Math.min(100, Math.round(stage.processedQty * 100 / stage.inputQty)) : 0;
            const allocated = allocatedForStage(stage.id);
            const workerHours = stage.workers.reduce((sum, worker) => sum + number(worker.hours), 0);
            const stageCost = number(stage.labourCost) + number(stage.machineCost) + number(stage.otherCost)
              + stage.workers.reduce((sum, worker) => sum + number(worker.cost), 0);
            return (
              <article className={`inv-stage-card is-${stage.status.toLowerCase()}`} key={stage.id}>
                <div className={`inv-timeline-marker is-${stage.status.toLowerCase()}`}>{stage.status === 'Completed' ? <FiCheck /> : <StageIcon />}</div>
                <div className="inv-stage-card-body">
                  <div className="inv-stage-card-heading">
                    <button type="button" className="inv-stage-open" onClick={() => setDetailStageId(stage.id)}>
                      <span className="inv-stage-index">STEP {String(index + 1).padStart(2, '0')}</span><h3>{stage.name}</h3>
                    </button>
                    <span className={`inv-status is-${stage.status.toLowerCase()}`}>{stage.status === 'Active' ? 'In progress' : stage.status}</span>
                    <div className="inv-stage-actions">
                      <IconButton label="Move stage earlier" disabled={index === 0} onClick={() => moveStage(stage.id, -1)}><FiChevronDown className="inv-icon-up" /></IconButton>
                      <IconButton label="Move stage later" disabled={index === purchase.stages.length - 1} onClick={() => moveStage(stage.id, 1)}><FiChevronDown /></IconButton>
                      <IconButton label={`Edit ${stage.name}`} onClick={() => setStageForm(stage)}><FiEdit2 /></IconButton>
                      <IconButton label={`Delete ${stage.name}`} danger onClick={() => removeStage(stage)}><FiTrash2 /></IconButton>
                    </div>
                  </div>
                  <div className="inv-stage-description">
                    <div className="inv-stage-progress"><div><span>Processing progress</span><strong>{stagePercent}%</strong></div><div className="inv-progress-track"><span style={{ width: `${stagePercent}%` }} /></div></div>
                    <div className="inv-stage-facts">
                      <span>Input<strong>{measure(stage.inputQty, stage.unit)}</strong></span>
                      <span>Processed<strong>{measure(stage.processedQty, stage.unit)}</strong></span>
                      <span>Output<strong>{measure(stage.outputQty, stage.unit)}</strong></span>
                      <span>Workers<strong><FiUsers /> {stage.workers.length}</strong></span>
                      <span>Time<strong><FiClock /> {quantity(workerHours)} hrs</strong></span>
                      <span>Stage cost<strong>{money(stageCost)}</strong></span>
                    </div>
                  </div>
                  {stage.machine && <p className="inv-stage-machine"><FiSettings /> {stage.machine}</p>}
                  {stage.material && <p className="inv-stage-machine"><FiLayers /> Material: {stage.material}</p>}
                  {stage.output && <p className="inv-stage-machine"><FiBox /> Output: {stage.output}</p>}
                  {stage.notes && <p className="inv-stage-card-note">{stage.notes}</p>}
                  {stage.name.toLowerCase().includes('sort') && stage.sizeBreakdown?.length > 0 && <SortingDistribution distribution={stage.sizeBreakdown} unit={stage.unit} />}
                  <div className="inv-stage-footer">
                    <label className="inv-status-select">Update status<select aria-label={`Status for ${stage.name}`} value={stage.status} onChange={(event) => setStatus(stage.id, event.target.value)}><option>Pending</option><option>Active</option><option>Completed</option></select><FiChevronDown /></label>
                    <button type="button" className="inv-text-button" onClick={() => setDetailStageId(stage.id)}>Stage details <FiArrowRight /></button>
                    <button type="button" className="inv-text-button" onClick={() => setTransferStageId(stage.id)} disabled={number(stage.outputQty) <= allocated}><FiArrowDownRight /> Split output</button>
                  </div>
                  {purchase.transfers.some((transfer) => transfer.stageId === stage.id) && (
                    <div className="inv-stage-branches">
                      <span className="inv-branch-label"><FiArrowDownRight /> OUTPUT BRANCHES</span>
                      {purchase.transfers.filter((transfer) => transfer.stageId === stage.id).map((transfer) => (
                        <div className="inv-branch-card" key={transfer.id}>
                          <div className="inv-branch-node" />
                          <div className="inv-stock-mark"><FiBox /></div>
                          <div className="inv-branch-info"><strong>{transfer.product}</strong><span>{[transfer.variant, transfer.size, transfer.color, transfer.packaging].filter(Boolean).join(' · ') || 'Production output'}</span></div>
                          <strong className="inv-branch-quantity">{measure(transfer.quantity, transfer.unit)}</strong>
                          <span className={`inv-stock-pill${transfer.ready ? ' is-ready' : ''}`}>{transfer.ready ? 'Ready for sale' : 'In production'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="inv-detail-bottom-grid">
        <section className="inv-panel">
          <div className="inv-section-heading"><div><span className="inv-overline">PURCHASE RECORD</span><h2>Source details</h2></div></div>
          <dl className="inv-info-list">
            <div><dt>Supplier</dt><dd>{purchase.supplier}</dd></div>
            <div><dt>Material / product</dt><dd>{purchase.material}</dd></div>
            <div><dt>Purchased</dt><dd>{measure(purchase.quantity, purchase.unit)}</dd></div>
            <div><dt>Purchase value</dt><dd>{money(purchase.amount)}</dd></div>
            <div><dt>Invoice number</dt><dd>{purchase.invoiceNumber || 'Not provided'}</dd></div>
            <div><dt>Bill number</dt><dd>{purchase.billNumber || 'Not provided'}</dd></div>
            {purchase.quality && <div><dt>Quality</dt><dd>{purchase.quality}</dd></div>}
            {purchase.notes && <div className="inv-info-full"><dt>Notes</dt><dd>{purchase.notes}</dd></div>}
          </dl>
        </section>
        <section className="inv-panel">
          <div className="inv-section-heading"><div><span className="inv-overline">COST & OUTPUT</span><h2>Production summary</h2></div></div>
          <div className="inv-summary-list">
            <div><span>Purchase value</span><strong>{money(purchase.amount)}</strong></div>
            <div><span>Production cost</span><strong>{money(totalProductionCost(purchase) - number(purchase.amount))}</strong></div>
            <div><span>Total production cost</span><strong>{money(totalProductionCost(purchase))}</strong></div>
            <div><span>Current stock value</span><strong>{currentStockValue}</strong></div>
            <div><span>Finished stock</span><strong>{finishedStock}</strong></div>
            <div><span>Sold quantity</span><strong>{soldQuantity}</strong></div>
            <div><span>Remaining production</span><strong>{measure(summary.remaining, summary.active?.unit || purchase.unit)}</strong></div>
            <div><span>Available stock</span><strong>{availableStock}</strong></div>
          </div>
          <button type="button" className="inv-button is-light inv-summary-split-button" onClick={() => setTransferStageId(summary.active?.id || purchase.stages.at(-1)?.id)} disabled={!summary.active && !purchase.stages.length}><FiArrowDownRight /> Split / transfer output</button>
        </section>
      </div>

      {stageForm && <StageForm
        stage={stageForm}
        employees={employees}
        allocatedQuantity={stageForm.id ? allocatedForStage(stageForm.id) : 0}
        allocatedUnit={purchase.transfers.find((transfer) => transfer.stageId === stageForm.id)?.unit || stageForm.unit}
        save={saveStage}
        close={() => setStageForm(null)}
      />}
      {detailStage && (
        <StageDetail
          purchase={purchase}
          stage={detailStage}
          employees={employees}
          attendance={attendance}
          close={() => setDetailStageId(null)}
          edit={() => { setStageForm(detailStage); setDetailStageId(null); }}
          addWorker={() => {
            setStageForm({ ...detailStage, workers: [...detailStage.workers, { id: createId(), employeeId: '', employeeName: '', hours: '', cost: '' }] });
            setDetailStageId(null);
          }}
          remove={() => removeStage(detailStage)}
        />
      )}
      {transferStage && <TransferForm purchase={purchase} stage={transferStage} alreadyAllocated={allocatedForStage(transferStage.id)} save={(transfer) => {
        update({ ...purchase, transfers: [...purchase.transfers, transfer] });
        setTransferStageId(null);
      }} close={() => setTransferStageId(null)} />}
    </div>
  );
}

function PurchaseCard({ purchase, open }) {
  const summary = stageSummary(purchase);
  const currentStage = summary.active || purchase.stages.find((stage) => stage.status === 'Pending');
  const workerNames = currentStage?.workers.map((worker) => worker.employeeName).filter(Boolean) || [];
  const stageProgress = currentStage?.inputQty
    ? Math.min(100, Math.round(currentStage.processedQty * 100 / currentStage.inputQty))
    : summary.percent;
  return (
    <article className="inv-production-card">
      <div className="inv-production-card-top">
        <div className="inv-material-icon"><FiLayers /></div>
        <div className="inv-production-card-title"><span className="inv-overline">WOOD PRODUCTION · {purchase.number}</span><h3>{purchase.material}</h3><p>{purchase.supplier} <span>·</span> Purchased {formatDate(purchase.date)}</p></div>
        <span className={`inv-status is-${summary.active ? 'active' : summary.percent === 100 ? 'completed' : 'pending'}`}>{summary.active ? 'In production' : summary.percent === 100 ? 'Complete' : 'Pending'}</span>
      </div>
      <div className="inv-production-metrics">
        <div><span>Purchased</span><strong>{measure(purchase.quantity, purchase.unit)}</strong></div>
        <div><span>Purchase value</span><strong>{money(purchase.amount)}</strong></div>
        <div><span>Current stage</span><strong>{summary.current}</strong></div>
        <div><span>Processed</span><strong>{measure(summary.processed, currentStage?.unit || purchase.unit)}</strong></div>
        <div><span>Remaining</span><strong>{measure(summary.remaining, currentStage?.unit || purchase.unit)}</strong></div>
      </div>
      <div className="inv-production-progress">
        <div><span>Stage progress</span><strong>{stageProgress}%</strong></div>
        <div className="inv-progress-track"><span style={{ width: `${stageProgress}%` }} /></div>
        <small>{summary.complete} of {purchase.stages.length} stages completed</small>
      </div>
      <div className="inv-production-card-footer">
        <span className="inv-card-workers"><FiUsers /> {workerNames.length ? workerNames.join(', ') : 'Workers not assigned'}</span>
        <button type="button" className="inv-button is-dark" onClick={open}>View production <FiArrowRight /></button>
      </div>
    </article>
  );
}

function EmptyState({ icon: Icon = FiPackage, title, message, action, onAction }) {
  return (
    <div className="inv-empty-state">
      <div className="inv-empty-icon"><Icon /></div>
      <h3>{title}</h3><p>{message}</p>
      {action && <button type="button" className="inv-button is-primary" onClick={onAction}><FiPlus /> {action}</button>}
    </div>
  );
}

function StockList({ stock, toggleReady }) {
  if (!stock.length) return <EmptyState icon={FiBox} title="No finished stock yet" message="Split output from a production stage to track variants and move finished goods into ready stock." />;
  return (
    <div className="inv-stock-grid">
      {stock.map(({ key, purchase, transfer }) => (
        <article className="inv-stock-card" key={key}>
          <div className="inv-stock-card-top"><div className="inv-stock-mark"><FiBox /></div><span className={`inv-stock-pill${transfer.ready ? ' is-ready' : ''}`}>{transfer.ready ? 'Ready for sale' : 'In production'}</span></div>
          <h3>{transfer.product}</h3>
          <p>{[transfer.variant, transfer.size, transfer.color].filter(Boolean).join(' · ') || 'Variant not specified'}</p>
          <div className="inv-stock-quantity"><strong>{measure(transfer.available, transfer.unit)}</strong><span>of {measure(transfer.quantity, transfer.unit)} produced</span></div>
          <div className="inv-stock-details">          <span>Packaging<strong>{transfer.packaging || 'Not specified'}</strong></span><span>Stock value<strong>{transfer.unitCost == null ? 'Unit cost not set' : money(transfer.unitCost * transfer.available)}</strong></span><span>Source<strong>{purchase.material} · {purchase.number}</strong></span><span>Ready date<strong>{transfer.readyDate ? formatDate(transfer.readyDate) : 'Not ready'}</strong></span></div>
          <button type="button" className={`inv-button ${transfer.ready ? 'is-light' : 'is-primary'}`} onClick={() => toggleReady(purchase.id, transfer.id)} disabled={!transfer.available}>
            {transfer.ready ? 'Remove from ready stock' : 'Move to ready stock'}
          </button>
        </article>
      ))}
    </div>
  );
}

function SaleForm({ stock, save, close }) {
  const [form, setForm] = useState({ customer: '', stockKey: '', quantity: '', price: '', paid: '', date: today() });
  const [error, setError] = useState('');
  const ready = stock.filter((item) => item.transfer.ready && item.transfer.available > 0);
  const selected = ready.find((item) => item.key === form.stockKey);
  const total = number(form.quantity) * number(form.price);
  const cost = selected?.transfer.unitCost == null ? null : selected.transfer.unitCost * number(form.quantity);
  const margin = cost == null ? null : total - cost;
  const submit = (event) => {
    event.preventDefault();
    const amount = number(form.quantity);
    if (!selected || amount <= 0 || amount > selected.transfer.available) {
      setError('Select ready stock and enter a quantity that is currently available.');
      return;
    }
    if (number(form.paid) > total) {
      setError('Paid amount cannot be higher than the sale total.');
      return;
    }
    save({
      ...form,
      id: createId(),
      quantity: amount,
      unit: selected.transfer.unit,
      product: selected.transfer.product,
      variant: selected.transfer.variant,
      price: number(form.price),
      paid: number(form.paid),
      total,
      balance: total - number(form.paid),
      profit: margin,
      stockKey: selected.key,
    });
  };
  return (
    <Modal title="Record a sale" close={close}>
      <form className="inv-form" onSubmit={submit}>
        <div className="inv-form-grid">
          <label>Customer<input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} required /></label>
          <label>Ready product<select value={form.stockKey} onChange={(event) => setForm({ ...form, stockKey: event.target.value, quantity: '' })} required><option value="">Select ready stock</option>{ready.map((item) => <option key={item.key} value={item.key}>{item.transfer.product} · {measure(item.transfer.available, item.transfer.unit)} available</option>)}</select></label>
          <label>Quantity<input type="number" min="0.01" max={selected?.transfer.available || undefined} step="any" value={form.quantity} onChange={(event) => { setForm({ ...form, quantity: event.target.value }); setError(''); }} required /></label>
          <label>Selling price per unit (₹)<input type="number" min="0" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
          <label>Paid amount (₹)<input type="number" min="0" max={total || undefined} step="any" value={form.paid} onChange={(event) => setForm({ ...form, paid: event.target.value })} /></label>
          <label>Sale date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label>
        </div>
        {selected && <div className="inv-inline-totals"><span>Available<strong>{measure(selected.transfer.available, selected.transfer.unit)}</strong></span><span>Sale total<strong>{money(total)}</strong></span><span>Estimated margin<strong>{margin == null ? 'Add output unit cost' : money(margin)}</strong></span><span>Balance<strong>{money(Math.max(0, total - number(form.paid)))}</strong></span></div>}
        {error && <p className="inv-form-error" role="alert">{error}</p>}
        <FormActions close={close} label="Record sale" />
      </form>
    </Modal>
  );
}

function BillForm({ stock, save, close }) {
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(today());
  const [paid, setPaid] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState([{ id: createId(), stockKey: '', quantity: '', price: '' }]);
  const ready = stock.filter((item) => item.transfer.ready && item.transfer.available > 0);
  const total = items.reduce((sum, item) => sum + number(item.quantity) * number(item.price), 0);
  const marginAvailable = items.every((item) => ready.find((entry) => entry.key === item.stockKey)?.transfer.unitCost != null);
  const margin = marginAvailable ? items.reduce((sum, item) => {
    const entry = ready.find((candidate) => candidate.key === item.stockKey);
    return sum + number(item.quantity) * (number(item.price) - entry.transfer.unitCost);
  }, 0) : null;
  const updateItem = (itemId, field, value) => setItems((current) => current.map((item) => item.id === itemId ? { ...item, [field]: value } : item));
  const requested = new Map();
  items.forEach((item) => requested.set(item.stockKey, (requested.get(item.stockKey) || 0) + number(item.quantity)));
  const submit = (event) => {
    event.preventDefault();
    const invalidStock = items.some((item) => {
      const entry = ready.find((candidate) => candidate.key === item.stockKey);
      return !entry || number(item.quantity) <= 0 || number(item.price) < 0 || requested.get(item.stockKey) > entry.transfer.available;
    });
    if (!customer.trim() || invalidStock) {
      setError('Choose available products and check quantities before generating the bill.');
      return;
    }
    if (number(paid) > total) {
      setError('Paid amount cannot be higher than the bill total.');
      return;
    }
    save({
      customer,
      date,
      paid: number(paid),
      total,
      items: items.map((item) => {
        const entry = ready.find((candidate) => candidate.key === item.stockKey);
        return { ...item, product: entry.transfer.product, variant: entry.transfer.variant, unit: entry.transfer.unit, unitCost: entry.transfer.unitCost, quantity: number(item.quantity), price: number(item.price) };
      }),
    });
  };
  return (
    <Modal title="Generate customer bill" close={close} wide>
      <form className="inv-form" onSubmit={submit}>
        <div className="inv-form-grid">
          <label>Customer<input value={customer} onChange={(event) => setCustomer(event.target.value)} required /></label>
          <label>Invoice date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          <label>Paid amount (₹)<input type="number" min="0" max={total || undefined} step="any" value={paid} onChange={(event) => setPaid(event.target.value)} /></label>
        </div>
        <div className="inv-subsection-heading inv-bill-items-heading"><div><h3>Invoice products</h3><p>Available stock is checked before the bill is saved.</p></div><button type="button" className="inv-button is-light inv-button-small" onClick={() => setItems((current) => [...current, { id: createId(), stockKey: '', quantity: '', price: '' }])}><FiPlus /> Add product</button></div>
        {items.map((item) => (
          <div className="inv-bill-line" key={item.id}>
            <label>Ready product<select value={item.stockKey} onChange={(event) => updateItem(item.id, 'stockKey', event.target.value)} required><option value="">Select stock item</option>{ready.map((entry) => <option key={entry.key} value={entry.key}>{entry.transfer.product} · {measure(entry.transfer.available, entry.transfer.unit)}</option>)}</select></label>
            <label>Quantity<input type="number" min="0.01" step="any" value={item.quantity} onChange={(event) => { updateItem(item.id, 'quantity', event.target.value); setError(''); }} required /></label>
            <label>Price / unit (₹)<input type="number" min="0" step="any" value={item.price} onChange={(event) => updateItem(item.id, 'price', event.target.value)} required /></label>
            <strong className="inv-bill-line-total">{money(number(item.quantity) * number(item.price))}</strong>
            <IconButton label="Remove product" danger disabled={items.length === 1} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><FiTrash2 /></IconButton>
          </div>
        ))}
        {error && <p className="inv-form-error" role="alert">{error}</p>}
        <div className="inv-invoice-totals"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Profit / margin estimate</span><strong>{margin == null ? 'Add output unit cost' : money(margin)}</strong></div><div><span>Total</span><strong>{money(total)}</strong></div><div><span>Paid</span><strong>{money(paid)}</strong></div><div className="is-balance"><span>Balance due</span><strong>{money(Math.max(0, total - number(paid)))}</strong></div></div>
        <FormActions close={close} label="Generate bill" />
      </form>
    </Modal>
  );
}

function InventoryPage() {
  const { employees = [], attendance = {} } = useERP();
  const isCEO = getCurrentUser()?.role === ROLES.CEO;
  const [workflow, setWorkflow] = useState(loadWorkflow);
  const [tab, setTab] = useState('overview');
  const [purchaseId, setPurchaseId] = useState(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
    } catch (error) {
      console.error('Unable to save inventory workflow.', error);
    }
  }, [workflow]);

  const stock = useMemo(() => workflow.purchases.flatMap((purchase) => purchase.transfers.map((transfer) => ({
    key: `${purchase.id}:${transfer.id}`,
    purchase,
    transfer,
  }))), [workflow.purchases]);
  const selectedPurchase = workflow.purchases.find((purchase) => purchase.id === purchaseId);
  const summary = useMemo(() => {
    const activePurchases = workflow.purchases.filter((purchase) => purchase.stages.some((stage) => stage.status === 'Active'));
    const processing = activePurchases.map((purchase) => {
      const stage = purchase.stages.find((item) => item.status === 'Active');
      return { quantity: stage?.processedQty || 0, unit: stage?.unit || purchase.unit };
    });
    const readyItems = stock.filter((item) => item.transfer.ready);
    const unbilledSalesBalance = workflow.sales.filter((sale) => !sale.invoiceNumber).reduce((sum, sale) => sum + number(sale.balance), 0);
    const billBalance = workflow.bills.reduce((sum, bill) => sum + number(bill.balance), 0);
    return {
      purchasesValue: workflow.purchases.reduce((sum, purchase) => sum + number(purchase.amount), 0),
      activeCount: activePurchases.length,
      processing: processing.length ? processing.map((item) => measure(item.quantity, item.unit)).join(' · ') : '0 KG',
      readyQuantity: readyItems.length ? readyItems.map(({ transfer }) => measure(transfer.available, transfer.unit)).join(' · ') : '0 Boxes',
      pendingSales: unbilledSalesBalance + billBalance,
      productionCost: workflow.purchases.reduce((sum, purchase) => sum + totalProductionCost(purchase), 0),
    };
  }, [workflow.purchases, workflow.sales, workflow.bills, stock]);

  const updatePurchase = (updated) => {
    setWorkflow((current) => ({
      ...current,
      purchases: current.purchases.map((purchase) => purchase.id === updated.id ? updated : purchase),
    }));
    recordOwnerActivity('Updated inventory purchase', 'Inventory', updated.id);
  };
  const createPurchase = (values) => {
    const numberIndex = workflow.purchases.length + 1;
    const purchase = {
      ...values,
      id: createId(),
      number: `WP-${String(numberIndex).padStart(3, '0')}`,
      stages: blankStages(values.quantity).map((stage) => ({ ...stage, unit: values.unit })),
      transfers: [],
    };
    setWorkflow((current) => ({ ...current, purchases: [purchase, ...current.purchases] }));
    recordOwnerActivity('Added inventory purchase', 'Inventory', purchase.id);
    setPurchaseId(purchase.id);
    setTab('production');
    setPurchaseOpen(false);
    setNotice('Purchase saved. Your production journey is ready to start.');
  };
  const consumeStock = (purchases, stockKey, amount) => purchases.map((purchase) => ({
    ...purchase,
    transfers: purchase.transfers.map((transfer) => `${purchase.id}:${transfer.id}` === stockKey
      ? { ...transfer, available: Math.max(0, number(transfer.available) - amount) }
      : transfer),
  }));
  const saveSale = (sale) => {
    setWorkflow((current) => ({
      ...current,
      purchases: consumeStock(current.purchases, sale.stockKey, sale.quantity),
      sales: [sale, ...current.sales],
    }));
    recordOwnerActivity('Recorded inventory sale', 'Inventory', sale.id);
    setSaleOpen(false);
    setTab('sales');
    setNotice('Sale recorded and ready stock updated.');
  };
  const saveBill = (bill) => {
    setWorkflow((current) => {
      const purchases = bill.items.reduce((items, item) => consumeStock(items, item.stockKey, item.quantity), current.purchases);
      const invoiceNumber = `INV-${String(current.bills.length + 1).padStart(4, '0')}`;
      const sales = bill.items.map((item) => {
        const total = item.quantity * item.price;
        const paid = bill.total ? bill.paid * total / bill.total : 0;
        const cost = item.unitCost == null ? null : item.unitCost * item.quantity;
        return {
          ...item,
          id: createId(),
          customer: bill.customer,
          date: bill.date,
          paid,
          total,
          balance: Math.max(0, total - paid),
          profit: cost == null ? null : total - cost,
          invoiceNumber,
        };
      });
      return {
        ...current,
        purchases,
        bills: [{ ...bill, id: createId(), invoiceNumber, balance: Math.max(0, bill.total - bill.paid), profit: sales.every((sale) => sale.profit != null) ? sales.reduce((sum, sale) => sum + sale.profit, 0) : null }, ...current.bills],
        sales: [...sales, ...current.sales],
      };
    });
    recordOwnerActivity('Generated inventory bill', 'Inventory', bill.invoiceNumber || 'New bill');
    setBillOpen(false);
    setTab('billing');
    setNotice('Bill generated and inventory quantities updated.');
  };
  const toggleReady = (purchaseIdValue, transferId) => {
    setWorkflow((current) => ({
      ...current,
      purchases: current.purchases.map((purchase) => purchase.id !== purchaseIdValue ? purchase : {
        ...purchase,
        transfers: purchase.transfers.map((transfer) => transfer.id === transferId
          ? { ...transfer, ready: !transfer.ready, readyDate: !transfer.ready ? today() : '' }
          : transfer),
      }),
    }));
    recordOwnerActivity('Updated inventory readiness', 'Inventory', `${purchaseIdValue}:${transferId}`);
  };

  if (selectedPurchase) {
    return (
      <main className="inventory-page">
        <PurchaseDetails purchase={selectedPurchase} employees={employees} attendance={attendance} update={updatePurchase} close={() => setPurchaseId(null)} />
      </main>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'production', label: 'Production', icon: FiSettings, count: workflow.purchases.length },
    { id: 'stock', label: 'Ready stock', icon: FiBox, count: stock.filter((item) => item.transfer.ready).length },
    { id: 'sales', label: 'Sales', icon: FiShoppingCart, count: workflow.sales.length },
    { id: 'billing', label: 'Billing', icon: FiFileText, count: workflow.bills.length },
  ];
  const activeProduction = workflow.purchases.filter((purchase) => purchase.stages.some((stage) => stage.status === 'Active'));
  const pendingProduction = workflow.purchases.filter((purchase) => !purchase.stages.some((stage) => stage.status === 'Active'));
  return (
    <main className="inventory-page">
      <header className="inv-page-header">
        <div><span className="inv-overline">MANUFACTURING OPERATIONS</span><h1>Inventory</h1><p>Production &amp; material flow</p></div>
        <button type="button" className="inv-button is-primary" onClick={() => setPurchaseOpen(true)}><FiPlus /> New purchase</button>
      </header>

      <section className="inv-kpi-grid" aria-label="Inventory overview">
        {isCEO && <article className="inv-kpi-card"><span className="inv-kpi-icon is-blue"><FiShoppingCart /></span><div><span>Total purchases</span><strong>{money(summary.purchasesValue)}</strong><small>{workflow.purchases.length} purchase lots</small></div></article>}
        <article className="inv-kpi-card"><span className="inv-kpi-icon is-orange"><FiActivity /></span><div><span>Active productions</span><strong>{summary.activeCount}</strong><small>Lots currently on the line</small></div></article>
        <article className="inv-kpi-card"><span className="inv-kpi-icon is-teal"><FiScissors /></span><div><span>Processing quantity</span><strong>{summary.processing}</strong><small>At the active stage</small></div></article>
        <article className="inv-kpi-card"><span className="inv-kpi-icon is-green"><FiPackage /></span><div><span>Ready stock</span><strong>{summary.readyQuantity}</strong><small>Available to sell</small></div></article>
        {isCEO && <article className="inv-kpi-card"><span className="inv-kpi-icon is-violet"><FaRupeeSign /></span><div><span>Pending sales</span><strong>{money(summary.pendingSales)}</strong><small>Customer balances</small></div></article>}
        {isCEO && <article className="inv-kpi-card"><span className="inv-kpi-icon is-slate"><FiBarChart2 /></span><div><span>Total production cost</span><strong>{money(summary.productionCost)}</strong><small>Purchase value + stage costs</small></div></article>}
      </section>

      <nav className="inv-tabs" aria-label="Inventory sections">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button type="button" key={id} className={tab === id ? 'is-selected' : ''} onClick={() => { setTab(id); setNotice(''); }}>
            <Icon /><span>{label}</span>{count > 0 && <small>{count}</small>}
          </button>
        ))}
      </nav>

      {notice && <div className="inv-notice" role="status">
        {notice}
        <button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}><FiX /></button>
      </div>}

      {tab === 'overview' && (
        <>
          <section className="inv-flow-panel">
            <div className="inv-flow-heading"><div><span className="inv-overline">END-TO-END WORKFLOW</span><h2>Every material has a clear next step</h2></div><span className="inv-flow-note"><FiActivity /> Live production flow</span></div>
            <div className="inv-flow-steps">
              {[{ label: 'Purchase', icon: FiShoppingCart }, ...stageNames.map((label, index) => ({ label, icon: stageIcons[index] })), { label: 'Ready stock', icon: FiBox }, { label: 'Sales & billing', icon: FiFileText }].map(({ label, icon: Icon }, index, steps) => (
                <div className="inv-flow-step" key={label}><span className={`inv-flow-step-icon${index === 3 ? ' is-active' : ''}`}><Icon /></span><span>{label}</span>{index < steps.length - 1 && <FiChevronRight className="inv-flow-arrow" />}</div>
              ))}
            </div>
          </section>
          <section className="inv-section">
            <div className="inv-section-heading"><div><span className="inv-overline">ON THE PRODUCTION LINE</span><h2>Active production</h2><p>Track current stage, quantities, workers and cost at a glance.</p></div><button type="button" className="inv-text-button" onClick={() => setTab('production')}>All production <FiArrowRight /></button></div>
            {activeProduction.length ? <div className="inv-production-grid">{activeProduction.map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} open={() => setPurchaseId(purchase.id)} />)}</div> : (
              <EmptyState title="No active production yet" message="Start your first purchase to begin tracking production." action="New purchase" onAction={() => setPurchaseOpen(true)} />
            )}
          </section>
          {pendingProduction.length > 0 && <section className="inv-section inv-secondary-section">
            <div className="inv-section-heading"><div><span className="inv-overline">PURCHASED MATERIAL</span><h2>Awaiting production</h2></div></div>
            <div className="inv-production-grid">{pendingProduction.map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} open={() => setPurchaseId(purchase.id)} />)}</div>
          </section>}
          <section className="inv-section inv-overview-bottom">
            <div className="inv-overview-stock">
              <div className="inv-section-heading"><div><span className="inv-overline">FINISHED GOODS</span><h2>Ready for sale</h2></div><button type="button" className="inv-text-button" onClick={() => setTab('stock')}>View stock <FiArrowRight /></button></div>
              <StockList stock={stock.filter((item) => item.transfer.ready).slice(0, 3)} toggleReady={toggleReady} />
            </div>
            <div className="inv-next-step-card"><span className="inv-kpi-icon is-orange"><FiWind /></span><span className="inv-overline">NEXT STEP</span><h3>Keep production moving</h3><p>Add a custom stage, assign existing employees, and record output as your process evolves.</p><button type="button" className="inv-button is-dark" onClick={() => activeProduction[0] ? setPurchaseId(activeProduction[0].id) : setPurchaseOpen(true)}>{activeProduction.length ? 'Open production' : 'Create a purchase'} <FiArrowRight /></button></div>
          </section>
        </>
      )}

      {tab === 'production' && (
        <section className="inv-section">
          <div className="inv-section-heading"><div><span className="inv-overline">PURCHASE-TO-PACKING</span><h2>Production lots</h2><p>Open a lot to inspect and update its configurable production stages.</p></div><button type="button" className="inv-button is-primary" onClick={() => setPurchaseOpen(true)}><FiPlus /> New purchase</button></div>
          {workflow.purchases.length ? <div className="inv-production-grid">{workflow.purchases.map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} open={() => setPurchaseId(purchase.id)} />)}</div> : <EmptyState title="No active production yet" message="Start your first purchase to begin tracking production." action="New purchase" onAction={() => setPurchaseOpen(true)} />}
        </section>
      )}

      {tab === 'stock' && (
        <section className="inv-section">
          <div className="inv-section-heading"><div><span className="inv-overline">VARIANTS & FINISHED GOODS</span><h2>Ready stock</h2><p>Follow each output from its production source into saleable inventory.</p></div><button type="button" className="inv-button is-primary" onClick={() => setSaleOpen(true)} disabled={!stock.some((item) => item.transfer.ready && item.transfer.available > 0)}><FiPlus /> Record sale</button></div>
          <StockList stock={stock} toggleReady={toggleReady} />
        </section>
      )}

      {tab === 'sales' && (
        <section className="inv-section">
          <div className="inv-section-heading"><div><span className="inv-overline">CUSTOMER ORDERS</span><h2>Sales</h2><p>Sales draw down ready stock and keep paid amounts and balances visible.</p></div><button type="button" className="inv-button is-primary" onClick={() => setSaleOpen(true)} disabled={!stock.some((item) => item.transfer.ready && item.transfer.available > 0)}><FiPlus /> Record sale</button></div>
          {workflow.sales.length ? <div className="inv-record-list">{workflow.sales.map((sale) => (
            <article className="inv-record-card" key={sale.id}><div className="inv-record-icon"><FiShoppingCart /></div><div className="inv-record-main"><span className="inv-overline">{sale.invoiceNumber || 'DIRECT SALE'} · {formatDate(sale.date)}</span><h3>{sale.product} <small>{sale.variant}</small></h3><p>{sale.customer} · {measure(sale.quantity, sale.unit)}</p></div><div className="inv-record-amount"><span>Total</span><strong>{money(sale.total)}</strong></div><div className="inv-record-amount"><span>Margin</span><strong>{sale.profit == null ? 'Not calculated' : money(sale.profit)}</strong></div><span className={`inv-stock-pill${sale.balance ? '' : ' is-ready'}`}>{sale.balance ? `${money(sale.balance)} due` : 'Paid'}</span></article>
          ))}</div> : <EmptyState icon={FiShoppingCart} title="No sales recorded" message="Once finished goods are marked ready, record a sale and available stock will update automatically." />}
        </section>
      )}

      {tab === 'billing' && (
        <section className="inv-section">
          <div className="inv-section-heading"><div><span className="inv-overline">CUSTOMER INVOICES</span><h2>Billing</h2><p>Generate itemised bills with invoice references, margin and outstanding balances.</p></div><button type="button" className="inv-button is-primary" onClick={() => setBillOpen(true)} disabled={!stock.some((item) => item.transfer.ready && item.transfer.available > 0)}><FiPlus /> Generate bill</button></div>
          {workflow.bills.length ? <div className="inv-record-list">{workflow.bills.map((bill) => (
            <article className="inv-record-card inv-bill-record" key={bill.id}><div className="inv-record-icon"><FiFileText /></div><div className="inv-record-main"><span className="inv-overline">{bill.invoiceNumber} · {formatDate(bill.date)}</span><h3>{bill.customer}</h3><p>{bill.items.map((item) => `${item.product} · ${measure(item.quantity, item.unit)} × ${money(item.price)}`).join(' / ')}</p></div><div className="inv-record-amount"><span>Total</span><strong>{money(bill.total)}</strong></div><div className="inv-record-amount"><span>Margin</span><strong>{bill.profit == null ? 'Not calculated' : money(bill.profit)}</strong></div><span className={`inv-stock-pill${bill.balance ? '' : ' is-ready'}`}>{bill.balance ? `${money(bill.balance)} due` : 'Paid'}</span><button type="button" className="inv-icon-button inv-print-button" aria-label={`Print invoice ${bill.invoiceNumber}`} onClick={() => window.print()}><FiPrinter /></button></article>
          ))}</div> : <EmptyState icon={FiFileText} title="No bills created" message="Generate a customer bill from available ready stock. Paid amounts and balances will be tracked here." />}
        </section>
      )}

      {purchaseOpen && <PurchaseForm save={createPurchase} close={() => setPurchaseOpen(false)} />}
      {saleOpen && <SaleForm stock={stock} save={saveSale} close={() => setSaleOpen(false)} />}
      {billOpen && <BillForm stock={stock} save={saveBill} close={() => setBillOpen(false)} />}
    </main>
  );
}

export default InventoryPage;
