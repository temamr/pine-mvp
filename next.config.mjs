const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  },
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**"
  }
];

if (supabaseHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/**"
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns
  }
};

export default nextConfig;
