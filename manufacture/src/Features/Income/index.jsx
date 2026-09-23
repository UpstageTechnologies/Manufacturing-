import { FiPlus, FiDollarSign } from 'react-icons/fi';
import './Income.css';

const incomeData = [
  { title: 'Product Sales', amount: '₹ 52,000', date: '12 Jun 2026' },
  { title: 'Consulting', amount: '₹ 18,900', date: '09 Jun 2026' },
  { title: 'Rental Income', amount: '₹ 12,500', date: '06 Jun 2026' },
];

function IncomePage() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Income</h1>
        </div>
        <button type="button" className="primary-button">
          <FiPlus /> Add Income
        </button>
      </div>

      <div className="content-panel form-panel">
        <div className="field-grid">
          <div className="field-group">
            <label>Income Name</label>
            <input type="text" placeholder="Sales revenue" />
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
          <FiDollarSign />
          <div>
            <small>Total Income</small>
            <strong>₹ 83,400</strong>
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
            {incomeData.map((item) => (
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

export default IncomePage;
