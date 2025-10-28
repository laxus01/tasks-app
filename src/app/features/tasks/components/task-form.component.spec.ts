import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TaskFormComponent } from './task-form.component';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskFormComponent],
      imports: [IonicModule.forRoot(), ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('description')?.value).toBe('');
  });

  it('should mark form as invalid when fields are empty', () => {
    expect(component.taskForm.valid).toBeFalsy();
  });

  it('should mark form as valid when fields are filled correctly', () => {
    component.taskForm.patchValue({
      title: 'Test Task',
      description: 'Test Description'
    });

    expect(component.taskForm.valid).toBeTruthy();
  });

  it('should emit formSubmit event when form is submitted with valid data', () => {
    spyOn(component.formSubmit, 'emit');
    component.taskForm.patchValue({
      title: 'Test Task',
      description: 'Test Description'
    });

    component.onSubmit();

    expect(component.formSubmit.emit).toHaveBeenCalledWith({
      title: 'Test Task',
      description: 'Test Description'
    });
  });

  it('should not emit formSubmit event when form is invalid', () => {
    spyOn(component.formSubmit, 'emit');
    component.onSubmit();

    expect(component.formSubmit.emit).not.toHaveBeenCalled();
  });

  it('should emit formCancel event when cancel is clicked', () => {
    spyOn(component.formCancel, 'emit');
    component.onCancel();

    expect(component.formCancel.emit).toHaveBeenCalled();
  });
});
