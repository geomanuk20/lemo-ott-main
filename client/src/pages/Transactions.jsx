import React, { useState, useEffect } from 'react';
import { 
 Search, 
 Download, 
 ChevronLeft, 
 ChevronRight, 
 Loader2,
 Calendar,
 Trash2,
 AlertTriangle
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = 'http://localhost:5001/api/transactions';

const Transactions = () => {
 const [transactions, setTransactions] = useState([]);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [gatewayFilter, setGatewayFilter] = useState('');
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

 const filteredTransactions = transactions.filter(tx => {
  const matchesSearch = tx.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
             tx.paymentId.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesGateway = gatewayFilter === '' || tx.gateway === gatewayFilter;
  return matchesSearch && matchesGateway;
 });

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
      onChange={(e) => setGatewayFilter(e.target.value)}
      className="premium-select-v"
     >
      <option value="">Filter by Gateway</option>
      <option value="Stripe">Stripe</option>
      <option value="Payu">Payu</option>
      <option value="Cashfree">Cashfree</option>
      <option value="Apple">Apple</option>
      <option value="IAP">IAP</option>
     </select>

     <div className="search-box-v">
      <input 
       type="text" 
       placeholder="Search By Payment ID OR Email..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search size={18} className="search-icon-v" />
     </div>

     <div className="date-box-v">
      <input type="text" placeholder="mm/dd/yyyy" />
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
     <button className="export-btn-v">
      <Download size={18} />
      <span>Export Transactions</span>
     </button>
    </div>
   </div>

   <div className="table-container-p">
    <table className="premium-table-v">
     <thead>
      <tr>
       <th style={{ width: '50px' }}>
        <input 
         type="checkbox" 
         onChange={handleSelectAll}
         checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
         style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
       </th>
       <th>Name</th>
       <th>Email</th>
       <th>Plan</th>
       <th>Amount</th>
       <th>Payment Gateway</th>
       <th>Payment ID</th>
       <th>Payment Date</th>
       <th>Action</th>
      </tr>
     </thead>
     <tbody>
      {loading ? (
       <tr>
        <td colSpan="9" className="loader-cell">
         <Loader size="small" inline={true} />
        </td>
       </tr>
      ) : currentItems.length === 0 ? (
       <tr>
        <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
         No transactions found.
        </td>
       </tr>
      ) : (
       currentItems.map((tx) => (
        <tr key={tx._id}>
         <td>
          <input 
           type="checkbox" 
           checked={selectedIds.includes(tx._id)}
           onChange={() => handleSelectOne(tx._id)}
           style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
         </td>
         <td className="name-cell-v">{tx.name}</td>
         <td>{tx.email}</td>
         <td className="bold-text">{tx.plan}</td>
         <td className="bold-text">{tx.amount}</td>
         <td>{tx.gateway}</td>
         <td>{tx.paymentId}</td>
         <td>{tx.paymentDate}</td>
         <td>
          <button 
           onClick={() => confirmDeleteSingle(tx._id)}
           style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
           title="Delete Transaction"
          >
           <Trash2 size={16} />
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
    
    {[...Array(totalPages)].map((_, i) => (
     <button 
      key={i} 
      onClick={() => paginate(i + 1)}
      className={`pag-btn-v ${currentPage === i + 1 ? 'active' : ''}`}
     >
      {i + 1}
     </button>
    ))}

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
    .transactions-page { padding: 30px; background: #000; min-height: 100vh; color: #fff; }
    
    .filter-bar-v { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; gap: 20px; }
    .filter-left-v { display: flex; gap: 15px; flex: 1; }
    
    .premium-select-v { background: #25272b; border: 1px solid #333; color: #fff; padding: 10px 15px; border-radius: 6px; outline: none; width: 220px; font-size: 0.9rem; }
    
    .search-box-v, .date-box-v { position: relative; flex: 1; max-width: 350px; }
    .search-box-v input, .date-box-v input { width: 100%; background: #25272b; border: 1px solid #333; color: #fff; padding: 10px 45px 10px 15px; border-radius: 30px; outline: none; font-size: 0.9rem; }
    .search-icon-v { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #888; }
    
    .export-btn-v { background: #00a8ff; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; transition: background 0.3s; }
    .export-btn-v:hover { background: #0097e6; }

    .table-container-p { background: #0a0a0a; border: 1px solid #222; border-radius: 4px; overflow: hidden; }
    .premium-table-v { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table-v th { background: #151515; padding: 15px 20px; font-size: 0.9rem; font-weight: 700; color: #eee; border-bottom: 1px solid #333; border-right: 1px solid #222; }
    .premium-table-v th:last-child { border-right: none; }
    .premium-table-v td { padding: 18px 20px; font-size: 0.85rem; color: #888; border-bottom: 1px solid #1a1a1a; border-right: 1px solid #222; vertical-align: middle; }
    .premium-table-v td:last-child { border-right: none; }
    .premium-table-v tr:hover { background: #111; }
    
    .name-cell-v { color: #0088ff; font-weight: 700; cursor: pointer; }
    .bold-text { color: #eee; font-weight: 700; }

    .pagination-v { display: flex; gap: 5px; margin-top: 30px; background: #111; padding: 5px; border-radius: 6px; width: fit-content; }
    .pag-btn-v { background: #222; border: none; color: #fff; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; font-weight: 700; transition: all 0.2s; }
    .pag-btn-v:hover { background: #333; }
    .pag-btn-v.active { background: #b3d332; }
    .pag-btn-v:disabled { opacity: 0.3; cursor: not-allowed; }

    .loader-cell { text-align: center; padding: 100px !important; }
    .spinner { animation: spin 1s linear infinite; color: #00a8ff; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 4000; backdrop-filter: blur(5px); }
    .delete-modal-content { background: #1a1a1a; width: 90%; max-width: 450px; padding: 30px; border-radius: 20px; text-align: center; border: 1px solid #333; animation: modalFade 0.2s ease-out; }
    .delete-icon-wrapper { margin-bottom: 20px; }
    .delete-modal-content h2 { color: #fff; margin-bottom: 10px; font-size: 1.8rem; font-weight: 700; }
    .delete-modal-content p { color: #aaa; margin-bottom: 30px; font-size: 0.95rem; }
    .delete-modal-footer { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn { background: #333; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: background 0.3s; }
    .cancel-btn:hover { background: #444; }
    .confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: background 0.3s; }
    .confirm-btn:hover { background: #ff3333; }
    @keyframes modalFade { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
   ` }} />
  </div>
 );
};

export default Transactions;
