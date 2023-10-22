import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    computed,
    effect,
    signal,
} from '@angular/core';

import * as moment from 'moment';

@Component({
    selector: 'app-calendar',
    templateUrl: './calendar.component.html',
    imports: [CommonModule],
    standalone: true,
})
export class CalendarComponent {
    private readonly _unavailableDates = signal<Date[]>([]);
    private readonly _selectedDates = signal<Date[]>([]);
    private readonly _shownMonth = signal<Month>(moment().month() as Month);
    private readonly _shownYear = signal<number>(moment().year());

    readonly days = computed(() => {
        const days: DisplayDate[] = [];
        const shownMonth = this._shownMonth();
        const shownYear = this._shownYear();
        const firstDayOfMonth = moment([shownYear, shownMonth, 1]);
        const lastDayOfMonth = moment(firstDayOfMonth).endOf('month');
        const firstDayOfCalendar = moment(firstDayOfMonth).startOf('isoWeek');
        const lastDayOfCalendar = moment(lastDayOfMonth).endOf('isoWeek');

        const selected = this._selectedDates();
        const unavailable = this._unavailableDates();

        let current = moment(firstDayOfCalendar);
        while (current.isSameOrBefore(lastDayOfCalendar)) {
            const displayDate: DisplayDate = {
                date: current.toDate(),
                isToday: current.isSame(moment(), 'day'),
                isCurrentMonth: current.isSame(firstDayOfMonth, 'month'),
                isUnavailable: unavailable.some((date) =>
                    current.isSame(date, 'day')
                ),
                isSelected: selected.some((date) =>
                    current.isSame(date, 'day')
                ),
            };
            days.push(displayDate);
            current = current.add(1, 'day');
        }
        return days;
    });

    @Input()
    set unavailableDates(value: Date[]) {
        // skip if the dates are the same
        if (this._unavailableDates() === value) {
            return;
        }
        this._unavailableDates.update(() => value);
    }
    get unavailableDates(): Date[] {
        return this._unavailableDates();
    }

    @Input()
    set month(value: Month) {
        // skip if the month is the same
        if (this._shownMonth() === value) {
            return;
        }
        // skip if the month is out of range
        if (value < 1 || value > 12) {
            return;
        }
        this._shownMonth.update(() => value);
    }
    get month(): Month {
        return this._shownMonth();
    }

    @Input()
    set year(value: number) {
        // skip if the year is the same
        if (this._shownYear() === value) {
            return;
        }
        this._shownYear.update(() => value);
    }
    get year(): number {
        return this._shownYear();
    }

    @Input()
    set selectedDates(value: Date[]) {
        // skip if the dates are the same
        if (this._selectedDates() === value) {
            return;
        }
        this._selectedDates.update(() => value);
    }
    get selectedDates(): Date[] {
        return this._selectedDates();
    }

    @Output()
    readonly selectedDatesChange = new EventEmitter<Date[]>();

    private readonly _selectedDatesChangeEffect = effect(() => {
        this.selectedDatesChange.emit(this._selectedDates());
    });

    select(date: Date) {
        const selectedDates = this._selectedDates();
        // if there is only one date selected and it is the same as the date we are trying to select, deselect it
        if (selectedDates.length === 1 && selectedDates[0] === date) {
            this._selectedDates.update(() => []);
            return;
        }

        // if there is only one date selected and the date we are trying to select is after the selected date, select all dates between the two dates inclusive
        if (selectedDates.length === 1 && selectedDates[0] < date) {
            const dates: Date[] = [];
            let current = moment(selectedDates[0]);
            while (current.isSameOrBefore(date)) {
                dates.push(current.toDate());
                current = current.add(1, 'day');
            }
            this._selectedDates.update(() => dates);
            return;
        }
        this._selectedDates.update(() => [date]);
    }
}

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type DisplayDate = {
    date: Date;
    isToday: boolean;
    isCurrentMonth: boolean;
    isUnavailable: boolean;
    isSelected: boolean;
};
