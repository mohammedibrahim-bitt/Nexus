import { getAdminToken, updateSettingsGlobal } from './connect-site-auth.mjs'

// Usage:
// 1. Put credentials in .env.local (or export them in your shell)
// 2. Run:
// SITE_URL="https://www.listlio.com/panel" node scripts/connect-site-http.mjs

const SITE_URL = process.env.SITE_URL || 'https://www.listlio.com/panel'
const HOST = process.env.PAYLOAD_HOST || 'http://localhost:3000'

if (!SITE_URL || SITE_URL.includes('PASTE_YOUR_SITE_URL_HERE')) {
  console.error('Set SITE_URL environment variable to the site you want to connect.')
  process.exit(1)
}

async function run() {
  const token = await getAdminToken(HOST)
  await updateSettingsGlobal(HOST, token, SITE_URL)

  console.log('Connected site set to', SITE_URL)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
