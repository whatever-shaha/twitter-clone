import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core'
import { Request, Response } from 'express'
import { Redis } from 'ioredis'

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  redis: Redis
  req: Request & { session: Express.Request & { userId: number } }
  res: Response
}
