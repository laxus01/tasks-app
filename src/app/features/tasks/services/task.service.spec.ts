import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { DatabaseService } from '../../../core/services/database.service';

describe('TaskService', () => {
  let service: TaskService;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DatabaseService', [
      'initializeDatabase',
      'getDatabase'
    ]);

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: DatabaseService, useValue: spy }
      ]
    });

    service = TestBed.inject(TaskService);
    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize database on initialize', async () => {
    databaseServiceSpy.initializeDatabase.and.returnValue(Promise.resolve());
    const mockDb = {
      query: jasmine.createSpy('query').and.returnValue(Promise.resolve({ values: [] }))
    };
    databaseServiceSpy.getDatabase.and.returnValue(mockDb as any);

    await service.initialize();

    expect(databaseServiceSpy.initializeDatabase).toHaveBeenCalled();
  });

  it('should load tasks from database', async () => {
    const mockTasks = [
      {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        completed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced'
      }
    ];

    const mockDb = {
      query: jasmine.createSpy('query').and.returnValue(
        Promise.resolve({ values: mockTasks })
      )
    };
    databaseServiceSpy.getDatabase.and.returnValue(mockDb as any);

    await service.loadTasks();

    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM tasks ORDER BY createdAt DESC');
  });

  it('should create a new task', async () => {
    const mockDb = {
      run: jasmine.createSpy('run').and.returnValue(
        Promise.resolve({ changes: { lastId: 1 } })
      ),
      query: jasmine.createSpy('query').and.returnValue(
        Promise.resolve({ values: [] })
      )
    };
    databaseServiceSpy.getDatabase.and.returnValue(mockDb as any);

    const taskDto = {
      title: 'New Task',
      description: 'New Description'
    };

    const result = await service.createTask(taskDto);

    expect(result.title).toBe(taskDto.title);
    expect(result.description).toBe(taskDto.description);
    expect(result.completed).toBe(false);
    expect(mockDb.run).toHaveBeenCalled();
  });
});
