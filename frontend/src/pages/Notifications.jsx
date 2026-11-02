import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertTriangle, ArrowLeft, X, Image as ImageIcon, CheckCheck, User } from 'lucide-react';
import api from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('Toutes'); // Toutes, Non lues, Lues
  const nav = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    api.get('/panneaux/detections/all')
      .then(res => {
        const alerts = res.data.filter(d => d.panneau_status === 'anomalie');
        
        const formatted = alerts.map(a => ({
          id: a.id,
          type: a.anomalie_type || 'Anomalie',
          ref: a.reference,
          loc: a.emplacement,
          time: new Date(a.detected_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
          conf: Math.round(a.confidence * 100),
          image: a.image_url,
          read: a.is_acknowledged || false,
          ackBy: a.acknowledged_by_name || 'Admin', // Smiyt li 7elha (jay mn l'Backend)
          ackAt: a.acknowledged_at ? new Date(a.acknowledged_at).toLocaleString('fr-FR') : null // Fo9ach 7elha
        }));
        setNotifications(formatted);
      })
      .finally(() => setLoading(false));
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/panneaux/detections/${id}/acquitter`);
      // N'updatiw l'notification b smiyt l'user w l'wa9t
      const user = JSON.parse(localStorage.getItem('user'));
      setNotifications(notifications.map(n => 
        n.id === id ? { 
          ...n, 
          read: true, 
          ackBy: user ? user.name : 'Admin', 
          ackAt: new Date().toLocaleString('fr-FR') 
        } : n
      ));
    } catch (error) {
      console.error(error);
    }
  };

  // L'Filtrage
  const filtered = notifications.filter(n => {
    if (filter === 'Non lues') return !n.read;
    if (filter === 'Lues') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // L'Couleurs 7asab l'Confidence
  const getColorConfig = (conf) => {
    if (conf >= 90) return { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <AlertTriangle size={18} /> };
    if (conf >= 75) return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: <AlertTriangle size={18} /> };
    return { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <AlertTriangle size={18} /> };
  };

  if (loading) return <div className="p-10 flex justify-center"><CheckCheck className="animate-spin text-primary" size={32}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F12] p-6 md:p-8 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/alertes')} className="p-2.5 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl hover:text-primary transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} non lues</span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Restez informé des dernières anomalies détectées</p>
          </div>
        </div>
      </div>

      {/* L'Filtres */}
      <div className="flex gap-2 mb-6 bg-white dark:bg-[#1A1A1F] p-1.5 rounded-2xl border border-gray-200 dark:border-white/10 w-fit shadow-sm">
        {['Toutes', 'Non lues', 'Lues'].map((f) => (
          <button 
            key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === f 
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* L'Liste dyal l'Notifications */}
      <div className="space-y-4 max-w-5xl">
        {filtered.map((n) => {
          const colors = getColorConfig(n.conf);
          return (
            <div 
              key={n.id} 
              className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 bg-white dark:bg-[#1A1A1F] border rounded-2xl shadow-sm transition-all ${
                n.read ? 'border-gray-200 dark:border-white/5 opacity-70' : 'border-primary/30 dark:border-primary/30'
              }`}
            >
              {/* L'Tsawira */}
              <div 
                className="w-full sm:w-32 h-20 bg-black rounded-xl overflow-hidden shrink-0 cursor-pointer group border border-gray-100 dark:border-white/10"
                onClick={() => n.image && setSelectedImage(n.image)}
              >
                {n.image ? (
                  <img src={n.image} alt="capture" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={20} /></div>
                )}
              </div>

              {/* L'Ma3lomat */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${n.read ? 'bg-gray-100 dark:bg-white/5 text-gray-400' : colors.bg + ' ' + colors.text}`}>
                      {n.read ? <CheckCircle size={16} /> : colors.icon}
                    </div>
                    <h3 className={`font-bold text-sm ${n.read ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {n.type} sur {n.ref}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">{n.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">{n.loc} · Confiance: {n.conf}%</p>
              </div>

              {/* L'Action w l'Traçabilité */}
              <div className="flex flex-col items-end justify-center mt-2 sm:mt-0 w-full sm:w-auto">
                {!n.read ? (
                  <button 
                    onClick={() => handleMarkAsRead(n.id)} 
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Marquer comme lu
                  </button>
                ) : (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-success mb-1">
                      <CheckCircle size={14} /> Lue
                    </div>
                    {/* HNA KATBAN L'TRAÇABILITÉ */}
                    {n.ackAt && (
                      <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                        <User size={10} /> Par <span className="font-bold text-gray-500">{n.ackBy}</span> le {n.ackAt}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/10">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">Aucune notification</p>
            <p className="text-sm text-gray-500">Tout est sous contrôle.</p>
          </div>
        )}
      </div>

      {/* Modal dyal l'tswira */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full bg-white dark:bg-[#1A1A1F] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-gray-900 dark:text-white">Capture YOLO</h3>
              <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 transition"><X size={20} /></button>
            </div>
            <img src={selectedImage} alt="YOLO" className="w-full h-auto max-h-[70vh] object-contain bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}