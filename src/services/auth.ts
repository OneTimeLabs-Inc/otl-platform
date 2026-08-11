import {
  supabase,
} from "../lib/supabase";

import type {
  AuthError,
  Session,
  User,
} from "@supabase/supabase-js";


/* ==========================================================
   AUTHENTICATION 001
   Platform uses OAuth authentication only.
   ========================================================== */


/* ==========================================================
   SESSION 002
   ========================================================== */

export async function getCurrentSession():
  Promise<Session | null> {

  const {
    data: {
      session,
    },
  } =
    await supabase.auth.getSession();


  return session;

}


export async function getCurrentUser():
  Promise<User | null> {

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();


  return user;

}


/* ==========================================================
   GOOGLE OAUTH 003
   ========================================================== */

export async function signInWithGoogle() {

  return supabase.auth.signInWithOAuth({

    provider:
      "google",

    options: {

      redirectTo:
        `${window.location.origin}/`,

      queryParams: {

        prompt:
          "select_account",

      },

    },

  });

}


/* ==========================================================
   MICROSOFT OAUTH 004
   ========================================================== */

export async function signInWithMicrosoft() {

  return supabase.auth.signInWithOAuth({

    provider:
      "azure",

    options: {

      redirectTo:
        `${window.location.origin}/`,

    },

  });

}


/* ==========================================================
   SIGN OUT 005
   ========================================================== */

export async function signOut():
  Promise<AuthError | null> {

  const {
    error,
  } =
    await supabase.auth.signOut();


  return error;

}


/* ==========================================================
   AUTHENTICATION STATE 006
   ========================================================== */

export function onAuthStateChange(
  callback: (
    event: string,
    session: Session | null,
  ) => void,
) {

  return supabase.auth.onAuthStateChange(
    callback,
  );

}