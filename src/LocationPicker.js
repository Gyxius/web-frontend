import React, { useEffect, useRef, useState } from "react";

function LocationPicker({ onLocationSelect, initialAddress = "", theme }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Search for locations using Nominatim (OpenStreetMap's geocoding service)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using Nominatim API for geocoding (100% free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=fr` // Restrict to France
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching location:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500); // Wait 500ms after user stops typing
  };

  // Initialize or update map
  const initMap = (lat, lng) => {
    if (!window.L || !mapRef.current) return;

    if (map) {
      // Update existing map
      map.setView([lat, lng], 15);
      
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        const newMarker = window.L.marker([lat, lng]).addTo(map);
        setMarker(newMarker);
      }
    } else {
      // Create new map
      const newMap = window.L.map(mapRef.current).setView([lat, lng], 15);
      
      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(newMap);

      // Add marker
      const newMarker = window.L.marker([lat, lng]).addTo(newMap);
      
      setMap(newMap);
      setMarker(newMarker);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const displayName = suggestion.display_name;
    const name = suggestion.name || suggestion.address?.amenity || suggestion.address?.name || displayName.split(',')[0];

    setAddress(displayName);
    setCoordinates({ lat, lng });
    setShowSuggestions(false);
    setSuggestions([]);

    // Initialize or update map
    initMap(lat, lng);

    // Callback with location data
    if (onLocationSelect) {
      onLocationSelect({
        address: displayName,
        name: name,
        lat,
        lng,
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (map) {
        map.remove();
      }
    };
  }, [map]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Search for a location (e.g., Fleurus Bar, Cité Universitaire)"
        value={address}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: `2px solid ${theme?.border || "#EEF2F7"}`,
          fontSize: 16,
          boxSizing: "border-box",
          marginBottom: showSuggestions ? 0 : 12,
        }}
      />

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: `2px solid ${theme?.border || "#EEF2F7"}`,
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            marginBottom: 12,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              onClick={() => selectSuggestion(suggestion)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: index < suggestions.length - 1 ? `1px solid ${theme?.border || "#EEF2F7"}` : "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme?.bg || "#F7F7F5"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: theme?.text || "#1F2937", marginBottom: 4 }}>
                📍 {suggestion.name || suggestion.display_name.split(',')[0]}
              </div>
              <div style={{ fontSize: 12, color: theme?.textMuted || "#6B7280" }}>
                {suggestion.display_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSearching && (
        <div style={{ 
          fontSize: 12, 
          color: theme?.textMuted || "#6B7280", 
          marginBottom: 12,
          fontStyle: "italic"
        }}>
          Searching...
        </div>
      )}
      
      {/* Map Display */}
      {coordinates && (
        <>
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              border: `2px solid ${theme?.border || "#EEF2F7"}`,
              marginBottom: 8,
            }}
          />
          <p style={{ 
            fontSize: 12, 
            color: theme?.textMuted || "#6B7280", 
            marginTop: 8 
          }}>
            📍 {address}
          </p>
        </>
      )}
    </div>
  );
}

export default LocationPicker;
