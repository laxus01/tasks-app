import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
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
  private modalController = inject(ModalController);

  tasks: Task[] = [];
  showForm = false;
  editingTask: Task | null = null;
  isOnline = true;
  private tasksSubscription?: Subscription;
  private networkSubscription?: Subscription;

  async ngOnInit(): Promise<void> {
    try {
      await this.taskService.initialize();
      this.tasksSubscription = this.taskService.tasks$.subscribe(tasks => {
        this.tasks = tasks;
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
  }

  setupNetworkListener(): void {
    // Obtener estado inicial
    this.isOnline = this.networkService.isOnline();
    
    // Suscribirse a cambios de red
    this.networkSubscription = this.networkService.online$.subscribe(async (isOnline) => {
      const wasOffline = !this.isOnline;
      this.isOnline = isOnline;
      
      if (isOnline && wasOffline) {
        await this.showToast('Conexión restaurada. Sincronizando...', 'success');
      } else if (!isOnline) {
        await this.showToast('Sin conexión. Trabajando offline', 'warning');
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
      console.log('[TasksPage] onToggleTask called with taskId:', taskId);
      await this.taskService.toggleTaskCompletion(taskId);
      console.log('[TasksPage] Task toggled successfully');
    } catch (error) {
      console.error('[TasksPage] Error toggling task:', error);
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

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
