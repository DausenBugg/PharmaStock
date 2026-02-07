import { bootstrapApplication } from '@angular/platform-browser';
import { App } from '../src/app/app';

bootstrapApplication(App)
  .catch(err => console.error(err));
