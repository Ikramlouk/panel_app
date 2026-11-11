import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Mail, Phone, MoreVertical, X, CheckCircle, Edit, Trash2 
} from 'lucide-react';

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, actifs: 0, invites: 0, admins: 0 });
  const [successMsg, setSuccessMsg] = useState('');

  // State dyal l'permissions dyal l'user li mkhtar
  const [userPermissions, setUserPermissions] = useState({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // State dyal l'Modal dyal l'Ajout / l'Modification
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // <-- Bach n3rfo wach kan-zido wla kan-modifiw
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    prenom: '', nom: '', email: '', phone: '', password: '', role: 'technicien'
  });

  // L'Liste dyal l'Permissions li kaynin f l'Interface
  const modules = ['Carte', 'Alertes', 'Rapports', 'Statistiques', 'Utilisateurs', 'Paramètres', 'Maintenance'];
  const actions = ['voir', 'creer', 'modifier', 'supprimer'];

  useEffect(() => {
    fetchUsers();
  }, []);

  // Mli t-cliqui 3la chi user, jbed l'permissions dyalo
  useEffect(() => {
    if (selectedUser) {
      fetchPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users'); 
      setUsers(res.data);
      
      const total = res.data.length;
      const admins = res.data.filter(u => u.role === 'admin').length;
      
      setStats({ total: total, actifs: total, invites: 0, admins: admins > 0 ? admins : 1 });
      
      if (res.data.length > 0 && !selectedUser) setSelectedUser(res.data[0]);
    } catch (err) { console.error(err); }
  };

  const fetchPermissions = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/permissions`);
      setUserPermissions(res.data || {});
    } catch (err) { console.error(err); }
  };

  const handlePermissionChange = (module, action) => {
    setUserPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action]
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsSavingPerms(true);
    try {
      await api.put(`/users/${selectedUser.id}/permissions`, { permissions: userPermissions });
      showMessage('Permissions enregistrées avec succès !');
    } catch (err) {
      alert('Erreur lors de la sauvegarde des permissions');
    } finally { setIsSavingPerms(false); }
  };

  // 🔥 L'Fonction li kat7el l'Modal bach tzid User 🔥
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setNewUser({ prenom: '', nom: '', email: '', phone: '', password: '', role: 'technicien' });
    setShowModal(true);
  };

  // 🔥 L'Fonction li kat7el l'Modal bach t9ad User 🔥
  const handleOpenEditModal = (user) => {
    setIsEditMode(true);
    const nameParts = user.name.split(' ');
    setNewUser({
      id: user.id,
      prenom: nameParts[0] || '',
      nom: nameParts.slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || '',
      password: '', // Ma kan-bdlohch hna
      role: user.role || 'technicien'
    });
    setShowModal(true);
  };

  // L'Fonction dyal l'Enregistrement (Ajout wla Modification)
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fullName = `${newUser.prenom} ${newUser.nom}`.trim();
      
      if (isEditMode) {
        // Modification
        await api.put(`/users/${newUser.id}`, {
          name: fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role
        });
        showMessage('Utilisateur modifié avec succès !');
      } else {
        // Ajout
        await api.post('/users', {
          name: fullName,
          email: newUser.email,
          phone: newUser.phone,
          password: newUser.password || '123456',
          role: newUser.role
        });
        showMessage('Utilisateur créé avec succès !');
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (user) => {
    if (window.confirm(`Voulez-vous réinitialiser le mot de passe de ${user.name} ? (Il sera 123456)`)) {
      try {
        const res = await api.put(`/users/${user.id}/reset-password`);
        showMessage(res.data.message);
      } catch (err) {
        alert("Erreur lors de la réinitialisation");
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${user.name} ?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        showMessage('Utilisateur supprimé avec succès !');
        if (selectedUser?.id === user.id) setSelectedUser(null);
        fetchUsers();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleExport = () => {
    const dataToExport = users.map(u => ({
      "Nom complet": u.name,
      "Email": u.email,
      "Téléphone": u.phone || '—',
      "Rôle": u.role,
      "Statut": 'Actif'
    }));

    if (dataToExport.length === 0) return alert("Aucun utilisateur à exporter");

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Utilisateurs");
    XLSX.writeFile(workbook, `Liste_Utilisateurs_${new Date().toLocaleDateString('fr-FR')}.xlsx`);
  };

  const showMessage = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 h-[calc(100vh-4rem)] relative">
      
      {successMsg && (
        <div className="absolute top-4 right-4 z-50 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les accès, les rôles et les droits de vos équipes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition">
            Exporter
          </button>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md flex items-center gap-2">
            <Plus size={16}/> Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-4">
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Utilisateurs</p><p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p></div>
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Actifs</p><p className="text-2xl font-black text-green-500">{stats.actifs}</p></div>
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Invitations</p><p className="text-2xl font-black text-orange-500">{stats.invites}</p></div>
        <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Administrateurs</p><p className="text-2xl font-black text-gray-900 dark:text-white">{stats.admins}</p></div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* Liste */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#121216] text-gray-500 font-bold text-[10px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-3">Utilisateur</th>
                  <th className="px-6 py-3">Rôle</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} onClick={() => setSelectedUser(u)} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer ${selectedUser?.id === u.id ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">{u.name.charAt(0)}</div><div><p className="font-bold text-gray-900 dark:text-white">{u.name}</p><p className="text-[10px] text-gray-500">{u.email}</p></div></div></td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${u.role === 'admin' ? 'bg-gray-900 text-white' : u.role === 'superviseur' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.role === 'admin' ? 'Administrateur' : u.role === 'superviseur' ? 'Superviseur' : 'Technicien'}
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="flex items-center gap-1 text-xs font-bold text-green-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Actif</span></td>
                    
                    {/* 🔥 L'BOUTONS D'ACTION (Modifier / Supprimer) 🔥 */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(u); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition" title="Modifier">
                          <Edit size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* L'imen (Détails dyal l'User m3a l'Permissions) */}
        {selectedUser && (
          <div className="w-[450px] flex flex-col bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xl font-black">{selectedUser.name.substring(0, 2).toUpperCase()}</div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">Actif</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{selectedUser.name}</h2>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2"><Mail size={12}/> {selectedUser.email}</p>
              {selectedUser.phone && <p className="text-xs text-gray-500 mt-1 flex items-center gap-2"><Phone size={12}/> {selectedUser.phone}</p>}
            </div>

            {/* Droits d'accès (Dynamique) */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Droits d'accès</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 text-[10px] uppercase">
                    <th className="text-left font-normal pb-2">Module</th>
                    <th className="text-center font-normal pb-2">Voir</th>
                    <th className="text-center font-normal pb-2">Créer</th>
                    <th className="text-center font-normal pb-2">Modif.</th>
                    <th className="text-center font-normal pb-2">Suppr.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {modules.map((mod) => (
                    <tr key={mod}>
                      <td className="py-2 text-gray-600 dark:text-gray-300 font-medium">{mod}</td>
                      {actions.map((act) => (
                        <td key={act} className="py-2 text-center">
                          <input 
                            type="checkbox" 
                            checked={userPermissions[mod]?.[act] || false} 
                            onChange={() => handlePermissionChange(mod, act)} 
                            className="accent-primary cursor-pointer w-4 h-4" 
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Boutons d'action */}
            <div className="p-6 mt-auto space-y-3 bg-gray-50 dark:bg-[#121216]">
              <div className="flex gap-2">
                <button onClick={() => handleResetPassword(selectedUser)} className="flex-1 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition">Réinitialiser mdp</button>
                <button onClick={() => handleDeleteUser(selectedUser)} className="flex-1 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition">Supprimer</button>
              </div>
              <button onClick={handleSavePermissions} disabled={isSavingPerms} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-md">
                {isSavingPerms ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* L'MODAL dyal l'Ajout / l'Modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-white transition"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">{isEditMode ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h2>
              <p className="text-sm text-gray-500 mt-1">{isEditMode ? 'Modifiez les informations' : 'Créez un compte et définissez ses droits'}</p>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Prénom</label><input type="text" required value={newUser.prenom} onChange={e => setNewUser({...newUser, prenom: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nom</label><input type="text" required value={newUser.nom} onChange={e => setNewUser({...newUser, nom: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</label><input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Téléphone</label><input type="text" required value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
              </div>

              {/* 🔥 L'BOUTON DYAL L'ROLE 🔥 */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rôle</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'admin', label: 'Administrateur' },
                    { id: 'superviseur', label: 'Superviseur' },
                    { id: 'technicien', label: 'Technicien' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setNewUser({...newUser, role: r.id})}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition ${
                        newUser.role === r.id 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md">
                  {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Enregistrer' : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}