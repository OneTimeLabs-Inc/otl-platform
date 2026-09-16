import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  CheckCircle2,
  LoaderCircle,
  LogOut,
  Store,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  getMySellerApplication,
  submitSellerApplication,
} from "../../services/sellerApplications";
import type {
  SellerApplication,
} from "../../types/sellerApplication";
import { useAuth } from "../../hooks/useAuth";
import "./SellerApply.css";

const storeSellerUrl =
  "https://store.onetimelabs.net/login?return=/seller";

/* ==========================================================
   SELLER APPLY 001
   Public OneTime Labs seller account application
   ========================================================== */

export default function SellerApply() {
  const {
    user,
    isLoading,
  } = useAuth();

  const [mode, setMode] =
    useState<"signin" | "signup">("signup");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [sellingDescription, setSellingDescription] =
    useState("");

  const [application, setApplication] =
    useState<SellerApplication | null>(null);

  const [checkingApplication, setCheckingApplication] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* ========================================================
     SELLER APPLY 002
     Load existing application for this identity
     ======================================================== */

  useEffect(() => {
    if (!user) {
      setApplication(null);
      setCheckingApplication(false);
      return;
    }

    let active = true;

    async function loadApplication() {
      setCheckingApplication(true);
      setError("");

      try {
        const current =
          await getMySellerApplication();

        if (active) {
          setApplication(current);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your seller application.",
          );
        }
      } finally {
        if (active) {
          setCheckingApplication(false);
        }
      }
    }

    void loadApplication();

    return () => {
      active = false;
    };
  }, [user]);

  /* ========================================================
     SELLER APPLY 003
     Create or sign in to shared OneTime Labs identity
     ======================================================== */

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          throw signInError;
        }

        return;
      }

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo:
              `${window.location.origin}/seller/apply`,
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.session) {
        setMessage(
          "Account created. Check your email to confirm it, then come back here to finish the seller application.",
        );
        setMode("signin");
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Unable to continue.",
      );
    } finally {
      setBusy(false);
    }
  }

  /* ========================================================
     SELLER APPLY 004
     Submit application
     ======================================================== */

  async function handleApplication(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const created =
        await submitSellerApplication({
          displayName,
          slug,
          sellingDescription,
        });

      setApplication(created);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your seller application.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setApplication(null);
    setMessage("");
    setError("");
  }

  /* ========================================================
     SELLER APPLY 005
     Render
     ======================================================== */

  if (isLoading) {
    return (
      <main className="seller-apply-page">
        <div className="seller-apply-loading">
          <LoaderCircle
            className="seller-spin"
            size={20}
          />
          Loading seller application...
        </div>
      </main>
    );
  }

  return (
    <main className="seller-apply-page">
      <section className="seller-apply-shell">
        <header className="seller-apply-header">
          <div>
            <span className="seller-apply-kicker">
              ONETIME LABS PLATFORM
            </span>
            <h1>Sell on OneTime Labs</h1>
            <p>
              Apply for a Store seller account. OneTime Labs reviews
              seller accounts before they can publish products.
            </p>
          </div>

          {user && (
            <button
              type="button"
              className="seller-apply-link-button"
              onClick={() => {
                void handleSignOut();
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          )}
        </header>

        {!user ? (
          <section className="seller-apply-card seller-auth-card">
            <div className="seller-apply-card-icon">
              <Store size={24} />
            </div>

            <h2>
              {mode === "signup"
                ? "Create your seller identity"
                : "Sign in to continue"}
            </h2>

            <p>
              This account is your shared OneTime Labs identity and
              will be used to access Seller Center after approval.
            </p>

            <div className="seller-auth-switch">
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
              <button
                type="button"
                className={mode === "signin" ? "active" : ""}
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </div>

            <form
              className="seller-apply-form"
              onSubmit={handleAuth}
            >
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={event =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={event =>
                    setPassword(event.target.value)
                  }
                  minLength={8}
                  autoComplete={
                    mode === "signin"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                />
              </label>

              {message && (
                <div className="seller-apply-message">
                  {message}
                </div>
              )}

              {error && (
                <div className="seller-apply-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="seller-apply-primary"
                disabled={busy}
              >
                {busy
                  ? "Working..."
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          </section>
        ) : checkingApplication ? (
          <section className="seller-apply-card seller-status-card">
            <LoaderCircle
              className="seller-spin"
              size={22}
            />
            <h2>Checking your application...</h2>
          </section>
        ) : application ? (
          <ApplicationStatus
            application={application}
          />
        ) : (
          <section className="seller-apply-card">
            <div className="seller-apply-account-row">
              <div>
                <span>Signed in as</span>
                <strong>{user.email}</strong>
              </div>
              <span className="seller-apply-badge">
                Account ready
              </span>
            </div>

            <h2>Seller application</h2>
            <p>
              Tell us what the Store account should be called. Approval
              creates the seller account in OneTime Labs Store.
            </p>

            <form
              className="seller-apply-form"
              onSubmit={handleApplication}
            >
              <label>
                Seller / shop name
                <input
                  value={displayName}
                  onChange={event =>
                    setDisplayName(event.target.value)
                  }
                  placeholder="Emma's Hardware"
                  required
                />
              </label>

              <label>
                Store handle
                <input
                  value={slug}
                  onChange={event =>
                    setSlug(event.target.value)
                  }
                  placeholder="emmas-hardware"
                  required
                />
                <small>
                  Used for the seller account and future Store URL.
                </small>
              </label>

              <label>
                What do you plan to sell?
                <textarea
                  value={sellingDescription}
                  onChange={event =>
                    setSellingDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Example: tested desktop and laptop RAM, SSDs, and other PC components."
                  required
                />
              </label>

              {error && (
                <div className="seller-apply-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="seller-apply-primary"
                disabled={busy}
              >
                {busy
                  ? "Submitting..."
                  : "Submit seller application"}
              </button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}

function ApplicationStatus({
  application,
}: {
  application: SellerApplication;
}) {
  const approved =
    application.status === "approved";

  return (
    <section className="seller-apply-card seller-status-card">
      <div
        className={`seller-status-icon ${application.status}`}
      >
        {approved
          ? <CheckCircle2 size={28} />
          : <Store size={26} />}
      </div>

      <span
        className={`seller-application-status ${application.status}`}
      >
        {application.status}
      </span>

      <h2>
        {approved
          ? "Your Store seller account is ready."
          : application.status === "rejected"
            ? "Seller application not approved."
            : "Your application is under review."}
      </h2>

      <p>
        {approved
          ? "OneTime Labs approved the application and created your Store seller account. Sign in to Store with the same OneTime Labs email and password to open Seller Center."
          : application.status === "rejected"
            ? "OneTime Labs reviewed this application. Contact support if you need more information."
            : "You do not need to submit another application. Once approved, Seller Center will unlock automatically."}
      </p>

      <div className="seller-application-summary">
        <div>
          <span>Seller</span>
          <strong>{application.display_name}</strong>
        </div>
        <div>
          <span>Handle</span>
          <strong>{application.slug}</strong>
        </div>
      </div>

      {approved && (
        <a
          className="seller-apply-primary seller-apply-anchor"
          href={storeSellerUrl}
        >
          Sign in to Seller Center
        </a>
      )}
    </section>
  );
}
