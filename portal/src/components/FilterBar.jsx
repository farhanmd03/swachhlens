import React from 'react';
import { STATUSES, STATUS_LABELS, WASTE_TYPES, WASTE_TYPE_LABELS } from '../config/constants.js';
import { Search, X, AlertTriangle, Link2 } from 'lucide-react';

export default function FilterBar({ filters, onFilterChange }) {
  return (
    <div className="filter-bar-container">
      <div className="filter-search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Filter by ID (e.g. SWL-26), reporter name, or waste category..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="portal-search-input"
        />
        {filters.search && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => onFilterChange({ ...filters, search: '' })}
            aria-label="Clear search input"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="filter-selects-row">
        <div className="filter-select-group">
          <label htmlFor="statusFilter">Status</label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="filter-select-group">
          <label htmlFor="wasteFilter">Waste Type</label>
          <select
            id="wasteFilter"
            value={filters.wasteType}
            onChange={(e) => onFilterChange({ ...filters, wasteType: e.target.value })}
          >
            <option value="all">All Types</option>
            {WASTE_TYPES.map((w) => (
              <option key={w} value={w}>{WASTE_TYPE_LABELS[w]}</option>
            ))}
          </select>
        </div>

        <div className="filter-checkbox-group">
          <label className="checkbox-label" htmlFor="urgentFilter">
            <input
              id="urgentFilter"
              type="checkbox"
              checked={filters.urgentOnly}
              onChange={(e) => onFilterChange({ ...filters, urgentOnly: e.target.checked })}
            />
            <AlertTriangle size={14} className="text-red" />
            <span>Urgent Only</span>
          </label>

          <label className="checkbox-label" htmlFor="duplicateFilter">
            <input
              id="duplicateFilter"
              type="checkbox"
              checked={filters.duplicateOnly || false}
              onChange={(e) => onFilterChange({ ...filters, duplicateOnly: e.target.checked })}
            />
            <Link2 size={14} className="text-amber" />
            <span>Duplicates Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
