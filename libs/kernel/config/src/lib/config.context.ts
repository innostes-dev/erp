'use client';

import { createContext } from 'react';
import type { FeatureFlagMap } from './config.types';

export const FeatureFlagContext = createContext<Partial<FeatureFlagMap>>({});
