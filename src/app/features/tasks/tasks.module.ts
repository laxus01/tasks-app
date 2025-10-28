import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TasksRoutingModule } from './tasks-routing.module';
import { TasksPage } from './pages/tasks.page';
import { TaskListComponent } from './components/task-list.component';
import { TaskFormComponent } from './components/task-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TasksRoutingModule
  ],
  declarations: [
    TasksPage,
    TaskListComponent,
    TaskFormComponent
  ]
})
export class TasksModule { }
