import { TestBed } from '@angular/core/testing';

import { Canciones } from './canciones';

describe('Canciones', () => {
  let service: Canciones;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Canciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
