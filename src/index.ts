import { MikroORM } from '@mikro-orm/core'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'

import mikroConfig from './mikro-orm.config'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/User/user'
import { COOKIE_NAME, __port__, __prod__ } from './utils/constants'

const main = async () => {
  const orm = await MikroORM.init(mikroConfig)
  await orm.getMigrator().up()
  const app = express()
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
  const RedisStore = connectRedis(session)
  const RedisClient = new Redis()

  app.use(
    session({
      store: new RedisStore({
        client: RedisClient,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true,
        secure: __prod__, //cookie only works in https
        sameSite: 'lax', //csrf
      },
      name: COOKIE_NAME,
      saveUninitialized: false,
      secret: 'asdfasdf',
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res, redis: RedisClient }),
  })

  apolloServer.applyMiddleware({ app, cors: false })
  app.listen(__port__, () =>
    console.log(`server is working on http://localhost:${__port__}/graphql`)
  )
}

main().catch((e) => console.log('ERROR OF MINE!', e.message))
