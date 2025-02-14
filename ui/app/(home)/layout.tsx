import { Footer } from "../_components/Footer"
import { Header } from "../_components/Header"

export default function HomeLayout({ children }: { children: JSX.Element }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
