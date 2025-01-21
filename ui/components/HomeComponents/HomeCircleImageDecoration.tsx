import { Box } from "@chakra-ui/react"
import NextImage from "next/image"

const circleImgCssProperties = {
  position: "absolute",
  zIndex: 0,
}

export function HomeCircleImageDecoration() {
  return (
    <>
      <Box sx={circleImgCssProperties} top="60px" left="50px">
        <NextImage src="/images/howtocircle1.png" alt="" width={70} height={70} />
      </Box>
      <Box sx={circleImgCssProperties} bottom="-28px" left="444px">
        <NextImage src="/images/howtocircle2.png" alt="" width={56} height={56} />
      </Box>
      <Box sx={circleImgCssProperties} top="182px" right="512px">
        <NextImage src="/images/howtocircle3.png" alt="" width={80} height={80} />
      </Box>
      <Box sx={circleImgCssProperties} top="12px" right="312px">
        <NextImage src="/images/howtocircle4.png" alt="" width={50} height={50} />
      </Box>
      <Box sx={circleImgCssProperties} bottom="112px" right="-12px">
        <NextImage src="/images/howtocircle5.png" alt="" width={89} height={77} />
      </Box>
    </>
  )
}
