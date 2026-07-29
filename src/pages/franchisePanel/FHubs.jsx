import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, Phone, Mail, Building2, Loader2, Map, Pencil, X, Search, Crosshair, ExternalLink, CheckCircle, Save } from 'lucide-react';
import { getFranchiseProfile, updateFranchiseProfile } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FHubs = () => {
  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickedCoords, setPickedCoords] = useState({ lat: '', lng: '' });
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [mapPreviewUrl, setMapPreviewUrl] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { loading: saving, call } = useApi();

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem('userData') || '{}');
    if (cached._id) setHub(cached);

    getFranchiseProfile()
      .then(res => {
        const data = res.data?.data || res.data;
        localStorage.setItem('userData', JSON.stringify(data));
        setHub(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openMapPicker = () => {
    setPickedCoords({ lat: hub?.latitude || '', lng: hub?.longitude || '' });
    setMapSearch('');
    if (hub?.latitude && hub?.longitude) {
      setMapPreviewUrl(`https://maps.google.com/maps?q=${hub.latitude},${hub.longitude}&z=16&output=embed`);
    } else {
      setMapPreviewUrl('');
    }
    setShowMapPicker(true);
  };

  const searchLocation = async () => {
    if (!mapSearch.trim()) return;
    setMapSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setPickedCoords({ lat, lng });
        setMapPreviewUrl(`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`);
      } else {
        alert('Location not found. Try a more specific address.');
      }
    } catch {
      alert('Search failed. Please try again.');
    }
    setMapSearching(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setPickedCoords({ lat, lng });
        setMapPreviewUrl(`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`);
        setGpsLoading(false);
      },
      () => {
        alert('Could not get location. Please allow location access.');
        setGpsLoading(false);
      }
    );
  };

  const confirmLocation = () => {
    if (!pickedCoords.lat || !pickedCoords.lng) return alert('Please set a location first.');
    call(
      () => updateFranchiseProfile({ latitude: pickedCoords.lat, longitude: pickedCoords.lng }),
      res => {
        const updated = res.data?.data || res.data || { ...hub, latitude: pickedCoords.lat, longitude: pickedCoords.lng };
        localStorage.setItem('userData', JSON.stringify(updated));
        setHub(updated);
        setShowMapPicker(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      },
      err => alert(err.message || 'Failed to save location.')
    );
  };

  const openDirections = () => {
    if (hub?.latitude && hub?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${hub.latitude},${hub.longitude}`, '_blank');
    } else {
      const q = encodeURIComponent(`${hub?.store_name} ${hub?.address} ${hub?.city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    }
  };

  const openMapView = () => {
    if (hub?.latitude && hub?.longitude) {
      window.open(`https://www.google.com/maps?q=${hub.latitude},${hub.longitude}`, '_blank');
    } else {
      const q = encodeURIComponent(`${hub?.store_name} ${hub?.city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    }
  };

  const hasCoords = hub?.latitude && hub?.longitude;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #00A3FF 0%, #0082CC 50%, #6366f1 100%)',
        borderRadius: '16px', padding: '2rem', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} />
            </div>
            <div>
              <h1 style={{ color: '#fff', margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>My Hub</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.875rem' }}>
                Manage your hub location for driver navigation
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
              <Building2 size={14} /> {hub?.store_name || 'Your Store'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: hasCoords ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
              <Navigation size={14} /> {hasCoords ? 'GPS Set ✓' : 'GPS Not Set'}
            </div>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '10px' }}>
          <CheckCircle size={16} /> Hub location updated successfully!
        </div>
      )}

      {loading && !hub ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Hub Info Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #00A3FF, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{hub?.store_name}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hub?.city}, {hub?.state}</span>
                </div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                background: hub?.status === 'active' ? '#d1fae5' : '#fef3c7',
                color: hub?.status === 'active' ? '#065f46' : '#92400e',
                textTransform: 'capitalize'
              }}>
                {hub?.status || 'active'}
              </span>
            </div>

            <div style={{ height: '1px', background: 'var(--border-light)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: 30, height: 30, borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={14} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Address</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{hub?.address || 'Not set'}</div>
                </div>
              </div>

              {hub?.mobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={14} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Phone</div>
                    <a href={`tel:${hub.mobile}`} style={{ fontSize: '0.875rem', color: 'var(--text)', textDecoration: 'none' }}>{hub.mobile}</a>
                  </div>
                </div>
              )}

              {hub?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={14} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Email</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text)', wordBreak: 'break-all' }}>{hub.email}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.625rem', marginTop: 'auto' }}>
              <button
                onClick={openDirections}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <Navigation size={15} /> Get Directions
              </button>
              <button
                onClick={openMapView}
                title="View on Map"
                style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}
              >
                <Map size={16} />
              </button>
            </div>
          </div>

          {/* Location Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Hub Location (GPS)</h3>
              <button
                onClick={openMapPicker}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <Pencil size={13} /> {hasCoords ? 'Edit Location' : 'Set Location'}
              </button>
            </div>

            <div style={{ height: '1px', background: 'var(--border-light)' }} />

            {hasCoords ? (
              <>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-light)', height: '180px' }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${hub.latitude},${hub.longitude}&z=15&output=embed`}
                    width="100%" height="180"
                    style={{ border: 'none', display: 'block' }}
                    loading="lazy"
                    title="Hub Location"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {Number(hub.latitude).toFixed(6)}, {Number(hub.longitude).toFixed(6)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${hub.latitude},${hub.longitude}`}
                    target="_blank" rel="noreferrer"
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} /> Open
                  </a>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', background: 'var(--background)', borderRadius: '10px', border: '2px dashed var(--border)', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={24} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>No location set</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Set your hub GPS coordinates so drivers can navigate directly to you
                  </p>
                </div>
                <button
                  onClick={openMapPicker}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <MapPin size={14} /> Set Location Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && createPortal(
        <div className="modal-overlay" onClick={() => setShowMapPicker(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', width: '95vw' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Set Hub Location</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search address or use GPS</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowMapPicker(false)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Search */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search address, landmark, city..."
                    value={mapSearch}
                    onChange={e => setMapSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchLocation()}
                    style={{ width: '100%', padding: '0.6rem 0.875rem 0.6rem 2.25rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}
                  />
                </div>
                <button
                  type="button" onClick={searchLocation} disabled={mapSearching}
                  style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {mapSearching ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
                  Search
                </button>
              </div>

              {/* GPS */}
              <button
                type="button" onClick={useMyLocation} disabled={gpsLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.65rem', background: '#eff6ff', color: 'var(--primary)', border: '1.5px dashed var(--primary)', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {gpsLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Crosshair size={16} />}
                {gpsLoading ? 'Getting your location...' : 'Use My Current Location (GPS)'}
              </button>

              {/* Manual coords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Latitude</label>
                  <input
                    type="number" step="any" placeholder="e.g. 26.8467"
                    value={pickedCoords.lat}
                    onChange={e => {
                      const lat = e.target.value;
                      setPickedCoords(p => ({ ...p, lat }));
                      if (lat && pickedCoords.lng) setMapPreviewUrl(`https://maps.google.com/maps?q=${lat},${pickedCoords.lng}&z=16&output=embed`);
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Longitude</label>
                  <input
                    type="number" step="any" placeholder="e.g. 80.9462"
                    value={pickedCoords.lng}
                    onChange={e => {
                      const lng = e.target.value;
                      setPickedCoords(p => ({ ...p, lng }));
                      if (pickedCoords.lat && lng) setMapPreviewUrl(`https://maps.google.com/maps?q=${pickedCoords.lat},${lng}&z=16&output=embed`);
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Map preview */}
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                {mapPreviewUrl ? (
                  <iframe
                    src={mapPreviewUrl}
                    width="100%" height="200"
                    style={{ border: 'none', display: 'block' }}
                    loading="lazy"
                    title="Map Preview"
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    <MapPin size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Search an address or enter coordinates to preview</p>
                  </div>
                )}
              </div>

              {pickedCoords.lat && pickedCoords.lng && (
                <a
                  href={`https://www.google.com/maps?q=${pickedCoords.lat},${pickedCoords.lng}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> Open in Google Maps to verify
                </a>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowMapPicker(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmLocation}
                disabled={saving || !pickedCoords.lat || !pickedCoords.lng}
              >
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={15} /> Save Location</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FHubs;
