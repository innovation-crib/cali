import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { type } from 'os';
import { Moment } from 'moment';
import * as moment from 'moment';
import {
    Firestore,
    collection,
    getDocs,
    query,
    where,
} from '@angular/fire/firestore';

const BOOKINGS_PATH = 'bookings';

@Injectable({ providedIn: 'root' })
export class BookingService {
    private readonly db = inject(Firestore);
    private readonly bookingsDb = collection(this.db, BOOKINGS_PATH);

    private readonly state = signal<BookingState>({
        bookings: {},
        sellectedBooking: undefined,
        selectedStart: moment().add(1, 'days'),
        selectedEnd: moment().add(5, 'days'),
        loading: false,
        shownMonth: {
            number: moment().month() as MonthNumber,
            year: moment().year(),
        },
    });

    readonly bookings = computed(() => this.state().bookings);
    readonly selectedStart = computed(() => this.state().selectedStart);
    readonly selectedEnd = computed(() => this.state().selectedEnd);
    readonly shownMonth = computed(() => this.state().shownMonth);
    readonly loading = computed(() => this.state().loading);
    readonly sellectedBooking = computed(() => {
        const id = this.state().sellectedBooking;
        return id ? this.state().bookings[id] : null;
    });
    readonly selectionValid = computed(() => {
        const start = this.selectedStart();
        const end = this.selectedEnd();
        return start && end && start.isSameOrBefore(end);
    });

    constructor() {}

    showMonth(month: Month) {
        this.state.update((state) => ({ ...state, shownMonth: month }));
    }

    selectBooking(id: string) {
        this.state.update((state) => ({ ...state, sellectedBooking: id }));
    }

    selectStart(date: Moment) {
        this.state.update((state) => ({ ...state, selectedStart: date }));
    }

    selectEnd(date: Moment) {
        this.state.update((state) => ({ ...state, selectedEnd: date }));
    }

    createBooking() {
        


}

type Booking = {
    id: string;
    start: Moment;
    end: Moment;
    userId: string;
};

type BookingState = {
    bookings: { [id: string]: Booking };
    sellectedBooking: string | null | undefined;
    selectedStart: Moment | null | undefined;
    selectedEnd: Moment | null | undefined;
    loading: boolean;
    shownMonth: Month;
};

type BookingModel = {
    start: Date;
    end: Date;
    userId: string;
};

type Month = {
    number: MonthNumber;
    year: number;
};

type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
