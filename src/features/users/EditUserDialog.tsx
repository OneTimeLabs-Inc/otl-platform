import {
  useEffect,
  useState,
} from "react";

import type {
  PlatformUser,
} from "../../types/platformUser";

import {
  getPlatformOrganizations,
  type PlatformOrganization,
} from "../../services/platformOrganizations";

import {
  getPlatformRoles,
  type PlatformRole,
} from "../../services/platformRoles";

import {
  assignUserToOrganization,
  getCurrentPlatformUser,
  grantPlatformAdmin,
  revokePlatformAdmin,
  unassignUserFromOrganization,
} from "../../services/platformUsers";

import "./EditUserDialog.css";


/* ==========================================================
   EDIT USER DIALOG 001
   ========================================================== */

type Props = {

  open: boolean;

  user:
    PlatformUser | null;

  onClose: () => void;

  onSaved: () => void;

};


export default function EditUserDialog({

  open,
  user,
  onClose,
  onSaved,

}: Props) {


  /* ========================================================
     STATE 002
     ======================================================== */

  const [
    organizations,
    setOrganizations,
  ] =
    useState<PlatformOrganization[]>([]);


  const [
    roles,
    setRoles,
  ] =
    useState<PlatformRole[]>([]);


  const [
    currentPlatformUser,
    setCurrentPlatformUser,
  ] =
    useState<PlatformUser | null>(null);


  const [
    selectedOrganization,
    setSelectedOrganization,
  ] =
    useState("");


  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    unassigning,
    setUnassigning,
  ] =
    useState(false);


  const [
    changingPlatformAdmin,
    setChangingPlatformAdmin,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  /* ========================================================
     PERMISSIONS 003
     ======================================================== */

const isCurrentUser =
  currentPlatformUser?.id ===
  user?.id;


const isPlatformAdmin =
  currentPlatformUser
    ?.is_platform_admin === true;


const isTargetPlatformOwner =
  user?.is_platform_owner === true;


const canManageUser =
  isPlatformAdmin &&
  !isCurrentUser &&
  !isTargetPlatformOwner;


  const hasOrganization =
    Boolean(
      user?.organization_id,
    );


  const busy =
    saving ||
    unassigning ||
    changingPlatformAdmin;


  /* ========================================================
     LOAD 004
     ======================================================== */

  useEffect(() => {

    if (
      !open ||
      !user
    ) {

      return;

    }


    let active = true;


    async function loadOptions() {

      if (!user) {

        return;

      }


      setLoading(true);

      setError("");


      try {

        const [
          currentUser,
          orgs,
          platformRoles,
        ] =
          await Promise.all([

            getCurrentPlatformUser(),

            getPlatformOrganizations(),

            getPlatformRoles(),

          ]);


        if (!active) {

          return;

        }


        setCurrentPlatformUser(
          currentUser,
        );


        setOrganizations(
          orgs,
        );


        setRoles(
          platformRoles,
        );


        setSelectedOrganization(
          user.organization_id ?? "",
        );


        const matchingRole =
          platformRoles.find(
            (role) =>

              role.display_name ===
                user.organization_role ||

              role.code ===
                user.organization_role,
          );


        setSelectedRole(
          matchingRole?.id ?? "",
        );

      }
      catch (loadError) {

        console.error(
          "Unable to load user administration options:",
          loadError,
        );


        if (active) {

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load user.",
          );

        }

      }
      finally {

        if (active) {

          setLoading(false);

        }

      }

    }


    void loadOptions();


    return () => {

      active = false;

    };

  }, [
    open,
    user,
  ]);


  /* ========================================================
     SAVE ORGANIZATION 005
     ======================================================== */

  async function handleSave() {

    if (
      !user ||
      !canManageUser ||
      !selectedOrganization ||
      !selectedRole
    ) {

      return;

    }


    setSaving(true);

    setError("");


    try {

      await assignUserToOrganization(

        user.id,

        selectedOrganization,

        selectedRole,

      );


      onSaved();

    }
    catch (saveError) {

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save organization access.",
      );

    }
    finally {

      setSaving(false);

    }

  }


  /* ========================================================
     UNASSIGN 006
     ======================================================== */

  async function handleUnassign() {

    if (
      !user ||
      !canManageUser ||
      !user.organization_id
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        `Unassign ${user.email} from ${user.organization_name ?? "this organization"}?`,
      );


    if (!confirmed) {

      return;

    }


    setUnassigning(true);

    setError("");


    try {

      await unassignUserFromOrganization(
        user.id,
      );


      onSaved();

    }
    catch (unassignError) {

      setError(
        unassignError instanceof Error
          ? unassignError.message
          : "Unable to unassign user.",
      );

    }
    finally {

      setUnassigning(false);

    }

  }


  /* ========================================================
     PLATFORM ADMIN 007
     ======================================================== */

  async function handlePlatformAdminChange() {

    if (
      !user ||
      !canManageUser
    ) {

      return;

    }


    const granting =
      !user.is_platform_admin;


    const confirmed =
      window.confirm(
        granting
          ? `Make ${user.email} a Platform Administrator?`
          : `Revoke Platform Administrator access from ${user.email}?`,
      );


    if (!confirmed) {

      return;

    }


    setChangingPlatformAdmin(true);

    setError("");


    try {

      if (granting) {

        await grantPlatformAdmin(
          user.id,
        );

      } else {

        await revokePlatformAdmin(
          user.id,
        );

      }


      onSaved();

    }
    catch (adminError) {

      setError(
        adminError instanceof Error
          ? adminError.message
          : "Unable to change Platform Administrator access.",
      );

    }
    finally {

      setChangingPlatformAdmin(false);

    }

  }


  /* ========================================================
     CLOSED 008
     ======================================================== */

  if (
    !open ||
    !user
  ) {

    return null;

  }


  /* ========================================================
     RENDER 009
     ======================================================== */

  return (

    <div className="dialog-backdrop">

      <div className="edit-user-dialog">


        {/* ==================================================
            HEADER 010
            ================================================== */}

        <div className="dialog-header">

          <div className="dialog-title">

<h2>

  {isTargetPlatformOwner
    ? "Platform Owner"
    : canManageUser
      ? "Manage User"
      : "Account Information"}

</h2>

            <span>
              {user.email}
            </span>

          </div>


          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            disabled={busy}
          >
            ✕
          </button>

        </div>


        {/* ==================================================
            BODY 011
            ================================================== */}

        <div className="dialog-body">


          {/* ==================================================
              USER SUMMARY 012
              ================================================== */}

          <div className="user-summary">

            <div className="user-summary-avatar">

              {user.avatar_url ? (

                <img
                  src={user.avatar_url}
                  alt={
                    user.display_name ??
                    "User"
                  }
                />

              ) : (

                <span>
                  {
                    (
                      user.display_name ??
                      user.email ??
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()
                  }
                </span>

              )}

            </div>


            <div className="user-summary-info">

              <strong>
                {user.display_name ??
                  "Unnamed User"}
              </strong>

              <span>
                {user.email}
              </span>

            </div>

          </div>


          {/* ==================================================
              PLATFORM ACCESS 013
              ================================================== */}

          <section className="compact-section">

            <div className="compact-section-title">
              Platform Access
            </div>


<div className="permission-row">

  <div className="permission-info">

    <strong>

      {user.is_platform_owner
        ? "Platform Owner"
        : "Platform Administrator"}

    </strong>

    <span>

      {user.is_platform_owner
        ? "Protected platform ownership account"
        : "Full platform administration"}

    </span>

  </div>


  {user.is_platform_owner ? (

    <span className="compact-badge owner">
      Owner
    </span>

  ) : user.is_platform_admin ? (

    <span className="compact-badge admin">
      Enabled
    </span>

  ) : (

    <span className="compact-badge">
      Disabled
    </span>

  )}


  {!isTargetPlatformOwner &&
    canManageUser && (

      <button
        type="button"
        className={
          user.is_platform_admin
            ? "mini-button danger"
            : "mini-button"
        }
        disabled={busy}
        onClick={() => {
          void handlePlatformAdminChange();
        }}
      >

        {changingPlatformAdmin
          ? "..."
          : user.is_platform_admin
            ? "Revoke"
            : "Enable"}

      </button>

    )}

</div>

{isTargetPlatformOwner && (

  <div className="owner-protection-note">

    This is the protected Platform Owner account.
    It cannot be modified through Platform.

  </div>

)}

            {isCurrentUser &&
              user.is_platform_admin && (

                <div className="compact-note">
                  Your own Platform Administrator
                  access cannot be revoked here.
                </div>

              )}

          </section>


          {/* ==================================================
              ORGANIZATION ACCESS 014
              ================================================== */}

          {canManageUser && (

            <section className="compact-section">

              <div className="compact-section-title">
                Organization Access
              </div>


              {loading ? (

                <div className="compact-loading">
                  Loading...
                </div>

              ) : (

                <>


                  <div className="compact-field">

                    <label>
                      Organization
                    </label>


                    <select
                      value={
                        selectedOrganization
                      }
                      disabled={busy}
                      onChange={(event) =>
                        setSelectedOrganization(
                          event.target.value,
                        )
                      }
                    >

                      <option value="">
                        Select Organization
                      </option>


                      {organizations.map(
                        (organization) => (

                          <option
                            key={
                              organization.id
                            }
                            value={
                              organization.id
                            }
                          >
                            {organization.name}
                          </option>

                        ),
                      )}

                    </select>

                  </div>


                  <div className="compact-field">

                    <label>
                      Role
                    </label>


                    <select
                      value={
                        selectedRole
                      }
                      disabled={busy}
                      onChange={(event) =>
                        setSelectedRole(
                          event.target.value,
                        )
                      }
                    >

                      <option value="">
                        Select Role
                      </option>


                      {roles.map(
                        (role) => (

                          <option
                            key={
                              role.id
                            }
                            value={
                              role.id
                            }
                          >
                            {role.display_name}
                          </option>

                        ),
                      )}

                    </select>

                  </div>


                  {hasOrganization && (

                    <div className="assignment-row">

                      <div>

                        <span>
                          Current
                        </span>

                        <strong>
                          {user.organization_name}
                        </strong>

                        <small>
                          {user.organization_role ??
                            "No role"}
                        </small>

                      </div>


                      <button
                        type="button"
                        className="mini-button danger"
                        disabled={busy}
                        onClick={() => {
                          void handleUnassign();
                        }}
                      >

                        {unassigning
                          ? "..."
                          : "Unassign"}

                      </button>

                    </div>

                  )}


                </>

              )}

            </section>

          )}


          {/* ==================================================
              ERROR 015
              ================================================== */}

          {error && (

            <div className="compact-error">
              {error}
            </div>

          )}


        </div>


        {/* ==================================================
            FOOTER 016
            ================================================== */}

        <div className="dialog-footer">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>


          {canManageUser && (

            <button
              type="button"
              className="primary-button"
              disabled={
                busy ||
                !selectedOrganization ||
                !selectedRole
              }
              onClick={() => {
                void handleSave();
              }}
            >

              {saving
                ? "Saving..."
                : hasOrganization
                  ? "Save"
                  : "Assign"}

            </button>

          )}

        </div>


      </div>

    </div>

  );

}