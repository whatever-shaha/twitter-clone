import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import { buildSchema } from 'type-graphql'
import dotenv from 'dotenv'
import { createConnection } from 'typeorm'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/User/user'
import { COOKIE_NAME, __port__, __prod__ } from './utils/constants'
import { typeormConfig } from './typeorm.config'

dotenv.config()

const main = async () => {
  await createConnection(typeormConfig)
  // const orm = await ormConnection.connect()

  const app = express()
  app.use(cors({ origin: process.env.HOST_URL, credentials: true }))
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
    context: ({ req, res }) => ({ req, res, redis: RedisClient }),
  })

  apolloServer.applyMiddleware({ app, cors: false })
  app.listen(__port__, () =>
    console.log(`server is working on http://localhost:${__port__}/graphql`)
  )
}

main().catch((e) => console.log('ERROR OF MINE!', e.message))
