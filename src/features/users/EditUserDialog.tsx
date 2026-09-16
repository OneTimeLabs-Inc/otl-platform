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
  updateOrganization,
} from "../../services/organizations";

import {
  archivePlatformUser,
  assignUserToOrganization,
  getCurrentPlatformUser,
  grantPlatformAdmin,
  restorePlatformUser,
  revokePlatformAdmin,
  unassignUserFromOrganization,
  updatePlatformUserDetails,
} from "../../services/platformUsers";

import "./EditUserDialog.css";


/* ==========================================================
   EDIT USER DIALOG 001
   Platform-only user administration
   ========================================================== */

type Props = {
  open: boolean;
  user: PlatformUser | null;
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

  const [organizations, setOrganizations] =
    useState<PlatformOrganization[]>([]);

  const [roles, setRoles] =
    useState<PlatformRole[]>([]);

  const [currentPlatformUser, setCurrentPlatformUser] =
    useState<PlatformUser | null>(null);

  const [selectedOrganization, setSelectedOrganization] =
    useState("");

  const [selectedRole, setSelectedRole] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [organizationName, setOrganizationName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [savingMembership, setSavingMembership] =
    useState(false);

  const [savingDetails, setSavingDetails] =
    useState(false);

  const [savingOrganizationName, setSavingOrganizationName] =
    useState(false);

  const [unassigning, setUnassigning] =
    useState(false);

  const [changingPlatformAdmin, setChangingPlatformAdmin] =
    useState(false);

  const [archiving, setArchiving] =
    useState(false);

  const [restoring, setRestoring] =
    useState(false);

  const [error, setError] =
    useState("");


  /* ========================================================
     PERMISSIONS 003
     ======================================================== */

  const isCurrentUser =
    currentPlatformUser?.id === user?.id;

  const isPlatformAdmin =
    currentPlatformUser?.is_platform_admin === true ||
    currentPlatformUser?.is_platform_owner === true;

  const isTargetPlatformOwner =
    user?.is_platform_owner === true;

  const canManageUser =
    isPlatformAdmin &&
    !isCurrentUser &&
    !isTargetPlatformOwner;

  const hasOrganization =
    Boolean(user?.organization_id);

  const busy =
    savingMembership ||
    savingDetails ||
    savingOrganizationName ||
    unassigning ||
    changingPlatformAdmin ||
    archiving ||
    restoring;


  /* ========================================================
     LOAD 004
     ======================================================== */

  useEffect(() => {
    if (!open || !user) return;

    const targetUser = user;
    let active = true;

    async function loadOptions() {
      setLoading(true);
      setError("");
      setDisplayName(targetUser.display_name ?? "");
      setOrganizationName(targetUser.organization_name ?? "");

      try {
        const [currentUser, orgs, platformRoles] =
          await Promise.all([
            getCurrentPlatformUser(),
            getPlatformOrganizations(),
            getPlatformRoles(),
          ]);

        if (!active) return;

        setCurrentPlatformUser(currentUser);
        setOrganizations(orgs);
        setRoles(platformRoles);
        setSelectedOrganization(targetUser.organization_id ?? "");

        const currentOrganization =
          orgs.find(organization => organization.id === targetUser.organization_id);

        setOrganizationName(
          currentOrganization?.name ?? targetUser.organization_name ?? "",
        );

        const matchingRole =
          platformRoles.find(
            (role) =>
              role.display_name === targetUser.organization_role ||
              role.code === targetUser.organization_role,
          );

        setSelectedRole(matchingRole?.id ?? "");
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
        if (active) setLoading(false);
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, [open, user]);


  /* ========================================================
     SAVE USER DETAILS 005
     ======================================================== */

  async function handleSaveDetails() {
    if (!user || !canManageUser) return;

    const cleaned = displayName.trim();

    if (cleaned.length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }

    setSavingDetails(true);
    setError("");

    try {
      await updatePlatformUserDetails(user.id, cleaned);
      await onSaved();
    }
    catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save user details.",
      );
    }
    finally {
      setSavingDetails(false);
    }
  }


  /* ========================================================
     SAVE ORGANIZATION IDENTITY 006
     Platform owns the organization/store identity.
     ======================================================== */

  async function handleSaveOrganizationName() {
    if (!user || !canManageUser || !user.organization_id) return;

    const cleaned = organizationName.trim();

    if (cleaned.length < 2) {
      setError("Organization / Store Name must be at least 2 characters.");
      return;
    }

    const organization =
      organizations.find(item => item.id === user.organization_id);

    if (!organization) {
      setError("Unable to resolve the current organization.");
      return;
    }

    setSavingOrganizationName(true);
    setError("");

    try {
      await updateOrganization(
        organization.id,
        {
          name: cleaned,
          slug: organization.slug,
          active: organization.active,
        },
      );

      await onSaved();
    }
    catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save organization / Store name.",
      );
    }
    finally {
      setSavingOrganizationName(false);
    }
  }


  /* ========================================================
     SAVE ORGANIZATION ACCESS 007
     ======================================================== */

  async function handleSaveMembership() {
    if (
      !user ||
      !canManageUser ||
      !selectedOrganization ||
      !selectedRole
    ) {
      return;
    }

    setSavingMembership(true);
    setError("");

    try {
      await assignUserToOrganization(
        user.id,
        selectedOrganization,
        selectedRole,
      );

      await onSaved();
    }
    catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save organization access.",
      );
    }
    finally {
      setSavingMembership(false);
    }
  }


  /* ========================================================
     UNASSIGN 007
     ======================================================== */

  async function handleUnassign() {
    if (!user || !canManageUser || !user.organization_id) return;

    const confirmed = window.confirm(
      `Unassign ${user.email} from ${user.organization_name ?? "this organization"}?`,
    );

    if (!confirmed) return;

    setUnassigning(true);
    setError("");

    try {
      await unassignUserFromOrganization(user.id);
      await onSaved();
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
     PLATFORM ADMIN 008
     ======================================================== */

  async function handlePlatformAdminChange() {
    if (!user || !canManageUser || !user.active) return;

    const granting = !user.is_platform_admin;

    const confirmed = window.confirm(
      granting
        ? `Make ${user.email} a Platform Administrator?`
        : `Revoke Platform Administrator access from ${user.email}?`,
    );

    if (!confirmed) return;

    setChangingPlatformAdmin(true);
    setError("");

    try {
      if (granting) {
        await grantPlatformAdmin(user.id);
      } else {
        await revokePlatformAdmin(user.id);
      }

      await onSaved();
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
     ARCHIVE / RESTORE 009
     ======================================================== */

  async function handleArchiveUser() {
    if (!user || !canManageUser || !user.active) return;

    const confirmed = window.confirm(
      `Delete ${user.email} from Platform?\n\n` +
      "This is audit-safe: the Platform user is deactivated, organization access is removed, and any Store seller tied to this account is suspended with public listings archived. Historical user and Store records are retained.",
    );

    if (!confirmed) return;

    setArchiving(true);
    setError("");

    try {
      await archivePlatformUser(user.id);
      await onSaved();
      onClose();
    }
    catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to delete Platform user.",
      );
    }
    finally {
      setArchiving(false);
    }
  }

  async function handleRestoreUser() {
    if (!user || !canManageUser || user.active) return;

    const confirmed = window.confirm(
      `Restore ${user.email} to Platform?`,
    );

    if (!confirmed) return;

    setRestoring(true);
    setError("");

    try {
      await restorePlatformUser(user.id);
      await onSaved();
      onClose();
    }
    catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore Platform user.",
      );
    }
    finally {
      setRestoring(false);
    }
  }


  /* ========================================================
     CLOSED 010
     ======================================================== */

  if (!open || !user) return null;


  /* ========================================================
     RENDER 011
     ======================================================== */

  return (
    <div className="dialog-backdrop">
      <div className="edit-user-dialog">

        {/* ==================================================
            HEADER 012
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
            <span>{user.email}</span>
          </div>

          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ✕
          </button>
        </div>


        {/* ==================================================
            BODY 013
            ================================================== */}

        <div className="dialog-body">

          <div className="user-summary">
            <div className="user-summary-avatar">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name ?? "User"}
                />
              ) : (
                <span>
                  {(user.display_name ?? user.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="user-summary-info">
              <strong>{user.display_name ?? "Unnamed User"}</strong>
              <span>{user.email}</span>
            </div>

            <span
              className={`compact-badge ${user.active ? "active" : "archived"}`}
            >
              {user.active ? "Active" : "Archived"}
            </span>
          </div>


          {/* ==================================================
              USER DETAILS 014
              ================================================== */}

          {canManageUser && (
            <section className="compact-section">
              <div className="compact-section-title">
                User Details
              </div>

              <div className="compact-field">
                <label htmlFor="platform-user-display-name">
                  Display Name
                </label>
                <input
                  id="platform-user-display-name"
                  value={displayName}
                  disabled={busy || !user.active}
                  maxLength={120}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
                <span className="compact-field-help">
                  Platform display name. Organization and Store identity are managed below.
                </span>
              </div>

              <div className="compact-field">
                <label>Email</label>
                <input
                  value={user.email}
                  disabled
                  readOnly
                />
              </div>

              <div className="compact-section-actions">
                <button
                  type="button"
                  className="mini-button"
                  disabled={
                    busy ||
                    !user.active ||
                    displayName.trim().length < 2 ||
                    displayName.trim() === (user.display_name ?? "").trim()
                  }
                  onClick={() => void handleSaveDetails()}
                >
                  {savingDetails ? "Saving..." : "Save Details"}
                </button>
              </div>
            </section>
          )}


          {/* ==================================================
              PLATFORM ACCESS 015
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
                <span className="compact-badge owner">Owner</span>
              ) : user.is_platform_admin ? (
                <span className="compact-badge admin">Enabled</span>
              ) : (
                <span className="compact-badge">Disabled</span>
              )}

              {!isTargetPlatformOwner && canManageUser && user.active && (
                <button
                  type="button"
                  className={user.is_platform_admin ? "mini-button danger" : "mini-button"}
                  disabled={busy}
                  onClick={() => void handlePlatformAdminChange()}
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
                This is the protected Platform Owner account. It cannot be modified through Platform.
              </div>
            )}

            {isCurrentUser && user.is_platform_admin && (
              <div className="compact-note">
                Your own Platform Administrator access cannot be revoked here.
              </div>
            )}
          </section>


          {/* ==================================================
              ORGANIZATION ACCESS 016
              ================================================== */}

          {canManageUser && user.active && (
            <section className="compact-section">
              <div className="compact-section-title">
                Organization Access
              </div>

              {loading ? (
                <div className="compact-loading">Loading...</div>
              ) : (
                <>
                  {hasOrganization && (
                    <div className="organization-store-identity">
                      <div className="compact-field">
                        <label htmlFor="platform-organization-store-name">
                          Organization / Store Name
                        </label>
                        <input
                          id="platform-organization-store-name"
                          value={organizationName}
                          disabled={busy}
                          maxLength={120}
                          onChange={(event) =>
                            setOrganizationName(event.target.value)
                          }
                        />
                        <span className="compact-field-help">
                          Updates the organization and the linked Store seller name.
                        </span>
                      </div>

                      <div className="compact-section-actions">
                        <button
                          type="button"
                          className="mini-button"
                          disabled={
                            busy ||
                            organizationName.trim().length < 2 ||
                            organizationName.trim() ===
                              (user.organization_name ?? "").trim()
                          }
                          onClick={() => void handleSaveOrganizationName()}
                        >
                          {savingOrganizationName
                            ? "Saving..."
                            : "Save Name"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="compact-field">
                    <label>Organization</label>
                    <select
                      value={selectedOrganization}
                      disabled={busy}
                      onChange={(event) => setSelectedOrganization(event.target.value)}
                    >
                      <option value="">Select Organization</option>
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="compact-field">
                    <label>Role</label>
                    <select
                      value={selectedRole}
                      disabled={busy}
                      onChange={(event) => setSelectedRole(event.target.value)}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.display_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="compact-section-actions split-actions">
                    <div>
                      {hasOrganization && (
                        <button
                          type="button"
                          className="mini-button danger"
                          disabled={busy}
                          onClick={() => void handleUnassign()}
                        >
                          {unassigning ? "..." : "Unassign"}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="mini-button"
                      disabled={busy || !selectedOrganization || !selectedRole}
                      onClick={() => void handleSaveMembership()}
                    >
                      {savingMembership
                        ? "Saving..."
                        : hasOrganization
                          ? "Save Access"
                          : "Assign"}
                    </button>
                  </div>

                  {hasOrganization && (
                    <div className="assignment-row">
                      <div>
                        <span>Current</span>
                        <strong>{user.organization_name}</strong>
                        <small>{user.organization_role ?? "No role"}</small>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}


          {/* ==================================================
              DANGER ZONE 017
              ================================================== */}

          {canManageUser && (
            <section className="compact-section danger-zone">
              <div className="compact-section-title">
                Account Lifecycle
              </div>

              {user.active ? (
                <div className="danger-zone-row">
                  <div>
                    <strong>Delete User</strong>
                    <span>
                      Deactivates access while preserving the audit history.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mini-button danger"
                    disabled={busy}
                    onClick={() => void handleArchiveUser()}
                  >
                    {archiving ? "Deleting..." : "Delete User"}
                  </button>
                </div>
              ) : (
                <div className="danger-zone-row restore-row">
                  <div>
                    <strong>Archived User</strong>
                    <span>
                      Restores the account without automatically restoring organization access.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mini-button"
                    disabled={busy}
                    onClick={() => void handleRestoreUser()}
                  >
                    {restoring ? "Restoring..." : "Restore User"}
                  </button>
                </div>
              )}
            </section>
          )}

          {error && (
            <div className="compact-error">{error}</div>
          )}
        </div>


        {/* ==================================================
            FOOTER 018
            ================================================== */}

        <div className="dialog-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
