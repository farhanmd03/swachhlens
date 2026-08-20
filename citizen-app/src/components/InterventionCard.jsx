import React from 'react';
import { TEAM_TYPE_LABELS } from '../config/constants.js';
import { Bot, AlertTriangle, Users, Clock, Truck } from 'lucide-react';

/**
 * Displays the AI-recommended intervention in a card.
 * Clearly marks advice as AI Recommendation (not final municipal decision).
 */
export default function InterventionCard({ recommendation, compact = false }) {
  if (!recommendation) {
    return (
      <div className="intervention-card intervention-unavailable">
        <p>Intervention recommendation unavailable.</p>
      </div>
    );
  }

  const {
    recommendedAction,
    teamType,
    vehicle,
    workerCount,
    estimatedCleanupTime,
    reasoning,
    urgent,
  } = recommendation;

  return (
    <div className={`intervention-card ${urgent ? 'intervention-urgent' : ''}`}>
      <div className="intervention-card-header">
        <div className="rec-ai-tag">
          <Bot size={14} />
          <span>AI Advisory Recommendation</span>
        </div>
        {urgent && (
          <span className="urgent-badge-pill">
            <AlertTriangle size={12} />
            <span>Critical Action</span>
          </span>
        )}
      </div>

      <p className="intervention-action-text">{recommendedAction}</p>

      <div className="intervention-specs-grid">
        <div className="spec-box">
          <div className="spec-box-top">
            <Users size={13} className="spec-icon" />
            <span className="spec-label">Suggested Team</span>
          </div>
          <strong className="spec-value">
            {TEAM_TYPE_LABELS[teamType] || teamType}
          </strong>
        </div>

        <div className="spec-box">
          <div className="spec-box-top">
            <Truck size={13} className="spec-icon" />
            <span className="spec-label">Vehicle Type</span>
          </div>
          <strong className="spec-value">{vehicle}</strong>
        </div>

        <div className="spec-box">
          <div className="spec-box-top">
            <Users size={13} className="spec-icon" />
            <span className="spec-label">Crew Size</span>
          </div>
          <strong className="spec-value">{workerCount} Worker{workerCount !== 1 ? 's' : ''}</strong>
        </div>

        <div className="spec-box">
          <div className="spec-box-top">
            <Clock size={13} className="spec-icon" />
            <span className="spec-label">Est. Cleanup</span>
          </div>
          <strong className="spec-value">{estimatedCleanupTime}</strong>
        </div>
      </div>

      {!compact && reasoning && (
        <div className="intervention-reasoning-box">
          <strong>Decision Logic:</strong> {reasoning}
        </div>
      )}
    </div>
  );
}
