import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Image as ImageIcon, ChevronRight, RefreshCw, Zap, MapPin, Activity, Clock, LayoutDashboard, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// L'Icones dyal Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

const statusStyle = { 
  ok: 'bg-success/10 text-success border border-success/20', 
  anomalie: 'bg-primary/10 text-primary border border-primary/20' 
};
const statusIcon = { 
  ok: <CheckCircle size={14} className="mr-1.5" />, 
  anomalie: <XCircle size={14} className="mr-1.5" /> 
};
const statusLabel = { ok: 'OK', anomalie: 'Anomalie' };

export default function Panneaux() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [isDark, setIsDark] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [mapCenter, setMapCenter] = useState([31.7917, -7.0926]);
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedSite, setSelectedSite] = useState(null);
  const markerRefs = useRef({});

  const nav = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  // Jbed l'data w 3awd jbedha kol 10 secondes
  useEffect(() => {
    const fetchData = () => {
      api.get('/panneaux').then((r) => setList(r.data)).catch(() => nav('/'));
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    
    return () => clearInterval(interval);
  }, [nav]);

  const filtered = list.filter((p) => {
    const matchSearch = p.reference.toLowerCase().includes(q.toLowerCase()) || (p.emplacement || '').toLowerCase().includes(q.toLowerCase());
    const matchFilter = filter === 'all' ? true : p.status === filter;
    return matchSearch && matchFilter;
  });

  const total = list.length;
  const countOk = list.filter(p => p.status === 'ok').length;
  const countAnomalie = list.filter(p => p.status === 'anomalie').length;
  const mapSites = filtered.filter(p => p.latitude && p.longitude);

  const handleRowClick = (p) => {
    if (p.latitude && p.longitude) {
      setMapCenter([p.latitude, p.longitude]);
      setMapZoom(14); 
      setSelectedSite(p);
      
      setTimeout(() => {
        if (markerRefs.current[p.id]) {
          markerRefs.current[p.id].openPopup();
        }
      }, 1500); 
    }
  };

  const getColor = (status) => status === 'anomalie' ? '#E30613' : '#22C55E';

  const createCustomIcon = (status) => {
    const color = getColor(status);
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0F0F12] transition-colors">
      
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center mb-6 bg-white dark:bg-[#1A1A1F] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            Tableau de Bord <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md uppercase">Live</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mt-1">
            <Zap size={12} className="text-warning" /> Supervision en temps réel de {total} panneaux
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5">
            <Clock size={14} className="text-primary" />
            {currentTime.toLocaleTimeString('fr-FR')} · {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          <button className="flex items-center gap-2 bg-gray-900 dark:bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-red-700 transition shadow-lg">
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
        <div onClick={() => setFilter('all')} className={`cursor-pointer bg-white dark:bg-[#1A1A1F] border rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-1 ${filter === 'all' ? 'border-gray-900 dark:border-white ring-1 ring-gray-900 dark:ring-white' : 'border-gray-200 dark:border-white/10'}`}>
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Panneaux</p>
               <p className="text-4xl font-black text-gray-900 dark:text-white">{total}</p>
             </div>
             <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500"><Activity size={20} /></div>
           </div>
        </div>
        <div onClick={() => setFilter('ok')} className={`cursor-pointer bg-white dark:bg-[#1A1A1F] border rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-1 ${filter === 'ok' ? 'border-success ring-1 ring-success' : 'border-gray-200 dark:border-white/10'}`}>
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-bold text-success uppercase tracking-widest mb-1">Panneaux OK</p>
               <p className="text-4xl font-black text-gray-900 dark:text-white">{countOk}</p>
             </div>
             <div className="p-2 bg-success/10 rounded-lg text-success"><CheckCircle size={20} /></div>
           </div>
        </div>
        <div onClick={() => setFilter('anomalie')} className={`cursor-pointer bg-white dark:bg-[#1A1A1F] border rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-1 ${filter === 'anomalie' ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-white/10'}`}>
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Anomalies</p>
               <p className="text-4xl font-black text-gray-900 dark:text-white">{countAnomalie}</p>
             </div>
             <div className="p-2 bg-primary/10 rounded-lg text-primary"><XCircle size={20} /></div>
           </div>
        </div>
      </div>

      {/* Layout (Tableau l'isar, Carte l'imen) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-4">
        
        {/* Tableau */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/50 dark:bg-black/10">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white transition-colors" />
             </div>
             <div className="flex gap-1 bg-gray-100 dark:bg-[#121216] p-1 rounded-lg">
                {['all', 'ok', 'anomalie'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${filter === f ? 'bg-white dark:bg-[#2A2A2F] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                    {f === 'all' ? 'Tous' : statusLabel[f]}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Panneau</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Statut</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Dernière Détection</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => handleRowClick(p)} 
                    className={`hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group ${selectedSite?.id === p.id ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  >
                    <td className="px-5 py-3 relative">
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md ${p.status === 'ok' ? 'bg-success' : 'bg-primary'}`}></div>
                      <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-sm">{p.reference}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {p.emplacement}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${statusStyle[p.status]}`}>
                        {statusIcon[p.status]} {statusLabel[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {p.latest_time ? new Date(p.latest_time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded text-[11px] font-semibold text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-colors">
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                   <tr><td colSpan="4" className="text-center py-10 text-gray-500">Aucun panneau trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Carte */}
        <div className="flex-1 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-black/10">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Carte Interactive
            </h2>
            <span className="text-[11px] font-medium text-gray-500 bg-white dark:bg-[#121216] px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">{mapSites.length} localisés</span>
          </div>
          <div className="flex-1 relative z-0">
            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className={isDark ? 'map-tiles-dark' : ''} 
              />
              {mapSites.map((site) => (
                <Marker 
                  key={site.id} 
                  position={[site.latitude, site.longitude]} 
                  icon={createCustomIcon(site.status)}
                  ref={(ref) => { if (ref) markerRefs.current[site.id] = ref; }}
                >
                  <Popup className="custom-popup">
                    <div className="font-sans w-48">
                      {site.latest_image ? (
                        <img src={site.latest_image} alt="detection" className="w-full h-24 object-cover rounded-t-lg mb-2" />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded-t-lg mb-2"><ImageIcon className="text-gray-400" /></div>
                      )}
                      <h3 className="font-bold text-gray-900 text-sm">{site.reference}</h3>
                      <p className="text-xs text-gray-500 mb-2">{site.emplacement}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${site.status === 'anomalie' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {statusLabel[site.status]}
                        </span>
                        <button onClick={() => nav(`/panneaux/${site.id}`)} className="text-[10px] font-bold text-primary hover:underline">
                          Détails
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}