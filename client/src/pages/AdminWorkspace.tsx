import { DashboardFAB } from "../components/DashboardUtilities";
import MEOAssistant from "../components/MEOAssistant";
import Admin from "./Admin";

export default function AdminWorkspace() {
  return (
    <div className="relative min-h-screen">
      <Admin />
      <DashboardFAB workspace="global" />
      <MEOAssistant />
    </div>
  );
}
