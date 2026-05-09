import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Send, CheckCircle2, Circle, AlertTriangle, Loader2 } from 'lucide-react';
import * as storage from '../services/storage';

type GeneratedTask = {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'urgent';
  category: string;
};

export default function AIAgent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isMockResponse, setIsMockResponse] = useState(false);

  const generateTasks = useMutation({
    mutationFn: async (userPrompt: string) => {
      // Mock AI Generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        tasks: [
          { title: 'Passo 1: Planejamento', description: `Planejar ${userPrompt}`, priority: 'medium', category: 'Planejamento' },
          { title: 'Passo 2: Execução', description: `Executar ${userPrompt}`, priority: 'urgent', category: 'Execução' },
          { title: 'Passo 3: Finalização', description: `Finalizar ${userPrompt}`, priority: 'low', category: 'Revisão' },
        ],
        isMock: true
      };
    },
    onSuccess: (data) => {
      setGeneratedTasks(data.tasks);
      setIsMockResponse(data.isMock);
      // Select all by default
      setSelectedIndices(new Set(data.tasks.map((_: any, i: number) => i)));
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao gerar tarefas.');
    }
  });

  const saveTasks = useMutation({
    mutationFn: async (tasksToSave: GeneratedTask[]) => {
      for (const t of tasksToSave) {
        await storage.saveTask({
          ...t,
          status: 'todo',
          due_date: null,
          tags: ['AI-Generated']
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGeneratedTasks(null);
    generateTasks.mutate(prompt);
  };

  const handleToggleSelect = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const handleApprove = () => {
    if (!generatedTasks) return;
    const tasksToSave = generatedTasks.filter((_, i) => selectedIndices.has(i));
    if (tasksToSave.length === 0) {
      alert('Selecione pelo menos uma tarefa para aprovar.');
      return;
    }
    saveTasks.mutate(tasksToSave);
  };

  return (
    <>
      <header className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles color="var(--accent-primary)" /> Agente IA
          </h1>
          <p>Diga o que você quer fazer, e eu crio os passos para você.</p>
        </div>
      </header>

      <section style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            className="input" 
            style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }}
            placeholder="Ex: Quero organizar uma festa de aniversário surpresa..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={generateTasks.isPending || saveTasks.isPending}
            required
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '0 1.5rem', borderRadius: '12px' }}
            disabled={generateTasks.isPending || saveTasks.isPending || !prompt.trim()}
          >
            {generateTasks.isPending ? <Loader2 size={24} className="spin" /> : <Send size={24} />}
          </button>
        </form>

        {generateTasks.isPending && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <Sparkles size={48} color="var(--accent-primary)" style={{ animation: 'float 2s infinite ease-in-out', margin: '0 auto 1rem auto' }} />
            <p>Pensando nas melhores etapas para o seu projeto...</p>
          </div>
        )}

        {generatedTasks && !generateTasks.isPending && (
          <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Prévia de Tarefas ({selectedIndices.size}/{generatedTasks.length})</h2>
              {isMockResponse && (
                <span style={{ fontSize: '0.75rem', background: 'var(--status-urgent)', color: 'white', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> API Key não detectada (Modo Simulador)
                </span>
              )}
            </div>

            <div className="flex-col gap-sm" style={{ marginBottom: '2rem' }}>
              {generatedTasks.map((task, i) => {
                const isSelected = selectedIndices.has(i);
                return (
                  <div 
                    key={i} 
                    onClick={() => handleToggleSelect(i)}
                    style={{ 
                      padding: '1rem', 
                      background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', marginTop: '2px' }}>
                      {isSelected ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '1.1rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{task.title}</strong>
                        <span className={`badge badge-${task.priority}`}>{task.priority === 'urgent' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>{task.description}</p>
                      <span className="tag-pill" style={{ marginBottom: 0 }}>{task.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setGeneratedTasks(null)}>
                Descartar Todas
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleApprove}
                disabled={selectedIndices.size === 0 || saveTasks.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {saveTasks.isPending ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                Aprovar & Criar ({selectedIndices.size})
              </button>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
