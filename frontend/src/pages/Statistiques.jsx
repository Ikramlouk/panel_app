import { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Download, Calendar } from 'lucide-react';

// --- MOCK DATA (Ghadi n-rbtouha m3a l'API mn b3d) ---
const dataEvolution = [
  { name: 'Lun', ok: 40, anomalies: 2 },
  { name: 'Mar', ok: 45, anomalies: 5 },
  { name: 'Mer', ok: 50, anomalies: 3 },
  { name: 'Jeu', ok: 48, anomalies: 8 },
  { name: 'Ven', ok: 55, anomalies: 1 },
  { name: 'Sam', ok: 60, anomalies: 4 },
  { name: 'Dim', ok: 58, anomalies: 2 },
];

const dataAnomalies = [
  { name: 'Lines', value: 45, color: '#E30613' },
  { name: 'Dark Spot', value: 30, color: '#F59E0B' },
  { name: 'Cable issues', value: 25, color: '#3B82F6' },
];

const dataCities = [
  { name: 'Casablanca', anomalies: 12 },
  { name: 'Tanger', anomalies: 8 },
  { name: 'Fès', anomalies: 5 },
  { name: 'Nador', anomalies: 3 },
  { name: 'Oujda', anomalies: 2 },
];
// ---------------------------------------------------

export default function Statistiques() {
  const [timeRange, setTimeRange] = useState('7j');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistiques & Analyses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble des performances et des anomalies</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-lg p-1">
            {['24h', '7j', '30j'].map((range) => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${timeRange === range ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-sm">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de disponibilité</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">94.2%</h3>
            </div>
            <div className="p-3 bg-success/10 rounded-lg text-success"><CheckCircle size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success">
            <TrendingUp size={16} className="mr-1" /> +2.4% <span className="text-gray-400 ml-2 font-normal">vs. semaine dernière</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Détections</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">1,284</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Activity size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-500">
            <TrendingUp size={16} className="mr-1" /> +12% <span className="text-gray-400 ml-2 font-normal">ce mois</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anomalies Actives</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">18</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><AlertTriangle size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary">
            <TrendingUp size={16} className="mr-1" /> -5% <span className="text-gray-400 ml-2 font-normal">en cours de traitement</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites Surveillés</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">6</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Calendar size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white mr-2">18 Panneaux</span> au total
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique d'évolution (Line/Area) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Évolution des Détections</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success"></div> OK</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div> Anomalies</div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAno" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E30613" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E30613" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1F', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="ok" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorOk)" />
                <Area type="monotone" dataKey="anomalies" stroke="#E30613" strokeWidth={2} fillOpacity={1} fill="url(#colorAno)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique Pie (Répartition) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Types d'Anomalies</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Répartition par catégorie</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataAnomalies}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataAnomalies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1F', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {dataAnomalies.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Section Bas (Top Sites & Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart (Top Villes) */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Sites (Anomalies)</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCities} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1A1A1F', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="anomalies" fill="#E30613" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Résumé Système */}
        <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Santé du Système</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Modèle YOLO</span>
                  <span className="font-medium text-success">Opérationnel</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Connexion Base de Données</span>
                  <span className="font-medium text-success">Stable</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Temps de réponse moyen</span>
                  <span className="font-medium text-warning">1.2s</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 dark:bg-[#121216] rounded-xl border border-gray-200 dark:border-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Dernière mise à jour : Aujourd'hui à 14:30
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}