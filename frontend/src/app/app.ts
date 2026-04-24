import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'my-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App implements OnInit {

  ngOnInit(): void {
    document.body.classList.add('light-theme'); // default theme
  }

  toggleTheme(): void {
    const body = document.body;

    if (body.classList.contains('dark-theme')) {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    }
  }
}
