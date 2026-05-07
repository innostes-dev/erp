'use client';

import { useContext } from 'react';
import { FeatureFlagContext } from './config.context';
import type { FeatureFlag, FeatureFlagMap } from './config.types';

export function useFeatureFlag<F extends FeatureFlag>(flag: F): FeatureFlagMap[F] | false {
  const flags = useContext(FeatureFlagContext);
  return (flags[flag] ?? false) as FeatureFlagMap[F] | false;
}
