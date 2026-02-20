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
  template: `
    <mat-toolbar color="primary">
      PharmaStock
      <span style="flex: 1 1 auto;"></span>
      <button mat-button (click)="toggleTheme()">Toggle Theme</button>
    </mat-toolbar>

    <router-outlet></router-outlet>
  `
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
