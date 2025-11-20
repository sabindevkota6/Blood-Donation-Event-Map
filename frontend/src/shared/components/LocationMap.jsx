/*
 * LocationMap component
 * Integrates Leaflet map UI with geosearch and geocoding utilities.
 */
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import './LocationMap.css';
import L from 'leaflet';

// Configure Leaflet default marker images (fix for webpack/static assets)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Reverse geocoding helper - calls Nominatim to get human-readable address
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || 'Location selected';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Location selected';
  }
};

/* Utility helpers: clampValue, toRadians, computeDistanceKm, formatDistanceLabel */
const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const toRadians = (value) => (value * Math.PI) / 180;

const computeDistanceKm = (lat1, lng1, lat2, lng2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const startLatRad = toRadians(lat1);
  const endLatRad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startLatRad) * Math.cos(endLatRad) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

const formatDistanceLabel = (distanceKm) => {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) {
    return '';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km`;
};

// Build a short context (city/area) from a geosearch result
const buildContextFromResult = (result) => {
  const address = result?.raw?.address;
  if (!address) {
    return '';
  }

  const candidates = [
    address.neighbourhood,
    address.suburb,
    address.village,
    address.town,
    address.city,
    address.municipality,
    address.state_district,
    address.state,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && !result.label.toLowerCase().includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return candidates[0] || '';
};

// Button component to trigger geolocation and center the map
function LocationButton({
  onLocationSelect,
  onPendingLocation,
  onLocateStart,
  onLocateComplete,
  currentPosition,
}) {
  const map = useMap();

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please select your location manually on the map.');
      return;
    }

    if (onLocateStart) {
      onLocateStart();
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        let coordsChanged = true;

        try {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };

          if (
            currentPosition &&
            Math.abs(currentPosition.lat - latitude) < 1e-5 &&
            Math.abs(currentPosition.lng - longitude) < 1e-5
          ) {
            coordsChanged = false;
          }

          if (coordsChanged) {
            const currentCenter = map.getCenter();
            if (
              Math.abs(currentCenter.lat - latitude) > 1e-6 ||
              Math.abs(currentCenter.lng - longitude) > 1e-6
            ) {
              map.setView([latitude, longitude], 15, { animate: true });
            }
            if (onPendingLocation) {
              onPendingLocation(coords);
            }
          }

          const address = await reverseGeocode(latitude, longitude);
          if (coordsChanged) {
            onLocationSelect(coords, address);
          } else {
            onLocationSelect(currentPosition, address);
          }
        } finally {
          if (!coordsChanged && onPendingLocation) {
            onPendingLocation(null);
          }
          if (onLocateComplete) {
            onLocateComplete();
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);

        if (onPendingLocation) {
          onPendingLocation(null);
        }

        if (onLocateComplete) {
          onLocateComplete();
        }

        let errorMessage = 'Unable to get your location. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please select your location manually on the map.';
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <button
      type="button"
      className="current-location-btn"
      onClick={handleLocationClick}
      title="Go to my location"
    >
      📍 My Location
    </button>
  );
}

// Component for map marker and events
function LocationMarker({ position, onLocationSelect, onMapMove, shouldMoveMap }) {
  const map = useMap();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng }, address);
    },
    moveend() {
      // Update map bounds when user moves/zooms the map
      if (onMapMove && map) {
        const bounds = map.getBounds();
        onMapMove({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      }
    }
  });

  // Move map only when explicitly requested (e.g., from search results)
  React.useEffect(() => {
    if (shouldMoveMap && position && map) {
      map.flyTo([position.lat, position.lng], 15);
    }
  }, [shouldMoveMap, position, map]);

  return position === null ? null : <Marker position={[position.lat, position.lng]}></Marker>;
}

/**
 * Reusable Location Map Component
 * 
 * @param {Object} position - Current marker position { lat, lng }
 * @param {Function} onLocationChange - Callback when location changes (position, address)
 * @param {Object} center - Initial map center [lat, lng]
 * @param {number} zoom - Initial zoom level
 * @param {boolean} showSearch - Whether to show search bar
 * @param {string} searchPlaceholder - Placeholder text for search
 * @param {boolean} showCurrentLocation - Whether to show "My Location" button
 * @param {string|string[]|undefined} countryCodes - Optional country code filter (Nominatim format)
 * @param {number} suggestionLimit - Maximum number of suggestions to display
 */
function LocationMap({ 
  position, 
  onLocationChange,
  center = [27.7172, 85.324], // Default: Kathmandu
  zoom = 13,
  showSearch = true,
  searchPlaceholder = "Search for a location...",
  showCurrentLocation = true,
  className = "",
  countryCodes = 'np',
  suggestionLimit = 8
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapBounds, setMapBounds] = useState(null);
  const [shouldMoveMap, setShouldMoveMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const providerRef = useRef(new OpenStreetMapProvider());
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  const normalizeBounds = useCallback((bounds) => {
    if (!bounds) {
      return null;
    }

    if (typeof bounds.getNorth === 'function') {
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
    }

    return bounds;
  }, []);

  const formatViewbox = useCallback((bounds, padding = 0) => {
    if (!bounds) {
      return null;
    }

    const west = clampValue(bounds.west - padding, -180, 180);
    const north = clampValue(bounds.north + padding, -90, 90);
    const east = clampValue(bounds.east + padding, -180, 180);
    const south = clampValue(bounds.south - padding, -90, 90);

    return `${west},${north},${east},${south}`;
  }, []);

  const getReferencePoint = useCallback(() => {
    if (position) {
      return { lat: position.lat, lng: position.lng };
    }

    if (mapRef.current) {
      const centerPoint = mapRef.current.getCenter();
      return { lat: centerPoint.lat, lng: centerPoint.lng };
    }

    return { lat: center[0], lng: center[1] };
  }, [position, center]);

  const handleLocationSelect = useCallback((nextPosition, address) => {
    if (onLocationChange) {
      onLocationChange(nextPosition, address);
    }

    if (
      pendingPosition &&
      nextPosition &&
      Math.abs(pendingPosition.lat - nextPosition.lat) < 1e-6 &&
      Math.abs(pendingPosition.lng - nextPosition.lng) < 1e-6
    ) {
      setPendingPosition(null);
    }

    setIsLocating(false);
  }, [onLocationChange, pendingPosition]);

  const handleMapMove = useCallback((bounds) => {
    const normalized = normalizeBounds(bounds);
    if (normalized) {
      setMapBounds(normalized);
    }
  }, [normalizeBounds]);

  const handleLocateStart = useCallback(() => {
    setIsLocating(true);
    setSearchError('');
  }, []);

  const handlePendingLocation = useCallback((coords) => {
    setPendingPosition(coords);
  }, []);

  const handleLocateComplete = useCallback(() => {
    setIsLocating(false);
  }, []);

  const performSearch = useCallback(async (query) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    setIsSearching(true);

    try {
      const currentBounds = mapBounds || normalizeBounds(mapRef.current?.getBounds());
      const referencePoint = getReferencePoint();

      const resolvedCountryCodes = Array.isArray(countryCodes)
        ? countryCodes.join(',')
        : countryCodes;

      const baseParams = {
        limit: 25,
        addressdetails: 1,
      };

      const primaryViewbox = currentBounds
        ? formatViewbox(currentBounds)
        : formatViewbox({
            north: referencePoint.lat + 0.25,
            south: referencePoint.lat - 0.25,
            east: referencePoint.lng + 0.25,
            west: referencePoint.lng - 0.25,
          });

      if (primaryViewbox) {
        baseParams.viewbox = primaryViewbox;
        baseParams.bounded = currentBounds ? 1 : 0;
      }

      if (resolvedCountryCodes) {
        baseParams.countrycodes = resolvedCountryCodes;
      }

      let results = await providerRef.current.search({
        query: trimmedQuery,
        params: baseParams,
      });

      if ((!results || results.length === 0) && currentBounds) {
        const expandedViewbox = formatViewbox({ ...currentBounds }, 0.4);
        const fallbackParams = {
          query: trimmedQuery,
          params: {
            limit: 30,
            addressdetails: 1,
            viewbox: expandedViewbox,
            bounded: 0,
          },
        };

        if (resolvedCountryCodes) {
          fallbackParams.params.countrycodes = resolvedCountryCodes;
        }

        results = await providerRef.current.search(fallbackParams);
      }

      if (results && results.length > 0) {
        const enrichedResults = results
          .map((result) => {
            const distanceKm = computeDistanceKm(
              referencePoint.lat,
              referencePoint.lng,
              result.y,
              result.x
            );

            return {
              ...result,
              distanceKm,
              distanceLabel: formatDistanceLabel(distanceKm),
              context: buildContextFromResult(result),
            };
          })
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, suggestionLimit);

        setSearchResults(enrichedResults);
        setShowResults(enrichedResults.length > 0);
        setSearchError(''); // Clear any previous error when results are found

        if (enrichedResults.length === 0) {
          setSearchError('No nearby matches. Try zooming out or refining your search.');
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
        setSearchError('No matches found. Try zooming out or refining your search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
      setSearchError('Unable to search right now. Check your internet connection and try again.');
    } finally {
      setIsSearching(false);
    }
  }, [mapBounds, normalizeBounds, formatViewbox, getReferencePoint, countryCodes, suggestionLimit]);

  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    setSearchError(''); // Clear error immediately when user starts typing a valid query

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  }, [performSearch]);

  const handleSelectResult = useCallback((result) => {
    const newPosition = { lat: result.y, lng: result.x };
    handleLocationSelect(newPosition, result.label);
    setShouldMoveMap(true);
    setTimeout(() => setShouldMoveMap(false), 120);
    setSearchQuery(result.label || '');
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(false);
    setSearchError('');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, [handleLocationSelect]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingPosition) {
      return;
    }

    if (
      position &&
      Math.abs(position.lat - pendingPosition.lat) < 1e-6 &&
      Math.abs(position.lng - pendingPosition.lng) < 1e-6
    ) {
      setPendingPosition(null);
    }
  }, [position, pendingPosition]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchError('');
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && !mapBounds) {
      const bounds = mapRef.current.getBounds();
      handleMapMove(bounds);
    }
  }, [mapBounds, handleMapMove]);

  const resolvedPosition = pendingPosition || position;

  return (
    <div className={`location-map-container ${className}`}>
      {/* Search box */}
      {showSearch && (
        <div className="map-search-container" ref={searchContainerRef}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowResults(false), 120);
            }}
            className="map-search-input"
          />

          {isSearching && (
            <div className="map-search-loading">
              <span className="loading-spinner" />
              Searching nearby places...
            </div>
          )}

          {!isSearching && searchError && (
            <div className="map-search-message error">
              {searchError}
            </div>
          )}

          {!isSearching && showResults && searchResults.length > 0 && (
            <div className="map-search-results">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="map-search-result-item"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="result-info">
                    <div className="result-label">📍 {result.label}</div>
                    {result.context && (
                      <div className="result-context">{result.context}</div>
                    )}
                  </div>
                  {result.distanceLabel && (
                    <div className="result-distance">{result.distanceLabel} away</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="map-wrapper">
        {isLocating && (
          <div className="map-locate-overlay">
            <div className="map-locate-content">
              <span className="loading-spinner" />
              Locating you...
            </div>
          </div>
        )}
        <MapContainer
          center={resolvedPosition ? [resolvedPosition.lat, resolvedPosition.lng] : center}
          zoom={zoom}
          className="leaflet-map"
          scrollWheelZoom={true}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
            const initialBounds = mapInstance.getBounds();
            handleMapMove(initialBounds);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker
            position={resolvedPosition}
            onLocationSelect={handleLocationSelect}
            onMapMove={handleMapMove}
            shouldMoveMap={shouldMoveMap}
          />
          {showCurrentLocation && (
            <LocationButton
              onLocationSelect={handleLocationSelect}
              onPendingLocation={handlePendingLocation}
              onLocateStart={handleLocateStart}
              onLocateComplete={handleLocateComplete}
              currentPosition={resolvedPosition}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default LocationMap;
