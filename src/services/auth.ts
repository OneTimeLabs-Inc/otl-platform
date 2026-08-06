import { supabase } from "../lib/supabase";

import type {
  AuthError,
  Session,
  User,
} from "@supabase/supabase-js";

/* ==========================================================
   Session
   ========================================================== */

export async function getCurrentSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/* ==========================================================
   OAuth
   ========================================================== */

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
}

export async function signInWithMicrosoft() {
  return supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
}

/* ==========================================================
   Email Authentication
   ========================================================== */

export async function signIn(
  email: string,
  password: string,
): Promise<AuthError | null> {
  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  return error;
}

export async function signUp(
  email: string,
  password: string,
): Promise<AuthError | null> {
  const { error } =
    await supabase.auth.signUp({
      email,
      password,
    });

  return error;
}

export async function signOut(): Promise<AuthError | null> {
  const { error } =
    await supabase.auth.signOut();

  return error;
}

/* ==========================================================
   Password Reset
   ========================================================== */

export async function forgotPassword(
  email: string,
): Promise<AuthError | null> {
  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      },
    );

  return error;
}

export async function resetPassword(
  password: string,
): Promise<AuthError | null> {
  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  return error;
}

/* ==========================================================
   Authentication State
   ========================================================== */

export function onAuthStateChange(
  callback: (
    event: string,
    session: Session | null,
  ) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}