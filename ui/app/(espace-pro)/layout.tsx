import type { PropsWithChildren } from "react"

import { getSession } from "@/utils/getSession"

import { Footer } from "../_components/Footer"

import { EspaceProHeader } from "./_components/EspaceProHeader"

export default async function RecruteurLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <EspaceProHeader user={user} />
      {children}
      <Footer />
    </>
  )
}
