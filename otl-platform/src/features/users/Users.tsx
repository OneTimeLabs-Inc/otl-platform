import { useEffect, useState } from "react";

import { getPlatformUsers } from "../../services/platformUsers";

import type { PlatformUser } from "../../types/platformUser";

import EditUserDialog from "./EditUserDialog";

import "./Users.css";

export default function Users() {
  const [users, setUsers] =
    useState<PlatformUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedUser, setSelectedUser] =
    useState<PlatformUser | null>(null);

  const [dialogOpen, setDialogOpen] =
    useState(false);

  async function loadUsers() {
    setLoading(true);

    try {
      const data =
        await getPlatformUsers();

      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function openUser(
    user: PlatformUser,
  ) {
    setSelectedUser(user);

    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);

    setSelectedUser(null);
  }

  return (
    <>
      <div className="users-page">

        <div className="users-header">

          <div>

            <h1>Users</h1>

            <p>
              Manage platform users and
              organization memberships.
            </p>

          </div>

          <button className="primary-button">
            + Invite User
          </button>

        </div>

        <div className="users-table">

          <div className="users-table-header">

            <div>Name</div>

            <div>Email</div>

            <div>Organization</div>

            <div>Role</div>

            <div>Platform</div>

            <div>Status</div>

          </div>

          {loading && (

            <div className="users-loading">
              Loading users...
            </div>

          )}

          {!loading &&
            users.map((user) => (

              <div
                key={user.id}
                className="users-row"
                onClick={() =>
                  openUser(user)
                }
              >

                <div>
                  {user.display_name ??
                    "(Unknown)"}
                </div>

                <div>{user.email}</div>

                <div>
                  {user.organization_name ??
                    "-"}
                </div>

                <div>
                  {user.organization_role ??
                    "-"}
                </div>

                <div>

                  {user.is_platform_admin ? (

                    <span className="badge blue">
                      Platform Admin
                    </span>

                  ) : (

                    <span className="badge gray">
                      User
                    </span>

                  )}

                </div>

                <div>

                  <span
                    className={`badge ${
                      user.active
                        ? "green"
                        : "gray"
                    }`}
                  >
                    {user.active
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>

              </div>

            ))}

        </div>

      </div>

      <EditUserDialog
        open={dialogOpen}
        user={selectedUser}
        onClose={closeDialog}
        onSaved={() => {
          closeDialog();
          void loadUsers();
        }}
      />
    </>
  );
}