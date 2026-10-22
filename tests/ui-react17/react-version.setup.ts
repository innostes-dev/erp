import { version } from 'react';

// Fail fast if the aliases ever let a different React version slip in.
if (!version.startsWith('17.')) {
  throw new Error(`Expected React 17, got ${version}`);
}
