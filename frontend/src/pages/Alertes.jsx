import { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, XCircle, Eye, X } from 'lucide-react';
import api from '../services/api';

export default function Alertes() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  useEffect(() => {
    api.get('/panneaux/detections/all')
      .then(res => {
        // 🛑 HNA L'7AL: Nkhelo GHIR li fihom status = 'anomalie'
        const anomaliesOnly = res.data.filter(d => d.panneau_status === 'anomalie');
        
        const formattedAlerts = anomaliesOnly.map(d => ({
          id: d.id,
          type: d.anomalie_type || 'Anomalie', // Ila kan khawi, goul Anomalie
          status: 'Anomalie', // Daba dima Anomalie 7it m7iyedna l'avertissement
          ref: d.reference,
          loc: d.emplacement,
          time: new Date(d.detected_at).toLocaleString('fr-FR'),
          conf: Math.round(d.confidence * 100),
          image: d.image_url,
          ack: false 
        }));
        setAlerts(formattedAlerts);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAcquitter = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, ack: true, status: 'Acquittée' } : a));
  };

  const filteredAlerts = alerts.filter(a => {
    const matchSearch = a.type.toLowerCase().includes(search.toLowerCase()) || a.ref.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Toutes') return matchSearch;
    if (filter === 'Anomalie') return matchSearch && a.status === 'Anomalie';
    return matchSearch;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Alertes</h1>
        <p className="text-gray-500 dark:text-gray-400">Chaque anomalie détectée par YOLO</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white" 
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Toutes', 'Anomalie'].map((f) => (
            <button 
              key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f ? 'bg-gray-900 dark:bg-primary text-white' : 'bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Chargement...</p> 
          ) : filteredAlerts.length === 0 ? (
            <p className="text-gray-500">Aucune anomalie trouvée.</p>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className={`bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4 ${alert.ack ? 'border-l-gray-400 opacity-70' : 'border-l-primary'}`}>
                
                <div className="relative w-28 h-20 bg-gray-100 dark:bg-black rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-white/10">
                  {alert.image ? (
                     <img src={alert.image} alt="detection" className="w-full h-full object-cover" />
                  ) : (
                     <ImageIcon size={24} className="text-gray-400" />
                  )}
                  <span className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded text-white bg-primary">
                    {alert.conf} %
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{alert.type}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${alert.ack ? 'bg-gray-500/20 text-gray-500' : 'bg-primary/10 text-primary'}`}>
                      {alert.ack ? 'ACQUITTÉE' : alert.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{alert.ref}</span> · {alert.loc} · <span className="text-xs text-gray-500">{alert.time}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
                  <button onClick={() => setSelectedImage(alert.image)} className="p-2 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition" title="Voir l'image">
                    <Eye size={18} />
                  </button>
                  {!alert.ack ? (
                    <button onClick={() => handleAcquitter(alert.id)} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-red-700 transition">
                      Acquitter
                    </button>
                  ) : (
                    <button disabled className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-400 rounded-lg cursor-not-allowed">
                      Traitée
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl w-full bg-white dark:bg-[#1A1A1F] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Capture YOLO</h3>
                <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 transition">
                  <X size={20} />
                </button>
              </div>
              <img src={selectedImage} alt="YOLO Detection" className="w-full h-auto max-h-[70vh] object-contain bg-black" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}