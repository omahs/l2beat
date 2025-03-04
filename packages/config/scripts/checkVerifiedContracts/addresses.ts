import { assertUnreachable, EthereumAddress } from '@l2beat/shared'

import { Bridge, Layer2, ProjectUpgradeability } from '../../src'
import { VerificationMap } from './output'
import { withoutDuplicates } from './utils'

export function getUniqueContractsForAllProjects(
  projects: (Layer2 | Bridge)[],
): EthereumAddress[] {
  const addresses = projects.flatMap(getUniqueContractsForProject)
  return withoutDuplicates(addresses)
}

export function getUniqueContractsForProject(
  project: Layer2 | Bridge,
): EthereumAddress[] {
  const projectContracts = project.contracts?.addresses ?? []
  const mainAddresses = projectContracts.map((c) => c.address)
  const upgradeabilityAddresses = projectContracts
    .map((c) => c.upgradeability)
    .filter((u): u is ProjectUpgradeability => !!u) // remove undefined
    .flatMap((u) => gatherAddressesFromUpgradeability(u))

  return withoutDuplicates([...mainAddresses, ...upgradeabilityAddresses])
}

function gatherAddressesFromUpgradeability(
  item: ProjectUpgradeability,
): EthereumAddress[] {
  const result: EthereumAddress[] = []

  switch (item.type) {
    case 'Custom':
    case 'CustomWithoutAdmin':
    case 'EIP1967 proxy':
    case 'ZeppelinOS proxy':
    case 'StarkWare diamond':
    case 'resolved delegate proxy':
    case 'call implementation proxy':
    case 'EIP897 proxy':
      result.push(item.implementation)
      break
    case 'StarkWare proxy':
      result.push(item.implementation)
      if (item.callImplementation) {
        result.push(item.callImplementation)
      }
      break
    case 'Arbitrum proxy':
      result.push(item.adminImplementation)
      result.push(item.userImplementation)
      break
    case 'new Arbitrum proxy':
      result.push(item.adminImplementation)
      result.push(item.userImplementation)
      result.push(item.implementation)
      break
    case 'Beacon':
      result.push(item.beacon)
      result.push(item.implementation)
      break
    case 'Reference':
    case 'immutable':
    case 'gnosis safe':
    case 'EIP2535 diamond proxy':
      // Ignoring types because no (admin/user)implementation included in them
      break
    default:
      // This code triggers a typescript compile-time error if not all cases have been covered
      assertUnreachable(item)
  }

  return result
}

export function areAllProjectContractsVerified(
  project: Layer2 | Bridge,
  addressVerificationMap: VerificationMap,
): boolean {
  const projectAddresses = getUniqueContractsForProject(project)
  return projectAddresses.every(
    (address) => addressVerificationMap[address.toString()],
  )
}
