import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx'; // <-- Import dyal Excel
import { Plus, Search, Calendar, User, X, AlertTriangle } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [panneaux, setPanneaux] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ panneau_id: '', technicien_id: '', description: '', priority: 'Moyenne', due_date: '' });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchTechniciens();
    fetchPanneaux();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/maintenance');
      setTasks(res.data);
      if (res.data.length > 0 && !selectedTask) setSelectedTask(res.data[0]);
    } catch (err) { console.error(err); }
  };

  const fetchTechniciens = async () => {
    try {
      const res = await api.get('/users');
      setTechniciens(res.data.filter(u => u.role === 'technicien'));
    } catch (err) { console.error(err); }
  };

  const fetchPanneaux = async () => {
    try {
      const res = await api.get('/panneaux');
      setPanneaux(res.data);
    } catch (err) { console.error(err); }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Haute') return 'bg-red-50 text-red-600 border-red-100';
    if (priority === 'Moyenne') return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/maintenance', newTask);
      setShowAddModal(false);
      setNewTask({ panneau_id: '', technicien_id: '', description: '', priority: 'Moyenne', due_date: '' });
      fetchTasks();
    } catch (err) { 
      setErrorMsg(err.response?.data?.error || "Erreur lors de l'ajout de l'intervention");
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    try {
      await api.put(`/maintenance/${selectedTask.id}`, {
        status: selectedTask.status,
        technicien_id: selectedTask.technicien_id === '' ? null : selectedTask.technicien_id,
        notes: selectedTask.notes
      });
      fetchTasks();
      alert("Intervention mise à jour !");
    } catch (err) { alert("Erreur de mise à jour"); }
  };

  // 🔥 L'Fonction dyal Délai Moyen (Dynamique) 🔥
  const calculateAverageTime = () => {
    const completedTasks = tasks.filter(t => t.status === 'Terminées' && t.completed_at && t.created_at);
    if (completedTasks.length === 0) return '0 h';

    let totalHours = 0;
    completedTasks.forEach(task => {
      const start = new Date(task.created_at);
      const end = new Date(task.completed_at);
      const diffInHours = Math.abs(end - start) / 36e5;
      totalHours += diffInHours;
    });

    const average = totalHours / completedTasks.length;
    return average < 24 ? `${average.toFixed(1)} h` : `${(average / 24).toFixed(1)} j`;
  };

  // 🔥 L'Fonction dyal l'Export (Excel) 🔥
  const handleExport = () => {
    const dataToExport = tasks.map(t => ({
      "ID": `INT-${t.id}`,
      "Panneau": t.panneau_ref || 'Inconnu',
      "Emplacement": t.panneau_loc || '—',
      "Description": t.description,
      "Priorité": t.priority,
      "Statut": t.status,
      "Technicien": t.technicien_name || 'Non assignée',
      "Date prévue": t.due_date ? new Date(t.due_date).toLocaleDateString('fr-FR') : '—',
      "Créé le": t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '—'
    }));

    if (dataToExport.length === 0) return alert("Aucune intervention à exporter");

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Interventions");
    XLSX.writeFile(workbook, `Rapport_Interventions_${new Date().toLocaleDateString('fr-FR')}.xlsx`);
  };

  const filteredTasks = tasks.filter(t => 
    t.panneau_ref?.toLowerCase().includes(search.toLowerCase()) || 
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col gap-6 h-[calc(100vh-4rem)] relative">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white">Tasks / Interventions</h1>
          <p className="text-sm text-gray-500 mt-1">Planifiez et suivez les interventions sur vos panneaux LED</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Rechercher un panneau..." 
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl text-sm w-64 focus:outline-none" 
            />
          </div>
          {/* L'Bouton dyal l'Export */}
          <button onClick={handleExport} className="px-4 py-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Exporter</button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md flex items-center gap-2"><Plus size={16}/> Nouvelle intervention</button>
        </div>
      </div>

      {/* Stats l'fo9 */}
      <div className="grid grid-cols-4 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6 divide-x divide-gray-100 dark:divide-white/5">
        <div className="px-6 first:pl-0"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Interventions ouvertes</p><p className="text-3xl font-black text-gray-900 dark:text-white">{tasks.length}</p></div>
        <div className="px-6"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">En attente d'assignation</p><p className="text-3xl font-black text-red-500">{tasks.filter(t => !t.technicien_id).length}</p></div>
        <div className="px-6"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Terminées ce mois</p><p className="text-3xl font-black text-green-500">{tasks.filter(t => t.status === 'Terminées').length}</p></div>
        <div className="px-6"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Délai moyen de résolution</p><p className="text-3xl font-black text-gray-900 dark:text-white">{calculateAverageTime()}</p></div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* Kanban Columns */}
        <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pr-2">
          {['À planifier', 'En cours', 'Terminées'].map((colStatus) => (
            <div key={colStatus} className="flex flex-col gap-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 px-2">
                <span className={`w-2 h-2 rounded-full ${colStatus === 'À planifier' ? 'bg-red-500' : colStatus === 'En cours' ? 'bg-orange-500' : 'bg-green-500'}`}></span> 
                {colStatus} <span className="text-gray-400 font-normal">{filteredTasks.filter(t=>t.status===colStatus).length}</span>
              </h3>
              
              {filteredTasks.filter(t => t.status === colStatus).map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} className={`p-4 bg-white dark:bg-[#1A1A1F] rounded-xl border-2 shadow-sm cursor-pointer transition-all ${selectedTask?.id === task.id ? 'border-primary' : 'border-transparent hover:border-gray-200 dark:hover:border-white/10'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-gray-500 font-bold">INT-{task.id}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{task.panneau_ref || 'Panneau inconnu'}</h4>
                  <p className="text-[10px] text-gray-500 mb-3">{task.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><User size={10}/> {task.technicien_name || 'Non assignée'}</span>
                    <span className="flex items-center gap-1"><Calendar size={10}/> {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* L'Détails (L'imen) */}
        {selectedTask && (
          <div className="w-[400px] flex flex-col bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-gray-500">INT-{selectedTask.id}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getPriorityColor(selectedTask.priority)}`}>{selectedTask.priority}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{selectedTask.panneau_ref}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedTask.description}</p>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Technicien</label>
                  <select value={selectedTask.technicien_id || ''} onChange={(e) => setSelectedTask({...selectedTask, technicien_id: e.target.value})} className="w-full mt-1 p-2.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                    <option value="">Assigner...</option>
                    {techniciens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Statut</label>
                  <select value={selectedTask.status} onChange={(e) => setSelectedTask({...selectedTask, status: e.target.value})} className="w-full mt-1 p-2.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                    <option value="À planifier">À planifier</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminées">Terminées</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Notes</label>
                <textarea value={selectedTask.notes || ''} onChange={(e) => setSelectedTask({...selectedTask, notes: e.target.value})} placeholder="Ajouter une note..." className="w-full p-3 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm h-24 focus:outline-none"></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/5">
              <button onClick={handleUpdateTask} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-md">Enregistrer les modifications</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal dyal l'Ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nouvelle intervention</h2>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-bold">
                <AlertTriangle size={18} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Panneau</label>
                <select required value={newTask.panneau_id} onChange={e => setNewTask({...newTask, panneau_id: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                  <option value="">Choisir un panneau...</option>
                  {panneaux.map(p => <option key={p.id} value={p.id}>{p.reference} - {p.emplacement}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                <input type="text" required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" placeholder="Ex: Alerte critique..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Priorité</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                    <option value="Haute">Haute</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Basse">Basse</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Date prévue</label>
                  <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md">Créer l'intervention</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}