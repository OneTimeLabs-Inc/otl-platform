import type {
  ConsultingBillingModel,
  ConsultingContractData,
} from "../../types/consulting";

export type ContractTemplate = {
  label: string;
  description: string;
  title: string;
  serviceType: string;
  billingModel: ConsultingBillingModel;
  rate: string;
  data: ConsultingContractData;
  scope: string;
};

export const contractTemplates: Record<string, ContractTemplate> = {
  consulting: {
    label: "Consulting Agreement",
    description: "General enterprise architecture, advisory, and implementation work.",
    title: "Consulting Services Agreement",
    serviceType: "Enterprise Consulting",
    billingModel: "hourly",
    rate: "175",
    scope: "Architecture, technical advisory, implementation support, documentation, troubleshooting, and other professional services mutually agreed during the engagement.",
    data: {
      projectSummary: "OneTime Labs will provide enterprise technology consulting and architecture services in support of the Client's stated business and technical objectives.",
      deliverables: "Technical recommendations\nArchitecture or implementation documentation\nWorking sessions and stakeholder guidance\nFinal handoff notes or agreed deliverables",
      clientResponsibilities: "Provide timely access to required personnel and systems\nProvide accurate technical and business information\nIdentify an authorized decision-maker\nReview deliverables and approvals without unreasonable delay",
      assumptions: "Remote access is available unless onsite work is specifically included\nRequired vendor and system credentials will be supplied by the Client\nExisting systems are reasonably documented or discoverable",
      exclusions: "Hardware, software, and third-party licensing costs\nTravel unless specifically approved\nWork outside the agreed scope without written change approval",
      paymentTerms: "Net 15",
      specialTerms: "Work outside the agreed scope requires written approval before additional billable work begins.",
    },
  },
  "vendor-migration": {
    label: "Vendor Migration SOW",
    description: "Structured migration planning, coordination, cutover, and validation.",
    title: "Vendor Migration Statement of Work",
    serviceType: "Vendor Migration",
    billingModel: "fixed",
    rate: "5000",
    scope: "Assessment, migration planning, dependency mapping, vendor coordination, implementation support, validation, cutover assistance, and post-migration handoff for the systems identified by the Client.",
    data: {
      projectSummary: "OneTime Labs will plan and support the transition from an incumbent technology vendor or platform to the Client's selected replacement while reducing operational disruption and preserving required business services.",
      deliverables: "Current-state assessment\nDependency and risk register\nMigration architecture and cutover plan\nImplementation and vendor coordination\nValidation checklist\nPost-migration handoff documentation",
      clientResponsibilities: "Provide access to incumbent and replacement vendors\nProvide current contracts, inventories, configurations, and technical contacts\nApprove migration windows and change controls\nProvide business owners for validation and acceptance",
      assumptions: "Replacement technology has been selected or will be selected before implementation\nClient and vendor resources will be available during agreed migration windows\nMaterial scope changes may require revised pricing or dates",
      exclusions: "Vendor product licensing and termination fees\nUnapproved hardware purchases\nRemediation of unrelated legacy systems\n24x7 support unless expressly included",
      paymentTerms: "50% at project start, 50% at completion unless otherwise stated",
      specialTerms: "Cutover dates are dependent on Client and third-party vendor readiness. Delays outside OneTime Labs' control may require schedule adjustment.",
    },
  },
  "managed-print": {
    label: "Managed Print Assessment",
    description: "Fleet, print infrastructure, tooling, risk, and optimization assessment.",
    title: "Managed Print Services Assessment",
    serviceType: "Managed Print Services",
    billingModel: "fixed",
    rate: "2500",
    scope: "Discovery and assessment of print infrastructure, fleet data, queues, drivers, print servers, management tooling, support workflows, and opportunities for consolidation or vendor transition.",
    data: {
      projectSummary: "OneTime Labs will assess the Client's managed print environment and produce a practical technical view of the current state, risks, and opportunities for optimization or migration.",
      deliverables: "Fleet and infrastructure assessment\nPrint server and queue review\nDriver and platform risk findings\nManagement-tool review\nOptimization recommendations\nExecutive findings summary",
      clientResponsibilities: "Provide access to print servers and management tools\nProvide available fleet exports and vendor documentation\nIdentify site and support contacts\nProvide required network and security approvals",
      assumptions: "Assessment is based on systems and data made available during the engagement\nRemediation is not included unless separately scoped",
      exclusions: "Printer hardware purchases\nConsumables and break/fix services\nPhysical device moves\nImplementation work not specifically included in the scope",
      paymentTerms: "Net 15",
      specialTerms: "Assessment findings reflect the environment visible during the engagement and may change as additional devices, sites, or dependencies are discovered.",
    },
  },
  "custom-development": {
    label: "Custom Development",
    description: "Custom application, backend, authentication, deployment, and handoff.",
    title: "Custom Software Development Agreement",
    serviceType: "Custom Development",
    billingModel: "fixed",
    rate: "5000",
    scope: "Design and development of the application, workflow, integration, or internal business tool described in the approved project requirements, including agreed frontend, backend, authentication, administration, deployment, and handoff work.",
    data: {
      projectSummary: "OneTime Labs will design and build a custom software solution based on the approved requirements and deliver it in an operable production-ready form within the agreed scope.",
      deliverables: "Application design and user interface\nBackend and database implementation\nAuthentication and access controls where required\nAdministrative tools where required\nProduction deployment\nSource and operational handoff",
      clientResponsibilities: "Provide requirements and timely feedback\nProvide branding, content, and third-party credentials when required\nApprove major workflow and design decisions\nPerform business acceptance testing",
      assumptions: "The project will be built against the approved scope\nThird-party services remain subject to their own availability and terms\nMaterial feature additions are handled through change control",
      exclusions: "Third-party subscription or usage fees\nNew features not included in the approved scope\nOngoing support after the agreed warranty or support period unless separately contracted",
      paymentTerms: "50% at project start, 50% before production handoff unless otherwise stated",
      specialTerms: "Pre-existing OneTime Labs frameworks, reusable components, libraries, and tools remain OneTime Labs property unless specifically transferred in writing.",
    },
  },
  retainer: {
    label: "Support / Retainer",
    description: "Ongoing consulting capacity for architecture, vendors, and project support.",
    title: "Technology Consulting Retainer Agreement",
    serviceType: "Ongoing Consulting",
    billingModel: "retainer",
    rate: "3000",
    scope: "Ongoing architecture, technical advisory, vendor coordination, troubleshooting, planning, documentation, and implementation support within the monthly service allocation agreed with the Client.",
    data: {
      projectSummary: "OneTime Labs will provide ongoing technology consulting capacity for recurring operational, architecture, vendor, and project needs.",
      deliverables: "Scheduled consulting availability\nArchitecture and vendor advisory\nIssue and project support\nDocumentation and recommendations\nMonthly activity summary when requested",
      clientResponsibilities: "Provide a primary contact and escalation path\nPrioritize requested work\nProvide required access and approvals\nNotify OneTime Labs of material deadlines or planned changes",
      assumptions: "Work is prioritized within the agreed monthly allocation\nUnused capacity does not roll over unless stated in writing",
      exclusions: "Emergency 24x7 response unless included\nThird-party costs\nMajor implementation projects that exceed the retainer scope",
      paymentTerms: "Due at the beginning of each monthly service period",
      specialTerms: "Work exceeding the agreed monthly allocation requires written approval and may be billed separately at the applicable consulting rate.",
    },
  },
};
