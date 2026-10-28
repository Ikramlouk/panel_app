import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Image as ImageIcon, MapPin, CheckCircle, XCircle, Crosshair, Box } from 'lucide-react';
import api from '../services/api';

// Icônes dyal Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// CSS l l'Animation dyal l'Points (Pulse) w l'Effet 3D
const customCSS = `
  .pulse-marker {
    border-radius: 50%;
    box-shadow: 0 0 0 rgba(227, 6, 19, 0.4);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(227, 6, 19, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(227, 6, 19, 0); }
    100% { box-shadow: 0 0 0 0 rgba(227, 6, 19, 0); }
  }
  .leaflet-tile-pane {
    transition: transform 0.5s ease-in-out;
  }
  .leaflet-container {
    perspective: 1000px;
  }
  .leaflet-tile-container {
    transform-style: preserve-3d;
  }
  .map-tiles-dark .leaflet-tile-pane {
    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
  }
  .leaflet-popup-content-wrapper {
    background: white;
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }
  .dark .leaflet-popup-content-wrapper {
    background: #1A1A1F;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .leaflet-popup-content { margin: 0; }
  .leaflet-popup-tip { background: white; }
  .dark .leaflet-popup-tip { background: #1A1A1F; }
`;

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Composant bach n9ad l'effet dyal l'3D
function Map3DController({ is3D }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (is3D) {
      container.style.transform = 'rotateX(45deg) scale(1.1)';
      container.style.transformOrigin = 'center center';
    } else {
      container.style.transform = 'none';
    }
  }, [is3D, map]);
  return null;
}

export default function Carte() {
  const [sites, setSites] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [is3D, setIs3D] = useState(false);
  
  const [mapCenter, setMapCenter] = useState([31.7917, -7.0926]);
  const [mapZoom, setMapZoom] = useState(6);
  const nav = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = customCSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  // Jbed l'data w 3awd jbedha kol 5 secondes (Live Pulse)
  useEffect(() => {
    const fetchData = () => {
      api.get('/panneaux').then(res => {
        const validSites = res.data.filter(p => p.latitude && p.longitude).map(p => ({
          id: p.id,
          name: p.reference,
          coordinates: [p.latitude, p.longitude],
          status: p.status,
          loc: p.emplacement,
          latest_image: p.latest_image
        }));
        setSites(validSites);
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh kol 5s
    return () => clearInterval(interval);
  }, []);

  const total = sites.length;
  const anomalies = sites.filter(s => s.status === 'anomalie').length;
  const ok = total - anomalies;
  const percentOk = total > 0 ? Math.round((ok / total) * 100) : 0;

  const cityStats = sites.reduce((acc, site) => {
    const city = site.loc;
    if (!acc[city]) acc[city] = { total: 0, anomalies: 0 };
    acc[city].total += 1;
    if (site.status === 'anomalie') acc[city].anomalies += 1;
    return acc;
  }, {});

  const filteredSites = sites.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.loc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tous' ? true : (filter === 'Anomalie' ? s.status === 'anomalie' : s.status === 'ok');
    return matchSearch && matchFilter;
  });

  const handleCityClick = (cityName) => {
    const firstSite = sites.find(s => s.loc === cityName);
    if (firstSite) {
      setMapCenter(firstSite.coordinates);
      setMapZoom(12);
    }
  };

  const getColor = (status) => status === 'anomalie' ? '#E30613' : '#22C55E';

  const createCustomIcon = (status) => {
    const color = getColor(status);
    const pulseClass = status === 'anomalie' ? 'pulse-marker' : '';
    return L.divIcon({
      className: 'custom-icon',
      html: `<div class="${pulseClass}" style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0F0F12] transition-colors gap-4 p-4">
      
      {/* L'Khrita */}
      <div className="flex-1 relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg z-0" style={{ perspective: '1000px' }}>
        
        {/* L'Filtres (Floating) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row justify-between gap-3 pointer-events-none">
          <div className="relative w-full sm:w-80 pointer-events-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un panneau..." 
              className="w-full pl-11 pr-4 py-3 bg-white/90 dark:bg-[#1A1A1F]/90 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-2 pointer-events-auto bg-white/90 dark:bg-[#1A1A1F]/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10">
            {['Tous', 'Anomalie', 'OK'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-gray-900 dark:bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                {f}
              </button>
            ))}
            {/* Bouton dyal l'3D */}
            <button 
              onClick={() => setIs3D(!is3D)} 
              className={`ml-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1 ${is3D ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}
            >
              <Box size={14} /> 3D
            </button>
          </div>
        </div>

        {/* Légende */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-[#1A1A1F]/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-200 dark:border-white/10 flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <div className="w-3 h-3 rounded-full bg-success"></div> OK
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div> Anomalie
          </div>
        </div>

        {/* Boutons dyal l'Zoom */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <button onClick={() => setMapZoom(z => Math.min(z + 1, 18))} className="w-10 h-10 bg-white/90 dark:bg-[#1A1A1F]/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary transition-colors font-bold text-xl">+</button>
          <button onClick={() => setMapZoom(z => Math.max(z - 1, 4))} className="w-10 h-10 bg-white/90 dark:bg-[#1A1A1F]/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary transition-colors font-bold text-xl">-</button>
        </div>

        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <MapController center={mapCenter} zoom={mapZoom} />
          <Map3DController is3D={is3D} />
          <ZoomControl position="bottomleft" />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className={isDark ? 'map-tiles-dark' : ''} 
          />
          {filteredSites.map((site) => (
            <Marker 
              key={site.id} 
              position={site.coordinates} 
              icon={createCustomIcon(site.status)}
            >
              <Popup className="custom-popup">
                <div className="font-sans w-52">
                  {site.latest_image ? (
                    <img src={site.latest_image} alt="detection" className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-gray-100 dark:bg-black flex items-center justify-center"><ImageIcon className="text-gray-400" /></div>
                  )}
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{site.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${site.status === 'anomalie' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                        {site.status === 'anomalie' ? 'Anomalie' : 'OK'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><MapPin size={10} /> {site.loc}</p>
                    <button onClick={() => nav(`/panneaux/${site.id}`)} className="w-full py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-300 rounded-md text-[11px] font-bold transition-colors">
                      Voir les détails
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Panel dyal l'Statistiques (L'Jneb) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        
        {/* KPI Global */}
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Santé du Réseau</h2>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{percentOk}%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">Taux de disponibilité</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-success"><CheckCircle size={12} /> {ok} OK</div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-primary"><XCircle size={12} /> {anomalies} Anomalies</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: `${percentOk}%` }}></div>
          </div>
        </div>

        {/* Liste dyal l'Moudon */}
        <div className="flex-1 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sites Surveillés</h3>
            <span className="text-[10px] font-bold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{Object.keys(cityStats).length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {Object.entries(cityStats).map(([city, stats]) => (
              <div 
                key={city} 
                className="group bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] p-3 rounded-xl border border-gray-200 dark:border-white/5 transition-all flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{city}</p>
                      <p className="text-[10px] text-gray-500">{stats.total} panneaux</p>
                    </div>
                  </div>
                  
                  {stats.anomalies > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                      {stats.anomalies} anomalie{stats.anomalies > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 bg-success/10 text-success rounded-md border border-success/20">
                      Tout OK
                    </span>
                  )}
                </div>
                
                <button onClick={() => handleCityClick(city)} className="w-full mt-1 py-1.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1.5">
                  <Crosshair size={12} /> Zoom sur la ville
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}