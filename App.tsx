import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  Download, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  FileJson,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  IndianRupee,
  CreditCard,
  Banknote
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Expense, 
  Debt, 
  TransactionType, 
  DebtType, 
  DebtStatus, 
  ViewState 
} from './types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';
import { loadData, saveData } from './services/storageService';
import { exportToCSV, exportToJSON } from './services/exportService';
import { generateFinancialInsights } from './services/geminiService';
import { Modal } from './components/Modal';

// --- Helper Components ---

const StatCard = ({ title, value, type, icon: Icon, subtext }: { title: string, value: string, type: 'primary' | 'success' | 'danger' | 'warning', icon: any, subtext?: string }) => {
  const styles = {
    primary: 'from-violet-500 to-fuchsia-500 text-white shadow-violet-200',
    success: 'from-emerald-400 to-teal-500 text-white shadow-emerald-200',
    danger: 'from-rose-500 to-pink-500 text-white shadow-rose-200',
    warning: 'from-amber-400 to-orange-500 text-white shadow-amber-200',
  };

  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-xl bg-gradient-to-br ${styles[type]} transition-transform hover:-translate-y-1 duration-300`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">{title}</p>
            <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
            {subtext && <p className="text-xs mt-1 opacity-80">{subtext}</p>}
          </div>
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </div>
      {/* Decorative Circles */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-black/5 blur-xl"></div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  
  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // AI State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const data = loadData();
    setExpenses(data.expenses);
    setDebts(data.debts);
  }, []);

  useEffect(() => {
    saveData({ expenses, debts });
  }, [expenses, debts]);

  // --- Derived Data ---
  const totalIncome = expenses
    .filter(e => e.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = expenses
    .filter(e => e.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const totalOwedToMe = debts
    .filter(d => d.type === DebtType.OWES_ME && d.status === DebtStatus.PENDING)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalIOwe = debts
    .filter(d => d.type === DebtType.I_OWE && d.status === DebtStatus.PENDING)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // --- Handlers ---

  const handleSaveExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : crypto.randomUUID(),
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      date: formData.get('date') as string,
      type: formData.get('type') as TransactionType,
    };

    if (editingExpense) {
      setExpenses(prev => prev.map(ex => ex.id === newExpense.id ? newExpense : ex));
    } else {
      setExpenses(prev => [newExpense, ...prev]);
    }
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const deleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveDebt = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newDebt: Debt = {
      id: editingDebt ? editingDebt.id : crypto.randomUUID(),
      person: formData.get('person') as string,
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as DebtType,
      status: editingDebt ? editingDebt.status : DebtStatus.PENDING,
      dueDate: formData.get('dueDate') as string,
      description: formData.get('description') as string,
    };

    if (editingDebt) {
      setDebts(prev => prev.map(d => d.id === newDebt.id ? newDebt : d));
    } else {
      setDebts(prev => [newDebt, ...prev]);
    }
    setIsDebtModalOpen(false);
    setEditingDebt(null);
  };

  const toggleDebtStatus = (id: string) => {
    setDebts(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: d.status === DebtStatus.PENDING ? DebtStatus.PAID : DebtStatus.PENDING };
      }
      return d;
    }));
  };

  const deleteDebt = (id: string) => {
    if (confirm('Are you sure you want to delete this debt record?')) {
      setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  const triggerAiInsight = async () => {
    if (!process.env.API_KEY) {
      alert("Please configure your Gemini API Key in the environment.");
      return;
    }
    setIsAiLoading(true);
    const insight = await generateFinancialInsights(expenses, debts);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Balance" 
          value={`₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          type="primary" 
          icon={Wallet}
          subtext="Available funds"
        />
        <StatCard 
          title="Monthly Spend" 
          value={`₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          type="warning" 
          icon={CreditCard}
          subtext="Total outgoing"
        />
        <StatCard 
          title="To Receive" 
          value={`₹${totalOwedToMe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          type="success" 
          icon={TrendingUp}
          subtext="Pending debts from others"
        />
        <StatCard 
          title="To Pay" 
          value={`₹${totalIOwe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          type="danger" 
          icon={ArrowRightLeft}
          subtext="Your pending debts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Financial Overview</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</span>
              <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Expense</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Summary', Income: totalIncome, Expense: totalExpense }
              ]} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis tickFormatter={(val) => `₹${val/1000}k`} stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 8, 8]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="bg-gradient-to-b from-indigo-900 to-violet-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
             <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={24} />
                AI Insights
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
              {aiInsight ? (
                <div className="prose prose-invert prose-sm leading-relaxed opacity-90">
                  {aiInsight.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-indigo-200/60 border-2 border-dashed border-indigo-700/50 rounded-xl">
                  <Sparkles size={32} className="mb-2 opacity-50" />
                  <p>Tap analyze for smart insights</p>
                </div>
              )}
            </div>

            <button 
              onClick={triggerAiInsight}
              disabled={isAiLoading}
              className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/20 hover:bg-gray-50 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAiLoading ? (
                 <>
                   <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                   Analyzing...
                 </>
              ) : (
                <>Analyze Finances</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Banknote className="text-violet-600" /> Transactions
        </h2>
        <button 
          onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium"
        >
          <Plus size={18} /> New Entry
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-100">
              <tr>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Description</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4 text-right">Amount</th>
                <th className="px-8 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No transactions recorded yet.</td></tr>
              ) : expenses.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-8 py-4 text-gray-500 font-medium">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-8 py-4 text-gray-800 font-semibold">{item.description}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-8 py-4 text-right font-bold text-base ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.type === TransactionType.INCOME ? '+' : '-'} ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingExpense(item); setIsExpenseModalOpen(true); }}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteExpense(item.id)}
                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDebts = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ArrowRightLeft className="text-violet-600" /> Debt Manager
        </h2>
        <button 
          onClick={() => { setEditingDebt(null); setIsDebtModalOpen(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium"
        >
          <Plus size={18} /> New Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.map(debt => {
          const isPaid = debt.status === DebtStatus.PAID;
          const isOweMe = debt.type === DebtType.OWES_ME;

          return (
            <div key={debt.id} className={`bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-gray-100`}>
               {/* Status Color Bar */}
               <div className={`absolute top-0 left-0 w-1.5 h-full ${isPaid ? 'bg-gray-300' : isOweMe ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
               
               <div className="flex justify-between items-start mb-3 pl-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isOweMe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isOweMe ? 'You receive' : 'You pay'}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setEditingDebt(debt); setIsDebtModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Edit2 size={16} /></button>
                     <button onClick={() => deleteDebt(debt.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </div>
               </div>
               
               <div className="pl-3">
                 <h3 className="text-2xl font-bold text-gray-800 mb-1">{debt.person}</h3>
                 <p className="text-gray-500 text-sm mb-6 line-clamp-2">{debt.description || 'No additional details'}</p>
                 
                 <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase mb-1">Amount</p>
                      <p className={`text-2xl font-bold ${isPaid ? 'text-gray-300 line-through' : 'text-gray-800'}`}>
                        ₹{debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleDebtStatus(debt.id)}
                      className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-bold transition-colors ${isPaid ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                    >
                      {isPaid ? <><XCircle size={14} /> Unmark</> : <><CheckCircle2 size={14} /> Settle</>}
                    </button>
                 </div>
               </div>

               {debt.dueDate && (
                 <div className="absolute top-4 right-4 text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                   Due: {new Date(debt.dueDate).toLocaleDateString('en-IN')}
                 </div>
               )}
            </div>
          )
        })}
        {debts.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <ArrowRightLeft size={48} className="mb-4 opacity-20" />
            <p>No debt records found.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f4f8] text-slate-900 font-sans no-print selection:bg-violet-200 selection:text-violet-900">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 font-['Poppins']">FinTrack</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-100/50 shadow-2xl shadow-indigo-100/50 p-8 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-12 hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
              <IndianRupee size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-['Poppins']">FinTrack</h1>
          </div>
          <p className="text-xs text-gray-400 font-medium pl-1">Personal Finance Manager</p>
        </div>

        <nav className="flex-1 space-y-3">
          <button onClick={() => { setView('DASHBOARD'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${view === 'DASHBOARD' ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => { setView('EXPENSES'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${view === 'EXPENSES' ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Wallet size={20} /> Transactions
          </button>
          <button onClick={() => { setView('DEBTS'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${view === 'DEBTS' ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <ArrowRightLeft size={20} /> Debts
          </button>
        </nav>

        <div className="pt-8 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest px-2">Export Data</p>
          <div className="space-y-2">
            <button onClick={() => exportToCSV(expenses, debts)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl transition-colors">
              <FileSpreadsheet size={18} /> Excel / CSV
            </button>
            <button onClick={() => exportToJSON(expenses, debts)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl transition-colors">
              <FileJson size={18} /> JSON
            </button>
             <button onClick={() => window.print()} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl transition-colors">
              <Printer size={18} /> Print Report
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto print-only">
        <div className="max-w-7xl mx-auto">
          {view === 'DASHBOARD' && renderDashboard()}
          {view === 'EXPENSES' && renderExpenses()}
          {view === 'DEBTS' && renderDebts()}
        </div>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title={editingExpense ? "Edit Transaction" : "New Transaction"}
      >
        <form onSubmit={handleSaveExpense} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <div className="relative">
                 <select name="type" defaultValue={editingExpense?.type || TransactionType.EXPENSE} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none appearance-none transition-shadow">
                  <option value={TransactionType.EXPENSE}>Expense</option>
                  <option value={TransactionType.INCOME}>Income</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
              <input name="amount" type="number" step="0.01" required defaultValue={editingExpense?.amount} placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <input name="description" type="text" required defaultValue={editingExpense?.description} placeholder="e.g. Grocery Shopping" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <input list="categories" name="category" required defaultValue={editingExpense?.category} placeholder="Select..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
              <datalist id="categories">
                {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
               <input name="date" type="date" required defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/30 transition-all font-medium">Save Transaction</button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isDebtModalOpen} 
        onClose={() => setIsDebtModalOpen(false)} 
        title={editingDebt ? "Edit Debt Record" : "New Debt Record"}
      >
        <form onSubmit={handleSaveDebt} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
              <div className="relative">
                <select name="type" defaultValue={editingDebt?.type || DebtType.OWES_ME} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none appearance-none transition-shadow">
                  <option value={DebtType.OWES_ME}>They Owe Me</option>
                  <option value={DebtType.I_OWE}>I Owe Them</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
              <input name="amount" type="number" step="0.01" required defaultValue={editingDebt?.amount} placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Person Name</label>
            <input name="person" type="text" required defaultValue={editingDebt?.person} placeholder="e.g. John Doe" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Note / Reason</label>
            <textarea name="description" rows={2} defaultValue={editingDebt?.description} placeholder="e.g. Lunch split" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
          </div>
           <div>
               <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date (Optional)</label>
               <input name="dueDate" type="date" defaultValue={editingDebt?.dueDate} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
            </div>
          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsDebtModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/30 transition-all font-medium">Save Record</button>
          </div>
        </form>
      </Modal>

      {/* Print View Only (Hidden by default, shown when printing) */}
      <div className="hidden print:block fixed inset-0 bg-white z-[100] p-8 overflow-visible">
        <h1 className="text-3xl font-bold mb-6">Financial Report</h1>
        <p className="text-gray-500 mb-8">Generated on {new Date().toLocaleDateString('en-IN')}</p>
        
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Summary</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="border p-4">Total Balance: ₹{balance.toFixed(2)}</div>
           <div className="border p-4">Monthly Expenses: ₹{totalExpense.toFixed(2)}</div>
        </div>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">Expenses</h2>
        <table className="w-full text-sm mb-8 border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td className="p-2 border">{e.date}</td>
                <td className="p-2 border">{e.description}</td>
                <td className="p-2 border">₹{e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">Outstanding Debts</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Person</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Amount</th>
            </tr>
          </thead>
          <tbody>
            {debts.filter(d => d.status === 'PENDING').map(d => (
              <tr key={d.id}>
                <td className="p-2 border">{d.person}</td>
                <td className="p-2 border">{d.type === 'OWES_ME' ? 'Owes Me' : 'I Owe'}</td>
                <td className="p-2 border">₹{d.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// ve
