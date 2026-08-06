import {
  useEffect,
  useState,
} from "react";

import type {
  Organization,
} from "../../types/organizations";

import {
  createOrganization,
  updateOrganization,
} from "../../services/organizations";

import "./EditOrganizationDialog.css";


type Props = {
  open: boolean;

  organization:
    | Organization
    | null;

  onClose: () => void;

  onSaved: () => void;
};



type OrganizationForm = {
  name: string;
  slug: string;
  active: boolean;
};



export default function EditOrganizationDialog({
  open,
  organization,
  onClose,
  onSaved,
}: Props) {


  const [
    saving,
    setSaving,
  ] =
    useState(false);



  const [
    error,
    setError,
  ] =
    useState<string | null>(null);



  const [
    form,
    setForm,
  ] =
    useState<OrganizationForm>({
      name: "",
      slug: "",
      active: true,
    });



  useEffect(() => {

    if (!open) {
      return;
    }


    setError(null);


    if (organization) {

      setForm({
        name:
          organization.name,

        slug:
          organization.slug,

        active:
          organization.active,
      });

    } else {

      setForm({
        name: "",
        slug: "",
        active: true,
      });

    }

  }, [
    organization,
    open,
  ]);



  if (!open) {
    return null;
  }



  async function handleSave() {

    setSaving(true);

    setError(null);


    try {


      if (organization) {


        await updateOrganization(
          organization.id,
          form,
        );


      } else {


        await createOrganization(
          form.name,
          form.slug,
        );


      }


      onSaved();

      onClose();


    } catch (err) {


      console.error(
        "Organization save failed:",
        err,
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to save organization.",
      );


    } finally {


      setSaving(false);


    }

  }



  return (

    <div className="dialog-backdrop">


      <div className="edit-organization-dialog">


        <div className="dialog-header">


          <h2>

            {
              organization
                ? "Edit Organization"
                : "New Organization"
            }

          </h2>



          <button
            className="dialog-close"
            onClick={onClose}
          >
            ✕
          </button>


        </div>




        <div className="dialog-body">


          {error && (

            <div className="dialog-error">

              {error}

            </div>

          )}



          <div className="form-group">

            <label>
              Organization Name
            </label>


            <input
              value={
                form.name
              }

              onChange={(e) =>
                setForm({
                  ...form,

                  name:
                    e.target.value,
                })
              }
            />

          </div>





          <div className="form-group">

            <label>
              Slug
            </label>


            <input
              value={
                form.slug
              }

              onChange={(e) =>
                setForm({
                  ...form,

                  slug:
                    e.target.value
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-",
                      ),
                })
              }
            />

          </div>





          <div className="checkbox-group">


            <label>


              <input
                type="checkbox"

                checked={
                  form.active
                }

                onChange={(e) =>
                  setForm({
                    ...form,

                    active:
                      e.target.checked,
                  })
                }
              />


              Active


            </label>


          </div>



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
            disabled={saving}
          >

            {
              saving
                ? "Saving..."
                : "Save Organization"
            }


          </button>


        </div>


      </div>


    </div>

  );

}