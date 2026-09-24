import type { NextConfig } from "next";

// El Dockerfile compila con NEXT_OUTPUT=standalone (servidor mínimo para Coolify).
const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default nextConfig;
