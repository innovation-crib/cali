import { Injectable, computed, inject, signal } from '@angular/core';
import {
    Auth,
    FacebookAuthProvider,
    GoogleAuthProvider,
    User,
    authState,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithEmailLink,
    signInWithPopup,
    signOut,
} from '@angular/fire/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, from } from 'rxjs';

type AuthUser = User | null | undefined;

type AuthState = {
    user: AuthUser;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly auth = inject(Auth);

    private readonly authState = authState(this.auth);

    private readonly state = signal<AuthState>({
        user: undefined,
    });

    user = computed(() => this.state().user);

    constructor() {
        this.authState.pipe(takeUntilDestroyed()).subscribe((user) => {
            this.state.update((state) => ({ ...state, user }));
        });
    }

    login(credentials: Credentials) {
        return from(
            signInWithEmailAndPassword(
                this.auth,
                credentials.email,
                credentials.password
            )
        );
    }

    loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return from(signInWithPopup(this.auth, provider));
    }

    loginWithFacebook() {
        const provider = new FacebookAuthProvider();
        return from(signInWithPopup(this.auth, provider));
    }

    loginWighEmailLink(email: string) {
        return from(signInWithEmailLink(this.auth, email));
    }

    logout() {
        signOut(this.auth);
    }

    createAccount(credentials: Credentials) {
        return from(
            defer(() =>
                createUserWithEmailAndPassword(
                    this.auth,
                    credentials.email,
                    credentials.password
                )
            )
        );
    }
}

type Credentials = {
    email: string;
    password: string;
};
