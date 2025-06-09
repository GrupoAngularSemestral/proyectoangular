import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchievementBadge } from './achievement-badge';

describe('AchievementBadge', () => {
  let component: AchievementBadge;
  let fixture: ComponentFixture<AchievementBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchievementBadge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AchievementBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
