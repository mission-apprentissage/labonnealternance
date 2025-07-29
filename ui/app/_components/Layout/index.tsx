"use server"
import { Container, Flex } from "@chakra-ui/react"

import { Footer } from "@/app/_components/Footer"

export default async function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxW="full" p="0">
      <Flex direction="column" h="100vh">
        <Container as="main" p={0} maxW="container.xl" flexGrow="1">
          {children}
        </Container>
        <Footer isWidget={true} />
      </Flex>
    </Container>
  )
}
