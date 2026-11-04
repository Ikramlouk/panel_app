import { useState, useEffect } from 'react';
import { Wrench, User, CheckCircle, Clock, X, Plus, UserPlus, Edit, Trash2, History, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

export default function Maintenance() {
  const [tasks, setTasks] = useState([]);
  const [panneaux, setPanneaux] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modals States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showManageTechModal, setShowManageTechModal] = useState(false);
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState(null);
  const [editingTask, setEditingTask] = useState(null); 
  const [editingTech, setEditingTech] = useState(null);

  // Form States
  const [newTask, setNewTask] = useState({ panneau_id: '', technicien_id: '', description: '' });
  const [selectedPanneauDetails, setSelectedPanneauDetails] = useState(null);
  const [newTech, setNewTech] = useState({ name: '', email: '', phone: '', password: '123456' });
  const [proofImage, setProofImage] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('active'); // 'active' wla 'history'

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    Promise.all([
      api.get('/maintenance'),
      api.get('/panneaux'),
      api.get('/users')
    ]).then(([resT, resP, resU]) => {
      setTasks(resT.data);
      setPanneaux(resP.data);
      setUsers(resU.data);
    }).catch(err => console.error(err));
  };

  const handlePanneauSelect = (e) => {
    const panneauId = e.target.value;
    const details = panneaux.find(p => p.id === parseInt(panneauId));
    setNewTask({...newTask, panneau_id: panneauId});
    setSelectedPanneauDetails(details);
  };

  // --- CRUD TÂCHES ---
  const handleSaveTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTask) {
        await api.put(`/maintenance/${editingTask.id}`, newTask);
      } else {
        await api.post('/maintenance', newTask);
      }
      setShowAssignModal(false);
      setEditingTask(null);
      setNewTask({ panneau_id: '', technicien_id: '', description: '' });
      setSelectedPanneauDetails(null);
      fetchData(); 
    } catch (err) { alert("Erreur lors de l'enregistrement de la tâche"); }
    finally { setLoading(false); }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
      await api.delete(`/maintenance/${id}`);
      fetchData();
    }
  };

  const openEditTask = (t) => {
    setEditingTask(t);
    setNewTask({ panneau_id: t.panneau_id, technicien_id: t.technicien_id, description: t.description });
    setSelectedPanneauDetails(panneaux.find(p => p.id === t.panneau_id));
    setShowAssignModal(true);
  };

  // --- CRUD TECHNICIENS ---
  const handleSaveTech = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTech) {
        await api.put(`/users/${editingTech.id}`, newTech);
        setEditingTech(null);
      } else {
        await api.post('/users', newTech);
      }
      setShowTechModal(false);
      setNewTech({ name: '', email: '', phone: '', password: '123456' });
      fetchData(); 
    } catch (err) { alert("Erreur: Email déjà utilisé ou données invalides."); }
    finally { setLoading(false); }
  };

  const handleDeleteTech = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce technicien ?")) {
      await api.delete(`/users/${id}`);
      fetchData();
    }
  };

  const openEditTech = (u) => {
    setEditingTech(u);
    setNewTech({ name: u.name, email: u.email, phone: u.phone, password: '' });
    setShowTechModal(true);
  };

  // --- COMPLETE TÂCHE ---
  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!proofImage) return alert("Veuillez sélectionner une image.");
    setLoading(true);
    const formData = new FormData();
    formData.append('image', proofImage);
    try {
      await api.put(`/maintenance/${selectedTaskToComplete.id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedTaskToComplete(null);
      setProofImage(null);
      fetchData();
    } catch (err) { alert("Erreur lors de l'envoi de l'image"); }
    finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    if (status === 'Terminé') return <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-bold w-fit flex items-center gap-1"><CheckCircle size={12}/> Terminé</span>;
    return <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-bold w-fit flex items-center gap-1"><Clock size={12}/> En attente</span>;
  };

  const displayedTasks = tasks.filter(t => view === 'active' ? t.status !== 'Terminé' : t.status === 'Terminé');

  return (
    <div className="p-6 bg-gray-50 dark:bg-[#0F0F12] min-h-screen transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Wrench className="text-primary" /> Gestion de Maintenance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Assignez et suivez l'état des interventions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowManageTechModal(true)} className="flex items-center gap-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm">
            <User size={18} /> Gérer Techniciens
          </button>
          <button 
            onClick={() => { 
              setEditingTask(null); 
              setNewTask({ panneau_id: '', technicien_id: '', description: '' }); 
              setSelectedPanneauDetails(null); 
              setShowAssignModal(true); 
            }} 
            className="flex items-center gap-2 bg-gray-900 dark:bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-sm"
          >
            <Plus size={18} /> Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* Tabs Actives / Historique */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setView('active')} 
          className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${view === 'active' ? 'bg-gray-900 text-white shadow-md' : 'bg-white dark:bg-[#1A1A1F] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'}`}
        >
          <Wrench size={16} /> Tâches Actives
        </button>
        <button 
          onClick={() => setView('history')} 
          className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${view === 'history' ? 'bg-gray-900 text-white shadow-md' : 'bg-white dark:bg-[#1A1A1F] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'}`}
        >
          <History size={16} /> Historique
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-bold text-xs uppercase">Panneau</th>
              <th className="px-6 py-4 font-bold text-xs uppercase">Technicien</th>
              <th className="px-6 py-4 font-bold text-xs uppercase">Description</th>
              <th className="px-6 py-4 font-bold text-xs uppercase">Statut</th>
              <th className="px-6 py-4 font-bold text-xs uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {displayedTasks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">{t.reference}</p>
                  <p className="text-xs text-gray-500">{t.emplacement !== 'Inconnu' ? t.emplacement : ''}</p>
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                  <User size={14} className="inline mr-1"/> {t.technicien_name}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">{t.description}</td>
                <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {t.status !== 'Terminé' ? (
                    <>
                      <button onClick={() => openEditTask(t)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Modifier">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteTask(t.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => setSelectedTaskToComplete(t)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-red-700 transition">
                        Terminer
                      </button>
                    </>
                  ) : (
                    t.proof_image && (
                      <a href={t.proof_image} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                        <ImageIcon size={14} /> Voir Preuve
                      </a>
                    )
                  )}
                </td>
              </tr>
            ))}
            {displayedTasks.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  Aucune tâche dans cette section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Gérer Techniciens (Liste) */}
      {showManageTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gérer les Techniciens</h2>
              <button onClick={() => setShowManageTechModal(false)} className="text-gray-500 hover:text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <button 
              onClick={() => { 
                setEditingTech(null); 
                setNewTech({ name: '', email: '', phone: '', password: '123456' }); 
                setShowTechModal(true); 
              }} 
              className="mb-4 flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <Plus size={16} /> Ajouter un nouveau
            </button>
            
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 border-b dark:border-white/10 text-gray-500">
                <tr>
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b dark:border-white/5 last:border-0">
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{u.name}</td>
                    <td className="py-3 px-4 text-gray-500">{u.email}</td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEditTech(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteTech(u.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-4 text-gray-500">Aucun technicien enregistré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Ajouter / Modifier Technicien */}
      {showTechModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTech ? 'Modifier' : 'Nouveau'} Technicien
              </h2>
              <button onClick={() => setShowTechModal(false)} className="text-gray-500 hover:text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTech} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nom Complet</label>
                <input type="text" required value={newTech.name} onChange={e => setNewTech({...newTech, name: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white" placeholder="Ex: Ahmed Ali" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                <input type="email" required value={newTech.email} onChange={e => setNewTech({...newTech, email: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white" placeholder="technicien@panel.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Téléphone</label>
                <input type="text" required value={newTech.phone} onChange={e => setNewTech({...newTech, phone: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white" placeholder="06XXXXXXXX" />
              </div>
              
              {/* HNA KANNA F L'CADRE L'ZRE9 W DABA T7IYED */}

              <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-red-700 transition mt-2">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assigner / Modifier Tâche */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Panneau</label>
                <select required value={newTask.panneau_id} onChange={handlePanneauSelect} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white">
                  <option value="">-- Choisir un panneau --</option>
                  {panneaux.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.reference} {p.emplacement && p.emplacement !== 'Inconnu' ? `- ${p.emplacement}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPanneauDetails && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Référence</label>
                    <input type="text" value={selectedPanneauDetails.reference} disabled className="w-full bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Emplacement</label>
                    <input type="text" value={selectedPanneauDetails.emplacement !== 'Inconnu' ? selectedPanneauDetails.emplacement : 'Non spécifié'} disabled className="w-full bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Technicien</label>
                <select required value={newTask.technicien_id} onChange={e => setNewTask({...newTask, technicien_id: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white">
                  <option value="">-- Choisir un technicien --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Description (Optionnel)</label>
                <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white" rows="2" placeholder="Ex: Changer les modules..."></textarea>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-red-700 transition">
                {loading ? 'Envoi...' : 'Enregistrer la Tâche'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Terminer Tâche (Preuve) */}
      {selectedTaskToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preuve de Maintenance</h2>
            <p className="text-sm text-gray-500 mb-4">Veuillez uploader la photo du panneau après réparation.</p>
            <form onSubmit={handleCompleteTask}>
              <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center mb-6">
                <input type="file" accept="image/*" onChange={e => setProofImage(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition cursor-pointer" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedTaskToComplete(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-success text-white rounded-xl text-sm font-bold hover:bg-green-600 transition">
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}