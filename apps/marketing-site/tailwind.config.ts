import sharedConfig from "../../tailwind.config";
import type { Config } from "tailwindcss";

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../libs/**/*.{ts,tsx}",
  ],
};

export default config;
