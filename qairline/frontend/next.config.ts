import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: 'http://ec2-3-89-133-31.compute-1.amazonaws.com/api', // Trỏ đến API backend
  },
};
export default nextConfig;
