import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Chart as ChartJS, 
 CategoryScale, 
 LinearScale, 
 BarElement,
 Title, 
 Tooltip, 
 Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Loader from '../components/Loader';

ChartJS.register(
 CategoryScale,
 LinearScale,
 BarElement,
 Title,
 Tooltip,
 Legend
);

// Animated Counter Component
const AnimatedNumber = ({ value }) => {
 const [displayValue, setDisplayValue] = useState(0);
 const cleanValue = value.toString().replace('₹', '').replace('$', '').replace(',', '');
 const targetValue = parseFloat(cleanValue) || 0;
 const hasSymbol = value.toString().includes('₹') || value.toString().includes('$');
 const symbol = value.toString().includes('₹') ? '₹' : value.toString().includes('$') ? '$' : '';
 
 useEffect(() => {
  let start = 0;
  const end = targetValue;
  if (start === end) { setDisplayValue(end); return; }
  const totalDuration = 1000;
  const increment = end / (totalDuration / 16); 
  let timer = setInterval(() => {
   start += increment;
   if (start >= end) { setDisplayValue(end); clearInterval(timer); }
   else { setDisplayValue(start); }
  }, 16);
  return () => clearInterval(timer);
 }, [targetValue]);

 const formatted = targetValue % 1 !== 0
  ? displayValue.toFixed(2)
  : Math.floor(displayValue).toLocaleString();
 return <span>{symbol}{formatted}</span>;
};

