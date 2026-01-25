import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Smartphone, Download } from 'lucide-react'; // ✅ Icons Added

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
    <div className="min-h-screen px-6 pt-10 pb-10 bg-slate-50 flex flex-col justify-center">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-600 mt-1">Log in to manage groups and expenses.</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4 relative z-10">
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
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-4 w-full shadow-lg shadow-slate-900/20">
          Log in <ArrowRight size={18} />
        </Button>

        <div className="flex justify-between items-center text-sm mt-4 pt-2 border-t border-slate-100">
          <button type="button" className="font-semibold text-slate-500 hover:text-slate-800 transition-colors">Forgot password?</button>
          <Link to="/register" className="font-bold text-slate-900 hover:underline">
            Register
          </Link>
        </div>
      </form>

      {/* ✅ PROFESSIONAL DOWNLOAD CARD */}
      <div className="mt-8 relative">
        {/* Decorative Blur behind the card */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full transform translate-y-4"></div>
        
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between overflow-hidden border border-slate-700/50">
          
          {/* Background Patterns */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl"></div>

          <div className="flex items-center gap-4 relative z-10">
            {/* Icon Box */}
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
              <Smartphone size={24} className="text-emerald-400" />
            </div>
            
            {/* Text */}
            <div>
              <div className="text-white font-bold text-base">Get the App</div>
              <div className="text-slate-400 text-xs mt-0.5">Best experience on mobile</div>
            </div>
          </div>

          {/* Download Button */}
          <a 
            href="/splitpay.apk" 
            download="SplitPay.apk"
            className="relative z-10 h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
          >
            <Download size={16} />
            Install
          </a>

        </div>
      </div>

    </div>
  );
}