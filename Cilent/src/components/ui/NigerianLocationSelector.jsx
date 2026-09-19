import React from 'react';
import STATES_LGA from '../../data/nigeriaStatesLga.json';

const NigerianLocationSelector = ({ value = { state: '', lga: '', address: '' }, onChange }) => {
  const states = Object.keys(STATES_LGA);
  const lgas = value.state && STATES_LGA[value.state] ? STATES_LGA[value.state] : [];

  return (
    <div className="space-y-3">
      {/* State */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
          State *
        </label>
        <select
          value={value.state || ''}
          onChange={(e) => onChange({ ...value, state: e.target.value, lga: '' })}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:border-green-600 focus:outline-none"
        >
          <option value="">— Select State —</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* LGA */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
          Local Government Area (LGA) *
        </label>
        <select
          value={value.lga || ''}
          onChange={(e) => onChange({ ...value, lga: e.target.value })}
          disabled={!value.state}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:border-green-600 focus:outline-none disabled:opacity-50"
        >
          <option value="">— Select LGA —</option>
          {lgas.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Full address */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
          Full Property Address *
        </label>
        <textarea
          value={value.address || ''}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="e.g. 12 Adegboyega Street, behind SQI College"
          rows={2}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-600 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default NigerianLocationSelector;
