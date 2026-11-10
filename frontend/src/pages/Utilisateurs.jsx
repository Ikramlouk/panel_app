import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Mail, Phone, Search, Trash2, Edit, Plus } from 'lucide-react';

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Jbed l'data mn l'Backend mli t7el l'page
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users'); // Route li 3ndek f users.js
        setUsers(res.data || []);
      } catch (err) {
        console.error("Erreur fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filtrage bach t9der t9elleb 3la chi wa7d
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Techniciens</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les accès des techniciens</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md">
          <Plus size={18} /> Nouveau Technicien
        </button>
      </div>

      <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
        {/* Barre de recherche */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un technicien..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Tableau */}
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-[#121216] text-gray-500 font-bold text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Nom</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Téléphone</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">Chargement...</td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={16} className="text-gray-400" /> {u.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    <Mail size={14} className="inline mr-2 text-gray-400" /> {u.email}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    <Phone size={14} className="inline mr-2 text-gray-400" /> {u.phone || '—'}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-500 transition"><Edit size={16} /></button>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">Aucun technicien trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}