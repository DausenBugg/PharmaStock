import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logon-screen',
  standalone: true,
  templateUrl: './logon-screen.html',
  styleUrls: ['./logon-screen.css'],
})
export class LogonScreen {

  username = '';
  password = '';

  constructor(private router: Router) {}

  onSubmit() {
    // Auth will go here later

    console.log('Login attempted', this.username, this.password);

    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
  }
}
