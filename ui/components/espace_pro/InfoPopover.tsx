import { Button, Icon, IconProps, Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@chakra-ui/react"
import { PropsWithChildren } from "react"

const PopoverIcon = (props: IconProps) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"
      fill="currentColor"
    />
  </Icon>
)

const InfoPopover = ({ children }: PropsWithChildren) => {
  return (
    <Popover trigger="hover">
      <PopoverTrigger>
        <Button variant="popover" leftIcon={<PopoverIcon color={"grey.500"} boxSize={13} />} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody>{children}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default InfoPopover
