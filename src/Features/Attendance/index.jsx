import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiCheckCircle, FiXCircle, FiClock, FiChevronLeft, FiChevronRight, FiSave } from 'react-icons/fi';
import { formatCurrency, useERP } from '../../State/ERPContext';
import './Attendance.css';

const statusOptions = ['Present', 'Late', 'Absent'];
const salaryPeriods = ['Per Day', '7 Days / Weekly', '15 Days / Bi-weekly', 'Monthly'];

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToday = () => getDateString(new Date());

const shiftDate = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return getDateString(date);
};

function AttendancePage() {
  const { employees, attendance, saveAttendance, addEmployee, updateEmployee, deleteEmployee } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [attendanceDraft, setAttendanceDraft] = useState(() => attendance?.[getToday()] || Object.fromEntries(employees.map((employee) => [employee.id, employee.status || 'Present'])));
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
    salaryPeriod: 'Monthly',
  });

  const selectDate = (amount) => {
    const nextDate = shiftDate(selectedDate, amount);
    const defaultAttendance = Object.fromEntries(employees.map((employee) => [employee.id, employee.status || 'Present']));
    setSelectedDate(nextDate);
    setAttendanceDraft(attendance?.[nextDate] || defaultAttendance);
  };

  const handleSaveAttendance = () => {
    const records = Object.fromEntries(employees.map((employee) => [employee.id, attendanceDraft[employee.id] || employee.status || 'Present']));
    saveAttendance(selectedDate, records);
    setAttendanceDraft(records);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.salary) return;

    const newEmployee = {
      name: form.name,
      address: form.address || 'Not provided',
      phone: form.phone,
      salary: Number(form.salary),
      salaryPeriod: form.salaryPeriod,
      status: 'Present',
    };

    if (editingId) updateEmployee(editingId, newEmployee);
    else addEmployee(newEmployee);
    setForm({ name: '', address: '', phone: '', salary: '', salaryPeriod: 'Monthly' });
    setEditingId(null);
    setIsOpen(false);
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1 className="page-title">Attendance</h1>
        </div>
        <div className="attendance-date-controls">
          <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
            <FiPlus /> Add Employee
          </button>
          <button type="button" className="secondary-button" aria-label="Previous date" onClick={() => selectDate(-1)}><FiChevronLeft /></button>
          <strong>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
          <button type="button" className="secondary-button" aria-label="Next date" onClick={() => selectDate(1)}><FiChevronRight /></button>
        </div>
      </div>

      <div className="content-panel">
        <div className="panel-header">
          <h3>Employee List</h3>
          <button type="button" className="primary-button" onClick={handleSaveAttendance}>
            <FiSave /> Save Attendance
          </button>
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
                <td>{formatCurrency(employee.salary)}</td>
                <td>
                  <div className="attendance-status-actions" role="group" aria-label={`Attendance status for ${employee.name}`}>
                    {statusOptions.map((status) => {
                      const StatusIcon = status === 'Present' ? FiCheckCircle : status === 'Absent' ? FiXCircle : FiClock;
                      return (
                        <button
                          key={status}
                          type="button"
                          className={`attendance-status-button ${status.toLowerCase()}${attendanceDraft[employee.id] === status ? ' selected' : ''}`}
                          aria-label={`${status} for ${employee.name}`}
                          aria-pressed={attendanceDraft[employee.id] === status}
                          onClick={() => setAttendanceDraft((draft) => ({ ...draft, [employee.id]: status }))}
                        >
                          <StatusIcon />
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <div className="table-actions compact">
                    <button type="button" className="table-action icon-action" aria-label="Edit employee" onClick={() => { setEditingId(employee.id); setForm({ name: employee.name, address: employee.address, phone: employee.phone, salary: employee.salary, salaryPeriod: employee.salaryPeriod || 'Monthly' }); setIsOpen(true); }}>
                      <FiEdit2 />
                    </button>
                    <button type="button" className="table-action icon-action danger" aria-label="Delete employee" onClick={() => deleteEmployee(employee.id)}>
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
              <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" className="modal-close" onClick={() => { setIsOpen(false); setEditingId(null); }}>×</button>
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
                  <span className="currency-symbol">₹</span>
                  <input type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="35000" />
                </div>
              </div>

              <div className="field-group">
                <label>Salary Payment Period</label>
                <select name="salaryPeriod" value={form.salaryPeriod} onChange={handleChange}>
                  {salaryPeriods.map((period) => <option key={period} value={period}>{period}</option>)}
                </select>
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
