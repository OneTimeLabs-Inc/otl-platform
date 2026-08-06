import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";

import {
  getMyOrganization,
  type Organization,
} from "../../services/organizations";

import { supabase } from "../../lib/supabase";

import "./Dashboard.css";

type Props = {
  onOpenOrganizations: () => void;
};

export default function Dashboard({
  onOpenOrganizations,
}: Props) {
  const { user } = useAuth();

  const [organization, setOrganization] =
    useState<Organization | null>(null);

  const [loadingOrganization, setLoadingOrganization] =
    useState(true);

  useEffect(() => {
    async function loadOrganization() {
      const org =
        await getMyOrganization();

      setOrganization(org);

      setLoadingOrganization(false);
    }

    void loadOrganization();
  }, []);

  const isPlatformAdmin =
    user?.email === "iekhanine@gmail.com";

  return (
    <div className="dashboard">

      {/* ================================================
          Welcome
          ================================================ */}

      <section className="dashboard-panel">

        <div className="panel-header">
          Welcome
        </div>

        <div className="panel-body">

          <h2 className="dashboard-title">
            Hello,&nbsp;
            {user?.user_metadata?.full_name ??
              user?.email}
            !
          </h2>

          <p className="dashboard-muted">
            Welcome to the OneTime Labs Platform.
          </p>

        </div>

      </section>

      {/* ================================================
          Organization
          ================================================ */}

      <section className="dashboard-panel">

        <div className="panel-header">
          Organization
        </div>

        <div className="panel-body">

          {loadingOrganization ? (

            <div className="dashboard-muted">
              Looking up your organization...
            </div>

          ) : organization ? (

            <>
              <div className="dashboard-subtitle">
                {organization.name}
              </div>

              <div className="organization-role">
                Organization Member
              </div>
            </>

          ) : (

            <div className="dashboard-onboarding">

              <div className="onboarding-title">
                Account Created Successfully
              </div>

              <div className="onboarding-text">
                Your account has been created and
                authenticated successfully.
              </div>

              <div className="onboarding-text">
                An administrator must assign your
                account to an organization before
                you can access OneTime Labs
                applications.
              </div>

              <button
                className="dashboard-signout"
                onClick={async () => {
                  await supabase.auth.signOut();

                  window.location.href =
                    "/login";
                }}
              >
                Sign Out
              </button>

            </div>

          )}

        </div>

      </section>

      {/* ================================================
          Administration
          ================================================ */}

      {isPlatformAdmin && (

        <section className="dashboard-panel">

          <div className="panel-header">
            Administration
          </div>

          <div className="dashboard-grid">

<button
  className="dashboard-tile"
  onClick={onOpenOrganizations}
>
  <div className="tile-icon">
    🏢
  </div>

  <div className="tile-title">
    Organizations
  </div>

  <div className="tile-description">
    Manage organizations and access.
  </div>
</button>

            <button
              className="dashboard-tile"
              disabled
            >

              <div className="tile-icon">
                🏢
              </div>

              <div className="tile-title">
                Organizations
              </div>

              <div className="tile-description">
                Coming Soon
              </div>

            </button>

            <button
              className="dashboard-tile"
              disabled
            >

              <div className="tile-icon">
                📦
              </div>

              <div className="tile-title">
                Applications
              </div>

              <div className="tile-description">
                Coming Soon
              </div>

            </button>

          </div>

        </section>

      )}

    </div>
  );
}