// src/services/columnPreferencesService.ts
// Service for saving/loading user column visibility preferences per project/sheet

import apiClient from './apiClient';

export interface ColumnPreferences {
  visibleColumns: string[] | null;
}

/**
 * Get saved column preferences for a user/project/sheet.
 * Returns null visibleColumns if no preferences saved (show all).
 */
export const getColumnPreferences = async (
  projectId: number | string,
  sheetType: string
): Promise<ColumnPreferences> => {
  try {
    const response = await apiClient.get(`/column-preferences/${projectId}/${sheetType}`);
    return response.data;
  } catch (error) {
    console.error('[ColumnPreferences] Failed to load preferences:', error);
    return { visibleColumns: null };
  }
};

/**
 * Save column visibility preferences for a user/project/sheet.
 * Stores the list of hidden column names.
 */
export const saveColumnPreferences = async (
  projectId: number | string,
  sheetType: string,
  hiddenColumns: string[]
): Promise<void> => {
  try {
    await apiClient.put(`/column-preferences/${projectId}/${sheetType}`, {
      hiddenColumns,
    });
  } catch (error) {
    console.error('[ColumnPreferences] Failed to save preferences:', error);
    throw error;
  }
};
