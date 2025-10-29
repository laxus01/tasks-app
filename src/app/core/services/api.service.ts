import { Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { from, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SyncRequest {
  lastSyncTimestamp: string;
  changes: TaskChange[];
}

export interface TaskChange {
  localId?: number;
  serverId?: string;
  action: 'create' | 'update' | 'delete';
  data: {
    title: string;
    description: string;
    completed: boolean;
    updatedAt: string;
  };
}

export interface SyncResponse {
  syncTimestamp: string;
  serverChanges: ServerChange[];
}

export interface ServerChange {
  localId?: number;
  serverId: string;
  action: 'create' | 'update' | 'delete';
  data?: TaskResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private axiosInstance: AxiosInstance;
  private readonly apiUrl = environment.apiUrl;
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: this.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para manejo de errores
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }

  /**
   * Obtener todas las tareas del servidor
   */
  getAllTasks(): Observable<TaskResponse[]> {
    return from(
      this.axiosInstance.get<TaskResponse[]>('/tasks')
        .then(response => response.data)
    );
  }

  /**
   * Obtener una tarea específica por ID
   */
  getTask(id: string): Observable<TaskResponse> {
    return from(
      this.axiosInstance.get<TaskResponse>(`/tasks/${id}`)
        .then(response => response.data)
    );
  }

  /**
   * Crear una nueva tarea en el servidor
   */
  createTask(task: { title: string; description: string }): Observable<TaskResponse> {
    return from(
      this.axiosInstance.post<TaskResponse>('/tasks', task)
        .then(response => response.data)
    );
  }

  /**
   * Actualizar una tarea existente
   */
  updateTask(id: string, task: Partial<{ title: string; description: string; completed: boolean }>): Observable<TaskResponse> {
    return from(
      this.axiosInstance.put<TaskResponse>(`/tasks/${id}`, task)
        .then(response => response.data)
    );
  }

  /**
   * Alternar el estado de completado de una tarea
   */
  toggleTaskComplete(id: string): Observable<TaskResponse> {
    return from(
      this.axiosInstance.patch<TaskResponse>(`/tasks/${id}/toggle`, {})
        .then(response => response.data)
    );
  }

  /**
   * Eliminar una tarea
   */
  deleteTask(id: string): Observable<void> {
    return from(
      this.axiosInstance.delete<void>(`/tasks/${id}`)
        .then(response => response.data)
    );
  }

  /**
   * Obtener cambios desde un timestamp específico
   */
  getChangesSince(timestamp: string): Observable<TaskResponse[]> {
    return from(
      this.axiosInstance.get<TaskResponse[]>('/tasks/changes', {
        params: { since: timestamp }
      })
        .then(response => response.data)
    );
  }

  /**
   * Sincronizar cambios locales con el servidor
   */
  syncTasks(syncRequest: SyncRequest): Observable<SyncResponse> {
    return from(
      this.axiosInstance.post<SyncResponse>('/tasks/sync', syncRequest)
        .then(response => response.data)
    );
  }

  /**
   * Manejo de errores de Axios
   */
  private handleError(error: AxiosError): Promise<never> {
    let errorMessage = 'Error desconocido';

    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      errorMessage = `Código de error: ${error.response.status}\nMensaje: ${error.message}`;
      console.error('Error en API (respuesta):', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      errorMessage = `Error de red: No se recibió respuesta del servidor`;
      console.error('Error en API (sin respuesta):', error.request);
    } else {
      // Algo sucedió al configurar la petición
      errorMessage = `Error: ${error.message}`;
      console.error('Error en API (configuración):', error.message);
    }

    console.error('Error en API:', errorMessage);
    return Promise.reject(error);
  }
}
