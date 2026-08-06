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
} from "../../services/platformUsers";

import "./EditUserDialog.css";


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

  const {
    user: currentAuthUser,
  } = useAuth();


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



  const isCurrentUser =
    currentAuthUser?.id ===
    user?.auth_user_id;


  const isPlatformAdmin =
    currentAuthUser?.email ===
    "iekhanine@gmail.com";


  const canManageUser =
    isPlatformAdmin &&
    !isCurrentUser;



  useEffect(() => {

    if (!open || !user || !canManageUser) {
      return;
    }


    async function loadOptions() {

      if (!user) {
      return;
      }
      
      setLoading(true);

      try {

        const [
          orgs,
          platformRoles,
        ] =
          await Promise.all([
            getPlatformOrganizations(),
            getPlatformRoles(),
          ]);


        setOrganizations(orgs);

        setRoles(platformRoles);


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


      } finally {

        setLoading(false);

      }

    }


    void loadOptions();


  }, [
    open,
    user,
    canManageUser,
  ]);



  if (!open || !user) {
    return null;
  }



async function handleSave() {

  if (
    !user ||
    !selectedOrganization ||
    !selectedRole
  ) {
    return;
  }


    setSaving(true);


    try {

      await assignUserToOrganization(
        user.id,
        selectedOrganization,
        selectedRole,
      );


      onSaved();


    } finally {

      setSaving(false);

    }

  }



  return (

    <div className="dialog-backdrop">

      <div className="edit-user-dialog">


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
            className="dialog-close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        <div className="dialog-body">


          <div className="profile-avatar">

            {user.avatar_url ? (

              <img
                src={user.avatar_url}
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
                        onChange={(e) =>
                          setSelectedOrganization(
                            e.target.value,
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
                        onChange={(e) =>
                          setSelectedRole(
                            e.target.value,
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


                  </>

                )}

              </div>

            </>

          )}


        </div>



        <div className="dialog-footer">


          <button
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>


          <button
            className="primary-button"
            onClick={handleSave}
            disabled={
              saving ||
              !canManageUser
            }
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>


        </div>


      </div>

    </div>

  );
}