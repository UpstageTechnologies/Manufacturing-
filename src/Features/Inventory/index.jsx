import { useEffect, useMemo, useState } from 'react';
import { FiArrowDown, FiArrowUp, FiCheck, FiChevronLeft, FiChevronRight, FiPlus, FiPrinter, FiTrash2, FiX } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import './Inventory.css';

const STORAGE_KEY = 'manufacture-erp-inventory-workflow';
const today = () => new Date().toISOString().slice(0, 10);
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const money = (amount) => formatCurrency(Number(amount || 0));
const qty = (amount) => Number(amount || 0).toLocaleString('en-IN');
const measure = (amount, unit) => `${qty(amount)} ${unit || 'units'}`;
const sumMeasures = (records) => {
	const totals = records.reduce((groups, record) => groups.set(record.unit || 'units', (groups.get(record.unit || 'units') || 0) + Number(record.quantity || 0)), new Map());
	return [...totals].map(([unit, amount]) => measure(amount, unit)).join(' · ') || '0 units';
};
const productionCost = (purchase) => Number(purchase.amount || 0) + purchase.stages.reduce((total, stage) => total + Number(stage.cost || 0) + stage.workers.reduce((workerTotal, worker) => workerTotal + Number(worker.cost || 0), 0), 0);
const emptyPurchase = () => ({ supplier: '', material: '', quantity: '', unit: 'KG', amount: '', invoiceNumber: '', billNumber: '', date: today(), quality: '' });
const emptyStage = () => ({ name: '', status: 'Pending', quantity: '', machine: '', cost: '', notes: '', startDate: '', endDate: '', workers: [] });

function loadWorkflow() {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
		return { purchases: saved?.purchases || [], sales: saved?.sales || [], bills: saved?.bills || [] };
	} catch {
		return { purchases: [], sales: [], bills: [] };
	}
}

