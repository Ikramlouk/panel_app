import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Activity, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function Historique() {
  const [panneaux, setPanneaux] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous'); // Tous, Avec anomalie, Sans anomalie
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/panneaux'),
      api.get('/panneaux/detections/all')
    ]).then(([resP, resD]) => {
      const listP = resP.data;
      const listD = resD.data;

      const panneauxWithCount = listP.map(p => {
        const countAnomalies = listD.filter(d => d.panneau_id === p.id && d.panneau_status === 'anomalie').length;
        return { ...p, anomaliesCount: countAnomalies };
      });

      panneauxWithCount.sort((a, b) => b.anomaliesCount - a.anomaliesCount);
      setPanneaux(panneauxWithCount);
    }).finally(() => setLoading(false));
  }, []);

  // Statistiques l l'KPI Cards
  const totalPanneaux = panneaux.length;
  const panneauxAvecAnomalies = panneaux.filter(p => p.anomaliesCount > 0).length;
  const totalDetections = panneaux.reduce((sum, p) => sum + p.anomaliesCount, 0);
  
  // L'Max l l'Progress Bar
  const maxAnomalies = Math.max(...panneaux.map(p => p.anomaliesCount), 1);

  const filteredPanneaux = panneaux.filter(p => {
    const matchSearch = p.reference.toLowerCase().includes(search.toLowerCase()) || 
                        (p.emplacement || '').toLowerCase().includes(search.toLowerCase());
    
    let matchFilter = true;
    if (filter === 'Avec anomalie') matchFilter = p.anomaliesCount > 0;
    if (filter === 'Sans anomalie') matchFilter = p.anomaliesCount === 0;

    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] p-6 md:p-8 transition-colors">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => nav('/alertes')} className="p-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl hover:text-primary transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Historique des anomalies</h1>
          <p className="text-sm text-gray-500 mt-1">Classement des panneaux par fréquence d'anomalies</p>
        </div>
      </div>

      {/* KPI Cards (L'fo9) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Panneaux Suivis</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{totalPanneaux}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avec Anomalies</p>
          <p className="text-3xl font-black text-primary">{panneauxAvecAnomalies}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Détections Cumulées</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{totalDetections}</p>
        </div>
      </div>

      {/* L'Filtres */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un panneau..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 bg-white dark:bg-[#1A1A1F] p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          {['Tous', 'Avec anomalie', 'Sans anomalie'].map((f) => (
            <button 
              key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* L'Tableau / Liste */}
      <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider w-16">Statut</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Panneau</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Emplacement</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider w-64">Fréquence d'anomalies</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Chargement...</td></tr>
              ) : filteredPanneaux.map((p) => {
                const hasAnomaly = p.anomaliesCount > 0;
                const percent = (p.anomaliesCount / maxAnomalies) * 100;
                
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => nav(`/historique/${p.id}`)} 
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* L'Statut (Point) */}
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${hasAnomaly ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                        {hasAnomaly ? 'L' : 'N'}
                      </div>
                    </td>

                    {/* L'Panneau */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-sm">{p.reference}</p>
                    </td>

                    {/* L'Emplacement */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {p.emplacement}</span>
                    </td>

                    {/* L'Fréquence (Badge + Barre) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md w-24 text-center ${hasAnomaly ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                          {p.anomaliesCount} détections
                        </span>
                        <div className="w-full max-w-[120px] h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${hasAnomaly ? 'bg-primary' : 'bg-success/30'}`} 
                            style={{ width: `${hasAnomaly ? percent : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* L'Bouton Voir */}
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors flex items-center gap-1 ml-auto">
                        Voir <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}