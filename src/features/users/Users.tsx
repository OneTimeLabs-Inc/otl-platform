import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import {
  getPlatformUsers,
} from "../../services/platformUsers";

import type {
  PlatformUser,
} from "../../types/platformUser";

import EditUserDialog from "./EditUserDialog";

import "./Users.css";


/* ==========================================================
   USERS 001
   Platform user administration
   ========================================================== */

export default function Users() {


  /* ========================================================
     STATE 002
     ======================================================== */

  const [
    users,
    setUsers,
  ] =
    useState<PlatformUser[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<PlatformUser | null>(
      null,
    );


  const [
    dialogOpen,
    setDialogOpen,
  ] =
    useState(false);


  const [
    expandedOrganizations,
    setExpandedOrganizations,
  ] =
    useState<Set<string>>(
      new Set(),
    );


  /* ========================================================
     LOAD USERS 003
     ======================================================== */

  async function loadUsers() {

    setLoading(
      true,
    );


    try {

      const data =
        await getPlatformUsers();


      setUsers(
        data,
      );

    }
    finally {

      setLoading(
        false,
      );

    }

  }


  useEffect(() => {

    void loadUsers();

  }, []);


  /* ========================================================
     USER CLASSIFICATION 004
     Each user appears in one primary section.
     ======================================================== */

const platformAdmins =
  useMemo(
    () =>
      users.filter(
        (user) =>
          user.is_platform_admin ||
          user.is_platform_owner,
      ),
    [
      users,
    ],
  );


  const unassignedUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            !user.is_platform_admin &&
            !user.organization_id,
        ),
      [
        users,
      ],
    );


  const organizationUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            !user.is_platform_admin &&
            Boolean(
              user.organization_id,
            ),
        ),
      [
        users,
      ],
    );


  /* ========================================================
     ORGANIZATION GROUPS 005
     ======================================================== */

  const organizationGroups =
    useMemo(
      () => {

        const groups =
          new Map<
            string,
            {
              id: string;
              name: string;
              users: PlatformUser[];
            }
          >();


        for (
          const user
          of organizationUsers
        ) {

          if (
            !user.organization_id
          ) {

            continue;

          }


          const existing =
            groups.get(
              user.organization_id,
            );


          if (existing) {

            existing.users.push(
              user,
            );

            continue;

          }


          groups.set(
            user.organization_id,
            {

              id:
                user.organization_id,

              name:
                user.organization_name ??
                "Unknown Organization",

              users:
                [
                  user,
                ],

            },
          );

        }


        return Array
          .from(
            groups.values(),
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
              ),
          );

      },
      [
        organizationUsers,
      ],
    );


  /* ========================================================
     DIALOG 006
     ======================================================== */

  function openUser(
    user: PlatformUser,
  ) {

    setSelectedUser(
      user,
    );

    setDialogOpen(
      true,
    );

  }


  function closeDialog() {

    setDialogOpen(
      false,
    );

    setSelectedUser(
      null,
    );

  }


  /* ========================================================
     ORGANIZATION EXPANSION 007
     ======================================================== */

  function toggleOrganization(
    organizationId: string,
  ) {

    setExpandedOrganizations(
      (current) => {

        const next =
          new Set(
            current,
          );


        if (
          next.has(
            organizationId,
          )
        ) {

          next.delete(
            organizationId,
          );

        } else {

          next.add(
            organizationId,
          );

        }


        return next;

      },
    );

  }


  /* ========================================================
     USER ROW 008
     ======================================================== */

  function renderUserRow(
    user: PlatformUser,
    options?: {
      showOrganization?: boolean;
      platformAdmin?: boolean;
    },
  ) {

    const showOrganization =
      options?.showOrganization ??
      false;


    const platformAdmin =
      options?.platformAdmin ??
      false;


    return (

      <div
        key={
          user.id
        }
        className="users-row"
        onClick={() =>
          openUser(
            user,
          )
        }
      >

        <div className="user-name-cell">

          <span className="user-name">
            {user.display_name ??
              "(Unknown)"}
          </span>

        </div>


        <div className="user-email-cell">
          {user.email}
        </div>


        <div>

          {showOrganization
            ? (
              user.organization_name ??
              "-"
            )
            : (
              user.organization_role ??
              "-"
            )}

        </div>


        <div>

{user.is_platform_owner ? (

  <span className="badge owner">
    Platform Owner
  </span>

) : platformAdmin ? (

  <span className="badge blue">
    Platform Admin
  </span>

) : user.organization_role ? (

  <span className="badge gray">
    {user.organization_role}
  </span>

) : (

  <span className="badge orange">
    Unassigned
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

    );

  }


  /* ========================================================
     PAGE 009
     ======================================================== */

  return (

    <>

      <div className="users-page">


        {/* ==================================================
            HEADER 010
            ================================================== */}

        <div className="users-header">

          <div>

            <h1>
              Users
            </h1>

            <p>
              Manage platform users and
              organization memberships.
            </p>

          </div>


          <button
            type="button"
            className="primary-button"
          >
            + Invite User
          </button>

        </div>


        {/* ==================================================
            CONTENT 011
            ================================================== */}

        <div className="users-content">


          {loading && (

            <div className="users-loading">
              Loading users...
            </div>

          )}


          {!loading && (

            <>


              {/* ============================================
                  PLATFORM ADMINISTRATORS 012
                  ============================================ */}

              <section className="user-section">

                <div className="user-section-header">

                  <div>

                    <h2>
                      Platform Administrators
                    </h2>

                    <p>
                      Users with administrative
                      access to the OneTime Labs platform.
                    </p>

                  </div>


                  <span className="section-count">
                    {platformAdmins.length}
                  </span>

                </div>


                <div className="users-table">

                  <div className="users-table-header">

                    <div>
                      Name
                    </div>

                    <div>
                      Email
                    </div>

                    <div>
                      Organization
                    </div>

                    <div>
                      Platform Access
                    </div>

                    <div>
                      Status
                    </div>

                  </div>


                  {platformAdmins.length === 0 ? (

                    <div className="users-empty">
                      No Platform Administrators.
                    </div>

                  ) : (

                    platformAdmins.map(
                      (user) =>
                        renderUserRow(
                          user,
                          {
                            showOrganization:
                              true,

                            platformAdmin:
                              true,
                          },
                        ),
                    )

                  )}

                </div>

              </section>


              {/* ============================================
                  UNASSIGNED USERS 013
                  ============================================ */}

              <section className="user-section">

                <div className="user-section-header">

                  <div>

                    <h2>
                      Unassigned Users
                    </h2>

                    <p>
                      Platform accounts that have not
                      been assigned to an organization.
                    </p>

                  </div>


                  <span className="section-count">
                    {unassignedUsers.length}
                  </span>

                </div>


                <div className="users-table">

                  <div className="users-table-header">

                    <div>
                      Name
                    </div>

                    <div>
                      Email
                    </div>

                    <div>
                      Organization
                    </div>

                    <div>
                      Access
                    </div>

                    <div>
                      Status
                    </div>

                  </div>


                  {unassignedUsers.length === 0 ? (

                    <div className="users-empty">
                      No unassigned users.
                    </div>

                  ) : (

                    unassignedUsers.map(
                      (user) =>
                        renderUserRow(
                          user,
                          {
                            showOrganization:
                              true,
                          },
                        ),
                    )

                  )}

                </div>

              </section>


              {/* ============================================
                  ORGANIZATIONS 014
                  ============================================ */}

              <section className="user-section organizations-section">

                <div className="user-section-header">

                  <div>

                    <h2>
                      Organizations
                    </h2>

                    <p>
                      Users grouped by their assigned
                      organization.
                    </p>

                  </div>


                  <span className="section-count">
                    {organizationGroups.length}
                  </span>

                </div>


                <div className="organization-list">


                  {organizationGroups.length === 0 ? (

                    <div className="organizations-empty">
                      No organizations contain assigned users.
                    </div>

                  ) : (

                    organizationGroups.map(
                      (organization) => {

                        const expanded =
                          expandedOrganizations.has(
                            organization.id,
                          );


                        return (

                          <div
                            key={
                              organization.id
                            }
                            className="organization-group"
                          >


                            {/* ==================================
                                ORGANIZATION HEADER 015
                                ================================== */}

                            <button
                              type="button"
                              className="organization-group-header"
                              onClick={() =>
                                toggleOrganization(
                                  organization.id,
                                )
                              }
                            >

                              <span className="organization-chevron">

                                {expanded ? (

                                  <ChevronDown
                                    size={17}
                                  />

                                ) : (

                                  <ChevronRight
                                    size={17}
                                  />

                                )}

                              </span>


                              <span className="organization-group-name">
                                {organization.name}
                              </span>


                              <span className="organization-user-count">

                                {organization.users.length}

                                {" "}

                                {organization.users.length === 1
                                  ? "user"
                                  : "users"}

                              </span>

                            </button>


                            {/* ==================================
                                ORGANIZATION USERS 016
                                ================================== */}

                            {expanded && (

                              <div className="organization-users">

                                <div className="users-table-header">

                                  <div>
                                    Name
                                  </div>

                                  <div>
                                    Email
                                  </div>

                                  <div>
                                    Role
                                  </div>

                                  <div>
                                    Access
                                  </div>

                                  <div>
                                    Status
                                  </div>

                                </div>


                                {organization.users.map(
                                  (user) =>
                                    renderUserRow(
                                      user,
                                    ),
                                )}

                              </div>

                            )}


                          </div>

                        );

                      },
                    )

                  )}


                </div>

              </section>


            </>

          )}


        </div>

      </div>


      {/* ====================================================
          EDIT USER 017
          ==================================================== */}

      <EditUserDialog
        open={
          dialogOpen
        }
        user={
          selectedUser
        }
        onClose={
          closeDialog
        }
        onSaved={() => {

          closeDialog();

          void loadUsers();

        }}
      />

    </>

  );

}