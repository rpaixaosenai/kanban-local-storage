export type TaskAssignment = {
  user_id: number;
  name: string;
  avatar: string;
  status: 'pending' | 'accepted' | 'rejected';
  reject_reason: string | null;
};

export type Task = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'urgent';
  status: 'todo' | 'doing' | 'done';
  category: string;
  tags: string[];
  assignments?: TaskAssignment[];
};

export type HistoryLog = {
  id: number;
  task_id: number;
  action: string;
  details: string;
  created_at: string;
  name: string;
  avatar: string;
};

export type Board = {
  id: string;
  name: string;
  tasks: Task[];
  history: HistoryLog[];
};

const STORAGE_KEY = 'kanban_local_data';

const INITIAL_DATA: { boards: Board[], activeBoardId: string } = {
  boards: [
    {
      id: 'default',
      name: 'Meu Kanban',
      tasks: [],
      history: []
    }
  ],
  activeBoardId: 'default'
};

function getData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(data);
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getTasks(): Promise<Task[]> {
  const data = getData();
  const board = data.boards.find((b: any) => b.id === data.activeBoardId);
  return board ? board.tasks : [];
}

export async function getTaskHistory(taskId: number): Promise<HistoryLog[]> {
  const data = getData();
  const board = data.boards.find((b: any) => b.id === data.activeBoardId);
  return board ? board.history.filter((h: any) => h.task_id === taskId) : [];
}

export async function saveTask(task: Omit<Task, 'id' | 'user_id'>): Promise<Task> {
  const data = getData();
  const boardIndex = data.boards.findIndex((b: any) => b.id === data.activeBoardId);
  const board = data.boards[boardIndex];
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const newTask: Task = {
    ...task,
    id: Date.now(),
    user_id: user.id || 1,
    assignments: []
  };
  
  board.tasks.push(newTask);
  
  // Add history
  board.history.push({
    id: Date.now() + 1,
    task_id: newTask.id,
    action: 'Criou a tarefa',
    details: `Título: ${newTask.title}`,
    created_at: new Date().toISOString(),
    name: user.name || 'Rafael',
    avatar: user.avatar || ''
  });
  
  saveData(data);
  return newTask;
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  const data = getData();
  const boardIndex = data.boards.findIndex((b: any) => b.id === data.activeBoardId);
  const board = data.boards[boardIndex];
  
  const taskIndex = board.tasks.findIndex((t: any) => t.id === id);
  if (taskIndex === -1) throw new Error('Task not found');
  
  const oldTask = board.tasks[taskIndex];
  const updatedTask = { ...oldTask, ...updates };
  board.tasks[taskIndex] = updatedTask;
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Add history if status changed
  if (updates.status && updates.status !== oldTask.status) {
    board.history.push({
      id: Date.now(),
      task_id: id,
      action: 'Alterou o status',
      details: `De ${oldTask.status} para ${updates.status}`,
      created_at: new Date().toISOString(),
      name: user.name || 'Rafael',
      avatar: user.avatar || ''
    });
  } else {
    board.history.push({
      id: Date.now(),
      task_id: id,
      action: 'Editou a tarefa',
      details: 'Campos alterados',
      created_at: new Date().toISOString(),
      name: user.name || 'Rafael',
      avatar: user.avatar || ''
    });
  }
  
  saveData(data);
  return updatedTask;
}

export async function deleteTask(id: number): Promise<void> {
  const data = getData();
  const boardIndex = data.boards.findIndex((b: any) => b.id === data.activeBoardId);
  const board = data.boards[boardIndex];
  
  board.tasks = board.tasks.filter((t: any) => t.id !== id);
  board.history = board.history.filter((h: any) => h.task_id !== id);
  
  saveData(data);
}

// Multi-board management
export async function getBoards() {
  return getData().boards;
}

export async function createBoard(name: string) {
  const data = getData();
  const newBoard: Board = {
    id: Date.now().toString(),
    name,
    tasks: [],
    history: []
  };
  data.boards.push(newBoard);
  saveData(data);
  return newBoard;
}

export async function setActiveBoard(id: string) {
  const data = getData();
  data.activeBoardId = id;
  saveData(data);
}
