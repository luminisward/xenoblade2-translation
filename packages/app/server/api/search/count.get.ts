import { languages } from 'bdat'
import { z } from 'zod'

const querySchema = z.object({
  k: z.string().trim().min(1),
  ql: z.enum(languages),
})

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const { k: keywords, ql: queryLanguage } = validate(query, querySchema)
  const db = getDB(event)
  const params = ['%' + keywords + '%']
  const countSql = `select count(*) as count from ms where ${queryLanguage} like ?`
  const stmt = db.prepare(countSql)
  const { count } = stmt.get(params) as { count: number }
  return count
})
