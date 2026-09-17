import { useState } from "react";

import EditOrganizationDialog from "../features/organizations/EditOrganizationDialog";

import AdminShell, {
  type Page,
} from "../components/shell/AdminShell";

import Dashboard from "../pages/dashboard/Dashboard";

import Users from "../features/users/Users";

import Organizations from "../features/organizations/Organizations";

import Documents from "../pages/documents/Documents";

import AppMessages from "../pages/appMessages/AppMessages";

import Applications from "../pages/applications/Applications";
import Marketplace from "../pages/marketplace/Marketplace";
import Licensing from "../pages/licensing/Licensing";
import ConsultingClients from "../pages/consulting/ConsultingClients";
import ContractBuilder from "../pages/consulting/ContractBuilder";
import ConsultingInvoices from "../pages/consulting/ConsultingInvoices";

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

const [
  organizationRefresh,
  setOrganizationRefresh,
] = useState(0);

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

  onOpenUsers={() =>
    setPage(
      "users",
    )
  }

  onOpenAppMessages={() =>
    setPage(
      "appMessages",
    )
  }

  onOpenMarketplace={() =>
    setPage(
      "marketplace",
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

  refreshKey={
    organizationRefresh
  }

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



      case "applications":

        return (

          <Applications />

        );


      case "marketplace":

        return (

          <Marketplace />

        );


      case "licensing":

        return (

          <Licensing />

        );


      case "consultingClients":

        return (

          <ConsultingClients />

        );


      case "consultingContracts":

        return (

          <ContractBuilder />

        );


      case "consultingInvoices":

        return (

          <ConsultingInvoices />

        );


      case "appMessages":

        return (

          <AppMessages />

        );


      case "documents":

        return (

          <Documents />

        );



      default:

        return (

<Dashboard
  onOpenOrganizations={() =>
    setPage(
      "organizations",
    )
  }

  onOpenUsers={() =>
    setPage(
      "users",
    )
  }

  onOpenAppMessages={() =>
    setPage(
      "appMessages",
    )
  }

  onOpenMarketplace={() =>
    setPage(
      "marketplace",
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

  setOrganizationRefresh(
    value => value + 1,
  );

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