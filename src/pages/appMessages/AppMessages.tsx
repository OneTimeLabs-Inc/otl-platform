import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Megaphone,
  Radio,
  Save,
} from "lucide-react";

import {
  getPlatformAppMessage,
  savePlatformAppMessage,
} from "../../services/platformAppMessages";

import "./AppMessages.css";


const applications = [
  {
    slug: "streamsafe",
    name: "StreamSafe",
    description:
      "Broadcast a notice to every StreamSafe installation.",
  },
] as const;


export default function AppMessages() {

  const [
    appSlug,
    setAppSlug,
  ] =
    useState("streamsafe");


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    active,
    setActive,
  ] =
    useState(false);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    updatedAt,
    setUpdatedAt,
  ] =
    useState<string | null>(
      null,
    );


  const [
    statusText,
    setStatusText,
  ] =
    useState("");


  const selectedApplication =
    useMemo(
      () =>
        applications.find(
          item =>
            item.slug ===
            appSlug,
        ) ??
        applications[0],
      [
        appSlug,
      ],
    );


  useEffect(
    () => {

      let cancelled =
        false;


      async function load() {

        setLoading(
          true,
        );

        setStatusText(
          "",
        );


        try {

          const current =
            await getPlatformAppMessage(
              appSlug,
            );


          if (cancelled) {
            return;
          }


          setMessage(
            current?.message ?? "",
          );

          setActive(
            current?.is_active ?? false,
          );

          setUpdatedAt(
            current?.updated_at ?? null,
          );

        }
        catch (error) {

          if (cancelled) {
            return;
          }


          console.error(
            error,
          );

          setStatusText(
            "Could not load the current broadcast.",
          );

        }
        finally {

          if (!cancelled) {

            setLoading(
              false,
            );

          }

        }

      }


      void load();


      return () => {

        cancelled =
          true;

      };

    },
    [
      appSlug,
    ],
  );


  async function saveBroadcast() {

    if (
      active &&
      !message.trim()
    ) {

      setStatusText(
        "Enter a message before enabling the broadcast.",
      );

      return;

    }


    setSaving(
      true,
    );

    setStatusText(
      "",
    );


    try {

      const saved =
        await savePlatformAppMessage(
          {
            app_slug:
              appSlug,

            message,

            is_active:
              active,
          },
        );


      setMessage(
        saved.message,
      );

      setActive(
        saved.is_active,
      );

      setUpdatedAt(
        saved.updated_at,
      );

      setStatusText(
        saved.is_active
          ? "Broadcast saved. Installed clients will receive it automatically."
          : "Broadcast saved but disabled.",
      );

    }
    catch (error) {

      console.error(
        error,
      );

      setStatusText(
        "Could not save the broadcast.",
      );

    }
    finally {

      setSaving(
        false,
      );

    }

  }


  const updatedLabel =
    updatedAt
      ? new Date(
          updatedAt,
        ).toLocaleString()
      : "Never";


  return (

    <div className="app-messages-page">

      {/* ======================================================
          HEADER 001
          ====================================================== */}

      <div className="app-messages-page-header">

        <div>

          <div className="app-messages-kicker">
            PLATFORM ADMINISTRATION
          </div>

          <h1>
            App Broadcasts
          </h1>

          <p>
            Publish one global notice to every installed copy
            of an OneTime Labs application.
          </p>

        </div>

        <div className="app-messages-live-badge">

          <Radio
            size={16}
          />

          Global Delivery

        </div>

      </div>


      {/* ======================================================
          EDITOR 001
          ====================================================== */}

      <section className="app-messages-panel">

        <div className="app-messages-panel-header">

          <div>

            <div className="app-messages-section-label">
              APPLICATION
            </div>

            <div className="app-messages-section-title">
              Broadcast Target
            </div>

          </div>

          <Megaphone
            size={22}
          />

        </div>


        <div className="app-messages-panel-body">

          <div className="app-messages-grid">

            <div className="app-messages-field">

              <label
                htmlFor="app-message-application"
              >
                Application
              </label>

              <select
                id="app-message-application"
                value={appSlug}
                onChange={event =>
                  setAppSlug(
                    event.target.value,
                  )
                }
                disabled={
                  loading ||
                  saving
                }
              >

                {applications.map(
                  application => (

                    <option
                      key={application.slug}
                      value={application.slug}
                    >
                      {application.name}
                    </option>

                  ),
                )}

              </select>

              <span>
                {selectedApplication.description}
              </span>

            </div>


            <div className="app-messages-field">

              <label>
                Delivery
              </label>

              <button
                type="button"
                className={`app-messages-toggle ${
                  active
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActive(
                    value =>
                      !value,
                  )
                }
                disabled={
                  loading ||
                  saving
                }
              >

                <span
                  className="app-messages-toggle-track"
                >
                  <span
                    className="app-messages-toggle-knob"
                  />
                </span>

                <span>
                  {active
                    ? "Broadcast enabled"
                    : "Broadcast disabled"}
                </span>

              </button>

              <span>
                Disable it to remove the notice from every client.
              </span>

            </div>

          </div>


          <div className="app-messages-field app-messages-message-field">

            <div className="app-messages-label-row">

              <label
                htmlFor="app-message-text"
              >
                Message
              </label>

              <span>
                {message.length}/600
              </span>

            </div>

            <textarea
              id="app-message-text"
              value={message}
              maxLength={600}
              rows={2}
              disabled={
                loading ||
                saving
              }
              placeholder="Example: StreamSafe v1.0 is now available. Restart the app to update."
              onChange={event =>
                setMessage(
                  event.target.value,
                )
              }
            />

          </div>


          <div className="app-messages-preview">

            <div className="app-messages-preview-label">
              CLIENT PREVIEW
            </div>

            <div className="app-messages-preview-card">

              <div className="app-messages-preview-brand">
                ONETIME LABS
              </div>

              <div className="app-messages-preview-text">
                {message.trim() ||
                  "No message entered."}
              </div>

            </div>

          </div>


          <div className="app-messages-actions">

            <div className="app-messages-save-state">

              <strong>
                Last updated:
              </strong>

              <span>
                {updatedLabel}
              </span>

              {statusText && (

                <span className="app-messages-status">
                  {statusText}
                </span>

              )}

            </div>


            <button
              type="button"
              className="app-messages-save-button"
              disabled={
                loading ||
                saving
              }
              onClick={() =>
                void saveBroadcast()
              }
            >

              <Save
                size={16}
              />

              {saving
                ? "Saving..."
                : "Save Broadcast"}

            </button>

          </div>

        </div>

      </section>


      {/* ======================================================
          DELIVERY 001
          ====================================================== */}

      <section className="app-messages-panel">

        <div className="app-messages-panel-header">

          <div>

            <div className="app-messages-section-label">
              DELIVERY
            </div>

            <div className="app-messages-section-title">
              How It Reaches Clients
            </div>

          </div>

        </div>


        <div className="app-messages-delivery-grid">

          <div>

            <strong>
              New launches
            </strong>

            <span>
              Fetch the current broadcast when the app opens.
            </span>

          </div>

          <div>

            <strong>
              Running installs
            </strong>

            <span>
              Refresh automatically every five minutes.
            </span>

          </div>

          <div>

            <strong>
              Scope
            </strong>

            <span>
              Broadcast applies to every installation of the selected application.
            </span>

          </div>

        </div>

      </section>

    </div>

  );

}
