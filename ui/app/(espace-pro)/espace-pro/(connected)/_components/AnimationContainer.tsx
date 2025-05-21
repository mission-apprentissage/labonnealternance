import { LazyMotion, domAnimation } from "motion/react"
import * as motion from "motion/react-m"
import type { PropsWithChildren } from "react"

export default function AnimationContainer(props: PropsWithChildren) {
  return (
    <LazyMotion features={domAnimation}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {props.children}
      </motion.div>
    </LazyMotion>
  )
}
