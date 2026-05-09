import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, AlertCircle, Clock, X, Calendar, Trash2, Edit2, History, Users, Check, XCircle } from 'lucide-react';
import * as storage from '../services/storage';
import { Task, HistoryLog } from '../services/storage';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

import * as storage from '../services/storage';
import { Task, HistoryLog } from '../services/storage';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

export default function Kanban() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { theme } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [successGlowId, setSuccessGlowId] = useState<number | null>(null);
  
  const [historyModalTaskId, setHistoryModalTaskId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    category: 'Trabalho',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [tagInput, setTagInput] = useState('');

  // Board state
  const { data: boards = [] } = useQuery({ queryKey: ['boards'], queryFn: storage.getBoards });
  const [activeBoardId, setActiveBoardId] = useState('default');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', activeBoardId],
    queryFn: storage.getTasks
  });

  const { data: taskHistory = [] } = useQuery<HistoryLog[]>({
    queryKey: ['task_history', historyModalTaskId],
    queryFn: () => storage.getTaskHistory(historyModalTaskId!),
    enabled: !!historyModalTaskId
  });


  const createTask = useMutation({
    mutationFn: (newTask: any) => storage.saveTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    }
  });

  const updateTask = useMutation({
    mutationFn: (updatedTask: any) => storage.updateTask(updatedTask.id, updatedTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ id, status }: { id: number, status: any }) => storage.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) => storage.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    }
  });


  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      priority: task.priority || 'medium',
      category: task.category || 'Trabalho',
    });
    setTags(task.tags || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTaskId(null);
    setFormData({ title: '', description: '', due_date: '', priority: 'medium', category: 'Trabalho' });
    setTags([]);
    setTagInput('');
    setUserSearch('');
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      if (editingTaskId) {
        updateTask.mutate({ id: editingTaskId, ...formData, tags });
      } else {
        createTask.mutate({ ...formData, tags });
      }
    }
  };

  const handleDelete = () => {
    if (editingTaskId && window.confirm('Deseja excluir esta tarefa?')) {
      deleteTask.mutate(editingTaskId);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) return <div style={{ justifyContent: 'center', alignItems: 'center' }}>Carregando...</div>;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');
  
  const editingTask = tasks.find(t => t.id === editingTaskId);
  const isOwner = !editingTask || editingTask.user_id === user.id;

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', taskId.toString());
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    if ((theme === 'playful' || theme === 'dinosaur' || theme === 'pokemon') && Math.random() > 0.85) {
      const colors = theme === 'dinosaur' ? ['#14532d', '#d97706', '#84cc16'] :
                     theme === 'pokemon' ? ['#ef4444', '#fef08a', '#3b82f6'] :
                     ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00'];
                     
      confetti({
        particleCount: 2,
        startVelocity: 0,
        ticks: 50,
        gravity: 0.5,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: colors,
        shapes: ['circle', 'star']
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== status) {
        if (theme === 'playful' || theme === 'dinosaur' || theme === 'pokemon') {
          const colors = theme === 'dinosaur' ? ['#14532d', '#d97706', '#84cc16'] :
                     theme === 'pokemon' ? ['#ef4444', '#fef08a', '#3b82f6'] :
                     ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00'];
          // Fire confetti burst
          confetti({
            particleCount: 80,
            spread: 70,
            colors: colors,
            origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
          });
          // Neon glow timeout
          setSuccessGlowId(draggedTaskId);
          setTimeout(() => setSuccessGlowId(null), 1500);
        } else {
          // Serious subtle flash
          setSuccessGlowId(draggedTaskId);
          setTimeout(() => setSuccessGlowId(null), 500);
        }

        // Update status
        updateTaskStatus.mutate({ id: draggedTaskId, status });
      }
    }
    setDraggedTaskId(null);
  };

  return (
    <>
      <header className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>Minhas Tarefas</h1>
            <p>Organize seu fluxo de trabalho e colabore com o time.</p>
          </div>
          
          <select 
            className="input" 
            style={{ width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 1rem' }}
            value={activeBoardId}
            onChange={(e) => {
              const id = e.target.value;
              if (id === 'NEW') {
                const name = window.prompt('Nome do novo quadro:');
                if (name) {
                  storage.createBoard(name).then((newBoard) => {
                    queryClient.invalidateQueries({ queryKey: ['boards'] });
                    setActiveBoardId(newBoard.id);
                    storage.setActiveBoard(newBoard.id);
                  });
                }
              } else {
                setActiveBoardId(id);
                storage.setActiveBoard(id);
              }
            }}
          >
            {boards.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
            <option value="NEW">+ Novo Quadro...</option>
          </select>
        </div>
        
        <button className="btn btn-primary" onClick={() => { setEditingTaskId(null); setIsModalOpen(true); }}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nova Tarefa
        </button>
      </header>

      {/* Kanban Board */}
      <section className="kanban-board">
        <KanbanColumn title={`A Fazer (${todoTasks.length})`} status="todo" onDrop={handleDrop}>
          {todoTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              currentUser={user}
              isDragging={draggedTaskId === task.id}
              isSuccessGlow={successGlowId === task.id}
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onEdit={() => openEditModal(task)}
              onHistory={() => setHistoryModalTaskId(task.id)}
              onRespondAssignment={(status, reason) => respondAssignment.mutate({ taskId: task.id, status, reason })}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title={`Fazendo (${doingTasks.length})`} status="doing" onDrop={handleDrop}>
          {doingTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              currentUser={user}
              isDragging={draggedTaskId === task.id}
              isSuccessGlow={successGlowId === task.id}
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onEdit={() => openEditModal(task)}
              onHistory={() => setHistoryModalTaskId(task.id)}
              onRespondAssignment={(status, reason) => respondAssignment.mutate({ taskId: task.id, status, reason })}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title={`Concluído (${doneTasks.length})`} status="done" onDrop={handleDrop}>
          {doneTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              currentUser={user}
              isDragging={draggedTaskId === task.id}
              isSuccessGlow={successGlowId === task.id}
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onEdit={() => openEditModal(task)}
              onHistory={() => setHistoryModalTaskId(task.id)}
              onRespondAssignment={(status, reason) => respondAssignment.mutate({ taskId: task.id, status, reason })}
            />
          ))}
        </KanbanColumn>
      </section>

      {/* Modal Tarefa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editingTaskId ? (isOwner ? 'Editar Tarefa' : 'Visualizar Tarefa') : 'Criar Nova Tarefa'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex-col gap-md">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Título</label>
                <input disabled={!isOwner} required className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="O que precisa ser feito?" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Descrição / Comentários</label>
                <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalhes opcionais..." />
              </div>

              <div className="flex gap-md">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Data de Entrega</label>
                  <input disabled={!isOwner} type="date" className="input" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Prioridade</label>
                  <select disabled={!isOwner} className="input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="urgent">Alta / Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Categoria</label>
                <select disabled={!isOwner} className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                  <option value="Estudos">Estudos</option>
                  <option value="Casa">Casa</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tags (Pressione Enter)</label>
                <input 
                  disabled={!isOwner}
                  type="text" 
                  className="input" 
                  value={tagInput} 
                  onChange={e => setTagInput(e.target.value)} 
                  onKeyDown={handleAddTag}
                  placeholder="ex: cliente x, reunião" 
                />
                <div style={{ marginTop: '0.5rem' }}>
                  {tags.map(tag => (
                    <span key={tag} className="tag-pill">
                      {tag} {isOwner && <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>}
                    </span>
                  ))}
                </div>
              </div>


              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editingTaskId && isOwner ? (
                  <button type="button" onClick={handleDelete} style={{ background: 'none', border: 'none', color: 'var(--status-urgent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trash2 size={16} /> Excluir
                  </button>
                ) : (
                  <div></div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={createTask.isPending || updateTask.isPending}>
                    {editingTaskId ? 'Salvar Edição' : 'Criar Tarefa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalTaskId && (
        <div className="modal-overlay" onClick={() => setHistoryModalTaskId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={20} /> Histórico da Tarefa</h2>
              <button onClick={() => setHistoryModalTaskId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {taskHistory.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Carregando histórico...</div>
              ) : (
                taskHistory.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {log.avatar ? (
                      <img src={log.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        {log.name?.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <strong>{log.name}</strong> <span style={{ color: 'var(--text-secondary)' }}>{log.action}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px' }}>
                        {log.details}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KanbanColumn({ title, status, onDrop, children }: { title: string, status: string, onDrop: (e: React.DragEvent, status: string) => void, children: React.ReactNode }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e, status);
  };

  return (
    <div 
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 className="column-header">{title}</h3>
      {children}
    </div>
  );
}

function TaskCard({ 
  task, 
  currentUser,
  isDragging,
  isSuccessGlow,
  onDragStart, 
  onDrag,
  onDragEnd,
  onEdit,
  onHistory,
  onRespondAssignment
}: { 
  task: Task, 
  currentUser: any,
  isDragging: boolean,
  isSuccessGlow: boolean,
  onDragStart: (e: React.DragEvent) => void, 
  onDrag: (e: React.DragEvent) => void,
  onDragEnd: (e: React.DragEvent) => void,
  onEdit: () => void,
  onHistory: () => void,
  onRespondAssignment: (status: string, reason?: string) => void
}) {
  const myAssignment = task.assignments?.find(a => a.user_id === currentUser.id);
  const isPendingAssignment = myAssignment?.status === 'pending';
  
  const acceptedAssignees = task.assignments?.filter(a => a.status === 'accepted') || [];

  const handleReject = () => {
    const reason = prompt('Por qual motivo você está recusando a tarefa?');
    if (reason !== null) {
      onRespondAssignment('rejected', reason);
    }
  };

  const getDueStatus = () => {
    if (task.status === 'done' || !task.due_date) return null;
    const now = new Date();
    const due = new Date(task.due_date);
    due.setHours(23, 59, 59, 999);
    
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) {
      return { text: '🚨 Atrasada', color: '#dc2626', bg: '#fef2f2' };
    } else if (diffDays <= 2) {
      return { text: '⚠️ Vencendo', color: '#d97706', bg: '#fffbeb' };
    } else {
      return { text: '✅ No prazo', color: '#16a34a', bg: '#f0fdf4' };
    }
  };

  const dueStatus = getDueStatus();

  return (
    <div 
      className={`card ${isDragging ? 'is-dragging' : ''} ${isSuccessGlow ? 'success-glow' : ''}`}
      draggable={!isPendingAssignment} // Can't drag if pending
      onDragStart={!isPendingAssignment ? onDragStart : undefined}
      onDrag={!isPendingAssignment ? onDrag : undefined}
      onDragEnd={!isPendingAssignment ? onDragEnd : undefined}
      style={{ cursor: isPendingAssignment ? 'default' : 'grab' }}
    >
      <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
        <div>
          {dueStatus && (
            <span style={{ 
              display: 'inline-block', 
              fontSize: '0.65rem', 
              fontWeight: 700, 
              color: dueStatus.color, 
              backgroundColor: dueStatus.bg, 
              padding: '2px 6px', 
              borderRadius: '12px', 
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: `0 0 8px ${dueStatus.color}40`
            }}>
              {dueStatus.text}
            </span>
          )}
          <h4 style={{ fontSize: '1rem', fontWeight: 500, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
            {task.title}
          </h4>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onHistory} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Ver Histórico">
            <History size={14} />
          </button>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Editar Tarefa">
            <Edit2 size={14} />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
      )}

      {/* Pending Assignment Controls */}
      {isPendingAssignment && (
        <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Convite Pendente</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => onRespondAssignment('accepted')} style={{ background: 'var(--status-low)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Check size={12} /></button>
            <button onClick={handleReject} style={{ background: 'var(--status-urgent)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><XCircle size={12} /></button>
          </div>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {task.tags.map(tag => (
            <span key={tag} className="tag-pill" style={{ marginBottom: 0, padding: '2px 6px', fontSize: '0.65rem' }}>#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        <div className="flex-col gap-xs">
          <span className={`badge badge-${task.priority}`} style={{ alignSelf: 'flex-start' }}>
            {task.priority === 'urgent' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>
          {task.due_date && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        {/* Assigned Avatars */}
        {acceptedAssignees.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
            {acceptedAssignees.slice(0, 3).map((a, i) => (
              <img 
                key={a.user_id} 
                src={a.avatar} 
                title={a.name}
                style={{ width: '24px', height: '24px', borderRadius: '50%', marginLeft: '-8px', border: '2px solid var(--bg-secondary)' }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
