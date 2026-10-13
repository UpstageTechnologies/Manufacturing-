import { useState } from 'react';
import { FiArrowDown, FiArrowUp, FiEdit2, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';
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
const defaultSort = { key: 'date', direction: 'desc' };
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

const entryType = (entry) => (
  entry.expenseType || (entry.category === 'Inventory' ? entry.inventoryCategory || 'Inventory' : '—')
);

const compareValues = (first, second, key, direction) => {
  const firstEmpty = first == null || first === '';
  const secondEmpty = second == null || second === '';
  if (firstEmpty || secondEmpty) return firstEmpty === secondEmpty ? 0 : firstEmpty ? 1 : -1;

  let comparison;
  if (key === 'amount') {
    comparison = Number(first) - Number(second);
  } else {
    comparison = String(first).localeCompare(String(second), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }
  return direction === 'asc' ? comparison : -comparison;
};

function JournalEntryPage() {
  const user = getCurrentUser();
  const { journalEntries, employees, saveJournalEntry, deleteJournalEntry } = useERP();
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState(null);
  const availableCategories = categories.filter((category) => (
    category === 'Expense'
      ? canAccessJournalCategory(user?.role, category, 'Salary')
        || canAccessJournalCategory(user?.role, category, 'Other Expenses')
      : canAccessJournalCategory(user?.role, category)
  ));
  const availableExpenseTypes = expenseTypes.filter((type) => canAccessJournalCategory(user?.role, 'Expense', type));
  const visibleEntries = journalEntries
    .filter((entry) => canAccessJournalCategory(user?.role, entry.category, entry.expenseType))
    .filter((entry) => !categoryFilter || entry.category === categoryFilter)
    .filter((entry) => {
      const query = searchTerm.trim().toLocaleLowerCase();
      if (!query) return true;
      return [
        entry.date,
        formatDate(entry.date),
        entry.title,
        entry.category,
        entryType(entry),
        entry.amount,
        formatCurrency(entry.amount),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query));
    });
  const activeSort = sort || defaultSort;
  const sortedEntries = visibleEntries
    .map((entry, index) => ({ entry, index }))
    .sort((first, second) => (
      compareValues(
        activeSort.key === 'type' ? entryType(first.entry) : first.entry[activeSort.key],
        activeSort.key === 'type' ? entryType(second.entry) : second.entry[activeSort.key],
        activeSort.key,
        activeSort.direction,
      )
      || first.index - second.index
    ))
    .map(({ entry }) => entry);

  const handleSort = (key) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const sortHeader = (key, label) => {
    const active = sort?.key === key;
    const direction = active ? sort.direction : '';
    const Icon = active
      ? direction === 'asc' ? FiArrowUp : FiArrowDown
      : FiMoreHorizontal;
    return (
      <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className="journal-sort-button"
          onClick={() => handleSort(key)}
          aria-label={`Sort by ${label}${active ? `, currently ${direction}` : ''}`}
        >
          {label}<Icon aria-hidden="true" />
        </button>
      </th>
    );
  };

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
        <div className="journal-table-filters">
          <label>
            <span>Search entries</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search date, description, type, amount..."
            />
          </label>
          <label>
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
        </div>
        <div className="journal-table-scroll">
          <table className="erp-table">
            <thead>
              <tr>
                {sortHeader('date', 'Date')}
                {sortHeader('title', 'Description')}
                {sortHeader('category', 'Category')}
                {sortHeader('type', 'Type')}
                {sortHeader('amount', 'Amount')}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.length ? sortedEntries.map((entry) => {
                const canManage = canAccessJournalCategory(user?.role, entry.category, entry.expenseType);
                return (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{entry.title}</td>
                    <td>{entry.category}</td>
                    <td>{entryType(entry)}</td>
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
              }) : <tr><td colSpan="6" className="journal-empty">
                {searchTerm || categoryFilter ? 'No entries match your search or category filter.' : 'No journal entries yet.'}
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default JournalEntryPage;
