import { __prod__ } from './utils/constants'
import { Post } from './entities/Post'
import { Author } from './entities/Author'
import { ConnectionOptions } from 'typeorm'
import { Rating } from './entities/Rating'

export const typeormConfig: ConnectionOptions = {
  // migrations: {
  //   path: path.join(__dirname, '/migrations'),
  //   pattern: /^[\w-]+\d+\.[tj]s$/,
  // },
  entities: [Post, Author, Rating],
  database: 'graphql',
  username: 'postgres',
  password: '221199',
  type: 'postgres',
  synchronize: true,
  logging: !__prod__,
}

//
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
