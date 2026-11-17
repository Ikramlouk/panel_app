import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Panneaux from './pages/Panneaux';
import PanneauDetail from './pages/PanneauDetail';
import Carte from './pages/Carte'; 
import Layout from './components/Layout';
import Alertes from './pages/Alertes';
import Statistiques from './pages/Statistiques';
import Historique from './pages/Historique';
import PanneauHistorique from './pages/PanneauHistorique';
import Notifications from './pages/Notifications'; 
import Maintenance from './pages/Maintenance'; 
import Rapports from './pages/Rapports'; 
import PanneauStatistiques from './pages/PanneauStatistiques'; // <-- Zidna hada
import Utilisateurs from './pages/Utilisateurs';
import Parametres from './pages/Parametres';
import Tasks from './pages/Tasks'; 
import HistoriqueTasks from './pages/HistoriqueTasks';
import Stock from './pages/Stock';

const Private = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/" />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/" element={<Private><Layout /></Private>}>
          <Route path="panneaux" element={<Panneaux />} />
          <Route path="panneaux/:id" element={<PanneauDetail />} />
          <Route path="carte" element={<Carte />} />
          <Route path="alertes" element={<Alertes />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="stats" element={<Statistiques />} />
          
          {/* HAD L'ROUTE HIYA LI KANT NA9SA */}
          <Route path="statistiques/:id" element={<PanneauStatistiques />} /> 
          
          <Route path="historique" element={<Historique />} />
          <Route path="historique/:id" element={<PanneauHistorique />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="users" element={<Utilisateurs />} />
          <Route path="settings" element={<Parametres />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="tasks" element={<Tasks />} /> 
          <Route path="historique-tasks" element={<HistoriqueTasks />} />
          <Route path="stock" element={<Stock />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}