import { EthereumAddress, ProjectId, UnixTime } from '@l2beat/shared'

import { NUGGETS } from '../layer2s'
import { RISK_VIEW } from './common'
import { Bridge } from './types'

export const cBridge: Bridge = {
  type: 'bridge',
  id: ProjectId('cbridge'),
  display: {
    name: 'cBridge (Celer)',
    slug: 'cbridge',
    description:
      'Celer cBridge offers cross-chain token bridging in two modes: Token Bridge and Liquidity Network. It also offers AMB facility - ability to pass arbitrary\
      messages across chains. It leverages the "State Guardian Network" aka SGN to perform cross-chain communication.\
      For Liquidity Network, liquidity providers need to rely on SGN to remove their funds from the network.',
    links: {
      websites: ['https://www.celer.network/'],
      apps: ['https://cbridge.celer.network/'],
      explorers: [
        'https://cbridge-analytics.celer.network/',
        'https://celerscan.com/',
      ],
      documentation: ['https://cbridge-docs.celer.network/'],
      repositories: ['https://github.com/celer-network'],
      socialMedia: [
        'https://discord.gg/uGx4fjQ',
        'https://t.me/celernetwork',
        'https://twitter.com/CelerNetwork',
      ],
    },
  },
  config: {
    escrows: [
      // liquidity pool
      {
        address: EthereumAddress('0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820'),
        sinceTimestamp: new UnixTime(1638346811),
        tokens: ['ETH', 'USDC', 'WETH', 'USDT', 'MASK', 'BUSD', 'LYRA'],
      },
      // token bridge v1
      {
        address: EthereumAddress('0xB37D31b2A74029B5951a2778F959282E2D518595'),
        sinceTimestamp: new UnixTime(1639553135),
        tokens: [
          'USDC',
          'WETH',
          'USDT',
          'FRAX',
          'DAI',
          'RLY',
          'WBTC',
          'CELR',
          'FXS',
          'WXT',
        ],
      },
      // token bridge v2
      {
        address: EthereumAddress('0x7510792A3B1969F9307F3845CE88e39578f2bAE1'),
        sinceTimestamp: new UnixTime(1651661389),
        tokens: ['WETH', 'PSTAKE'],
      },
    ],
  },
  technology: {
    destination: [
      'BNB Chain',
      'Avalanche',
      'Polygon',
      'Arbitrum',
      'Optimism',
      'Fantom',
      'Gnosis Chain',
      'Metis',
      'Boba Network',
    ],
    category: 'Hybrid',
    principleOfOperation: {
      name: 'Principle of operation',
      description:
        'Celer cBridge is a hybrid solution able to work in two modes: Token Bridge and Liquidity Network, depending on the token and destination chain. More information is provided in Destination Tokens section.',
      references: [
        {
          text: 'Bridging models',
          href: 'https://cbridge-docs.celer.network/introduction/fungible-token-bridging-models',
        },
      ],
      risks: [
        {
          category: 'Funds can be frozen if',
          text: 'validators (SGN) decide to not process a withdrawal request from liquidity providers.',
          isCritical: true,
        },
      ],
    },
    validation: {
      name: 'Transfers are externally verified',
      description:
        'Validation process takes place in an external network called SGN that is operated by validators running on Tendermint consensus protocol. Nodes in the network observe contracts on each supported chain and sign messages when everything is correct. Based on the signature user can withdraw funds from the bridge.',
      references: [
        {
          text: 'State Guardian Network (SGN)',
          href: 'https://cbridge-docs.celer.network/introduction/state-guardian-network',
        },
      ],
      risks: [
        {
          category: 'Users can be censored if',
          text: 'validators (SGN) decide to stop processing certain transactions.',
          isCritical: true,
        },
        {
          category: 'Funds can be stolen if',
          text: 'validators (SGN) allow to mint more tokens than there are locked on Ethereum thus preventing some existing holders from being able to bring their funds back to Ethereum.',
          isCritical: true,
        },
        {
          category: 'Funds can be stolen if',
          text: 'validators (SGN) sign a fraudulent message allowing themselves to withdraw all locked funds.',
          isCritical: true,
        },
      ],
    },
    destinationToken: {
      name: 'Destination tokens',
      description:
        'Celer cBridge works in two token bridging models: xAsset and xLiquidity. xAsset model, the canonical mapping bridge, is intended for a token that is deployed on Ethereum but is not deployed on the destination chain. In this case cBridge will deploy a mapped version of the token on destination via lock-mint model. xLiquidity model, the pool-based bridge, is intended for token already deployed on Ethereum and destination. When users transfer between these chains they will be depositing their tokens into the pool on Ethereum and withdrawing a matching number of tokens from the pool on the destination chain based on a bridge rate generated by the StableSwap price curve. Additionally, it is worth pointing out that Celer introduced xAsset V2, the standard allowing for seamless cross-chain bridged assets transfers, without the need to return to source chain for liquidity. It is accomplished by changing the lock-mint model from V1 to burn-mint model in V2. What is more, Celer introduced "Open Canonical Token Bridge Standard" aiming to prevent bridge vendor lock-in.',
      references: [
        {
          text: 'Bridging models',
          href: 'https://cbridge-docs.celer.network/introduction/fungible-token-bridging-models',
        },
        {
          text: 'Open Canonical Token Bridge Standard',
          href: 'https://blog.celer.network/2021/12/13/say-no-to-vendor-lock-in-calling-for-an-open-canonical-token-bridge-standard/',
        },
        {
          text: 'xAsset V2',
          href: 'https://blog.celer.network/2022/06/02/celer-cbridge-launches-xasset-v2-to-support-omni-directional-cross-chain-transfers-for-bridged-tokens/',
        },
        {
          text: 'StableSwap',
          href: 'https://curve.fi/files/stableswap-paper.pdf',
        },
      ],
      risks: [],
    },
  },
  riskView: {
    sourceUpgradeability: {
      value: 'No',
      description: 'The code that secures the system can never change',
    },
    destinationToken: RISK_VIEW.CANONICAL_OR_WRAPPED,
    validatedBy: {
      value: 'Third Party',
      description:
        'Transfers need to be signed by external actors set by the governance.',
      sentiment: 'bad',
    },
  },
  contracts: {
    addresses: [
      {
        name: 'Message Bus',
        address: EthereumAddress('0x4066D196A423b2b3B8B054f4F40efB47a74E200C'),
        description:
          'Contract providing cross-chain AMB facility. It connects with Liquidity Network and Token Bridges to processes certain types of messages.',
      },
      {
        name: 'Liquidity Network',
        address: EthereumAddress('0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820'),
        description:
          'Contract providing cross-chain swaps, allows user to deposit funds and withdraw them. Additionally user can add liquidity to this address to generate yield.',
      },
      {
        name: 'Token Bridge v1',
        address: EthereumAddress('0xB37D31b2A74029B5951a2778F959282E2D518595'),
        description:
          'Contract serving as token bridge, user can deposit funds and later withdraw them from this escrow.',
      },
      {
        name: 'Token Bridge v2',
        address: EthereumAddress('0x7510792A3B1969F9307F3845CE88e39578f2bAE1'),
        description:
          'Contract serving as token bridge, user can deposit funds and later withdraw them from this escrow.',
      },
      {
        name: 'Pegged Token Bridge v1',
        address: EthereumAddress('0x16365b45EB269B5B5dACB34B4a15399Ec79b95eB'),
        description:
          'Contract minting/burning tokens when receiving a message from Token Bridge.',
      },
      {
        name: 'Pegged Token Bridge v2',
        address: EthereumAddress('0x52E4f244f380f8fA51816c8a10A63105dd4De084'),
        description:
          'Contract minting/burning tokens when receiving a message from Token Bridge.',
      },
      {
        name: 'Transfer Agent',
        address: EthereumAddress('0x9b274BC73940d92d0Af292Bde759cbFCCE661a0b'),
        description:
          'Routing contract that transfers assets cross-chain using either Liquidity Network or Token Bridge.',
      },
    ],
    references: [],
    risks: [],
  },
  permissions: [
    {
      name: 'Bridge Governance',
      description:
        'The owner of the Token Bridge and Liquidity Network is a governance contract with the permissions to manage: signers responsible for messages relaying, pausers with the ability to pause the bridge as well as governance of the system.',
      accounts: [
        {
          address: EthereumAddress(
            '0xF380166F8490F24AF32Bf47D1aA217FBA62B6575',
          ),
          type: 'Contract',
        },
      ],
    },
    {
      name: 'Bridge Governance voters',
      description:
        'Can vote on proposal which will be executed by the contract. Each voter holds the same voting power.',
      accounts: [
        {
          address: EthereumAddress(
            '0x1b9dFC56e38b0F92448659C114e2347Bd803911c',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x34dFa1226F8b3E36FE597B34eEa809a2B5c0bBf9',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0xDfE4F07D1F36B8d559b25082460a4f6A72531de2',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x9F6B03Cb6d8AB8239cF1045Ab28B9Df43dfCC823',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x2FB8783C14A71C08bFC1dE8Fc3D715Dd93039BF2',
          ),
          type: 'EOA',
        },
      ],
    },
    {
      name: 'Governors',
      description:
        'Can modify bridge operational parameters such as minimal and maximal send amounts, max slippage and transfer delay.',
      accounts: [
        {
          address: EthereumAddress(
            '0x8e9174ed59eA4b81E70d0aE0DE13242e2329106c',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x9F6B03Cb6d8AB8239cF1045Ab28B9Df43dfCC823',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x34dFa1226F8b3E36FE597B34eEa809a2B5c0bBf9',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x1b9dFC56e38b0F92448659C114e2347Bd803911c',
          ),
          type: 'EOA',
        },
      ],
    },
    {
      name: 'Pausers',
      description: 'Can pause and unpause the system.',
      accounts: [
        {
          address: EthereumAddress(
            '0x1a0aEc0fC48F1B5cc538BE74A90E340b278189e4',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x2FB8783C14A71C08bFC1dE8Fc3D715Dd93039BF2',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x9F6B03Cb6d8AB8239cF1045Ab28B9Df43dfCC823',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x34dFa1226F8b3E36FE597B34eEa809a2B5c0bBf9',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0xDfE4F07D1F36B8d559b25082460a4f6A72531de2',
          ),
          type: 'EOA',
        },
        {
          address: EthereumAddress(
            '0x1b9dFC56e38b0F92448659C114e2347Bd803911c',
          ),
          type: 'EOA',
        },
      ],
    },
  ],
  knowledgeNuggets: [
    {
      title: 'How HTLC bridge works?',
      url: 'https://twitter.com/bkiepuszewski/status/1437031523455229964',
      thumbnailUrl: NUGGETS.BARTEK_TWITTER_THUMBNAIL,
    },
    {
      title: 'cBridge deep dive',
      url: 'https://li.fi/knowledge-hub/cbridge-a-deep-dive/',
      thumbnailUrl: NUGGETS.LIFI_THUMBNAIL,
    },
  ],
}
