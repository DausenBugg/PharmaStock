/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogonScreen } from './logon-screen';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';


describe('LogonScreen', () => {
  let component: LogonScreen;
  let fixture: ComponentFixture<LogonScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LogonScreen,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogonScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have username and password inputs', () => {
    const usernameInput = fixture.debugElement.query(By.css('#username'));
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    expect(usernameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it('should have a login button', () => {
    const button = fixture.debugElement.query(By.css('#login-btn'));
    expect(button).toBeTruthy();
  });

  it('should call onSubmit when login button is clicked', () => {
    spyOn(component, 'onSubmit');

    const button = fixture.debugElement.query(By.css('#login-btn'));
    button.nativeElement.click();

    expect(component.onSubmit).toHaveBeenCalled();
  });
});
