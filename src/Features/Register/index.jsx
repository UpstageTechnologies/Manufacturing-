import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiArrowLeft, FiPhone, FiMapPin } from 'react-icons/fi';
import { registerUser } from '../../State/auth';
import './Register.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      registerUser(Object.fromEntries(formData.entries()));
      navigate('/login', { replace: true, state: { message: 'Account created. You can now sign in.' } });
    } catch (registrationError) {
      setError(registrationError.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-brand">
          <div className="brand-logo">M</div>
          <div>
            <p className="eyebrow">Create account</p>
            <h2>Manufacture ERP</h2>
          </div>
        </div>

        <div className="auth-header">
          <h1>Register</h1>
          <p>Create your user account to access the workspace.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} onChange={() => setError('')}>
          <div className="field-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrap">
              <FiUser />
              <input id="name" name="name" type="text" autoComplete="name" placeholder="Full name" required />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-wrap">
              <FiMail />
              <input id="reg-email" name="email" type="email" autoComplete="email" placeholder="name@company.com" required />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-wrap">
              <FiLock />
              <input id="reg-password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="input-wrap">
              <FiLock />
              <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirm password" required />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-mobile">Mobile Number</label>
            <div className="input-wrap">
              <FiPhone />
              <input id="reg-mobile" name="mobile" type="tel" autoComplete="tel" placeholder="Mobile number" required />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-address">Address</label>
            <div className="input-wrap">
              <FiMapPin />
              <input id="reg-address" name="address" autoComplete="street-address" placeholder="Address" required />
            </div>
          </div>

          {error && <p role="alert" className="auth-error">{error}</p>}
          <button type="submit" className="primary-button full-width">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <FiArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
