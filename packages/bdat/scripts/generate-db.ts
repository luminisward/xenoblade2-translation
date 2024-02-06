import fsp from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { load } from 'cheerio'
import { config } from 'dotenv'
import ProgressBar from 'progress'
import Database from 'better-sqlite3'
import { $ } from 'execa'
import { languages, Language } from '../src/share'

config()

const languageFolderMap: { language: Language; folderName: string }[] = [
  { language: 'jp', folderName: 'Japanese' },
  { language: 'cn', folderName: 'SimpChinese' },
  { language: 'tw', folderName: 'TradChinese' },
  { language: 'gb', folderName: 'English' },
  { language: 'fr', folderName: 'French' },
  { language: 'ge', folderName: 'German' },
  { language: 'it', folderName: 'Italian' },
  { language: 'sp', folderName: 'Spanish' },
  { language: 'kr', folderName: 'Korean' },
]

const findHtmlFiles = async (dir: string) => {
  const htmlFiles: string[] = []
  async function readdir(startPath: string) {
    const files = await fsp.readdir(startPath)
    for (const file of files) {
      const filePath = path.join(startPath, file)
      const stats = await fsp.stat(filePath)
      if (stats.isDirectory()) {
        await readdir(filePath)
      } else if (path.extname(filePath) === '.html') {
        htmlFiles.push(filePath)
      }
    }
  }
  await readdir(dir)
  return htmlFiles
}

const compressedFilePath = './data/XC2LocalizedBDATs.tar.xz'
const main = async () => {
  const htmlDir = await fsp.mkdtemp(`${tmpdir()}${path.sep}`)
  try {
    await $`tar xf ${compressedFilePath} -C ${htmlDir}`
    await findHtmlFiles(htmlDir)
      .then((htmlFiles) => htmlFiles.filter((file) => file.includes('_ms')).sort())
      .then(async (htmlFiles: string[]) => {
        const bar = new ProgressBar('[:bar] :rate/s :percent :current/:total :etas :elapseds', {
          total: htmlFiles.length,
        })
        const dbFile = path.resolve(process.cwd(), 'dist/data.db')

        const db = new Database(dbFile)
        db.exec('drop table if exists ms')
        db.exec(`
        CREATE TABLE ms (
          file TEXT,
          id INTEGER,
          ${languages.map((language) => `${language} TEXT`).join(', ')},
          PRIMARY KEY(file, id))
      `)

        const lanReg = /\w+(?=\/bdat)/
        for (const htmlFile of htmlFiles) {
          const languageFolderName = htmlFile.match(lanReg)?.[0]
          if (!languageFolderName) {
            throw new Error("can't resolve languageFolderName")
          }
          const language = languageFolderMap.find((item) => item.folderName === languageFolderName)?.language
          if (!language) {
            throw new Error("can't resolve language: " + languageFolderName)
          }

          const fileBasename = path.basename(htmlFile, '.html')
          const html = await fsp.readFile(htmlFile, 'utf-8')
          const $ = load(html)

          const headers: string[] = []
          $('table th').each((i, th) => {
            headers.push($(th).text().trim())
          })

          const rows: { file: string; id: number; text: string }[] = []
          $('table tr').each((i, row) => {
            if (i === 0) return
            const rowElements = $(row).find('td')
            const rowData = rowElements.map((j, cell) => $(cell).text().trim())

            const id = Number(rowData[headers.findIndex((header) => header === 'ID')])
            const text = rowData[headers.findIndex((header) => header === 'name')]
            rows.push({ file: fileBasename, id, text })
          })

          // insert data
          const insert = db.prepare(`
            INSERT INTO ms (file, id, ${language})
            VALUES ($file, $id, $text)
            ON CONFLICT(file, id)
            DO UPDATE SET ${language}=$text;
          `)
          const insertRows = db.transaction((rows) => {
            for (const row of rows) {
              insert.run(row)
            }
          })
          insertRows(rows)
          bar.tick()
        }
      })
  } finally {
    await fsp.rm(htmlDir, { recursive: true })
  }
}

main()
