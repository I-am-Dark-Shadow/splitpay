import { useState, useEffect } from 'react';
import { useGroup } from '../../context/GroupContext';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency, formatDate } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// --- IMPORTS FOR MOBILE DOWNLOAD ---
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export default function Report() {
  const { groups, fetchGroups } = useGroup();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  // --- HELPER: SAVE AND SHARE FILE (MOBILE ONLY) ---
  const saveAndSharePdf = async (fileName, doc) => {
    try {
      // 1. Get Base64 string from jsPDF (removing the data URI prefix)
      const base64String = doc.output('datauristring').split(',')[1];

      // 2. Write file to Cache Directory (No complex permissions needed here)
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64String,
        directory: Directory.Cache, 
      });

      // 3. Open Share Dialog
      await Share.share({
        title: 'Expense Report',
        text: 'Here is your expense report.',
        url: savedFile.uri,
        dialogTitle: 'Download Report',
      });
      
      toast.success('Ready to share/save!');
    } catch (error) {
      console.error('File Write Error:', error);
      toast.error('Could not save file on mobile.');
    }
  };

  const generatePDF = async () => {
    if (!selectedGroupId) return toast.error('Select a group first');
    setLoading(true);

    try {
      // 1. Fetch fresh data
      const { data: group } = await api.get(`/groups/${selectedGroupId}`);
      
      const doc = new jsPDF();
      let finalY = 0; // To track vertical position

      // --- TITLE SECTION ---
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); 
      doc.text(group.name, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Expense Report | Generated on ${new Date().toLocaleDateString()}`, 14, 26);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 30, 196, 30); 

      // --- DATA PROCESSING ---
      // Separate "Real Expenses" vs "Settlements"
      const realExpenses = group.expenses.filter(e => e.description !== 'Settlement Payment');
      const settledExpenses = group.expenses.filter(e => e.description === 'Settlement Payment');

      // 1. Calculate Real Spending (Who spent how much on items)
      let totalGroupSpend = 0;
      const memberSpending = {};
      group.members.forEach(m => memberSpending[m._id] = { name: m.name, amount: 0 });

      realExpenses.forEach(exp => {
        totalGroupSpend += exp.amount;
        const payerId = exp.paidBy?._id || exp.paidBy;
        if(memberSpending[payerId]) memberSpending[payerId].amount += exp.amount;
      });

      // 2. Prepare Payment History (Who paid whom)
      const paymentHistoryBody = settledExpenses.map(exp => {
        const fromName = exp.paidBy?.name || 'Unknown';
        // In settlement logic, share[0] is the receiver
        const toId = exp.shares[0]?.user; 
        const toName = group.members.find(m => m._id === toId)?.name || 'Unknown';
        return [fromName, toName, formatCurrency(exp.amount), formatDate(exp.createdAt)];
      });

      // 3. Pending Debts (Using ALL expenses)
      const pendingSettlements = calculateSettlements(group.expenses, group.members);


      // --- PDF GENERATION ---

      // SECTION 1: TOTAL SPENDING OVERVIEW
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`1. Total Group Spending: ${formatCurrency(totalGroupSpend)}`, 14, 40);

      const spendingBody = Object.values(memberSpending)
        .sort((a, b) => b.amount - a.amount)
        .map(m => [m.name, formatCurrency(m.amount)]);

      autoTable(doc, {
        startY: 45,
        head: [['Member', 'Total Spent (Real Expenses)']],
        body: spendingBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }, // Slate 900
        styles: { fontSize: 10 }
      });
      
      finalY = doc.lastAutoTable.finalY + 15;


      // SECTION 2: PAYMENT HISTORY (Already Paid)
      doc.setFontSize(14);
      doc.text("2. Payment History (Already Settled)", 14, finalY);

      if (paymentHistoryBody.length > 0) {
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Payer', 'Receiver', 'Amount', 'Date']],
          body: paymentHistoryBody,
          theme: 'grid',
          headStyles: { fillColor: [5, 150, 105] }, // Emerald (Success)
          styles: { fontSize: 10 }
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("No payments made yet.", 14, finalY + 7);
        // Manual adjustment if table not drawn
        doc.lastAutoTable = { finalY: finalY + 10 }; 
      }
      
      finalY = doc.lastAutoTable.finalY + 15;


      // SECTION 3: PENDING SETTLEMENTS (Still Owe)
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("3. Pending Balances (Who Pays Whom)", 14, finalY);

      if (pendingSettlements.length > 0) {
        const pendingBody = pendingSettlements.map(s => {
          const fromName = group.members.find(m => m._id === s.from)?.name || 'Unknown';
          const toName = group.members.find(m => m._id === s.to)?.name || 'Unknown';
          return [fromName, toName, formatCurrency(s.amount)];
        });

        autoTable(doc, {
          startY: finalY + 5,
          head: [['Payer (Has to pay)', 'Receiver (Will receive)', 'Amount']],
          body: pendingBody,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] }, // Red (Danger/Pending)
          styles: { fontSize: 10, fontStyle: 'bold' }
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text("All balances are currently settled!", 14, finalY + 8);
      }

      // --- SAVE FILE (Logic Updated for Mobile/Web) ---
      const fileName = `${group.name.replace(/\s+/g, '_')}_Full_Report.pdf`;

      if (Capacitor.isNativePlatform()) {
        // MOBILE APP: Save using Filesystem & Share
        await saveAndSharePdf(fileName, doc);
      } else {
        // WEBSITE: Normal Download
        doc.save(fileName);
        toast.success('Report Downloaded');
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-5 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Expense Reports</h1>
        <p className="text-sm text-slate-600">Download detailed PDF summaries.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">Select Group</label>
          <select 
            className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
          >
            <option value="" disabled> Choose a Group </option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <Button onClick={generatePDF} disabled={loading || !selectedGroupId} className="w-full">
            {loading ? 'Generating...' : (
              <>
                <Download size={18} /> Download Full Report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}