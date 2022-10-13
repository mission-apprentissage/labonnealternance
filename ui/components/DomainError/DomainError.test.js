import React from 'react';
import { render } from '@testing-library/react';
import DomainError from './DomainError';


describe('DomainError', () => {
  it('Renders static image and text', () => {
    const { container } = render(<DomainError />)
    expect(container.firstChild.classList.contains('c-domainerror')).toBe(true)
  })
})
