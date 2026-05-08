import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, Zap, IndianRupee, Clock,
  Loader2, Activity,
  AlertTriangle, FileWarning, FileText
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { getDashboardStats, getRevenueReport } from '../services/apiServices';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportRes] = await Promise.all([
        getDashboardStats(),
        getRevenueReport('weekly')
      ]);
      setStats(statsRes.data.data);
      setChartData(reportRes.data.data.chartData || []);
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Vehicles', value: stats.fleet?.total || 0, icon: Car, color: 'blue', sub: 'Across all hubs' },
    { title: 'Active Rides', value: stats.bookings?.active || 0, icon: Zap, color: 'green', sub: 'In progress now' },
    { title: 'Weekly Income', value: `₹${(stats.revenue?.weekly || 0).toLocaleString()}`, icon: IndianRupee, color: 'emerald', sub: 'Last 7 days' },
    { title: 'Monthly Income', value: `₹${(stats.revenue?.monthly || 0).toLocaleString()}`, icon: IndianRupee, color: 'purple', sub: 'Last 30 days' },
    { title: 'Yearly Income', value: `₹${(stats.revenue?.yearly || 0).toLocaleString()}`, icon: IndianRupee, color: 'orange', sub: 'Last 365 days' },
    { title: 'Available Fleet', value: stats.fleet?.available || 0, icon: Activity, color: 'blue', sub: 'Ready for booking' },
    { title: 'Pending KYC', value: stats.users?.kyc_pending || 0, icon: Clock, color: 'purple', sub: 'Verification required' },
    { title: 'Docs Expiring', value: stats.documents?.expiring || 0, icon: FileWarning, color: 'red', sub: 'Action required' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time analytics and operations monitoring.</p>
        </div>
        <div className="header-actions">
          <Link to="/bookings" className="btn btn-outline">Manage Bookings</Link>
          <Link to="/vehicles" className="btn btn-primary">Add Vehicle</Link>
        </div>
      </div>
      
      {/* Document Alerts */}
      {(stats.documents?.expiring > 0 || stats.documents?.expired > 0) && (
        <div className="card dashboard-alert-card">
          <div className="alert-header">
            <div className="alert-title-wrap">
              <AlertTriangle className="text-danger" size={20} />
              <h3>Critical Document Alerts</h3>
            </div>
            <Link to="/documents" className="btn btn-outline btn-sm">View All Documents</Link>
          </div>
          <div className="alert-content">
            {stats.documents?.expired > 0 && (
              <div className="dashboard-alert-item expired">
                <FileText size={16} />
                <span>You have <strong>{stats.documents?.expired || 0} expired</strong> documents that need immediate renewal.</span>
              </div>
            )}
            {stats.documents?.expiring > 0 && (
              <div className="dashboard-alert-item expiring">
                <FileWarning size={16} />
                <span><strong>{stats.documents?.expiring || 0} documents</strong> are expiring within the next 30 days.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="kpi-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className="card kpi-card">
            <div className={`kpi-icon-wrapper ${kpi.color}`}>
              <kpi.icon size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-title">{kpi.title}</span>
              <h2 className="kpi-value">{kpi.value}</h2>
              <div className="kpi-subtext">
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Distribution Stats */}
      {stats.categories && stats.categories.length > 0 && (
        <div className="category-stats-container">
          <div className="section-header">
            <h3>Vehicle Distribution by Category</h3>
          </div>
          <div className="category-stats-grid">
            {stats.categories.map((cat, idx) => (
              <div key={idx} className="category-stat-card card">
                <div className="cat-stat-info">
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">{cat.count} Vehicles</span>
                </div>
                <div className="cat-stat-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${(cat.count / stats.fleet.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-content-grid">
        <div className="card chart-card">
          <div className="card-header">
            <h3>Revenue Trends (Weekly)</h3>
            <select className="period-select" disabled>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="chart-container" style={{ width: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card table-card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/bookings" className="btn-text">View All</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium">{b.id}</td>
                    <td>{b.user}</td>
                    <td>{b.vehicle}</td>
                    <td>
                      <span className={`badge badge-${
                        b.status === 'Active' || b.status === 'Ongoing' ? 'success' : 
                        b.status === 'Completed' ? 'info' : 
                        b.status === 'Pending' ? 'warning' : 'danger'
                      }`}>
                        {b.status}
                      </span>
                    </td>
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

export default Dashboard;
