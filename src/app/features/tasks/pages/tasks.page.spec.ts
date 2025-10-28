import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TasksPage } from './tasks.page';
import { TaskService } from '../services/task.service';
import { of } from 'rxjs';

describe('TasksPage', () => {
  let component: TasksPage;
  let fixture: ComponentFixture<TasksPage>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TaskService', [
      'initialize',
      'loadTasks',
      'createTask',
      'updateTask',
      'deleteTask',
      'toggleTaskCompletion',
      'syncTasks'
    ], {
      tasks$: of([])
    });

    await TestBed.configureTestingModule({
      declarations: [TasksPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: TaskService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksPage);
    component = fixture.componentInstance;
    taskServiceSpy = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize task service on ngOnInit', async () => {
    taskServiceSpy.initialize.and.returnValue(Promise.resolve());

    await component.ngOnInit();

    expect(taskServiceSpy.initialize).toHaveBeenCalled();
  });

  it('should show form when onShowForm is called', () => {
    component.onShowForm();

    expect(component.showForm).toBe(true);
    expect(component.editingTask).toBeNull();
  });

  it('should hide form when onHideForm is called', () => {
    component.showForm = true;
    component.onHideForm();

    expect(component.showForm).toBe(false);
    expect(component.editingTask).toBeNull();
  });

  it('should create task when onCreateTask is called without editing task', async () => {
    taskServiceSpy.createTask.and.returnValue(Promise.resolve({
      id: 1,
      title: 'Test',
      description: 'Test',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const taskData = { title: 'Test', description: 'Test' };
    await component.onCreateTask(taskData);

    expect(taskServiceSpy.createTask).toHaveBeenCalledWith(taskData);
    expect(component.showForm).toBe(false);
  });
});
