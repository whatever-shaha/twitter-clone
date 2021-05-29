import { MikroORM } from '@mikro-orm/core'
import dotenv from 'dotenv'
import path from 'path'
import { __prod__ } from './utils/constants'
import { Post } from './entities/Post'
import { User } from './entities/User'
dotenv.config()

export default {
  migrations: {
    path: path.join(__dirname, '/migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  dbName: 'fullstack',
  password: 'qwesad',
  type: 'postgresql',
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]

// export default {
//   migrations: {
//     path: path.join(__dirname, '/migrations'),
//     pattern: /^[\w-]+\d+\.[tj]s$/,
//     // disableForeignKeys: false,
//   },
//   entities: [Post, User],
//   // driver: PostgreSqlDriver,
//   driverOptions: {
//     connection: { ssl: { rejectUnauthorized: false } },
//   },
//   clientUrl: process.env.DATABASE_URL,
//   type: 'postgresql',
//   debug: !__prod__,
// } as Parameters<typeof MikroORM.init>[0]
