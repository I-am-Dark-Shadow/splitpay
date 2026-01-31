import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, PlusCircle, Calculator as CalcIcon,
    Download, Save, User, Trash2, IndianRupee, ArrowRight
} from 'lucide-react';
import { calculateSettlements } from '../utils/settlementLogic';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function Calculator() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [tourName, setTourName] = useState('');
    const [people, setPeople] = useState([
        { id: Date.now(), name: '', amount: '' },
    ]);
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);

    // Add new person field
    const addPerson = () => {
        setPeople([...people, { id: Date.now(), name: '', amount: '' }]);
    };

    // Remove person field
    const removePerson = (id) => {
        if (people.length > 1) {
            setPeople(people.filter(p => p.id !== id));
        } else {
            toast.error('Minimum 1 person required');
        }
    };

    // Handle input change
    const handleChange = (id, field, value) => {
        setPeople(people.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // ✅ FIXED CALCULATE LOGIC
    const handleCalculate = () => {
        if (!tourName.trim()) return toast.error('Enter Tour/Event Name');

        const validPeople = people.filter(p => p.name.trim() !== '');
        if (validPeople.length < 1) return toast.error('Enter at least 1 name');

        // 🔴 FIX: ID গুলোকে toString() করা হয়েছে যাতে নাম হারিয়ে না যায়
        const members = validPeople.map(p => ({
            _id: p.id.toString(),
            name: p.name
        }));

        const expenses = validPeople.map(p => ({
            paidBy: p.id.toString(), // 🔴 FIX: এখানেও toString()
            amount: parseFloat(p.amount) || 0,
            shares: members.map(m => ({
                user: m._id,
                amount: (parseFloat(p.amount) || 0) / members.length
            }))
        }));

        const settlements = calculateSettlements(expenses, members);

        let total = 0;
        expenses.forEach(e => total += e.amount);

        setResult({ settlements, total, members });
        toast.success('Calculation Done!');

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    // Generate Report
    const generateReport = async () => {
        if (!result) return;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42);
        doc.text(tourName, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Manual Report | ${new Date().toLocaleDateString()}`, 14, 26);
        doc.setDrawColor(200);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Total Group Spending: ${formatCurrency(result.total)}`, 14, 45);

        const body = result.settlements.map(s => [
            result.members.find(m => m._id === s.from)?.name || 'Unknown',
            result.members.find(m => m._id === s.to)?.name || 'Unknown',
            formatCurrency(s.amount)
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['From', 'To', 'Amount']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
        });

        const fileName = `SplitPay_${tourName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        if (Capacitor.isNativePlatform()) {
            try {
                const base64 = doc.output('datauristring').split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: Directory.Cache
                });
                await Share.share({ title: 'Report', url: savedFile.uri });
            } catch (e) {
                toast.error('Error sharing file');
            }
        } else {
            doc.save(fileName);
            toast.success('PDF Downloaded');
        }
    };

    const saveToCloud = async () => {
        if (!user) return;
        if (!result) return toast.error('Calculate first');
        setSaving(true);
        try {
            await api.post('/manual-reports', {
                name: tourName,
                data: result
            });
            toast.success('Report Saved Successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 pt-6 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 sticky top-0 bg-slate-50/90 backdrop-blur py-2 z-10">
                <button onClick={() => navigate(-1)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft size={20} className="text-slate-900" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Quick Calculator</h1>
                    <p className="text-xs text-slate-500">Split bills instantly</p>
                </div>
            </div>

            {/* Tour Name Input */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 block">Event Name</label>
                <input
                    value={tourName}
                    onChange={(e) => setTourName(e.target.value)}
                    placeholder="Weekend Trip"
                    className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none border-b-2 border-slate-500 focus:border-slate-900 pb-2 transition-colors"
                />
            </div>

            {/* People Inputs List */}
            <div className="space-y-4 mb-8">
                {people.map((p, idx) => (
                    <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                PERSON {idx + 1}
                            </span>
                            {people.length > 1 && (
                                <button onClick={() => removePerson(p.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-full transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {/* Name Input */}
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 mb-1 block pl-1">NAME</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                                    <User size={18} className="text-slate-400 mr-2" />
                                    <input
                                        placeholder="Enter Name"
                                        value={p.name}
                                        onChange={(e) => handleChange(p.id, 'name', e.target.value)}
                                        className="bg-transparent w-full text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="w-[40%]">
                                <label className="text-[10px] font-bold text-emerald-600/70 mb-1 block pl-1">PAID</label>
                                <div className="flex items-center bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 h-12 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
                                    <IndianRupee size={16} className="text-emerald-600 mr-1" />
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={p.amount}
                                        onChange={(e) => handleChange(p.id, 'amount', e.target.value)}
                                        className="bg-transparent w-full text-lg font-bold text-emerald-700 outline-none placeholder:text-emerald-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* ✅ FIXED: Add Button is now visible and attractive */}
                <button
                    onClick={addPerson}
                    className="w-full py-4 rounded-3xl bg-blue-50 text-blue-600 font-bold text-sm border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <PlusCircle size={20} /> Add Another Person
                </button>
            </div>

            <div className="sticky bottom-4 z-20">
                <button
                    onClick={handleCalculate}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {/* GIF Replaced with Icon for cleaner look */}
                    <img src="/calculator.gif" alt="Calculator" className="w-6 object-contain scale-[1.6] mr-2" /> Calculate Split
                </button>
            </div>

            {/* --- ✅ NEW DARK & CLEAN RESULT DESIGN --- */}
            {result && (
                <div className="mt-8 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-500">

                    {/* Header - Professional Dark Theme */}
                    <div className="bg-slate-900 p-4 text-white text-center relative">
                        <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Total Expenses</div>
                        <div className="text-xl font-black">{formatCurrency(result.total)}</div>
                    </div>

                    <div className="p-5">
                        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                            Settlement Plan
                        </h3>

                        {result.settlements.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                All settled! No transactions needed.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {result.settlements.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between px-3 py-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition"
                                    >
                                        {/* LEFT: Names */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* From */}
                                            <span className="font-semibold text-red-600 text-sm truncate max-w-[72px]">
                                                {result.members.find(m => m._id === s.from)?.name}
                                            </span>

                                            {/* pays arrow */}
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                                                <ArrowRight size={14} className="text-blue-400 scale-[1.3]" />
                                            </div>

                                            {/* To */}
                                            <span className="font-semibold text-green-600 text-sm truncate max-w-[72px]">
                                                {result.members.find(m => m._id === s.to)?.name}
                                            </span>
                                        </div>

                                        {/* RIGHT: Amount */}
                                        <span className="ml-3 px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 font-bold text-sm whitespace-nowrap">
                                            <div className="flex items-center gap-1 justify-center">
                                                <IndianRupee size={16} className="text-blue-600 -mr-0.5 mt-0.5" />{(s.amount)}
                                            </div>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                        <button
                            onClick={generateReport}
                            className="flex-1 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Download size={18} /> PDF
                        </button>

                        {user && (
                            <button
                                onClick={saveToCloud}
                                disabled={saving}
                                className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95 transition-transform"
                            >
                                <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}