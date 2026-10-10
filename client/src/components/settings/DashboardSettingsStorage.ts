import {
  DEFAULT_DASHBOARD_SETTINGS,
} from "./DashboardSettingsTypes";

import type {
  DashboardSettingsData,
} from "./DashboardSettingsTypes";

export function getDashboardSettings(
  workspaceKey: string,
  fallback?: Partial<DashboardSettingsData>
): DashboardSettingsData {
  const storageKey = `meo_${workspaceKey}_advanced_settings_v1`;

  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return {
        ...DEFAULT_DASHBOARD_SETTINGS,
        ...fallback,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...fallback,
      ...parsed,
    };
  } catch {
    return {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...fallback,
    };
  }
}

export function saveDashboardSettings(
  workspaceKey: string,
  settings: DashboardSettingsData
) {
  const storageKey = `meo_${workspaceKey}_advanced_settings_v1`;

  localStorage.setItem(storageKey, JSON.stringify(settings));
}

export function resetDashboardSettings(
  workspaceKey: string
): DashboardSettingsData {
  const storageKey = `meo_${workspaceKey}_advanced_settings_v1`;

  localStorage.removeItem(storageKey);

  return {
    ...DEFAULT_DASHBOARD_SETTINGS,
  };
}