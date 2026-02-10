import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SharePage from './pages/SharePage';
import LandingPage from './pages/LandingPage';
import { useTheme } from './hooks/useTheme';

export default function App() {
  useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<HomePage />} />
        <Route path="/share/:hash" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}
