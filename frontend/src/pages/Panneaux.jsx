import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Image as ImageIcon, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';

const statusStyle = { ok: 'bg-success/10 text-success', anomalie: 'bg-primary/10 text-primary' };
const statusIcon = { ok: <CheckCircle size={14} className="mr-1" />, anomalie: <XCircle size={14} className="mr-1" /> };
const statusLabel = { ok: 'OK', anomalie: 'Anomalie' };

export default function Panneaux() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); 
  const nav = useNavigate();

  useEffect(() => {
    api.get('/panneaux').then((r) => setList(r.data)).catch(() => nav('/'));
  }, [nav]);

  const filtered = list.filter((p) => {
    const matchSearch = p.reference.toLowerCase().includes(q.toLowerCase()) || (p.emplacement || '').toLowerCase().includes(q.toLowerCase());
    const matchFilter = filter === 'all' ? true : p.status === filter;
    return matchSearch && matchFilter;
  });

  const total = list.length;
  const countOk = list.filter(p => p.status === 'ok').length;
  const countAnomalie = list.filter(p => p.status === 'anomalie').length;

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Panneaux</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} panneaux supervisés</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition">
          <RefreshCw size={18} /> Actualiser
        </button>
      </div>

      {/* Cartes dyal l'Stats (Daba wllat clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Carte Total */}
        <div 
          onClick={() => setFilter('all')}
          className={`bg-white dark:bg-[#1A1A1F] border-2 rounded-xl p-5 shadow-sm transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
            filter === 'all' ? 'border-primary ring-1 ring-primary/50' : 'border-gray-200 dark:border-white/10'
          }`}
        >
          <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total</p>
        </div>

        {/* Carte OK */}
        <div 
          onClick={() => setFilter('ok')}
          className={`bg-white dark:bg-[#1A1A1F] border-2 rounded-xl p-5 shadow-sm transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
            filter === 'ok' ? 'border-success ring-1 ring-success/50' : 'border-gray-200 dark:border-white/10'
          }`}
        >
          <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{countOk}</p>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-success"></div> OK
          </div>
        </div>

        {/* Carte Anomalie */}
        <div 
          onClick={() => setFilter('anomalie')}
          className={`bg-white dark:bg-[#1A1A1F] border-2 rounded-xl p-5 shadow-sm transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
            filter === 'anomalie' ? 'border-primary ring-1 ring-primary/50' : 'border-gray-200 dark:border-white/10'
          }`}
        >
          <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{countAnomalie}</p>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div> Anomalie
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par référence..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white transition-colors" />
        </div>
        <div className="flex gap-2">
          {['all', 'ok', 'anomalie'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-gray-900 dark:bg-primary text-white' : 'bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
              {f === 'all' ? 'Tous' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Panneau</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Statut</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Dernière détection</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Capture</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {filtered.map((p) => (
              <tr key={p.id} onClick={() => nav(`/panneaux/${p.id}`)} className="hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer group">
                <td className="px-6 py-4 relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${p.status === 'ok' ? 'bg-success' : 'bg-primary'}`}></div>
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition">{p.reference}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.emplacement}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[p.status]}`}>{statusIcon[p.status]} {statusLabel[p.status]}</span>
                </td>
                
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                  {p.latest_time 
                    ? new Date(p.latest_time).toLocaleString('fr-FR') 
                    : 'Aucune détection'}
                </td>
                
                <td className="px-6 py-4">
                  {p.latest_image ? (
                    <div className="w-12 h-10 bg-black rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                      <img src={p.latest_image} alt="capture" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-gray-600 dark:text-white">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 text-right text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition"><ChevronRight size={20} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}