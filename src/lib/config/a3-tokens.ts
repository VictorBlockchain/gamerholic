export interface A3TokenConfig {
  key: 'SPEED' | 'POWER' | 'DEFENSE'
  label: string
  address?: `0x${string}`
  disabled?: boolean
  badge?: string
  description?: string
  icon?: string
  order: number
}

export const A3_TOKENS: A3TokenConfig[] = [
  {
    key: 'SPEED',
    label: 'SPEED',
    address: '0xe4a779b46d86d01fc1d45da0d536ae53e6f33a6e' as `0x${string}`,
    disabled: false,
    badge: 'LIVE',
    description: 'Enhance your gaming speed and reaction time',
    icon: 'zap',
    order: 1,
  },
  {
    key: 'POWER',
    label: 'POWER',
    disabled: true,
    badge: 'SOON',
    description: 'Boost your gaming power and strength',
    icon: 'flame',
    order: 2,
  },
  {
    key: 'DEFENSE',
    label: 'DEFENSE',
    disabled: true,
    badge: 'SOON',
    description: 'Strengthen your defensive capabilities',
    icon: 'shield',
    order: 3,
  },
]

/**
 * Get all available 3xA tokens sorted by order
 */
export function getA3Tokens(): A3TokenConfig[] {
  return A3_TOKENS.sort((a, b) => a.order - b.order)
}

/**
 * Get a specific 3xA token by key
 */
export function getA3TokenByKey(key: string): A3TokenConfig | undefined {
  return A3_TOKENS.find(token => token.key === key)
}

/**
 * Get only enabled 3xA tokens
 */
export function getEnabledA3Tokens(): A3TokenConfig[] {
  return A3_TOKENS.filter(token => !token.disabled).sort((a, b) => a.order - b.order)
}

/**
 * Get 3xA token address by key
 */
export function getA3TokenAddress(key: string): `0x${string}` | undefined {
  const token = getA3TokenByKey(key)
  return token?.address
}