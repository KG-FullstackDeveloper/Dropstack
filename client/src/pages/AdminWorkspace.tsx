import { DashboardFAB } from "../components/DashboardUtilities";
import Admin from "./Admin";

export default function AdminWorkspace() {
  return (
    <div className="relative min-h-screen">
      <Admin />
      <DashboardFAB workspace="global" />
    </div>
  );
}
