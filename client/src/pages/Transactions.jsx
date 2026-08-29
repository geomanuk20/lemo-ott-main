import React, { useState, useEffect } from 'react';
import { 
 Search, 
 Download, 
 ChevronLeft, 
 ChevronRight, 
 Loader2,
 Calendar,
 Trash2,
 AlertTriangle,
 X
} from 'lucide-react';
import Loader from '../components/Loader';
import * as XLSX from 'xlsx';

const API_URL = '/api/transactions';

const Transactions = () => {
 const [transactions, setTransactions] = useState([]);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [gatewayFilter, setGatewayFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [datePreset, setDatePreset] = useState('');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedIds, setSelectedIds] = useState([]);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deleteType, setDeleteType] = useState('');
 const [deletingId, setDeletingId] = useState(null);
 const itemsPerPage = 10;

 useEffect(() => {
  fetchTransactions();
 }, []);

 const fetchTransactions = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setTransactions(data);
  } catch (err) {
   console.error('Error fetching transactions:', err);
  } finally {
   setLoading(false);
  }
 };

 const confirmDeleteSingle = (id) => {
  setDeleteType('single');
  setDeletingId(id);
  setIsDeleteModalOpen(true);
 };

 const confirmBulkDelete = () => {
  if (selectedIds.length === 0) return;
  setDeleteType('bulk');
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  if (deleteType === 'single') {
   try {
    const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
    if (response.ok) {
     setTransactions(transactions.filter(tx => tx._id !== deletingId));
     setSelectedIds(selectedIds.filter(id => id !== deletingId));
    }
   } catch (err) {
    console.error('Error deleting transaction:', err);
   }
  } else if (deleteType === 'bulk') {
   try {
    await Promise.all(selectedIds.map(id => 
     fetch(`${API_URL}/${id}`, { method: 'DELETE' })
    ));
    setTransactions(transactions.filter(tx => !selectedIds.includes(tx._id)));
    setSelectedIds([]);
   } catch (err) {
    console.error('Error in bulk deletion:', err);
   }
  }
  setIsDeleteModalOpen(false);
  setDeletingId(null);
 };

 const handleDatePresetChange = (preset) => {
  setDatePreset(preset);
  setCurrentPage(1);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formatYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === 'current_month') {
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
   setStartDate(formatYMD(start));
   setEndDate(formatYMD(end));
  } else if (preset === 'last_month') {
   const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
   const end = new Date(now.getFullYear(), now.getMonth(), 0);
   setStartDate(formatYMD(start));
   setEndDate(formatYMD(end));
  } else if (preset === 'today') {
   const todayStr = formatYMD(now);
   setStartDate(todayStr);
   setEndDate(todayStr);
  } else if (preset === 'yesterday') {
   const yest = new Date(now);
   yest.setDate(yest.getDate() - 1);
   const yestStr = formatYMD(yest);
   setStartDate(yestStr);
   setEndDate(yestStr);
  } else if (preset === 'custom') {
   // User can pick custom dates
  } else {
   setStartDate('');
   setEndDate('');
  }
 };

 const clearDateFilter = () => {
  setDatePreset('');
  setStartDate('');
  setEndDate('');
  setCurrentPage(1);
 };

 const filteredTransactions = transactions.filter(tx => {
  const q = searchTerm.toLowerCase();
  const matchesSearch = !q ||
             tx.email?.toLowerCase().includes(q) || 
             tx.paymentId?.toLowerCase().includes(q) ||
             tx.name?.toLowerCase().includes(q);
  const matchesGateway = gatewayFilter === '' || tx.gateway === gatewayFilter;

  const txStatus = (tx.status || 'Completed').toLowerCase();
  const matchesStatus = statusFilter === '' || 
    (statusFilter === 'success' && (txStatus === 'completed' || txStatus === 'success')) ||
    (statusFilter === 'pending' && txStatus === 'pending') ||
    (statusFilter === 'failed' && txStatus === 'failed');

  const txDate = tx.paymentDate || (tx.createdAt ? tx.createdAt.split('T')[0] : '');
  const matchesStartDate = !startDate || (txDate && txDate >= startDate);
  const matchesEndDate = !endDate || (txDate && txDate <= endDate);

  return matchesSearch && matchesGateway && matchesStatus && matchesStartDate && matchesEndDate;
 });

 const handleExport = () => {
  const dataToExport = filteredTransactions.map(tx => ({
   Name: tx.name || 'N/A',
   Email: tx.email || 'N/A',
   Plan: tx.plan || 'N/A',
   Amount: tx.amount !== undefined ? tx.amount : 'N/A',
   'Payment Gateway': tx.gateway || 'N/A',
   'Coupon Code': tx.couponCode || 'None',
   'Payment ID': tx.paymentId || 'N/A',
   'Payment Date': tx.paymentDate || 'N/A',
   Status: tx.status || 'Completed'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, 'transactions.xlsx');
 };

 const indexOfLastItem = currentPage * itemsPerPage;
 const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
 const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

 const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSelectAll = (e) => {
   if (e.target.checked) {
    setSelectedIds(currentItems.map(tx => tx._id));
   } else {
    setSelectedIds([]);
   }
  };

  const handleSelectOne = (id) => {
   if (selectedIds.includes(id)) {
    setSelectedIds(selectedIds.filter(itemId => itemId !== id));
   } else {
    setSelectedIds([...selectedIds, id]);
   }
  };

 return (
  <div className="transactions-page">
   <div className="filter-bar-v">
    <div className="filter-left-v">
      <select 
       value={gatewayFilter} 
       onChange={(e) => { setGatewayFilter(e.target.value); setCurrentPage(1); }}
       className="premium-select-v"
      >
       <option value="">Filter by Gateway</option>
       <option value="PhonePe">PhonePe</option>
       <option value="Stripe">Stripe</option>
       <option value="Payu">Payu</option>
       <option value="Cashfree">Cashfree</option>
       <option value="Apple">Apple</option>
       <option value="IAP">IAP</option>
       <option value="Free Activation">Free Activation</option>
      </select>

      <select 
       value={statusFilter} 
       onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
       className="premium-select-v"
      >
       <option value="">Filter by Status</option>
       <option value="success">Success</option>
       <option value="pending">Pending</option>
       <option value="failed">Failed</option>
      </select>

      <select 
       value={datePreset} 
       onChange={(e) => handleDatePresetChange(e.target.value)}
       className="premium-select-v"
      >
       <option value="">Filter by Date</option>
       <option value="current_month">Current Month</option>
       <option value="today">Today</option>
       <option value="yesterday">Yesterday</option>
       <option value="last_month">Last Month</option>
       <option value="custom">Date Range Select...</option>
      </select>

      {(datePreset === 'custom' || startDate || endDate) && (
       <div className="date-picker-group-v">
        <div className="date-input-wrap">
         <span className="date-label-inline">From</span>
         <input 
          type="date" 
          value={startDate} 
          onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); setCurrentPage(1); }}
          className="date-input-v"
         />
        </div>
        <span className="date-sep-v">-</span>
        <div className="date-input-wrap">
         <span className="date-label-inline">To</span>
         <input 
          type="date" 
          value={endDate} 
          onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); setCurrentPage(1); }}
          className="date-input-v"
         />
        </div>
        {(startDate || endDate || datePreset) && (
         <button 
          onClick={clearDateFilter} 
          className="date-clear-btn-v" 
          title="Clear date filter"
         >
          <X size={14} />
         </button>
        )}
       </div>
      )}

      <div className="search-box-v">
       <input 
        type="text" 
        placeholder="Search By Payment ID OR Email..." 
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
       />
       <Search size={18} className="search-icon-v" />
      </div>
     </div>

    <div className="filter-right-v" style={{ display: 'flex', gap: '15px' }}>
     {selectedIds.length > 0 && (
      <button className="export-btn-v" onClick={confirmBulkDelete} style={{ background: '#ff4d4d' }}>
       <Trash2 size={18} />
       <span>Delete Selected ({selectedIds.length})</span>
      </button>
     )}
     <button className="export-btn-v" onClick={handleExport}>
      <Download size={18} />
      <span>Export Transactions</span>
     </button>
    </div>
   </div>

   <div className="table-container-p">
    <table className="premium-table-v">
     <thead>
      <tr>
       <th style={{ width: '36px', textAlign: 'center' }}>
        <input 
         type="checkbox" 
         onChange={handleSelectAll}
         checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
         style={{ width: '15px', height: '15px', cursor: 'pointer' }}
        />
       </th>
       <th>Name</th>
       <th>Email</th>
       <th>Plan</th>
       <th>Amount</th>
       <th>Gateway</th>
       <th>Coupon</th>
       <th>Payment ID</th>
       <th>Date</th>
       <th>Status</th>
       <th style={{ textAlign: 'center', width: '50px' }}>Action</th>
      </tr>
     </thead>
     <tbody>
      {loading ? (
       <tr>
        <td colSpan="11" className="loader-cell">
         <Loader size="small" inline={true} />
        </td>
       </tr>
      ) : currentItems.length === 0 ? (
       <tr>
        <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
         No transactions found.
        </td>
       </tr>
      ) : (
       currentItems.map((tx) => (
        <tr key={tx._id}>
         <td style={{ textAlign: 'center' }}>
          <input 
           type="checkbox" 
           checked={selectedIds.includes(tx._id)}
           onChange={() => handleSelectOne(tx._id)}
           style={{ width: '15px', height: '15px', cursor: 'pointer' }}
          />
         </td>
         <td className="name-cell-v">
          <span style={{ display: 'block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.name}>
           {tx.name}
          </span>
         </td>
         <td>
          <span style={{ display: 'block', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.email}>
           {tx.email}
          </span>
         </td>
         <td className="bold-text" style={{ whiteSpace: 'nowrap' }}>{tx.plan}</td>
         <td className="bold-text" style={{ color: '#b3d332', whiteSpace: 'nowrap' }}>{tx.amount}</td>
         <td style={{ whiteSpace: 'nowrap' }}>{tx.gateway}</td>
         <td style={{ whiteSpace: 'nowrap' }}>
          {tx.couponCode ? (
            <span style={{ 
              background: 'rgba(179, 211, 50, 0.15)', 
              color: '#b3d332', 
              border: '1px solid rgba(179, 211, 50, 0.35)', 
              padding: '2px 7px', 
              borderRadius: '4px', 
              fontWeight: 800, 
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              letterSpacing: '0.5px'
            }}>
              {tx.couponCode}
            </span>
          ) : (
            <span style={{ color: '#555', fontSize: '0.9rem' }}>—</span>
          )}
         </td>
         <td>
          <span 
            style={{ display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.78rem', color: '#ccc' }} 
            title={tx.paymentId}
          >
           {tx.paymentId}
          </span>
         </td>
         <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{tx.paymentDate}</td>
          <td style={{ whiteSpace: 'nowrap' }}>
           {(() => {
             const st = (tx.status || 'Completed').toLowerCase();
             const isPending = st === 'pending';
             const isFailed = st === 'failed';

             const bg = isPending 
               ? 'rgba(255, 152, 0, 0.15)' 
               : isFailed 
               ? 'rgba(255, 77, 77, 0.15)' 
               : 'rgba(0, 204, 102, 0.15)';

             const color = isPending 
               ? '#ff9800' 
               : isFailed 
               ? '#ff4d4d' 
               : '#00cc66';

             const border = isPending 
               ? 'rgba(255, 152, 0, 0.35)' 
               : isFailed 
               ? 'rgba(255, 77, 77, 0.35)' 
               : 'rgba(0, 204, 102, 0.35)';

             const label = isFailed ? 'FAILED' : isPending ? 'PENDING' : 'SUCCESS';

             return (
               <span style={{
                 background: bg,
                 color: color,
                 border: `1px solid ${border}`,
                 padding: '2px 7px',
                 borderRadius: '4px',
                 fontWeight: 700,
                 fontSize: '0.72rem',
                 textTransform: 'uppercase'
               }}>
                 {label}
               </span>
             );
           })()}
          </td>
         <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          <button 
           onClick={() => confirmDeleteSingle(tx._id)}
           style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: '#ff4d4d', cursor: 'pointer', padding: '5px 7px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
           title="Delete Transaction"
          >
           <Trash2 size={14} />
          </button>
         </td>
        </tr>
       ))
      )}
     </tbody>
    </table>
   </div>

   <div className="pagination-v">
    <button 
     onClick={() => paginate(currentPage - 1)} 
     disabled={currentPage === 1}
     className="pag-btn-v"
    >
     <ChevronLeft size={16} />
    </button>
    
    {(() => {
      const pages = [];
      let last = 0;
      for (let i = 1; i <= totalPages; i++) {
       if (i === 1 || i === totalPages || i === currentPage || (i >= currentPage - 1 && i <= currentPage + 1)) {
        if (last && i - last > 1) pages.push('...' + i);
        pages.push(i);
        last = i;
       }
      }
      return pages.map((page, idx) => {
       if (typeof page === 'string') {
        return <span key={idx} className="pag-ellipsis-v">...</span>;
       }
       return (
        <button key={page} onClick={() => paginate(page)} className={`pag-btn-v ${currentPage === page ? 'active' : ''}`}>
         {page}
        </button>
       );
      });
     })()}

    <button 
     onClick={() => paginate(currentPage + 1)} 
     disabled={currentPage === totalPages}
     className="pag-btn-v"
    >
     <ChevronRight size={16} />
    </button>
   </div>

   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper">
       <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
      </div>
      <h2>Are you sure?</h2>
      <p>
       {deleteType === 'bulk' 
        ? `You want to delete ${selectedIds.length} transactions? This action cannot be undone.` 
        : 'You want to delete this transaction? This action cannot be undone.'}
      </p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .transactions-page { width: 100%; box-sizing: border-box; }
    
    .filter-bar-v { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 15px; flex-wrap: wrap; width: 100%; }
    .filter-left-v { display: flex; gap: 12px; align-items: center; flex: 1; flex-wrap: wrap; }
    
    .premium-select-v { background: #14171d; border: 1px solid #282f3a; color: #fff; padding: 10px 15px; border-radius: 6px; outline: none; width: 175px; height: 42px; font-size: 0.9rem; box-sizing: border-box; flex-shrink: 0; }
     
    .date-picker-group-v { display: flex; align-items: center; gap: 8px; background: #14171d; border: 1px solid #282f3a; border-radius: 6px; padding: 4px 10px; height: 42px; box-sizing: border-box; flex-shrink: 0; }
    .date-input-wrap { display: flex; align-items: center; gap: 6px; }
    .date-label-inline { color: #777; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .date-input-v { background: transparent; border: none; color: #fff; font-size: 0.82rem; outline: none; font-family: inherit; color-scheme: dark; cursor: pointer; }
    .date-sep-v { color: #555; font-size: 0.85rem; }
    .date-clear-btn-v { background: rgba(255, 255, 255, 0.08); border: none; color: #bbb; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: all 0.2s; }
    .date-clear-btn-v:hover { background: rgba(255, 77, 77, 0.25); color: #ff4d4d; }

    .search-box-v { position: relative; flex: 2; min-width: 220px; }
    .search-box-v input { width: 100%; height: 42px; background: #14171d; border: 1px solid #282f3a; color: #fff; padding: 0 45px 0 15px; border-radius: 6px; outline: none; font-size: 0.9rem; box-sizing: border-box; }
    .search-box-v input::placeholder { color: #666; }
    .search-icon-v { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; }
    
    .export-btn-v { background: #00a8ff; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.3s; }
    .export-btn-v:hover { background: #0097e6; }

    .table-container-p { background: #0d0e12; border: 1px solid #222834; border-radius: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; box-sizing: border-box; }
    .premium-table-v { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table-v th { background: #151821; padding: 12px 10px; font-size: 0.82rem; font-weight: 700; color: #eee; border-bottom: 1px solid #282f3a; border-right: 1px solid #1c202a; white-space: nowrap; }
    .premium-table-v th:last-child { border-right: none; }
    .premium-table-v td { padding: 12px 10px; font-size: 0.82rem; color: #aaa; border-bottom: 1px solid #181b22; border-right: 1px solid #1c202a; vertical-align: middle; }
    .premium-table-v td:last-child { border-right: none; }
    .premium-table-v tr:hover { background: rgba(255,255,255,0.02); }
    
    .name-cell-v { color: #00a8ff; font-weight: 700; }
    .bold-text { color: #eee; font-weight: 700; }

    .pagination-v { display: flex; gap: 5px; margin-top: 25px; background: #11141a; padding: 6px; border-radius: 6px; width: fit-content; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #222834; }
    .pag-btn-v { background: #1a1e27; border: none; color: #fff; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; font-weight: 700; transition: all 0.2s; flex-shrink: 0; }
    .pag-btn-v:hover { background: #282f3a; }
    .pag-btn-v.active { background: #b3d332; color: #000; }
    .pag-btn-v:disabled { opacity: 0.3; cursor: not-allowed; }
    .pag-ellipsis-v { display: flex; align-items: center; justify-content: center; width: 30px; height: 34px; color: #666; font-size: 1rem; flex-shrink: 0; }

    .loader-cell { text-align: center; padding: 80px !important; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 4000; backdrop-filter: blur(5px); }
    .delete-modal-content { background: #1a1e27; width: 90%; max-width: 450px; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #333; animation: modalFade 0.2s ease-out; }
    .delete-icon-wrapper { margin-bottom: 20px; }
    .delete-modal-content h2 { color: #fff; margin-bottom: 10px; font-size: 1.6rem; font-weight: 700; }
    .delete-modal-content p { color: #aaa; margin-bottom: 30px; font-size: 0.95rem; }
    .delete-modal-footer { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn { background: #282f3a; color: #fff; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: background 0.3s; }
    .cancel-btn:hover { background: #353e4c; }
    .confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: background 0.3s; }
    .confirm-btn:hover { background: #ff3333; }
    @keyframes modalFade { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    @media (max-width: 768px) {
     .transactions-page { padding: 10px 0; }
     .filter-bar-v { flex-direction: column; align-items: stretch; gap: 10px; }
     .premium-select-v { width: 100%; }
     .search-box-v { width: 100%; min-width: unset; }
     .export-btn-v { width: 100%; height: 42px; justify-content: center; }
     .table-container-p { width: 100%; overflow-x: auto; }
     .premium-table-v { min-width: 850px; }
    }
   ` }} />
  </div>
 );
};

export default Transactions;
