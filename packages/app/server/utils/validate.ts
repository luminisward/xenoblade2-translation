import { type ZodType } from 'zod'

export const validate = <T>(target: any, schema: ZodType<T>) => {
  const validateResult = schema.safeParse(target)
  if (!validateResult.success) {
    throw createError({ statusCode: 400, message: 'Validate Failed', data: validateResult.error.issues })
  }
  return validateResult.data
}
