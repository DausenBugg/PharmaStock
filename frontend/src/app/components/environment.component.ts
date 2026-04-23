import { Component } from "@angular/core";
import { environment } from "../environment/environment";
import { versionInfo } from "../environment/version";

@Component({
    selector: 'app-root',
    template: './app.html'
})
export class AppComponent {
    environment = environment;
    // set by git hash
    versionInfo = versionInfo;
}