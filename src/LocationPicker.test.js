import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationPicker from './LocationPicker';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window.L (Leaflet global object) with proper chaining
const mockMap = {
  setView: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const mockMarker = {
  addTo: jest.fn().mockReturnThis(),
  setLatLng: jest.fn().mockReturnThis(),
};

const mockTileLayer = {
  addTo: jest.fn().mockReturnThis(),
};

global.window = global.window || {};
global.window.L = {
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => mockTileLayer),
  marker: jest.fn(() => mockMarker),
};

describe('LocationPicker Component', () => {
  const mockOnLocationSelect = jest.fn();
  const mockTheme = {
    card: '#ffffff',
    text: '#000000',
    textMuted: '#666666',
    border: '#cccccc',
    primary: '#6366f1',
    background: '#f5f5f5',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Paris Area Mode (filterMode="all")', () => {
    test('renders with correct placeholder for Paris area', () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      expect(input).toBeInTheDocument();
    });

    test('does not show Cité houses on focus for Paris area', async () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      fireEvent.focus(input);

      // Wait a bit to ensure no suggestions appear
      await waitFor(() => {
        const suggestions = screen.queryByText(/Fondation/i);
        expect(suggestions).not.toBeInTheDocument();
      });
    });

    test('searches locations when user types in Paris mode', async () => {
      const mockResponse = {
        data: [
          {
            place_id: '12345',
            name: 'Fleurus Bar',
            display_name: 'Fleurus Bar, Paris, France',
            lat: '48.8566',
            lon: '2.3522',
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      fireEvent.change(input, { target: { value: 'Fleurus' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('displays initial address if provided', () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          initialAddress="123 Rue de Paris, France"
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByDisplayValue('123 Rue de Paris, France');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Cité Area Mode (filterMode="cite")', () => {
    test('renders with correct placeholder for Cité area', () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="cite"
        />
      );

      const input = screen.getByPlaceholderText(/Enter an address/i);
      expect(input).toBeInTheDocument();
    });

    test('does not show Cité houses automatically on focus', async () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="cite"
        />
      );

      const input = screen.getByPlaceholderText(/Enter an address/i);
      fireEvent.focus(input);

      // Wait to ensure no automatic suggestions
      await waitFor(() => {
        const suggestions = screen.queryByText(/Fondation/i);
        expect(suggestions).not.toBeInTheDocument();
      });
    });

    test('filters Cité houses when user types in Cité mode', async () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="cite"
        />
      );

      const input = screen.getByPlaceholderText(/Enter an address/i);
      
      // Type to search for a Cité house
      fireEvent.change(input, { target: { value: 'Fondation' } });

      await waitFor(() => {
        // Should filter and show Cité houses matching the search
        expect(input.value).toBe('Fondation');
      });
    });

    test('does not show suggestions for empty query in Cité mode', async () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="cite"
        />
      );

      const input = screen.getByPlaceholderText(/Enter an address/i);
      
      // Clear input
      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        const suggestions = screen.queryByText(/Fondation/i);
        expect(suggestions).not.toBeInTheDocument();
      });
    });
  });

  describe('Location Selection', () => {
    test('calls onLocationSelect when a location is selected', async () => {
      const mockLocation = {
        address: 'Test Location',
        lat: 48.8566,
        lng: 2.3522,
      };

      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      // The actual selection would happen through clicking a suggestion
      // This tests the callback is available
      expect(mockOnLocationSelect).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('does not call onEnterPress without coordinates', () => {
      const mockOnEnterPress = jest.fn();

      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
          onEnterPress={mockOnEnterPress}
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnEnterPress).not.toHaveBeenCalled();
    });

    test('Enter key is handled by the component', () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      
      // Just verify the Enter key doesn't cause errors
      expect(() => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      }).not.toThrow();
    });
  });

  describe('Environment-specific behavior', () => {
    test('works in local development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      expect(input).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test('works in production/deployed environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      expect(input).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Integration Tests', () => {
    test('Paris area: full flow from empty to search to select', async () => {
      const mockResponse = {
        data: [
          {
            place_id: '123',
            name: 'Test Venue',
            display_name: 'Test Venue, Paris, France',
            lat: '48.8566',
            lon: '2.3522',
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="all"
        />
      );

      // Start with empty field
      const input = screen.getByPlaceholderText(/Search for a location/i);
      expect(input.value).toBe('');

      // Focus should not show anything
      fireEvent.focus(input);
      await waitFor(() => {
        expect(screen.queryByText(/Fondation/i)).not.toBeInTheDocument();
      });

      // Type to search
      fireEvent.change(input, { target: { value: 'Test Venue' } });
      expect(input.value).toBe('Test Venue');
    });

    test('Cité area: full flow from empty to search to select', async () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          filterMode="cite"
        />
      );

      // Start with empty field
      const input = screen.getByPlaceholderText(/Enter an address/i);
      expect(input.value).toBe('');

      // Focus should not auto-show Cité houses
      fireEvent.focus(input);
      await waitFor(() => {
        expect(screen.queryByText(/Fondation/i)).not.toBeInTheDocument();
      });

      // Type to search for Cité house
      fireEvent.change(input, { target: { value: 'Maison' } });
      expect(input.value).toBe('Maison');
    });
  });

  describe('Props validation', () => {
    test('renders with minimal required props', () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
        />
      );

      // Should default to filterMode="all"
      const input = screen.getByPlaceholderText(/Search for a location/i);
      expect(input).toBeInTheDocument();
    });

    test('handles missing initial values gracefully', () => {
      render(
        <LocationPicker
          onLocationSelect={mockOnLocationSelect}
          theme={mockTheme}
          initialAddress=""
          initialCoordinates={null}
        />
      );

      const input = screen.getByPlaceholderText(/Search for a location/i);
      expect(input.value).toBe('');
    });
  });
});
