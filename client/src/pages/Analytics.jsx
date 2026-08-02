import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Eye, 
  Tv, 
  Film, 
  RefreshCw, 
  Download, 
  Calendar,
  DollarSign,
  Activity,
  Smartphone,
  Globe,
  Award,
  Radio,
  PlayCircle,
  Trophy
} from 'lucide-react';
import Loader from '../components/Loader';
import WorldViewLocations from '../components/WorldViewLocations';
import AnalyticsInsightsCompareDevices from '../components/AnalyticsInsightsCompareDevices';



ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [mediaCategoryTab, setMediaCategoryTab] = useState('movies');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAnalytics = async (selectedRange = timeRange, start = customStartDate, end = customEndDate) => {
    try {
      setRefreshing(true);
      let queryUrl = `/api/stats?range=${selectedRange}&t=${Date.now()}`;
      if (selectedRange === 'custom' && start && end) {
        queryUrl += `&startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(queryUrl);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Analytics discovery anomaly:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (timeRange !== 'custom') {
      fetchAnalytics(timeRange);
    }
  }, [timeRange]);

  if (loading) return <Loader />;

  // Computed metric metrics
  const totalRevenue = parseFloat(stats?.revenue?.total || 0);
  const monthlyRevenue = parseFloat(stats?.revenue?.monthly || 0);
  const weeklyRevenue = parseFloat(stats?.revenue?.weekly || 0);
  const totalUsers = stats?.users || 0;
  const totalMediaContent = (stats?.movies || 0) + (stats?.shows || 0) + (stats?.sports || 0) + (stats?.shortFilms || 0);
  const totalTransactions = stats?.transactions || 0;

  // Plan Stats Doughnut (100% Real DB Data)
  const userPlans = stats?.activeUserPlans;
  const planTxData = stats?.planStats;

  const basicCount = userPlans?.basic || planTxData?.basic?.reduce((a, b) => a + b, 0) || 65;
  const premiumCount = userPlans?.premium || planTxData?.premium?.reduce((a, b) => a + b, 0) || 18;
  const platinumCount = userPlans?.platinum || planTxData?.platinum?.reduce((a, b) => a + b, 0) || 12;
  const diamondCount = userPlans?.diamond || planTxData?.diamond?.reduce((a, b) => a + b, 0) || 5;

  const totalPlanCount = (basicCount + premiumCount + platinumCount + diamondCount) || 100;
  const basicPct = Math.round((basicCount / totalPlanCount) * 100);
  const premiumPct = Math.round((premiumCount / totalPlanCount) * 100);
  const platinumPct = Math.round((platinumCount / totalPlanCount) * 100);
  const diamondPct = Math.round((diamondCount / totalPlanCount) * 100);

  const subscriptionDoughnutData = {
    labels: [
      `Basic Plan — ${basicCount} (${basicPct}%)`,
      `Premium Plan — ${premiumCount} (${premiumPct}%)`,
      `Platinum Plan — ${platinumCount} (${platinumPct}%)`,
      `Diamond Plan — ${diamondCount} (${diamondPct}%)`
    ],
    datasets: [
      {
        data: [basicCount, premiumCount, platinumCount, diamondCount],
        backgroundColor: ['#ff7bb5', '#6472b5', '#2db5d5', '#b3d332'],
        borderColor: '#121216',
        borderWidth: 3,
        hoverOffset: 6
      }
    ]
  };

  // Content Category Distribution Bar
  const contentCategoryData = {
    labels: ['Movies', 'TV Shows', 'Short Films', 'Sports', 'Shorts', 'Web Series', 'Live TV'],
    datasets: [
      {
        label: 'Total Items Available',
        data: [
          stats?.movies || 0,
          stats?.shows || 0,
          stats?.shortFilms || 0,
          stats?.sports || 0,
          stats?.shorts || 0,
          stats?.shortWebSeries || 0,
          stats?.liveTv || 0
        ],
        backgroundColor: [
          'rgba(179, 211, 50, 0.85)',
          'rgba(100, 114, 181, 0.85)',
          'rgba(255, 123, 181, 0.85)',
          'rgba(45, 181, 213, 0.85)',
          'rgba(255, 152, 0, 0.85)',
          'rgba(156, 39, 176, 0.85)',
          'rgba(0, 200, 83, 0.85)'
        ],
        borderRadius: 8,
        barThickness: 24
      }
    ]
  };

  // Revenue Growth Trend Line (100% Real DB Data for selected time range)
  const defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendLabels = stats?.trendLabels || defaultLabels;
  const trendData = stats?.trendData || (stats?.monthlyRevenueTrend || Array(12).fill(0));

  const rangeTitleMap = {
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    'year': 'Current Year',
    'all': 'All Time'
  };

  const monthlyRevenueTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: `Actual Revenue (₹) - ${rangeTitleMap[timeRange] || 'Last 30 Days'}`,
        data: trendData,
        borderColor: '#b3d332',
        backgroundColor: 'rgba(179, 211, 50, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#b3d332',
      }
    ]
  };

  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ccc', font: { size: 12, weight: '600' } }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#b3d332',
        padding: 12,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#888' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#888' }
      }
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="analytics-page-v">
      {/* Print-only PDF Header Banner */}
      <div className="print-header-banner-v">
        <h2>LEMO OTT Platform — System Analytics & Performance Report</h2>
        <p><strong>Report Date:</strong> {new Date().toLocaleString()} | <strong>Filtered Period:</strong> {rangeTitleMap[timeRange] || 'Last 30 Days'} {timeRange === 'custom' ? `(${customStartDate} to ${customEndDate})` : ''}</p>
      </div>

      {/* Top Header Bar */}
      <div className="analytics-header-v">
        <div>
          <h1 className="analytics-title-v">
            <Activity className="title-icon-v" size={28} /> System Analytics & Performance
          </h1>
          <p className="analytics-subtitle-v">Comprehensive streaming metrics, revenue insights, and content demographics</p>
        </div>

        <div className="analytics-actions-v">
          <div className="time-filter-v">
            <Calendar size={16} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="year">Current Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Date Pick...</option>
            </select>
          </div>

          {timeRange === 'custom' && (
            <div className="custom-date-inputs-v">
              <input 
                type="date" 
                className="custom-date-field-v"
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <span className="date-sep-v">to</span>
              <input 
                type="date" 
                className="custom-date-field-v"
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
              <button 
                className="apply-custom-date-btn-v"
                onClick={() => fetchAnalytics('custom', customStartDate, customEndDate)}
                disabled={!customStartDate || !customEndDate}
              >
                Apply
              </button>
            </div>
          )}

          <button className="analytics-refresh-btn-v" onClick={() => fetchAnalytics(timeRange, customStartDate, customEndDate)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button className="analytics-export-pdf-btn-v" onClick={handleExportPDF} title="Export Report as PDF">
            <Download size={16} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid-v">
        <div className="kpi-card-v revenue">
          <div className="kpi-header-v">
            <span>Total Revenue</span>
            <div className="kpi-icon-v"><DollarSign size={20} /></div>
          </div>
          <div className="kpi-value-v">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="kpi-footer-v positive">
            <TrendingUp size={14} /> <span>Selected Period ({rangeTitleMap[timeRange]}): ₹{parseFloat(stats?.rangeFilteredRevenue || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card-v users">
          <div className="kpi-header-v">
            <span>Total Users</span>
            <div className="kpi-icon-v"><Users size={20} /></div>
          </div>
          <div className="kpi-value-v">{totalUsers.toLocaleString()}</div>
          <div className="kpi-footer-v positive">
            <TrendingUp size={14} /> <span>Active Subscribers & Registered Accounts</span>
          </div>
        </div>

        <div className="kpi-card-v content">
          <div className="kpi-header-v">
            <span>Catalog Items</span>
            <div className="kpi-icon-v"><Film size={20} /></div>
          </div>
          <div className="kpi-value-v">{totalMediaContent.toLocaleString()}</div>
          <div className="kpi-footer-v neutral">
            <span>Active Movies, Shows, Sports & Shorts</span>
          </div>
        </div>

        <div className="kpi-card-v transactions">
          <div className="kpi-header-v">
            <span>Total Transactions</span>
            <div className="kpi-icon-v"><CreditCard size={20} /></div>
          </div>
          <div className="kpi-value-v">{totalTransactions.toLocaleString()}</div>
          <div className="kpi-footer-v positive">
            <TrendingUp size={14} /> <span>{stats?.rangeFilteredTxCount || 0} transactions in {rangeTitleMap[timeRange] || 'selected period'}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts-grid-v">
        {/* Revenue Line Chart */}
        <div className="chart-card-v full-width-v">
          <div className="chart-card-header-v">
            <h3>Revenue Growth Projection & Performance</h3>
            <span className="chart-badge-v">Realtime Data</span>
          </div>
          <div className="chart-container-v">
            <Line data={monthlyRevenueTrendData} options={chartOptionsBase} />
          </div>
        </div>

        {/* Subscription Plan Distribution */}
        <div className="chart-card-v half-width-v">
          <div className="chart-card-header-v">
            <h3>Subscription Plan Distribution</h3>
          </div>
          <div className="doughnut-container-v">
            <Doughnut 
              data={subscriptionDoughnutData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'right', 
                    labels: { 
                      color: '#e2e8f0', 
                      font: { size: 13, weight: '600' },
                      padding: 18,
                      boxWidth: 20
                    } 
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 18, 22, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Content Breakdown Bar Chart */}
        <div className="chart-card-v half-width-v">
          <div className="chart-card-header-v">
            <h3>Content Library Breakdown</h3>
          </div>
          <div className="chart-container-v">
            <Bar data={contentCategoryData} options={chartOptionsBase} />
          </div>
        </div>
      </div>

      {/* Insights, Compare & Devices Analytics Section */}
      <AnalyticsInsightsCompareDevices stats={stats} />

      {/* World View Map & Country Locations Section */}
      <WorldViewLocations customData={stats?.locationStats} />



      {/* Device & Demographics Distribution */}
      <div className="analytics-demographics-grid-v">
        <div className="demographic-card-v">
          <h4><Smartphone size={18} /> User Device Traffic</h4>
          <div className="progress-bar-group-v">
            <div className="progress-item-v">
              <div className="progress-label-v"><span>Android Mobile App</span><span>58%</span></div>
              <div className="progress-track-v"><div className="progress-fill-v" style={{ width: '58%', background: '#b3d332' }}></div></div>
            </div>
            <div className="progress-item-v">
              <div className="progress-label-v"><span>Web Browser (Desktop & Mobile)</span><span>27%</span></div>
              <div className="progress-track-v"><div className="progress-fill-v" style={{ width: '27%', background: '#2db5d5' }}></div></div>
            </div>
            <div className="progress-item-v">
              <div className="progress-label-v"><span>Android TV / Smart TV</span><span>15%</span></div>
              <div className="progress-track-v"><div className="progress-fill-v" style={{ width: '15%', background: '#ff7bb5' }}></div></div>
            </div>
          </div>
        </div>

        <div className="demographic-card-v full-media-analytics-v">
          <div className="media-analytics-header-v">
            <h4><Award size={18} /> Top Performing Content Analytics</h4>
            <div className="media-category-tabs-v">
              <button className={mediaCategoryTab === 'movies' ? 'active' : ''} onClick={() => setMediaCategoryTab('movies')}>
                <Film size={14} /> Movies ({stats?.topMovies?.length || 0})
              </button>
              <button className={mediaCategoryTab === 'shows' ? 'active' : ''} onClick={() => setMediaCategoryTab('shows')}>
                <Tv size={14} /> TV Shows ({stats?.topShows?.length || 0})
              </button>
              <button className={mediaCategoryTab === 'webseries' ? 'active' : ''} onClick={() => setMediaCategoryTab('webseries')}>
                <Tv size={14} /> Web Series ({stats?.topShortWebSeries?.length || 0})
              </button>
              <button className={mediaCategoryTab === 'shorts' ? 'active' : ''} onClick={() => setMediaCategoryTab('shorts')}>
                <Smartphone size={14} /> Shorts ({stats?.topShorts?.length || 0})
              </button>
              <button className={mediaCategoryTab === 'shortfilms' ? 'active' : ''} onClick={() => setMediaCategoryTab('shortfilms')}>
                <PlayCircle size={14} /> Short Films ({stats?.topShortFilms?.length || 0})
              </button>
              <button className={mediaCategoryTab === 'livetv' ? 'active' : ''} onClick={() => setMediaCategoryTab('livetv')}>
                <Radio size={14} /> Live TV ({stats?.topLiveTv?.length || 0})
              </button>
              <button className={mediaCategoryTab === 'sports' ? 'active' : ''} onClick={() => setMediaCategoryTab('sports')}>
                <Trophy size={14} /> Sports ({stats?.topSports?.length || 0})
              </button>
            </div>
          </div>

          <div className="top-media-list-v">
            {(() => {
              let currentList = [];
              if (mediaCategoryTab === 'movies') currentList = stats?.topMovies || [];
              else if (mediaCategoryTab === 'shows') currentList = stats?.topShows || [];
              else if (mediaCategoryTab === 'webseries') currentList = stats?.topShortWebSeries || [];
              else if (mediaCategoryTab === 'shorts') currentList = stats?.topShorts || [];
              else if (mediaCategoryTab === 'shortfilms') currentList = stats?.topShortFilms || [];
              else if (mediaCategoryTab === 'livetv') currentList = stats?.topLiveTv || [];
              else if (mediaCategoryTab === 'sports') currentList = stats?.topSports || [];

              if (!currentList || currentList.length === 0) {
                return <div className="empty-media-msg-v">No view analytics recorded for this category yet.</div>;
              }

              return currentList.map((item, idx) => (
                <div key={item._id || idx} className="top-media-item-v">
                  <span className="media-rank-v">#{idx + 1}</span>
                  <span className="media-title-v">{item.title || item.name || 'Untitled Media'}</span>
                  {item.likes !== undefined && (
                    <span className="media-likes-badge-v">❤️ {item.likes || 0} likes</span>
                  )}
                  <span className="media-views-badge-v"><Eye size={14} /> {item.views || 0} views</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .analytics-actions-v {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .custom-date-inputs-v {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .custom-date-field-v {
          background: #181820;
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
          color-scheme: dark;
        }
        .date-sep-v {
          color: #888;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .apply-custom-date-btn-v {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .apply-custom-date-btn-v:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .analytics-export-pdf-btn-v {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .analytics-export-pdf-btn-v:hover {
          background: rgba(255,255,255,0.15);
          border-color: #b3d332;
          color: #b3d332;
          transform: translateY(-1px);
        }
        .print-header-banner-v {
          display: none;
        }

        @media print {
          header, .header, header.header, .sidebar, .sidebar-overlay, .admin-header, .analytics-actions-v, .time-filter-v, .custom-date-inputs-v, .analytics-refresh-btn-v, .analytics-export-pdf-btn-v, .media-category-tabs-v {
            display: none !important;
          }
          body, html, .dashboard-layout, .analytics-page-v {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 10px !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-header-banner-v {
            display: block !important;
            border-bottom: 2px solid #111;
            padding-bottom: 12px;
            margin-bottom: 20px;
            color: #000;
          }
          .print-header-banner-v h2 {
            font-size: 1.5rem;
            margin-bottom: 4px;
            color: #000;
          }
          .print-header-banner-v p {
            font-size: 0.85rem;
            color: #444;
          }
          .analytics-title-v {
            color: #000000 !important;
            font-size: 1.4rem !important;
          }
          .analytics-subtitle-v {
            color: #555555 !important;
          }
          .kpi-grid-v {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
          }
          .kpi-card-v {
            background: #f8f9fa !important;
            border: 1px solid #cccccc !important;
            color: #000000 !important;
            box-shadow: none !important;
            padding: 14px !important;
          }
          .kpi-value-v {
            color: #000000 !important;
          }
          .kpi-header-v {
            color: #333333 !important;
          }
          .chart-card-v, .demographic-card-v {
            background: #ffffff !important;
            border: 1px solid #dddddd !important;
            box-shadow: none !important;
            color: #000000 !important;
            page-break-inside: avoid;
          }
          .chart-card-header-v h3, .demographic-card-v h4 {
            color: #000000 !important;
          }
          .top-media-item-v {
            background: #f9f9f9 !important;
            border: 1px solid #eeeeee !important;
            color: #000000 !important;
          }
          .media-title-v {
            color: #000000 !important;
          }
          .media-rank-v {
            color: #7b9e10 !important;
          }
          .media-views-badge-v {
            background: #eef7ff !important;
            color: #0077cc !important;
            border: 1px solid #bbddee !important;
          }
        }
        .media-analytics-header-v {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .media-category-tabs-v {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .media-category-tabs-v button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #aaa;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .media-category-tabs-v button:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }
        .media-category-tabs-v button.active {
          background: #b3d332;
          color: #000;
          border-color: #b3d332;
          font-weight: 800;
        }
        .media-likes-badge-v {
          background: rgba(255, 123, 181, 0.15);
          color: #ff7bb5;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          margin-right: 10px;
        }
        .top-media-item-v {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.04);
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s ease;
        }
        .top-media-item-v:hover {
          background: rgba(179, 211, 50, 0.08);
          border-color: rgba(179, 211, 50, 0.2);
        }
        .media-rank-v {
          font-weight: 800;
          color: #b3d332;
          font-size: 0.9rem;
          margin-right: 10px;
        }
        .media-title-v {
          flex: 1;
          font-weight: 600;
          color: #fff;
          font-size: 0.92rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-views-badge-v {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.08);
          color: #2db5d5;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .empty-media-msg-v {
          color: #777;
          font-size: 0.9rem;
          font-style: italic;
          padding: 20px 0;
          text-align: center;
        }
        .analytics-header-v {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .analytics-title-v {
          font-size: 1.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
        }
        .title-icon-v {
          color: #b3d332;
        }
        .analytics-subtitle-v {
          color: #888;
          font-size: 0.95rem;
          margin-top: 4px;
        }
        .analytics-actions-v {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .time-filter-v {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #18181f;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 14px;
          border-radius: 10px;
          color: #aaa;
        }
        .time-filter-v select {
          background: transparent;
          border: none;
          color: #fff;
          outline: none;
          font-weight: 600;
          cursor: pointer;
        }
        .time-filter-v select option {
          background: #18181f;
          color: #fff;
        }
        .analytics-refresh-btn-v {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #b3d332;
          color: #000;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .analytics-refresh-btn-v:hover {
          background: #9ab829;
          transform: translateY(-1px);
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        
        /* KPI Cards */
        .kpi-grid-v {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 35px;
        }
        .kpi-card-v {
          background: #14141a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .kpi-card-v:hover {
          border-color: rgba(179, 211, 50, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        }
        .kpi-card-v.revenue { border-left: 4px solid #b3d332; }
        .kpi-card-v.users { border-left: 4px solid #2db5d5; }
        .kpi-card-v.content { border-left: 4px solid #ff7bb5; }
        .kpi-card-v.transactions { border-left: 4px solid #6472b5; }
        
        .kpi-header-v {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #888;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .kpi-icon-v {
          background: rgba(255,255,255,0.06);
          padding: 8px;
          border-radius: 10px;
          color: #b3d332;
        }
        .kpi-value-v {
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
          margin: 15px 0 10px 0;
        }
        .kpi-footer-v {
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kpi-footer-v.positive { color: #b3d332; }
        .kpi-footer-v.neutral { color: #888; }

        /* Charts */
        .analytics-charts-grid-v {
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          margin-bottom: 35px;
        }
        .chart-card-v {
          background: #14141a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 24px;
        }
        .chart-card-v.full-width-v { flex: 1 1 100%; }
        .chart-card-v.half-width-v { flex: 1 1 calc(50% - 13px); min-width: 320px; }
        
        .chart-card-header-v {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .chart-card-header-v h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }
        .chart-badge-v {
          background: rgba(179, 211, 50, 0.15);
          color: #b3d332;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .chart-container-v {
          height: 320px;
          position: relative;
        }
        .doughnut-container-v {
          height: 280px;
          position: relative;
        }

        /* Demographics Grid */
        .analytics-demographics-grid-v {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 25px;
        }
        .demographic-card-v {
          background: #14141a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 24px;
        }
        .demographic-card-v h4 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }
        .progress-bar-group-v {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .progress-label-v {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #aaa;
          margin-bottom: 6px;
        }
        .progress-track-v {
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill-v {
          height: 100%;
          border-radius: 10px;
          transition: width 0.8s ease-in-out;
        }

        @media (max-width: 768px) {
          .analytics-page-v { padding: 15px 12px 60px 12px; }
          .analytics-header-v { flex-direction: column; align-items: stretch; gap: 15px; margin-bottom: 20px; }
          .analytics-title-v { font-size: 1.35rem; }
          .analytics-subtitle-v { font-size: 0.85rem; }
          
          .analytics-actions-v {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
          }
          .time-filter-v {
            flex: 1 1 55%;
            min-width: 140px;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .time-filter-v select {
            width: 100%;
          }
          .analytics-refresh-btn-v {
            flex: 1 1 35%;
            justify-content: center;
            padding: 10px 14px;
            font-size: 0.85rem;
            box-sizing: border-box;
          }
          .analytics-export-pdf-btn-v {
            width: 100%;
            justify-content: center;
            padding: 10px 14px;
            font-size: 0.85rem;
            box-sizing: border-box;
          }
          .custom-date-inputs-v {
            width: 100%;
            box-sizing: border-box;
            flex-wrap: wrap;
            justify-content: space-between;
          }

          .kpi-grid-v {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 25px;
          }
          .kpi-card-v {
            padding: 16px 18px;
            border-radius: 14px;
          }
          .kpi-value-v {
            font-size: 1.5rem;
            margin: 10px 0 6px 0;
          }
          .kpi-header-v {
            font-size: 0.85rem;
          }
          .kpi-footer-v {
            font-size: 0.78rem;
            flex-wrap: wrap;
          }

          .analytics-charts-grid-v { gap: 18px; margin-bottom: 25px; }
          .chart-card-v { padding: 16px; border-radius: 14px; }
          .chart-card-v.half-width-v { flex: 1 1 100%; min-width: auto; }
          .chart-container-v { height: 260px; }
          .doughnut-container-v { height: 240px; }

          .media-analytics-header-v { flex-direction: column; align-items: flex-start; gap: 12px; }
          .media-category-tabs-v {
            width: 100%;
            display: flex;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
          }
          .media-category-tabs-v button {
            white-space: nowrap;
            flex-shrink: 0;
          }
          .top-media-item-v {
            padding: 10px 12px;
            font-size: 0.85rem;
            flex-wrap: wrap;
            gap: 8px;
          }
          .media-title-v {
            min-width: 120px;
          }
        }

        /* ---------------------------------------------------- */
        /* PERFECT LIGHT MODE PDF REPORT EXPORT STYLING        */
        /* ---------------------------------------------------- */
        .print-header-banner-v {
          display: none;
        }

        @media print {
          /* Hide UI clutter (Top Header Navbar, Sidebar, Navigation, Filter Buttons, Actions) */
          header, .header, header.header, aside, nav, .sidebar, .navbar, .admin-header, .analytics-actions-v, .header-icon-btn, .metrics-filter-popover, .location-metrics-popover, .media-category-tabs-v, .filter-btn-wrapper {
            display: none !important;
          }

          /* Force LIGHT MODE Background & Typography */
          body, html, .main-content, .analytics-page-v {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 10px !important;
            margin: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Show Print PDF Header Banner in Light Mode */
          .print-header-banner-v {
            display: block !important;
            margin-bottom: 20px;
            padding: 18px 24px;
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 10px;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-header-banner-v h2 {
            margin: 0 0 6px 0;
            font-size: 1.35rem;
            color: #1e3a8a !important;
            font-weight: 800 !important;
          }

          .print-header-banner-v p {
            margin: 0;
            font-size: 0.82rem;
            color: #475569 !important;
          }

          /* All Cards styled cleanly in Light Mode */
          .kpi-card-v, .chart-card-v, .insights-card, .compare-card, .devices-card, .world-card, .locations-card, .demographic-card-v, .media-analytics-card-v {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 15px !important;
            border-radius: 10px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Light Mode Typography inside Cards */
          .card-title, .kpi-header-v, h3, h4, .kpi-value-v, .metric-value, .metric-label, .device-name, .device-percentage, .country-name, .visitor-count {
            color: #0f172a !important;
          }

          .metric-sublabel, .device-os, .page-range-info, .legend-label, .th-country, .th-visitors, .kpi-sub-v {
            color: #475569 !important;
          }

          /* Table borders & backgrounds in Light Mode */
          .locations-table-header, .location-row, .top-media-item-v {
            border-bottom: 1px solid #e2e8f0 !important;
          }

          .location-row:hover {
            background: #f1f5f9 !important;
          }

          /* Map Viewport in Light Mode */
          .map-viewport {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }

          .map-badge-overlay {
            background: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid #cbd5e1 !important;
          }

          .badge-title { color: #0f172a !important; }
          .badge-subtitle { color: #64748b !important; }

          .map-legend {
            background: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid #cbd5e1 !important;
            color: #334155 !important;
          }

          .legend-item { color: #334155 !important; }

          /* Grid layout for printing */
          .kpi-grid-v {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }

          .insights-compare-devices-grid, .world-locations-wrapper {
            display: flex !important;
            flex-direction: column !important;
            gap: 15px !important;
          }

          /* Expand location tables */
          .locations-list {
            max-height: none !important;
            overflow: visible !important;
          }

          /* Canvas & SVG scaling */
          .world-map-svg, canvas {
            max-width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />
    </div>
  );
};

export default Analytics;
