import crypto from 'crypto'
import { Collection, Db } from 'mongodb'

import {
  PLAYER_KEY_LENGTH_BYTES,
  PLAYER_KEY_SALT,
  TRADE_POINTS,
  TRADE_POINTS_DIVISOR,
  TRADE_POINTS_MIN,
} from '../constants'
import { getRanchFromIndex, generateUsernameList } from '../utils'
import {
  DbPlayerVTO,
  DbTradeVTO,
  RanchName,
  ranchToTrait,
  Resource,
} from '../types'
import { Repository } from '../repository'
import { Player } from '../domain/player'

export class PlayerModel {
  private collection: Collection<DbPlayerVTO>
  private repository: Repository<DbPlayerVTO>

  constructor(db: Db) {
    this.collection = db.collection('players')
    this.repository = new Repository(this.collection, 'username')
  }

  public createPlayer(
    index: number,
    getUsername: (index: number) => string
  ): Player {
    // Generate the player data.
    // First we derive a deterministic 32-bytes sequence of bytes from a fixed salt plus the player nonce.
    const seed = crypto
      .createHash('sha256')
      .update(`${PLAYER_KEY_SALT}|${index}`)
      .digest()
    // We will be using the hexadecimal representation of the first `PLAYER_ID_LENGTH_BYTES` of the seed as the player key.
    const key: string = seed.slice(0, PLAYER_KEY_LENGTH_BYTES).toString('hex')
    const username = getUsername(index)
    const medals: Array<string> = []
    const ranch = getRanchFromIndex(index)
    const points: number = 0

    const selectedBufficorn = index % 4

    return new Player({
      key,
      username,
      ranch,
      medals,
      points,
      selectedBufficorn,
    })
  }

  /**
   * Generate as many players as specified in the `count` argument.
   * @param count How many players to generate
   * @param force If provided and set to `true`, circumvent the double bootstrapping protection.
   */
  public async bootstrap(
    count: number,
    force: boolean = false
  ): Promise<Array<Player> | null> {
    // Generate list of unique usernames to avoid name collisions
    const usernamesList = generateUsernameList(count)
    const getUsername = (index: number) => usernamesList[index]
    const vtos = await this.repository.bootstrap(
      (_: null, index: number) =>
        this.createPlayer(index, getUsername).toDbVTO(),
      count,
      force
    )

    return vtos?.map((vto) => new Player(vto)) || null
  }

  public async update(player: DbPlayerVTO): Promise<Player> {
    const { username } = player

    return new Player(await this.repository.updateOne({ username }, player))
  }

  public async get(key: string): Promise<Player | null> {
    const vto = await this.repository.getOne({ key })

    return vto ? new Player(vto) : null
  }

  public generateResource(
    player: DbPlayerVTO,
    lastTrade: DbTradeVTO | null
  ): Resource {
    // Compute points
    let amount
    if (!lastTrade) {
      amount = TRADE_POINTS
    } else {
      amount = Math.max(
        Math.ceil(lastTrade.resource.amount / TRADE_POINTS_DIVISOR),
        TRADE_POINTS_MIN
      )
    }

    // Get trait
    const ranchName = RanchName[player.ranch]
    const trait = ranchToTrait[ranchName]

    return {
      amount,
      trait,
    }
  }

  public async getAll(): Promise<Array<Player>> {
    // TODO: Remove mongoDB $exists from model
    const vtos = await this.repository.get({
      token: { $exists: true },
    })

    return vtos.map((vto) => new Player(vto))
  }

  public async getOne(id: string): Promise<Player | null> {
    const vto = await this.repository.getById(id)

    return vto ? new Player(vto) : null
  }

  public async updateSelectedBufficorn(
    username: string,
    index: number
  ): Promise<Player | null> {
    const vto = await this.repository.updateOne(
      { username },
      { selectedBufficorn: index }
    )

    return vto ? new Player(vto) : null
  }
}
