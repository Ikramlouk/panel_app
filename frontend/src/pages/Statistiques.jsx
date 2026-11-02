import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, ChevronRight, MapPin, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function Statistiques() {
  const [panneaux, setPanneaux] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/panneaux'),
      api.get('/panneaux/detections/all')
    ]).then(([resP, resD]) => {
      setPanneaux(resP.data);
      setDetections(resD.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Activity className="animate-spin text-primary" size={32}/></div>;

  // --- FILTRAGE ---
  const filteredDetections = detections.filter(d => {
    const date = new Date(d.detected_at);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const anomaliesOnly = filteredDetections.filter(d => d.panneau_status === 'anomalie');
  const totalAnomalies = anomaliesOnly.length;
  
  const totalPanneaux = panneaux.length; 
  const panneauxOk = panneaux.filter(p => p.status === 'ok').length;
  const tauxDispo = totalPanneaux > 0 ? Math.round((panneauxOk / totalPanneaux) * 100) : 0;

  // --- DATA PIE (Types) ---
  const typeCounts = anomaliesOnly.reduce((acc, curr) => {
    const type = curr.anomalie_type || 'Inconnu';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));

  // --- DATA DONUT (Villes) ---
  const cityCounts = anomaliesOnly.reduce((acc, curr) => {
    const city = curr.emplacement || 'Inconnu';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});
  const cityData = Object.keys(cityCounts).map(key => ({ name: key, value: cityCounts[key] })).sort((a, b) => b.value - a.value);

  // --- DATA EVOLUTION ---
  const evolutionData = [
    { name: 'Sem 1', anom: Math.floor(totalAnomalies * 0.2) }, 
    { name: 'Sem 2', anom: Math.floor(totalAnomalies * 0.4) },
    { name: 'Sem 3', anom: Math.floor(totalAnomalies * 0.3) },
    { name: 'Sem 4', anom: Math.floor(totalAnomalies * 0.1) },
  ];

  // --- EXPORT EXCEL ---
  const exportToExcel = () => {
    const statsData = [
      { "Indicateur": "Total Panneaux", "Valeur": totalPanneaux },
      { "Indicateur": "Panneaux OK", "Valeur": panneauxOk },
      { "Indicateur": "Taux de disponibilité", "Valeur": `${tauxDispo}%` },
      { "Indicateur": "Total Détections (Mois)", "Valeur": filteredDetections.length },
      { "Indicateur": "Total Anomalies (Mois)", "Valeur": totalAnomalies },
    ];

    const detectionsData = filteredDetections.map(d => ({
      "Panneau": d.reference,
      "Emplacement": d.emplacement,
      "Type": d.anomalie_type || 'Normal',
      "Date": new Date(d.detected_at).toLocaleDateString('fr-FR'),
      "Confiance": `${Math.round(d.confidence * 100)}%`
    }));

    const wb = XLSX.utils.book_new();
    const wsStats = XLSX.utils.json_to_sheet(statsData);
    const wsDetections = XLSX.utils.json_to_sheet(detectionsData);

    XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");
    XLSX.utils.book_append_sheet(wb, wsDetections, "Détections");

    XLSX.writeFile(wb, `Rapport_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] p-6 md:p-8 transition-colors">
      
      {/* Header & Filtres */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Vue d'ensemble</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Analyse des performances pour la période sélectionnée</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 shadow-sm">
            <Filter size={16} className="text-gray-400" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer">
              {monthNames.map((m, i) => <option key={i} value={i} className="dark:bg-[#1A1A1F]">{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer">
              <option value="2026" className="dark:bg-[#1A1A1F]">2026</option>
              <option value="2025" className="dark:bg-[#1A1A1F]">2025</option>
            </select>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-gray-900 dark:bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-red-700 transition shadow-sm">
            <Download size={16} /> Exporter Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start"><p className="text-sm font-medium text-gray-500">Disponibilité</p><div className="p-2 bg-success/10 rounded-lg text-success"><CheckCircle size={18} /></div></div>
          <div className="mt-4 flex items-end justify-between"><h3 className="text-4xl font-black text-gray-900 dark:text-white">{tauxDispo}%</h3><span className="flex items-center text-xs font-bold text-success"><TrendingUp size={14} className="mr-1"/> +2.4%</span></div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start"><p className="text-sm font-medium text-gray-500">Détections</p><div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Activity size={18} /></div></div>
          <div className="mt-4 flex items-end justify-between"><h3 className="text-4xl font-black text-gray-900 dark:text-white">{filteredDetections.length}</h3><span className="flex items-center text-xs font-bold text-blue-500"><TrendingUp size={14} className="mr-1"/> +12%</span></div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start"><p className="text-sm font-medium text-gray-500">Anomalies</p><div className="p-2 bg-primary/10 rounded-lg text-primary"><AlertTriangle size={18} /></div></div>
          <div className="mt-4 flex items-end justify-between"><h3 className="text-4xl font-black text-primary">{totalAnomalies}</h3><span className="flex items-center text-xs font-bold text-primary"><TrendingUp size={14} className="mr-1"/> +5%</span></div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start"><p className="text-sm font-medium text-gray-500">Panneaux</p><div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><CheckCircle size={18} /></div></div>
          <div className="mt-4 flex items-end justify-between"><h3 className="text-4xl font-black text-gray-900 dark:text-white">{totalPanneaux}</h3><span className="flex items-center text-xs font-bold text-gray-500">100%</span></div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">Évolution des Anomalies ({monthNames[selectedMonth]})</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorAnom" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E30613" stopOpacity={0.2}/><stop offset="95%" stopColor="#E30613" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="anom" stroke="#E30613" strokeWidth={3} fillOpacity={1} fill="url(#colorAnom)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Types) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Types d'Anomalies</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#E30613' : index === 1 ? '#F59E0B' : '#3B82F6'} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: index === 0 ? '#E30613' : index === 1 ? '#F59E0B' : '#3B82F6' }}></div><span className="text-gray-600 dark:text-gray-400">{item.name}</span></div><span className="font-bold text-gray-900 dark:text-white">{item.value}</span></div>
            ))}
            {pieData.length === 0 && <p className="text-xs text-center text-gray-500">Aucune anomalie ce mois</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Donut Chart (Villes) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">Anomalies par Ville</h2>
          <div className="flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cityData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {cityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#E30613', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-3 mt-4">
              {cityData.map((item, index) => {
                const total = cityData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = Math.round((item.value / total) * 100);
                return (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#E30613', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'][index % 5] }}></div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{percent}%</span>
                  </div>
                );
              })}
              {cityData.length === 0 && <p className="text-xs text-center text-gray-500">Aucune donnée</p>}
            </div>
          </div>
        </div>

        {/* Liste dyal l'Panneaux */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-white/5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Détails par Panneau</h2>
            <p className="text-xs text-gray-500 mt-1">Cliquez pour voir les détails</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px]">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {panneaux.map((p) => {
                  const pAnomalies = anomaliesOnly.filter(a => a.panneau_id === p.id).length;
                  return (
                    <tr key={p.id} onClick={() => nav(`/statistiques/${p.id}`)} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="px-5 py-3 font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-xs">{p.reference}</td>
                      <td className="px-5 py-3 text-gray-500 text-[10px]"><span className="flex items-center gap-1"><MapPin size={10} /> {p.emplacement}</span></td>
                      <td className="px-5 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pAnomalies > 0 ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>{pAnomalies}</span></td>
                      <td className="px-5 py-3 text-right"><ChevronRight size={14} className="text-gray-400 ml-auto" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}