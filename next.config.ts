const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  productionBrowserSourceMaps: false,
  ...(isProd && {
    output: 'export',
    trailingSlash: true,
  }),
};

export default nextConfig;


// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
