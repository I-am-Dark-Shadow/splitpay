import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ArrowLeft, Trash2, Edit2, X, AlertTriangle } from 'lucide-react'; // ✅ AlertTriangle Added
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

  // ✅ Delete State
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    } catch (error) { 
      toast.error('Error fetching expenses'); 
    }
  };

  // 1. Open Delete Modal
  const promptDelete = (expId) => {
    setExpenseToDelete(expId);
  };

  // 2. Confirm Delete Logic
  const confirmDelete = async () => {
    if(!expenseToDelete) return;
    setDeleting(true);
    try {
      // নোট: আপনার ব্যাকএন্ডে এই রাউটটি থাকতে হবে (DELETE /api/expenses/:id)
      // যদি না থাকে তবে আমাকে বলবেন, আমি ব্যাকএন্ড কোড দেব।
      await api.delete(`/expenses/${expenseToDelete}`); 
      
      setExpenses(expenses.filter(e => e._id !== expenseToDelete));
      toast.success('Expense deleted successfully');
      setExpenseToDelete(null);
    } catch(err) { 
      console.error(err);
      toast.error('Failed to delete expense'); 
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if(!newAmount || !newDesc) return;
    try {
      // নোট: আপনার ব্যাকএন্ডে এই রাউটটি থাকতে হবে (PUT /api/expenses/:id)
      await api.put(`/expenses/${editingExp._id}`, {
        description: newDesc,
        amount: parseFloat(newAmount)
      });
      
      setExpenses(expenses.map(e => e._id === editingExp._id ? {...e, description: newDesc, amount: parseFloat(newAmount)} : e));
      setEditingExp(null);
      toast.success('Updated successfully');
    } catch(err) { 
      toast.error('Failed to update'); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">My Expenses</h1>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No expenses found.
          </div>
        ) : (
          expenses.map(exp => (
            <div key={exp._id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{exp.description}</h3>
                  <p className="text-xs text-slate-500 font-medium">{formatDate(exp.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-emerald-600 text-lg">{formatCurrency(exp.amount)}</span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => { setEditingExp(exp); setNewDesc(exp.description); setNewAmount(exp.amount); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button 
                  onClick={() => promptDelete(exp._id)} // ✅ Opens Modal
                  className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {editingExp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Edit Expense</h3>
            <label className="text-xs font-semibold text-slate-500 ml-1">Description</label>
            <input className="w-full h-12 bg-slate-50 rounded-xl px-4 mb-3 border border-slate-200 outline-none focus:border-slate-900" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            
            <label className="text-xs font-semibold text-slate-500 ml-1">Amount</label>
            <input className="w-full h-12 bg-slate-50 rounded-xl px-4 mb-6 border border-slate-200 outline-none focus:border-slate-900" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            
            <div className="flex gap-3">
              <button onClick={() => setEditingExp(null)} className="h-12 w-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200"><X size={20} /></button>
              <button onClick={handleUpdate} className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ✅ DELETE CONFIRMATION MODAL --- */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm" onClick={() => setExpenseToDelete(null)}></div>
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 border-2 border-rose-100">
            <div className="flex flex-col items-center text-center">
              
              {/* Warning Icon */}
              <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={28} strokeWidth={2.5} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Expense?</h3>
              
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to delete this expense? <br/>
                This action <span className="text-rose-600 font-bold">cannot be undone</span>.
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setExpenseToDelete(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}