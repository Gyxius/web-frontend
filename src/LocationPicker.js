import React, { useEffect, useRef, useState } from "react";

// Cité house addresses (from user profiles)
const CITE_HOUSES = [
  "Fondation Deutsch de la Meurthe",
  "Fondation des États-Unis",
  "Fondation Avicenne",
  "Fondation Biermans-Lapôtre",
  "Fondation Suisse",
  "Pavillon Le Corbusier",
  "Fondation Rosa Abreu de Grancher",
  "Fondation Abreu de Grancher",
  "Résidence André Honnorat",
  "Fondation argentine",
  "Maison de l'Argentine",
  "Maison des étudiants arméniens",
  "Fondation Marie Nubar",
  "Maison des Élèves Ingénieurs Arts et Métiers",
  "Maison Internationale",
  "Maison internationale AgroParisTech",
  "L-OBLIQUE",
  "Fondation Avicenne",
  "Pavillon de l'Iran",
  "Collège d'Espagne",
  "Collège Franco-Britannique",
  "Maison du Brésil",
  "Maison du Cambodge",
  "Maison du Canada",
  "Maison des étudiants canadiens",
  "Maison de la Chine",
  "Maison de Chine",
  "Maison de la Corée",
  "Maison de l'Égypte",
  "Maison d'Égypte",
  "Maison de la Grèce",
  "Fondation hellénique",
  "Maison de l'Inde",
  "Maison de l'Île-de-France",
  "Maison de l'Italie",
  "Maison du Japon",
  "Maison du Liban",
  "Maison du Maroc",
  "Maison du Mexique",
  "Maison de la Norvège",
  "Maison du Portugal",
  "André de Gouveia",
  "Fondation de Monaco",
  "Collège néerlandais",
  "Maison de la Suède",
  "Maison des étudiants suédois",
  "Maison Heinrich Heine",
  "Maison des Provinces de France",
  "Maison des étudiants de la francophonie",
  "Fondation Danoise",
  "Maison des Industries agricoles et alimentaires",
  "Maison de l'Institut national agronomique",
  "Résidence Lucien Paye",
  "Fondation Lucien Paye",
  "Résidence Lila",
  "Résidence Quai de la Loire",
  "Résidence Julie-Victoire Daubié",
  "Résidence Robert Garric",
  "Fondation Victor Lyon",
  "Pavillon Habib Bourguiba",
  "Maison de Tunisie",
  "Maison des étudiants de l'Asie du Sud-Est",
];

// Format address to show only essential parts: venue name, street number, street name, postal code, city
function formatAddress(displayName, addressComponents) {
  try {
    // Split the full address
    const parts = displayName.split(',').map(p => p.trim());
    
    // Get essential components from addressComponents object
    const venue = addressComponents?.amenity || addressComponents?.name || parts[0];
    const houseNumber = addressComponents?.house_number || '';
    const road = addressComponents?.road || '';
    const postcode = addressComponents?.postcode || '';
    const city = addressComponents?.city || addressComponents?.town || addressComponents?.municipality || '';
    
    // Build compact address: "Venue Name, House# Street, Postcode City"
    let formatted = '';
    
    if (venue && venue !== road) {
      formatted += venue;
    }
    
    if (houseNumber && road) {
      formatted += formatted ? ', ' : '';
      formatted += `${houseNumber} ${road}`;
    } else if (road) {
      formatted += formatted ? ', ' : '';
      formatted += road;
    }
    
    if (postcode && city) {
      formatted += formatted ? ', ' : '';
      formatted += `${postcode} ${city}`;
    } else if (city) {
      formatted += formatted ? ', ' : '';
      formatted += city;
    }
    
    // Fallback to first 3 parts if formatting fails
    return formatted || parts.slice(0, 3).join(', ');
  } catch (e) {
    // Fallback: return first 3 parts
    return displayName.split(',').slice(0, 3).join(', ');
  }
}

function LocationPicker({ onLocationSelect, initialAddress = "", initialCoordinates = null, theme, filterMode = "all" }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Initialize map with existing coordinates
  useEffect(() => {
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      initMap(initialCoordinates.lat, initialCoordinates.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all Cité houses when filterMode is "cite" and field is empty
  const loadAllCiteHouses = () => {
    if (filterMode !== "cite") return;
    
    // Create suggestion objects from CITE_HOUSES constant
    // Take first 12 houses as initial suggestions
    const initialHouses = CITE_HOUSES.slice(0, 12).map((house, index) => ({
      place_id: `cite_house_${index}`,
      name: house,
      display_name: `${house}, Cité Universitaire, Paris 14e, France`,
      lat: "48.8205877", // Default Cité Universitaire coordinates
      lon: "2.3390071",
      isCiteHouse: true, // Flag to identify these as pre-defined houses
    }));
    
    setSuggestions(initialHouses);
    setShowSuggestions(true);
  };

  // Search for locations using Nominatim (OpenStreetMap's geocoding service)
  const searchLocation = async (query) => {
    // For cite mode with empty query, show all houses
    if (filterMode === "cite" && (!query || query.length === 0)) {
      loadAllCiteHouses();
      return;
    }
    
    // For cite mode, filter from our CITE_HOUSES list
    if (filterMode === "cite") {
      const queryLower = query.toLowerCase();
      const matchingHouses = CITE_HOUSES
        .filter(house => house.toLowerCase().includes(queryLower))
        .slice(0, 12) // Limit results
        .map((house, index) => ({
          place_id: `cite_house_${index}_${house}`,
          name: house,
          display_name: `${house}, Cité Universitaire, Paris 14e, France`,
          lat: "48.8205877",
          lon: "2.3390071",
          isCiteHouse: true,
        }));
      
      setSuggestions(matchingHouses);
      setShowSuggestions(matchingHouses.length > 0);
      return;
    }
    
    // For non-cite mode (Paris), use geocoding API
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using backend proxy to avoid CORS issues
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      
      const response = await fetch(
        `${API_URL}/api/geocode?` +
        `q=${encodeURIComponent(query)}&` +
        `limit=8&` +
        `countrycodes=fr`
      );
      const data = await response.json();
      
      setSuggestions(data.slice(0, 8));
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
    }, 300); // Shorter delay for better UX
  };
  
  // Handle focus - show all Cité houses if in cite mode and field is empty
  const handleFocus = () => {
    if (filterMode === "cite" && !address) {
      loadAllCiteHouses();
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
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
    
    // Format the address to be concise
    const formattedAddress = formatAddress(displayName, suggestion.address);

    setAddress(formattedAddress);
    setCoordinates({ lat, lng });
    setShowSuggestions(false);
    setSuggestions([]);

    // Initialize or update map
    initMap(lat, lng);

    // Callback with location data
    if (onLocationSelect) {
      onLocationSelect({
        address: formattedAddress,
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
        placeholder={filterMode === "cite" ? "Select a Cité house" : "Search for a location (e.g., Fleurus Bar, Cité Universitaire)"}
        value={address}
        onChange={handleInputChange}
        onFocus={handleFocus}
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
      
      {/* Map Display - Hidden */}
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
              display: "none", // Hide the map canvas
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
