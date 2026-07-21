import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/promote-admin.mjs <email>')
  process.exit(1)
}

const payload = await getPayload({ config: configPromise })

const { docs } = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
})

if (docs.length === 0) {
  console.log('No user found with that email')
  process.exit(1)
}

await payload.update({
  id: docs[0].id,
  collection: 'users',
  data: { role: 'admin' },
})

console.log('Promoted', docs[0].email, 'to admin')
process.exit(0)
