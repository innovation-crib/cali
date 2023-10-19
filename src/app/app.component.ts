import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { BookingService } from './booking/booking.service';
import { bookingComponent } from './booking/booking.component';

@Component({
    standalone: true,
    imports: [NxWelcomeComponent, RouterModule, CommonModule, bookingComponent],
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    private readonly auth = inject(AuthService);
    private readonly bookingService = inject(BookingService);

    signedIn = computed(() => !!this.auth.user());

    bookings = computed(() => this.bookingService.bookings());

    signIn() {
        this.auth.loginWithGoogle();
    }

    signOut() {
        this.auth.logout();
    }
}
