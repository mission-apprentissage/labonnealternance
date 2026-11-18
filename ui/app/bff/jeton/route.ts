import { connection, NextResponse } from "next/server"

import { issueChallenge, redeemSolution, SEARCH_TOKEN_COOKIE } from "../_lib/search-token-issuer"

const NO_STORE = { "cache-control": "no-store" }

// Débit limité par IP dans nginx (zone lba_jeton_recherche).
export async function GET() {
  // Défi aléatoire : jamais prérendu au build (cacheComponents).
  await connection()
  return NextResponse.json(await issueChallenge(new Date()), { headers: NO_STORE })
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const result = await redeemSolution(payload, new Date())
  if ("error" in result) {
    return NextResponse.json({ statusCode: 400, error: "Bad Request", message: `preuve de travail refusée (${result.error})` }, { status: 400, headers: NO_STORE })
  }
  const response = new NextResponse(null, { status: 204, headers: NO_STORE })
  response.cookies.set({ ...SEARCH_TOKEN_COOKIE, value: result.token })
  return response
}
