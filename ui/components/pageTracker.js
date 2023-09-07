import { useRouter } from "next/router"
import { usePlausible } from "next-plausible"
import React from "react"

const PageTracker = (props) => {
  const router = useRouter()

  const plausible = usePlausible()

  React.useEffect(() => {
    const handleRouteChange = (url) => {
      try {
        if (url.indexOf("?") < 0) {
          plausible("pageview", { url })
        }
      } catch (err) {}
    }

    router.events.on("routeChangeStart", handleRouteChange)

    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  }, [])

  return <>{props.children}</>
}

export default PageTracker
