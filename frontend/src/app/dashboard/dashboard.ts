import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  inventoryHealth = 70;   // Change this to test colors
  totalMeds = 551;
  expired = 0;
  expiringSoon = 1;
  stockedOut = 6;
  lowInventory = 10;

  constructor(private router: Router){}

  get inventoryHealthClass(): string {
    if (this.inventoryHealth > 95) {
      return 'health-good';
    } else if (this.inventoryHealth >= 85) {
      return 'health-warning';
    } else {
      return 'health-critical';
    }
  }

  isDarkMode = false;

  ngOnInit() {
    this.updateThemeState();

    const observer = new MutationObserver(() => {
      this.updateThemeState();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  updateThemeState() {
    this.isDarkMode = document.body.classList.contains('dark-theme');
  }

  goToInventory():void{
    this.router.navigate(['/inventory']);
  }

  goToOrders():void{
    this.router.navigate(['/orders']);
  }

  goToReports():void{
    this.router.navigate(['reports']);
  }

  goToSettings():void{
    this.router.navigate(['settings']);
  }

  goToAdministration():void{
    this.router.navigate(['administration']);
  }


}
