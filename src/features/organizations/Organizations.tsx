import {
  useEffect,
  useState,
} from "react";

import type {
  Organization,
} from "../../types/organizations";

import {
  getOrganizations,
} from "../../services/organizations";

import "./Organizations.css";


type Props = {
  onNewOrganization: () => void;
  onEditOrganization: (
    organization: Organization,
  ) => void;
};


export default function Organizations({
  onNewOrganization,
  onEditOrganization,
}: Props) {


  const [
    organizations,
    setOrganizations,
  ] =
    useState<Organization[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);



  async function loadOrganizations() {

    try {

      const data =
        await getOrganizations();

      setOrganizations(
        data,
      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    void loadOrganizations();

  }, []);



  return (

    <div className="organizations-page">


      <div className="page-header">


        <div>

          <h1>
            Organizations
          </h1>


          <p>
            Manage customer organizations
            and access.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={
            onNewOrganization
          }
        >
          + New Organization
        </button>


      </div>




      <div className="organizations-panel">


        <div className="panel-header">

          Organization List

        </div>



        <div className="organization-list">


          {loading ? (

            <div className="loading-message">
              Loading organizations...
            </div>


          ) : organizations.length === 0 ? (

            <div className="empty-message">
              No organizations found.
            </div>


          ) : (


            organizations.map(
              (organization) => (

                <button

                  key={
                    organization.id
                  }

                  className="organization-row"

                  onClick={() =>
                    onEditOrganization(
                      organization,
                    )
                  }

                >

                  <div className="organization-name">

                    {
                      organization.name
                    }

                  </div>


                  <div className="organization-details">

                    <span>
                      {
                        organization.slug
                      }
                    </span>


                    <span>

                      {
                        organization.active
                          ? "Active"
                          : "Inactive"
                      }

                    </span>

                  </div>


                </button>

              ),

            )

          )}


        </div>


      </div>


    </div>

  );
}