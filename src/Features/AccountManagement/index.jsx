import { useState } from 'react';
import { createManagedUser, getCurrentUser, getUsers, ROLES } from '../../State/auth';

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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (getCurrentUser()?.role !== ROLES.CEO) {
      setError('Only the CEO can create accounts.');
      setMessage('');
      return;
    }

    try {
      createManagedUser(form);
      setAccounts(getUsers());
      setForm(emptyForm);
      setError('');
      setMessage('Account created. The user can now sign in with their email and password.');
    } catch (creationError) {
      setError(creationError.message);
      setMessage('');
    }
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Company access</p>
          <h1 className="page-title">Account Management</h1>
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
            <tr><th>Name</th><th>Email</th><th>Mobile</th><th>Address</th><th>Role</th></tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.name}</td>
                <td>{account.email}</td>
                <td>{account.mobile || '—'}</td>
                <td>{account.address || '—'}</td>
                <td>{account.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountManagementPage;
