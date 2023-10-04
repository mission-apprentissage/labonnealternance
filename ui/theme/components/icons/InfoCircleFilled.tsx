import { Icon } from "@chakra-ui/react"

/**
 * @description Info Circle Filled icon.
 * @param {number} width - Icon width
 * @param {string} fillHexaColor - Hexa color
 * @returns {JSX.Element}
 */
const InfoCircleFilled = ({ fillHexaColor }) => {
  return (
    <Icon width="18px" height="18px" viewBox="0 0 18 18">
      <path
        d="M9.00033 17.3332C4.39783 17.3332 0.666992 13.6023 0.666992 8.99984C0.666992 4.39734 4.39783 0.666504 9.00033 0.666504C13.6028 0.666504 17.3337 4.39734 17.3337 8.99984C17.3337 13.6023 13.6028 17.3332 9.00033 17.3332ZM8.16699 8.1665V13.1665H9.83366V8.1665H8.16699ZM8.16699 4.83317V6.49984H9.83366V4.83317H8.16699Z"
        fill={fillHexaColor}
      />
    </Icon>
  )
}

export { InfoCircleFilled }
