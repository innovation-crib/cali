import {
    ApplicationConfig,
    InjectionToken,
    importProvidersFrom,
} from '@angular/core';
import {
    provideRouter,
    withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { appRoutes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
    getFirestore,
    provideFirestore,
    connectFirestoreEmulator,
} from '@angular/fire/firestore';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import {
    getFunctions,
    provideFunctions,
    connectFunctionsEmulator,
} from '@angular/fire/functions';
import { environment } from '../environments/environment';

export interface IFirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    locationId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

export const FIREBASE_CONFIG = new InjectionToken<IFirebaseConfig>(
    'FIREBASE_CONFIG',
    {
        providedIn: 'any',
        factory: () => {
            throw new Error('FIREBASE_CONFIG is not provided');
        },
    }
);

export const USE_EMULATORS = new InjectionToken<boolean>('USE_EMULATORS', {
    providedIn: 'any',
    factory: () => false,
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
        { provide: FIREBASE_CONFIG, useValue: environment.firebase },
        { provide: USE_EMULATORS, useValue: environment.useEmulators },
        importProvidersFrom([
            provideFirebaseApp((injector) =>
                initializeApp(injector.get(FIREBASE_CONFIG))
            ),
            provideAuth((injector) => {
                const useEmulators = injector.get(USE_EMULATORS);
                const auth = getAuth();
                if (useEmulators) {
                    connectAuthEmulator(auth, 'http://localhost:9099');
                }
                return auth;
            }),
            provideFirestore((injector) => {
                const useEmulators = injector.get(USE_EMULATORS);
                const firestore = getFirestore();
                if (useEmulators) {
                    connectFirestoreEmulator(firestore, 'localhost', 8080);
                }
                return firestore;
            }),
            provideFunctions((injector) => {
                const useEmulators = injector.get(USE_EMULATORS);
                const functions = getFunctions();
                if (useEmulators) {
                    connectFunctionsEmulator(functions, 'localhost', 5001);
                }
                return functions;
            }),
        ]),
    ],
};
