import fs from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import configPromise from '../src/payload.config.ts'

const ENV_FILE_NAMES = ['.env.local', '.env']

const loadEnvValues = (cwd = process.cwd()) => {
  const values = {}

  for (const fileName of ENV_FILE_NAMES) {
    const filePath = path.join(cwd, fileName)
    if (!fs.existsSync(filePath)) continue

    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      values[key] = value
    }
  }

  return values
}

const envValues = loadEnvValues()

const getSetting = (key, fallback = '') => process.env[key] || envValues[key] || fallback

export const getAdminToken = async (host = 'http://localhost:3000') => {
  const email = getSetting('PAYLOAD_ADMIN_EMAIL')
  const password = getSetting('PAYLOAD_ADMIN_PASSWORD')
  const existingToken = getSetting('PAYLOAD_ADMIN_TOKEN')

  if (existingToken) {
    return existingToken
  }

  if (!email || !password) {
    throw new Error(
      'Missing admin credentials. Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD, or provide PAYLOAD_ADMIN_TOKEN.',
    )
  }

  const response = await fetch(`${host}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      collection: 'users',
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      `Login failed (${response.status}): ${data?.message || data?.error || 'Unknown error'}`,
    )
  }

  const token = data?.token || data?.result?.token
  if (!token) {
    throw new Error('Login succeeded but no token was returned from Payload.')
  }

  return token
}

export const verifyToken = async (host, token) => {
  const response = await fetch(`${host}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token verification failed (${response.status}): ${text}`)
  }

  return response.json()
}

export const updateSettingsGlobal = async (host, token, siteUrl) => {
  await verifyToken(host, token)

  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      connectedSiteUrl: siteUrl,
      useConnectedSiteDesign: true,
    },
    depth: 0,
    context: {
      disableRevalidate: true,
    },
  })

  return 'Settings updated successfully'
}
