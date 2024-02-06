export const languages = ['jp', 'cn', 'tw', 'gb', 'fr', 'ge', 'it', 'sp', 'kr'] as const
export type Language = (typeof languages)[number]

export type Row = {
  file: string
  id: number
} & {
  [language in Language]: string
}
