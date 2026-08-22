import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { PRIORITY_THRESHOLDS, WASTE_TYPE_LABELS, STATUS_LABELS } from '../config/constants.js';
import { MapPin, Send, ArrowRight, AlertTriangle, Flame } from 'lucide-react';

/**
 * Leaflet map displaying active complaint markers color-coded by priority
 * and subtle geographic concentration hotspot zone overlays.
 */
export default function ComplaintMap({ complaints, hotspots = [], onMarkerClick }) {
  const navigate = useNavigate();

  // Filter complaints with valid GPS
  const validComplaints = complaints.filter(
    (c) => c.gps && c.gps.lat != null && c.gps.lng != null
  );

  const center =
    validComplaints.length > 0
      ? [
          validComplaints.reduce((sum, c) => sum + c.gps.lat, 0) / validComplaints.length,
          validComplaints.reduce((sum, c) => sum + c.gps.lng, 0) / validComplaints.length,
        ]
      : [22.5726, 88.3639]; // Default to Kolkata center

  const getMarkerColor = (score, urgent) => {
    if (urgent) return '#dc2626';
    if (score >= PRIORITY_THRESHOLDS.HIGH) return '#ea580c';
    if (score >= PRIORITY_THRESHOLDS.MEDIUM) return '#d97706';
    return '#059669';
  };

  return (
    <div className="map-wrapper-card">
      <div className="map-header-bar">
        <div className="map-title-info">
          <div className="map-title-row">
            <MapPin size={18} className="map-pin-icon" />
            <h4>Live Incident Geolocation & Concentration Zones</h4>
          </div>
          <span className="map-count-badge">
            {validComplaints.length} active incident{validComplaints.length !== 1 ? 's' : ''} mapped
            {hotspots.length > 0 && ` • ${hotspots.length} hotspot zones`}
          </span>
        </div>

        {/* ── Map Legend ───────────────────────────────────────── */}
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot dot-critical"></span> Critical / Urgent
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-high"></span> High (70+)
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-medium"></span> Medium (40-69)
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-low"></span> Low (&lt;40)
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-hotspot"></span> Hotspot Cluster
          </span>
        </div>
      </div>

      <div className="leaflet-container-holder">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '440px', width: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ── Hotspot Concentration Overlays ────────────────── */}
          {hotspots.map((hs) => (
            <Circle
              key={hs.hotspotId}
              center={[hs.centerLat, hs.centerLng]}
              radius={600}
              pathOptions={{
                color: hs.urgentCount > 0 ? '#dc2626' : '#f59e0b',
                fillColor: hs.urgentCount > 0 ? '#ef4444' : '#fbbf24',
                fillOpacity: 0.12,
                weight: 1.8,
                dashArray: '5, 5',
              }}
            >
              <Popup>
                <div className="hotspot-map-popup">
                  <div className="hotspot-popup-header">
                    <Flame size={14} className="text-amber" />
                    <strong>{hs.areaName}</strong>
                  </div>
                  <p>Concentration: <strong>{hs.reportCount} reports</strong></p>
                  <p>Unresolved: <strong>{hs.unresolvedCount}</strong></p>
                  <p>Dominant: <strong>{hs.dominantWasteLabel}</strong></p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* ── Active Incident Markers ───────────────────────── */}
          {validComplaints.map((complaint) => {
            const isUrgent = !!complaint.urgentEscalation;
            const color = getMarkerColor(complaint.priorityScore, isUrgent);

            return (
              <CircleMarker
                key={complaint.id}
                center={[complaint.gps.lat, complaint.gps.lng]}
                radius={isUrgent ? 11 : 8}
                fillColor={color}
                color={isUrgent ? '#ffffff' : '#334155'}
                weight={isUrgent ? 3 : 1.5}
                fillOpacity={0.88}
              >
                <Popup>
                  <div className="map-popup-card">
                    <div className="popup-header">
                      <strong>{WASTE_TYPE_LABELS[complaint.aiResult?.wasteType] || 'Waste Issue'}</strong>
                      {isUrgent && (
                        <span className="popup-urgent-pill">
                          <AlertTriangle size={10} />
                          <span>URGENT</span>
                        </span>
                      )}
                    </div>

                    <div className="popup-body">
                      {complaint.complaintNumber && (
                        <p className="popup-id">ID: <code>{complaint.complaintNumber}</code></p>
                      )}
                      <p>Priority Score: <strong>{complaint.priorityScore || 0}/100</strong></p>
                      <p>Status: <strong>{STATUS_LABELS[complaint.status] || complaint.status}</strong></p>
                      {complaint.citizenName && (
                        <p>Reporter: {complaint.citizenName}</p>
                      )}
                    </div>

                    <div className="popup-actions">
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => onMarkerClick?.(complaint)}
                      >
                        <Send size={12} />
                        <span>Dispatch</span>
                      </button>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => navigate(`/complaint/${complaint.id}`)}
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
