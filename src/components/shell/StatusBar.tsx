import { useEffect, useState } from "react";

import {
  getMyOrganization,
  type Organization,
} from "../../services/organizations";

import "./StatusBar.css";

export default function StatusBar() {
  const [organization, setOrganization] =
    useState<Organization | null>(null);

  useEffect(() => {
    async function loadOrganization() {
      const org =
        await getMyOrganization();

      setOrganization(org);
    }

    void loadOrganization();
  }, []);

  return (
    <footer className="statusbar">

      {/* ======================================================
          LEFT 001
          ====================================================== */}

      <div className="status-left">

        <span>
          Ready
        </span>

      </div>

      {/* ======================================================
          CENTER 001
          ====================================================== */}

      <div className="status-center">

        <span>
          Organization:
        </span>

        <strong>
          {organization?.name ??
            "Unknown"}
        </strong>

      </div>

      {/* ======================================================
          RIGHT 001
          ====================================================== */}

      <div className="status-right">

        <span>
          OneTime Labs Platform
        </span>

        <strong>
          v0.1.0
        </strong>

      </div>

    </footer>
  );
}