function progressFor(purchase) {
	const stages = purchase.stages || [];
	const completed = stages.filter((stage) => stage.status === 'Completed').length;
	const active = stages.find((stage) => stage.status === 'Active');
	const next = stages.find((stage) => stage.status === 'Pending');
	const lastQuantity = [...stages].reverse().find((stage) => stage.quantity !== '' && stage.quantity != null)?.quantity;
	const transferred = (purchase.transfers || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
	return {
		completed,
		pending: stages.filter((stage) => stage.status === 'Pending').length,
		percent: stages.length ? Math.round(completed * 100 / stages.length) : 0,
		current: (active || next)?.name || (stages.length ? 'All stages complete' : 'Stages not started'),
		processed: lastQuantity === undefined ? 0 : Math.max(0, Number(purchase.quantity) - Number(lastQuantity)),
		remaining: Math.max(0, Number(purchase.quantity) - transferred),
	};
}

function Modal({ title, close, wide = false, children }) {
	return <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className={`inv-modal${wide ? ' inv-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header className="inv-modal-header"><h2>{title}</h2><button type="button" className="inv-icon-button" onClick={close} aria-label="Close"><FiX /></button></header>{children}</section></div>;
}

function PurchaseForm({ save, close }) {
	const [form, setForm] = useState(emptyPurchase);
	const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
	const submit = (event) => { event.preventDefault(); save({ ...form, quantity: Number(form.quantity), amount: Number(form.amount) }); };
	return <Modal title="New purchase" close={close}><form className="inv-form" onSubmit={submit}><div className="inv-form-grid">
		<label>Supplier name<input name="supplier" value={form.supplier} onChange={change} required /></label><label>Material / product<input name="material" value={form.material} onChange={change} required /></label>
		<label>Quantity<input name="quantity" type="number" min="0.01" step="any" value={form.quantity} onChange={change} required /></label><label>Unit of measure<input name="unit" value={form.unit} onChange={change} placeholder="KG, bags, pieces" required /></label>
		<label>Purchase amount (₹)<input name="amount" type="number" min="0" step="any" value={form.amount} onChange={change} required /></label>
		<label>Invoice number <span className="inv-optional">Optional</span><input name="invoiceNumber" value={form.invoiceNumber} onChange={change} /></label><label>Bill number <span className="inv-optional">Optional</span><input name="billNumber" value={form.billNumber} onChange={change} /></label>
		<label>Purchase date<input name="date" type="date" value={form.date} onChange={change} required /></label><label className="inv-span-two">Quality / notes<textarea name="quality" rows="3" value={form.quality} onChange={change} /></label>
	</div><FormActions close={close} label="Save purchase" /></form></Modal>;
}

function FormActions({ close, label }) {
	return <div className="inv-form-actions"><button type="button" className="inv-button inv-button-quiet" onClick={close}>Cancel</button><button type="submit" className="inv-button inv-button-primary">{label}</button></div>;
}

function StageForm({ initial, employees, save, close }) {
	const [form, setForm] = useState(initial || emptyStage());
	const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
	const addWorker = () => setForm((value) => ({ ...value, workers: [...value.workers, { id: id(), employeeId: '', hours: '', cost: '' }] }));
	const updateWorker = (workerId, field, value) => setForm((current) => ({ ...current, workers: current.workers.map((worker) => worker.id === workerId ? { ...worker, [field]: value } : worker) }));
	const submit = (event) => {
		event.preventDefault();
		const workers = form.workers.filter((worker) => worker.employeeId).map((worker) => ({ ...worker, employeeName: employees.find((employee) => String(employee.id) === String(worker.employeeId))?.name || 'Employee', hours: Number(worker.hours || 0), cost: Number(worker.cost || 0) }));
		save({ ...form, quantity: form.quantity === '' ? '' : Number(form.quantity), cost: form.cost === '' ? '' : Number(form.cost), workers });
	};
	return <Modal title={initial?.id ? 'Edit progress stage' : 'Add progress stage'} close={close} wide><form className="inv-form" onSubmit={submit}>
		<div className="inv-form-grid"><label>Stage name<input name="name" value={form.name} onChange={change} placeholder="e.g. Sheet cutting" required /></label><label>Status<select name="status" value={form.status} onChange={change}><option>Pending</option><option>Active</option><option>Completed</option></select></label>
			<label>Quantity<input name="quantity" type="number" min="0" step="any" value={form.quantity} onChange={change} /></label><label>Machine<input name="machine" value={form.machine} onChange={change} /></label><label>Stage cost (₹)<input name="cost" type="number" min="0" step="any" value={form.cost} onChange={change} /></label>
			<label>Start date<input name="startDate" type="date" value={form.startDate} onChange={change} /></label><label>End date<input name="endDate" type="date" value={form.endDate} onChange={change} /></label><label className="inv-span-two">Notes<textarea name="notes" rows="2" value={form.notes} onChange={change} /></label>
		</div><div className="inv-worker-heading"><div><h3>Workers</h3><p>Select employees already in your ERP.</p></div><button type="button" className="inv-button inv-button-small" onClick={addWorker}><FiPlus /> Add worker</button></div>
		{form.workers.map((worker) => <div className="inv-worker-row" key={worker.id}><label>Employee<select value={worker.employeeId} onChange={(event) => updateWorker(worker.id, 'employeeId', event.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label>Hours<input type="number" min="0" step="any" value={worker.hours} onChange={(event) => updateWorker(worker.id, 'hours', event.target.value)} /></label><label>Stage cost (₹)<input type="number" min="0" step="any" value={worker.cost} onChange={(event) => updateWorker(worker.id, 'cost', event.target.value)} /></label><button type="button" className="inv-icon-button inv-danger-icon" aria-label="Remove worker" onClick={() => setForm((value) => ({ ...value, workers: value.workers.filter((item) => item.id !== worker.id) }))}><FiTrash2 /></button></div>)}
		<FormActions close={close} label="Save stage" />
	</form></Modal>;
}

function TransferForm({ purchase, save, close }) {
	const [product, setProduct] = useState('');
	const [unit, setUnit] = useState(purchase.unit || 'units');
	const [amount, setAmount] = useState('');
	const [error, setError] = useState('');
	const remaining = progressFor(purchase).remaining;
	const submit = (event) => { event.preventDefault(); const value = Number(amount); if (!product.trim() || !unit.trim() || value <= 0 || value > remaining) { setError(value > remaining ? 'Quantity exceeds what remains in this purchase.' : 'Enter a product, unit, and quantity greater than zero.'); return; } save({ id: id(), product: product.trim(), unit: unit.trim(), quantity: value, available: value, ready: false }); };
	return <Modal title="Split / transfer quantity" close={close}><form className="inv-form" onSubmit={submit}><div className="inv-transfer-balance"><span>Available to transfer</span><strong>{measure(remaining, purchase.unit)}</strong></div><label>Destination / product<input value={product} onChange={(event) => setProduct(event.target.value)} required /></label><label>Output unit<input value={unit} onChange={(event) => setUnit(event.target.value)} required /></label><label>Quantity<input type="number" min="0.01" max={remaining} step="any" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} required /></label>{error && <p className="inv-form-error" role="alert">{error}</p>}<p className="inv-field-hint">{measure(Math.max(0, remaining - Number(amount || 0)), purchase.unit)} will remain after transfer.</p><FormActions close={close} label="Transfer quantity" /></form></Modal>;
}

function PurchaseDetails({ purchase, employees, close, update }) {
	const [stageForm, setStageForm] = useState(null);
	const [transferOpen, setTransferOpen] = useState(false);
	const summary = progressFor(purchase);
	const saveStage = (stage) => {
		const stages = stage.id ? purchase.stages.map((item) => item.id === stage.id ? stage : item) : [...purchase.stages, { ...stage, id: id() }];
		update({ ...purchase, stages: stages.map((item) => item.status === 'Active' && item.id !== stage.id ? { ...item, status: 'Pending' } : item) });
		setStageForm(null);
	};
	const statusChange = (stageId, status) => update({ ...purchase, stages: purchase.stages.map((stage) => ({ ...stage, status: stage.id === stageId ? status : status === 'Active' && stage.status === 'Active' ? 'Pending' : stage.status })) });
	const move = (index, direction) => { const target = index + direction; if (target < 0 || target >= purchase.stages.length) return; const stages = [...purchase.stages]; [stages[index], stages[target]] = [stages[target], stages[index]]; update({ ...purchase, stages }); };
	const openStage = () => setStageForm({ ...emptyStage(), status: purchase.stages.some((stage) => stage.status === 'Active') ? 'Pending' : 'Active' });
	return <>
		<div className="inv-detail-top"><button type="button" className="inv-back-button" onClick={close}><FiChevronLeft /> Purchases</button><div className="inv-detail-actions"><button type="button" className="inv-button inv-button-secondary" onClick={() => setTransferOpen(true)} disabled={!summary.remaining}><FiArrowDown /> Split / transfer</button><button type="button" className="inv-button inv-button-primary" onClick={openStage}><FiPlus /> Add progress stage</button></div></div>
		<section className="inv-purchase-banner"><div><span className="inv-eyebrow">PURCHASE DETAILS</span><h2>{purchase.material} <span>Purchase #{purchase.number}</span></h2><p>{purchase.supplier} <span>·</span> {formatDate(purchase.date)}</p></div><div className="inv-progress-ring-label"><strong>{summary.percent}%</strong><span>Complete</span></div></section>
		<div className="inv-summary-grid inv-summary-grid-detail"><div><span>Total purchased</span><strong>{measure(purchase.quantity, purchase.unit)}</strong></div><div><span>Processed</span><strong>{measure(summary.processed, purchase.unit)}</strong></div><div><span>Remaining quantity</span><strong>{measure(summary.remaining, purchase.unit)}</strong></div><div><span>Current stage</span><strong>{summary.current}</strong></div></div>
		<div className="inv-detail-grid"><section className="inv-panel inv-purchase-info"><div className="inv-section-heading"><div><span className="inv-eyebrow">SOURCE</span><h3>Purchase information</h3></div></div><dl className="inv-info-list"><div><dt>Supplier</dt><dd>{purchase.supplier}</dd></div><div><dt>Material</dt><dd>{purchase.material}</dd></div><div><dt>Purchase amount</dt><dd>{money(purchase.amount)}</dd></div><div><dt>Purchase date</dt><dd>{formatDate(purchase.date)}</dd></div><div><dt>Invoice number</dt><dd>{purchase.invoiceNumber || 'Not provided'}</dd></div><div><dt>Bill number</dt><dd>{purchase.billNumber || 'Not provided'}</dd></div>{purchase.quality && <div className="inv-info-notes"><dt>Quality / notes</dt><dd>{purchase.quality}</dd></div>}</dl></section>
			<section className="inv-panel inv-timeline-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">PRODUCTION</span><h3>Progress stages</h3><p>{summary.completed} complete <span>·</span> {summary.pending} pending</p></div><button type="button" className="inv-text-button" onClick={openStage}><FiPlus /> Add stage</button></div>
				{purchase.stages.length ? <div className="inv-timeline">{purchase.stages.map((stage, index) => <article className={`inv-stage is-${stage.status.toLowerCase()}`} key={stage.id}><div className="inv-stage-marker">{stage.status === 'Completed' ? <FiCheck /> : String(index + 1).padStart(2, '0')}</div><div className="inv-stage-content"><div className="inv-stage-title"><div><h4>{stage.name}</h4><span className={`inv-status inv-status-${stage.status.toLowerCase()}`}>{stage.status}</span></div><div className="inv-stage-actions"><button type="button" className="inv-icon-button" onClick={() => move(index, -1)} disabled={!index} aria-label="Move stage up"><FiArrowUp /></button><button type="button" className="inv-icon-button" onClick={() => move(index, 1)} disabled={index === purchase.stages.length - 1} aria-label="Move stage down"><FiArrowDown /></button><button type="button" className="inv-icon-button inv-edit-button" onClick={() => setStageForm(stage)}>Edit</button><button type="button" className="inv-icon-button inv-danger-icon" onClick={() => update({ ...purchase, stages: purchase.stages.filter((item) => item.id !== stage.id) })} aria-label={`Delete ${stage.name}`}><FiTrash2 /></button></div></div>
					<div className="inv-stage-stats">{stage.quantity !== '' && <span>Quantity <strong>{measure(stage.quantity, purchase.unit)}</strong></span>}{stage.machine && <span>Machine <strong>{stage.machine}</strong></span>}{stage.cost !== '' && <span>Cost <strong>{money(stage.cost)}</strong></span>}{stage.startDate && <span>Started <strong>{formatDate(stage.startDate)}</strong></span>}{stage.endDate && <span>Ended <strong>{formatDate(stage.endDate)}</strong></span>}</div>
					{stage.workers.length > 0 && <div className="inv-stage-workers">{stage.workers.map((worker) => <span key={worker.id}>{worker.employeeName} <small>{worker.hours} hrs · {money(worker.cost)}</small></span>)}</div>}{stage.notes && <p className="inv-stage-notes">{stage.notes}</p>}<div className="inv-stage-status-controls"><span>Update status</span><select aria-label={`Status for ${stage.name}`} value={stage.status} onChange={(event) => statusChange(stage.id, event.target.value)}><option>Pending</option><option>Active</option><option>Completed</option></select></div>
				</div></article>)}</div> : <div className="inv-empty-inline"><p>No stages added yet.</p><button type="button" className="inv-button inv-button-secondary" onClick={openStage}><FiPlus /> Add the first stage</button></div>}
			</section></div>
		{purchase.transfers.length > 0 && <section className="inv-panel inv-transfer-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">OUTPUTS</span><h3>Split / transferred stock</h3></div></div><div className="inv-transfer-list">{purchase.transfers.map((transfer) => <div className="inv-transfer-row" key={transfer.id}><div className="inv-transfer-symbol"><FiArrowDown /></div><div><strong>{transfer.product}</strong><span>{measure(transfer.available, transfer.unit)} of {measure(transfer.quantity, transfer.unit)} available</span></div><span className={transfer.ready ? 'inv-stock-ready' : 'inv-stock-pending'}>{transfer.ready ? 'Ready for sale' : 'Not ready'}</span></div>)}</div></section>}
		{stageForm && <StageForm initial={stageForm} employees={employees} save={saveStage} close={() => setStageForm(null)} />}
		{transferOpen && <TransferForm purchase={purchase} save={(transfer) => { update({ ...purchase, transfers: [...purchase.transfers, transfer] }); setTransferOpen(false); }} close={() => setTransferOpen(false)} />}
	</>;
}

function SaleForm({ stock, save, close }) {
	const [form, setForm] = useState({ customer: '', stockKey: '', quantity: '', price: '', paid: '', date: today() });
	const ready = stock.filter((item) => item.transfer.ready && item.transfer.available > 0);
	const selected = ready.find((item) => item.key === form.stockKey);
	const total = Number(form.quantity || 0) * Number(form.price || 0);
	const cost = selected ? productionCost(selected.purchase) / Number(selected.purchase.quantity) * Number(form.quantity || 0) : 0;
	const submit = (event) => { event.preventDefault(); if (!selected || Number(form.quantity) > selected.transfer.available) return; save({ ...form, quantity: Number(form.quantity), unit: selected.transfer.unit, price: Number(form.price), paid: Number(form.paid || 0), total, balance: Math.max(0, total - Number(form.paid || 0)), profit: total - cost, stockKey: selected.key }); };
	return <Modal title="Record a sale" close={close}><form className="inv-form" onSubmit={submit}><div className="inv-form-grid"><label>Customer<input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} required /></label><label>Product<select value={form.stockKey} onChange={(event) => setForm({ ...form, stockKey: event.target.value, quantity: '' })} required><option value="">Select ready stock</option>{ready.map((item) => <option key={item.key} value={item.key}>{item.transfer.product} · {measure(item.transfer.available, item.transfer.unit)} available</option>)}</select></label><label>Quantity<input type="number" min="0.01" max={selected?.transfer.available || ''} step="any" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></label><label>Selling price per unit (₹)<input type="number" min="0" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label><label>Paid amount (₹)<input type="number" min="0" max={total || undefined} step="any" value={form.paid} onChange={(event) => setForm({ ...form, paid: event.target.value })} /></label><label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label></div>{selected && <div className="inv-form-totals"><span>Total <strong>{money(total)}</strong></span><span>Estimated margin <strong>{money(total - cost)}</strong></span><span>Balance <strong>{money(Math.max(0, total - Number(form.paid || 0)))}</strong></span></div>}<div className="inv-form-actions"><button type="button" className="inv-button inv-button-quiet" onClick={close}>Cancel</button><button type="submit" className="inv-button inv-button-primary" disabled={!ready.length}>Save sale</button></div></form></Modal>;
}

function BillForm({ stock, save, close }) {
	const [customer, setCustomer] = useState('');
	const [date, setDate] = useState(today());
	const [paid, setPaid] = useState('');
	const [error, setError] = useState('');
	const [items, setItems] = useState([{ id: id(), stockKey: '', quantity: '', price: '' }]);
	const ready = stock.filter((item) => item.transfer.ready && item.transfer.available > 0);
	const total = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
	const updateItem = (itemId, field, value) => setItems((current) => current.map((item) => item.id === itemId ? { ...item, [field]: value } : item));
	const submit = (event) => {
		event.preventDefault();
		const requested = new Map();
		items.forEach((item) => requested.set(item.stockKey, (requested.get(item.stockKey) || 0) + Number(item.quantity || 0)));
		const invalid = items.some((item) => !ready.some((entry) => entry.key === item.stockKey) || Number(item.quantity) <= 0 || Number(item.price) < 0) || [...requested].some(([key, amount]) => amount > (ready.find((entry) => entry.key === key)?.transfer.available || 0));
		if (!customer.trim() || invalid) { setError('Choose available products and check quantities before generating the bill.'); return; }
		save({ customer, date, paid: Number(paid || 0), total, items: items.map((item) => { const transfer = ready.find((entry) => entry.key === item.stockKey).transfer; return { ...item, product: transfer.product, unit: transfer.unit }; }) });
	};
	return <Modal title="Generate bill" close={close} wide><form className="inv-form" onSubmit={submit}><div className="inv-form-grid inv-bill-meta"><label>Customer<input value={customer} onChange={(event) => setCustomer(event.target.value)} required /></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label>Paid amount (₹)<input type="number" min="0" max={total || undefined} step="any" value={paid} onChange={(event) => setPaid(event.target.value)} /></label></div>
		<div className="inv-bill-lines-heading"><h3>Items</h3><button type="button" className="inv-text-button" onClick={() => setItems((current) => [...current, { id: id(), stockKey: '', quantity: '', price: '' }])}><FiPlus /> Add item</button></div>
		{items.map((item) => <div className="inv-bill-line" key={item.id}><label>Product<select value={item.stockKey} onChange={(event) => updateItem(item.id, 'stockKey', event.target.value)} required><option value="">Select ready stock</option>{ready.map((entry) => <option key={entry.key} value={entry.key}>{entry.transfer.product} · {measure(entry.transfer.available, entry.transfer.unit)} available</option>)}</select></label><label>Quantity<input type="number" min="0.01" step="any" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} required /></label><label>Price / unit (₹)<input type="number" min="0" step="any" value={item.price} onChange={(event) => updateItem(item.id, 'price', event.target.value)} required /></label><strong className="inv-line-total">{money(Number(item.quantity || 0) * Number(item.price || 0))}</strong><button type="button" className="inv-icon-button inv-danger-icon" aria-label="Remove bill item" onClick={() => setItems((current) => current.length > 1 ? current.filter((entry) => entry.id !== item.id) : current)}><FiTrash2 /></button></div>)}
		{error && <p className="inv-form-error" role="alert">{error}</p>}<div className="inv-bill-total"><span>Invoice total</span><strong>{money(total)}</strong><span>Balance</span><strong>{money(Math.max(0, total - Number(paid || 0)))}</strong></div><div className="inv-form-actions"><button type="button" className="inv-button inv-button-quiet" onClick={close}>Cancel</button><button type="submit" className="inv-button inv-button-primary" disabled={!ready.length}><FiCheck /> Generate bill</button></div>
	</form></Modal>;
}

function PurchaseCard({ purchase, open }) {
	const summary = progressFor(purchase);
	return <button type="button" className="inv-purchase-card" onClick={open}><div className="inv-purchase-card-top"><div><span className="inv-eyebrow">PURCHASE #{purchase.number}</span><h3>{purchase.material}</h3></div><FiChevronRight /></div><p className="inv-purchase-supplier">{purchase.supplier} <span>·</span> {formatDate(purchase.date)}</p><div className="inv-purchase-metrics"><div><span>Purchased</span><strong>{measure(purchase.quantity, purchase.unit)}</strong></div><div><span>Purchase amount</span><strong>{money(purchase.amount)}</strong></div><div><span>Remaining</span><strong>{measure(summary.remaining, purchase.unit)}</strong></div><div><span>Current stage</span><strong>{summary.current}</strong></div></div><div className="inv-card-progress"><div><span>Progress</span><strong>{summary.percent}%</strong></div><div className="inv-progress-track"><span style={{ width: `${summary.percent}%` }} /></div><small>{summary.completed} of {purchase.stages.length} stages complete</small></div></button>;
}

function FinishedStock({ stock, toggleReady }) {
	return <div className="inv-stock-list">{stock.map(({ key, purchase, transfer }) => <article className="inv-stock-row" key={key}><div className="inv-stock-product"><div className="inv-stock-mark">{transfer.product.slice(0, 1).toUpperCase()}</div><div><strong>{transfer.product}</strong><span>From {purchase.material} purchase #{purchase.number}</span></div></div><div className="inv-stock-quantity"><span>Available</span><strong>{measure(transfer.available, transfer.unit)}</strong></div><span className={`inv-stock-pill${transfer.ready ? ' is-ready' : ''}`}>{transfer.ready ? 'Ready for sale' : 'Not ready'}</span><button type="button" className={`inv-button inv-stock-toggle${transfer.ready ? ' is-ready' : ''}`} onClick={() => toggleReady(purchase.id, transfer.id)}>{transfer.ready ? 'Mark not ready' : 'Mark ready'}</button></article>)}</div>;
}

function EmptyState({ title, message, action, onAction }) {
	return <div className="inv-empty-state"><div className="inv-empty-rule" /><h3>{title}</h3><p>{message}</p>{action && <button type="button" className="inv-button inv-button-primary" onClick={onAction}><FiPlus /> {action}</button>}</div>;
}

function InventoryPage() {
	const { employees = [] } = useERP();
	const [workflow, setWorkflow] = useState(loadWorkflow);
	const [tab, setTab] = useState('overview');
	const [purchaseId, setPurchaseId] = useState(null);
	const [purchaseOpen, setPurchaseOpen] = useState(false);
	const [saleOpen, setSaleOpen] = useState(false);
	const [billOpen, setBillOpen] = useState(false);
	const [notice, setNotice] = useState('');
	useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow)), [workflow]);

	const stock = useMemo(() => workflow.purchases.flatMap((purchase) => purchase.transfers.map((transfer) => ({ key: `${purchase.id}:${transfer.id}`, purchase, transfer }))), [workflow.purchases]);
	const selectedPurchase = workflow.purchases.find((purchase) => purchase.id === purchaseId);
	const summary = useMemo(() => ({ active: workflow.purchases.filter((purchase) => purchase.stages.some((stage) => stage.status === 'Active')).length, remaining: sumMeasures(workflow.purchases.map((purchase) => ({ quantity: progressFor(purchase).remaining, unit: purchase.unit }))), finished: sumMeasures(stock.map(({ transfer }) => ({ quantity: transfer.available, unit: transfer.unit }))), ready: sumMeasures(stock.filter((item) => item.transfer.ready).map(({ transfer }) => ({ quantity: transfer.available, unit: transfer.unit }))), progress: workflow.purchases.length ? Math.round(workflow.purchases.reduce((sum, purchase) => sum + progressFor(purchase).percent, 0) / workflow.purchases.length) : 0 }), [workflow.purchases, stock]);
	const updatePurchase = (purchase) => setWorkflow((current) => ({ ...current, purchases: current.purchases.map((item) => item.id === purchase.id ? purchase : item) }));
	const createPurchase = (values) => { const purchase = { ...values, id: id(), number: String(workflow.purchases.length + 1).padStart(3, '0'), stages: [], transfers: [] }; setWorkflow((current) => ({ ...current, purchases: [purchase, ...current.purchases] })); setPurchaseId(purchase.id); setTab('purchases'); setPurchaseOpen(false); };
	const consume = (key, amount, purchases) => purchases.map((purchase) => ({ ...purchase, transfers: purchase.transfers.map((transfer) => `${purchase.id}:${transfer.id}` === key ? { ...transfer, available: Number(transfer.available) - amount } : transfer) }));
	const saveSale = (sale) => { setWorkflow((current) => ({ ...current, purchases: consume(sale.stockKey, sale.quantity, current.purchases), sales: [{ ...sale, id: id() }, ...current.sales] })); setSaleOpen(false); setNotice('Sale recorded and stock updated.'); };
	const saveBill = (bill) => { setWorkflow((current) => { const purchases = bill.items.reduce((state, item) => consume(item.stockKey, Number(item.quantity), state), current.purchases); const invoiceNumber = `INV-${String(current.bills.length + 1).padStart(4, '0')}`; const sales = bill.items.map((item) => { const purchase = current.purchases.find((source) => source.id === item.stockKey.split(':')[0]); const total = Number(item.quantity) * Number(item.price); const paid = bill.total ? Number(bill.paid || 0) * total / bill.total : 0; const cost = purchase ? productionCost(purchase) / Number(purchase.quantity) * Number(item.quantity) : 0; return { ...item, id: id(), customer: bill.customer, date: bill.date, paid, total, balance: Math.max(0, total - paid), profit: total - cost, invoiceNumber }; }); return { ...current, purchases, bills: [{ ...bill, id: id(), invoiceNumber, balance: Math.max(0, bill.total - bill.paid) }, ...current.bills], sales: [...sales, ...current.sales] }; }); setBillOpen(false); setNotice('Bill generated and stock updated.'); };
	const toggleReady = (purchaseIdValue, transferId) => setWorkflow((current) => ({ ...current, purchases: current.purchases.map((purchase) => purchase.id !== purchaseIdValue ? purchase : { ...purchase, transfers: purchase.transfers.map((transfer) => transfer.id === transferId ? { ...transfer, ready: !transfer.ready } : transfer) }) }));
	if (selectedPurchase) return <main className="inventory-page"><PurchaseDetails purchase={selectedPurchase} employees={employees} close={() => setPurchaseId(null)} update={updatePurchase} /></main>;

	const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'purchases', label: 'Purchases', count: workflow.purchases.length }, { id: 'stock', label: 'Finished stock', count: stock.length }, { id: 'sales', label: 'Sales', count: workflow.sales.length }, { id: 'billing', label: 'Billing', count: workflow.bills.length }];
	const readyStockExists = stock.some((item) => item.transfer.ready && item.transfer.available > 0);
	return <main className="inventory-page"><header className="inv-page-header"><div><span className="inv-eyebrow">MANUFACTURING WORKFLOW</span><h1>Inventory</h1><p>Follow materials from purchase through production to sale.</p></div><div className="inv-header-actions"><button type="button" className="inv-button inv-button-secondary" onClick={() => setPurchaseOpen(true)}><FiPlus /> New purchase</button><button type="button" className="inv-button inv-button-primary" onClick={() => setPurchaseOpen(true)}><FiChevronRight /> Start progress</button></div></header>
		<section className="inv-summary-grid" aria-label="Inventory summary"><div className="inv-summary-card"><span>Active purchases</span><strong>{summary.active}</strong><small>Currently in production</small></div><div className="inv-summary-card"><span>Current progress</span><strong>{summary.progress}%</strong><small>Average stage completion</small></div><div className="inv-summary-card"><span>Remaining quantity</span><strong>{summary.remaining}</strong><small>Available to transfer</small></div><div className="inv-summary-card inv-summary-highlight"><span>Sales-ready stock</span><strong>{summary.ready}</strong><small>{summary.finished} in finished stock</small></div></section>
		<nav className="inv-tabs" aria-label="Inventory sections">{tabs.map((item) => <button type="button" key={item.id} className={tab === item.id ? 'is-selected' : ''} onClick={() => { setTab(item.id); setNotice(''); }}>{item.label}{item.count > 0 && <span>{item.count}</span>}</button>)}</nav>
		{notice && <div className="inv-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><FiX /></button></div>}
		{tab === 'overview' && <><section className="inv-workflow-strip"><div><span className="inv-eyebrow">THE PRODUCTION FLOW</span><h2>From raw material to ready stock</h2></div><div className="inv-flow-steps"><span>Purchase</span><FiChevronRight /><span>Progress stages</span><FiChevronRight /><span>Split / transfer</span><FiChevronRight /><span>Finished stock</span><FiChevronRight /><span>Sales & billing</span></div></section><section className="inv-panel inv-active-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">IN PRODUCTION</span><h2>Active purchases</h2></div><button type="button" className="inv-text-button" onClick={() => setTab('purchases')}>View all <FiChevronRight /></button></div>{workflow.purchases.length ? <div className="inv-purchase-grid">{workflow.purchases.slice(0, 4).map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} open={() => setPurchaseId(purchase.id)} />)}</div> : <EmptyState title="No purchases in progress" message="Start with a purchase. Add production stages as the material moves through your process." action="Start progress" onAction={() => setPurchaseOpen(true)} />}</section>{stock.length > 0 && <section className="inv-panel inv-overview-stock"><div className="inv-section-heading"><div><span className="inv-eyebrow">OUTPUT</span><h2>Finished stock</h2></div><button type="button" className="inv-text-button" onClick={() => setTab('stock')}>View stock <FiChevronRight /></button></div><FinishedStock stock={stock.slice(0, 3)} toggleReady={toggleReady} /></section>}</>}
		{tab === 'purchases' && <section className="inv-panel inv-section-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">SOURCE MATERIAL</span><h2>Purchases</h2><p>{workflow.purchases.length} purchase records</p></div><button type="button" className="inv-button inv-button-primary" onClick={() => setPurchaseOpen(true)}><FiPlus /> New purchase</button></div>{workflow.purchases.length ? <div className="inv-purchase-grid">{workflow.purchases.map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} open={() => setPurchaseId(purchase.id)} />)}</div> : <EmptyState title="Your purchase list is empty" message="Record the raw material and supplier to start tracking production." action="New purchase" onAction={() => setPurchaseOpen(true)} />}</section>}
		{tab === 'stock' && <section className="inv-panel inv-section-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">PROCESSED OUTPUT</span><h2>Finished stock</h2><p>Track transfer destinations and sales readiness.</p></div></div>{stock.length ? <FinishedStock stock={stock} toggleReady={toggleReady} /> : <EmptyState title="No finished stock yet" message="Open a purchase and split or transfer its available quantity into a product." />}</section>}
		{tab === 'sales' && <section className="inv-panel inv-section-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">CUSTOMER ORDERS</span><h2>Sales</h2><p>Sales reduce ready stock and keep the balance visible.</p></div><button type="button" className="inv-button inv-button-primary" onClick={() => setSaleOpen(true)} disabled={!readyStockExists}><FiPlus /> Record sale</button></div>{workflow.sales.length ? <div className="inv-record-list">{workflow.sales.map((sale) => <article className="inv-record-row" key={sale.id}><div><strong>{sale.product}</strong><span>{sale.customer} <i>·</i> {formatDate(sale.date)}</span></div><div><span>Qty</span><strong>{measure(sale.quantity, sale.unit)}</strong></div><div><span>Total</span><strong>{money(sale.total)}</strong></div><div><span>Margin</span><strong className={sale.profit >= 0 ? 'inv-positive' : 'inv-negative'}>{money(sale.profit)}</strong></div><div><span>Balance</span><strong>{money(sale.balance)}</strong></div></article>)}</div> : <EmptyState title="No sales recorded" message="Mark finished stock ready for sale, then record customer orders here." />}</section>}
		{tab === 'billing' && <section className="inv-panel inv-section-panel"><div className="inv-section-heading"><div><span className="inv-eyebrow">CUSTOMER INVOICES</span><h2>Billing</h2><p>Generate an invoice with one or more finished products.</p></div><button type="button" className="inv-button inv-button-primary" onClick={() => setBillOpen(true)} disabled={!readyStockExists}><FiPlus /> Generate bill</button></div>{workflow.bills.length ? <div className="inv-bill-list">{workflow.bills.map((bill) => <article className="inv-bill-card" key={bill.id}><div className="inv-bill-card-head"><div><span className="inv-eyebrow">{bill.invoiceNumber}</span><h3>{bill.customer}</h3><p>{formatDate(bill.date)}</p></div><button type="button" className="inv-icon-button" aria-label={`Print ${bill.invoiceNumber}`} onClick={() => window.print()}><FiPrinter /></button></div><div className="inv-bill-card-items">{bill.items.map((item, index) => <div key={`${bill.id}-${index}`}><span>{item.product} · {measure(item.quantity, item.unit)} × {money(item.price)}</span><strong>{money(Number(item.quantity) * Number(item.price))}</strong></div>)}</div><div className="inv-bill-card-total"><span>Total <strong>{money(bill.total)}</strong></span><span>Paid <strong>{money(bill.paid)}</strong></span><span>Balance <strong>{money(bill.balance)}</strong></span></div></article>)}</div> : <EmptyState title="No bills created" message="Generate a bill for a customer using sale-ready finished stock." />}</section>}
		{purchaseOpen && <PurchaseForm save={createPurchase} close={() => setPurchaseOpen(false)} />}{saleOpen && <SaleForm stock={stock} save={saveSale} close={() => setSaleOpen(false)} />}{billOpen && <BillForm stock={stock} save={saveBill} close={() => setBillOpen(false)} />}
	</main>;
}

export default InventoryPage;
