import { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import Settings from './components/Settings';
import './styles/global.css';

const VALID_TABS = ['dashboard', 'logs', 'settings'];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('pk-dark') === 'true';
  });

  // Read hash on load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (VALID_TABS.includes(hash)) setActiveTab(hash);
  }, []);

  // Apply dark mode class to root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('pk-dark', darkMode);
  }, [darkMode]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  };

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'logs'      && <Logs />}
        {activeTab === 'settings'  && <Settings />}
      </main>
    </div>
  );
}
