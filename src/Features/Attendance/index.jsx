import { useState } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiSave,
  FiSun,
  FiMinus,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { formatCurrency, useERP } from '../../State/ERPContext';
import './Attendance.css';

const statusOptions = [
  { value: 'Present', icon: FiCheckCircle, className: 'present' },
  { value: 'Late', icon: FiClock, className: 'late' },
  { value: 'Absent', icon: FiXCircle, className: 'absent' },
  { value: 'Not Marked', icon: FiMinus, className: 'not-marked' },
];
const salaryPeriods = ['Per Day', '7 Days / Weekly', '15 Days / Bi-weekly', 'Monthly'];

const getDateString = (date = new Date()) => {
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
  const {
    employees,
    attendance,
    holidays = {},
    saveAttendance,
    setCompanyHoliday,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [attendanceDraft, setAttendanceDraft] = useState(() => attendance?.[getToday()] || {});
  const [openStatusId, setOpenStatusId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [attendanceFeedback, setAttendanceFeedback] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
    salaryPeriod: 'Monthly',
  });

  const selectDate = (amount) => {
    const nextDate = shiftDate(selectedDate, amount);
    setSelectedDate(nextDate);
    setAttendanceDraft(attendance?.[nextDate] || {});
    setOpenStatusId(null);
    setAttendanceFeedback({ type: '', text: '' });
  };

  const handleDateChange = (event) => {
    const nextDate = event.target.value;
    if (!nextDate) return;
    setSelectedDate(nextDate);
    setAttendanceDraft(attendance?.[nextDate] || {});
    setOpenStatusId(null);
    setAttendanceFeedback({ type: '', text: '' });
  };

  const handleSaveAttendance = () => {
    const records = Object.fromEntries(employees
      .filter((employee) => statusOptions.some(({ value }) => attendanceDraft[employee.id] === value))
      .map((employee) => [employee.id, attendanceDraft[employee.id]]));
    try {
      saveAttendance(selectedDate, records);
      setAttendanceDraft((previous) => ({ ...previous, ...records }));
      setAttendanceFeedback({ type: 'success', text: 'Attendance saved successfully.' });
    } catch (error) {
      setAttendanceFeedback({
        type: 'error',
        text: error.message || 'Unable to save attendance. Please try again.',
      });
    }
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
    };

    if (editingId) updateEmployee(editingId, newEmployee);
    else addEmployee(newEmployee);
    setForm({ name: '', address: '', phone: '', salary: '', salaryPeriod: 'Monthly' });
    setEditingId(null);
    setIsOpen(false);
  };

  const isHoliday = Boolean(holidays[selectedDate]);
  const departments = [...new Set(employees
    .map((employee) => employee.department || employee.departmentName)
    .filter(Boolean)
    .map(String))];
  const filteredEmployees = employees.filter((employee) => {
    const department = String(employee.department || employee.departmentName || '');
    const searchText = [
      employee.id,
      employee.name,
      employee.phone,
      employee.address,
    ].join(' ').toLowerCase();
    return searchText.includes(searchQuery.trim().toLowerCase())
      && (!departmentFilter || department === departmentFilter);
  });
  const attendanceCounts = employees.reduce((counts, employee) => {
    const status = attendanceDraft[employee.id];
    if (status === 'Present' || status === 'Late' || status === 'Absent') {
      counts[status] += 1;
    }
    return counts;
  }, { Present: 0, Late: 0, Absent: 0 });

  return (
    <div className="feature-page attendance-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1 className="page-title">Attendance</h1>
          <span className="attendance-shift-indicator"><span /> Single Shift</span>
        </div>
        <div className="attendance-date-controls">
          <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
            <FiPlus /> Add Employee
          </button>
          <button type="button" className="secondary-button" aria-label="Previous date" onClick={() => selectDate(-1)}><FiChevronLeft /></button>
          <input
            className="attendance-date-input"
            type="date"
            aria-label="Attendance date"
            value={selectedDate}
            onChange={handleDateChange}
          />
          <button type="button" className="secondary-button" aria-label="Next date" onClick={() => selectDate(1)}><FiChevronRight /></button>
          <button
            type="button"
            className={`secondary-button attendance-holiday-button${isHoliday ? ' selected' : ''}`}
            aria-pressed={isHoliday}
            onClick={() => setCompanyHoliday(selectedDate, !isHoliday)}
          >
            <FiSun /> {isHoliday ? 'Holiday' : 'Mark Holiday'}
          </button>
        </div>
      </div>

      <section className="attendance-summary-grid" aria-label="Attendance summary">
        <article className="attendance-summary-card total">
          <span className="attendance-summary-icon"><FiUsers /></span>
          <div><span>Total Employees</span><strong>{employees.length}</strong></div>
        </article>
        <article className="attendance-summary-card present">
          <span className="attendance-summary-icon"><FiCheckCircle /></span>
          <div><span>Present</span><strong>{attendanceCounts.Present}</strong></div>
        </article>
        <article className="attendance-summary-card late">
          <span className="attendance-summary-icon"><FiClock /></span>
          <div><span>Late</span><strong>{attendanceCounts.Late}</strong></div>
        </article>
        <article className="attendance-summary-card absent">
          <span className="attendance-summary-icon"><FiXCircle /></span>
          <div><span>Absent</span><strong>{attendanceCounts.Absent}</strong></div>
        </article>
      </section>

      <div className="content-panel attendance-panel">
        <div className="panel-header">
          <div>
            <h3>Employee Attendance</h3>
            {isHoliday && <p className="attendance-holiday-status" role="status"><FiSun /> Company holiday — attendance statuses are unchanged.</p>}
          </div>
        </div>

        <div className="attendance-table-tools">
          <label className="attendance-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              aria-label="Search employees"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          {departments.length > 0 && (
            <label className="attendance-department-filter">
              <span className="sr-only">Filter by department</span>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All departments</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="attendance-table-scroll">
          <table className="erp-table attendance-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Mobile Number</th>
                <th>Address</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const status = attendanceDraft[employee.id] || 'Not Marked';
                const selectedStatus = statusOptions.find((option) => option.value === status) || statusOptions[3];
                const CurrentStatusIcon = selectedStatus.icon;
                return (
                  <tr key={employee.id}>
                    <td className="attendance-id-cell">{employee.id}</td>
                    <td className="attendance-name-cell">{employee.name}</td>
                    <td>{employee.phone}</td>
                    <td>{employee.address || 'Not provided'}</td>
                    <td>{formatCurrency(employee.salary)}</td>
                    <td>
                      <div className="attendance-status-picker">
                        <button
                          type="button"
                          className={`attendance-status-button ${selectedStatus.className}`}
                          aria-label={`${status} attendance for ${employee.name}`}
                          aria-expanded={openStatusId === employee.id}
                          aria-haspopup="true"
                          disabled={isHoliday}
                          onClick={() => setOpenStatusId((current) => current === employee.id ? null : employee.id)}
                        >
                          <CurrentStatusIcon aria-hidden="true" />
                        </button>
                        {openStatusId === employee.id && (
                          <div className="attendance-status-menu" role="group" aria-label={`Choose attendance status for ${employee.name}`}>
                            {statusOptions.map(({ value, icon: StatusIcon, className }) => (
                              <button
                                key={value}
                                type="button"
                                className={`attendance-status-button ${className}${status === value ? ' selected' : ''}`}
                                aria-label={`${value} for ${employee.name}`}
                                aria-pressed={status === value}
                                onClick={() => {
                                  setAttendanceDraft((draft) => ({ ...draft, [employee.id]: value }));
                                  setOpenStatusId(null);
                                  setAttendanceFeedback({ type: '', text: '' });
                                }}
                              >
                                <StatusIcon aria-hidden="true" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions compact attendance-row-actions">
                        <button type="button" className="table-action icon-action attendance-edit-action" aria-label={`Edit ${employee.name}`} title="Edit employee" onClick={() => { setEditingId(employee.id); setForm({ name: employee.name, address: employee.address, phone: employee.phone, salary: employee.salary, salaryPeriod: employee.salaryPeriod || 'Monthly' }); setIsOpen(true); }}>
                          <FiEdit2 />
                        </button>
                        <button type="button" className="table-action icon-action danger" aria-label={`Delete ${employee.name}`} onClick={() => deleteEmployee(employee.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr><td className="attendance-empty-state" colSpan="7">No employees match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {attendanceFeedback.text && (
          <p className={`attendance-feedback ${attendanceFeedback.type}`} role={attendanceFeedback.type === 'error' ? 'alert' : 'status'}>
            {attendanceFeedback.text}
          </p>
        )}
        <div className="attendance-save-row">
          <button type="button" className="primary-button attendance-save-button" onClick={handleSaveAttendance}>
            <FiSave /> Save Attendance
          </button>
        </div>
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
