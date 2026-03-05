import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview panel
  allowedDevOrigins: [
    'preview-chat-92e6b910-ae32-44f3-b8ba-e18397325475.space.z.ai',
    '.space.z.ai',
    'localhost',
  ],
}

export default withNextIntl(nextConfig)
