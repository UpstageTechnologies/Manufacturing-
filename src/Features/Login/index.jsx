import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import './Login.css';

function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem('manufacture-erp-authenticated', 'true');
    navigate('/dashboard');
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
              <input id="email" type="email" placeholder="name@company.com" />
            </div>
          </div>

          <div className="field-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#">Forgot password?</a>
            </div>
            <div className="input-wrap">
              <FiLock />
              <input id="password" type="password" placeholder="Enter password" />
            </div>
          </div>

          <button type="submit" className="primary-button full-width">
            Login <FiArrowRight />
          </button>
        </form>

        <div className="auth-footer">
          <span>Don’t have an account?</span>
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
