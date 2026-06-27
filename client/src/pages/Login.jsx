import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Welcome Back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
              placeholder="Your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="text-center text-text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
