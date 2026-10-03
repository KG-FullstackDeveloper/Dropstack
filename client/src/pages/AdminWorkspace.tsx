import {
  DashboardAccountTools,
  DashboardFAB,
} from "../components/DashboardUtilities";
import MEOAssistant from "../components/MEOAssistant";
import Admin from "./Admin";

export default function AdminWorkspace() {
  return (
    <div className="relative min-h-screen">
      <Admin />

      <div className="fixed right-4 top-3 z-[100] sm:right-6 sm:top-4">
        <DashboardAccountTools
          workspace="global"
          profileRole="Administrator"
        />
      </div>

      <DashboardFAB workspace="global" />

      <MEOAssistant />
    </div>
  );
}