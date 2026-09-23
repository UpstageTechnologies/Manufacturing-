import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiDollarSign } from 'react-icons/fi';
import './Attendance.css';

const initialEmployees = [
  { id: 1, name: 'Alicia Smith', address: '32 Oak Avenue', phone: '+1 245 678 9023', salary: '₹ 35,000', status: 'Present' },
  { id: 2, name: 'Samuel Lee', address: '12 Maple Road', phone: '+1 245 900 7745', salary: '₹ 42,500', status: 'Late' },
  { id: 3, name: 'Ritika Shah', address: '7 Pine Lane', phone: '+1 245 812 6630', salary: '₹ 28,800', status: 'Absent' },
];

const statusOptions = ['Present', 'Late', 'Absent'];

function AttendancePage() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.salary) return;

    const newEmployee = {
      id: Date.now(),
      name: form.name,
      address: form.address || 'Not provided',
      phone: form.phone,
      salary: `₹ ${Number(form.salary).toLocaleString('en-IN')}`,
      status: 'Present',
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    setForm({ name: '', address: '', phone: '', salary: '' });
    setIsOpen(false);
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1 className="page-title">Attendance</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
          <FiPlus /> Add Employee
        </button>
      </div>

      <div className="content-panel">
        <div className="panel-header">
          <h3>Employee List</h3>
        </div>

        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Address</th>
              <th>Mobile</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.address}</td>
                <td>{employee.phone}</td>
                <td>{employee.salary}</td>
                <td>
                  <select defaultValue={employee.status} className="status-select">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="table-actions compact">
                    <button type="button" className="table-action icon-action" aria-label="Edit employee">
                      <FiEdit2 />
                    </button>
                    <button type="button" className="table-action icon-action danger" aria-label="Delete employee">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Employee</h3>
              <button type="button" className="modal-close" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label>Employee Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Smith" />
              </div>

              <div className="field-group">
                <label>Address</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="123 Main Street" />
              </div>

              <div className="field-group">
                <label>Mobile Number</label>
                <div className="input-with-icon">
                  <FiPhone />
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 245 678 9012" />
                </div>
              </div>

              <div className="field-group">
                <label>Salary</label>
                <div className="input-with-icon">
                  <FiDollarSign />
                  <input type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="35000" />
                </div>
              </div>

              <button type="submit" className="primary-button full-width">Save Employee</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendancePage;
