/** @type {import('next').NextConfig} */
const nextConfig = {
	// Static export to `out/` so the site keeps running on plain Apache/Hostinger hosting.
	// All Supabase calls happen in the browser, so no Node server is needed.
	output: 'export',
	// Emits `/products/index.html` instead of `/products.html`, which Apache serves without rewrites.
	trailingSlash: true,
	// Dev server only: lets other devices on the Wi-Fi open the site via this computer's network address
	// (see the "Network:" line when `npm run dev` starts). Update it if the address changes.
	allowedDevOrigins: ['10.146.236.111'],
};

export default nextConfig;
