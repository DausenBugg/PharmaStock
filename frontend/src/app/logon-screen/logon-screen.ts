import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-logon-screen',
  standalone: true,
  imports: [/* Material modules */],
  templateUrl: './logon-screen.html',
  styleUrls: ['./logon-screen.css'],
})
export class LogonScreen {
  username = '';
  password = '';

  onSubmit() {
    // your login logic
    console.log('Login attempted', this.username, this.password);
  }
}

