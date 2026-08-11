import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../../hooks/useAuth";

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
  unassignUserFromOrganization,
} from "../../services/platformUsers";

import "./EditUserDialog.css";


/* ==========================================================
   EDIT USER DIALOG 001
   Properties
   ========================================================== */

type Props = {

  open: boolean;

  user:
    PlatformUser | null;

  onClose:
    () => void;

  onSaved:
    () => void;

};


/* ==========================================================
   EDIT USER DIALOG 002
   ========================================================== */

export default function EditUserDialog({

  open,
  user,
  onClose,
  onSaved,

}: Props) {


  /* ========================================================
     AUTHENTICATION 003
     ======================================================== */

  const {
    user: currentAuthUser,
  } =
    useAuth();


  /* ========================================================
     OPTIONS 004
     ======================================================== */

  const [
    organizations,
    setOrganizations,
  ] =
    useState<PlatformOrganization[]>(
      [],
    );


  const [
    roles,
    setRoles,
  ] =
    useState<PlatformRole[]>(
      [],
    );


  /* ========================================================
     SELECTION 005
     ======================================================== */

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


  /* ========================================================
     STATE 006
     ======================================================== */

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
    error,
    setError,
  ] =
    useState("");


  /* ========================================================
     PERMISSIONS 007
     ======================================================== */

  const isCurrentUser =
    currentAuthUser?.id ===
    user?.auth_user_id;


  const isPlatformAdmin =
    currentAuthUser?.email ===
    "iekhanine@gmail.com";


  const canManageUser =
    isPlatformAdmin &&
    !isCurrentUser;


  const hasOrganization =
    Boolean(
      user?.organization_id,
    );


  /* ========================================================
     OPTIONS 008
     Load organizations and roles
     ======================================================== */

  useEffect(() => {

    if (
      !open ||
      !user ||
      !canManageUser
    ) {

      return;

    }


    let active = true;


    async function loadOptions() {

      if (!user) {

        return;

      }


      setLoading(
        true,
      );

      setError("");


      try {

        const [
          orgs,
          platformRoles,
        ] =
          await Promise.all([

            getPlatformOrganizations(),

            getPlatformRoles(),

          ]);


        if (!active) {

          return;

        }


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
              : "Unable to load user administration options.",
          );

        }

      }
      finally {

        if (active) {

          setLoading(
            false,
          );

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
    canManageUser,
  ]);


  /* ========================================================
     CLOSED 009
     ======================================================== */

  if (
    !open ||
    !user
  ) {

    return null;

  }


  /* ========================================================
     SAVE 010
     Assign or update organization membership
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


    setSaving(
      true,
    );

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

      console.error(
        "Unable to save user organization access:",
        saveError,
      );


      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save organization access.",
      );

    }
    finally {

      setSaving(
        false,
      );

    }

  }


  /* ========================================================
     UNASSIGN 011
     Remove organization membership
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
        `Unassign ${user.email} from ${user.organization_name ?? "their organization"}?\n\nThe user will remain active on the OneTime Labs platform but will lose access to the organization's OTLES workspace.`,
      );


    if (!confirmed) {

      return;

    }


    setUnassigning(
      true,
    );

    setError("");


    try {

      await unassignUserFromOrganization(
        user.id,
      );


      onSaved();

    }
    catch (unassignError) {

      console.error(
        "Unable to unassign user:",
        unassignError,
      );


      setError(
        unassignError instanceof Error
          ? unassignError.message
          : "Unable to unassign user.",
      );

    }
    finally {

      setUnassigning(
        false,
      );

    }

  }


  /* ========================================================
     RENDER 012
     ======================================================== */

  return (

    <div className="dialog-backdrop">

      <div className="edit-user-dialog">


        {/* ==================================================
            HEADER 013
            ================================================== */}

        <div className="dialog-header">

          <div>

            <h2>

              {canManageUser
                ? "Manage User"
                : "Account Information"}

            </h2>

            <p>
              {user.email}
            </p>

          </div>


          <button
            type="button"
            className="dialog-close"
            onClick={
              onClose
            }
            disabled={
              saving ||
              unassigning
            }
          >
            ✕
          </button>

        </div>


        {/* ==================================================
            BODY 014
            ================================================== */}

        <div className="dialog-body">


          <div className="profile-avatar">

            {user.avatar_url ? (

              <img
                src={
                  user.avatar_url
                }
                alt={
                  user.display_name ??
                  "User"
                }
              />

            ) : (

              <div className="profile-avatar-placeholder">
                ?
              </div>

            )}

          </div>


          <div className="form-group">

            <label>
              Display Name
            </label>

            <input
              value={
                user.display_name ?? ""
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              value={
                user.email
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Authentication Provider
            </label>

            <input
              value="Google"
              disabled
            />

          </div>


          {/* ==================================================
              ADMINISTRATION 015
              ================================================== */}

          {canManageUser && (

            <>

              <hr />


              <div className="admin-section">

                <h3>
                  Organization Access
                </h3>


                {loading ? (

                  <div>
                    Loading permissions...
                  </div>

                ) : (

                  <>


                    <div className="form-group">

                      <label>
                        Organization
                      </label>


                      <select
                        value={
                          selectedOrganization
                        }
                        disabled={
                          saving ||
                          unassigning
                        }
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
                              {
                                organization.name
                              }
                            </option>

                          ),
                        )}

                      </select>

                    </div>


                    <div className="form-group">

                      <label>
                        Organization Role
                      </label>


                      <select
                        value={
                          selectedRole
                        }
                        disabled={
                          saving ||
                          unassigning
                        }
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
                              {
                                role.display_name
                              }
                            </option>

                          ),
                        )}

                      </select>

                    </div>


                    {/* ========================================
                        CURRENT ASSIGNMENT 016
                        ======================================== */}

                    {hasOrganization && (

                      <div className="current-organization">

                        <span>
                          Current Assignment
                        </span>

                        <strong>
                          {user.organization_name}
                        </strong>

                        <small>
                          {user.organization_role ??
                            "No role assigned"}
                        </small>

                      </div>

                    )}


                    {/* ========================================
                        ERROR 017
                        ======================================== */}

                    {error && (

                      <div className="user-admin-error">
                        {error}
                      </div>

                    )}


                    {/* ========================================
                        UNASSIGN 018
                        ======================================== */}

                    {hasOrganization && (

                      <button
                        type="button"
                        className="danger-button"
                        disabled={
                          saving ||
                          unassigning
                        }
                        onClick={() => {
                          void handleUnassign();
                        }}
                      >

                        {unassigning
                          ? "Unassigning..."
                          : "Unassign User"}

                      </button>

                    )}


                  </>

                )}

              </div>

            </>

          )}


        </div>


        {/* ==================================================
            FOOTER 019
            ================================================== */}

        <div className="dialog-footer">


          <button
            type="button"
            className="secondary-button"
            onClick={
              onClose
            }
            disabled={
              saving ||
              unassigning
            }
          >
            Cancel
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void handleSave();
            }}
            disabled={
              saving ||
              unassigning ||
              !canManageUser ||
              !selectedOrganization ||
              !selectedRole
            }
          >

            {saving
              ? "Saving..."
              : hasOrganization
                ? "Save Changes"
                : "Assign User"}

          </button>


        </div>


      </div>

    </div>

  );

}