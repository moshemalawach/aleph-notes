import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SharePage from './pages/SharePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/share/:hash" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}
