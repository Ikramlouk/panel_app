import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Bach n9dro ncliquiw l détails
import api from '../services/api';

// N9ado l'icônes dyal Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant bach n7erko l'khrita l blassa m3ayna
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function Carte() {
  const [sites, setSites] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(false);
  
  // State bach n7erko l'khrita
  const [mapCenter, setMapCenter] = useState([31.7917, -7.0926]);
  const [mapZoom, setMapZoom] = useState(6);
  const nav = useNavigate();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.get('/panneaux').then(res => {
      const validSites = res.data.filter(p => p.latitude && p.longitude).map(p => ({
        id: p.id,
        name: p.reference,
        coordinates: [p.latitude, p.longitude],
        count: 1, 
        status: p.status,
        text: p.status === 'ok' ? 'Tout OK' : 'Anomalie',
        loc: p.emplacement,
        latest_image: p.latest_image // Nzido l'tswira
      }));
      setSites(validSites);
    });
  }, []);

  // Mli tcliqui 3la site f l'jneb, n7erko l'khrita lih
  const handleSiteClick = (site) => {
    setMapCenter(site.coordinates);
    setMapZoom(12); // Zoom 3la l'panneau
  };

  const getColor = (status) => {
    if (status === 'anomalie') return '#E30613';
    return '#22C55E';
  };

  // Custom Icon sghir w n9i (douar b loun)
  const createCustomIcon = (status) => {
    const color = getColor(status);
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const filteredSites = sites.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.loc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tous' ? true : s.text.toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Carte des panneaux</h1>
        <p className="text-gray-500 dark:text-gray-400">Visualisez l'état de chaque site d'un coup d'œil</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input 
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un site..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white relative z-10"
          />
        </div>
        <div className="flex gap-2">
          {['Tous', 'Anomalie', 'OK'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f ? 'bg-gray-900 dark:bg-primary text-white' : 'bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[600px]">
        {/* L'Carte */}
        <div className="col-span-2 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl relative overflow-hidden z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className={isDark ? 'map-tiles-dark' : ''} 
            />
            
            {filteredSites.map((site) => (
              <Marker key={site.id} position={site.coordinates} icon={createCustomIcon(site.status)}>
                <Popup className="custom-popup">
                  <div className="font-sans w-48">
                    {/* Tswira dyal akhir détection */}
                    {site.latest_image ? (
                      <img src={site.latest_image} alt="detection" className="w-full h-24 object-cover rounded-t-lg mb-2" />
                    ) : (
                      <div className="w-full h-24 bg-gray-200 flex items-center justify-center rounded-t-lg mb-2">
                        <ImageIcon className="text-gray-400" />
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm">{site.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{site.loc}</p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${site.status === 'anomalie' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {site.text}
                      </span>
                      <button 
                        onClick={() => nav(`/panneaux/${site.id}`)} 
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Détails
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Listes dyal l'jneb (Clickable daba) */}
        <div className="col-span-1 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 overflow-y-auto">
          <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Par site</h2>
          <div className="space-y-4">
            {filteredSites.map((site) => (
              <div 
                key={site.id} 
                onClick={() => handleSiteClick(site)} // Mli tcliqui, l'khrita katmchi lih
                className="bg-gray-50 dark:bg-[#121216] p-4 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col gap-2 transition-all hover:border-primary/50 cursor-pointer group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition">{site.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${site.status === 'anomalie' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'}`}>
                    {site.text}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{site.loc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}