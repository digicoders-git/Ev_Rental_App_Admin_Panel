 import { useState, useEffect } from 'react';
import {
  TrendingUp, IndianRupee, ArrowUpRight, ArrowDownRight,
  Download, Calendar, Building2, Car, CreditCard,
  Wallet, Smartphone, RefreshCw, BarChart2, Filter, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getRevenueReport } from '../services/apiServices';
import './Revenue.css';

const Revenue = () => {
  const [period, setPeriod] = useState('This Week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    chartData: [],
    franchiseRevenue: [],
    methodData: [],
    planRevenue: [],
    recentTx: []
  });

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const timeframe = period === 'This Week' ? 'weekly' : 'yearly';
      const response = await getRevenueReport(timeframe);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const { chartData, franchiseRevenue, methodData, planRevenue, recentTx } = data;

  const totalRevenue  = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalRefunds  = chartData.reduce((s, d) => s + d.refunds, 0);
  const totalBookings = chartData.reduce((s, d) => s + d.bookings, 0);
  const netRevenue    = totalRevenue - totalRefunds;
  const avgPerBooking = totalBookings ? Math.round(netRevenue / totalBookings) : 0;

  const fmtINR = n => '₹' + (n || 0).toLocaleString('en-IN');

  if (loading && chartData.length === 0) {
    return (
      <div className="rev-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading revenue data...</p>
      </div>
    );
  }

  return (
    <div className="revenue-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Revenue Tracking</h1>
          <p>Monitor earnings, refunds and financial performance across your network.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="rev-period-tabs">
            {['This Week', 'This Year'].map(p => (
              <button key={p} className={`rev-period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <button className="btn btn-outline"><Download size={15} /> Export</button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="rev-stats">
        <div className="card rev-stat-card">
          <div className="rev-stat-icon green"><TrendingUp size={20} /></div>
          <div>
            <span className="rev-stat-label">Gross Revenue</span>
            <h3>{fmtINR(totalRevenue)}</h3>
            <span className="rev-stat-trend up"><ArrowUpRight size={12} /> +15.2%</span>
          </div>
        </div>
        <div className="card rev-stat-card">
          <div className="rev-stat-icon blue"><IndianRupee size={20} /></div>
          <div>
            <span className="rev-stat-label">Net Revenue</span>
            <h3>{fmtINR(netRevenue)}</h3>
            <span className="rev-stat-trend up"><ArrowUpRight size={12} /> +12.8%</span>
          </div>
        </div>
        <div className="card rev-stat-card">
          <div className="rev-stat-icon red"><RefreshCw size={20} /></div>
          <div>
            <span className="rev-stat-label">Total Refunds</span>
            <h3>{fmtINR(totalRefunds)}</h3>
            <span className="rev-stat-trend down"><ArrowDownRight size={12} /> -3.1%</span>
          </div>
        </div>
        <div className="card rev-stat-card">
          <div className="rev-stat-icon purple"><BarChart2 size={20} /></div>
          <div>
            <span className="rev-stat-label">Total Bookings</span>
            <h3>{totalBookings}</h3>
            <span className="rev-stat-trend up"><ArrowUpRight size={12} /> +8.4%</span>
          </div>
        </div>
        <div className="card rev-stat-card">
          <div className="rev-stat-icon orange"><CreditCard size={20} /></div>
          <div>
            <span className="rev-stat-label">Avg. Per Booking</span>
            <h3>{fmtINR(avgPerBooking)}</h3>
            <span className="rev-stat-trend up"><ArrowUpRight size={12} /> +5.0%</span>
          </div>
        </div>
      </div>

      {/* Revenue vs Refunds Chart */}
      <div className="card">
        <div className="rev-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3>Revenue vs Refunds</h3>
            {loading && <Loader2 className="spinner" size={14} />}
          </div>
          <span className="rev-period-label">{period}</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRef" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={v => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} width={50} />
            <Tooltip formatter={(v, n) => [fmtINR(v), n === 'revenue' ? 'Revenue' : 'Refunds']}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Legend formatter={v => v === 'revenue' ? 'Revenue' : 'Refunds'} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gradRev)" />
            <Area type="monotone" dataKey="refunds" stroke="#ef4444" strokeWidth={2} fill="url(#gradRef)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Middle Row — Franchise Bar + Payment Pie */}
      <div className="rev-mid-grid">

        {/* Franchise Revenue Bar Chart */}
        <div className="card">
          <div className="rev-card-header">
            <h3>Revenue by Franchise</h3>
            <Building2 size={16} color="var(--text-muted)" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={franchiseRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => v ? v.split(' ')[0] : ''} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `₹${v / 1000}k`} width={45} />
              <Tooltip formatter={v => [fmtINR(v), 'Revenue']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={32}>
                {franchiseRevenue.map((e, i) => <Cell key={i} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Pie */}
        <div className="card">
          <div className="rev-card-header">
            <h3>Payment Methods</h3>
            <CreditCard size={16} color="var(--text-muted)" />
          </div>
          <div className="rev-pie-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={methodData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {methodData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="rev-pie-legend">
              {methodData.map((m, i) => (
                <div key={i} className="rev-pie-item">
                  <span className="rev-pie-dot" style={{ background: m.color }} />
                  <span className="rev-pie-name">{m.name}</span>
                  <span className="rev-pie-val">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row — Plan Revenue + Franchise Table */}
      <div className="rev-bottom-grid">

        {/* Plan-wise Revenue */}
        <div className="card">
          <div className="rev-card-header">
            <h3>Revenue by Plan</h3>
            <Car size={16} color="var(--text-muted)" />
          </div>
          <div className="rev-plan-list">
            {planRevenue.length === 0 ? (
                <div className="td-muted" style={{ textAlign: 'center', padding: '2rem' }}>No data found</div>
            ) : planRevenue.map((p, i) => {
              const max = Math.max(...planRevenue.map(x => x.revenue));
              const pct = Math.round((p.revenue / max) * 100);
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
              return (
                <div key={i} className="rev-plan-item">
                  <div className="rev-plan-top">
                    <span className="rev-plan-name">{p.plan}</span>
                    <span className="rev-plan-amt">{fmtINR(p.revenue)}</span>
                  </div>
                  <div className="rev-plan-bar-wrap">
                    <div className="rev-plan-bar-fill" style={{ width: `${pct}%`, background: colors[i % 4] }} />
                  </div>
                  <span className="rev-plan-count">{p.count} bookings</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Franchise Leaderboard */}
        <div className="card">
          <div className="rev-card-header">
            <h3>Franchise Leaderboard</h3>
            <TrendingUp size={16} color="var(--text-muted)" />
          </div>
          <div className="rev-franchise-list">
            {franchiseRevenue.length === 0 ? (
                <div className="td-muted" style={{ textAlign: 'center', padding: '2rem' }}>No data found</div>
            ) : franchiseRevenue.map((f, i) => {
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
              const color = colors[i % 5];
              return (
                <div key={i} className="rev-franchise-row">
                  <div className="rev-rank" style={{ background: color + '20', color: color }}>#{i + 1}</div>
                  <div className="rev-franchise-info">
                    <span className="rev-franchise-name">{f.name}</span>
                    <span className="rev-franchise-meta">{f.bookings} bookings</span>
                  </div>
                  <div className="rev-franchise-right">
                    <span className="rev-franchise-amt">{fmtINR(f.revenue)}</span>
                    <span className="rev-franchise-share">
                      {Math.round((f.revenue / (franchiseRevenue.reduce((s, x) => s + x.revenue, 0) || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="rev-card-header">
          <h3>Recent Transactions</h3>
          <a href="/payments" className="btn-text">View All →</a>
        </div>
        <div className="rev-tx-table">
          <table>
            <thead>
              <tr>
                <th>TX ID</th>
                <th>Customer</th>
                <th>Franchise</th>
                <th>Method</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="td-muted">No transactions found</td></tr>
              ) : recentTx.map(tx => (
                <tr key={tx.id}>
                  <td><span className="rev-tx-id">{tx.id}</span></td>
                  <td><span className="cell-fw">{tx.user}</span></td>
                  <td className="td-muted">{tx.franchise}</td>
                  <td>
                    <span className="rev-method">
                      {tx.method === 'UPI' ? <Smartphone size={12} /> : tx.method === 'Wallet' ? <Wallet size={12} /> : <CreditCard size={12} />}
                      {tx.method}
                    </span>
                  </td>
                  <td>
                    <span className={`rev-type ${tx.type === 'Refund' ? 'refund' : 'payment'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td>
                    <span className={tx.type === 'Refund' ? 'rev-neg' : 'rev-pos'}>
                      {tx.type === 'Refund' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="td-muted">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Revenue;
