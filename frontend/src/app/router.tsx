import { Routes, Route } from "react-router-dom";
import HostsPage from "../pages/HostsPage";
import HostEditPage from "../pages/HostEditPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HostsPage />} />
      <Route path="/hosts/new" element={<HostEditPage />} />
      <Route path="/hosts/:hostId" element={<HostEditPage />} />
    </Routes>
  );
}
