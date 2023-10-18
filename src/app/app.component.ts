import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    imports: [NxWelcomeComponent, RouterModule, CommonModule],
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    private readonly auth = inject(AuthService);

    signedIn = computed(() => !!this.auth.user());

    signIn() {
        this.auth.loginWithGoogle();
    }

    signOut() {
        this.auth.logout();
    }
}
