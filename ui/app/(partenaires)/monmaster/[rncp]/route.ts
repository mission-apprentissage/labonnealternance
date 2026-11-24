import type { NextRequest } from "next/server"

import { handlePartnerSearchRedirect } from "../../_utils/partner-search-link.handler"

export async function GET(request: NextRequest, { params }: { params: Promise<{ rncp: string }> }) {
  return handlePartnerSearchRedirect("monmaster", (await params).rncp, request.nextUrl.searchParams)
}
