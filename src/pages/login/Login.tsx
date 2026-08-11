import {
  useState,
} from "react";

import {
  FcGoogle,
} from "react-icons/fc";

import {
  FaMicrosoft,
} from "react-icons/fa";

import {
  signInWithGoogle,
} from "../../services/auth";

import "./Login.css";


/* ==========================================================
   PLATFORM LOGIN 001
   OAuth-only authentication
   ========================================================== */

export default function Login() {


  /* ========================================================
     STATE 002
     ======================================================== */

  const [
    signingIn,
    setSigningIn,
  ] =
    useState<
      "google" |
      "microsoft" |
      null
    >(null);


  const [
    error,
    setError,
  ] =
    useState("");


  /* ========================================================
     GOOGLE 003
     ======================================================== */

  async function handleGoogleSignIn() {

    setSigningIn(
      "google",
    );

    setError("");


    try {

      const {
        error: authError,
      } =
        await signInWithGoogle();


      if (authError) {

        throw authError;

      }

    }
    catch (signInError) {

      console.error(
        "Google sign-in failed:",
        signInError,
      );


      setError(
        signInError instanceof Error
          ? signInError.message
          : "Unable to sign in with Google.",
      );


      setSigningIn(
        null,
      );

    }

  }



  /* ========================================================
     RENDER 005
     ======================================================== */

  return (

    <main className="login-page">


      {/* ====================================================
          HERO 006
          ==================================================== */}

      <section className="login-hero">

        <div className="hero-content">

          <h1>
            OTLES: Platform
          </h1>

          <div className="hero-divider" />
          <p className="hero-body">

            Manage organizations, users,
            applications, roles, and platform
            access across the OneTime Labs
            ecosystem.

          </p>

        </div>

      </section>


      {/* ====================================================
          LOGIN PANEL 007
          ==================================================== */}

      <section className="login-panel">

        <div className="login-card">


          <h2>
            Platform Sign In
          </h2>


          <p className="login-description">

            Sign in with an authorized identity
            provider to access Platform.

          </p>


          {/* ==================================================
              GOOGLE 008
              ================================================== */}

          <button
            type="button"
            className="google-button"
            disabled={
              signingIn !== null
            }
            onClick={() => {
              void handleGoogleSignIn();
            }}
          >

            <FcGoogle
              size={20}
            />

            <span>

              {signingIn === "google"
                ? "Connecting..."
                : "Continue with Google"}

            </span>

          </button>


{/* ==================================================
    MICROSOFT 009
    OAuth provider not yet configured
    ================================================== */}

<button
  type="button"
  className="microsoft-button"
  disabled
>
  <FaMicrosoft
    size={18}
  />

  <span>
    Continue with Microsoft
  </span>
</button>


          {/* ==================================================
              ERROR 010
              ================================================== */}

          {error && (

            <div className="login-error">
              {error}
            </div>

          )}


          {/* ==================================================
              ACCESS NOTICE 011
              ================================================== */}

          <div className="login-access-notice">

            <strong>
              Authorized Access Only
            </strong>

            <p>

              Platform access is restricted to
              authorized OneTime Labs platform
              administrators.

            </p>

          </div>


        </div>

      </section>


    </main>

  );

}