import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Image as ImageIcon, Eye, X, CheckCircle, Activity, 
  Calendar as CalendarIcon, History, Download, AlertTriangle, MapPin
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function Alertes() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const nav = useNavigate();
  
  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    setLoading(true);
    api.get('/panneaux/detections/all')
      .then(res => {
        const anomaliesOnly = res.data.filter(d => d.panneau_status === 'anomalie');
        
        const formattedAlerts = anomaliesOnly.map(d => ({
          id: d.id,
          type: d.anomalie_type || 'Anomalie',
          ref: d.reference,
          loc: d.emplacement,
          dateObj: new Date(d.detected_at),
          time: new Date(d.detected_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
          conf: Math.round(d.confidence * 100),
          image: d.image_url,
          ack: d.is_acknowledged || false 
        }));
        setAlerts(formattedAlerts);
        if (formattedAlerts.length > 0) setSelectedAlert(formattedAlerts[0]);
      })
      .finally(() => setLoading(false));
  };

  const handleAcquitter = async (id) => {
    try {
      await api.put(`/panneaux/detections/${id}/acquitter`);
      const updated = alerts.map(a => a.id === id ? { ...a, ack: true } : a);
      setAlerts(updated);
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert({ ...selectedAlert, ack: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchSearch = a.type.toLowerCase().includes(search.toLowerCase()) || a.ref.toLowerCase().includes(search.toLowerCase());
    let matchStatus = true;
    if (filter === 'Non traitées') matchStatus = !a.ack;
    if (filter === 'Acquittées') matchStatus = a.ack;
    let matchDate = true;
    if (selectedDate) {
      matchDate = a.dateObj.toLocaleDateString('en-CA') === selectedDate.toLocaleDateString('en-CA');
    }
    return matchSearch && matchStatus && matchDate;
  });

  const exportToExcel = () => {
    if (filteredAlerts.length === 0) return alert("Ma kayna 7ta alerte!");
    const dataToExport = filteredAlerts.map(a => ({
      "Panneau": a.ref, "Type": a.type, "Emplacement": a.loc, "Date": a.dateObj.toLocaleDateString('fr-FR'), "Statut": a.ack ? 'Traitée' : 'Non traitée'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alertes");
    XLSX.writeFile(workbook, `Rapport_Alertes.xlsx`);
  };

  const total = alerts.length;
  const nonTraitees = alerts.filter(a => !a.ack).length;
  const traitees = alerts.filter(a => a.ack).length;

  const getColor = (conf) => conf >= 90 ? 'text-primary bg-primary/10 border-primary' : conf >= 75 ? 'text-warning bg-warning/10 border-warning' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
  const getStatusLabel = (conf) => conf >= 90 ? 'Critique' : conf >= 75 ? 'Attention' : 'A surveiller';

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0F0F12] overflow-hidden">
      
      {/* 1. L'Jneb l'isar (Liste dyal l'Alertes) */}
      <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1F] h-full">
        
        <div className="p-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Alertes</h1>
            <div className="flex gap-1">
               <button onClick={() => nav('/historique')} className="p-1.5 text-gray-500 hover:text-primary transition"><History size={18} /></button>
               <button onClick={exportToExcel} className="p-1.5 text-gray-500 hover:text-success transition"><Download size={18} /></button>
            </div>
          </div>
          
          <div className="flex gap-1 mb-3">
            {['Toutes', 'Non traitées', 'Acquittées'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all ${filter === f ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                {f} ({f === 'Toutes' ? total : f === 'Non traitées' ? nonTraitees : traitees})
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
            <div 
              key={alert.id} 
              onClick={() => setSelectedAlert(alert)}
              className={`p-3 rounded-lg cursor-pointer border transition-all ${
                selectedAlert?.id === alert.id 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
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
        </div>
      </div>

      {/* 2. L'Wst w l'Limn (Détails dyal l'Alerte) */}
      <div className="hidden lg:flex flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-[#0F0F12] p-6">
        
        {selectedAlert ? (
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
            
            {/* Header dyal l'Détails */}
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

            {/* L'Contenu: Tswira f l'isar, Ma3lomat f l'imen */}
            <div className="flex flex-col xl:flex-row gap-6">
              
              {/* L'Tsawira (M9ada) */}
              <div className="flex-1">
                <div 
                  className="w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden relative group cursor-pointer border border-gray-200 dark:border-white/10 shadow-lg"
                  onClick={() => setSelectedImage(selectedAlert.image)}
                >
                  {selectedAlert.image ? (
                    <>
                      <img src={selectedAlert.image} alt="Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <div className="bg-black/50 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="text-white" size={24} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={48} /></div>
                  )}
                </div>
              </div>

              {/* L'Ma3lomat w l'Action */}
              <div className="w-full xl:w-80 flex flex-col gap-4">
                
                {/* L'Khatarat (Risk Cards) */}
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
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Confiance de l'IA</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">{selectedAlert.conf}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getColor(selectedAlert.conf).split(' ')[1]}`} style={{ width: `${selectedAlert.conf}%` }}></div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Anomalie</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedAlert.type}</span>
                    </div>
                  </div>
                </div>

                {/* L'Emplacement */}
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-4 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-500"><MapPin size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Emplacement</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAlert.loc}</p>
                  </div>
                </div>

                {/* L'Bouton dyal l'Action */}
                <div className="mt-auto pt-2">
                  {!selectedAlert.ack ? (
                    <button onClick={() => handleAcquitter(selectedAlert.id)} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Marquer comme résolue
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-success/10 text-success border border-success/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Alerte traitée
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

      {/* Modal dyal l'tswira */}
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