const { createCustomTokens } = require('@luxis-ui/react');
try {
  const tokens = createCustomTokens({
    colors: {
      primary: '#6d28d9',
      secondary: '#059669',
    },
    borderRadius: {
      md: '0.5rem',
      lg: '1rem',
    }
  });
  console.log('Success:', tokens);
} catch (e) {
  console.error('Failed:', e);
}
