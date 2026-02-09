import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

function LoginPage() {
  const MotionDiv = motion.div;

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [baseId, setBaseId] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';

    if (!isLogin) {
      if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (role !== 'admin' && !baseId) newErrors.baseId = 'Base ID is required for this role';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await login(username, password);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error);
        }
      } else {
        await api.post('/auth/register', {
          username,
          password,
          role,
          base_id: baseId || null
        });
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setBaseId('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card/30 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl mb-6 shadow-xl shadow-primary/10">
            <Shield size={32} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Military Asset Management Console</p>
        </div>

        {error && (
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {error}
          </MotionDiv>
        )}

        {message && (
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {message}
          </MotionDiv>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            icon={User}
            placeholder="Enter username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: null });
            }}
            error={fieldErrors.username}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="********"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
            }}
            error={fieldErrors.password}
          />

          {!isLogin && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">AdminHQ</option>
                <option value="commander">Base Commander</option>
                <option value="logistics">Logistics Officer</option>
              </Select>

              {role !== 'admin' && (
                <Input
                  label="Base ID"
                  type="number"
                  value={baseId}
                  onChange={(e) => {
                    setBaseId(e.target.value);
                    if (fieldErrors.baseId) setFieldErrors({ ...fieldErrors, baseId: null });
                  }}
                  placeholder="Enter Base ID (e.g., 1)"
                  error={fieldErrors.baseId}
                />
              )}
            </MotionDiv>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6 flex items-center justify-center gap-2 group tracking-wide text-sm disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted-foreground hover:text-primary text-sm transition-colors font-medium underline underline-offset-4 decoration-transparent hover:decoration-primary/50"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </MotionDiv>
    </div>
  );
}

export default LoginPage;
