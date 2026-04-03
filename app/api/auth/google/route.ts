import { getAuthUrl } from '@/lib/gmail'

export async function GET() {
  const url = getAuthUrl()
  return Response.redirect(url)
}
