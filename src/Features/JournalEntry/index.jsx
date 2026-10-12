import { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import {
  canAccessJournalCategory,
  getCurrentUser,
} from '../../State/auth';
import './JournalEntry.css';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const categories = ['Income', 'Expense', 'Inventory'];
const expenseTypes = ['Salary', 'Other Expenses'];
const blankForm = () => ({
  date: today(),
  title: '',
  category: '',
  amount: '',
  expenseType: '',
  employee: '',
  inventoryItem: '',
  quantity: '',
  inventoryCategory: '',
});

function JournalEntryPage() {
  const user = getCurrentUser();
  const { journalEntries, employees, saveJournalEntry, deleteJournalEntry } = useERP();
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const availableCategories = categories.filter((category) => (
    category === 'Expense'
      ? canAccessJournalCategory(user?.role, category, 'Salary')
        || canAccessJournalCategory(user?.role, category, 'Other Expenses')
      : canAccessJournalCategory(user?.role, category)
  ));
  const availableExpenseTypes = expenseTypes.filter((type) => canAccessJournalCategory(user?.role, 'Expense', type));
  const sortedEntries = journalEntries
    .filter((entry) => canAccessJournalCategory(user?.role, entry.category, entry.expenseType))
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleCategoryChange = (category) => {
    setForm((current) => ({
      ...current,
      category,
      expenseType: '',
      employee: '',
      inventoryItem: '',
      quantity: '',
      inventoryCategory: '',
    }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      saveJournalEntry(form, editingId);
      setForm(blankForm());
      setEditingId(null);
      setMessage(editingId ? 'Journal entry updated.' : 'Journal entry saved.');
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const startEditing = (entry) => {
    setForm({
      ...blankForm(),
      ...entry,
      amount: String(entry.amount),
      quantity: entry.quantity == null ? '' : String(entry.quantity),
    });
    setEditingId(entry.id);
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (entry) => {
    if (!window.confirm('Delete this journal entry and its linked module record?')) return;
    try {
      deleteJournalEntry(entry.id);
      if (editingId === entry.id) {
        setEditingId(null);
        setForm(blankForm());
      }
      setError('');
      setMessage('Journal entry deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="feature-page journal-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Finance &amp; Operations</p>
          <h1 className="page-title">Journal Entry</h1>
        </div>
      </div>

      <form className="content-panel form-panel journal-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field-group">
            <label htmlFor="journal-date">Date</label>
            <input id="journal-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </div>
          <div className="field-group">
            <label htmlFor="journal-title">Entry Details</label>
            <input id="journal-title" type="text" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Transaction name or description" required />
          </div>
          <div className="field-group">
            <label htmlFor="journal-category">Category</label>
            <select id="journal-category" value={form.category} onChange={(event) => handleCategoryChange(event.target.value)} required>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category} disabled={!availableCategories.includes(category)}>{category}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="journal-amount">Amount (₹)</label>
            <input id="journal-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Enter amount" required />
          </div>

          {form.category === 'Expense' && (
            <div className="field-group">
              <label htmlFor="journal-expense-type">Expense Type</label>
              <select id="journal-expense-type" value={form.expenseType} onChange={(event) => setForm({ ...form, expenseType: event.target.value, employee: '' })} required>
                <option value="">Select expense type</option>
                {availableExpenseTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          )}

          {form.category === 'Expense' && form.expenseType === 'Salary' && (
            <div className="field-group">
              <label htmlFor="journal-employee">Employee</label>
              <select id="journal-employee" value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })} required>
                <option value="">Select employee</option>
                {employees.map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}
              </select>
            </div>
          )}

          {form.category === 'Inventory' && (
            <>
              <div className="field-group">
                <label htmlFor="journal-item">Inventory Item</label>
                <input id="journal-item" type="text" value={form.inventoryItem} onChange={(event) => setForm({ ...form, inventoryItem: event.target.value })} placeholder="Item name" required />
              </div>
              <div className="field-group">
                <label htmlFor="journal-quantity">Quantity</label>
                <input id="journal-quantity" type="number" min="0.01" step="any" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
              </div>
              <div className="field-group">
                <label htmlFor="journal-inventory-category">Inventory Type</label>
                <input id="journal-inventory-category" type="text" value={form.inventoryCategory} onChange={(event) => setForm({ ...form, inventoryCategory: event.target.value })} placeholder="e.g. Raw Materials" />
              </div>
            </>
          )}
        </div>
        {error && <p role="alert" className="auth-error journal-feedback">{error}</p>}
        {message && <p role="status" className="journal-success">{message}</p>}
        <div className="form-actions">
          <button type="submit" className="primary-button">{editingId ? 'Update Entry' : 'Save Entry'}</button>
          {editingId && <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setForm(blankForm()); setError(''); }}>Cancel Edit</button>}
        </div>
      </form>

      <div className="content-panel journal-table-panel">
        <div className="panel-header"><h3>Saved Entries</h3></div>
        <div className="journal-table-scroll">
          <table className="erp-table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {sortedEntries.length ? sortedEntries.map((entry) => {
                const canManage = canAccessJournalCategory(user?.role, entry.category, entry.expenseType);
                return (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{entry.title}</td>
                    <td>{entry.category}</td>
                    <td>{entry.expenseType || (entry.category === 'Inventory' ? entry.inventoryCategory || 'Inventory' : '—')}</td>
                    <td>{formatCurrency(entry.amount)}</td>
                    <td>
                      {canManage ? (
                        <div className="table-actions compact">
                          <button type="button" className="table-action" aria-label={`Edit ${entry.title}`} onClick={() => startEditing(entry)}><FiEdit2 /> Edit</button>
                          <button type="button" className="table-action danger" aria-label={`Delete ${entry.title}`} onClick={() => handleDelete(entry)}><FiTrash2 /> Delete</button>
                        </div>
                      ) : <span>View only</span>}
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="6" className="journal-empty">No journal entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default JournalEntryPage;
