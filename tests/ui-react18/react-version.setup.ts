import { version } from 'react';

// Fail fast if the aliases ever let a different React version slip in.
if (!version.startsWith('18.')) {
  throw new Error(`Expected React 18, got ${version}`);
}
