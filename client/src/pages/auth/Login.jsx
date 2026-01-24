import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(formData.email, formData.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen px-6 pt-12 bg-slate-50">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-600 mt-1">Log in to manage groups and expenses.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Email</label>
          <Input 
            icon={Mail} 
            type="email" 
            placeholder="example@gmail.com" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Password</label>
          <div className="relative">
            <Input 
              icon={Lock} 
              type={showPass ? "text" : "password"} 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2.5 text-slate-500"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-4">
          Log in <ArrowRight size={18} />
        </Button>

        <div className="flex justify-between items-center text-sm mt-4">
          <button type="button" className="font-semibold text-slate-700">Forgot password?</button>
          <Link to="/register" className="font-semibold text-slate-700 hover:text-slate-900">
            Register
          </Link>
        </div>
      </form>

      {/* Demo helper card from your HTML */}
      <div className="mt-6 bg-slate-900 rounded-3xl p-5 shadow-sm flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Lock className="text-white" size={20} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Secure Access</div>
          <div className="text-xs text-white/70 mt-1">
            Use your credentials to access your shared expenses securely.
          </div>
        </div>
      </div>
    </div>
  );
}