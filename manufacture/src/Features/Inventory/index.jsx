import { FiBox, FiDownload, FiFilter, FiPlus, FiSearch, FiTrendingDown } from 'react-icons/fi';
import './Inventory.css';

const inventoryData = [
  { item: 'Steel Rods', qty: 120, price: '₹ 890/unit', status: 'In Stock', tone: 'good' },
  { item: 'Cement Bags', qty: 75, price: '₹ 340/unit', status: 'Low Stock', tone: 'warning' },
  { item: 'Electrical Wires', qty: 210, price: '₹ 180/unit', status: 'In Stock', tone: 'good' },
  { item: 'Paint Buckets', qty: 18, price: '₹ 620/unit', status: 'Critical', tone: 'danger' },
];

const inventoryCards = [
  { title: 'Raw Materials', value: '1,240', icon: FiBox },
  { title: 'Products', value: '438', icon: FiBox },
  { title: 'Manufacturing', value: '96%', icon: FiTrendingDown },
  { title: 'Stock', value: '8,900', icon: FiDownload },
  { title: 'Low Stock', value: '14', icon: FiFilter },
];

function InventoryPage() {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Warehouse</p>
          <h1 className="page-title">Inventory</h1>
        </div>
        <button type="button" className="primary-button">
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
            <input type="text" placeholder="Search inventory" />
          </div>
          <button type="button" className="secondary-button">Filter</button>
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
            {inventoryData.map((item) => (
              <tr key={item.item}>
                <td>{item.item}</td>
                <td>{item.qty}</td>
                <td>{item.price}</td>
                <td>
                  <span className={`status-badge ${item.tone}`}>{item.status}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="table-action">Edit</button>
                    <button type="button" className="table-action danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryPage;
