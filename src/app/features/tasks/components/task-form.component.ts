import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task } from '../models/task.model';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: false
})
export class TaskFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  
  @Input() task: Task | null = null;
  @Output() formSubmit = new EventEmitter<{ title: string; description: string }>();
  @Output() formCancel = new EventEmitter<void>();

  taskForm: FormGroup;

  constructor() {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.formSubmit.emit(this.taskForm.value);
      this.taskForm.reset();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
    this.taskForm.reset();
  }

  get title() {
    return this.taskForm.get('title');
  }

  get description() {
    return this.taskForm.get('description');
  }
}
