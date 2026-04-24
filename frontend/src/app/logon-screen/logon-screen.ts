import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CommonModule } from "@angular/common";
import { isEmpty } from '../helpers/validation.helpers';

@Component({
  selector: 'app-logon-screen',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './logon-screen.html',
  styleUrls: ['./logon-screen.css'],
})
export class LogonScreen implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    
  }

  
  onSubmit(): void {
    if (isEmpty(this.email) || isEmpty(this.password)) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed', error);
        this.isLoading = false;
        this.errorMessage = 'Login failed. Check your email or password.';
      }
    });
  }
}