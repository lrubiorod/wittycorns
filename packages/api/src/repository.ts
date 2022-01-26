import {
  Collection,
  Filter,
  ObjectId,
  OptionalUnlessRequiredId,
  WithId,
} from 'mongodb'

export class Repository<T> {
  private collection: Collection<T>
  private keyName: keyof T

  constructor(collection: Collection<T>, keyName: keyof T) {
    this.collection = collection
    this.keyName = keyName
  }

  async bootstrap(
    createElement: (_: null, index: number) => T,
    numberOfElementsToCreate: number,
    force: boolean
  ) {
    // Tell if the collection is already bootstrapped
    const isAlreadyBootstrapped =
      (await this.collection.estimatedDocumentCount()) > 0

    // Prevent accidental bootstrapping if the collection is already bootstrapped
    if (isAlreadyBootstrapped && !force) {
      return null
    }

    const promises = Array(numberOfElementsToCreate)
      .fill(null)
      .map(createElement)
      .map((val) => this.create(val))

    return await Promise.all(promises)
  }

  public async create(element: T): Promise<WithId<T>> {
    const success = await this.collection.insertOne(
      element as OptionalUnlessRequiredId<T>
    )

    if (!success.acknowledged)
      throw new Error(
        `Element could not be created (name: ${element[this.keyName]})`
      )

    const result = await this.collection.findOne({
      [this.keyName]: element[this.keyName],
    } as Filter<T>)

    return result as WithId<T>
  }

  public async createWithId(element: T, id: ObjectId): Promise<WithId<T>> {
    const elementWithId = { ...element, _id: id }
    const success = await this.collection.insertOne(
      elementWithId as OptionalUnlessRequiredId<T>
    )

    if (!success.acknowledged)
      throw new Error(
        `Element could not be created (name: ${element[this.keyName]})`
      )

    const result = await this.collection.findOne({
      [this.keyName]: element[this.keyName],
    } as Filter<T>)

    return result as WithId<T>
  }

  public async getOne(filter: Filter<T>): Promise<WithId<T> | null> {
    return await this.collection.findOne(filter)
  }

  public async get(filter: Filter<T>): Promise<Array<WithId<T>>> {
    return await this.collection.find(filter).toArray()
  }

  public async getSortedByName(filter: Filter<T>): Promise<Array<WithId<T>>> {
    return await this.collection.find(filter, { sort: { name: 1 } }).toArray()
  }

  public async getById(id: ObjectId | string): Promise<WithId<T> | null> {
    // TODO: Remove any
    const filter: Filter<T> = {
      _id: typeof id === 'string' ? new ObjectId(id) : id,
    } as any
    const findOneResult = this.collection.findOne(filter)

    return findOneResult
  }

  public async updateOne(
    filter: Filter<T>,
    element: Partial<T>
  ): Promise<WithId<T>> {
    try {
      const success = await this.collection.updateOne(
        filter,
        { $set: element },
        { upsert: false }
      )

      if (!success.acknowledged)
        throw new Error(
          `Element could not be updated (name: ${element[this.keyName]})`
        )

      return (await this.getOne(filter)) as WithId<T>
    } catch (error) {
      throw new Error(`Element does not exist (name: ${element[this.keyName]})`)
    }
  }

  public async getLast(filter: Filter<T>) {
    return await this.collection.findOne(filter, {
      sort: { timestamp: -1 },
    })
  }
}
