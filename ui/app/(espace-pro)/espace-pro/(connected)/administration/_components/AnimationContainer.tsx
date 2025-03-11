import { m, LazyMotion, domAnimation } from "framer-motion"

export default function AnimationContainer(props) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {props.children}
      </m.div>
    </LazyMotion>
  )
}
