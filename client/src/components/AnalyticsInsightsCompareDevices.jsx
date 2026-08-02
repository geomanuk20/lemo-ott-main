import React, { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  SlidersHorizontal, 
  Eye, 
  Clock, 
  Users, 
  LogOut, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Layers,
  Check
} from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Tooltip, 
  Legend
);

const AnalyticsInsightsCompareDevices = ({ stats }) => {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [groupBy, setGroupBy] = useState('Auto'); // 'Auto', 'Day', 'Week', 'Month'
  const [selectedMetrics, setSelectedMetrics] = useState({
    pageviews: true,
    visitors: true,
    sessions: false,
    bounces: false,
    conversions: false
  });

  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowFilterPopover(false);
      }
    };
    if (showFilterPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterPopover]);

  // Dynamic Chart Datasets based on GroupBy & Selected Metrics
  const rawDatasets = {
    pageviews: {
      label: 'Pageviews',
      data: groupBy === 'Week' ? [3200, 4100, 3900, 4800] : groupBy === 'Month' ? [14200, 16800, 18900] : [620, 560, 750, 615, 880, 510, 590, 515],
      borderColor: '#c99824',
      backgroundColor: '#c99824',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#c99824',
      borderWidth: 2.5
    },
    visitors: {
      label: 'Visitors',
      data: groupBy === 'Week' ? [2100, 2800, 2600, 3100] : groupBy === 'Month' ? [9800, 11200, 12500] : [410, 360, 455, 410, 640, 370, 415, 335],
      borderColor: '#4a77bd',
      backgroundColor: '#4a77bd',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#4a77bd',
      borderWidth: 2.5
    },
    sessions: {
      label: 'Sessions',
      data: groupBy === 'Week' ? [2400, 3100, 2900, 3400] : groupBy === 'Month' ? [11000, 12800, 14100] : [480, 420, 540, 490, 720, 430, 490, 390],
      borderColor: '#4caf50',
      backgroundColor: '#4caf50',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#4caf50',
      borderWidth: 2.5
    },
    bounces: {
      label: 'Bounces',
      data: groupBy === 'Week' ? [1100, 1400, 1250, 1500] : groupBy === 'Month' ? [4800, 5400, 6100] : [210, 190, 240, 210, 310, 180, 205, 170],
      borderColor: '#ff5252',
      backgroundColor: '#ff5252',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ff5252',
      borderWidth: 2.5
    },
    conversions: {
      label: 'Conversions',
      data: groupBy === 'Week' ? [450, 580, 520, 680] : groupBy === 'Month' ? [2100, 2600, 2900] : [95, 80, 120, 90, 160, 85, 105, 88],
      borderColor: '#ab47bc',
      backgroundColor: '#ab47bc',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ab47bc',
      borderWidth: 2.5
    }
  };

  const getXAxisLabels = () => {
    if (groupBy === 'Week') return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    if (groupBy === 'Month') return ['May', 'Jun', 'Jul'];
    return ['9 Thu', '10 Fri', '11 Sat', '12 Sun', '13 Mon', '14 Tue', '15 Wed', '16 Thu'];
  };

  const activeDatasets = Object.keys(selectedMetrics)
    .filter(key => selectedMetrics[key])
    .map(key => rawDatasets[key]);

  const insightsData = {
    labels: getXAxisLabels(),
    datasets: activeDatasets.length > 0 ? activeDatasets : [rawDatasets.pageviews, rawDatasets.visitors]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 18, 22, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 10
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#667788', font: { size: 11 } }
      },
      x: {
        ticks: { color: '#8899a6', font: { size: 11 } },
        grid: { display: false }
      }
    }
  };

  const compare = stats?.compareMetrics || {
    pageviews: '5.1K',
    sessions: '3.7K',
    visitors: '3.2K',
    bounceRate: '51%'
  };

  const devices = stats?.deviceBreakdown || {
    desktop: '57.6%',
    tablet: '0%',
    mobile: '42.4%',
    other: '0%'
  };

  return (
    <div className="insights-compare-devices-grid">
      {/* 1. Insights Card */}
      <div className="insights-card">
        <div className="card-header">
          <h3 className="card-title">Insights</h3>
          <div className="insights-header-right">
            <div className="custom-legend">
              {selectedMetrics.visitors && (
                <>
                  <span className="legend-dot visitors-dot"></span>
                  <span className="legend-label">Visitors</span>
                </>
              )}
              {selectedMetrics.pageviews && (
                <>
                  <span className="legend-dot pageviews-dot"></span>
                  <span className="legend-label">Pageviews</span>
                </>
              )}
              {selectedMetrics.sessions && (
                <>
                  <span className="legend-dot sessions-dot"></span>
                  <span className="legend-label">Sessions</span>
                </>
              )}
              {selectedMetrics.bounces && (
                <>
                  <span className="legend-dot bounces-dot"></span>
                  <span className="legend-label">Bounces</span>
                </>
              )}
              {selectedMetrics.conversions && (
                <>
                  <span className="legend-dot conversions-dot"></span>
                  <span className="legend-label">Conversions</span>
                </>
              )}
            </div>

            {/* Filter Toggle Button */}
            <div className="filter-btn-wrapper" ref={popoverRef}>
              <button 
                className={`header-icon-btn ${showFilterPopover ? 'active' : ''}`} 
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                title="Select metrics"
              >
                <SlidersHorizontal size={15} />
              </button>

              {/* Popover Modal */}
              {showFilterPopover && (
                <div className="metrics-filter-popover">
                  <h4 className="popover-title">Select metrics</h4>
                  
                  {/* GROUP BY Segmented Control */}
                  <div className="popover-section">
                    <span className="popover-section-label">GROUP BY</span>
                    <div className="group-by-segmented">
                      {['Auto', 'Day', 'Week', 'Month'].map(mode => (
                        <button 
                          key={mode} 
                          className={`segment-btn ${groupBy === mode ? 'active' : ''}`}
                          onClick={() => setGroupBy(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metrics Checkbox Options */}
                  <div className="popover-metrics-list">
                    {[
                      { key: 'pageviews', label: 'Pageviews' },
                      { key: 'visitors', label: 'Visitors' },
                      { key: 'sessions', label: 'Sessions' },
                      { key: 'bounces', label: 'Bounces' },
                      { key: 'conversions', label: 'Conversions' }
                    ].map(m => {
                      const isChecked = selectedMetrics[m.key];
                      return (
                        <div 
                          key={m.key} 
                          className={`custom-checkbox-row ${isChecked ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMetrics(prev => ({ ...prev, [m.key]: !prev[m.key] }));
                          }}
                        >
                          <div className="checkbox-box">
                            {isChecked && <Check size={13} className="check-icon" />}
                          </div>
                          <span className="checkbox-label-text">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Helper Text Note */}
                  <p className="popover-note">
                    When a single metric is selected, a dashed comparison line is shown on the chart. The comparison period is set in the date range picker.
                  </p>

                  {/* Action Buttons */}
                  <div className="popover-actions">
                    <button className="apply-btn" onClick={() => setShowFilterPopover(false)}>
                      Apply
                    </button>
                    <button 
                      className="reset-btn" 
                      onClick={() => {
                        setGroupBy('Auto');
                        setSelectedMetrics({ pageviews: true, visitors: true, sessions: false, bounces: false, conversions: false });
                      }}
                    >
                      Reset to defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="insights-chart-container">
          <Line 
            key={`${groupBy}-${Object.keys(selectedMetrics).filter(k => selectedMetrics[k]).join('-')}`}
            data={insightsData} 
            options={chartOptions} 
          />
        </div>
      </div>

      {/* 2. Compare Card */}
      <div className="compare-card">
        <div className="card-header">
          <h3 className="card-title">Compare</h3>
        </div>

        <div className="compare-metrics-list">
          <div className="compare-metric-row">
            <div className="metric-left">
              <div className="metric-icon-box"><Eye size={18} /></div>
              <div className="metric-info">
                <span className="metric-label">Pageviews</span>
                <span className="metric-sublabel">1 pageviews per session</span>
              </div>
            </div>
            <div className="metric-right">
              <span className="metric-value">{compare.pageviews}</span>
              <span className="metric-change positive">↑ 8.1%</span>
            </div>
          </div>

          <div className="compare-metric-row">
            <div className="metric-left">
              <div className="metric-icon-box"><Clock size={18} /></div>
              <div className="metric-info">
                <span className="metric-label">Sessions</span>
                <span className="metric-sublabel">00:15 per session</span>
              </div>
            </div>
            <div className="metric-right">
              <span className="metric-value">{compare.sessions}</span>
              <span className="metric-change positive">↑ 20.4%</span>
            </div>
          </div>

          <div className="compare-metric-row">
            <div className="metric-left">
              <div className="metric-icon-box"><Users size={18} /></div>
              <div className="metric-info">
                <span className="metric-label">Visitors</span>
                <span className="metric-sublabel">96% are new visitors</span>
              </div>
            </div>
            <div className="metric-right">
              <span className="metric-value">{compare.visitors}</span>
              <span className="metric-change positive">↑ 27.8%</span>
            </div>
          </div>

          <div className="compare-metric-row">
            <div className="metric-left">
              <div className="metric-icon-box"><LogOut size={18} /></div>
              <div className="metric-info">
                <span className="metric-label">Bounce Rate</span>
                <span className="metric-sublabel">{compare.bouncedCount || '1886'} visitors bounced</span>
              </div>
            </div>
            <div className="metric-right">
              <span className="metric-value">{compare.bounceRate}</span>
              <span className="metric-change negative">↑ 5.3%</span>
            </div>
          </div>
        </div>

        <div className="compare-footer">
          vs. July 1 – July 8, 2026
        </div>
      </div>

      {/* 3. Devices Card */}
      <div className="devices-card">
        <div className="card-header">
          <h3 className="card-title">Devices</h3>
        </div>

        <div className="devices-list">
          <div className="device-row">
            <div className="device-left">
              <div className="device-icon-box"><Monitor size={18} /></div>
              <div className="device-info">
                <span className="device-name">Desktop</span>
                <span className="device-os">Linux / Chrome</span>
              </div>
            </div>
            <span className="device-percentage">{devices.desktop}</span>
          </div>

          <div className="device-row">
            <div className="device-left">
              <div className="device-icon-box"><Tablet size={18} /></div>
              <div className="device-info">
                <span className="device-name">Tablet</span>
                <span className="device-os">-</span>
              </div>
            </div>
            <span className="device-percentage muted">{devices.tablet}</span>
          </div>

          <div className="device-row">
            <div className="device-left">
              <div className="device-icon-box"><Smartphone size={18} /></div>
              <div className="device-info">
                <span className="device-name">Mobile</span>
                <span className="device-os">Android / Chrome</span>
              </div>
            </div>
            <span className="device-percentage">{devices.mobile}</span>
          </div>

          <div className="device-row">
            <div className="device-left">
              <div className="device-icon-box"><Layers size={18} /></div>
              <div className="device-info">
                <span className="device-name">Other</span>
                <span className="device-os">-</span>
              </div>
            </div>
            <span className="device-percentage muted">{devices.other}</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .insights-compare-devices-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 20px;
          margin-top: 25px;
          margin-bottom: 25px;
          width: 100%;
        }

        .insights-card, .compare-card, .devices-card {
          background: #121417;
          border: 1px solid #1f2329;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          position: relative;
          overflow: visible !important;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        .insights-header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .custom-legend {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .visitors-dot { background: #4a77bd; }
        .pageviews-dot { background: #c99824; }
        .sessions-dot { background: #4caf50; }
        .bounces-dot { background: #ff5252; }
        .conversions-dot { background: #ab47bc; }

        .legend-label {
          font-size: 0.78rem;
          color: #8895a5;
          font-weight: 500;
        }

        .filter-btn-wrapper {
          position: relative;
        }

        .header-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-icon-btn:hover, .header-icon-btn.active {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border-color: #b3d332;
        }

        /* Select metrics Popover Modal */
        .metrics-filter-popover {
          position: absolute;
          top: 42px;
          right: 0;
          width: 340px;
          background: #181b1f;
          border: 1px solid #2a2f38;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.95);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .popover-title {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .popover-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .popover-section-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #8895a5;
          letter-spacing: 0.5px;
        }

        /* Segmented Buttons */
        .group-by-segmented {
          display: flex;
          background: #111417;
          border: 1px solid #242932;
          border-radius: 8px;
          padding: 3px;
          gap: 2px;
        }

        .segment-btn {
          flex: 1;
          background: none;
          border: 1px solid transparent;
          color: #8895a5;
          padding: 6px 0;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .segment-btn.active {
          background: #1e3324;
          border-color: #396043;
          color: #b3d332;
        }

        /* Custom Checkbox List */
        .popover-metrics-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .custom-checkbox-row {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          padding: 2px 0;
        }

        .checkbox-box {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid #3a4250;
          background: #121417;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .custom-checkbox-row.checked .checkbox-box {
          background: #2b4531;
          border-color: #48995a;
        }

        .check-icon {
          color: #48995a;
        }

        .checkbox-label-text {
          font-size: 0.85rem;
          color: #d1d5db;
          font-weight: 500;
        }

        .custom-checkbox-row.checked .checkbox-label-text {
          color: #ffffff;
        }

        /* Helper note */
        .popover-note {
          font-size: 0.74rem;
          color: #718096;
          line-height: 1.4;
          margin: 0;
          border-top: 1px solid #222730;
          padding-top: 12px;
        }

        /* Actions */
        .popover-actions {
          display: flex;
          gap: 10px;
        }

        .apply-btn {
          flex: 1;
          background: #396043;
          border: 1px solid #48995a;
          color: #ffffff;
          padding: 8px 0;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .apply-btn:hover {
          background: #48995a;
        }

        .reset-btn {
          flex: 1;
          background: #222730;
          border: 1px solid #2e3542;
          color: #a0aec0;
          padding: 8px 0;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-btn:hover {
          background: #2a313d;
          color: #ffffff;
        }

        .insights-chart-container {
          flex: 1;
          min-height: 280px;
          margin-top: 15px;
          position: relative;
        }

        /* Compare Section */
        .compare-metrics-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 10px;
          flex: 1;
        }

        .compare-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .metric-icon-box {
          color: #8895a5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-label {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .metric-sublabel {
          color: #8899aa;
          font-size: 0.74rem;
          font-weight: 400;
          letter-spacing: 0.2px;
        }

        .metric-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .metric-value {
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .metric-change {
          font-size: 0.73rem;
          font-weight: 700;
        }

        .metric-change.positive { color: #4caf50; }
        .metric-change.negative { color: #ff4d4d; }

        .compare-footer {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid #1f2329;
          color: #64748b;
          font-size: 0.72rem;
        }

        /* Devices Section */
        .devices-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 15px;
          flex: 1;
        }

        .device-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .device-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .device-icon-box {
          color: #8895a5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .device-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .device-name {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .device-os {
          color: #64748b;
          font-size: 0.73rem;
        }

        .device-percentage {
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .device-percentage.muted {
          color: #64748b;
        }

        @media (max-width: 1200px) {
          .insights-compare-devices-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  );
};

export default AnalyticsInsightsCompareDevices;
