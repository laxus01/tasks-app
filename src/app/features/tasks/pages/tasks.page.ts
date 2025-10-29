import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { NetworkService } from '../../../core/services/network.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: false
})
export class TasksPage implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private networkService = inject(NetworkService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  showForm = false;
  editingTask: Task | null = null;
  isOnline = true;
  private tasksSubscription?: Subscription;
  private networkSubscription?: Subscription;
  private syncCompletedSubscription?: Subscription;

  async ngOnInit(): Promise<void> {
    try {
      await this.taskService.initialize();
      
      // Suscribirse a cambios de tareas
      this.tasksSubscription = this.taskService.tasks$.subscribe(tasks => {
        this.tasks = tasks;
      });
      
      // Suscribirse a eventos de sincronización completada
      this.syncCompletedSubscription = this.taskService.syncCompleted$.subscribe(() => {
        // Forzar detección de cambios para actualizar el estado visual de las tareas
        this.cdr.detectChanges();
      });
      
      this.setupNetworkListener();
    } catch (error) {
      console.error('Error initializing tasks page:', error);
      await this.showToast('Error al inicializar la aplicación', 'danger');
    }
  }

  ngOnDestroy(): void {
    this.tasksSubscription?.unsubscribe();
    this.networkSubscription?.unsubscribe();
    this.syncCompletedSubscription?.unsubscribe();
  }

  setupNetworkListener(): void {
    // Obtener estado inicial
    this.isOnline = this.networkService.isOnline();
    
    // Suscribirse a cambios de red
    this.networkSubscription = this.networkService.online$.subscribe(async (isOnline) => {
      const wasOffline = !this.isOnline;
      
      // Actualizar el estado inmediatamente para que el banner se actualice
      this.isOnline = isOnline;
      
      // Forzar detección de cambios para actualizar el banner inmediatamente
      this.cdr.detectChanges();
      
      if (isOnline && wasOffline) {
        // Conexión recuperada - mostrar notificación
        await this.showToast('🌐 Conexión restaurada. Sincronizando tareas...', 'success', 2000);
        
        // Verificar después de un tiempo si la sincronización completó
        setTimeout(async () => {
          const pendingTasks = this.tasks.filter(t => t.syncStatus === 'pending');
          
          if (pendingTasks.length === 0) {
            await this.showToast('✅ Todas las tareas están sincronizadas', 'success', 2000);
          }
        }, 3000);
      } else if (!isOnline && wasOffline) {
        // Conexión perdida
        await this.showToast('📵 Sin conexión. Trabajando offline', 'warning', 2000);
      }
    });
  }

  onShowForm(): void {
    this.showForm = true;
    this.editingTask = null;
  }

  onHideForm(): void {
    this.showForm = false;
    this.editingTask = null;
  }

  async onCreateTask(taskData: { title: string; description: string }): Promise<void> {
    try {
      if (this.editingTask) {
        await this.taskService.updateTask({
          id: this.editingTask.id!,
          title: taskData.title,
          description: taskData.description
        });
        await this.showToast('Tarea actualizada correctamente', 'success');
      } else {
        await this.taskService.createTask(taskData);
        await this.showToast('Tarea creada correctamente', 'success');
      }
      this.onHideForm();
    } catch (error) {
      console.error('Error saving task:', error);
      await this.showToast('Error al guardar la tarea', 'danger');
    }
  }

  async onToggleTask(taskId: number): Promise<void> {
    try {
      await this.taskService.toggleTaskCompletion(taskId);
    } catch (error) {
      console.error('Error toggling task:', error);
      await this.showToast('Error al actualizar la tarea', 'danger');
    }
  }

  onEditTask(task: Task): void {
    this.editingTask = task;
    this.showForm = true;
  }

  async onDeleteTask(taskId: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta tarea?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.taskService.deleteTask(taskId);
              await this.showToast('Tarea eliminada correctamente', 'success');
            } catch (error) {
              console.error('Error deleting task:', error);
              await this.showToast('Error al eliminar la tarea', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async syncTasks(): Promise<void> {
    try {
      await this.taskService.syncTasks();
      await this.showToast('Tareas sincronizadas correctamente', 'success');
    } catch (error) {
      console.error('Error syncing tasks:', error);
      await this.showToast('Error al sincronizar tareas', 'danger');
    }
  }

  async doRefresh(event: any): Promise<void> {
    try {
      await this.taskService.loadTasks();
      if (this.isOnline) {
        await this.syncTasks();
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      event.target.complete();
    }
  }

  private async showToast(message: string, color: string, duration: number = 2000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
