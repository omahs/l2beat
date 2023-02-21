import cx from 'classnames'

import { getRowVerificationClassNames } from './getRowVerificationClassNames'

interface ScalingTableEntry {
  slug: string
  isVerified?: boolean
  // TODO: optional for now, but should be required
  isArchived?: boolean
}

export function getScalingRowProps(entry: ScalingTableEntry) {
  const isEthereum = entry.slug === 'ethereum'
  const href = isEthereum ? undefined : `/scaling/projects/${entry.slug}`

  if (isEthereum) {
    return {
      className: cx(
        'bg-blue-400 hover:bg-blue-400 border-b-blue-600',
        'dark:bg-blue-900 dark:border-b-blue-500 dark:hover:bg-blue-900',
      ),
      href,
    }
  }

  return {
    className: cx(
      getRowVerificationClassNames(entry),
      entry.isArchived && 'hidden opacity-50',
    ),
    href,
    'data-archived': entry.isArchived ? true : undefined,
  }
}
