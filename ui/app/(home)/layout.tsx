import { Footer } from "../components/Footer"
import { Header } from "../components/Header"

export default function HomeLayout({ children }: { children: JSX.Element }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
