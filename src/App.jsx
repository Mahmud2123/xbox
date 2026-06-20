// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Scan from './pages/Scan';

function App() {
  return (
    <div className="max-w-[600px] mx-auto bg-[#0a0a0a] min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
      </Routes>
    </div>
  );
}

export default App;