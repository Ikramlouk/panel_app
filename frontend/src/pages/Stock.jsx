import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Edit, Trash2, X, Box, AlertTriangle } from 'lucide-react';

export default function Stock() {
  const [pieces, setPieces] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State dyal Formulaire
  const [newPiece, setNewPiece] = useState({
    id: null, reference: '', name: '', category: '', 
    stock_quantity: 0, min_quantity: 0, price: 0, location: 'Magasin Tanger'
  });

  useEffect(() => {
    fetchPieces();
  }, []);

  const fetchPieces = async () => {
    try {
      const res = await api.get('/stock');
      setPieces(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditMode) {
        await api.put(`/stock/${newPiece.id}`, newPiece);
      } else {
        await api.post('/stock', newPiece);
      }
      setShowModal(false);
      fetchPieces();
    } catch (err) { 
      // 🔥 Hna 9adna l'erreur bach t3tik l'message s7i7 mn l'BD
      setErrorMsg(err.response?.data?.error || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette pièce ?")) {
      try {
        await api.delete(`/stock/${id}`);
        fetchPieces();
      } catch (err) { alert("Erreur lors de la suppression"); }
    }
  };

  const openEdit = (piece) => {
    setIsEditMode(true);
    setNewPiece(piece);
    setShowModal(true);
  };

  const openAdd = () => {
    setIsEditMode(false);
    setNewPiece({ id: null, reference: '', name: '', category: '', stock_quantity: 0, min_quantity: 0, price: 0, location: 'Magasin Tanger' });
    setShowModal(true);
  };

  const getStockStatusColor = (current, min) => {
    if (current === 0) return 'bg-red-500';
    if (current < min) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const filteredPieces = pieces.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  // Calcul dyal l'Stats
  const totalValue = pieces.reduce((acc, p) => acc + (p.stock_quantity * p.price), 0);
  const lowStockCount = pieces.filter(p => p.stock_quantity < p.min_quantity).length;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Gestion des pièces</h1>
          <p className="text-sm text-gray-500 mt-1">Modules LED, alimentations et consommables : le stock se décrémente à chaque intervention</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md flex items-center gap-2">
          <Plus size={16}/> Nouvelle pièce
        </button>
      </div>

      {/* Alerte (Ila kayn l'pièces na9sin) */}
      {lowStockCount > 0 && (
        <div className="p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertTriangle size={18} /> {lowStockCount} pièces sont sous le seuil minimal : commander avant la prochaine intervention.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-4">
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Références en stock</p><p className="text-2xl font-black text-gray-900 dark:text-white">{pieces.length}</p></div>
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Valeur du stock</p><p className="text-2xl font-black text-gray-900 dark:text-white">{totalValue.toLocaleString()} MAD</p></div>
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sous le seuil minimal</p><p className="text-2xl font-black text-orange-500">{lowStockCount}</p></div>
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pièces consommées</p><p className="text-2xl font-black text-indigo-600">37</p></div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* L'Liste dyal l'Pièces */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-gray-100 dark:border-white/5">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une pièce..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-[#121216] text-gray-500 font-bold text-[10px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-3">Pièce</th>
                  <th className="px-6 py-3">Catégorie</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Emplacement</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredPieces.map(piece => (
                  <tr key={piece.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{piece.name}</p>
                      <p className="text-[10px] text-gray-500">{piece.reference}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{piece.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${piece.stock_quantity === 0 ? 'text-red-500' : piece.stock_quantity < piece.min_quantity ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>{piece.stock_quantity} unités</span>
                        <span className="text-[10px] text-gray-400">min. {piece.min_quantity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${getStockStatusColor(piece.stock_quantity, piece.min_quantity)}`} style={{ width: `${Math.min((piece.stock_quantity / (piece.min_quantity * 2)) * 100, 100)}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{piece.location}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEdit(piece)} className="p-2 text-gray-400 hover:text-blue-500 transition"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(piece.id)} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal dyal l'Ajout / l'Modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{isEditMode ? 'Modifier la pièce' : 'Nouvelle pièce'}</h2>
            
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Référence</label>
                  <input type="text" required value={newPiece.reference} onChange={e => setNewPiece({...newPiece, reference: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" placeholder="MOD-P10-320" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nom de la pièce</label>
                  <input type="text" required value={newPiece.name} onChange={e => setNewPiece({...newPiece, name: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" placeholder="Module LED P10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Catégorie</label>
                  {/* 🔥 Hna 9adna l'Catégorie: wllat Input Text bla liste */}
                  <input type="text" required value={newPiece.category} onChange={e => setNewPiece({...newPiece, category: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" placeholder="Ex: Modules LED..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Emplacement</label>
                  <select value={newPiece.location} onChange={e => setNewPiece({...newPiece, location: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                    <option value="Magasin Tanger">Magasin Tanger</option>
                    <option value="Magasin Casablanca">Magasin Casablanca</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Quantité en stock</label>
                  <input type="number" required value={newPiece.stock_quantity} onChange={e => setNewPiece({...newPiece, stock_quantity: parseInt(e.target.value)})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Seuil minimal</label>
                  <input type="number" required value={newPiece.min_quantity} onChange={e => setNewPiece({...newPiece, min_quantity: parseInt(e.target.value)})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Prix (MAD)</label>
                  <input type="number" required value={newPiece.price} onChange={e => setNewPiece({...newPiece, price: parseFloat(e.target.value)})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md">{isEditMode ? 'Enregistrer' : 'Créer la pièce'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}