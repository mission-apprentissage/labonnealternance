import type { PropsWithChildren } from "react"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

export default async function HomeLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <PublicHeader user={user} hideConnectionButton={true} />
      {children}
      <Footer />
    </>
  )
}
