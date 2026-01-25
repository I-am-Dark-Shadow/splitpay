import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JoinGroup() {
  const { groupId } = useParams(); // URL থেকে ID পাবে
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // 1. গ্রুপের বেসিক ইনফো আনা (নাম, মেম্বার সংখ্যা)
    // এর জন্য নতুন API লাগতে পারে, অথবা আমরা existin API try করবো
    const fetchInfo = async () => {
      try {
        const { data } = await api.get(`/groups/${groupId}`);
        setGroupInfo(data);
      } catch (error) {
        toast.error("Group not found or invalid link");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if(user) fetchInfo();
  }, [groupId, user]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      // সেইম API যা আমরা আগে বানিয়েছি (Add Member)
      // কিন্তু এবার email এর বদলে current user কে অ্যাড করবে
      // এর জন্য ব্যাকএন্ডে একটু চেঞ্জ লাগবে অথবা আমরা ফ্রন্টএন্ড থেকে user email পাঠাবো
      
      await api.put(`/groups/${groupId}/members`, { email: user.email });
      
      toast.success(`Joined ${groupInfo.name} successfully!`);
      navigate(`/groups/${groupId}`);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to join";
      if(msg.includes("already")) {
         navigate(`/groups/${groupId}`); // অলরেডি থাকলে সরাসরি গ্রুপে নিয়ে যাবে
      } else {
         toast.error(msg);
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Checking link...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
          <Users size={40} />
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 mb-1">Join Group?</h2>
        <p className="text-slate-500 text-sm mb-6">
          You have been invited to join 
          <br />
          <span className="font-bold text-slate-800 text-lg">"{groupInfo?.name}"</span>
        </p>

        <div className="space-y-3">
          <button 
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            {joining ? 'Joining...' : <><CheckCircle size={18} /> Join Group</>}
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <XCircle size={18} /> Not Now
          </button>
        </div>
      </div>
    </div>
  );
}