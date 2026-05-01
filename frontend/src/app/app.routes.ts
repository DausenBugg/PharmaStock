import { Routes } from '@angular/router';
import { LogonScreen } from './logon-screen/logon-screen';
import { DashboardComponent } from './dashboard/dashboard';
import { InventoryComponent } from './inventory/inventory';
import { Orders } from "./orders/orders";
import { Reports } from "./reports/reports";
import { Settings } from './settings/settings';
import { Administration } from "./administration/administration";
import { RoleGuard } from "./guards/role.guard";

export const appRoutes: Routes = [
  { path: '', component: LogonScreen },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'orders', component: Orders },
  { path: 'reports', component: Reports },
  { path: 'settings', component: Settings},
  { path: 'administration', component: Administration, canActivate: [RoleGuard], data: { roles: ["Admin"]} },
  { path: '**', redirectTo: '' }
];
