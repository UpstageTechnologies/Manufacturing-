import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import './Register.css';

function RegisterPage() {
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
          <p>Set up your business workspace and manage operations efficiently.</p>
        </div>

        <form className="auth-form">
          <div className="field-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrap">
              <FiUser />
              <input id="name" type="text" placeholder="John Doe" />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-wrap">
              <FiMail />
              <input id="reg-email" type="email" placeholder="name@company.com" />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-wrap">
              <FiLock />
              <input id="reg-password" type="password" placeholder="Create a password" />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="input-wrap">
              <FiLock />
              <input id="confirm-password" type="password" placeholder="Confirm password" />
            </div>
          </div>

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
