import Ajv from 'ajv'
import AutoLoad, { AutoloadPluginOptions } from 'fastify-autoload'
import fastifyJwt from 'fastify-jwt'
import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify'
import { fastifyMongodb } from 'fastify-mongodb'
import fp from 'fastify-plugin'
import { join } from 'path'

import { PLAYERS_COUNT, JWT_SECRET, MONGO_URI } from './constants'
import { PlayerModel } from './models/player'
import { BufficornModel } from './models/bufficorn'
import { RanchModel } from './models/ranch'
import { TradeModel } from './models/trade'
import { Bufficorn } from './domain/bufficorn'
import { MintModel } from './models/mint'

declare module 'fastify' {
  interface FastifyInstance {
    playerModel: PlayerModel
    ranchModel: RanchModel
    bufficornModel: BufficornModel
    tradeModel: TradeModel
    mintModel: MintModel
  }
}

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // TODO: Add HTTPS support
  // {
  //   https: {
  //     key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  //     cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
  //   }
  // }

  // Json Validator
  const ajv = new Ajv({
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: 'array',
    allErrors: true,
  })
  // Support ajv@7
  ajv.addKeyword('kind')
  ajv.addKeyword('modifier')
  fastify.setValidatorCompiler(({ schema }) => {
    return ajv.compile(schema)
  })

  // MongoDB
  fastify.register(fastifyMongodb, {
    // force to close the mongodb connection when app stopped
    forceClose: true,
    url: MONGO_URI,
  })
  // InitializeModels and callback
  const initializeModels: FastifyPluginCallback = async (
    fastify,
    options,
    next
  ) => {
    if (!fastify.mongo.db) throw Error('mongo db not found')
    const playerModel = new PlayerModel(fastify.mongo.db)
    const ranchModel = new RanchModel(fastify.mongo.db)
    const bufficornModel = new BufficornModel(fastify.mongo.db)
    const tradeModel = new TradeModel(fastify.mongo.db)
    const mintModel = new MintModel(fastify.mongo.db)

    fastify.decorate('playerModel', playerModel)
    fastify.decorate('ranchModel', ranchModel)
    fastify.decorate('bufficornModel', bufficornModel)
    fastify.decorate('tradeModel', tradeModel)
    fastify.decorate('mintModel', mintModel)

    next()
  }

  fastify.register(fp(initializeModels))

  // Initialize game repositories
  fastify.register(async (fastify, options, next) => {
    if (!fastify.mongo.db) throw Error('mongo db not found')
    // Initialize game repositories and bootstrap
    await fastify.playerModel.bootstrap(PLAYERS_COUNT)
    const bootstrappedBufficorns = await fastify.bufficornModel.bootstrap()
    // Get bufficorns if they are already bootstrapped
    const bufficorns =
      bootstrappedBufficorns || (await fastify.bufficornModel.getAll())
    await fastify.ranchModel.bootstrap(bufficorns as Array<Bufficorn>)
    next()
  })

  // CORS
  fastify.register(require('fastify-cors'), {
    origin: '*',
    methods: ['GET', 'POST'],
  })

  // JWT
  fastify.register(fastifyJwt, {
    secret: JWT_SECRET as string,
  })

  // Plugins defined in routes
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  })

  fastify.register(require('fastify-static'), {
    root: join(__dirname, '../public'),
    // prefix: '/public/', // optional: default '/'
  })
}

export default app
export { app }
