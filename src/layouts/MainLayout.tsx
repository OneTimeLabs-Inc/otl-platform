import { useState } from "react";

import EditOrganizationDialog from "../features/organizations/EditOrganizationDialog";

import AdminShell, {
  type Page,
} from "../components/shell/AdminShell";

import Dashboard from "../pages/dashboard/Dashboard";

import Users from "../features/users/Users";

import Organizations from "../features/organizations/Organizations";

import type {
  Organization,
} from "../types/organizations";


export default function MainLayout() {

  const [
    page,
    setPage,
  ] =
    useState<Page>("dashboard");



  const [
    selectedOrganization,
    setSelectedOrganization,
  ] =
    useState<Organization | null>(
      null,
    );



  const [
    organizationDialogOpen,
    setOrganizationDialogOpen,
  ] =
    useState(false);



  function renderPage() {

    switch (page) {


      case "dashboard":

        return (

          <Dashboard

            onOpenOrganizations={() =>
              setPage(
                "organizations",
              )
            }

          />

        );



      case "users":

        return (

          <Users />

        );



      case "organizations":

        return (

          <Organizations

            onNewOrganization={() => {

              setSelectedOrganization(
                null,
              );

              setOrganizationDialogOpen(
                true,
              );

            }}


            onEditOrganization={(
              organization,
            ) => {

              setSelectedOrganization(
                organization,
              );

              setOrganizationDialogOpen(
                true,
              );

            }}

          />

        );



      default:

        return (

          <Dashboard

            onOpenOrganizations={() =>
              setPage(
                "organizations",
              )
            }

          />

        );

    }

  }



  return (

    <AdminShell

      currentPage={page}

      onNavigate={setPage}

    >

      {renderPage()}


      <EditOrganizationDialog

        open={
          organizationDialogOpen
        }

        organization={
          selectedOrganization
        }

        onClose={() => {

          setOrganizationDialogOpen(
            false,
          );

          setSelectedOrganization(
            null,
          );

        }}


        onSaved={() => {

          setOrganizationDialogOpen(
            false,
          );

          setSelectedOrganization(
            null,
          );

        }}

      />


    </AdminShell>

  );

}