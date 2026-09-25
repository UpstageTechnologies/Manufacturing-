import { useState } from 'react';
import { FiTrendingDown, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import './Expense.css';

function ExpensePage() {
  const today = new Date().toISOString().split('T')[0];
  const { expense, addExpense, deleteExpense } = useERP();
  const [form, setForm] = useState({ title: '', amount: '', date: today });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    addExpense({ ...form, title: form.title.trim(), amount: Number(form.amount) });
    setForm({ title: '', amount: '', date: today });
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="page-title">Expense</h1>
        </div>
      </div>

      <form className="content-panel form-panel" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field-group">
            <label>Expense Name</label>
            <input type="text" placeholder="Enter expense name" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="field-group">
            <label>Amount</label>
            <input type="number" min="0" placeholder="Enter amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
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
          <FiTrendingDown />
          <div>
            <small>Total Expense</small>
            <strong>{formatCurrency(expense.reduce((total, item) => total + Number(item.amount), 0))}</strong>
          </div>
        </div>
      </div>

      <div className="content-panel">
        <div className="panel-header">
          <h3>Expense History</h3>
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
            {expense.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{formatDate(item.date)}</td>
                <td>
                  <button type="button" className="table-action danger" onClick={() => deleteExpense(item.id)}><FiTrash2 /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExpensePage;
