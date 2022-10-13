import React from 'react';
import { render } from '@testing-library/react';
import CandidatureSpontaneeSubmit from './CandidatureSpontaneeSubmit';

describe('CandidatureSpontaneeSubmit', () => {

  it('By default renders nothing', () => {
    const { container } = render(<CandidatureSpontaneeSubmit sendingState={''} />)
    expect(container.firstChild).toBe(null)
  })

  it('Renders a submit button by default', () => {
    const { container } = render(<CandidatureSpontaneeSubmit sendingState={'not_sent'} />)
    expect(container.firstChild.classList.contains('c-candidature-submit--default')).toBe(true)
  })

  it('Renders an spinner message if submission is pending', () => {
    const { container } = render(<CandidatureSpontaneeSubmit sendingState={'currently_sending'} />)
    expect(container.firstChild.classList.contains('c-candidature-submit-sending')).toBe(true)
  })
  
  it('Renders an appropriate message if submission is over and OK', () => {
    const { container } = render(<CandidatureSpontaneeSubmit sendingState={'ok_sent'} />)
    expect(container.firstChild.classList.contains('c-candidature-submit-ok')).toBe(true)
  })
  
  it('Renders an error message if submission is over and NOT OK', () => {
    const { container } = render(<CandidatureSpontaneeSubmit sendingState={'not_sent_because_of_errors'} />)
    expect(container.firstChild.classList.contains('c-candidature-submit-error')).toBe(true)
  })

})
