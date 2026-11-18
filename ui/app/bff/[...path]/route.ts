import type { NextRequest } from "next/server"

import { forwardToApi } from "../_lib/forward-to-api"

type Context = { params: Promise<{ path: string[] }> }

const handler = async (request: NextRequest, { params }: Context) => forwardToApi(request, (await params).path)

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT }
