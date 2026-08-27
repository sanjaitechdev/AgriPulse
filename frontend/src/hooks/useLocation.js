import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';

export function useLocation() {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [address, setAddress] = useState(null); // { village, district, state, pincode, display_name }
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'detecting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const watchIdRef = useRef(null);

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await api.get(`/location/reverse?lat=${lat}&lng=${lng}`);
      if (res.data?.success && res.data.data) {
        setAddress(res.data.data);
        setStatus('success');
      } else {
        throw new Error('Reverse geocoding returned unsuccessful');
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err.message);
      setAddress({
        village: '',
        district: '',
        state: '',
        pincode: '',
        display_name: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      });
      setStatus('success'); // Still allow coordinates to succeed
    }
    setUpdatedAt(new Date());
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('detecting');
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setAccuracy(position.coords.accuracy);
        await fetchAddress(lat, lng);
      },
      (error) => {
        console.warn('Geolocation acquisition failed:', error.message);
        setStatus('error');
        setErrorMessage(
          error.code === 1
            ? 'Location access denied. Please search manually.'
            : 'Unable to retrieve location. Please check your settings or search manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Watch position for continuous updates (with a threshold to prevent excessive geocoding)
  const lastGeocodedCoords = useRef({ lat: 0, lng: 0 });

  const startWatching = () => {
    if (!navigator.geolocation) return;

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setAccuracy(position.coords.accuracy);

        // Check if shifted by more than ~150 meters to trigger reverse geocode
        const dist = Math.abs(lat - lastGeocodedCoords.current.lat) + Math.abs(lng - lastGeocodedCoords.current.lng);
        if (dist > 0.0015) {
          lastGeocodedCoords.current = { lat, lng };
          await fetchAddress(lat, lng);
        }
      },
      (error) => {
        console.warn('Geolocation watch error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopWatching();
  }, []);

  return {
    coords,
    address,
    accuracy,
    status,
    errorMessage,
    updatedAt,
    detectLocation,
    startWatching,
    stopWatching,
    setCoords,
    setAddress,
    setStatus,
  };
}
export default useLocation;
