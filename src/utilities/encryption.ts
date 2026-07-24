import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

const getKey = (): Buffer => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set — cannot encrypt/decrypt stored secrets.')
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a user-supplied secret (e.g. a personal API key) before it's
 * stored in the database. Format: iv:authTag:ciphertext, all hex-encoded.
 */
export const encryptSecret = (plaintext: string): string => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

/**
 * Reverses encryptSecret. Returns null if the value isn't in the expected
 * encrypted format (e.g. was never encrypted, or is corrupt) rather than
 * throwing — callers treat a null decrypt as "no usable key".
 */
export const decryptSecret = (stored: string | null | undefined): null | string => {
  if (!stored) return null

  const parts = stored.split(':')
  if (parts.length !== 3) return null

  try {
    const [ivHex, authTagHex, ciphertextHex] = parts
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, 'hex')),
      decipher.final(),
    ])
    return plaintext.toString('utf8')
  } catch {
    return null
  }
}
