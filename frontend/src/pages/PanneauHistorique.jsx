import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, MapPin, Activity, X, Filter, Calendar as CalendarIcon, Download, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function PanneauHistorique() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState([]);
  const [panneau, setPanneau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [filterType, setFilterType] = useState('Toutes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/panneaux/${id}`),
      api.get('/panneaux/detections/all')
    ]).then(([resPanneau, resDetections]) => {
      setPanneau(resPanneau.data.panneau);
      const history = resDetections.data.filter(d => d.panneau_id === parseInt(id) && d.panneau_status === 'anomalie');
      history.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
      setData(history);
    }).finally(() => setLoading(false));
  }, [id]);

  const filteredData = data.filter(item => {
    const itemDate = new Date(item.detected_at).toISOString().split('T')[0];
    let matchType = filterType === 'Toutes' ? true : item.anomalie_type === filterType;
    let matchStart = startDate ? itemDate >= startDate : true;
    let matchEnd = endDate ? itemDate <= endDate : true;
    return matchType && matchStart && matchEnd;
  });

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Aucune donnée à exporter.");
    const dataToExport = filteredData.map(d => ({
      "Date": new Date(d.detected_at).toLocaleDateString('fr-FR'),
      "Heure": new Date(d.detected_at).toLocaleTimeString('fr-FR'),
      "Type d'anomalie": d.anomalie_type,
      "Confiance": `${Math.round(d.confidence * 100)}%`
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");
    XLSX.writeFile(workbook, `Historique_${panneau?.reference}.xlsx`);
  };

  if (loading) return <div className="p-10 text-center flex justify-center"><Activity className="animate-spin text-primary" size={32}/></div>;

  // L'Tsawira l'akhira w l'Statistiques
  const latestImage = data.length > 0 ? data[0].image_url : null;
  const totalAnomalies = data.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F12] p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/historique')} className="p-2.5 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl hover:text-primary transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              {panneau?.reference}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 font-medium">
              <MapPin size={14} /> {panneau?.emplacement}
            </p>
          </div>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-success text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition shadow-lg shadow-success/20">
          <Download size={18} /> Exporter Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* L'Jneb l'isar: L'Tsawira w l'Stats */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* L'Tsawira l'akhira */}
          <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl p-4 border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Dernière Capture</h2>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative group cursor-pointer" onClick={() => latestImage && setSelectedImage(latestImage)}>
              {latestImage ? (
                <>
                  <img src={latestImage} alt="Dernière capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={32} /></div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm flex flex-col justify-center items-center py-8">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl mb-4">
              <Activity size={32} />
            </div>
            <h3 className="text-5xl font-black text-gray-900 dark:text-white mb-2">{totalAnomalies}</h3>
            <p className="text-sm font-medium text-gray-500">Anomalies Totales Détectées</p>
          </div>

        </div>

        {/* L'Jneb limen: L'Historique (Timeline) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Filtres */}
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-4 border border-gray-200 dark:border-white/5 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none text-gray-900 dark:text-white cursor-pointer appearance-none">
                <option value="Toutes">Toutes les classes</option>
                <option value="Lines">Lines</option>
                <option value="Dark Spot">Dark Spot</option>
                <option value="cable issues">Cable Issues</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl">
              <CalendarIcon size={16} className="text-gray-400" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none" />
              <span className="text-gray-400 text-sm">au</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
          </div>

          {/* L'Liste (Timeline) */}
          <div className="flex-1 space-y-4">
            {filteredData.map((d) => (
              <div key={d.id} className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-sm hover:shadow-md transition-shadow group">
                
                {/* L'Tsawira Sghira */}
                <div 
                  className="w-full sm:w-32 h-20 bg-gray-100 dark:bg-black rounded-xl overflow-hidden cursor-pointer shrink-0 border border-gray-200 dark:border-white/10"
                  onClick={() => setSelectedImage(d.image_url)}
                >
                  {d.image_url ? (
                    <img src={d.image_url} alt="Capture" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
                  )}
                </div>

                {/* L'Ma3lomat */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase mb-2">
                        {d.anomalie_type || 'Inconnue'}
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        {new Date(d.detected_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">Confiance</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{Math.round(d.confidence * 100)}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    Détecté à {new Date(d.detected_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

              </div>
            ))}
            {filteredData.length === 0 && (
              <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-10 text-center text-gray-500">
                <Info size={32} className="mx-auto mb-3 opacity-20" />
                <p>Aucune anomalie trouvée avec ces filtres.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal dyal l'tswira */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full bg-white dark:bg-[#1A1A1F] rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Détail de la capture</h3>
              <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-500 transition"><X size={20} /></button>
            </div>
            <img src={selectedImage} alt="YOLO" className="w-full h-auto max-h-[75vh] object-contain bg-black" />
          </div>
        </div>
      )}

    </div>
  );
}