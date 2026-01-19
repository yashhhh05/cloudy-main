import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  //when we want to read images outside of our app
 images : {
  remotePatterns : [
    {
      protocol : "https",
      hostname : "cdn.pixabay.com",
    },
    {
      protocol : "https",
      hostname : "cloud.appwrite.io",
    },
    {
      protocol : "https",
      hostname : "sgp.cloud.appwrite.io",
    }
  ]
 }
};

export default nextConfig;
