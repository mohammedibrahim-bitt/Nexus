import { getAdminToken, updateSettingsGlobal } from './connect-site-auth.mjs'

const SITE_URL = process.env.SITE_URL || 'https://www.listlio.com/panel'
const HOST = process.env.PAYLOAD_HOST || 'http://localhost:3000'

async function run() {
  const token = await getAdminToken(HOST)
  await updateSettingsGlobal(HOST, token, SITE_URL)

  console.log('Connected site set to', SITE_URL)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
