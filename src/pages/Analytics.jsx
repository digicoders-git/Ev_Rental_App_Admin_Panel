import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Car, CalendarCheck, IndianRupee,
  ShieldCheck, Building2, MessageSquare, Tag,
  Download, ArrowUpRight, ArrowDownRight, BarChart2,
  Activity, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardStats, getRevenueReport, exportBookings } from '../services/apiServices';
import './Analytics.css';

const PERIODS = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'All Time', value: 'all' }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Analytics = () => {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [stats, setStats]     = useState(null);
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportRes] = await Promise.all([
        getDashboardStats(),
        getRevenueReport({ timeframe: period.value })
      ]);
      setStats(statsRes.data.data);
      setReport(reportRes.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportBookings(period.value);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const pLabel = period.label.replace(' ', '');
      link.setAttribute('download', `bookings_${pLabel}_${new Date().toLocaleDateString('en-CA')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const fmtINR = n => '₹' + (n || 0).toLocaleString('en-IN');

  if (loading || !stats || !report) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Generating reports...</p>
      </div>
    );
  }

  /* KPI cards data mapping */
  const kpis = [
    { label: 'Total Revenue',    value: fmtINR(stats.revenue.total), sub: 'Overall earnings', up: true, icon: <IndianRupee size={20} />, color: 'green' },
    { label: 'Total Bookings',   value: stats.bookings.total,  sub: `${stats.bookings.completed} completed`, up: true, icon: <CalendarCheck size={20} />, color: 'blue' },
    { label: 'Riders/Users',     value: stats.users.total,     sub: `${stats.users.kyc_verified} verified`, up: true, icon: <Users size={20} />, color: 'purple' },
    { label: 'Total Fleet',      value: stats.fleet.total,     sub: `${stats.fleet.active} active`, up: true, icon: <Car size={20} />, color: 'orange' },
    { label: 'Active Stores',    value: stats.franchise.total_stores, sub: 'Franchise partners', up: true, icon: <Building2 size={20} />, color: 'teal' },
    { label: 'Ongoing Rides',    value: stats.bookings.ongoing, sub: 'Current active rides', up: true, icon: <Activity size={20} />, color: 'indigo' },
  ];

  const vehicleStatusData = [
    { name: 'Active', value: stats.fleet.active, color: '#10b981' },
    { name: 'Maintenance', value: stats.fleet.maintenance, color: '#f59e0b' },
    { name: 'Inactive', value: stats.fleet.total - stats.fleet.active - stats.fleet.maintenance, color: '#94a3b8' }
  ];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Complete overview of all platform data and performance metrics.</p>
        </div>
        <div className="an-header-actions">
          <div className="an-period-tabs">
            {PERIODS.map(p => (
              <button key={p.value} className={`an-period-btn ${period.value === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p)}>{p.label}</button>
            ))}
          </div>
          <button className="btn btn-outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="spinner" size={15} /> : <><Download size={15} /> Export CSV</>}
          </button>
        </div>
      </div>

      <div className="an-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="card an-kpi-card">
            <div className={`an-kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="an-kpi-info">
              <span className="an-kpi-label">{k.label}</span>
              <h3 className="an-kpi-value">{k.value}</h3>
              <span className={`an-kpi-sub ${k.up ? 'up' : 'down'}`}>
                {k.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="an-grid-2-1">
        <div className="card">
          <div className="an-card-header">
            <h3>Revenue & Bookings Trend</h3>
            <span className="an-period-label">{period.label} Analysis</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={report.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBook" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `₹${v >= 1000 ? v / 1000 + 'k' : v}`} width={48} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gRev)" />
              <Area yAxisId="right" type="monotone" dataKey="bookings" name="Bookings" stroke="#3b82f6" strokeWidth={2} fill="url(#gBook)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="an-card-header"><h3>Vehicle Fleet Status</h3></div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {vehicleStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => [v + ' vehicles']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="an-legend">
            {vehicleStatusData.map((v, i) => (
              <div key={i} className="an-legend-item">
                <span className="an-legend-dot" style={{ background: v.color }} />
                <span>{v.name}</span>
                <span className="an-legend-val">{v.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="an-grid-2-1">
        <div className="card">
          <div className="an-card-header"><h3>Franchise Revenue Comparison</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={report.franchiseRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `₹${v / 1000}k`} width={48} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="revenue" name="Total Revenue" radius={[6, 6, 0, 0]} barSize={28}>
                {report.franchiseRevenue.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="an-card-header"><h3>Payment Methods</h3></div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={report.methodData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {report.methodData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => [v + '%']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="an-legend">
            {report.methodData.map((v, i) => (
              <div key={i} className="an-legend-item">
                <span className="an-legend-dot" style={{ background: v.color }} />
                <span>{v.name}</span>
                <span className="an-legend-val">{v.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="an-grid-3">
        <div className="card">
          <div className="an-card-header"><h3>Top Rental Plans</h3></div>
          <div className="an-plan-list">
            {report.planRevenue.map((p, i) => (
              <div key={i} className="an-plan-item">
                <div className="an-plan-top">
                  <span className="an-plan-name">{p.plan}</span>
                  <span className="an-plan-count">{p.count} bookings</span>
                </div>
                <div className="an-bar-wrap">
                  <div className="an-bar-fill" style={{ width: `${Math.min(100, (p.count / report.planRevenue[0].count) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <span className="an-plan-rev">{fmtINR(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="an-card-header"><h3>Recent Transactions</h3></div>
          <div className="an-coupon-table">
            <table>
              <thead>
                <tr><th>Transaction ID</th><th>User</th><th>Store/Franchise</th><th>Amount</th><th>Method</th><th>Date</th></tr>
              </thead>
              <tbody>
                {report.recentTx.map((tx, i) => (
                  <tr key={i}>
                    <td><span className="an-coupon-code">{tx.id}</span></td>
                    <td>{tx.user}</td>
                    <td><span className="td-muted">{tx.franchise}</span></td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{fmtINR(tx.amount)}</td>
                    <td><span className="content-tag">{tx.method}</span></td>
                    <td className="td-muted">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
