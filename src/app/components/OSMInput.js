// components/OSMSearch.js
import React, { useState } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt } from 'react-icons/fa';

const OSMSearch = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Function to extract the most relevant place name along with the state
  const getPlaceNameWithState = (place) => {
    const { address } = place;
    const placeName =
      address.village ||
      address.hamlet ||
      address.town ||
      address.locality ||
      address.suburb ||
      address.neighbourhood ||
      address.city;
    const stateName = address.state;
    return stateName ? `${placeName}, ${stateName}` : placeName;
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${value}&countrycodes=in&addressdetails=1&extratags=1&limit=20`
        );

        // Filter to prioritize small villages, towns, and localities
        const filteredSuggestions = response.data.filter(
          (place) =>
            place.type === 'village' ||
            place.type === 'hamlet' ||
            place.type === 'locality' ||
            place.type === 'neighbourhood' ||
            place.type === 'town'
        );

        // Sort suggestions to prioritize villages first
        const sortedSuggestions = filteredSuggestions.sort((a, b) => {
          const typesOrder = ['village', 'hamlet', 'locality', 'neighbourhood', 'town'];
          return typesOrder.indexOf(a.type) - typesOrder.indexOf(b.type);
        });

        setSuggestions(sortedSuggestions);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const placeNameWithState = getPlaceNameWithState(suggestion);
    setQuery(placeNameWithState);
    setSuggestions([]);
    onSelectLocation(suggestion);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clinicLocation">
        Clinic Location
      </label>
      <div className="relative">
        <input
          type="text"
          name="clinicLocation"
          id="clinicLocation"
          value={query}
          onChange={handleInputChange}
          placeholder="Enter clinic location"
          className="bg-gray-100 p-2 pl-10 rounded w-full"
        />
        <FaMapMarkerAlt className="absolute top-0 left-0 mt-3 ml-3 text-red-500" />
      </div>
      {suggestions.length > 0 && (
        <ul className="bg-white shadow-lg rounded mt-2 max-h-40 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              {getPlaceNameWithState(suggestion)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OSMSearch;
