import { useState } from 'react';
import { approveUserAsOwner, createManagedUser, getCurrentUser, getOwnerActivity, getUsers, ROLES } from '../../State/auth';

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  address: '',
  password: '',
  role: ROLES.MANAGER,
};

function AccountManagementPage() {
  const [form, setForm] = useState(emptyForm);
  const [accounts, setAccounts] = useState(getUsers);
  const [activity, setActivity] = useState(getOwnerActivity);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (getCurrentUser()?.role !== ROLES.CEO) {
      setError('Only an Owner can create accounts.');
      setMessage('');
      return;
    }

    try {
      createManagedUser(form);
      setAccounts(getUsers());
      setActivity(getOwnerActivity());
      setForm(emptyForm);
      setError('');
      setMessage('Account created. The user can now sign in with their email and password.');
    } catch (creationError) {
      setError(creationError.message);
      setMessage('');
    }
  };

  const handleApproval = (account) => {
    try {
      approveUserAsOwner(account.id);
      setAccounts(getUsers());
      setActivity(getOwnerActivity());
      setError('');
      setMessage(`${account.name} is now an Owner.`);
    } catch (approvalError) {
      setError(approvalError.message);
      setMessage('');
    }
  };

  const formatLastLogin = (timestamp) => timestamp
    ? new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never';

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Company access</p>
          <h1 className="page-title">Owner Management</h1>
        </div>
      </div>

      <form className="content-panel form-panel" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h3>Create a team account</h3>
        </div>
        <div className="field-grid">
          <div className="field-group">
            <label htmlFor="account-role">Role</label>
            <select id="account-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value={ROLES.OWNER}>Owner</option>
              <option value={ROLES.USER}>User</option>
              <option value={ROLES.MANAGER}>Manager</option>
              <option value={ROLES.ACCOUNTANT}>Accountant</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="account-name">Name</label>
            <input id="account-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div className="field-group">
            <label htmlFor="account-email">Email</label>
            <input id="account-email" type="email" autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div className="field-group">
            <label htmlFor="account-mobile">Mobile</label>
            <input id="account-mobile" type="tel" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} required />
          </div>
          <div className="field-group">
            <label htmlFor="account-address">Address</label>
            <input id="account-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
          </div>
          <div className="field-group">
            <label htmlFor="account-password">Password</label>
            <input id="account-password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </div>
        </div>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <div className="form-actions">
          <button type="submit" className="primary-button">Create account</button>
        </div>
      </form>

      <div className="content-panel">
        <div className="panel-header">
          <h3>Accounts</h3>
        </div>
        <table className="erp-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Mobile</th><th>Address</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.name}</td>
                <td>{account.email}</td>
                <td>{account.mobile || '—'}</td>
                <td>{account.address || '—'}</td>
                <td>{account.role}</td>
                <td>{account.status || 'Active'}</td>
                <td>{formatLastLogin(account.lastLogin)}</td>
                <td>{account.role === ROLES.USER && <button type="button" className="secondary-button" onClick={() => handleApproval(account)}>Approve as Owner</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="content-panel">
        <div className="panel-header"><h3>Owner Activity</h3></div>
        <table className="erp-table">
          <thead><tr><th>Performed By</th><th>Action</th><th>Module</th><th>Record</th><th>Date &amp; Time</th></tr></thead>
          <tbody>
            {activity.length ? activity.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.name}</td><td>{entry.action}</td><td>{entry.module}</td><td>{entry.recordId || '—'}</td>
                <td>{formatLastLogin(entry.timestamp)}</td>
              </tr>
            )) : <tr><td colSpan="5">No Owner activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountManagementPage;
