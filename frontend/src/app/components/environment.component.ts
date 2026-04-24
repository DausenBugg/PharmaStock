import { Component } from "@angular/core";
import { environment } from "../../environments/environment";
import { versionInfo } from "../../environments/version";

@Component({
    selector: 'app-root',
    template: './app.html'
})
export class AppComponent {
    environment = environment;
    // set by git hash
    versionInfo = versionInfo;
}