import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Edit2, Save, X } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = { ...user, name, avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile', err);
      alert('Erro ao salvar o perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="auth-box" style={{ textAlign: 'center' }}>

        {isEditing ? (
          <form onSubmit={handleSave} style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Editar Perfil</h2>
              <button type="button" onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>URL da Foto do Avatar</label>
              <input 
                type="url" 
                className="input" 
                value={avatar} 
                onChange={e => setAvatar(e.target.value)} 
                placeholder="https://exemplo.com/sua-foto.jpg" 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Cole qualquer link de imagem da internet.
              </span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nome de Exibição</label>
              <input 
                type="text" 
                className="input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
              <Save size={18} style={{ marginRight: '0.5rem' }} /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        ) : (
          <>
            <div style={{ position: 'relative', width: '120px', margin: '0 auto 1.5rem auto' }}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-tertiary)' }} 
                />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <button 
                onClick={() => setIsEditing(true)}
                style={{ 
                  position: 'absolute', bottom: 0, right: 0, 
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)', 
                  border: '1px solid var(--border-color)', borderRadius: '50%', 
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                }}
                title="Editar Perfil"
              >
                <Edit2 size={16} />
              </button>
            </div>

            <h1 style={{ marginBottom: '0.5rem' }}>{user.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{user.email}</p>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ width: '100%', color: 'var(--status-urgent)', borderColor: 'var(--status-urgent)' }}
              >
                <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Sair da conta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
