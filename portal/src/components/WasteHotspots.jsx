import React from 'react';
import { Flame, AlertTriangle, Clock, MapPin, Layers, ArrowRight } from 'lucide-react';

/**
 * Compact Dashboard component displaying Current Waste Hotspots & Geographic Concentration.
 */
export default function WasteHotspots({ hotspots, onSelectHotspot }) {
  if (!hotspots || hotspots.length === 0) return null;

  const topHotspots = hotspots.slice(0, 4);

  return (
    <div className="waste-hotspots-card">
      <div className="hotspots-header-row">
        <div className="hotspots-title-group">
          <div className="hotspots-icon-circle">
            <Flame size={18} className="text-amber" />
          </div>
          <div>
            <h3 className="hotspots-heading">Current Waste Hotspots</h3>
            <p className="hotspots-subtext">
              Real-time geographic concentration clusters across urban zones
            </p>
          </div>
        </div>
        <span className="hotspot-live-pill">
          <span className="pulse-dot"></span>
          <span>{topHotspots.length} Active Hotspot Zones</span>
        </span>
      </div>

      <div className="hotspots-grid">
        {topHotspots.map((hs, index) => {
          const isHighAlert = hs.urgentCount > 0 || hs.averagePriority >= 70;

          return (
            <div
              key={hs.hotspotId}
              className={`hotspot-item-card ${isHighAlert ? 'hotspot-item-high-alert' : ''}`}
            >
              <div className="hotspot-item-top">
                <div className="hotspot-rank-badge">#{index + 1}</div>
                <h4 className="hotspot-area-name">{hs.areaName}</h4>
                <span className="hotspot-count-pill">
                  {hs.reportCount} report{hs.reportCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="hotspot-metrics-row">
                <div className="hs-metric">
                  <span className="hs-k">Avg Priority</span>
                  <strong className="hs-v">{hs.averagePriority}/100</strong>
                </div>

                <div className="hs-metric">
                  <span className="hs-k">Unresolved</span>
                  <strong className="hs-v text-amber">{hs.unresolvedCount}</strong>
                </div>

                {hs.urgentCount > 0 && (
                  <div className="hs-metric">
                    <span className="hs-k">Urgent</span>
                    <strong className="hs-v text-red">
                      <AlertTriangle size={11} style={{ display: 'inline', marginRight: '2px' }} />
                      {hs.urgentCount}
                    </strong>
                  </div>
                )}
              </div>

              <div className="hotspot-item-footer">
                <span className="hs-dominant-type">
                  <strong>Dominant:</strong> {hs.dominantWasteLabel}
                </span>
                {onSelectHotspot && (
                  <button
                    className="btn btn-secondary btn-small hs-filter-btn"
                    onClick={() => onSelectHotspot(hs)}
                    title="Filter priority queue for this zone"
                  >
                    <span>Filter Zone</span>
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
