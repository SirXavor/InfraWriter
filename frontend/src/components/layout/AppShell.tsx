import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}