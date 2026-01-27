import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // Step 2 & 3: Verify & Reset
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPass) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password updated! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 pt-12 flex flex-col">
      <button onClick={() => navigate('/login')} className="mb-6 h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-200">
        <ArrowLeft size={20} className="text-slate-900" />
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {step === 1 ? 'Reset Password' : step === 2 ? 'Enter OTP' : 'New Password'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {step === 1 ? 'Enter your email to receive a 4-digit code.' : step === 2 ? `Sent code to ${email}` : 'Create a strong password.'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input icon={Mail} placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between gap-2">
              {[0, 1, 2, 3].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  className="w-14 h-14 rounded-2xl border border-slate-200 text-center text-xl font-bold bg-slate-50 focus:border-slate-900 outline-none"
                  value={otp[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) return;
                    const newOtp = otp.split('');
                    newOtp[i] = val;
                    setOtp(newOtp.join('').slice(0, 4));
                    // Auto focus next logic could be added here
                  }}
                />
              ))}
            </div>
            <Button className="w-full" onClick={() => otp.length === 4 ? setStep(3) : toast.error('Enter 4 digits')}>Verify Code</Button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-4">
            <Input icon={Lock} type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <Input icon={KeyRound} type="password" placeholder="Confirm Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
            <Button className="w-full" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}