import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

export default function Historique() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const nav = useNavigate();

  useEffect(() => {
    api.get('/panneaux/detections/all')
      .then(res => {
        // Hna kanfiltriw bach njibdo GHIR l'anomalies (machi OK)
        const anomaliesOnly = res.data.filter(d => d.panneau_status === 'anomalie');
        
        const formatted = anomaliesOnly.map(d => ({
          id: d.id,
          type: d.anomalie_type || 'Anomalie', // Ila kan khawi, goul Anomalie
          ref: d.reference,
          loc: d.emplacement,
          dateObj: new Date(d.detected_at),
          time: new Date(d.detected_at).toLocaleString('fr-FR'),
          image: d.image_url,
          status: 'Anomalie' // Daba dima Anomalie f l'historique
        }));
        setAlerts(formatted);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredByMonth = alerts.filter(a => {
    const alertMonth = a.dateObj.toISOString().slice(0, 7);
    return alertMonth === month;
  });

  return (
    <div className="p-6 bg-gray-50 dark:bg-[#0F0F12] min-h-screen transition-colors">
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/alertes')} className="p-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Historique des Alertes</h1>
            <p className="text-sm text-gray-500 mt-1">Consultez les anomalies passées</p>
          </div>
        </div>

        <div className="relative bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Panneau</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Type d'anomalie</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Capture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredByMonth.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-gray-900 dark:text-white">{a.time}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white text-xs">{a.ref}</p>
                  <p className="text-[10px] text-gray-500">{a.loc}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{a.type}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {a.image ? (
                    <img src={a.image} alt="cap" className="w-12 h-8 object-cover rounded border border-gray-200 dark:border-white/10 mx-auto" />
                  ) : '—'}
                </td>
              </tr>
            ))}
            {filteredByMonth.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-12 text-gray-500">
                  Aucun historique trouvé pour ce mois.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}