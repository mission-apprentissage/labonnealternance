import { m } from "framer-motion"
import { LazyMotion, domAnimation } from "framer-motion"

export default (props) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {props.children}
      </m.div>
    </LazyMotion>
  )
}
