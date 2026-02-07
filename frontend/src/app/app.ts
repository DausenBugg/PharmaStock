import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LogonScreen } from './logon-screen/logon-screen';


@Component({
  selector: 'my-root',
  standalone: true,
  imports: [MatToolbarModule, LogonScreen],
  template: `
    <mat-toolbar color="primary">PharmaStock</mat-toolbar>
    <app-logon-screen></app-logon-screen>
  `
})
export class App {}
