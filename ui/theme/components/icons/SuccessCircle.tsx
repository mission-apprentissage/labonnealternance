import { Icon } from "@chakra-ui/react"

const SuccessCircle = ({ width = undefined, fillHexaColor, ...props }) => (
  <Icon width={width} height="100%" viewBox="0 0 34 34" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.0002 33.6666C7.79516 33.6666 0.333496 26.2049 0.333496 16.9999C0.333496 7.79492 7.79516 0.333252 17.0002 0.333252C26.2052 0.333252 33.6668 7.79492 33.6668 16.9999C33.6668 26.2049 26.2052 33.6666 17.0002 33.6666ZM15.3385 23.6666L27.1218 11.8816L24.7652 9.52492L15.3385 18.9533L10.6235 14.2383L8.26683 16.5949L15.3385 23.6666Z"
      fill={fillHexaColor}
    />
  </Icon>
)

export { SuccessCircle }
