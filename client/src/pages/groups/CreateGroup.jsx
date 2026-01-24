import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../../context/GroupContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Hash, Mail, X, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState([]); // Array of emails
  const [loading, setLoading] = useState(false);
  
  const { fetchGroups } = useGroup();
  const navigate = useNavigate();

  // Helper: Simple email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddMember = (e) => {
    e.preventDefault(); // Prevent form submission if triggered by Enter key
    
    const email = emailInput.trim().toLowerCase();
    
    if (!email || !isValidEmail(email)) {
      return toast.error('Please enter a valid email');
    }
    if (members.includes(email)) {
      return toast.error('Member already added');
    }

    setMembers([...members, email]);
    setEmailInput('');
  };

  const handleRemoveMember = (emailToRemove) => {
    setMembers(members.filter(email => email !== emailToRemove));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Group name is required');
    if (members.length === 0) return toast.error('Add at least one member');

    setLoading(true);
    try {
      // API Call
      await api.post('/groups', {
        name,
        members // Backend expects array of emails
      });

      toast.success('Group created successfully!');
      await fetchGroups(); // Refresh the global list
      navigate('/groups'); // Go back to list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
        <div className="text-base font-semibold tracking-tight">Create Group</div>
      </div>

      <div className="px-4 pt-6 pb-24">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">New Group</h1>
          <p className="text-sm text-slate-600 mt-1">Add members by email. You can adjust later.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Group Name</label>
            <Input 
              icon={Hash} 
              placeholder="Darjing Trip 2026" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Add Member Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Add Members</label>
              <span className="text-xs text-slate-500">Email + Add</span>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input 
                  icon={Mail} 
                  placeholder="friend@email.com" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember(e)}
                />
              </div>
              <button 
                onClick={handleAddMember}
                className="h-11 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Members List (Chips) */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Members ({members.length})</div>
            
            {members.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No members added yet. You are included automatically.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((email) => (
                  <div key={email} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-xs font-semibold text-slate-800">{email}</span>
                    <button 
                      onClick={() => handleRemoveMember(email)}
                      className="h-5 w-5 rounded-full hover:bg-slate-200 flex items-center justify-center"
                    >
                      <X size={14} className="text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
            <Button variant="outline" className="mt-3" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}