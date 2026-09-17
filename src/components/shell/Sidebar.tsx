import { useEffect, useState } from "react";
import {
  Home,
  Users,
  Building2,
  FileText,
  Boxes,
  Megaphone,
  KeyRound,
  Store,
  Shield,
  ClipboardList,
  Settings,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  UserRoundPlus,
  FileSignature,
  ReceiptText,
} from "lucide-react";

import type { Page } from "./AdminShell";

import { useAuth } from "../../hooks/useAuth";

import "./Sidebar.css";

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export default function Sidebar({
  currentPage,
  onNavigate,
}: Props) {
  const { user } = useAuth();

  const isPlatformAdmin =
    user?.email ===
    "iekhanine@gmail.com";

  const consultingActive =
    currentPage === "consultingClients" ||
    currentPage === "consultingContracts" ||
    currentPage === "consultingInvoices";

  const [consultingOpen, setConsultingOpen] = useState(consultingActive);

  useEffect(() => {
    if (consultingActive) {
      setConsultingOpen(true);
    }
  }, [consultingActive]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title" />
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("dashboard")}
        >
          <Home size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "users" ? "active" : ""}`}
          onClick={() => onNavigate("users")}
        >
          <Users size={18} />
          <span>Users</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "organizations" ? "active" : ""}`}
          onClick={() => onNavigate("organizations")}
        >
          <Building2 size={18} />
          <span>Organizations</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "documents" ? "active" : ""}`}
          onClick={() => onNavigate("documents")}
        >
          <FileText size={18} />
          <span>Documents</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "applications" ? "active" : ""}`}
          onClick={() => onNavigate("applications")}
        >
          <Boxes size={18} />
          <span>Applications</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "licensing" ? "active" : ""}`}
          onClick={() => onNavigate("licensing")}
        >
          <KeyRound size={18} />
          <span>Software Licensing</span>
        </button>

        {isPlatformAdmin && (
          <div className={`sidebar-group ${consultingActive ? "active" : ""}`}>
            <button
              className={`sidebar-item sidebar-parent ${consultingActive ? "active" : ""}`}
              onClick={() => setConsultingOpen(value => !value)}
              aria-expanded={consultingOpen}
            >
              <BriefcaseBusiness size={18} />
              <span>Consulting</span>
              <span className="sidebar-expand-icon">
                {consultingOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </span>
            </button>

            {consultingOpen && (
              <div className="sidebar-subnav">
                <button
                  className={`sidebar-subitem ${currentPage === "consultingClients" ? "active" : ""}`}
                  onClick={() => onNavigate("consultingClients")}
                >
                  <UserRoundPlus size={15} />
                  <span>Clients</span>
                </button>
                <button
                  className={`sidebar-subitem ${currentPage === "consultingContracts" ? "active" : ""}`}
                  onClick={() => onNavigate("consultingContracts")}
                >
                  <FileSignature size={15} />
                  <span>Contract Builder</span>
                </button>
                <button
                  className={`sidebar-subitem ${currentPage === "consultingInvoices" ? "active" : ""}`}
                  onClick={() => onNavigate("consultingInvoices")}
                >
                  <ReceiptText size={15} />
                  <span>Stripe Invoices</span>
                </button>
              </div>
            )}
          </div>
        )}

        {isPlatformAdmin && (
          <button
            className={`sidebar-item ${currentPage === "marketplace" ? "active" : ""}`}
            onClick={() => onNavigate("marketplace")}
          >
            <Store size={18} />
            <span>Marketplace</span>
          </button>
        )}

        {isPlatformAdmin && (
          <button
            className={`sidebar-item ${currentPage === "appMessages" ? "active" : ""}`}
            onClick={() => onNavigate("appMessages")}
          >
            <Megaphone size={18} />
            <span>App Broadcasts</span>
          </button>
        )}

        <button className="sidebar-item" disabled>
          <Shield size={18} />
          <span>Roles</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" disabled>
          <ClipboardList size={18} />
          <span>Audit Log</span>
        </button>

        <button className="sidebar-item" disabled>
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
