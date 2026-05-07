export interface FeatureFlagMap {
  'analytics-v2': boolean;
  'admin-dark-mode': boolean;
}

export type FeatureFlag = keyof FeatureFlagMap;

export interface AppConfig {
  apiUrl: string;
  cdnUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
}
