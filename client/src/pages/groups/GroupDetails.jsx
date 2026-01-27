import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { calculateSettlements } from '../../utils/settlementLogic';
import {
  ArrowLeft, PlusCircle, Users, ArrowRight, UserPlus, X, Share2,
  ListFilter, Trash2, History, AlertTriangle
} from 'lucide-react'; // ✅ History & AlertTriangle icon added
import toast from 'react-hot-toast';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ✅ Delete Modal State
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Balances
  const [totalSpent, setTotalSpent] = useState(0);
  const [myDebts, setMyDebts] = useState({ owe: [], owed: [] });
  const [isGlobalSettled, setIsGlobalSettled] = useState(false);

  // Admin Check
  const isAdmin = group?.admin === user?._id || group?.creator === user?._id;

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data);
      if (data) calculateStats(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail) return toast.error('Please enter an email');
    setAddingMember(true);
    try {
      const { data } = await api.put(`/groups/${id}/members`, { email: newMemberEmail });
      setGroup(data);
      calculateStats(data);
      toast.success('Member added successfully!');
      setShowAddMember(false);
      setNewMemberEmail('');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleShareInvite = async () => {
    const inviteLink = `https://splitpay-pro.vercel.app/join/${id}`;
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: `Join ${group.name} on SplitPay`,
          text: `Hey! Join our expense group "${group.name}" on SplitPay using this link:`,
          url: inviteLink,
          dialogTitle: 'Invite Friends',
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        toast.success('Invite link copied to clipboard!');
      }
    } catch (error) {
      console.log('Share error', error);
    }
  };

  // ✅ Confirm Delete Function
  const confirmDeleteGroup = async () => {
    setDeleting(true);
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Group deleted successfully');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete group');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const calculateStats = (groupData) => {
    if (!groupData.expenses) return;
    let total = 0;
    groupData.expenses.forEach(exp => total += exp.amount);
    setTotalSpent(total);

    const settlements = calculateSettlements(groupData.expenses, groupData.members);
    const iOwe = settlements.filter(s => s.from === user._id);
    const owedToMe = settlements.filter(s => s.to === user._id);
    setMyDebts({ owe: iOwe, owed: owedToMe });

    if (groupData.expenses.length > 0 && settlements.length === 0) {
      setIsGlobalSettled(true);
    } else {
      setIsGlobalSettled(false);
    }
  };

  const getMemberName = (userId) => {
    const m = group?.members.find(mem => mem._id === userId);
    return m ? m.name.split(' ')[0] : 'Unknown';
  };

  const getMemberSpending = () => {
    if (!group) return [];
    const spending = {};
    group.members.forEach(m => spending[m._id] = { name: m.name, amount: 0 });
    group.expenses.forEach(exp => {
      const payerId = exp.paidBy?._id || exp.paidBy;
      if (spending[payerId]) {
        spending[payerId].amount += exp.amount;
      }
    });
    return Object.values(spending).sort((a, b) => b.amount - a.amount);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!group) return <div className="p-10 text-center">Group not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-8 relative">

      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <ArrowLeft size={20} className="text-slate-900" />
          </button>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">{group.name}</div>
            <div className="text-xs text-slate-500">{group.members.length} members</div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* ✅ FIX 1: Share Button এখন সবসময় কাজ করবে */}
          <button
            onClick={handleShareInvite}
            // disabled={isGlobalSettled} <--- এই লাইনটি মুছে দেওয়া হয়েছে
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all border border-emerald-600 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95"
          >
            <Share2 size={18} />
          </button>

          {/* ✅ FIX 2: Add Member Button এখন সবসময় কাজ করবে */}
          <button
            onClick={() => setShowAddMember(true)}
            // disabled={isGlobalSettled} <--- এই লাইনটি মুছে দেওয়া হয়েছে
            className="h-9 w-9 rounded-xl mx-1 flex items-center justify-center transition-all bg-slate-900 text-white hover:bg-slate-700 active:scale-95"
          >
            <UserPlus size={18} />
          </button>

          {/* Add Expense Button (এটা সেটেল থাকলে ডিজেবল থাকতে পারে, বা আপনি চাইলে এটাও খুলে দিতে পারেন) */}
          {isGlobalSettled ? (
            <button
              onClick={() => toast('Already settled! Add new member to split costs.')}
              className="h-9 px-3 rounded-xl bg-slate-200 text-slate-400 text-xs font-semibold flex items-center gap-TJ cursor-not-allowed"
            >
              <PlusCircle size={16} /> Add
            </button>
          ) : (
            <Link
              to={`/groups/${id}/add-expense`}
              className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1 hover:bg-slate-700"
            >
              <PlusCircle size={16} /> Add
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* 1. Balances Section */}
        {(myDebts.owe.length > 0 || myDebts.owed.length > 0) ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="text-sm font-bold text-slate-900">Your Balances</div>
            <div className="space-y-2">
              {myDebts.owe.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <span className="text-rose-700 font-medium">You pay <b>{getMemberName(item.to)}</b></span>
                  <span className="font-bold text-rose-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {myDebts.owed.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-emerald-700 font-medium"><b>{getMemberName(item.from)}</b> gives you</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <Link to={`/groups/${id}/settlement`} className="flex items-center justify-center w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">
              View full settlement plan <ArrowRight size={16} className="ml-2" />
            </Link>
            <Link to={`/groups/${id}/my-expenses`} className="flex items-center justify-center w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all shadow-md">
              <ListFilter size={16} className="mr-2" /> Edit / Delete My Expenses
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-center shadow-sm">
            <div className="text-emerald-700 font-bold text-base mb-1">Everything is settled up here!</div>
            <div className="text-emerald-600/70 text-xs mb-4">No pending debts in this group.</div>

            {/* ✅ Beautiful View History Button */}
            <Link
              to={`/groups/${id}/my-expenses`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-emerald-200 shadow-sm rounded-xl text-emerald-700 text-xs font-bold hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <History size={16} /> View History
            </Link>
          </div>
        )}

        {/* 2. Total Spending */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users size={16} /> Total Spending ({formatCurrency(totalSpent)})
          </div>
          <div className="space-y-2">
            {getMemberSpending().map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{stat.name}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(stat.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Admin Zone */}
        {isAdmin && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-4">
            <h3 className="text-xs font-bold text-rose-700 uppercase mb-2 tracking-wide flex items-center gap-1">
              Group Admin Zone
            </h3>
            <button
              onClick={() => setShowDeleteModal(true)} // ✅ Opens Modal
              className="w-full py-3 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors shadow-sm"
            >
              <Trash2 size={16} /> Delete Group Permanently
            </button>
          </div>
        )}

        {/* 4. Recent Expenses */}
        <div>
          <div className="text-sm font-bold text-slate-900 mb-2 px-1">Recent Expenses</div>
          {group.expenses.length === 0 ? (
            <div className="text-center p-6 text-slate-400 text-sm">No expenses yet.</div>
          ) : (
            <div className="space-y-3">
              {group.expenses.map((exp) => (
                <div key={exp._id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 flex justify-between items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{exp.description}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">
                        {exp.paidBy?._id === user._id ? 'You' : exp.paidBy?.name || 'Unknown'}
                      </span> paid {formatCurrency(exp.amount)}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {formatDate(exp.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- ADD MEMBER MODAL --- */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddMember(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add New Member</h3>
              <button onClick={() => setShowAddMember(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Enter email address to add to <b>{group.name}</b>.</p>
            <div className="space-y-4">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900 bg-slate-50"
              />
              <button
                onClick={handleAddMember}
                disabled={addingMember}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-70"
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ✅ DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 border-2 border-rose-100">
            <div className="flex flex-col items-center text-center">

              {/* Warning Icon */}
              <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={28} strokeWidth={2.5} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Group?</h3>

              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to delete <b>{group.name}</b>? <br />
                All expenses and history will be <span className="text-rose-600 font-bold">permanently lost</span>.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteGroup}
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