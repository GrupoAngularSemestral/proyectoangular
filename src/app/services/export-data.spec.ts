import { TestBed } from '@angular/core/testing';

import { ExportData } from './export-data';

describe('ExportData', () => {
  let service: ExportData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
