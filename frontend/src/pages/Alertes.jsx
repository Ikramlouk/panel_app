import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Image as ImageIcon, Eye, X, CheckCircle, Activity, 
  Calendar as CalendarIcon, History, Download, AlertTriangle, MapPin, Plus, User, Clock
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function Alertes() {
  const [activeTab, setActiveTab] = useState('AI'); 
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [panneaux, setPanneaux] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlertData, setNewAlertData] = useState({ panneau_id: '', anomalie_type: 'Lines', description: '', image: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nav = useNavigate();
  
  useEffect(() => {
    fetchAlerts();
    api.get('/panneaux').then(res => setPanneaux(res.data));
  }, []);

  const fetchAlerts = () => {
    setLoading(true);
    api.get('/panneaux/detections/all')
      .then(res => {
        const anomaliesOnly = res.data.filter(d => d.panneau_status === 'anomalie');
        
        const formattedAlerts = anomaliesOnly.map(d => ({
          id: d.id,
          type: d.anomalie_type || 'Anomalie',
          description: d.description || null,
          ref: d.reference,
          loc: d.emplacement,
          dateObj: new Date(d.detected_at),
          time: new Date(d.detected_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
          conf: Math.round(d.confidence * 100),
          image: d.image_url,
          ack: d.is_acknowledged || false,
          by: d.acknowledged_by_name || null,
          source: d.source || 'AI',
          createdBy: d.created_by_name || 'Système (IA)' // Chkoun zadha
        }));
        setAlerts(formattedAlerts);
      })
      .finally(() => setLoading(false));
  };

    const handleAcquitter = async (id) => {
    try {
      await api.put(`/panneaux/detections/${id}/acquitter`);
      
      // 1. Nbedelo l'alerte f l'ecran
      const updatedAlerts = alerts.map(a => a.id === id ? { ...a, ack: true } : a);
      setAlerts(updatedAlerts);
      
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert({ ...selectedAlert, ack: true });
      }

      // 2. 3awd jbed l'data dyal l'panneaux bach l'Dashboard w l'Carte yt-updataw
      // (Hadi ghir bach n'akdo bli l'statut tbedel)
      
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleAddManualAlert = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('panneau_id', newAlertData.panneau_id);
    formData.append('anomalie_type', newAlertData.anomalie_type === 'Autre' ? newAlertData.description : newAlertData.anomalie_type);
    formData.append('description', newAlertData.description);
    if (newAlertData.image) formData.append('image', newAlertData.image);

    try {
      await api.post('/panneaux/detections/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAddModal(false);
      setNewAlertData({ panneau_id: '', anomalie_type: 'Lines', description: '', image: null });
      fetchAlerts(); 
    } catch (err) {
      alert("Erreur lors de l'ajout de l'alerte");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (a.source !== activeTab) return false;
    const matchSearch = a.type.toLowerCase().includes(search.toLowerCase()) || a.ref.toLowerCase().includes(search.toLowerCase());
    let matchStatus = true;
    if (filter === 'Non traitées') matchStatus = !a.ack;
    if (filter === 'Acquittées') matchStatus = a.ack;
    let matchDate = true;
    if (selectedDate) matchDate = a.dateObj.toLocaleDateString('en-CA') === selectedDate.toLocaleDateString('en-CA');
    return matchSearch && matchStatus && matchDate;
  });

  const exportToExcel = () => {
    const dataToExport = filteredAlerts.map(a => ({
      "Panneau": a.ref, "Type": a.type, "Emplacement": a.loc, "Date": a.dateObj.toLocaleDateString('fr-FR'), "Statut": a.ack ? 'Traitée' : 'Non traitée', "Par": a.by || '—', "Créé par": a.createdBy
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alertes");
    XLSX.writeFile(workbook, `Rapport_Alertes_${activeTab}.xlsx`);
  };

  const getColor = (conf) => conf >= 90 ? 'text-primary bg-primary/10 border-primary' : conf >= 75 ? 'text-warning bg-warning/10 border-warning' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
  const getStatusLabel = (conf) => conf >= 90 ? 'Critique' : conf >= 75 ? 'Attention' : 'A surveiller';

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0F0F12] overflow-hidden">
      
      {/* L'Jneb l'isar (Liste) */}
      <div className="w-full lg:w-[400px] flex flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1F] h-full">
        
        <div className="p-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Alertes</h1>
            <div className="flex gap-2">
               <button onClick={() => nav('/historique')} className="p-2 text-gray-500 hover:text-primary transition"><History size={18} /></button>
               <button onClick={exportToExcel} className="p-2 text-gray-500 hover:text-success transition"><Download size={18} /></button>
            </div>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl mb-3">
            <button onClick={() => { setActiveTab('AI'); setSelectedAlert(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'AI' ? 'bg-white dark:bg-[#2A2A2F] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              Détections YOLO
            </button>
            <button onClick={() => { setActiveTab('MANUAL'); setSelectedAlert(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'MANUAL' ? 'bg-white dark:bg-[#2A2A2F] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              Signalements Manuels
            </button>
          </div>

          {activeTab === 'MANUAL' && (
            <button onClick={() => setShowAddModal(true)} className="w-full mb-3 flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-red-700 transition">
              <Plus size={16} /> Nouveau Signalement
            </button>
          )}
          
          <div className="flex gap-1 mb-3">
            {['Toutes', 'Non traitées', 'Acquittées'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all ${filter === f ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-7 pr-2 py-1.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-md text-xs focus:outline-none" />
             </div>
             <DatePicker selected={selectedDate} onChange={setSelectedDate} placeholderText="Date" className="w-20 px-2 py-1.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-md text-xs text-center" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} onClick={() => setSelectedAlert(alert)} className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedAlert?.id === alert.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}>
              <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-gray-900 dark:text-white text-xs">{alert.ref}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getColor(alert.conf)}`}>{getStatusLabel(alert.conf)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>{alert.type}</span>
                <span>{alert.time}</span>
              </div>
            </div>
          ))}
          {filteredAlerts.length === 0 && <p className="text-center text-xs text-gray-500 py-10">Aucune alerte.</p>}
        </div>
      </div>

      {/* L'Jneb limen (Détails) */}
      <div className="hidden lg:flex flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-[#0F0F12] p-6">
        
        {selectedAlert ? (
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
            
            <div className="flex justify-between items-start bg-white dark:bg-[#1A1A1F] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Détail de l'alerte</p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  {selectedAlert.ref}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getColor(selectedAlert.conf)}`}>{getStatusLabel(selectedAlert.conf)}</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date de détection</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAlert.time}</p>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex-1">
                <div className="w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden relative group cursor-pointer border border-gray-200 dark:border-white/10 shadow-lg" onClick={() => setSelectedImage(selectedAlert.image)}>
                  {selectedAlert.image ? (
                    <>
                      <img src={selectedAlert.image} alt="Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <div className="bg-black/50 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="text-white" size={24} /></div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={48} /></div>
                  )}
                </div>
              </div>

              <div className="w-full xl:w-80 flex flex-col gap-4">
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className={`p-4 border-b ${getColor(selectedAlert.conf)}`}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={24} />
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-80">Niveau de risque</p>
                        <p className="text-lg font-black">{getStatusLabel(selectedAlert.conf)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Confiance</span><span className="text-sm font-black">{selectedAlert.conf}%</span></div>
                    <div className="pt-2 border-t flex justify-between items-center"><span className="text-xs text-gray-500">Anomalie</span><span className="text-sm font-bold">{selectedAlert.type}</span></div>
                    {selectedAlert.description && (
                      <div className="pt-2 border-t">
                        <span className="text-xs text-gray-500 block mb-1">Description</span>
                        <p className="text-sm">{selectedAlert.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-4 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-500"><MapPin size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Emplacement</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAlert.loc}</p>
                  </div>
                </div>

                {/* 🔥 L'PARTIE JDIDA: TRACABILITÉ (Chkoun zadha w fo9ach) */}
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-4 flex flex-col gap-3">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500"><User size={16} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Signalé par</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAlert.createdBy}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500"><Clock size={16} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date du signalement</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAlert.time}</p>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-2">
                  {!selectedAlert.ack ? (
                    <button onClick={() => handleAcquitter(selectedAlert.id)} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Marquer comme résolue
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-success/10 text-success border border-success/20 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-2"><CheckCircle size={18} /> Alerte traitée</div>
                      {selectedAlert.by && <span className="text-[10px] font-normal opacity-80">Par {selectedAlert.by}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Sélectionnez une alerte pour voir les détails</div>
        )}
      </div>

      {/* MODAL: Ajouter une anomalie manuellement */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Signaler une Anomalie</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-primary"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddManualAlert} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Panneau concerné</label>
                <select required value={newAlertData.panneau_id} onChange={e => setNewAlertData({...newAlertData, panneau_id: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                  <option value="">-- Choisir un panneau --</option>
                  {panneaux.map(p => <option key={p.id} value={p.id}>{p.reference} - {p.emplacement}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Type d'anomalie</label>
                <select required value={newAlertData.anomalie_type} onChange={e => setNewAlertData({...newAlertData, anomalie_type: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                  <option value="Lines">Lines</option>
                  <option value="Dark Spot">Dark Spot</option>
                  <option value="cable issues">Cable Issues</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {newAlertData.anomalie_type === 'Autre' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Préciser l'anomalie</label>
                  <input type="text" required value={newAlertData.description} onChange={e => setNewAlertData({...newAlertData, description: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" placeholder="Ex: Écran fissuré" />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Capture d'écran (Optionnel)</label>
                <div className="mt-1 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-4 text-center">
                  <input type="file" accept="image/*" onChange={e => setNewAlertData({...newAlertData, image: e.target.files[0]})} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition cursor-pointer" />
                </div>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-red-700 transition">
                {isSubmitting ? 'Envoi...' : 'Signaler l\'anomalie'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal dyal l'tswira kbira */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-6xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"><X size={24} /></button>
            <img src={selectedImage} alt="YOLO Detection" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}