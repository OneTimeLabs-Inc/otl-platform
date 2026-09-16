import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import {
  getSellerApplications,
  reviewSellerApplication,
} from "../../services/sellerApplications";
import type {
  SellerApplication,
} from "../../types/sellerApplication";
import "./Applications.css";

/* ==========================================================
   APPLICATIONS 001
   Seller application administration
   ========================================================== */

export default function Applications() {
  const [applications, setApplications] =
    useState<SellerApplication[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [workingId, setWorkingId] =
    useState<string | null>(null);
  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await getSellerApplications();
      setApplications(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load seller applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = useMemo(
    () => applications.filter(
      application => application.status === "pending",
    ).length,
    [applications],
  );

  async function review(
    application: SellerApplication,
    status: "approved" | "rejected",
  ) {
    setWorkingId(application.id);
    setError("");

    try {
      const updated =
        await reviewSellerApplication(
          application.id,
          status,
        );

      setApplications(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to review seller application.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="applications-page">
      <header className="applications-header">
        <div>
          <span className="applications-kicker">
            ONETIME LABS STORE
          </span>
          <h1>Seller Applications</h1>
          <p>
            Review applicants and create Store seller accounts from Platform.
          </p>
        </div>

        <button
          type="button"
          className="applications-refresh"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      <div className="applications-summary">
        <article>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>
        <article>
          <span>Total applications</span>
          <strong>{applications.length}</strong>
        </article>
      </div>

      {error && (
        <div className="applications-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="applications-loading">
          <LoaderCircle
            className="applications-spin"
            size={19}
          />
          Loading seller applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="applications-empty">
          <Store size={30} />
          <h2>No seller applications yet.</h2>
          <p>
            Applications submitted at platform.onetimelabs.net/seller/apply
            will appear here.
          </p>
        </div>
      ) : (
        <div className="applications-table-wrap">
          <div className="applications-table-head">
            <span>Seller</span>
            <span>Handle</span>
            <span>What they sell</span>
            <span>Submitted</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {applications.map(application => {
            const working =
              workingId === application.id;

            return (
              <article
                className="applications-row"
                key={application.id}
              >
                <div className="applications-seller">
                  <strong>{application.display_name}</strong>
                  <span>{application.email}</span>
                </div>

                <span className="applications-handle">
                  {application.slug}
                </span>

                <span className="applications-description">
                  {application.selling_description}
                </span>

                <span>
                  {new Date(
                    application.submitted_at,
                  ).toLocaleDateString()}
                </span>

                <span
                  className={`applications-status ${application.status}`}
                >
                  {application.status}
                </span>

                <div className="applications-actions">
                  {application.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="application-approve"
                        disabled={working}
                        onClick={() => {
                          void review(
                            application,
                            "approved",
                          );
                        }}
                      >
                        <CheckCircle2 size={14} />
                        {working
                          ? "Working..."
                          : "Approve & Create"}
                      </button>

                      <button
                        type="button"
                        className="application-reject"
                        disabled={working}
                        onClick={() => {
                          void review(
                            application,
                            "rejected",
                          );
                        }}
                        aria-label={`Reject ${application.display_name}`}
                      >
                        <XCircle size={15} />
                      </button>
                    </>
                  ) : application.status === "approved" ? (
                    <span className="application-complete">
                      Store account active
                    </span>
                  ) : (
                    <span className="application-complete muted">
                      Closed
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
