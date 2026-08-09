import type { Metadata } from "next"

import { getPrdvContext } from "@/utils/api"

import RdvaPage from "./RdvaPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Contacter un centre de formation - La bonne alternance",
}

type SearchParams = Promise<{ cleMinistereEducatif?: string; referrer?: string }>

const Page = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { cleMinistereEducatif, referrer } = await searchParams
  let data = null
  if (cleMinistereEducatif) {
    data = (await getPrdvContext(cleMinistereEducatif, referrer ?? "lba")) ?? null
  }
  return <RdvaPage data={data} cleMinistereEducatif={cleMinistereEducatif ?? null} referrer={referrer ?? null} />
}

export default Page
