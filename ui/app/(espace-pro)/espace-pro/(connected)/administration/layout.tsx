import type { PropsWithChildren } from "react"

import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

export default async function Layout({ children }: PropsWithChildren) {
  return <DefaultContainer>{children}</DefaultContainer>
}
