import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TaskListComponent } from './task-list.component';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskListComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit taskToggle event when onToggleTask is called', () => {
    spyOn(component.taskToggle, 'emit');
    const taskId = 1;

    component.onToggleTask(taskId);

    expect(component.taskToggle.emit).toHaveBeenCalledWith(taskId);
  });

  it('should emit taskEdit event when onEditTask is called', () => {
    spyOn(component.taskEdit, 'emit');
    const task = {
      id: 1,
      title: 'Test',
      description: 'Test',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    component.onEditTask(task);

    expect(component.taskEdit.emit).toHaveBeenCalledWith(task);
  });

  it('should emit taskDelete event when onDeleteTask is called', () => {
    spyOn(component.taskDelete, 'emit');
    const taskId = 1;

    component.onDeleteTask(taskId);

    expect(component.taskDelete.emit).toHaveBeenCalledWith(taskId);
  });
});
