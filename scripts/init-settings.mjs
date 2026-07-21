import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

await payload.updateGlobal({
  slug: 'settings',
  context: { disableRevalidate: true },
  data: {
    siteName: 'Nexus',
    primaryColor: '#171717',
  },
})

console.log('Initialized site settings')
process.exit(0)
