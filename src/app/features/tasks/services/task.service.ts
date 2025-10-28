import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { DatabaseService } from '../../../core/services/database.service';
import { ApiService, TaskChange, SyncRequest } from '../../../core/services/api.service';
import { NetworkService } from '../../../core/services/network.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private databaseService = inject(DatabaseService);
  private apiService = inject(ApiService);
  private networkService = inject(NetworkService);
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
  private isSyncing = false;

  async initialize(): Promise<void> {
    await this.databaseService.initializeDatabase();
    await this.loadTasks();
    
    // Configurar listener de cambios de red
    this.networkService.online$.subscribe(async (isOnline) => {
      if (isOnline && !this.isSyncing) {
        console.log('Conexión detectada, iniciando sincronización...');
        await this.syncTasks();
      }
    });
  }

  async loadTasks(): Promise<void> {
    try {
      const db = this.databaseService.getDatabase();
      const result = await db.query('SELECT * FROM tasks ORDER BY createdAt DESC');
      
      const tasks: Task[] = result.values?.map((row: any) => ({
        id: row.id,
        serverId: row.serverId,
        title: row.title,
        description: row.description,
        completed: row.completed === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        syncStatus: row.syncStatus as 'synced' | 'pending' | 'error'
      })) || [];

      this.tasksSubject.next(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  }

  async createTask(taskDto: CreateTaskDto): Promise<Task> {
    try {
      const db = this.databaseService.getDatabase();
      const now = new Date().toISOString();
      
      // Siempre guardar localmente primero (offline-first)
      const query = `
        INSERT INTO tasks (title, description, completed, createdAt, updatedAt, syncStatus, serverId)
        VALUES (?, ?, 0, ?, ?, 'pending', NULL)
      `;
      
      const result = await db.run(query, [
        taskDto.title,
        taskDto.description,
        now,
        now
      ]);

      const newTask: Task = {
        id: result.changes?.lastId,
        title: taskDto.title,
        description: taskDto.description,
        completed: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending'
      };

      await this.loadTasks();
      
      // Intentar sincronizar si hay conexión
      if (this.networkService.isOnline()) {
        this.syncTasks().catch(err => console.error('Error en sincronización automática:', err));
      }
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskDto: UpdateTaskDto): Promise<void> {
    try {
      const db = this.databaseService.getDatabase();
      const now = new Date().toISOString();
      
      const updates: string[] = [];
      const values: any[] = [];

      if (taskDto.title !== undefined) {
        updates.push('title = ?');
        values.push(taskDto.title);
      }

      if (taskDto.description !== undefined) {
        updates.push('description = ?');
        values.push(taskDto.description);
      }

      if (taskDto.completed !== undefined) {
        updates.push('completed = ?');
        values.push(taskDto.completed ? 1 : 0);
      }

      updates.push('updatedAt = ?');
      values.push(now);

      updates.push('syncStatus = ?');
      values.push('pending');

      values.push(taskDto.id);

      const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
      await db.run(query, values);
      await this.loadTasks();
      
      // Intentar sincronizar si hay conexión
      if (this.networkService.isOnline()) {
        this.syncTasks().catch(err => console.error('Error en sincronización automática:', err));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      const db = this.databaseService.getDatabase();
      
      // Si tiene serverId, marcar como pendiente de eliminación en servidor
      const task = this.tasksSubject.value.find(t => t.id === id);
      if (task?.serverId && this.networkService.isOnline()) {
        try {
          await firstValueFrom(this.apiService.deleteTask(task.serverId));
        } catch (error) {
          console.error('Error eliminando en servidor, se eliminará localmente:', error);
        }
      }
      
      await db.run('DELETE FROM tasks WHERE id = ?', [id]);
      await this.loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async toggleTaskCompletion(id: number): Promise<void> {
    try {
      const tasks = this.tasksSubject.value;
      const task = tasks.find(t => t.id === id);
      
      if (task) {
        await this.updateTask({
          id,
          completed: !task.completed
        });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }

  async syncTasks(): Promise<void> {
    if (this.isSyncing || !this.networkService.isOnline()) {
      console.log('Sincronización omitida: ya en proceso o sin conexión');
      return;
    }

    this.isSyncing = true;
    console.log('Iniciando sincronización...');

    try {
      const db = this.databaseService.getDatabase();
      
      // 1. Obtener cambios locales pendientes
      const pendingResult = await db.query(
        "SELECT * FROM tasks WHERE syncStatus = 'pending'"
      );
      
      const pendingTasks = pendingResult.values || [];
      const changes: TaskChange[] = [];

      // 2. Preparar cambios para enviar al servidor
      for (const task of pendingTasks) {
        const change: TaskChange = {
          localId: task.id,
          serverId: task.serverId || undefined,
          action: task.serverId ? 'update' : 'create',
          data: {
            title: task.title,
            description: task.description,
            completed: task.completed === 1,
            updatedAt: task.updatedAt
          }
        };
        changes.push(change);
      }

      // 3. Obtener timestamp de última sincronización
      const lastSyncTimestamp = await this.databaseService.getLastSyncTimestamp();

      // 4. Enviar cambios al servidor y recibir cambios del servidor
      const syncRequest: SyncRequest = {
        lastSyncTimestamp,
        changes
      };

      const syncResponse = await firstValueFrom(this.apiService.syncTasks(syncRequest));

      // 5. Aplicar cambios del servidor a la base de datos local
      for (const serverChange of syncResponse.serverChanges) {
        if (serverChange.action === 'create' || serverChange.action === 'update') {
          if (serverChange.data) {
            // Si tiene localId, actualizar la tarea local con el serverId
            if (serverChange.localId) {
              await db.run(
                `UPDATE tasks SET serverId = ?, syncStatus = 'synced' WHERE id = ?`,
                [serverChange.serverId, serverChange.localId]
              );
            } else {
              // Es una tarea nueva del servidor, insertarla
              const existingTask = await db.query(
                'SELECT id FROM tasks WHERE serverId = ?',
                [serverChange.serverId]
              );

              if (existingTask.values && existingTask.values.length > 0) {
                // Actualizar tarea existente
                await db.run(
                  `UPDATE tasks SET title = ?, description = ?, completed = ?, updatedAt = ?, syncStatus = 'synced' WHERE serverId = ?`,
                  [
                    serverChange.data.title,
                    serverChange.data.description,
                    serverChange.data.completed ? 1 : 0,
                    serverChange.data.updatedAt,
                    serverChange.serverId
                  ]
                );
              } else {
                // Insertar nueva tarea del servidor
                await db.run(
                  `INSERT INTO tasks (serverId, title, description, completed, createdAt, updatedAt, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    serverChange.serverId,
                    serverChange.data.title,
                    serverChange.data.description,
                    serverChange.data.completed ? 1 : 0,
                    serverChange.data.createdAt,
                    serverChange.data.updatedAt
                  ]
                );
              }
            }
          }
        } else if (serverChange.action === 'delete') {
          // Eliminar tarea que fue eliminada en el servidor
          await db.run('DELETE FROM tasks WHERE serverId = ?', [serverChange.serverId]);
        }
      }

      // 6. Actualizar timestamp de última sincronización
      await this.databaseService.updateLastSyncTimestamp(syncResponse.syncTimestamp);

      // 7. Recargar tareas
      await this.loadTasks();
      
      console.log('Sincronización completada exitosamente');
    } catch (error) {
      console.error('Error syncing tasks:', error);
      
      // Marcar tareas con error de sincronización
      try {
        const db = this.databaseService.getDatabase();
        await db.run("UPDATE tasks SET syncStatus = 'error' WHERE syncStatus = 'pending'");
        await this.loadTasks();
      } catch (dbError) {
        console.error('Error actualizando estado de sincronización:', dbError);
      }
      
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  getTasks(): Task[] {
    return this.tasksSubject.value;
  }

  getTaskById(id: number): Task | undefined {
    return this.tasksSubject.value.find(task => task.id === id);
  }
}
