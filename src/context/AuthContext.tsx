import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import {
  getCurrentSession,
  getCurrentUser,
  onAuthStateChange,
  signOut,
} from "../services/auth";

import {
  getCurrentPlatformUser,
} from "../services/platformUsers";

/* ==========================================================
   AUTH CONTEXT 001
   Platform authentication state
   ========================================================== */

type AuthContextType = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  accessDenied: boolean;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

type Props = {
  children: ReactNode;
};

/* ==========================================================
   AUTH PROVIDER 002
   Platform authentication and authorization
   ========================================================== */

export function AuthProvider({
  children,
}: Props) {
  const [isLoading, setIsLoading] =
    useState(true);

  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [accessDenied, setAccessDenied] =
    useState(false);

  /* ========================================================
     PLATFORM ACCESS 003
     Verify platform administrator authorization
     ======================================================== */

  async function authorizePlatformUser(
    nextSession: Session | null,
  ) {
    if (!nextSession?.user) {
      setSession(null);
      setUser(null);
      setAccessDenied(false);

      return;
    }

    const platformUser =
      await getCurrentPlatformUser();

    /*
     * OTLES-Platform is restricted to users explicitly
     * designated as platform administrators.
     *
     * Organization administrators do not receive Platform
     * access.
     */

    if (
      !platformUser ||
      !platformUser.active ||
      !platformUser.is_platform_admin
    ) {
      setSession(null);
      setUser(null);
      setAccessDenied(true);

      await signOut();

      return;
    }

    setAccessDenied(false);

    setSession(nextSession);

    setUser(nextSession.user);
  }

  /* ========================================================
     AUTH INITIALIZATION 004
     Restore and authorize existing session
     ======================================================== */

  useEffect(() => {
    async function initialize() {
      try {
        const currentSession =
          await getCurrentSession();

        /*
         * Calling getCurrentUser verifies that the current
         * Supabase session represents a valid authenticated
         * user before Platform authorization is evaluated.
         */

        const currentUser =
          await getCurrentUser();

        if (
          currentSession &&
          currentUser
        ) {
          await authorizePlatformUser(
            currentSession,
          );
        } else {
          setSession(null);
          setUser(null);
          setAccessDenied(false);
        }
      } catch (err) {
        console.error(
          "Failed to initialize Platform authentication:",
          err,
        );

        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void initialize();

    /* ======================================================
       AUTH STATE 005
       Handle login/logout events
       ====================================================== */

    const {
      data: { subscription },
    } = onAuthStateChange(
      async (_event, nextSession) => {
        try {
          await authorizePlatformUser(
            nextSession,
          );
        } catch (err) {
          console.error(
            "Failed to authorize Platform user:",
            err,
          );

          setSession(null);
          setUser(null);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ========================================================
     AUTH CONTEXT PROVIDER 006
     ======================================================== */

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        session,
        user,
        accessDenied,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ==========================================================
   AUTH CONTEXT HOOK 007
   ========================================================== */

export function useAuthContext() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside an AuthProvider.",
    );
  }

  return context;
}