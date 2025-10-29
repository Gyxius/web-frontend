# OpenStreetMap Integration Guide

## ✅ Setup Complete!

The LocationPicker component now uses **OpenStreetMap** with **Leaflet.js** - completely free with no API keys needed!

### What's Already Done:

1. ✅ Leaflet.js added to `index.html`
2. ✅ `LocationPicker.js` component created with OpenStreetMap
3. ✅ Nominatim API for geocoding (free, no limits)
4. ✅ Autocomplete suggestions as you type
5. ✅ Interactive map with markers

### No API Key Needed!

Unlike Google Maps, OpenStreetMap is 100% free and requires no registration or API keys.

## How to Use LocationPicker

The `LocationPicker` component is ready to use in `/web-frontend/src/LocationPicker.js`.

### Usage Example in Event Creation:

```javascript
import LocationPicker from "./LocationPicker";

// In your component state:
const [eventLocation, setEventLocation] = useState({
  address: "",
  name: "",
  lat: null,
  lng: null,
});

// In your JSX (replace the location dropdown):
<LocationPicker
  onLocationSelect={(location) => {
    setEventLocation(location);
    console.log("Selected location:", location);
  }}
  initialAddress={eventLocation.address}
  theme={theme}
/>
```

#### Usage in SocialChat.js Edit Form:

Replace the location dropdown in the edit modal with:

```javascript
import LocationPicker from "./LocationPicker";

// In the edit form:
<div style={{ marginBottom: 16 }}>
  <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
    Location
  </label>
  <LocationPicker
    onLocationSelect={(location) => {
      setEditedEvent({
        ...editedEvent,
        place: location.name,
        address: location.address,
        coordinates: { lat: location.lat, lng: location.lng }
      });
    }}
    initialAddress={editedEvent.address || ""}
    theme={theme}
  />
</div>
```

## Features

✅ **Autocomplete**: As user types, see location suggestions from OpenStreetMap  
✅ **Map Display**: Interactive map showing selected location  
✅ **Marker**: Places a pin at the exact location  
✅ **Address Details**: Returns formatted address, name, and GPS coordinates  
✅ **France-focused**: Searches prioritize French locations  
✅ **Debounced Search**: Waits 500ms after typing to reduce API calls
✅ **100% Free**: No costs, no limits, no API keys required

## Technologies Used

- **Leaflet.js**: Open-source JavaScript library for interactive maps
- **OpenStreetMap**: Free, community-driven map data
- **Nominatim API**: Free geocoding and address search service

## Advantages Over Google Maps

✅ **Completely Free**: No credit card required, unlimited usage  
✅ **No API Key Setup**: Works immediately  
✅ **Open Source**: Community-maintained, transparent  
✅ **Privacy-Friendly**: No tracking, no Google account needed  
✅ **No Quotas**: Unlimited searches and map loads

## Event Data Structure Update

Your event object should now include:

```javascript
{
  name: "Event Name",
  location: "cite" | "paris", // Keep for filtering
  place: "Fleurus Bar",        // NEW: Venue name
  address: "21 Bd Jourdan...", // NEW: Full address
  coordinates: {               // NEW: For map display
    lat: 48.8214,
    lng: 2.3382
  },
  // ... other fields
}
```

## Next Steps

1. Get your Google Maps API key
2. Replace `YOUR_API_KEY` in index.html
3. Import and use `LocationPicker` in your event forms
4. Update event data structure to store address and coordinates
5. Display maps on event detail pages
