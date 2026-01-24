import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords don't match");
    }
    const success = await register(formData.name, formData.email, formData.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen px-6 pt-12 bg-slate-50">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
        <p className="text-sm text-slate-600 mt-1">Start splitting expenses in minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Full Name</label>
          <Input 
            icon={User} 
            type="text" 
            placeholder="Your full name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

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
          <Input 
            icon={Lock} 
            type="password" 
            placeholder="Min 6 characters"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Confirm Password</label>
          <Input 
            icon={Lock} 
            type="password" 
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        </div>

        <Button type="submit" className="mt-4">
          Create account
        </Button>

        <div className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-800 hover:text-slate-900">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}