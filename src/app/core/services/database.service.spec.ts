import { TestBed } from '@angular/core/testing';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatabaseService]
    });
    service = TestBed.inject(DatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
