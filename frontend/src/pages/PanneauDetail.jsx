import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

export default function PanneauDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/panneaux/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">Chargement...</div>;

  const { panneau, detection } = data;
  const statusColor = panneau.status === 'anomalie' ? 'text-primary' : panneau.status === 'warning' ? 'text-warning' : 'text-success';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] text-gray-900 dark:text-white p-6 md:p-10 transition-colors duration-300">
      
      {/* Bouton Retour w Mode */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary transition">
          <ArrowLeft size={18} /> Retour
        </button>
        <ThemeToggle />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Kolon liser: Infos */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors">
          <h2 className="text-2xl font-bold mb-1">{panneau.reference}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{panneau.emplacement}</p>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Type</span><span>{panneau.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Statut</span><span className={`font-bold ${statusColor}`}>{panneau.status.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Dernière vérif.</span><span>{new Date(panneau.last_check || Date.now()).toLocaleDateString()}</span></div>
            {detection && (
              <>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Anomalie</span><span>{detection.anomalie_type || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Confiance</span><span>{(detection.confidence * 100).toFixed(1)}%</span></div>
              </>
            )}
          </div>
        </div>

        {/* Kolon limen: Image YOLO */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="text-primary" size={20} />
            <h3 className="font-bold">Dernière capture YOLO</h3>
          </div>
          <div className="aspect-video bg-gray-100 dark:bg-black rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 transition-colors">
            {detection?.image_url ? (
              <img src={detection.image_url} alt="detection" className="w-full h-full object-contain" />
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">Aucune image de détection</p>
            )}
          </div>
          {detection && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Capturée le {new Date(detection.detected_at).toLocaleString('fr-FR')}</p>
          )}
        </div>
        
      </div>
    </div>
  );
}