import { BaseAPI } from '@/api/baseApi'
import { clearCollection } from '@/functions/books'
import { deleteUser } from '@/functions/auth'

export async function cleanupUserData(
  apiContext: BaseAPI,
  userId: string,
  token: string
): Promise<void> {
  await clearCollection(apiContext, userId, token).catch((err: unknown) => {
    console.warn(`[cleanup] clearCollection failed for user ${userId}: ${String(err)}`)
  })
  await deleteUser(apiContext, token, userId).catch((err: unknown) => {
    console.warn(`[cleanup] deleteUser failed for user ${userId}: ${String(err)}`)
  })
}