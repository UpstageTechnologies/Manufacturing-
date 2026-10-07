import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { DEFAULT_CEO_CREDENTIALS, loginUser } from '../../State/auth';
import './Login.css';

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');
    if (!loginUser(email, password)) {
      setError('Email or password is incorrect.');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card login-card">
        <div className="auth-brand">
          <div className="brand-logo">M</div>
          <div>
            <p className="eyebrow">Business Suite</p>
            <h2>Manufacture ERP</h2>
          </div>
        </div>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to continue with your operations.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <FiMail />
              <input id="email" name="email" type="email" placeholder="name@company.com" autoComplete="username" required />
            </div>
          </div>

          <div className="field-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#">Forgot password?</a>
            </div>
            <div className="input-wrap">
              <FiLock />
              <input id="password" name="password" type="password" placeholder="Enter password" autoComplete="current-password" required />
            </div>
          </div>

          {error && <p role="alert" className="auth-error">{error}</p>}
          <button type="submit" className="primary-button full-width">
            Login <FiArrowRight />
          </button>
        </form>

        <div className="auth-footer">
          <span>Initial CEO login: {DEFAULT_CEO_CREDENTIALS.email} / {DEFAULT_CEO_CREDENTIALS.password}</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
