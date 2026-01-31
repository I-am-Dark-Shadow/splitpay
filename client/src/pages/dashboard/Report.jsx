import { useState, useEffect } from 'react';
import { useGroup } from '../../context/GroupContext';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency, formatDate } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Share2, FileText, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Capacitor imports
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function Report() {
  const { groups, fetchGroups } = useGroup();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Tabs: 'groups' or 'manual'
  const [tab, setTab] = useState('groups'); 
  const [manualReports, setManualReports] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchManualReports();
  }, []);

  const fetchManualReports = async () => {
    try {
      const { data } = await api.get('/manual-reports');
      setManualReports(data);
    } catch (error) {
      console.log('No manual reports found');
    }
  };

  // --- PDF GENERATOR HELPER ---
  const saveAndShare = async (doc, fileName) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const base64 = doc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache, 
        });
        await Share.share({
          title: 'SplitPay Report',
          text: 'Here is the expense report.',
          url: savedFile.uri,
          dialogTitle: 'Share Report',
        });
      } catch (e) {
        console.error('Sharing failed', e);
        toast.error('Sharing failed on device');
      }
    } else {
      doc.save(fileName);
      toast.success('Report Downloaded');
    }
  };

  // --- GENERATE GROUP PDF ---
  const generateGroupPDF = async () => {
    if (!selectedGroupId) return toast.error('Select a group first');
    setLoading(true);

    try {
      const { data: group } = await api.get(`/groups/${selectedGroupId}`);
      const doc = new jsPDF();
      let finalY = 0;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(group.name, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Group Expense Report | ${new Date().toLocaleDateString()}`, 14, 26);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 30, 196, 30);

      // Data Prep
      let totalGroupSpend = 0;
      const memberSpending = {};
      group.members.forEach(m => (memberSpending[m._id] = { name: m.name, amount: 0 }));

      const realExpenses = group.expenses.filter(e => e.description !== 'Settlement Payment');
      
      realExpenses.forEach(exp => {
        totalGroupSpend += exp.amount;
        const payerId = exp.paidBy?._id || exp.paidBy;
        if (memberSpending[payerId]) {
          memberSpending[payerId].amount += exp.amount;
        }
      });

      // 1. Total Spending Table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`1. Total Spending: ${formatCurrency(totalGroupSpend)}`, 14, 40);

      autoTable(doc, {
        startY: 45,
        head: [['Member', 'Total Spent']],
        body: Object.values(memberSpending).map(m => [m.name, formatCurrency(m.amount)]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
      });

      finalY = doc.lastAutoTable.finalY + 15;

      // 2. Pending Balances
      const settlements = calculateSettlements(group.expenses, group.members);
      doc.text('2. Settlement Plan (Who pays whom)', 14, finalY);

      if (settlements.length > 0) {
        autoTable(doc, {
          startY: finalY + 5,
          head: [['From', 'To', 'Amount']],
          body: settlements.map(s => [
            group.members.find(m => m._id === s.from)?.name || 'Unknown',
            group.members.find(m => m._id === s.to)?.name || 'Unknown',
            formatCurrency(s.amount),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] },
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text('All settled up! No pending debts.', 14, finalY + 10);
      }

      const fileName = `${group.name.replace(/\s+/g, '_')}_Report.pdf`;
      await saveAndShare(doc, fileName);

    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // --- SHARE MANUAL REPORT ---
  const shareManualReport = async (report) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text(report.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Manual Calculation | ${formatDate(report.createdAt)}`, 14, 26);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Spending: ${formatCurrency(report.data.total)}`, 14, 40);

    const body = report.data.settlements.map(s => [
      report.data.members.find(m => m._id === s.from)?.name,
      report.data.members.find(m => m._id === s.to)?.name,
      formatCurrency(s.amount)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['From', 'To', 'Amount']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
    });

    await saveAndShare(doc, `Manual_${report.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="px-4 pt-8 pb-24 ">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Expense Reports</h1>
          <p className="text-sm text-slate-600">Download & Share PDFs</p>
        </div>
        <img src="/name.webp" className="w-20" alt="Logo" />
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/60 rounded-2xl mb-6">
        <button 
          onClick={() => setTab('groups')} 
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'groups' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Group Reports
        </button>
        <button 
          onClick={() => setTab('manual')} 
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Saved Calc
        </button>
      </div>

      {/* --- GROUP REPORTS TAB --- */}
      {tab === 'groups' ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in zoom-in duration-200">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Select Group</label>
            <div className="relative">
              <select
                className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none appearance-none"
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
              >
                <option value="">Select a Group</option>
                {groups.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">▼</div>
            </div>
          </div>
          <Button className="w-full h-12 text-sm" onClick={generateGroupPDF} disabled={loading || !selectedGroupId}>
            {loading ? 'Generating...' : <><Download size={18} /> Download / Share PDF</>}
          </Button>
        </div>
      ) : (
        /* --- MANUAL REPORTS TAB --- */
        <div className="space-y-3 animate-in fade-in zoom-in duration-200">
          {manualReports.length === 0 ? (
            <div className="text-center py-10 bg-slate-100 rounded-3xl border border-dashed border-slate-300">
              <Calculator className="mx-auto text-slate-400 mb-2" size={32} />
              <div className="text-slate-500 text-sm font-medium">No saved calculations yet.</div>
              <div className="text-slate-400 text-xs mt-1">Go to Calculator to save one.</div>
            </div>
          ) : (
            manualReports.map(report => (
              <div key={report._id} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{report.name}</div>
                    <div className="text-xs text-slate-500">{formatDate(report.createdAt)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => shareManualReport(report)}
                  className="h-10 w-10 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <Share2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}