import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LogonScreen } from './logon-screen/logon-screen';
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'my-root',
  standalone: true,
  imports: [MatToolbarModule, RouterOutlet],
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

  ngOnInit() {
    document.body.classList.add('light-theme'); // default theme
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
  }
}
