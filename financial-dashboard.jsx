import { useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Briefcase, PieChart as PieIcon, BarChart2, Eye, EyeOff, Download, Upload, FileText, AlertCircle, Target, Search } from "lucide-react";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#3b82f6"];
const CATEGORY_ICONS = { Stocks: "📈", "Mutual Funds": "📊", Bonds: "🏦", "Real Estate": "🏠", Crypto: "₿", Cash: "💵" };

const defaultCategories = ["Stocks", "Mutual Funds", "Bonds", "Real Estate", "Crypto", "Cash"];

const initialPortfolios = [
  {
    id: 1, name: "Retirement Fund", description: "Long-term retirement savings",
    investments: [
      { id: 1, name: "S&P 500 Index Fund", category: "Mutual Funds", invested: 45000, current: 52300, units: 120, date: "2023-01-15" },
      { id: 2, name: "Apple Inc.", category: "Stocks", invested: 15000, current: 19200, units: 85, date: "2022-06-20" },
      { id: 3, name: "US Treasury Bonds", category: "Bonds", invested: 30000, current: 31500, units: 30, date: "2021-11-01" },
      { id: 4, name: "Vanguard Total Bond", category: "Bonds", invested: 20000, current: 20800, units: 200, date: "2023-03-10" },
      { id: 5, name: "Real Estate Trust", category: "Real Estate", invested: 25000, current: 28900, units: 50, date: "2022-01-05" },
      { id: 6, name: "High-Yield Savings", category: "Cash", invested: 10000, current: 10450, units: 1, date: "2024-01-01" },
    ],
  },
  {
    id: 2, name: "Growth Portfolio", description: "Aggressive growth strategy",
    investments: [
      { id: 1, name: "Tesla Inc.", category: "Stocks", invested: 20000, current: 26500, units: 50, date: "2023-05-10" },
      { id: 2, name: "NVIDIA Corp.", category: "Stocks", invested: 18000, current: 31200, units: 30, date: "2023-02-14" },
      { id: 3, name: "Bitcoin", category: "Crypto", invested: 15000, current: 22100, units: 0.35, date: "2023-07-20" },
      { id: 4, name: "Ethereum", category: "Crypto", invested: 8000, current: 11300, units: 4.5, date: "2023-08-01" },
      { id: 5, name: "ARK Innovation ETF", category: "Mutual Funds", invested: 12000, current: 10800, units: 250, date: "2023-04-15" },
      { id: 6, name: "Amazon.com Inc.", category: "Stocks", invested: 16000, current: 21400, units: 90, date: "2022-11-20" },
    ],
  },
  {
    id: 3, name: "Conservative Fund", description: "Low-risk stable returns",
    investments: [
      { id: 1, name: "Municipal Bonds", category: "Bonds", invested: 40000, current: 42200, units: 40, date: "2022-03-01" },
      { id: 2, name: "Money Market Fund", category: "Cash", invested: 25000, current: 26100, units: 1, date: "2023-01-01" },
      { id: 3, name: "Rental Property REIT", category: "Real Estate", invested: 35000, current: 38500, units: 70, date: "2021-09-15" },
      { id: 4, name: "Corporate Bond Fund", category: "Bonds", invested: 20000, current: 21300, units: 200, date: "2023-06-01" },
      { id: 5, name: "Johnson & Johnson", category: "Stocks", invested: 10000, current: 11200, units: 60, date: "2023-02-28" },
      { id: 6, name: "Procter & Gamble", category: "Stocks", invested: 8000, current: 9100, units: 50, date: "2023-05-15" },
    ],
  },
];

const formatCurrency = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

/* ── Performance Analytics ── */
const calculatePerformanceMetrics = (investments) => {
  if (!investments.length) return { roi: 0, volatility: 0, sharpeRatio: 0 };
  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.current, 0);
  const roi = totalInvested ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
  const returns = investments.map(i => ((i.current - i.invested) / i.invested) * 100);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  const sharpeRatio = volatility ? (roi - 2.5) / volatility : 0;
  return { roi, volatility, sharpeRatio };
};

