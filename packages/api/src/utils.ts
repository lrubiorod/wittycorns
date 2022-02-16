import {
  INDEX_TO_RANCH,
  PLAYER_MINT_TIMESTAMP,
  GAME_END_TIMESTAMP,
  PLAYER_MAINNET_TIMESTAMP,
  RANCHES_COUNT,
  TRADE_COOLDOWN_MILLIS,
  TRADE_DURATION_MILLIS,
} from './constants'
import {
  BonusRanchName,
  BufficornLeaderboardInfo,
  FarmerAward,
  PlayerLeaderboardInfo,
  RanchLeaderboardInfo,
  RanchName,
} from './types'
import { uniqueNamesGenerator, adjectives, names } from 'unique-names-generator'
import { Bufficorn } from './domain/bufficorn'

export function calculateRemainingCooldown(
  tradeEnds: number,
  currentTimestamp = Date.now(),
  tradeDuration: number = TRADE_DURATION_MILLIS,
  tradeCooldown: number = TRADE_COOLDOWN_MILLIS
) {
  const remainingMillis =
    tradeEnds - tradeDuration + tradeCooldown - currentTimestamp

  return remainingMillis > 0 ? remainingMillis : 0
}

export function calculateRemainingDuration(
  tradeEnds: number,
  currentTimestamp = Date.now()
) {
  const remainingMillis = tradeEnds - currentTimestamp

  return remainingMillis > 0 ? remainingMillis : 0
}

export function getRanchFromIndex(index: number): RanchName {
  const ranchIndex = index % RANCHES_COUNT

  return INDEX_TO_RANCH[ranchIndex]
}

export function fromHexToUint8Array(hex: string) {
  return Uint8Array.from(Buffer.from(hex.substring(2).padStart(64, '0'), 'hex'))
}

export function gameOver() {
  return Date.now() >= GAME_END_TIMESTAMP * 1000
}

export function isTimeToMint() {
  return Date.now() >= PLAYER_MINT_TIMESTAMP * 1000
}

export function isMainnetTime() {
  return Date.now() >= PLAYER_MAINNET_TIMESTAMP * 1000
}

export function printRemainingMillis(millis: number) {
  const seconds = Math.ceil(millis / 1000)
  if (seconds < 60) {
    return `${seconds} sec`
  } else {
    return `${Math.ceil(seconds / 60)} min`
  }
}

export function groupBufficornsByRanch(
  bufficorns: Array<Bufficorn>
): Record<RanchName, Array<Bufficorn>> {
  const bufficornsByRanch = {} as Record<RanchName, Array<Bufficorn>>

  for (let bufficorn of bufficorns) {
    if (bufficornsByRanch[bufficorn.ranch]) {
      bufficornsByRanch[bufficorn.ranch].push(bufficorn)
    } else {
      bufficornsByRanch[bufficorn.ranch] = [bufficorn]
    }
  }
  return bufficornsByRanch
}

export function generateUsernameList(count: number): Array<string> {
  const usernames = new Set<string>()
  // The seed must start at 1 because 0 means "use Math.random"
  let counter = 1

  while (usernames.size < count) {
    let username = uniqueNamesGenerator({
      dictionaries: [adjectives, names],
      seed: counter,
      separator: '-',
      style: 'lowerCase',
    })
    usernames.add(username)
    counter += 1
  }

  // Convert set into array to allow indexing by index
  return Array.from(usernames)
}

export function updateBestFarmerAward(
  farmerAwards: Array<FarmerAward>,
  playerName: string,
  topPlayers: Array<PlayerLeaderboardInfo>
) {
  for (let topPlayer of topPlayers) {
    if (playerName === topPlayer.username) {
      farmerAwards.push({
        category: 0,
        ranking: topPlayer.position + 1,
        bufficornId: 0,
      })
      break
    }
  }
}

export function updateBestRanchAward(
  farmerAwards: Array<FarmerAward>,
  playerRanch: RanchName | BonusRanchName,
  topRanches: Array<RanchLeaderboardInfo>
) {
  for (let topRanch of topRanches) {
    if (playerRanch === topRanch.name) {
      farmerAwards.push({
        category: 1,
        ranking: topRanch.position + 1,
        bufficornId: 0,
      })
      break
    }
  }
}

export function updateBestBufficornAwards(
  farmerAwards: Array<FarmerAward>,
  playerRanch: RanchName | BonusRanchName,
  topBufficorns: Array<BufficornLeaderboardInfo>,
  categoryIndex: number
) {
  for (let topBufficorn of topBufficorns) {
    if (playerRanch === topBufficorn.ranch) {
      farmerAwards.push({
        category: 2 + categoryIndex,
        ranking: topBufficorn.position + 1,
        bufficornId: topBufficorn.creationIndex,
      })
    }
  }
}
