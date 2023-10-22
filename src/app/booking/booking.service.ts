import { Injectable, computed, effect, inject, signal } from '@angular/core';
import * as moment from 'moment';
import {
    CollectionReference,
    Firestore,
    Timestamp,
    collection,
    collectionData,
    getDocs,
    query,
    where,
} from '@angular/fire/firestore';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

const BOOKINGS_PATH = 'bookings';
const CLEANING_TIME_DAYS = 1;

@Injectable({ providedIn: 'root' })
export class BookingService {
    private readonly db = inject(Firestore);
    private readonly bookingsDb = collection(
        this.db,
        BOOKINGS_PATH
    ) as CollectionReference<BookingModel>;

    readonly selectedStart = signal<moment.Moment>(moment().add(1, 'days'));
    readonly selectedEnd = signal<moment.Moment>(moment().add(5, 'days'));
    readonly shownMonth = signal<Month>({
        number: moment().month() as MonthNumber,
        year: moment().year(),
    });
    private readonly state = signal<BookingState>({
        bookings: {},
        bookingIds: [],
        sellectedBooking: undefined,
        loading: false,
    });

    readonly bookings = computed(() =>
        this.state().bookingIds.map((id) => this.state().bookings[id])
    );
    readonly loading = computed(() => this.state().loading);
    readonly sellectedBooking = computed(() => {
        const id = this.state().sellectedBooking;
        return id ? this.state().bookings[id] : null;
    });
    readonly selectionValid = computed(() => {
        const start = this.selectedStart();
        const end = this.selectedEnd();
        // look for bookings that overlap + cleaning Time with the selection and return true if none are found
        const bookings = this.bookings();
        if (!start || !end) return false;
        return !bookings.some((booking) => {
            const bookingStart = booking.start;
            const bookingEnd = booking.end;
            return (
                start.isBetween(
                    bookingStart,
                    bookingEnd.clone().add(CLEANING_TIME_DAYS, 'days'),
                    'day',
                    '[]'
                ) ||
                end
                    .clone()
                    .add(CLEANING_TIME_DAYS, 'days')
                    .isBetween(
                        bookingStart,
                        bookingEnd.add(CLEANING_TIME_DAYS, 'days'),
                        'day',
                        '[]'
                    ) ||
                bookingStart.isBetween(
                    start,
                    end.clone().add(CLEANING_TIME_DAYS, 'days'),
                    'day',
                    '[]'
                ) ||
                bookingEnd
                    .clone()
                    .add(CLEANING_TIME_DAYS, 'days')
                    .isBetween(
                        start,
                        end.clone().add(CLEANING_TIME_DAYS, 'days'),
                        'day',
                        '[]'
                    )
            );
        });
    });

    readonly affectedMonths = computed(() => {
        const start = this.selectedStart();
        const end = this.selectedEnd();
        if (!start || !end) return [];
        const months: Month[] = [];
        for (
            let month = moment(start).startOf('month');
            month.isSameOrBefore(end);
            month.add(1, 'month')
        ) {
            months.push({
                number: month.month() as MonthNumber,
                year: month.year(),
            });
        }
        return months;
    });

    isDayBooked(date: moment.Moment) {
        const bookings = this.bookings();
        return bookings.some((booking) => {
            const start = booking.start;
            const end = booking.end;
            return date.isBetween(start, end, 'day', '[]');
        });
    }

    isDaySelected(date: moment.Moment) {
        const start = this.selectedStart();
        const end = this.selectedEnd();
        if (!start || !end) return false;
        return date.isBetween(start, end, 'day', '[]');
    }

    isDayToday(date: moment.Moment) {
        return date.isSame(moment(), 'day');
    }

    generateDayOverview(date: moment.Moment): DayOverview {
        return {
            date,
            booked: this.isDayBooked(date),
            selected: this.isDaySelected(date),
            today: this.isDayToday(date),
            inMonth: date.month() === this.shownMonth().number,
        };
    }

