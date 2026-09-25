import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import './Income.css';

function IncomePage() {
  const today = new Date().toISOString().split('T')[0];
  const { income, addIncome, deleteIncome } = useERP();
  const [form, setForm] = useState({ title: '', amount: '', date: today });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    addIncome({ ...form, title: form.title.trim(), amount: Number(form.amount) });
    setForm({ title: '', amount: '', date: today });
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Income</h1>
        </div>
      </div>

      <form className="content-panel form-panel" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field-group">
            <label>Income Name</label>
            <input type="text" placeholder="Sales revenue" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="field-group">
            <label>Amount</label>
            <input type="number" min="0" placeholder="Enter Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button">Save</button>
        </div>
      </form>

      <div className="stats-row">
        <div className="mini-stat">
          <span className="currency-symbol" aria-label="Indian Rupee symbol">₹</span>
          <div>
            <small>Total Income</small>
            <strong>{formatCurrency(income.reduce((total, item) => total + Number(item.amount), 0))}</strong>
          </div>
        </div>
      </div>

      <div className="content-panel">
        <div className="panel-header">
          <h3>Income History</h3>
        </div>

        <table className="erp-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {income.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{formatDate(item.date)}</td>
                <td>
                  <button type="button" className="table-action danger" onClick={() => deleteIncome(item.id)}><FiTrash2 /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IncomePage;
