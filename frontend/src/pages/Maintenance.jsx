import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, CheckCircle, User } from 'lucide-react';

export default function Maintenance() {
  const [techniciens, setTechniciens] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State dyal l'formulaire
  const [newTech, setNewTech] = useState({
    prenom: '', nom: '', email: '', phone: '', password: '', role: 'technicien'
  });

  useEffect(() => {
    fetchTechniciens();
  }, []);

  const fetchTechniciens = async () => {
    try {
      const res = await api.get('/users');
      // Kankhdmo ghir li 3ndhom role technicien (wla kolhom)
      setTechniciens(res.data.filter(u => u.role === 'technicien' || u.role === 'superviseur'));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTechs = techniciens.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Fonction dyal l'Ajout
  const handleAddTech = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fullName = `${newTech.prenom} ${newTech.nom}`.trim();
      await api.post('/users', {
        name: fullName,
        email: newTech.email,
        phone: newTech.phone,
        password: newTech.password || '123456',
        role: 'technicien' // Diman kaytzad b role technicien
      });
      setShowModal(false);
      setNewTech({ prenom: '', nom: '', email: '', phone: '', password: '', role: 'technicien' });
      fetchTechniciens();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'ajout");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Techniciens</h1>
        <p className="text-sm text-gray-500 mt-1">{techniciens.length} techniciens · {techniciens.filter(t => t.status !== 'Occupée').length} disponibles</p>
      </div>

      <div className="flex gap-6 h-full">
        
        {/* L'Jneb l'Isar (Liste) */}
        <div className="w-[400px] flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un technicien..." className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" />
          </div>

          <div className="overflow-y-auto flex flex-col gap-3 pr-2">
            {filteredTechs.map(tech => (
              <div key={tech.id} className="p-4 bg-white dark:bg-[#1A1A1F] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                    {tech.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tech.name}</h3>
                    <p className="text-[10px] text-gray-500">{tech.email} · {tech.phone || 'Casablanca, FSs'}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Disponible</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="text-[9px] px-2 py-1 bg-gray-100 text-gray-600 rounded">Câblage</span>
                  <span className="text-[9px] px-2 py-1 bg-gray-100 text-gray-600 rounded">Modules LED</span>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={() => setShowModal(true)} className="w-full py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition">
            + Ajouter un technicien
          </button>
        </div>

        {/* L'Jneb l'Imen (L'Formulaire sghir) */}
        {showModal ? (
          <div className="flex-1 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Nouveau technicien</h2>
              <p className="text-sm text-gray-500 mt-1">Le technicien est ajouté avec le rôle « Technicien » dans Utilisateurs</p>
            </div>

            <form onSubmit={handleAddTech} className="space-y-5 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Prénom</label><input type="text" required value={newTech.prenom} onChange={e => setNewTech({...newTech, prenom: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nom</label><input type="text" required value={newTech.nom} onChange={e => setNewTech({...newTech, nom: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</label><input type="email" required value={newTech.email} onChange={e => setNewTech({...newTech, email: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Téléphone</label><input type="text" required value={newTech.phone} onChange={e => setNewTech({...newTech, phone: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md">
                  {isSubmitting ? 'Ajout...' : "Ajouter le technicien"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#121216] rounded-2xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400">
            <p className="text-sm">Sélectionnez "Ajouter un technicien" pour créer un nouveau profil</p>
          </div>
        )}
      </div>
    </div>
  );
}