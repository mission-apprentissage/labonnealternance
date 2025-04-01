import NextImage from "next/image"

import motif from "./home_form_decoration.svg"

export const HomeCircleImageDecoration = () => (
  <NextImage
    fetchPriority="low"
    src={motif.src}
    alt=""
    unoptimized
    height={motif.height}
    width={motif.width}
    style={{
      overflow: "visible",
      height: "calc(100% - 10px)",
      width: "100%",
      top: "20px",
      position: "absolute",
      objectFit: "cover",
    }}
  />
)
