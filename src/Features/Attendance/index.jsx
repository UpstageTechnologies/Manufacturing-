import { useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { useERP } from '../../State/ERPContext';
import './Attendance.css';

const attendanceStatuses = ['Present', 'Absent', 'Late', 'Leave'];
const standardWorkingHours = 8;
const salaryPeriods = ['Per Day', '7 Days / Weekly', '15 Days / Bi-weekly', 'Monthly'];

const getDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getAttendanceValues(record) {
  const savedStatus = typeof record === 'string' ? record : record?.status || '';
  const status = savedStatus === 'Not Marked' ? '' : savedStatus;
  if (status === 'Absent' || status === 'Leave') {
    return { status, inTime: '', outTime: '', workingHours: 0, overtimeHours: 0 };
  }

  const inTime = record?.inTime || '';
  const outTime = record?.outTime || '';
  let workingHours = 0;
  if (/^\d{2}:\d{2}$/.test(inTime) && /^\d{2}:\d{2}$/.test(outTime)) {
    const [inHour, inMinute] = inTime.split(':').map(Number);
    const [outHour, outMinute] = outTime.split(':').map(Number);
    const startMinutes = inHour * 60 + inMinute;
    let endMinutes = outHour * 60 + outMinute;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    workingHours = Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
  }
  return {
    status,
    inTime,
    outTime,
    workingHours,
    overtimeHours: Math.max(0, Math.round((workingHours - standardWorkingHours) * 100) / 100),
  };
}

function AttendancePage() {
  const {
    employees = [],
    attendance = {},
    attendanceLoading = false,
    attendanceError = '',
    addEmployee,
    updateEmployee,
    deleteEmployee,
    saveAttendance,
  } = useERP();
  const [selectedDate, setSelectedDate] = useState(getDateString);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newLine, setNewLine] = useState(null);
  const [draftRows, setDraftRows] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
    salaryPeriod: 'Monthly',
  });

  const dayRecords = attendance?.[selectedDate] || {};
  const rows = employees
    .filter((employee) => !newLine || String(employee.id) !== String(newLine.employeeId))
    .map((employee) => {
      const saved = getAttendanceValues(dayRecords[employee.id]);
      return {
        ...employee,
        ...saved,
        employeeId: employee.id,
        employeeName: employee.name,
        mobileNumber: employee.phone || '',
        remarks: typeof dayRecords[employee.id] === 'object'
          ? dayRecords[employee.id]?.remarks || ''
          : '',
        id: String(employee.id),
        isNew: false,
      };
    });
  if (newLine) {
    const employee = employees.find((item) => String(item.id) === String(newLine.employeeId));
    rows.push({
      ...newLine,
      employeeId: employee?.id || '',
      employeeName: employee?.name || '',
      mobileNumber: employee?.phone || '',
      id: 'new-attendance-line',
      isNew: true,
    });
  }

  const visibleRows = rows
    .map((row) => ({ ...row, ...(row.isNew ? {} : draftRows[row.id]) }))
    .filter((row) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || [
        row.employeeId,
        row.employeeName,
        row.mobileNumber,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesStatus = !statusFilter
        || (statusFilter === 'Unmarked' ? !row.status : row.status === statusFilter);
      return matchesSearch && matchesStatus;
    });

  const counts = rows.reduce((result, row) => {
    if (attendanceStatuses.includes(row.status)) result[row.status] += 1;
    return result;
  }, { Present: 0, Absent: 0, Late: 0, Leave: 0 });

  const changeDate = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setDraftRows({});
    setNewLine(null);
    setFeedback({ type: '', text: '' });
  };

  const saveRow = async (row) => {
    const employeeId = row.employeeId;
    if (employeeId === '' || employeeId == null || !row.status) return;
    if (attendanceLoading || attendanceError) {
      setFeedback({
        type: 'error',
        text: attendanceError || 'Attendance is still loading. Please wait before saving.',
      });
      return;
    }
    const employee = employees.find((item) => String(item.id) === String(employeeId));
    if (!employee) {
      setFeedback({ type: 'error', text: 'Select a registered employee before saving attendance.' });
      return;
    }

    const isNew = row.isNew;
    if (isNew && dayRecords[employee.id]) {
      setFeedback({ type: 'error', text: `${employee.name} already has an attendance record for this date.` });
      return;
    }
    const values = getAttendanceValues(row);
    const record = {
      status: values.status,
      inTime: values.inTime,
      outTime: values.outTime,
      workingHours: values.workingHours,
      overtimeHours: values.overtimeHours,
      remarks: row.remarks || '',
    };

    try {
      setIsSaving(true);
      await saveAttendance(selectedDate, { [employee.id]: record });
      if (isNew) setNewLine(null);
      else {
        setDraftRows((previous) => {
          const next = { ...previous };
          delete next[row.id];
          return next;
        });
      }
      setFeedback({ type: 'success', text: `Attendance saved for ${employee.name}.` });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to save attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllAttendance = async () => {
    if (attendanceLoading || attendanceError) {
      setFeedback({
        type: 'error',
        text: attendanceError || 'Attendance is still loading. Please wait before saving.',
      });
      return;
    }

    const changedRows = rows
      .filter((row) => row.isNew ? Boolean(newLine) : Boolean(draftRows[row.id]))
      .map((row) => ({ ...row, ...(row.isNew ? newLine : draftRows[row.id]) }));
    const records = {};
    for (const row of changedRows) {
      if (!row.status) {
        setFeedback({ type: 'error', text: `Choose an attendance status for ${row.employeeName || 'the new employee'} before saving.` });
        return;
      }
      if (row.isNew && dayRecords[row.employeeId]) {
        setFeedback({ type: 'error', text: `${row.employeeName} already has an attendance record for this date.` });
        return;
      }
      const values = getAttendanceValues(row);
      records[row.employeeId] = {
        status: values.status,
        inTime: values.inTime,
        outTime: values.outTime,
        workingHours: values.workingHours,
        overtimeHours: values.overtimeHours,
        remarks: row.remarks || '',
      };
    }
    if (Object.keys(records).length === 0) return;

    setIsSaving(true);
    try {
      await saveAttendance(selectedDate, records);
      setDraftRows((previous) => {
        const next = { ...previous };
        changedRows.filter((row) => !row.isNew).forEach((row) => delete next[row.id]);
        return next;
      });
      if (changedRows.some((row) => row.isNew)) setNewLine(null);
      setFeedback({
        type: 'success',
        text: `Attendance saved for ${changedRows.length} employee${changedRows.length === 1 ? '' : 's'} on ${selectedDate}.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to save attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateRow = (row, field, value) => {
    setFeedback({ type: '', text: '' });
    if (row.isNew) {
      setNewLine((current) => ({ ...current, [field]: value }));
      return;
    }
    setDraftRows((current) => ({
      ...current,
      [row.id]: { ...current[row.id], [field]: value },
    }));
  };

  const openEmployeeForm = (employee = null) => {
    setEditingEmployee(employee);
    setIsEmployeeFormOpen(true);
    setEmployeeForm(employee ? {
      name: employee.name || '',
      address: employee.address || '',
      phone: employee.phone || '',
      salary: employee.salary ?? '',
      salaryPeriod: employee.salaryPeriod || 'Monthly',
    } : {
      name: '',
      address: '',
      phone: '',
      salary: '',
      salaryPeriod: 'Monthly',
    });
  };

  const saveEmployee = (event) => {
    event.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.phone.trim() || !employeeForm.salary) return;
    const employee = {
      ...employeeForm,
      name: employeeForm.name.trim(),
      phone: employeeForm.phone.trim(),
      salary: Number(employeeForm.salary),
      address: employeeForm.address || 'Not provided',
    };
    try {
      if (editingEmployee) updateEmployee(editingEmployee.id, employee);
      else addEmployee(employee);
      setIsEmployeeFormOpen(false);
      setEditingEmployee(null);
      setFeedback({ type: 'success', text: 'Employee details saved.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to save employee details.' });
    }
  };

  const addLine = () => {
    if (newLine) return;
    setNewLine({
      employeeId: '',
      status: 'Present',
      inTime: '',
      outTime: '',
      remarks: '',
    });
    setFeedback({ type: '', text: '' });
  };

  return (
    <div className="feature-page attendance-page">
      <div className="feature-header attendance-register-header">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1 className="page-title">Employee Attendance Register</h1>
          <p className="attendance-register-subtitle">Daily time, attendance and overtime tracking</p>
        </div>
        <div className="attendance-register-controls">
          <label>
            <span>Date</span>
            <input
              className="attendance-date-input"
              type="date"
              aria-label="Attendance date"
              value={selectedDate}
              onChange={(event) => changeDate(event.target.value)}
            />
          </label>
          <label>
            <span>Month filter</span>
            <input
              className="attendance-date-input"
              type="month"
              aria-label="Attendance month filter"
              value={selectedDate.slice(0, 7)}
              onChange={(event) => changeDate(event.target.value ? `${event.target.value}-01` : selectedDate)}
            />
          </label>
          <button type="button" className="secondary-button attendance-add-employee" onClick={() => openEmployeeForm()}>
            <FiPlus /> Add Employee
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
          <div><span>Present</span><strong>{counts.Present}</strong></div>
        </article>
        <article className="attendance-summary-card absent">
          <span className="attendance-summary-icon"><FiXCircle /></span>
          <div><span>Absent</span><strong>{counts.Absent}</strong></div>
        </article>
        <article className="attendance-summary-card late">
          <span className="attendance-summary-icon"><FiClock /></span>
          <div><span>Late</span><strong>{counts.Late}</strong></div>
        </article>
        <article className="attendance-summary-card leave">
          <span className="attendance-summary-icon"><FiUsers /></span>
          <div><span>Leave</span><strong>{counts.Leave}</strong></div>
        </article>
      </section>

      <section className="content-panel attendance-panel attendance-register-panel" aria-label="Employee attendance register">
        <div className="attendance-register-toolbar">
          <div>
            <h3>Daily Register</h3>
            <p>Standard shift: {standardWorkingHours} hours · changes save when you leave a cell</p>
          </div>
          <div className="attendance-table-tools">
            <label className="attendance-search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                aria-label="Search employees"
                placeholder="Search ID, name or mobile"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <label className="attendance-filter-select">
              <span className="sr-only">Filter attendance status</span>
              <select aria-label="Filter attendance status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="Unmarked">Unmarked</option>
                {attendanceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>
        </div>
        {(attendanceLoading || attendanceError) && (
          <p className={`attendance-feedback ${attendanceError ? 'error' : ''}`} role={attendanceError ? 'alert' : 'status'}>
            {attendanceError || 'Loading saved attendance…'}
          </p>
        )}

        <div className="attendance-table-scroll">
          <table className="erp-table attendance-table attendance-register-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Mobile Number</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Total Working Hours</th>
                <th>OT Hours</th>
                <th>Attendance Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const employee = employees.find((item) => String(item.id) === String(row.employeeId));
                const label = row.employeeName || 'new attendance line';
                const values = getAttendanceValues(row);
                const absentOrLeave = row.status === 'Absent' || row.status === 'Leave';
                const setCell = (field, value) => updateRow(row, field, value);
                const saveCell = () => saveRow({
                  ...row,
                  ...(row.isNew ? newLine : draftRows[row.id]),
                });
                return (
                  <tr key={row.id} className={row.isNew ? 'attendance-new-row' : ''}>
                    <td>
                      <time dateTime={selectedDate}>{selectedDate}</time>
                    </td>
                    <td className="attendance-id-cell">{employee?.id ?? '—'}</td>
                    <td className="attendance-name-cell">
                      {row.isNew ? (
                        <select
                          aria-label="Select employee for new attendance line"
                          value={row.employeeId || ''}
                          onChange={(event) => {
                            const selectedEmployee = employees.find((item) => String(item.id) === event.target.value);
                            if (!selectedEmployee) return;
                            if (dayRecords[selectedEmployee.id]) {
                              setFeedback({ type: 'error', text: `${selectedEmployee.name} already has an attendance record for this date.` });
                              return;
                            }
                            setCell('employeeId', event.target.value);
                          }}
                          onBlur={saveCell}
                        >
                          <option value="">Select employee</option>
                          {employees
                            .filter((item) => !dayRecords[item.id])
                            .map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      ) : (
                        <>
                          <span>{row.employeeName}</span>
                          <span className="attendance-employee-actions">
                            <button type="button" aria-label={`Edit ${row.employeeName}`} title="Edit employee" onClick={() => openEmployeeForm(employee)}><FiEdit2 /></button>
                            <button type="button" aria-label={`Delete ${row.employeeName}`} title="Delete employee" onClick={() => deleteEmployee(employee.id)}><FiTrash2 /></button>
                          </span>
                        </>
                      )}
                    </td>
                    <td>{row.mobileNumber || '—'}</td>
                    <td>
                      <input
                        type="time"
                        aria-label={`In time for ${label}`}
                        value={row.inTime || ''}
                        disabled={absentOrLeave}
                        onChange={(event) => setCell('inTime', event.target.value)}
                        onBlur={saveCell}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        aria-label={`Out time for ${label}`}
                        value={row.outTime || ''}
                        disabled={absentOrLeave}
                        onChange={(event) => setCell('outTime', event.target.value)}
                        onBlur={saveCell}
                      />
                    </td>
                    <td className="attendance-calculated-cell">{absentOrLeave ? '—' : `${values.workingHours.toFixed(2)} h`}</td>
                    <td className="attendance-calculated-cell attendance-overtime-cell">{absentOrLeave ? '—' : `${values.overtimeHours.toFixed(2)} h`}</td>
                    <td>
                      <select
                        aria-label={`Attendance status for ${label}`}
                        value={row.status || ''}
                        onChange={(event) => {
                          const status = event.target.value;
                          setCell('status', status);
                          if (row.isNew) {
                            setNewLine((current) => ({
                              ...current,
                              status,
                              ...(status === 'Absent' || status === 'Leave' ? { inTime: '', outTime: '' } : {}),
                            }));
                          } else if (status === 'Absent' || status === 'Leave') {
                            setDraftRows((current) => ({
                              ...current,
                              [row.id]: { ...current[row.id], status, inTime: '', outTime: '' },
                            }));
                          }
                        }}
                        onBlur={saveCell}
                      >
                        <option value="">Select status</option>
                        {attendanceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        aria-label={`Remarks for ${label}`}
                        placeholder="Add remark"
                        value={row.remarks || ''}
                        onChange={(event) => setCell('remarks', event.target.value)}
                        onBlur={saveCell}
                      />
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr><td className="attendance-empty-state" colSpan="10">No employees match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {feedback.text && (
          <p className={`attendance-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
            {feedback.text}
          </p>
        )}
        <div className="attendance-register-footer">
          <button
            type="button"
            className="secondary-button attendance-add-line-button"
            onClick={addLine}
            disabled={attendanceLoading || Boolean(newLine) || !employees.some((employee) => !dayRecords[employee.id])}
          >
            <FiPlus aria-hidden="true" /> Add New Line
          </button>
          <button
            type="button"
            className="secondary-button attendance-add-line-button"
            onClick={saveAllAttendance}
            disabled={attendanceLoading || Boolean(attendanceError)
              || (Object.keys(draftRows).length === 0 && !newLine)}
          >
            {isSaving ? 'Saving…' : 'Save Attendance'}
          </button>
          <span>Attendance is unique per employee per date.</span>
        </div>
      </section>

      {isEmployeeFormOpen && (
        <div className="modal-overlay" onClick={() => setIsEmployeeFormOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" className="modal-close" aria-label="Close employee form" onClick={() => setIsEmployeeFormOpen(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={saveEmployee}>
              <div className="field-group">
                <label htmlFor="attendance-employee-name">Employee Name</label>
                <input id="attendance-employee-name" type="text" value={employeeForm.name} onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-phone">Mobile Number</label>
                <input id="attendance-employee-phone" type="tel" value={employeeForm.phone} onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-address">Address</label>
                <input id="attendance-employee-address" type="text" value={employeeForm.address} onChange={(event) => setEmployeeForm((current) => ({ ...current, address: event.target.value }))} />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-salary">Salary</label>
                <input id="attendance-employee-salary" type="number" min="0" value={employeeForm.salary} onChange={(event) => setEmployeeForm((current) => ({ ...current, salary: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-period">Salary Payment Period</label>
                <select id="attendance-employee-period" value={employeeForm.salaryPeriod} onChange={(event) => setEmployeeForm((current) => ({ ...current, salaryPeriod: event.target.value }))}>
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
