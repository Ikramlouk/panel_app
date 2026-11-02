import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { ArrowLeft, MapPin, Activity, AlertTriangle, CheckCircle, ShieldCheck, Image as ImageIcon, Filter, Calendar, Eye, X } from 'lucide-react';
import api from '../services/api';

export default function PanneauStatistiques() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState([]);
  const [panneau, setPanneau] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // State l l'Modal

  useEffect(() => {
    Promise.all([
      api.get(`/panneaux/${id}`),
      api.get('/panneaux/detections/all')
    ]).then(([resPanneau, resDetections]) => {
      setPanneau(resPanneau.data.panneau);
      const history = resDetections.data.filter(d => d.panneau_id === parseInt(id));
      history.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
      setData(history);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 flex justify-center"><Activity className="animate-spin text-primary" size={32}/></div>;

  // --- L'Filtrage ---
  const filteredData = data.filter(d => {
    const itemDate = new Date(d.detected_at).toISOString().split('T')[0];
    let matchStart = startDate ? itemDate >= startDate : true;
    let matchEnd = endDate ? itemDate <= endDate : true;
    return matchStart && matchEnd;
  });

  const anomaliesOnly = filteredData.filter(d => d.panneau_status === 'anomalie' && d.anomalie_type);
  const totalAnomalies = anomaliesOnly.length;
  const isOk = totalAnomalies === 0;

  // L'Couleurs
  const COLORS = ['#E30613', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  // --- DATA GRAPHIQUES ---
  // 1. Types dyal l'Anomalies
  const typeCounts = anomaliesOnly.reduce((acc, curr) => {
    acc[curr.anomalie_type] = (acc[curr.anomalie_type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.keys(typeCounts).map((key, index) => ({ name: key, value: typeCounts[key], color: COLORS[index % COLORS.length] }));

  // 2. Tendance (Evolution dyal l'Confiance)
  const trendData = filteredData.slice(0, 10).reverse().map(d => ({
    date: new Date(d.detected_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    confiance: Math.round(d.confidence * 100)
  }));

  // 3. Répartition (Jour/Nuit wla Types)
  const pieData = [
    { name: 'Détections', value: filteredData.length - totalAnomalies, color: '#22C55E' },
    { name: 'Anomalies', value: totalAnomalies, color: '#E30613' }
  ];

  const theme = isOk 
    ? { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success', icon: <ShieldCheck size={32} />, label: 'Panneau Opérationnel' }
    : { bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary', icon: <AlertTriangle size={32} />, label: 'Panneau en Anomalie' };

  return (
    <div className={`min-h-screen ${theme.bg} p-6 md:p-8 transition-colors`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/stats')} className="p-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              {panneau?.reference}
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${theme.bg} ${theme.text} border ${theme.border}`}>{theme.label}</span>
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {panneau?.emplacement}</p>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
          {theme.icon}
        </div>
      </div>

      {/* L'Filtres */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-4 shadow-sm mb-6 w-fit">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm"><Filter size={16} /> Filtrer :</div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#121216] px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10">
          <Calendar size={16} className="text-gray-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-gray-900 dark:text-white outline-none cursor-pointer" />
          <span className="text-gray-400 text-sm">au</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-gray-900 dark:text-white outline-none cursor-pointer" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Détections</p>
          <h3 className="text-4xl font-black text-gray-900 dark:text-white mt-2">{filteredData.length}</h3>
        </div>
        <div className={`bg-white dark:bg-[#1A1A1F] border rounded-2xl p-6 shadow-sm ${isOk ? 'border-success/30' : 'border-primary/30'}`}>
          <p className="text-sm font-medium text-gray-500">Anomalies</p>
          <h3 className={`text-4xl font-black mt-2 ${theme.text}`}>{totalAnomalies}</h3>
        </div>
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Dernière Activité</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-3">{filteredData.length > 0 ? new Date(filteredData[0].detected_at).toLocaleDateString('fr-FR') : 'Aucune'}</h3>
        </div>
      </div>

      {/* 3 dyal l'Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Graphique 1: Répartition (Pie) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Répartition Globale</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-1 text-xs font-bold text-success"><div className="w-2 h-2 rounded-full bg-success"></div> Normales</div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary"><div className="w-2 h-2 rounded-full bg-primary"></div> Anomalies</div>
          </div>
        </div>

        {/* Graphique 2: Types dyal l'Anomalies (Bar) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Types d'Anomalies</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 3: Tendance dyal l'Confiance (Line) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Tendance Confiance</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="confiance" stroke={theme.text.includes('primary') ? '#E30613' : '#22C55E'} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* L'Historique (b l'icône dyal l'3in) */}
      <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-white/5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Dernières Captures</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {filteredData.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="w-16 h-12 bg-black rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                {a.image_url ? <img src={a.image_url} alt="cap" className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-500"><ImageIcon size={16}/></div>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{a.anomalie_type || 'Normal'}</p>
                <p className="text-xs text-gray-500">{new Date(a.detected_at).toLocaleString('fr-FR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedImage(a.image_url)} className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 transition" title="Voir l'image">
                  <Eye size={16} />
                </button>
                {a.anomalie_type && <span className={`text-xs font-bold px-2 py-1 rounded-md ${theme.bg} ${theme.text}`}>{Math.round(a.confidence * 100)}%</span>}
              </div>
            </div>
          ))}
        </div>
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