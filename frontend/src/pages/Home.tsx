import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Clock, Plus, AlertTriangle } from 'lucide-react';
import * as storage from '../services/storage';
import { Task } from '../services/storage';
import { useNavigate } from 'react-router-dom';

type Task = {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'urgent';
  status: 'todo' | 'doing' | 'done';
  category: string;
  tags: string[];
  completed_at: string | null;
};

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: storage.getTasks
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Carregando...</div>;

  // Estatísticas de 7 Dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const completedLast7Days = tasks.filter(t => {
    if (t.status !== 'done' || !t.completed_at) return false;
    const completedDate = new Date(t.completed_at);
    return completedDate >= sevenDaysAgo;
  });

  const pendingTasks = tasks.filter(t => t.status !== 'done');

  // Tarefas Atrasadas
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    // Set time to 00:00:00 for fair date comparison
    const due = new Date(t.due_date);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  });

  // Próximas a vencer (que tem due_date e não estão concluídas), ordenadas pela data mais próxima
  const upcomingTasks = tasks
    .filter(t => t.status !== 'done' && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5); // Pega as 5 primeiras

  return (
    <div>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1>{getGreeting()}, {user.name?.split(' ')[0]}</h1>
        <p>Aqui está o resumo da sua produtividade.</p>
      </header>

      {/* Stats */}
      <section className="stat-grid">
        <div className="stat-card">
          <div className="flex items-center gap-sm" style={{ color: 'var(--status-low)' }}>
            <CheckCircle2 size={18} /> Concluídas (7 dias)
          </div>
          <div className="value">{completedLast7Days.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-sm" style={{ color: 'var(--status-medium)' }}>
            <Clock size={18} /> Pendentes
          </div>
          <div className="value">{pendingTasks.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-sm" style={{ color: 'var(--status-urgent)' }}>
            <AlertTriangle size={18} /> Atrasadas
          </div>
          <div className="value" style={{ color: overdueTasks.length > 0 ? 'var(--status-urgent)' : 'inherit' }}>
            {overdueTasks.length}
          </div>
        </div>
      </section>

      {/* Próximas a Vencer */}
      <section>
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--accent-primary)" /> Próximas a Vencer
        </h2>
        
        <div className="flex-col gap-sm">
          {upcomingTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Nenhuma tarefa com prazo pendente! 🎉
            </div>
          ) : (
            upcomingTasks.map(task => (
              <div key={task.id} className="card flex items-center justify-between" style={{ padding: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</h4>
                  <div className="flex items-center gap-sm" style={{ marginTop: '0.5rem' }}>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority === 'urgent' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Vence em: {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/tasks')}
                >
                  Ver no Kanban
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <button 
        className="fab-button"
        onClick={() => navigate('/tasks')} 
        title="Criar Nova Tarefa"
      >
        <Plus size={32} />
      </button>
    </div>
  );
}
