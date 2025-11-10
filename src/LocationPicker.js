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

function LocationPicker({ onLocationSelect, initialAddress = "", theme, filterMode = "all" }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Load all Cité houses when filterMode is "cite" and field is empty
  const loadAllCiteHouses = async () => {
    if (filterMode !== "cite") return;
    
    setIsSearching(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      
      // Fetch multiple Cité houses in parallel to build initial list
      const housesToFetch = [
        "Maison du Mexique, Cité Universitaire",
        "Fondation des États-Unis, Cité Universitaire",
        "Maison du Brésil, Cité Universitaire",
        "Maison de l'Argentine, Cité Universitaire",
        "Maison du Japon, Cité Universitaire",
        "Collège d'Espagne, Cité Universitaire",
        "Maison Heinrich Heine, Cité Universitaire",
        "Maison de la Grèce, Cité Universitaire",
      ];
      
      const results = await Promise.all(
        housesToFetch.map(house =>
          fetch(`${API_URL}/api/geocode?q=${encodeURIComponent(house)}&limit=1&countrycodes=fr`)
            .then(r => r.json())
            .catch(() => [])
        )
      );
      
      // Flatten and deduplicate results
      const allResults = results.flat().filter(r => r && r.place_id);
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.place_id, item])).values()
      );
      
      setSuggestions(uniqueResults);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error loading Cité houses:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for locations using Nominatim (OpenStreetMap's geocoding service)
  const searchLocation = async (query) => {
    // For cite mode with empty query, show all houses
    if (filterMode === "cite" && (!query || query.length === 0)) {
      await loadAllCiteHouses();
      return;
    }
    
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using backend proxy to avoid CORS issues
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      
      // For cite mode, add "Cité Universitaire" to improve results
      const searchQuery = filterMode === "cite" 
        ? `${query}, Cité Universitaire, Paris`
        : query;
      
      const response = await fetch(
        `${API_URL}/api/geocode?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `limit=20&` + // Request more results for better filtering
        `countrycodes=fr` // Restrict to France
      );
      const data = await response.json();
      
      // Filter results based on filterMode
      let filteredData = data;
      if (filterMode === "cite") {
        // Only show addresses that match Cité house names
        filteredData = data.filter(suggestion => {
          const displayName = suggestion.display_name || "";
          const name = suggestion.name || "";
          
          // Check if any Cité house name appears in the result
          return CITE_HOUSES.some(house => 
            displayName.toLowerCase().includes(house.toLowerCase()) ||
            name.toLowerCase().includes(house.toLowerCase())
          );
        });
        
        // Sort by relevance - exact name matches first
        filteredData.sort((a, b) => {
          const aName = (a.name || "").toLowerCase();
          const bName = (b.name || "").toLowerCase();
          const queryLower = query.toLowerCase();
          
          const aExact = aName.startsWith(queryLower) ? 0 : 1;
          const bExact = bName.startsWith(queryLower) ? 0 : 1;
          
          return aExact - bExact;
        });
      }
      
      setSuggestions(filteredData.slice(0, 8)); // Show more results for cite mode
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
