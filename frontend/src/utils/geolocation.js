// Helper to request browser high-accuracy geolocation permission
// and reverse geocode coordinates into precise local address/city

export const getPreciseLocation = async () => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          // High accuracy reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }

          const data = await response.json();
          const addr = data.address || {};

          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.city_district ||
            addr.residential ||
            addr.road ||
            '';

          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state_district ||
            'Mumbai';

          const state = addr.state || '';

          let formattedLocation = '';
          if (locality && city) {
            formattedLocation = `${locality}, ${city}`;
          } else if (city && state) {
            formattedLocation = `${city}, ${state}`;
          } else {
            formattedLocation = city || 'Current Location';
          }

          resolve({
            latitude,
            longitude,
            accuracy,
            locality,
            city,
            state,
            formattedLocation,
            fullAddress: data.display_name || formattedLocation
          });
        } catch (err) {
          // Graceful fallback to coordinates or generic label
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            formattedLocation: 'Current Precise Location'
          });
        }
      },
      (error) => {
        let msg = 'Failed to acquire location.';
        if (error.code === 1) { // PERMISSION_DENIED
          msg = 'Location permission was denied. Please allow location access in your browser settings.';
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          msg = 'Location position is currently unavailable.';
        } else if (error.code === 3) { // TIMEOUT
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000
      }
    );
  });
};
