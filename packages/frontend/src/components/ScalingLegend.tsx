import React from 'react'

import { OptimismIcon, StarkWareIcon, WarningIcon, ZkSyncIcon } from './icons'

export interface ScalingLegendProps {
  showTokenWarnings?: boolean
}

export function ScalingLegend(props: ScalingLegendProps) {
  return (
    <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="flex gap-1">
          <StarkWareIcon className="relative -top-0.5 min-w-[24px]" />
          <span>&ndash;</span>
          <span>This project is built using StarkEx.</span>
        </p>
        <p className="flex gap-1">
          <OptimismIcon className="relative -top-0.5 min-w-[24px]" />
          <span>&ndash;</span>
          <span>This project is based on Optimism&apos;s code base.</span>
        </p>
        <p className="flex gap-1">
          <ZkSyncIcon className="relative -top-0.5 min-w-[24px]" />
          <span>&ndash;</span>
          <span>This project is based on zkSync&apos;s code base.</span>
        </p>
      </div>
      {props.showTokenWarnings && (
        <div className="flex flex-col gap-2">
          <p className="flex gap-1">
            <WarningIcon className="relative -top-0.5 min-w-[24px] fill-yellow-700 dark:fill-yellow-300" />
            <span>&ndash;</span>
            <span>
              A token associated with the project accounts for more than 10% of
              the TVL.
            </span>
          </p>
          <p className="flex gap-1">
            <WarningIcon className="relative -top-0.5 min-w-[24px] fill-red-700 dark:fill-red-300" />
            <span>&ndash;</span>
            <span>
              A token associated with the project accounts for more than 90% of
              the TVL. This may make the metric vulnerable to manipulation if
              the majority of the supply is concentrated and markets are very
              illiquid.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
