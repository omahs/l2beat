import cx from 'classnames'

import { getRowVerificationClassNames } from './getRowVerificationClassNames'

interface BridgeTableEntry {
  type: 'layer2' | 'bridge'
  slug: string
  isArchived?: boolean
  isVerified?: boolean
}

export function getBridgesRowProps(entry: BridgeTableEntry) {
  const href =
    entry.type === 'layer2'
      ? `/scaling/projects/${entry.slug}`
      : `/bridges/projects/${entry.slug}`

  return {
    className: cx(
      getRowVerificationClassNames(entry),
      entry.type !== 'bridge' && 'hidden',
      entry.isArchived && 'hidden opacity-50',
    ),
    'data-layer2': entry.type !== 'bridge' ? true : undefined,
    'data-archived': entry.isArchived,
    href,
  }
}
