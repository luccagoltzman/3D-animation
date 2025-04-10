import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Scene3dComponent } from './scene3d.component';

describe('Scene3dComponent', () => {
  let component: Scene3dComponent;
  let fixture: ComponentFixture<Scene3dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scene3dComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Scene3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
