import { type Language, languages } from 'bdat'
import { z } from 'zod'

type Response = ({
  file: string
  id: number
} & {
  [key in Language]?: string
})[]

const querySchema = z.object({
  k: z.string().trim().min(1),
  offset: z.coerce.number().nonnegative().int(),
  limit: z.coerce.number().nonnegative().int().min(1).max(100),
  ql: z.enum(languages),
  rl: z.union([z.enum(languages), z.array(z.enum(languages))]).transform((v) => (Array.isArray(v) ? v : [v])),
})

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const { k: keywords, offset, limit, ql: queryLanguage, rl: resultLanguages } = validate(query, querySchema)
  const db = getDB(event)
  const params = ['%' + keywords + '%', limit, offset]
  const sql = `select file, id, ${resultLanguages} from ms where ${queryLanguage} like ? limit ? offset ?`
  const stmt = db.prepare(sql)
  return stmt.all(params) as Response
})
