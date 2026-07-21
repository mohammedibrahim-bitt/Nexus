import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-admin-password.mjs <email> <newPassword>')
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
  data: { password: newPassword },
})

console.log('Password reset for', docs[0].email)
process.exit(0)
