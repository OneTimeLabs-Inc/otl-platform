import "./Login.css";

import { FcGoogle } from "react-icons/fc";
import { FaMicrosoft } from "react-icons/fa";

import { signInWithGoogle } from "../../services/auth";

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-content">
          <h1>OTLES: Platform</h1>

          <p className="hero-tagline">
            A modern platform for technical documentation.
          </p>

          <div className="hero-divider" />

          <h2>Write.</h2>

          <h2>Publish.</h2>

          <h2>Collaborate.</h2>

          <p className="hero-body">
            Create structured documentation using the
            OneTime Labs Markup Language (OTML),
            organize it into reusable workspaces,
            and publish professional documentation
            from a single platform.
          </p>
        </div>
      </section>

      <section className="login-panel">

        <div className="login-card">

          <h2>Welcome to OTLES</h2>

          <p className="login-description">
            Sign in to your documentation workspace.
          </p>

<button
  className="google-button"
  onClick={() => void signInWithGoogle()}
>
  <FcGoogle size={20} />
  <span>Continue with Google</span>
</button>

          <button
            className="microsoft-button"
            disabled
          >
            <FaMicrosoft size={18} />
            <span>Continue with Microsoft</span>
          </button>

          <div className="login-separator">
            <span>OR</span>
          </div>

          <input
            type="email"
            placeholder="Email"
          />

          <input
            type="password"
            placeholder="Password"
          />

          <label className="remember-me">
            <input type="checkbox" />
            Remember me
          </label>

          <button className="signin-button">
            Sign In
          </button>

          <button className="link-button">
            Forgot Password?
          </button>

          <div className="create-account">
            Don't have an account?
            <button className="link-button">
              Create Account
            </button>
          </div>

        </div>

      </section>
    </main>
  );
}