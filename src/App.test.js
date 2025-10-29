import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Welcome to Lemi on auth screen', () => {
  render(<App />);
  const heading = screen.getByText(/Welcome to Lemi/i);
  expect(heading).toBeInTheDocument();
});
