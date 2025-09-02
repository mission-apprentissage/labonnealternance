import { useState } from "react"

export const useDisclosure = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial)
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  const onToggle = () => setIsOpen((v) => !v)

  return { isOpen, onOpen, onClose, onToggle }
}
