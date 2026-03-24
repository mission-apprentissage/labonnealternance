import type { Metadata } from "next"

import { getPrdvContext } from "@/utils/api"

import RdvaPage from "./RdvaPage"

export const metadata: Metadata = {
  title: "Contacter un centre de formation - La bonne alternance",
}

type SearchParams = Promise<{ cleMinistereEducatif?: string; referrer?: string }>

const Page = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { cleMinistereEducatif, referrer } = await searchParams
  const data = cleMinistereEducatif ? ((await getPrdvContext(cleMinistereEducatif, referrer ?? "lba")) ?? null) : null
  return <RdvaPage data={data} cleMinistereEducatif={cleMinistereEducatif ?? null} referrer={referrer ?? null} />
}

export default Page
