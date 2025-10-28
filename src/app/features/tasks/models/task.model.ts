export interface Task {
  id?: number;
  serverId?: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

export interface CreateTaskDto {
  title: string;
  description: string;
}

export interface UpdateTaskDto {
  id: number;
  title?: string;
  description?: string;
  completed?: boolean;
}
