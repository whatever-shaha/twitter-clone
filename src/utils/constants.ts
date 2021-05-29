export const __prod__ = process.env.NODE_ENV === 'production'
export const __port__ = process.env.PORT || 4000
export const __argon_secret__ = process.env.ARGON_SECRET || ''
export const __redis_secret__ = process.env.REDIS_SECRET || ''

export const COOKIE_NAME = 'qid'
