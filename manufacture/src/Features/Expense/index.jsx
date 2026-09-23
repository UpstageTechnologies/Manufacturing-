import { FiPlus, FiTrendingDown } from 'react-icons/fi';
import './Expense.css';

const expenseData = [
  { title: 'Raw Materials', amount: '₹ 38,500', date: '12 Jun 2026' },
  { title: 'Logistics', amount: '₹ 15,200', date: '10 Jun 2026' },
  { title: 'Marketing', amount: '₹ 11,400', date: '08 Jun 2026' },
];

function ExpensePage() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="page-title">Expense</h1>
        </div>
        <button type="button" className="primary-button">
          <FiPlus /> Add Expense
        </button>
      </div>

      <div className="content-panel form-panel">
        <div className="field-grid">
          <div className="field-group">
            <label>Expense Name</label>
            <input type="text" placeholder="Purchase order" />
          </div>
          <div className="field-group">
            <label>Amount</label>
            <input type="number" placeholder="5000" />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input type="date" defaultValue={today} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="primary-button">Save</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat">
          <FiTrendingDown />
          <div>
            <small>Total Expense</small>
            <strong>₹ 65,100</strong>
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
            {expenseData.map((item) => (
              <tr key={item.title}>
                <td>{item.title}</td>
                <td>{item.amount}</td>
                <td>{item.date}</td>
                <td>
                  <button type="button" className="table-action">View</button>
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
