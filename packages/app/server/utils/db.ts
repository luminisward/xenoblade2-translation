import BetterSqlite3, { Database } from 'better-sqlite3'
import consola from 'consola'
import { EventHandlerRequest, H3Event } from 'h3'

let db: Database | null = null
export const getDB = (event: H3Event<EventHandlerRequest>) => {
  if (!db) {
    const { dbPath } = useRuntimeConfig(event)
    consola.info('connect to database: ', dbPath)
    db = new BetterSqlite3(dbPath, { readonly: true })
  }
  return db
}
