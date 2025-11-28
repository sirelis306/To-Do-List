import { TestBed } from '@angular/core/testing';

import { TranscriptorService } from './transcriptor-service';

describe('TranscriptorService', () => {
  let service: TranscriptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranscriptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
