import { useEffect, useState } from "react";
import type { SettingsSection, DashboardSettingsData } from "../../components/settings/DashboardSettingsTypes";
import { DEFAULT_DASHBOARD_SETTINGS } from "../../components/settings/DashboardSettingsTypes";
import { apiGet, apiPatch } from "../../services/adminApi";
import AdvancedSettings from "./AdvancedSettings";

interface WorkspaceSettingsProps {
  workspaceKey: "global" | "nigeria";
  workspaceName: string;
  initialSection?: SettingsSection;
}

export default function WorkspaceSettings({ workspaceKey, workspaceName, initialSection = "General" }: WorkspaceSettingsProps) {
  const [settings, setSettings] = useState<DashboardSettingsData>({
    ...DEFAULT_DASHBOARD_SETTINGS,
    storeName: workspaceName,
    currency: workspaceKey === "nigeria" ? "NGN" : "USD",
    timezone: workspaceKey === "nigeria" ? "Africa/Lagos" : "UTC",
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    apiGet<{ workspace: string; settings: Partial<DashboardSettingsData> }>(`/settings/${workspaceKey}`)
      .then((result) => {
        if (!active) return;
        setSettings((current) => ({ ...current, ...result.settings }));
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load settings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceKey, workspaceName]);

  async function handleSave(nextSettings: DashboardSettingsData) {
    await apiPatch(`/settings/${workspaceKey}`, { settings: nextSettings });
    setSettings(nextSettings);
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading {workspaceName} settings…</div>;
  }

  if (loadError) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">Couldn&apos;t load settings: {loadError}</div>;
  }

  return <AdvancedSettings workspaceKey={workspaceKey} initialSettings={settings} onSave={handleSave} initialSection={initialSection} />;
}
