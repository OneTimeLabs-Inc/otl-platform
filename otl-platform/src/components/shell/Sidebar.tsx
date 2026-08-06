import {
  Home,
  Users,
  Building2,
  Boxes,
  Shield,
  ClipboardList,
  Settings,
} from "lucide-react";

import type { Page } from "./AdminShell";

import "./Sidebar.css";

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export default function Sidebar({
  currentPage,
  onNavigate,
}: Props) {
  return (
    <aside className="sidebar">

      <div className="sidebar-header">

       
        <div className="sidebar-title">
        
        </div>

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
  className={`sidebar-item ${
    currentPage === "organizations"
      ? "active"
      : ""
  }`}
  onClick={() =>
    onNavigate("organizations")
  }
>
  <Building2 size={18} />
  <span>Organizations</span>
</button>

        <button
          className="sidebar-item"
          disabled
        >
          <Boxes size={18} />
          <span>Applications</span>
        </button>

        <button
          className="sidebar-item"
          disabled
        >
          <Shield size={18} />
          <span>Roles</span>
        </button>

      </nav>

      <div className="sidebar-footer">

        <button
          className="sidebar-item"
          disabled
        >
          <ClipboardList size={18} />
          <span>Audit Log</span>
        </button>

        <button
          className="sidebar-item"
          disabled
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

      </div>

    </aside>
  );
}