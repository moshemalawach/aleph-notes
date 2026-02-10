import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SharePage from './pages/SharePage';
import LandingPage from './pages/LandingPage';
import { useTheme } from './hooks/useTheme';

export default function App() {
  useTheme();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<HomePage />} />
        <Route path="/share/:hash" element={<SharePage />} />
      </Routes>
    </HashRouter>
  );
}
