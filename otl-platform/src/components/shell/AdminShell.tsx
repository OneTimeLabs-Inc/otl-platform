import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import StatusBar from "./StatusBar";

import "./AdminShell.css";

export type Page =
  | "dashboard"
  | "users"
  | "organizations"
  | "applications"
  | "roles"
  | "audit"
  | "settings";

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
};

export default function AdminShell({
  currentPage,
  onNavigate,
  children,
}: Props) {
  return (
    <div className="admin-shell">

      <TopBar />

      <div className="admin-body">

        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
        />

        <main className="admin-content">
          {children}
        </main>

      </div>

      <StatusBar />

    </div>
  );
}