import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ArrowLeft, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export default function UserGroupExpenses() {
  const { id } = useParams(); // Group ID
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  
  // Edit State
  const [editingExp, setEditingExp] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchMyExpenses();
  }, [id]);

  const fetchMyExpenses = async () => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      // Filter expenses paid by ME
      const myExps = data.expenses.filter(e => 
        (e.paidBy?._id || e.paidBy) === user._id
      );
      setExpenses(myExps);
    } catch (error) { toast.error('Error fetching expenses'); }
  };

  const handleDelete = async (expId) => {
    if(!window.confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${expId}`); // API Route need to be created
      setExpenses(expenses.filter(e => e._id !== expId));
      toast.success('Expense deleted');
    } catch(err) { toast.error('Failed to delete'); }
  };

  const handleUpdate = async () => {
    if(!newAmount || !newDesc) return;
    try {
      await api.put(`/expenses/${editingExp._id}`, {
        description: newDesc,
        amount: parseFloat(newAmount)
      });
      // Update local UI
      setExpenses(expenses.map(e => e._id === editingExp._id ? {...e, description: newDesc, amount: parseFloat(newAmount)} : e));
      setEditingExp(null);
      toast.success('Updated successfully');
    } catch(err) { toast.error('Failed to update'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-slate-900">My Expenses</h1>
      </div>

      <div className="space-y-3">
        {expenses.map(exp => (
          <div key={exp._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-900">{exp.description}</h3>
                <p className="text-xs text-slate-500">{formatDate(exp.createdAt)}</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-emerald-600">{formatCurrency(exp.amount)}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button 
                onClick={() => { setEditingExp(exp); setNewDesc(exp.description); setNewAmount(exp.amount); }}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button 
                onClick={() => handleDelete(exp._id)}
                className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingExp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Edit Expense</h3>
            <input className="w-full h-12 bg-slate-50 rounded-xl px-4 mb-3 border border-slate-200 outline-none" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <input className="w-full h-12 bg-slate-50 rounded-xl px-4 mb-4 border border-slate-200 outline-none" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold">Save</button>
              <button onClick={() => setEditingExp(null)} className="h-12 w-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center"><X size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}