import { useState } from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'logs',      label: 'Logs' },
  { id: 'settings',  label: 'Settings' },
];

export default function Header({ activeTab, onTabChange, darkMode, onToggleDark }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTab = (id) => {
    onTabChange(id);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        {/* Logo */}
        <div className="logo">
          Power<span>Kubo</span>
        </div>

        {/* Desktop nav */}
        <nav className="nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="header-controls">
          {/* Dark mode toggle */}
          <button
            className={`dark-toggle ${darkMode ? 'dark-on' : ''}`}
            onClick={onToggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            <div className="dark-toggle-thumb">
              {darkMode ? '🌙' : '☀️'}
            </div>
          </button>

          {/* Hamburger (mobile only) */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}
