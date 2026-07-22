import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O formulário de perfil envia arquivos de logo (padrão é 1MB).
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
