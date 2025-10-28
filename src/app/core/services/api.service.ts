import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
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
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos

  /**
   * Obtener todas las tareas del servidor
   */
  getAllTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.apiUrl}/tasks`)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener una tarea específica por ID
   */
  getTask(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/tasks/${id}`)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Crear una nueva tarea en el servidor
   */
  createTask(task: { title: string; description: string }): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.apiUrl}/tasks`, task)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar una tarea existente
   */
  updateTask(id: string, task: Partial<{ title: string; description: string; completed: boolean }>): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/tasks/${id}`, task)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Alternar el estado de completado de una tarea
   */
  toggleTaskComplete(id: string): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${this.apiUrl}/tasks/${id}/toggle`, {})
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar una tarea
   */
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener cambios desde un timestamp específico
   */
  getChangesSince(timestamp: string): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.apiUrl}/tasks/changes`, {
      params: { since: timestamp }
    })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Sincronizar cambios locales con el servidor
   */
  syncTasks(syncRequest: SyncRequest): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(`${this.apiUrl}/tasks/sync`, syncRequest)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }

    console.error('Error en API:', errorMessage);
    return throwError(() => error);
  }
}
