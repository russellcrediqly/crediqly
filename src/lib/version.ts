import versionInfo from '@/version.json';

export const APP_VERSION = versionInfo.version || '3.8.0';
export const APP_BUILD = versionInfo.build || 1;
export const APP_UPDATED_AT = versionInfo.updatedAt;

export function getFormattedVersion(): string {
  return `v${APP_VERSION}`;
}
