import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-logon-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './logon-screen.html',
  styleUrls: ['./logon-screen.css'],
})
export class LogonScreen {

  username: string = '';
  password: string = '';

  constructor(private router: Router) {}

  onSubmit(): void {
    console.log('Login attempted', this.username, this.password);

    // Temporary navigation (replace with auth later)
    this.router.navigate(['/dashboard']);
  }

}
