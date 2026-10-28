import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Panneaux from './pages/Panneaux';
import PanneauDetail from './pages/PanneauDetail';
import Carte from './pages/Carte'; 
import Layout from './components/Layout';
import Alertes from './pages/Alertes';
import Detection from './pages/Detection'; 
import Statistiques from './pages/Statistiques';
import Historique from './pages/Historique';

<Route path="stats" element={<Statistiques />} />

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
          <Route path="detection" element={<Detection />} /> {/* <-- Zidna hada */}
          <Route path="stats" element={<Statistiques />} />
          

          <Route path="/historique" element={<Historique />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}