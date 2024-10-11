import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function PrintableJobPage() {
  const router = useRouter()
  const { jobId } = router.query

  useEffect(() => {
    // load job info
  }, [jobId])

  return <Box>Impression de {jobId}</Box>
}
