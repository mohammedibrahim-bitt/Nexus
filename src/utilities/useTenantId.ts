import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Hook to resolve the current tenant ID from the tenantDomain route param.
 */
export function useTenantId() {
  const params = useParams()
  const tenantDomain = params?.tenantDomain as string | undefined
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantDomain) return
    let mounted = true

    fetch(`/api/tenants?where[slug][equals]=${tenantDomain}&limit=1&depth=0`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.docs?.[0]?.id) {
          setTenantId(data.docs[0].id)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [tenantDomain])

  return tenantId
}
