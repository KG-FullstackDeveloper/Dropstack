import { useState } from "react";

import AdvancedSettings from "./AdvancedSettings";

import type {
  DashboardSettingsData,
} from "../../components/settings/DashboardSettingsTypes";

import {
  DEFAULT_DASHBOARD_SETTINGS,
} from "../../components/settings/DashboardSettingsTypes";

import {
  getDashboardSettings,
  saveDashboardSettings,
} from "../../components/settings/DashboardSettingsStorage";

interface WorkspaceSettingsProps {
  workspaceKey: "global" | "nigeria";
  workspaceName: string;
}

export default function WorkspaceSettings({
  workspaceKey,
  workspaceName,
}: WorkspaceSettingsProps) {
  const [settings, setSettings] =
    useState<DashboardSettingsData>(() =>
      getDashboardSettings(workspaceKey, {
        ...DEFAULT_DASHBOARD_SETTINGS,
        storeName: workspaceName,
        currency:
          workspaceKey === "nigeria" ? "NGN" : "USD",
        timezone:
          workspaceKey === "nigeria"
            ? "Africa/Lagos"
            : "UTC",
      })
    );

  const handleSave = (
    nextSettings: DashboardSettingsData
  ) => {
    saveDashboardSettings(
      workspaceKey,
      nextSettings
    );

    setSettings(nextSettings);
  };

  return (
    <AdvancedSettings
      workspaceKey={workspaceKey}
      initialSettings={settings}
      onSave={handleSave}
    />
  );
}