    readonly MonthOverviewShownMonth = computed(() => {
        // create a week overview for each week in the shown month
        const weeks: WeekOverview[] = [];
        const shownMonth = this.shownMonth();
        const firstDayOfMonth = moment()
            .day(1)
            .month(shownMonth.number)
            .year(shownMonth.year)
            .startOf('month');
        const lastDayOfMonth = moment()
            .day(1)
            .month(shownMonth.number)
            .year(shownMonth.year)
            .endOf('month');
        const firstMonday = moment(firstDayOfMonth).startOf('isoWeek');
        const lastSunday = moment(lastDayOfMonth).endOf('isoWeek');
        for (
            let monday = firstMonday;
            monday.isSameOrBefore(lastSunday);
            monday.add(1, 'week')
        ) {
            const week: WeekOverview = {
                monday: this.generateDayOverview(monday.clone()),
                tuesday: this.generateDayOverview(monday.clone().add(1, 'day')),
                wednesday: this.generateDayOverview(
                    monday.clone().add(2, 'day')
                ),
                thursday: this.generateDayOverview(
                    monday.clone().add(3, 'day')
                ),
                friday: this.generateDayOverview(monday.clone().add(4, 'day')),
                saturday: this.generateDayOverview(
                    monday.clone().add(5, 'day')
                ),
                sunday: this.generateDayOverview(monday.clone().add(6, 'day')),
            };
            weeks.push(week);
        }
        return weeks;
    });

    constructor() {
        toObservable(this.affectedMonths)
            .pipe(
                switchMap((months) => {
                    const firstAfffectedDay = moment(
                        this.selectedStart()
                    ).startOf('month');
                    const lastAffectedDay = moment(this.selectedEnd()).endOf(
                        'month'
                    );
                    const firstDayOfSelectedMonth = moment(
                        this.selectedStart()
                    ).startOf('month');
                    const lastDayOfSelectedMonth = moment(
                        this.selectedEnd()
                    ).endOf('month');
                    // get the earliest month that is affected by the selection or the selected month
                    const firstMonth = moment.min(
                        firstAfffectedDay,
                        firstDayOfSelectedMonth
                    );
                    // get the latest month that is affected by the selection or the selected month
                    const lastMonth = moment.max(
                        lastAffectedDay,
                        lastDayOfSelectedMonth
                    );

                    const dbQuery = query(
                        this.bookingsDb,
                        where('end', '>=', firstMonth.toDate()),
                        where('end', '<=', lastMonth.add(3, 'months').toDate())
                    );
                    return collectionData(dbQuery, { idField: 'id' });
                })
            )
            .subscribe((bookings) => {
                console.log(bookings);
                this.state.update((state) => {
                    const bookingIds = bookings.map((booking) => booking.id);
                    const bookingsById = bookings
                        .map(
                            (bookingModel) =>
                                ({
                                    id: bookingModel.id,
                                    start: moment(bookingModel.start.toDate()),
                                    end: moment(bookingModel.end.toDate()),
                                    userId: bookingModel.userId,
                                } as Booking)
                        )
                        .reduce(
                            (bookings, booking) => ({
                                ...bookings,
                                [booking.id]: booking,
                            }),
                            {}
                        );
                    return {
                        ...state,
                        bookings: bookingsById,
                        bookingIds,
                    };
                });
            });
    }

    showMonth(month: Month) {
        this.state.update((state) => ({ ...state, shownMonth: month }));
    }

    selectBooking(id: string) {
        this.state.update((state) => ({ ...state, sellectedBooking: id }));
    }

    selectStart(date: moment.Moment) {
        date = moment(date).startOf('day').zone('utc');
        this.selectedStart.update(() => date);
    }

    selectEnd(date: moment.Moment) {
        date = moment(date).endOf('day').zone('utc');
        this.selectedEnd.update(() => date);
    }

    createBooking() {}
}

type Booking = {
    id: string;
    start: moment.Moment;
    end: moment.Moment;
    userId: string;
};

type BookingState = {
    bookings: { [id: string]: Booking };
    bookingIds: string[];
    sellectedBooking: string | null | undefined;
    loading: boolean;
};

type BookingModel = {
    id: string;
    start: Timestamp;
    end: Timestamp;
    userId: string;
};

type Month = {
    number: MonthNumber;
    year: number;
};

type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
function form(
    arg0: Promise<import('@angular/fire/firestore').QuerySnapshot<BookingModel>>
): any {
    throw new Error('Function not implemented.');
}

type WeekOverview = {
    monday: DayOverview;
    tuesday: DayOverview;
    wednesday: DayOverview;
    thursday: DayOverview;
    friday: DayOverview;
    saturday: DayOverview;
    sunday: DayOverview;
};

type DayOverview = {
    date: moment.Moment;
    booked: boolean;
    selected: boolean;
    today: boolean;
    inMonth: boolean;
};
