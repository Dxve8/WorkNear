import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiCrosshair, FiLoader, FiCheckCircle } from 'react-icons/fi';

/**
 * LocationPicker
 * -------------------------------------------------------------------------
 * Captures a real GeoJSON point for a user/business/job — fully free:
 *   1. "Use my current location" -> navigator.geolocation (browser GPS/wifi,
 *      no API key, no billing account, built into every modern browser).
 *   2. Manual address/locality/city fields + "Find on map" -> geocodes the
 *      typed address via OpenStreetMap's free Nominatim API (no key needed,
 *      subject to a light 1 req/sec fair-use policy — fine for this use case).
 *
 * Parent owns the form state; this component just reports back a location
 * object shaped exactly like the Mongoose schema:
 *   { type: 'Point', coordinates: [lng, lat], address, locality, city }
 * -------------------------------------------------------------------------
 */
const LocationPicker = ({ value, onChange }) => {
  const [detecting, setDetecting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [resolved, setResolved] = useState(
    Array.isArray(value?.coordinates) &&
      (value.coordinates[0] !== 0 || value.coordinates[1] !== 0)
  );

  const set = (patch) => onChange({ ...value, ...patch });

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Your browser does not support location detection');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode so the address fields aren't left blank (free, no key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: 'application/json' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          set({
            type: 'Point',
            coordinates: [longitude, latitude],
            address: data.display_name || value?.address || '',
            locality: addr.suburb || addr.neighbourhood || addr.village || value?.locality || '',
            city: addr.city || addr.town || addr.county || value?.city || '',
          });
        } catch {
          // Reverse geocoding is a nice-to-have; still keep the real coordinates
          set({ type: 'Point', coordinates: [longitude, latitude] });
        }
        setResolved(true);
        setDetecting(false);
        toast.success('Location detected');
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied — enter your address below instead');
        } else {
          toast.error('Could not detect location — enter your address below instead');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const findOnMap = async () => {
    const query = [value?.address, value?.locality, value?.city].filter(Boolean).join(', ');
    if (!query.trim()) {
      toast.error('Type an address, locality or city first');
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } }
      );
      const results = await res.json();
      if (!results.length) {
        toast.error('Could not find that location — try a more specific address');
        setGeocoding(false);
        return;
      }
      const { lat, lon } = results[0];
      set({ type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] });
      setResolved(true);
      toast.success('Location pinned');
    } catch {
      toast.error('Lookup failed — check your connection and try again');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="wn-location-picker">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={detecting}
        className="btn btn-outline-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
      >
        {detecting ? <FiLoader className="wn-spin" /> : <FiCrosshair />}
        {detecting ? 'Detecting your location...' : 'Use my current location'}
      </button>

      <div className="d-flex align-items-center gap-2 mb-3" style={{ color: 'var(--wn-text-muted)', fontSize: '0.8rem' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--wn-border)' }} />
        or enter manually
        <div style={{ flex: 1, height: 1, background: 'var(--wn-border)' }} />
      </div>

      <div className="row g-2 mb-2">
        <div className="col-12">
          <input
            type="text"
            className="form-control"
            placeholder="Street / area address"
            value={value?.address || ''}
            onChange={(e) => { setResolved(false); set({ address: e.target.value }); }}
          />
        </div>
        <div className="col-6">
          <input
            type="text"
            className="form-control"
            placeholder="Locality"
            value={value?.locality || ''}
            onChange={(e) => { setResolved(false); set({ locality: e.target.value }); }}
          />
        </div>
        <div className="col-6">
          <input
            type="text"
            className="form-control"
            placeholder="City"
            value={value?.city || ''}
            onChange={(e) => { setResolved(false); set({ city: e.target.value }); }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={findOnMap}
        disabled={geocoding}
        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
      >
        {geocoding ? <FiLoader className="wn-spin" size={14} /> : <FiMapPin size={14} />}
        {geocoding ? 'Looking up...' : 'Find on map'}
      </button>

      {resolved && (
        <div className="d-flex align-items-center gap-2 mt-2" style={{ color: 'var(--wn-success, #18a976)', fontSize: '0.8rem' }}>
          <FiCheckCircle size={14} /> Location set — distance-based matching will work for this profile
        </div>
      )}
      {!resolved && (
        <div className="mt-2" style={{ color: 'var(--wn-text-muted)', fontSize: '0.78rem' }}>
          Without a set location, distance-based matching can't tell how far this is from nearby jobs/workers.
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