const Dashboard = () => {
 const [backendStats, setBackendStats] = useState(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
  setLoading(true);
  fetch('/api/stats')
   .then(res => res.json())
   .then(data => { setBackendStats(data); setLoading(false); })
   .catch(err => {
    console.log('Backend not running yet, using local defaults');
    setLoading(false);
   });
 }, []);

 const user = JSON.parse(localStorage.getItem('user') || '{}');
 const isSubAdmin = user.role === 'sub-admin';

 const allStats = [
  { label: 'Language', value: backendStats?.languages || '0', colorClass: 'stat-lang', path: '/admin/language' },
  { label: 'Genres', value: backendStats?.genres || '0', colorClass: 'stat-genres', path: '/admin/genres' },
  { label: 'Movies', value: backendStats?.movies || '0', colorClass: 'stat-movies', path: '/admin/movies' },
  { label: 'Shows', value: backendStats?.shows || '0', colorClass: 'stat-shows', path: '/admin/tv-shows/shows' },
  { label: 'Seasons', value: backendStats?.seasons || '0', colorClass: 'stat-revenue', path: '/admin/tv-shows/seasons' },
  { label: 'Episodes', value: backendStats?.episodes || '0', colorClass: 'stat-users', path: '/admin/tv-shows/episodes' },
  { label: 'Sports', value: backendStats?.sports || '0', colorClass: 'stat-sports', path: '/admin/sports/video' },
  { label: 'Live TV', value: backendStats?.liveTv || '0', colorClass: 'stat-livetv', path: '/admin/live-tv/channel', masterOnly: true },
  { label: 'Users', value: backendStats?.users || '0', colorClass: 'stat-users', path: '/admin/users', masterOnly: true },
  { label: 'Transactions', value: backendStats?.transactions || '0', colorClass: 'stat-trans', path: '/admin/transactions', masterOnly: true },
 ];

 const revenueCards = [
  { label: 'Daily Revenue', value: `₹${backendStats?.revenue?.daily || '0.00'}`, colorClass: 'stat-trans', accent: '#00a8ff' },
  { label: 'Weekly Revenue', value: `₹${backendStats?.revenue?.weekly || '0.00'}`, colorClass: 'stat-genres', accent: '#b3d332' },
  { label: 'Monthly Revenue', value: `₹${backendStats?.revenue?.monthly || '0.00'}`, colorClass: 'stat-movies', accent: '#ff9800' },
  { label: 'Yearly Revenue', value: `₹${backendStats?.revenue?.yearly || '0.00'}`, colorClass: 'stat-revenue', accent: '#00cc66' },
  { label: 'Total Revenue', value: `₹${backendStats?.revenue?.total || '0.00'}`, colorClass: 'stat-revenue', accent: '#b3d332', isTotal: true },
 ];

 const stats = allStats.filter(s => !isSubAdmin || !s.masterOnly);

 // Dynamic max for chart Y-axis
 const planStatsData = backendStats?.planStats;
 const allPlanCounts = planStatsData
  ? [
     ...(planStatsData.basic || []),
     ...(planStatsData.premium || []),
     ...(planStatsData.platinum || []),
     ...(planStatsData.diamond || []),
    ]
  : [0];
 const maxPlanCount = Math.max(...allPlanCounts, 1);
 const chartMax = Math.ceil(maxPlanCount * 1.3); // 30% headroom

 const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
   {
    label: 'Basic Plan',
    data: planStatsData?.basic || Array(12).fill(0),
    backgroundColor: '#ff7bb5',
    borderRadius: 4,
    barThickness: 10,
   },
   {
    label: 'Premium Plan',
    data: planStatsData?.premium || Array(12).fill(0),
    backgroundColor: '#6472b5',
    borderRadius: 4,
    barThickness: 10,
   },
   {
    label: 'Platinum Plan',
    data: planStatsData?.platinum || Array(12).fill(0),
    backgroundColor: '#2db5d5',
    borderRadius: 4,
    barThickness: 10,
   },
   {
    label: 'Diamond Plan',
    data: planStatsData?.diamond || Array(12).fill(0),
    backgroundColor: '#b3d332',
    borderRadius: 4,
    barThickness: 10,
   },
  ],
 };

 const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
   legend: { display: false },
   tooltip: {
    mode: 'index',
    intersect: false,
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
    titleColor: '#fff',
    bodyColor: '#aaa',
    padding: 12,
   },
  },
  scales: {
   y: {
    beginAtZero: true,
    max: chartMax,
    ticks: {
     stepSize: Math.max(1, Math.ceil(chartMax / 5)),
     color: '#555',
     font: { size: 11 },
     precision: 0,
    },
    grid: { color: '#1a1a1a', drawBorder: false, drawTicks: false },
   },
   x: {
    grid: { display: false },
    ticks: { color: '#555', font: { size: 11 } },
   },
  },
 };

 if (loading) return <Loader />;

 return (
  <div className="dashboard-page">
   {/* General Stats Grid */}
   <div className="stats-grid">
    {stats.map((stat, index) => (
     <div
      key={index}
      className="stat-card"
      onClick={() => stat.path && navigate(stat.path)}
      style={{ cursor: stat.path ? 'pointer' : 'default' }}
     >
      <span className={`stat-value ${stat.colorClass}`}>
       <AnimatedNumber value={stat.value} />
      </span>
      <span className="stat-label">{stat.label}</span>
     </div>
    ))}
   </div>

   {/* Revenue Cards Section */}
   {!isSubAdmin && (
    <div className="revenue-section">
     <div className="revenue-header">
      <h2 className="revenue-title">Revenue Overview</h2>
      <button className="view-transactions-btn" onClick={() => navigate('/admin/transactions')}>
       View Transactions →
      </button>
     </div>
     <div className="revenue-grid">
      {revenueCards.map((card, i) => (
       <div key={i} className={`revenue-card ${card.isTotal ? 'revenue-card-total' : ''}`} style={{ '--accent': card.accent }}>
        <div className="revenue-card-label">{card.label}</div>
        <div className="revenue-card-value" style={{ color: card.accent }}>
         <AnimatedNumber value={card.value} />
        </div>
        <div className="revenue-card-bar" style={{ background: card.accent }}></div>
       </div>
      ))}
     </div>
    </div>
   )}

   {/* Plan Subscriptions Chart */}
   <div className="chart-section">
    <div className="chart-header">
     <div>
      <h2 className="chart-title">Subscription Plan Statistics</h2>
      <p className="chart-subtitle">Monthly breakdown — Current Year {new Date().getFullYear()}</p>
     </div>
     <div className="chart-legend-top">
      {[
       { label: 'Basic', color: '#ff7bb5' },
       { label: 'Premium', color: '#6472b5' },
       { label: 'Platinum', color: '#2db5d5' },
       { label: 'Diamond', color: '#b3d332' },
      ].map(l => (
       <div key={l.label} className="legend-item">
        <div className="dot" style={{ backgroundColor: l.color }}></div>
        <span style={{ color: l.color }}>{l.label}</span>
       </div>
      ))}
     </div>
    </div>

    <div style={{ height: '350px' }}>
     <Bar data={chartData} options={chartOptions} />
    </div>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .dashboard-page { animation: fadeIn 0.4s ease-out; padding-bottom: 40px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Revenue Section */
    .revenue-section { margin: 30px 0; }
    .revenue-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .revenue-title { font-size: 1.1rem; font-weight: 700; color: #eee; margin: 0; }
    .view-transactions-btn { background: none; border: 1px solid #333; color: #888; padding: 6px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .view-transactions-btn:hover { border-color: #b3d332; color: #b3d332; }

    .revenue-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
    @media (max-width: 1200px) { .revenue-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 700px) { .revenue-grid { grid-template-columns: 1fr 1fr; } }

    .revenue-card {
     background: #0c0c0c;
     border: 1px solid #1e1e1e;
     border-radius: 12px;
     padding: 20px 18px 14px;
     position: relative;
     overflow: hidden;
     transition: all 0.2s;
    }
    .revenue-card:hover { border-color: var(--accent, #333); transform: translateY(-2px); background: #111; }
    .revenue-card-total {
     border-color: #b3d332;
     background: rgba(179,211,50,0.04);
    }
    .revenue-card-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 10px; }
    .revenue-card-value { font-size: 1.5rem; font-weight: 800; line-height: 1; margin-bottom: 14px; }
    .revenue-card-total .revenue-card-value { font-size: 1.7rem; }
    .revenue-card-bar {
     position: absolute;
     bottom: 0; left: 0;
     height: 3px;
     width: 100%;
     opacity: 0.5;
     border-radius: 0 0 12px 12px;
    }

    /* Chart */
    .chart-section { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 16px; padding: 30px; margin-top: 10px; }
    .chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 12px; }
    .chart-title { font-size: 1.05rem; font-weight: 700; color: #eee; margin: 0 0 4px 0; }
    .chart-subtitle { font-size: 0.82rem; color: #555; margin: 0; }
    .chart-legend-top { display: flex; gap: 18px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; font-weight: 600; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
   ` }} />
  </div>
 );
};

export default Dashboard;
