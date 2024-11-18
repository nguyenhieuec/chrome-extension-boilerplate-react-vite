import baseConfig from '@extension/tailwindcss-config';
import { withUI } from '@extension/ui';

export default withUI({
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}', './node_modules/@extension/ui/lib/**/*.{tsx,ts,js,jsx}'],
});
