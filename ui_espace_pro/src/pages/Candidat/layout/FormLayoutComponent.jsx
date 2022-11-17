import { Box, Container } from '@chakra-ui/react'
import Proptypes from 'prop-types'
import { FooterComponent } from './FooterComponent'
import { FormHeaderComponent } from './FormHeaderComponent'

/**
 * @description FormLayoutComponent.
 * @param {JSX.Element} children
 * @param {JSX.Element} headerText
 * @param {Object} rest
 * @returns {JSX.Element}
 */
export const FormLayoutComponent = ({ children, headerText, ...rest }) => {
  return (
    <Container maxW='full' p={0} {...rest} boxShadow='0px 0px 24px rgba(30, 30, 30, 0.24)' maxWidth='82ch'>
      <FormHeaderComponent>{headerText}</FormHeaderComponent>
      <Box mx={['2rem', '2rem', '6rem']} minH={'63vh'}>
        {children}
      </Box>
      <Box height='150px' />
      <FooterComponent />
    </Container>
  )
}

FormLayoutComponent.propTypes = {
  children: Proptypes.node,
  headerText: Proptypes.node,
}
