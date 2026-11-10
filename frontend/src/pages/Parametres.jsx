import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  User, Mail, Shield, Save, CheckCircle, AlertTriangle, 
  Bell, Settings, Layout
} from 'lucide-react';

export default function Parametres() {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profil');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [userInfo, setUserInfo] = useState({ name: '', email: '', role: '', avatar: null });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // State dyal l'paramètres
  const [settings, setSettings] = useState({
    detection_threshold: 0.60,
    capture_frequency: '15 mins',
    notif_app: true,
    notif_email: true,
    notif_sms: false,
    theme: 'Clair'
  });

  // 1. Jbed l'data mli t7el l'page (Ghir MARA WA7DA)
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const savedAvatar = localStorage.getItem('userAvatar');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo({ name: user.name || '', email: user.email || '', role: user.role || 'Administrateur', avatar: savedAvatar || null });
      } catch (e) {}
    }

    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setSettings(res.data);
          applyTheme(res.data.theme); // Appliquer le thème mli t7el l'page
        }
      } catch (err) {
        console.error("Erreur fetch settings", err);
      } finally {
        setIsLoading(false); // Salina l'chargement
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- [] kat3ni ghir mara wa7da

  // L'Fonction li katbdel l'Thème
  const applyTheme = (theme) => {
    if (theme === 'Sombre') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'Clair') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'Système') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  };

  const showMessage = (type, msg) => {
    if (type === 'success') setSuccessMsg(msg); else setErrorMsg(msg);
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000);
  };

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/users/me', { name: userInfo.name, email: userInfo.email });
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...user, name: userInfo.name, email: userInfo.email }));
      }
      showMessage('success', 'Profil mis à jour !');
      setTimeout(() => window.location.reload(), 1000); 
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Erreur de modification');
    } finally { setIsSaving(false); }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return showMessage('error', 'Mots de passe différents');
    setIsSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      showMessage('success', 'Mot de passe modifié !');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Mot de passe incorrect');
    } finally { setIsSaving(false); }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings', settings);
      showMessage('success', 'Paramètres enregistrés avec succès !');
      applyTheme(settings.theme); // Appliquer le thème apr\u00e8s l'enregistrement
    } catch (err) {
      showMessage('error', 'Erreur lors de l\'enregistrement des paramètres');
    } finally { setIsSaving(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({ ...userInfo, avatar: reader.result });
        localStorage.setItem('userAvatar', reader.result);
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setUserInfo({ ...userInfo, avatar: null });
    localStorage.removeItem('userAvatar');
    window.location.reload();
  };

  const handleThemeChange = (newTheme) => {
    setSettings({ ...settings, theme: newTheme });
    applyTheme(newTheme); // Appliquer direct mli tcliqui
  };

  const tabs = [
    { id: 'profil', name: 'Profil', icon: User },
    { id: 'detection', name: 'Détection & alertes', icon: Settings },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'securite', name: 'Sécurité', icon: Shield },
    { id: 'apparence', name: 'Apparence', icon: Layout },
  ];

  if (isLoading) return <div className="p-10 text-center text-gray-500">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez votre compte, la détection et les notifications</p>
      </div>

      {successMsg && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 text-sm font-bold"><CheckCircle size={18} /> {successMsg}</div>}
      {errorMsg && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-bold"><AlertTriangle size={18} /> {errorMsg}</div>}

      <div className="flex flex-col md:flex-row gap-8">
        
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} /> {tab.name}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-6">
          
          {activeTab === 'profil' && (
             <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Profil</h2>
               <p className="text-xs text-gray-500 mb-6">Vos informations personnelles</p>
               <form onSubmit={handleSaveProfil} className="space-y-6">
                 <div className="flex items-center gap-6">
                   <div className="relative">
                     <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-white dark:border-[#1A1A1F] shadow-sm">
                       {userInfo.avatar ? <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-primary">{userInfo.name.charAt(0).toUpperCase()}</span>}
                     </div>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-900 dark:text-white">{userInfo.name}</p>
                     <p className="text-xs text-gray-500">{userInfo.role}</p>
                     <div className="flex gap-2 mt-2">
                       <button type="button" onClick={() => fileInputRef.current.click()} className="text-xs font-bold text-primary hover:underline">Changer la photo</button>
                       {userInfo.avatar && <button type="button" onClick={handleDeleteImage} className="text-xs font-bold text-red-500 hover:underline">Supprimer</button>}
                     </div>
                     <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><label className="text-xs font-bold text-gray-500 uppercase">Nom d'affichage</label><input type="text" required value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full mt-2 px-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                   <div><label className="text-xs font-bold text-gray-500 uppercase">Adresse email</label><input type="email" required value={userInfo.email} onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })} className="w-full mt-2 px-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                 </div>
                 <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                   <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md"><Save size={18} /> Enregistrer</button>
                 </div>
               </form>
             </div>
          )}

          {activeTab === 'detection' && (
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Détection & alertes</h2>
              <p className="text-xs text-gray-500 mb-6">Réglages du modèle YOLO et déclenchement des alertes</p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Seuil de confiance du modèle</label>
                    <span className="text-sm font-bold">{settings.detection_threshold}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={settings.detection_threshold} onChange={(e) => setSettings({...settings, detection_threshold: parseFloat(e.target.value)})} className="w-full accent-primary" />
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <label className="text-sm font-bold text-gray-900 dark:text-white block mb-2">Fréquence de capture</label>
                  <select value={settings.capture_frequency} onChange={(e) => setSettings({...settings, capture_frequency: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                    <option value="5 mins">Toutes les 5 minutes</option>
                    <option value="15 mins">Toutes les 15 minutes</option>
                    <option value="1 hour">Toutes les heures</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-white/5 mt-6">
                <button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md"><Save size={18} /> Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notifications</h2>
              <p className="text-xs text-gray-500 mb-6">Choisissez comment être prévenu</p>
              <div className="space-y-4">
                {[
                  { key: 'notif_app', label: 'Notifications dans l\'application' },
                  { key: 'notif_email', label: 'Alertes critiques par email' },
                  { key: 'notif_sms', label: 'Alertes critiques par SMS' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings[item.key]} onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-white/5 mt-6">
                <button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md"><Save size={18} /> Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'securite' && (
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sécurité</h2>
              <p className="text-xs text-gray-500 mb-6">Protégez l'accès à votre compte</p>
              <form onSubmit={handleSavePassword} className="space-y-5">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Mot de passe actuel</label><input type="password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="w-full mt-2 px-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Nouveau mot de passe</label><input type="password" required minLength={6} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full mt-2 px-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Confirmer</label><input type="password" required minLength={6} value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="w-full mt-2 px-4 py-2.5 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none" /></div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                  <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-md"><Shield size={18} /> Mettre à jour</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'apparence' && (
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Apparence</h2>
              <p className="text-xs text-gray-500 mb-6">Personnalisez l'interface</p>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-900 dark:text-white block mb-2">Thème</label>
                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
                    {['Clair', 'Sombre', 'Système'].map((t) => (
                      <button key={t} type="button" onClick={() => handleThemeChange(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.theme === t ? 'bg-white dark:bg-[#2A2A2F] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-white/5 mt-6">
                <button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md"><Save size={18} /> Enregistrer</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}