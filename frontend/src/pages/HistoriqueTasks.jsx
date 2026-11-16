import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { 
  Search, Download, CheckCircle, Clock, AlertTriangle, 
  ChevronLeft, ChevronRight, User, Calendar
} from 'lucide-react';

export default function HistoriqueTasks() {
  const [archives, setArchives] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        const res = await api.get('/maintenance/archives');
        setArchives(res.data);
        if (res.data.length > 0) setSelectedTask(res.data[0]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchArchives();
  }, []);

  const handleExport = () => {
    if (archives.length === 0) return alert("Aucune donnée à exporter");
    const data = archives.map(t => ({
      "ID": `T-${t.id}`, "Panneau": t.panneau_ref, "Technicien": t.technicien_name || '—',
      "Statut": t.status, "Clôturée le": new Date(t.completed_at).toLocaleString('fr-FR')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historique");
    XLSX.writeFile(wb, `Historique_Taches_${new Date().toLocaleDateString('fr-FR')}.xlsx`);
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '—';
    const diff = Math.abs(new Date(end) - new Date(start)) / 36e5;
    return diff < 24 ? `${diff.toFixed(1)} h` : `${(diff / 24).toFixed(1)} j`;
  };

  const filtered = archives.filter(t => 
    t.panneau_ref?.toLowerCase().includes(search.toLowerCase()) || 
    t.technicien_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col gap-6 h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Historique des tâches</h1>
          <p className="text-sm text-gray-500 mt-1">Toutes les interventions liées aux anomalies détectées sur les panneaux</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md flex items-center gap-2">
          <Download size={16} /> Exporter l'historique
        </button>
      </div>

      {/* Stats l'fo9 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tâches clôturées', value: archives.length, sub: 'Ce mois-ci', color: 'text-green-600' },
          { label: 'En cours', value: archives.filter(t => t.status === 'En cours').length, sub: 'Techniciens sur site', color: 'text-indigo-600' },
          { label: 'En retard', value: 3, sub: 'À traiter en priorité', color: 'text-red-600' },
          { label: 'Durée moyenne', value: '3 h 12', sub: 'Détection — clôture', color: 'text-gray-900' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color} dark:text-white`}>{stat.value}</p>
            <p className={`text-xs font-bold mt-1 ${stat.color}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* Tableau (L'isar) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
          
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une tâche, un panneau..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none" />
            </div>
            <select className="px-3 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-lg text-sm"><option>Statut : Tous</option></select>
            <select className="px-3 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-lg text-sm"><option>Technicien : Tous</option></select>
            <select className="px-3 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-lg text-sm"><option>Période : 30 jours</option></select>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-[#121216] text-gray-500 font-bold text-[10px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-3">Tâche</th>
                  <th className="px-4 py-3">Panneau</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Technicien</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Ouverte le</th>
                  <th className="px-4 py-3">Clôturée le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map(task => (
                  <tr key={task.id} onClick={() => setSelectedTask(task)} className={`cursor-pointer transition ${selectedTask?.id === task.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <td className="px-4 py-4"><p className="font-bold text-indigo-600">T-{task.id}</p></td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{task.panneau_ref}</td>
                    <td className="px-4 py-4"><span className="text-red-500 font-medium">{task.description}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">{task.technicien_name?.substring(0,2).toUpperCase() || 'NA'}</div>
                        <span className="text-gray-600 dark:text-gray-300">{task.technicien_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">{task.status}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{new Date(task.created_at).toLocaleString('fr-FR', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                    <td className="px-4 py-4 text-gray-500">{new Date(task.completed_at).toLocaleString('fr-FR', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center text-xs text-gray-500">
            <span>1 – {filtered.length} sur {filtered.length} tâches</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">Précédent</button>
              <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg">Suivant</button>
            </div>
          </div>
        </div>

        {/* Détails (L'imen) */}
        {selectedTask && (
          <div className="w-[380px] flex flex-col bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tâche T-{selectedTask.id}</h2>
                <p className="text-sm text-gray-500">{selectedTask.panneau_ref}</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">Clôturée</span>
            </div>

            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <div className="w-full h-40 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-xs text-gray-400">
                [Dernière capture traitée (aperçu)]
              </div>
            </div>

            <div className="p-6 flex-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Chronologie</h3>
              <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-2 space-y-6">
                <div className="relative pl-6">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Anomalie détectée par le modèle</p>
                  <p className="text-[10px] text-gray-500">14 nov. 09:12 · Capture de 09:10</p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Alerte envoyée au responsable</p>
                  <p className="text-[10px] text-gray-500">14 nov. 09:12</p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Affectée à {selectedTask.technicien_name || 'Technicien'}</p>
                  <p className="text-[10px] text-gray-500">14 nov. 09:25</p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Marquée comme résolue</p>
                  <p className="text-[10px] text-gray-500">{new Date(selectedTask.completed_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs font-bold">
                Durée totale : {calculateDuration(selectedTask.created_at, selectedTask.completed_at)} · Panneau de nouveau conforme
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}