import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, ListTodo, Settings, Sun, Moon, Wand2, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { theme, setTheme } = useTheme();

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      padding: '0.75rem', 
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', 
      textDecoration: 'none', 
      background: isActive ? 'var(--bg-tertiary)' : 'transparent', 
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: isActive ? 600 : 400
    };
  };

  return (
    <div className="app-layout">
      {/* Sidebar Fixo */}
      <aside className="sidebar">
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListTodo /> Kanban
          </h2>
        </div>
        
        <nav className="flex-col gap-sm" style={{ flex: 1 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={getLinkStyle('/')}>
            <Home size={18} /> Início
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/tasks'); }} style={getLinkStyle('/tasks')}>
            <ListTodo size={18} /> Minhas Tarefas
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/ai'); }} style={getLinkStyle('/ai')}>
            <Sparkles size={18} /> Agente IA
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }} style={getLinkStyle('/profile')}>
            <Settings size={18} /> Configurações
          </a>

          {/* Theme Toggles */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, paddingLeft: '0.5rem' }}>Tema</div>
            <button 
              onClick={() => setTheme('light')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: theme === 'light' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <Sun size={16} /> Light
            </button>
            <button 
              onClick={() => setTheme('dark')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: theme === 'dark' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <Moon size={16} /> Dark
            </button>
            <button 
              onClick={() => setTheme('playful')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: theme === 'playful' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: theme === 'playful' ? 'bold' : 'normal' }}
            >
              <Wand2 size={16} /> Lúdico
            </button>
            <button 
              onClick={() => setTheme('dinosaur')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: theme === 'dinosaur' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: theme === 'dinosaur' ? 'bold' : 'normal' }}
            >
              🦕 Dinossauro
            </button>
            <button 
              onClick={() => setTheme('pokemon')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: theme === 'pokemon' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: theme === 'pokemon' ? 'bold' : 'normal' }}
            >
              ⚡ Pokémon
            </button>
          </div>
        </nav>

        <div 
          className="flex items-center gap-sm" 
          style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name?.split(' ')[0]}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Meu Perfil</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area para as páginas serem renderizadas */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