/* ── Risk Analysis ── */
const calculateRiskScore = (portfolio) => {
  const investments = portfolio.investments;
  if (!investments.length) return 0;
  const categoryRisks = { Stocks: 8, Crypto: 9, "Mutual Funds": 5, Bonds: 2, "Real Estate": 6, Cash: 1 };
  const diversification = investments.length > 5 ? 10 : investments.length * 2;
  const totalCurrent = investments.reduce((s, i) => s + i.current, 0);
  const weightedRisk = investments.reduce((s, i) => s + (categoryRisks[i.category] || 5) * (i.current / totalCurrent), 0);
  const riskScore = (weightedRisk + diversification) / 2;
  return Math.min(100, Math.max(0, riskScore));
};

/* ───── Modal Component ───── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ───── Input field ───── */
function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {options.map((o) => <option key={o} value={o} style={{ background: "#1e1b4b" }}>{o}</option>)}
      </select>
    </div>
  );
}

/* ───── Stat Card ───── */
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2 transition-transform hover:scale-105"
      style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.8) 0%, rgba(15,23,42,0.8) 100%)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl" style={{ background: `${color}22` }}>{icon}</div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-sm" style={{ color }}>{sub}</div>}
    </div>
  );
}

/* ───── Main Dashboard ───── */
export default function FinancialDashboard() {
  // Initialize with localStorage if available
  const [portfolios, setPortfolios] = useState(() => {
    const saved = localStorage.getItem("finportal_portfolios");
    return saved ? JSON.parse(saved) : initialPortfolios;
  });
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("finportal_categories");
    return saved ? JSON.parse(saved) : defaultCategories;
  });
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("finportal_goals");
    return saved ? JSON.parse(saved) : [];
  });
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem("finportal_alerts");
    return saved ? JSON.parse(saved) : [];
  });

  // Existing state
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [expandedPortfolio, setExpandedPortfolio] = useState(null);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [view, setView] = useState("overview");
  const [form, setForm] = useState({});
  const [investForm, setInvestForm] = useState({ name: "", category: categories[0], invested: "", current: "", units: "", date: "" });

  // New feature states
  const [showGoals, setShowGoals] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [newGoal, setNewGoal] = useState({ name: "", targetValue: "", portfolioId: "" });
  const [newAlert, setNewAlert] = useState({ name: "", type: "threshold", value: "", portfolioId: "" });

  /* ── Computed stats ── */
  const globalStats = useMemo(() => {
    let invested = 0, current = 0;
    portfolios.forEach((p) => p.investments.forEach((i) => { invested += i.invested; current += i.current; }));
    return { invested, current, gain: current - invested, pct: invested ? ((current - invested) / invested) * 100 : 0 };
  }, [portfolios]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    portfolios.forEach((p) => p.investments.forEach((i) => {
      if (!map[i.category]) map[i.category] = { invested: 0, current: 0 };
      map[i.category].invested += i.invested;
      map[i.category].current += i.current;
    }));
    return Object.entries(map).map(([name, v]) => ({ name, invested: v.invested, current: v.current, gain: v.current - v.invested }));
  }, [portfolios]);

  const portfolioSummaries = useMemo(() =>
    portfolios.map((p) => {
      const invested = p.investments.reduce((s, i) => s + i.invested, 0);
      const current = p.investments.reduce((s, i) => s + i.current, 0);
      const metrics = calculatePerformanceMetrics(p.investments);
      const riskScore = calculateRiskScore(p);
      return { ...p, invested, current, gain: current - invested, pct: invested ? ((current - invested) / invested) * 100 : 0, ...metrics, riskScore };
    }), [portfolios]);

  // Save to localStorage whenever data changes
  useMemo(() => {
    localStorage.setItem("finportal_portfolios", JSON.stringify(portfolios));
  }, [portfolios]);

  useMemo(() => {
    localStorage.setItem("finportal_categories", JSON.stringify(categories));
  }, [categories]);

  useMemo(() => {
    localStorage.setItem("finportal_goals", JSON.stringify(goals));
  }, [goals]);

  useMemo(() => {
    localStorage.setItem("finportal_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Filtered investments for search/sort
  const filteredInvestments = useMemo(() => {
    let all = [];
    portfolios.forEach(p => {
      all = all.concat(p.investments.map(i => ({ ...i, portfolioId: p.id, portfolioName: p.name })));
    });
    let filtered = all.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortBy === "gain") filtered.sort((a, b) => (b.current - b.invested) - (a.current - a.invested));
    else if (sortBy === "value") filtered.sort((a, b) => b.current - a.current);
    else if (sortBy === "date") filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    else filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [portfolios, searchTerm, sortBy]);

  /* ── Handlers ── */
  const addPortfolio = () => {
    if (!form.name) return;
    setPortfolios((prev) => [...prev, { id: Date.now(), name: form.name, description: form.description || "", investments: [] }]);
    setForm({});
    setShowAddPortfolio(false);
  };

  const updatePortfolio = () => {
    if (!form.name) return;
    setPortfolios((prev) => prev.map((p) => (p.id === editingPortfolio ? { ...p, name: form.name, description: form.description || "" } : p)));
    setForm({});
    setEditingPortfolio(null);
  };

  const deletePortfolio = (id) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
    if (expandedPortfolio === id) setExpandedPortfolio(null);
  };

  const addInvestment = (portfolioId) => {
    const inv = { id: Date.now(), name: investForm.name, category: investForm.category, invested: +investForm.invested, current: +investForm.current, units: +investForm.units, date: investForm.date };
    if (!inv.name || !inv.invested) return;
    setPortfolios((prev) => prev.map((p) => (p.id === portfolioId ? { ...p, investments: [...p.investments, inv] } : p)));
    setInvestForm({ name: "", category: categories[0], invested: "", current: "", units: "", date: "" });
    setShowAddInvestment(false);
  };

  const updateInvestment = (portfolioId) => {
    const inv = { ...editingInvestment, name: investForm.name, category: investForm.category, invested: +investForm.invested, current: +investForm.current, units: +investForm.units, date: investForm.date };
    setPortfolios((prev) => prev.map((p) => (p.id === portfolioId ? { ...p, investments: p.investments.map((i) => (i.id === inv.id ? inv : i)) } : p)));
    setInvestForm({ name: "", category: categories[0], invested: "", current: "", units: "", date: "" });
    setEditingInvestment(null);
  };

  const deleteInvestment = (portfolioId, investmentId) => {
    setPortfolios((prev) => prev.map((p) => (p.id === portfolioId ? { ...p, investments: p.investments.filter((i) => i.id !== investmentId) } : p)));
  };

  const addCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    setCategories((prev) => [...prev, newCategory.trim()]);
    setNewCategory("");
    setShowAddCategory(false);
  };

  const deleteCategory = (cat) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetValue || !newGoal.portfolioId) return;
    setGoals(prev => [...prev, { id: Date.now(), ...newGoal, targetValue: +newGoal.targetValue, createdDate: new Date().toISOString() }]);
    setNewGoal({ name: "", targetValue: "", portfolioId: "" });
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addAlert = () => {
    if (!newAlert.name || !newAlert.value || !newAlert.portfolioId) return;
    setAlerts(prev => [...prev, { id: Date.now(), ...newAlert, value: +newAlert.value }]);
    setNewAlert({ name: "", type: "threshold", value: "", portfolioId: "" });
  };

  const deleteAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const exportData = (format) => {
    const data = { portfolios, categories, goals, alerts, exportDate: new Date().toISOString() };
    if (format === "json") {
      const dataStr = JSON.stringify(data, null, 2);
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(dataStr));
      element.setAttribute("download", `finportal_backup_${new Date().toISOString().slice(0, 10)}.json`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === "csv") {
      let csv = "Portfolio,Investment,Category,Invested,Current,Gain,Gain %\n";
      portfolios.forEach(p => {
        p.investments.forEach(i => {
          const gain = i.current - i.invested;
          const pct = ((gain / i.invested) * 100).toFixed(2);
          csv += `"${p.name}","${i.name}","${i.category}",${i.invested},${i.current},${gain},${pct}\n`;
        });
      });
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
      element.setAttribute("download", `finportal_data_${new Date().toISOString().slice(0, 10)}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.portfolios) setPortfolios(imported.portfolios);
        if (imported.categories) setCategories(imported.categories);
        if (imported.goals) setGoals(imported.goals);
        if (imported.alerts) setAlerts(imported.alerts);
        alert("Data imported successfully!");
      } catch (error) {
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const generateReport = () => {
    let report = `FINANCIAL PORTFOLIO REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    report += `OVERALL SUMMARY\n`;
    report += `Total Invested: ${formatCurrency(globalStats.invested)}\n`;
    report += `Current Value: ${formatCurrency(globalStats.current)}\n`;
    report += `Total Gain/Loss: ${formatCurrency(globalStats.gain)} (${formatPct(globalStats.pct)})\n\n`;
    report += `PORTFOLIO BREAKDOWN\n`;
    portfolioSummaries.forEach(p => {
      const metrics = calculatePerformanceMetrics(p.investments);
      const risk = calculateRiskScore(p);
      report += `\n${p.name}\n`;
      report += `  Invested: ${formatCurrency(p.invested)}\n`;
      report += `  Current: ${formatCurrency(p.current)}\n`;
      report += `  Gain/Loss: ${formatCurrency(p.gain)} (${formatPct(p.pct)})\n`;
      report += `  ROI: ${formatPct(metrics.roi)}\n`;
      report += `  Risk Score: ${risk.toFixed(1)}/100\n`;
      report += `  Investments: ${p.investments.length}\n`;
    });
    report += `\n\nCATEGORY ALLOCATION\n`;
    categoryBreakdown.forEach(c => {
      const pct = ((c.current / globalStats.current) * 100).toFixed(2);
      report += `${c.name}: ${formatCurrency(c.current)} (${pct}%)\n`;
    });
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
    element.setAttribute("download", `finportal_report_${new Date().toISOString().slice(0, 10)}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /* ── Pie data ── */
  const pieData = categoryBreakdown.map((c) => ({ name: c.name, value: c.current }));
  const portfolioPieData = portfolioSummaries.map((p) => ({ name: p.name, value: p.current }));

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0c0a1d 0%, #111827 50%, #0c0a1d 100%)" }}>
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Briefcase size={22} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #c7d2fe, #e0e7ff, #a5b4fc)" }}>FinPortal</h1>
            </div>
            <p className="text-gray-400 text-sm ml-14">Your financial portfolio dashboard</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setView("overview")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "overview" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={view === "overview" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : { background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><PieIcon size={15} /> Overview</span>
            </button>
            <button onClick={() => setView("portfolios")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "portfolios" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={view === "portfolios" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : { background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><BarChart2 size={15} /> Portfolios</span>
            </button>
            <button onClick={() => setView("analytics")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "analytics" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={view === "analytics" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : { background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><TrendingUp size={15} /> Analytics</span>
            </button>
            <button onClick={() => setShowGoals(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><Target size={15} /> Goals</span>
            </button>
            <button onClick={() => setShowAlerts(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all relative"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><AlertCircle size={15} /> Alerts {alerts.length > 0 && <span className="text-xs bg-red-500 px-2 py-1 rounded-full ml-1">{alerts.length}</span>}</span>
            </button>
            <button onClick={() => setShowReports(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><FileText size={15} /> Reports</span>
            </button>
            <button onClick={() => setShowManageCategories(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <span className="flex items-center gap-1.5"><Edit3 size={15} /> Categories</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-10">
        {/* ── Global Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<DollarSign size={20} className="text-indigo-400" />} label="Total Invested" value={formatCurrency(globalStats.invested)} color="#6366f1" />
          <StatCard icon={<TrendingUp size={20} className="text-cyan-400" />} label="Current Value" value={formatCurrency(globalStats.current)} color="#22d3ee" />
          <StatCard icon={globalStats.gain >= 0 ? <TrendingUp size={20} className="text-emerald-400" /> : <TrendingDown size={20} className="text-red-400" />}
            label="Total Gain/Loss" value={formatCurrency(Math.abs(globalStats.gain))} sub={formatPct(globalStats.pct)}
            color={globalStats.gain >= 0 ? "#10b981" : "#ef4444"} />
          <StatCard icon={<Briefcase size={20} className="text-amber-400" />} label="Portfolios" value={portfolios.length} sub={`${portfolios.reduce((s, p) => s + p.investments.length, 0)} investments`} color="#f59e0b" />
        </div>

        {view === "overview" && (
          <>
            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Category pie */}
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.6) 0%, rgba(15,23,42,0.6) 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-lg font-semibold text-white mb-4">Allocation by Category</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value" stroke="none" paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                        formatter={(v) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-500 text-center py-20">No investments yet</p>}
              </div>

              {/* Portfolio pie */}
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.6) 0%, rgba(15,23,42,0.6) 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-lg font-semibold text-white mb-4">Allocation by Portfolio</h3>
                {portfolioPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={portfolioPieData} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value" stroke="none" paddingAngle={2}>
                        {portfolioPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                        formatter={(v) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-500 text-center py-20">No portfolios yet</p>}
              </div>
            </div>

            {/* ── Category bar chart ── */}
            <div className="rounded-2xl p-6 mb-8" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.6) 0%, rgba(15,23,42,0.6) 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-lg font-semibold text-white mb-4">Invested vs Current Value by Category</h3>
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={categoryBreakdown} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                      formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 13 }} />
                    <Bar dataKey="invested" name="Invested" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="current" name="Current" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500 text-center py-20">No data available</p>}
            </div>

            {/* ── Portfolio Performance Bar ── */}
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.6) 0%, rgba(15,23,42,0.6) 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
              {portfolioSummaries.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={portfolioSummaries.map((p) => ({ name: p.name, Gain: p.gain, "Return %": +p.pct.toFixed(2) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                      formatter={(v, name) => (name === "Gain" ? formatCurrency(v) : v + "%")} />
                    <Bar dataKey="Gain" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500 text-center py-20">No portfolios yet</p>}
            </div>
          </>
        )}

        {view === "portfolios" && (
          <>
            {/* ── Add Portfolio Button ── */}
            <div className="flex justify-end mb-6">
              <button onClick={() => { setForm({ name: "", description: "" }); setShowAddPortfolio(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Plus size={16} /> Add Portfolio
              </button>
            </div>

            {/* ── Portfolio Cards ── */}
            {portfolioSummaries.map((portfolio) => (
              <div key={portfolio.id} className="mb-6 rounded-2xl overflow-hidden transition-all"
                style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.6) 0%, rgba(15,23,42,0.6) 100%)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                {/* Header */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedPortfolio(expandedPortfolio === portfolio.id ? null : portfolio.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${COLORS[portfolios.indexOf(portfolios.find((p) => p.id === portfolio.id)) % COLORS.length]}22` }}>
                      {CATEGORY_ICONS["Stocks"]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{portfolio.name}</h3>
                      <p className="text-sm text-gray-400">{portfolio.description} &middot; {portfolio.investments.length} investments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Current Value</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(portfolio.current)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Gain/Loss</p>
                      <p className="text-lg font-bold" style={{ color: portfolio.gain >= 0 ? "#10b981" : "#ef4444" }}>
                        {formatCurrency(Math.abs(portfolio.gain))} <span className="text-sm">({formatPct(portfolio.pct)})</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setForm({ name: portfolio.name, description: portfolio.description }); setEditingPortfolio(portfolio.id); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-400 hover:bg-opacity-10 transition-colors"><Edit3 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deletePortfolio(portfolio.id); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400 hover:bg-opacity-10 transition-colors"><Trash2 size={16} /></button>
                      {expandedPortfolio === portfolio.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded: investment table */}
                {expandedPortfolio === portfolio.id && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Mini charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                      <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Category Split</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={(() => {
                              const m = {};
                              portfolio.investments.forEach((i) => { m[i.category] = (m[i.category] || 0) + i.current; });
                              return Object.entries(m).map(([name, value]) => ({ name, value }));
                            })()} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" stroke="none" paddingAngle={2}>
                              {Object.keys((() => { const m = {}; portfolio.investments.forEach((i) => { m[i.category] = 1; }); return m; })()).map((_, i) =>
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                              formatter={(v) => formatCurrency(v)} />
                            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Invested vs Current</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={portfolio.investments.map((i) => ({ name: i.name.length > 12 ? i.name.slice(0, 12) + "…" : i.name, Invested: i.invested, Current: i.current }))}>
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                              formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="Invested" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Current" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Investments table */}
                    <div className="px-5 pb-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Investments</h4>
                        <button onClick={() => { setActivePortfolio(portfolio.id); setInvestForm({ name: "", category: categories[0], invested: "", current: "", units: "", date: "" }); setShowAddInvestment(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-white hover:bg-indigo-500 hover:bg-opacity-20 transition-colors"
                          style={{ border: "1px solid rgba(99,102,241,0.3)" }}>
                          <Plus size={14} /> Add Investment
                        </button>
                      </div>
                    </div>
                    <div className="px-5 pb-5 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 text-xs uppercase tracking-wider" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <th className="text-left py-3 px-3 font-medium">Name</th>
                            <th className="text-left py-3 px-3 font-medium">Category</th>
                            <th className="text-right py-3 px-3 font-medium">Invested</th>
                            <th className="text-right py-3 px-3 font-medium">Current</th>
                            <th className="text-right py-3 px-3 font-medium">Gain/Loss</th>
                            <th className="text-right py-3 px-3 font-medium">Return</th>
                            <th className="text-right py-3 px-3 font-medium">Units</th>
                            <th className="text-center py-3 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolio.investments.map((inv) => {
                            const gain = inv.current - inv.invested;
                            const pct = inv.invested ? ((gain) / inv.invested) * 100 : 0;
                            return (
                              <tr key={inv.id} className="hover:bg-white hover:bg-opacity-5 transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{CATEGORY_ICONS[inv.category] || "📌"}</span>
                                    <span className="text-white font-medium">{inv.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>{inv.category}</span>
                                </td>
                                <td className="py-3 px-3 text-right text-gray-300">{formatCurrency(inv.invested)}</td>
                                <td className="py-3 px-3 text-right text-white font-medium">{formatCurrency(inv.current)}</td>
                                <td className="py-3 px-3 text-right font-medium" style={{ color: gain >= 0 ? "#10b981" : "#ef4444" }}>
                                  {gain >= 0 ? "+" : "-"}{formatCurrency(Math.abs(gain))}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                    style={{ background: gain >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: gain >= 0 ? "#10b981" : "#ef4444" }}>
                                    {formatPct(pct)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right text-gray-300">{inv.units}</td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => { setActivePortfolio(portfolio.id); setEditingInvestment(inv); setInvestForm({ name: inv.name, category: inv.category, invested: inv.invested, current: inv.current, units: inv.units, date: inv.date }); }}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-400 hover:bg-opacity-10 transition-colors"><Edit3 size={14} /></button>
                                    <button onClick={() => deleteInvestment(portfolio.id, inv.id)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400 hover:bg-opacity-10 transition-colors"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {portfolio.investments.length === 0 && (
                            <tr><td colSpan={8} className="py-10 text-center text-gray-500">No investments yet. Click "Add Investment" to get started.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {portfolios.length === 0 && (
              <div className="rounded-2xl p-16 text-center" style={{ background: "rgba(30,27,75,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Briefcase size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Portfolios Yet</h3>
                <p className="text-gray-500 mb-6">Create your first portfolio to start tracking investments</p>
                <button onClick={() => { setForm({ name: "", description: "" }); setShowAddPortfolio(true); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  <span className="flex items-center gap-2"><Plus size={16} /> Create Portfolio</span>
                </button>
              </div>
            )}
          </>
        )}

        {view === "analytics" && (
          <>
            {/* Search & Sort */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type="text" placeholder="Search investments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl text-sm outline-none w-full"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                <option value="name" style={{ background: "#1e1b4b" }}>Sort by Name</option>
                <option value="gain" style={{ background: "#1e1b4b" }}>Sort by Gain</option>
                <option value="value" style={{ background: "#1e1b4b" }}>Sort by Value</option>
                <option value="date" style={{ background: "#1e1b4b" }}>Sort by Date</option>
              </select>
            </div>

            {/* Risk Profile & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.4) 0%, rgba(15,23,42,0.4) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <h3 className="text-lg font-semibold mb-4">Portfolio Risk Profile</h3>
                <div className="space-y-4">
                  {portfolioSummaries.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs bg-indigo-500 px-2 py-1 rounded">Risk: {p.riskScore.toFixed(1)}/100</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>ROI: <span className="font-bold text-cyan-400">{formatPct(p.roi)}</span></div>
                        <div>Vol: <span className="font-bold text-amber-400">{p.volatility.toFixed(2)}%</span></div>
                        <div>Sharpe: <span className="font-bold text-emerald-400">{p.sharpeRatio.toFixed(2)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.4) 0%, rgba(15,23,42,0.4) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
                <div className="space-y-3">
                  {categoryBreakdown.sort((a, b) => b.current - a.current).map((cat, idx) => {
                    const pct = (cat.current / globalStats.current) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{CATEGORY_ICONS[cat.name]} {cat.name}</span>
                          <span className="font-semibold">{formatPct(cat.pct || 0)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: Math.min(100, pct) + "%" }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* All Investments Table */}
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, rgba(30,27,75,0.4) 0%, rgba(15,23,42,0.4) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <h3 className="text-lg font-semibold mb-4">All Investments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: "rgba(0,0,0,0.3)" }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 font-semibold">Investment</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-semibold">Portfolio</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-semibold">Category</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-semibold">Invested</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-semibold">Current</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-semibold">Gain/Loss</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-semibold">Return %</th>
                      <th className="px-4 py-3 text-center text-gray-400 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvestments.map((inv) => {
                      const gain = inv.current - inv.invested;
                      const pct = (gain / inv.invested) * 100;
                      return (
                        <tr key={inv.id} style={{ borderBottom: "1px solid rgba(99,102,241,0.1)" }} className="hover:bg-opacity-50 hover:bg-indigo-900">
                          <td className="px-4 py-3">{inv.name}</td>
                          <td className="px-4 py-3 text-gray-300">{inv.portfolioName}</td>
                          <td className="px-4 py-3">{CATEGORY_ICONS[inv.category]} {inv.category}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(inv.invested)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.current)}</td>
                          <td className="px-4 py-3 text-right" style={{ color: gain >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(gain)}</td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: pct >= 0 ? "#10b981" : "#ef4444" }}>{formatPct(pct)}</td>
                          <td className="px-4 py-3 text-center text-gray-400">{formatDate(inv.date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ──────── MODALS ──────── */}

      {/* Add Portfolio */}
      <Modal open={showAddPortfolio} onClose={() => setShowAddPortfolio(false)} title="New Portfolio">
        <Field label="Portfolio Name" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Retirement Fund" />
        <Field label="Description" value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} placeholder="Short description" />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAddPortfolio(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>Cancel</button>
          <button onClick={addPortfolio} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Create Portfolio</button>
        </div>
      </Modal>

      {/* Edit Portfolio */}
      <Modal open={!!editingPortfolio} onClose={() => setEditingPortfolio(null)} title="Edit Portfolio">
        <Field label="Portfolio Name" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Description" value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setEditingPortfolio(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>Cancel</button>
          <button onClick={updatePortfolio} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Save Changes</button>
        </div>
      </Modal>

      {/* Add Investment */}
      <Modal open={showAddInvestment} onClose={() => setShowAddInvestment(false)} title="Add Investment">
        <Field label="Investment Name" value={investForm.name} onChange={(v) => setInvestForm({ ...investForm, name: v })} placeholder="e.g. Apple Inc." />
        <Select label="Category" value={investForm.category} onChange={(v) => setInvestForm({ ...investForm, category: v })} options={categories} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount Invested" type="number" value={investForm.invested} onChange={(v) => setInvestForm({ ...investForm, invested: v })} placeholder="0" />
          <Field label="Current Value" type="number" value={investForm.current} onChange={(v) => setInvestForm({ ...investForm, current: v })} placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Units/Shares" type="number" value={investForm.units} onChange={(v) => setInvestForm({ ...investForm, units: v })} placeholder="0" />
          <Field label="Purchase Date" type="date" value={investForm.date} onChange={(v) => setInvestForm({ ...investForm, date: v })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAddInvestment(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>Cancel</button>
          <button onClick={() => addInvestment(activePortfolio)} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Add Investment</button>
        </div>
      </Modal>

      {/* Edit Investment */}
      <Modal open={!!editingInvestment} onClose={() => setEditingInvestment(null)} title="Edit Investment">
        <Field label="Investment Name" value={investForm.name} onChange={(v) => setInvestForm({ ...investForm, name: v })} />
        <Select label="Category" value={investForm.category} onChange={(v) => setInvestForm({ ...investForm, category: v })} options={categories} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount Invested" type="number" value={investForm.invested} onChange={(v) => setInvestForm({ ...investForm, invested: v })} />
          <Field label="Current Value" type="number" value={investForm.current} onChange={(v) => setInvestForm({ ...investForm, current: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Units/Shares" type="number" value={investForm.units} onChange={(v) => setInvestForm({ ...investForm, units: v })} />
          <Field label="Purchase Date" type="date" value={investForm.date} onChange={(v) => setInvestForm({ ...investForm, date: v })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setEditingInvestment(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>Cancel</button>
          <button onClick={() => updateInvestment(activePortfolio)} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Save Changes</button>
        </div>
      </Modal>

      {/* Manage Categories */}
      <Modal open={showManageCategories} onClose={() => setShowManageCategories(false)} title="Manage Categories">
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="flex items-center gap-2 text-sm text-white">
                <span className="text-base">{CATEGORY_ICONS[cat] || "📌"}</span> {cat}
              </span>
              <button onClick={() => deleteCategory(cat)} className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400 hover:bg-opacity-10 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name..."
            className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <button onClick={addCategory} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <Plus size={16} />
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={() => setShowManageCategories(false)} className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Done</button>
        </div>
      </Modal>

      {/* Goals Modal */}
      <Modal open={showGoals} onClose={() => setShowGoals(false)} title="Investment Goals">
        <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
          {goals.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No goals yet. Create your first goal!</p>
          ) : (
            goals.map((goal) => {
              const portfolio = portfolios.find(p => p.id == goal.portfolioId);
              const progress = portfolio ? (portfolio.investments.reduce((s, i) => s + i.current, 0) / goal.targetValue) * 100 : 0;
              return (
                <div key={goal.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-sm">{goal.name}</div>
                      <div className="text-xs text-gray-400">{portfolio?.name}</div>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">Target: {formatCurrency(goal.targetValue)}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: Math.min(100, progress) + "%" }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{Math.min(100, progress).toFixed(0)}% towards goal</div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-semibold mb-3 text-sm">Add New Goal</h4>
          <Field label="Goal Name" value={newGoal.name} onChange={(v) => setNewGoal({ ...newGoal, name: v })} placeholder="e.g., Retirement Target" />
          <Field label="Target Amount" value={newGoal.targetValue} onChange={(v) => setNewGoal({ ...newGoal, targetValue: v })} type="number" placeholder="0" />
          <Select label="Portfolio" value={newGoal.portfolioId} onChange={(v) => setNewGoal({ ...newGoal, portfolioId: v })} options={[""].concat(portfolios.map(p => p.id))} />
          <button onClick={addGoal} className="w-full py-2 rounded-xl text-white font-medium mt-4" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Create Goal</button>
        </div>
      </Modal>

      {/* Alerts Modal */}
      <Modal open={showAlerts} onClose={() => setShowAlerts(false)} title="Portfolio Alerts">
        <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No alerts set. Create your first alert!</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-xl flex justify-between items-start" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{alert.name}</div>
                  <div className="text-xs text-gray-400">Type: {alert.type} | Threshold: {formatCurrency(alert.value)}</div>
                </div>
                <button onClick={() => deleteAlert(alert.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-semibold mb-3 text-sm">Add Alert</h4>
          <Field label="Alert Name" value={newAlert.name} onChange={(v) => setNewAlert({ ...newAlert, name: v })} placeholder="e.g., Portfolio Dip" />
          <Select label="Alert Type" value={newAlert.type} onChange={(v) => setNewAlert({ ...newAlert, type: v })} options={["threshold", "gain", "loss"]} />
          <Field label="Value" value={newAlert.value} onChange={(v) => setNewAlert({ ...newAlert, value: v })} type="number" placeholder="0" />
          <Select label="Portfolio" value={newAlert.portfolioId} onChange={(v) => setNewAlert({ ...newAlert, portfolioId: v })} options={[""].concat(portfolios.map(p => p.id))} />
          <button onClick={addAlert} className="w-full py-2 rounded-xl text-white font-medium mt-4" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Create Alert</button>
        </div>
      </Modal>

      {/* Reports Modal */}
      <Modal open={showReports} onClose={() => setShowReports(false)} title="Reports & Export">
        <div className="space-y-3">
          <button onClick={generateReport} className="w-full py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <FileText size={16} /> Generate Text Report
          </button>
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h4 className="font-semibold mb-3 text-sm">Export Data</h4>
            <button onClick={() => exportData("json")} className="w-full py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2 mb-2" style={{ background: "rgba(99,102,241,0.3)" }}>
              <Download size={16} /> Export as JSON
            </button>
            <button onClick={() => exportData("csv")} className="w-full py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2 mb-3" style={{ background: "rgba(99,102,241,0.3)" }}>
              <Download size={16} /> Export as CSV
            </button>
          </div>
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h4 className="font-semibold mb-3 text-sm">Import Data</h4>
            <label className="w-full py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2 cursor-pointer" style={{ background: "rgba(99,102,241,0.2)", border: "1px dashed rgba(99,102,241,0.5)" }}>
              <Upload size={16} /> Import JSON Backup
              <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}