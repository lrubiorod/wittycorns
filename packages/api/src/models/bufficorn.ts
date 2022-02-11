import { Collection, Db } from 'mongodb'

import { BufficornVTO, RanchName, Resource } from '../types'
import {
  BONUS_MULTIPLIER,
  BUFFICORNS_PER_RANCH,
  RANCHES_COUNT,
} from '../constants'
import { Repository } from '../repository'
import { Bufficorn } from '../domain/bufficorn'

export class BufficornModel {
  private collection: Collection<BufficornVTO>
  private repository: Repository<BufficornVTO>

  constructor(db: Db) {
    this.collection = db.collection('bufficorns')
    this.repository = new Repository(this.collection, 'name')

    this.collection.createIndex({ name: 1 })
    this.collection.createIndex({ creationIndex: 1 })
    this.collection.createIndex({ ranch: 1, creationIndex: 1 })
  }

  /**
   * Generate as many ranches as specified in the `count` argument.
   * @param force If provided and set to `true`, circumvent the double bootstrapping protection.
   */
  public async bootstrap(
    force: boolean = false
  ): Promise<Array<Bufficorn> | null> {
    const vtos = await this.repository.bootstrap(
      (_: null, index: number) => new Bufficorn(undefined, index).toVTO(),
      BUFFICORNS_PER_RANCH * RANCHES_COUNT,
      force
    )

    return vtos ? vtos.map((vto) => new Bufficorn(vto)) : null
  }

  public async create(bufficorn: BufficornVTO): Promise<Bufficorn> {
    const { name } = bufficorn
    const bufficornExists = await this.repository.getOne({ name })

    if (bufficornExists) {
      throw new Error(`Bufficorn with name ${name} already exists`)
    }

    return new Bufficorn(await this.repository.create(bufficorn))
  }

  public async update(bufficorn: BufficornVTO): Promise<Bufficorn> {
    const { name } = bufficorn
    const exists = await this.repository.getOne({ name })

    if (!exists) {
      throw new Error(`Bufficorn does not exist (name: ${name})`)
    }

    return new Bufficorn(await this.repository.updateOne({ name }, bufficorn))
  }

  public async getBufficornsByRanch(
    name: string
  ): Promise<Array<Bufficorn> | null> {
    const vtos = await this.repository.getSortedBy(
      {
        ranch: name as RanchName,
      },
      {
        creationIndex: 1,
      }
    )

    return vtos.map((vto) => new Bufficorn(vto))
  }

  public async getAll(): Promise<Array<Bufficorn>> {
    return (await this.repository.get({})).map((vto) => new Bufficorn(vto))
  }

  async getSelectedBufficorn(
    ranch: RanchName,
    creationIndex: number
  ): Promise<Bufficorn | null> {
    const vto = await this.repository.getOne({
      ranch,
      creationIndex,
    })

    return vto ? new Bufficorn(vto) : null
  }

  public async getOne(name: string): Promise<Bufficorn | null> {
    const vto = await this.repository.getOne({ name })

    return vto ? new Bufficorn(vto) : null
  }

  public async feed(
    creationIndex: number,
    resource: Resource,
    ranch: RanchName,
    bonusFlag: boolean
  ): Promise<Bufficorn> {
    const bufficorn = await this.repository.getOne({ creationIndex })

    if (!bufficorn) {
      throw new Error(
        `Bufficorn with creationIndex ${creationIndex} and ranch ${ranch} doesn't exist`
      )
    }

    if (ranch !== bufficorn.ranch) {
      throw new Error(
        `Bufficorn with creationIndex ${creationIndex} and ranch ${ranch} doesn't belong to your ranch`
      )
    }
    const amount = bonusFlag
      ? resource.amount * BONUS_MULTIPLIER
      : resource.amount

    return new Bufficorn(
      await this.repository.updateOne(
        { creationIndex, ranch },
        {
          [resource.trait]: amount + bufficorn[resource.trait],
        }
      )
    )
  }
}
