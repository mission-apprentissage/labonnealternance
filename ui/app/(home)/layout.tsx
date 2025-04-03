import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"

export default function HomeLayout({ children }: { children: JSX.Element }) {
  return (
    <>
      <PublicHeader />
      {children}
      <Footer />
    </>
  )
}
