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
} from "../services/auth";

import {
  provisionPlatformUser,
} from "../services/platformUsers";

type AuthContextType = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

type Props = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: Props) {
  const [isLoading, setIsLoading] =
    useState(true);

  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const currentSession =
          await getCurrentSession();

        const currentUser =
          await getCurrentUser();

        if (currentUser) {
          try {
            await provisionPlatformUser();
          } catch (err) {
            console.error(
              "Provisioning failed:",
              err,
            );
          }
        }

        setSession(currentSession);
        setUser(currentUser);
      } catch (err) {
        console.error(
          "Failed to initialize authentication:",
          err,
        );
      } finally {
        setIsLoading(false);
      }
    }

    void initialize();

    const {
      data: { subscription },
    } = onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            await provisionPlatformUser();
          } catch (err) {
            console.error(
              "Provisioning failed:",
              err,
            );
          }
        }

        setSession(session);
        setUser(
          session?.user ?? null,
        );
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        session,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

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