import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../models/task.model';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  standalone: false
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() taskToggle = new EventEmitter<number>();
  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<number>();

  onToggleTask(taskId: number | undefined): void {
    console.log('[TaskListComponent] onToggleTask called with taskId:', taskId);
    if (taskId !== undefined) {
      this.taskToggle.emit(taskId);
      console.log('[TaskListComponent] taskToggle event emitted');
    } else {
      console.warn('[TaskListComponent] taskId is undefined');
    }
  }

  onEditTask(task: Task): void {
    this.taskEdit.emit(task);
  }

  onDeleteTask(taskId: number | undefined): void {
    if (taskId !== undefined) {
      this.taskDelete.emit(taskId);
    }
  }

  trackByTaskId(index: number, task: Task): number | undefined {
    return task.id;
  }
}
