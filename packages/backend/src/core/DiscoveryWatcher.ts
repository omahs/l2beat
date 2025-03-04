import { Hash256, Logger, ProjectParameters, UnixTime } from '@l2beat/shared'
import { providers } from 'ethers'
import { Counter, Gauge, Histogram } from 'prom-client'

import { DiscoveryWatcherRepository } from '../peripherals/database/discovery/DiscoveryWatcherRepository'
import { DiscordClient } from '../peripherals/discord/DiscordClient'
import { Clock } from './Clock'
import { ConfigReader } from './discovery/ConfigReader'
import { DiscoveryContract } from './discovery/DiscoveryConfig'
import { DiscoveryEngine } from './discovery/DiscoveryEngine'
import { diffDiscovery, DiscoveryDiff } from './discovery/utils/diffDiscovery'
import { diffToMessages } from './discovery/utils/diffToMessages'
import { getDiscoveryConfigHash } from './discovery/utils/getDiscoveryConfigHash'
import { TaskQueue } from './queue/TaskQueue'

export interface Diff {
  changes: DiscoveryDiff[]
  sendDailyReminder: boolean
}

export class DiscoveryWatcher {
  private readonly taskQueue: TaskQueue<UnixTime>

  constructor(
    private readonly provider: providers.AlchemyProvider,
    private readonly discoveryEngine: DiscoveryEngine,
    private readonly discordClient: DiscordClient | undefined,
    private readonly configReader: ConfigReader,
    private readonly repository: DiscoveryWatcherRepository,
    private readonly clock: Clock,
    private readonly logger: Logger,
  ) {
    this.logger = this.logger.for(this)
    this.taskQueue = new TaskQueue(
      (timestamp) => this.update(timestamp),
      this.logger.for('taskQueue'),
      {
        metricsId: DiscoveryWatcher.name,
      },
    )
  }

  start() {
    this.logger.info('Started')
    return this.clock.onNewHour((timestamp) => {
      this.taskQueue.addToFront(timestamp)
    })
  }

  async update(timestamp: UnixTime) {
    const metricsDone = initMetrics()
    // TODO: get block number based on clock time
    const blockNumber = await this.provider.getBlockNumber()
    const isDailyReminder = timestamp.equals(
      timestamp.toStartOf('day').add(8, 'hours'),
    )
    this.logger.info('Update started', { blockNumber })

    const projectConfigs = await this.configReader.readAllConfigs()

    let changesCounter = 0
    const notUpdatedProjects: string[] = []
    for (const projectConfig of projectConfigs) {
      this.logger.info('Discovery started', { project: projectConfig.name })

      try {
        const discovery = await this.discoveryEngine.run(
          projectConfig,
          blockNumber,
        )
        const configHash = getDiscoveryConfigHash(projectConfig)

        const diff = await this.findChanges(
          projectConfig.name,
          discovery,
          configHash,
          isDailyReminder,
          projectConfig.overrides,
        )

        if (diff.changes.length > 0) {
          const messages = diffToMessages(projectConfig.name, diff.changes)
          await this.notify(messages, 'PUBLIC')
          await this.notify(messages, 'INTERNAL')
          changesCounter += diff.changes.length
        }

        if (diff.sendDailyReminder) {
          notUpdatedProjects.push(projectConfig.name)
        }

        await this.repository.addOrUpdate({
          projectName: projectConfig.name,
          timestamp,
          blockNumber,
          discovery,
          configHash,
        })

        this.logger.info('Discovery finished', { project: projectConfig.name })
      } catch (error) {
        this.logger.error(error)
        errorsCount.inc()
      }
    }

    if (isDailyReminder) {
      await this.notify(
        [getDailyReminderMessage(notUpdatedProjects, timestamp)],
        'INTERNAL',
      )
    }

    this.logger.info('Update finished', { blockNumber })
    metricsDone(blockNumber, changesCounter)
  }

  async findChanges(
    name: string,
    discovery: ProjectParameters,
    configHash: Hash256,
    isDailyReminder: boolean,
    overrides?: Record<string, DiscoveryContract>,
  ): Promise<Diff> {
    const result: Diff = {
      changes: [],
      sendDailyReminder: false,
    }

    const committed = await this.configReader.readDiscovery(name)
    const diffFromCommitted = diffDiscovery(
      committed.contracts,
      discovery.contracts,
      overrides,
    )

    const databaseEntry = await this.repository.findLatest(name)
    let diffFromDatabase: DiscoveryDiff[] = []
    if (databaseEntry !== undefined) {
      diffFromDatabase = diffDiscovery(
        databaseEntry.discovery.contracts,
        discovery.contracts,
        overrides,
      )
    }

    if (isDailyReminder && diffFromCommitted.length > 0) {
      this.logger.debug('Include inside daily reminder', { project: name })
      result.sendDailyReminder = true
    }

    if (
      databaseEntry === undefined ||
      databaseEntry.configHash !== configHash
    ) {
      this.logger.debug('Using committed file for diff', { project: name })
      result.changes = diffFromCommitted
    } else {
      this.logger.debug('Using database record for diff', { project: name })
      result.changes = diffFromDatabase
    }

    return result
  }

  async notify(messages: string[], channel: 'PUBLIC' | 'INTERNAL') {
    if (!this.discordClient) {
      // TODO: maybe only once? rethink
      this.logger.info(
        'DiscordClient not setup, notification has not been sent. Did you provide correct .env variables?',
      )
      return
    }

    for (const message of messages) {
      await this.discordClient.sendMessage(message, channel).then(
        () => this.logger.info('Notification to Discord has been sent'),
        (e) => this.logger.error(e),
      )
    }
  }
}

function getDailyReminderMessage(projects: string[], timestamp: UnixTime) {
  const dailyReportMessage = `\`\`\`Daily bot report @ ${timestamp.toYYYYMMDD()}\`\`\`\n`
  if (projects.length > 0) {
    return `${dailyReportMessage}${projects
      .map((p) => `:x: ${p}`)
      .join('\n\n')}`
  }

  return `${dailyReportMessage}:white_check_mark: everything is up to date`
}

const latestBlock = new Gauge({
  name: 'discovery_watcher_last_synced',
  help: 'Value showing latest block number with which DiscoveryWatcher was run',
})

const changesDetected = new Gauge({
  name: 'discovery_watcher_changes_detected',
  help: 'Value showing the amount of changes detected by DiscoveryWatcher',
})

const syncHistogram = new Histogram({
  name: 'discovery_watcher_sync_duration_histogram',
  help: 'Histogram showing DiscoveryWatcher sync duration',
  buckets: [1, 2, 4, 6, 8, 10, 12, 15].map((x) => x * 60),
})

const errorsCount = new Counter({
  name: 'discovery_watcher_errors',
  help: 'Value showing amount of errors since server start',
})

function initMetrics(): (blockNumber: number, changesCounter: number) => void {
  const histogramDone = syncHistogram.startTimer()

  return (blockNumber: number, changesCounter: number) => {
    histogramDone()
    latestBlock.set(blockNumber)
    changesDetected.set(changesCounter)
  }
}
