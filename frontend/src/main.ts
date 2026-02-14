import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { appRoutes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(appRoutes)
  ]
}).catch(err => console.error(err));
