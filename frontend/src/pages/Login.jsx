import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/panneaux');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark">
      <div className="absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -top-40 -left-40" />
      <div className="absolute w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -bottom-32 -right-32" />

      <div className="relative w-full max-w-md bg-dark2/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-16 mb-4 object-contain" /><h1 className="text-2xl font-bold text-white">Bienvenue</h1>
          <p className="text-gray text-sm mt-1">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-gray mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@panel.com" className="input-style" required />
          </div>

          <div>
            <label className="text-sm text-gray mb-1 block">Mot de passe</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-style pr-12" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-primary transition">
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-primary text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
        </form>

        <div className="flex items-center gap-2 mt-6 justify-center text-xs text-gray">
          <Shield size={14} /> Connexion sécurisée
        </div>
      </div>
    </div>
  );
}
