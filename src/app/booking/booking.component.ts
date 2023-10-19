import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
} from '@angular/core';
import { BookingService } from './booking.service';

@Component({
    standalone: true,
    selector: 'app-booking',
    imports: [CommonModule],
    templateUrl: './booking.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class bookingComponent {
    private readonly bookingService = inject(BookingService);

    shownMonth = computed(() => {
        console.log('updated');
        return this.bookingService.shownMonth();
    });

    monthOverview = computed(() =>
        this.bookingService.MonthOverviewShownMonth()
    );
}
