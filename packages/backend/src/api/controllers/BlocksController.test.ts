import { mock, UnixTime } from '@l2beat/shared'
import { expect } from 'earljs'

import { BlockNumberRepository } from '../../peripherals/database/BlockNumberRepository'
import { BlocksController } from './BlocksController'

describe(BlocksController.name, () => {
  it('returns transformed blocks', async () => {
    const blockNumberRepository = mock<BlockNumberRepository>({
      async getAll() {
        return [
          { blockNumber: 123, timestamp: new UnixTime(1000) },
          { blockNumber: 456, timestamp: new UnixTime(2000) },
        ]
      },
    })
    const blocksController = new BlocksController(blockNumberRepository)
    expect<unknown>(await blocksController.getAllBlocks()).toEqual([
      {
        blockNumber: '123',
        timestamp: '1970-01-01T00:16:40.000Z',
      },
      {
        blockNumber: '456',
        timestamp: '1970-01-01T00:33:20.000Z',
      },
    ])
  })
})
