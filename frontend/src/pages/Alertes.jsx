import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Image as ImageIcon, Eye, X, CheckCircle, Activity, Filter, Calendar as CalendarIcon, History, Download } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function Alertes() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('Toutes');
  const [filterType, setFilterType] = useState('Toutes'); // State dyal l'Classes
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
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
          time: new Date(d.detected_at).toLocaleString('fr-FR'),
          conf: Math.round(d.confidence * 100),
          image: d.image_url,
          ack: d.is_acknowledged || false 
        }));
        setAlerts(formattedAlerts);
      })
      .finally(() => setLoading(false));
  };

  const handleAcquitter = async (id) => {
    try {
      await api.put(`/panneaux/detections/${id}/acquitter`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, ack: true } : a));
    } catch (error) {
      console.error("Erreur lors de l'acquittement", error);
    }
  };

  // L'Filtrage (Recherche + Status + Classes + Date)
  const filteredAlerts = alerts.filter(a => {
    const matchSearch = a.type.toLowerCase().includes(search.toLowerCase()) || a.ref.toLowerCase().includes(search.toLowerCase());
    
    let matchStatus = true;
    if (filter === 'Non traitées') matchStatus = !a.ack;
    if (filter === 'Acquittées') matchStatus = a.ack;

    // Filtre dyal l'Classes
    let matchType = true;
    if (filterType !== 'Toutes') {
      matchType = a.type === filterType;
    }

    // Filtre dyal l'Date (b l'Calendrier)
    let matchDate = true;
    if (selectedDate) {
      const alertDate = a.dateObj.toLocaleDateString('en-CA'); 
      const filterDate = selectedDate.toLocaleDateString('en-CA');
      matchDate = alertDate === filterDate;
    }

    return matchSearch && matchStatus && matchType && matchDate;
  });

  // L'Export dyal l'Excel
  const exportToExcel = () => {
    if (filteredAlerts.length === 0) {
      alert("Ma kayna 7ta alerte bach tsiftha!");
      return;
    }

    const dataToExport = filteredAlerts.map(a => ({
      "Panneau (Reference)": a.ref,
      "Type d'anomalie": a.type,
      "Emplacement": a.loc,
      "Date de détection": a.dateObj.toLocaleDateString('fr-FR'),
      "Heure": a.dateObj.toLocaleTimeString('fr-FR'),
      "Confiance (%)": `${a.conf}%`,
      "Statut": a.ack ? 'Traitée' : 'Non traitée'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alertes");
    XLSX.writeFile(workbook, `Rapport_Alertes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const total = alerts.length;
  const nonTraitees = alerts.filter(a => !a.ack).length;
  const traitees = alerts.filter(a => a.ack).length;
  
  const typeCounts = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0F0F12] transition-colors p-4 gap-6">
      
      {/* Header & Filtres */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Alertes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Chaque anomalie détectée par YOLO</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => nav('/historique')}
              className="flex items-center gap-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition shadow-sm"
            >
              <History size={16} /> Historique
            </button>

            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition shadow-sm"
            >
              <Download size={16} /> Exporter Excel
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A1A1F] p-3 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)} 
              placeholder="Rechercher..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white transition-colors" 
            />
          </div>
          
          {/* L'Calendrier */}
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Filtrer par date"
              isClearable
              className="pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white transition-colors cursor-pointer w-40"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          {/* L'Filtre dyal l'Classes (Dropdown) */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-gray-900 dark:text-white cursor-pointer appearance-none"
            >
              <option value="Toutes">Toutes les classes</option>
              <option value="Lines">Lines</option>
              <option value="Dark Spot">Dark Spot</option>
              <option value="cable issues">Cable Issues</option>
              <option value="Screen">Screen</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-[#121216] p-1 rounded-xl">
            {['Toutes', 'Non traitées', 'Acquittées'].map((f) => (
              <button 
                key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-white dark:bg-[#2A2A2F] text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout: Grille (Lisar) + Stats (Limen) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* L'Grille dyal l'Alertes */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center py-20"><Activity className="animate-spin text-primary" size={32} /></div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <CheckCircle size={48} className="text-success/30 mb-4" />
              <p className="text-lg font-bold">Aucune alerte trouvée</p>
              <p className="text-sm">Essayez de modifier vos filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className={`group relative bg-white dark:bg-[#1A1A1F] border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${alert.ack ? 'border-gray-200 dark:border-white/5 opacity-60' : 'border-primary/20 dark:border-primary/30'}`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${alert.ack ? 'bg-gray-400' : 'bg-primary'}`}></div>

                  <div className="relative h-36 bg-gray-100 dark:bg-black overflow-hidden">
                    {alert.image ? (
                      <>
                        <img src={alert.image} alt="detection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={32} /></div>
                    )}
                    
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md text-white shadow-sm ${alert.conf > 90 ? 'bg-primary' : 'bg-warning'}`}>
                        {alert.conf} %
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-lg drop-shadow-md flex items-center gap-2">{alert.type}</h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Panneau</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{alert.ref}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">{alert.loc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{alert.time.split(' ')[0]}</p>
                        <p className="text-[10px] text-gray-500">{alert.time.split(' ')[1]}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      <button onClick={() => setSelectedImage(alert.image)} className="flex-1 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center gap-1.5"><Eye size={14} /> Voir</button>
                      {!alert.ack ? (
                        <button onClick={() => handleAcquitter(alert.id)} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm">Acquitter</button>
                      ) : (
                        <button disabled className="flex-1 py-2 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"><CheckCircle size={14} /> Traitée</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Panel (L'Jneb) */}
        <div className="w-full lg:w-72 flex flex-col gap-4 flex-shrink-0">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Résumé</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1"><span className="text-xs text-gray-500 font-medium">Total Alertes</span><span className="text-lg font-black text-gray-900 dark:text-white">{total}</span></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1"><span className="text-xs text-gray-500 font-medium">Non traitées</span><span className="text-lg font-black text-primary">{nonTraitees}</span></div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${total > 0 ? (nonTraitees/total)*100 : 0}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1"><span className="text-xs text-gray-500 font-medium">Acquittées</span><span className="text-lg font-black text-success">{traitees}</span></div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: `${total > 0 ? (traitees/total)*100 : 0}%` }}></div></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm flex-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Filter size={14} className="text-primary" /> Par Type</h2>
            <div className="space-y-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div><span className="text-xs font-medium text-gray-700 dark:text-gray-300">{type}</span></div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
              {Object.keys(typeCounts).length === 0 && <p className="text-xs text-gray-500 text-center py-4">Aucune donnée</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal dyal l'tswira */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full bg-white dark:bg-[#1A1A1F] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Capture YOLO</h3>
              <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 transition"><X size={20} /></button>
            </div>
            <img src={selectedImage} alt="YOLO Detection" className="w-full h-auto max-h-[70vh] object-contain bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}