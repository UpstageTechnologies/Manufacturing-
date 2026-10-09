import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { loginUser } from '../../State/auth';
import './Login.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    const emailField = event.currentTarget.elements.namedItem('email');
    if (!emailField.validity.valid) {
      setError('Enter a valid email address.');
      return;
    }

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

        <form className="auth-form" noValidate onSubmit={handleSubmit} onChange={() => setError('')}>
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
              <input id="password" name="password" type={isPasswordVisible ? 'text' : 'password'} placeholder="Enter password" autoComplete="current-password" required />
              <button
                type="button"
                className="password-toggle"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="auth-error">{error}</p>}
          {location.state?.message && <p role="status" className="auth-success">{location.state.message}</p>}
          <button type="submit" className="primary-button full-width">
            Login <FiArrowRight />
          </button>
        </form>
        <div className="auth-footer">
          <span>New to Manufacture ERP?</span>
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
