import React from 'react';
import type { Comparison } from '../types';

export interface ComparisonTableProps {
  comparison: Comparison;
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  return (
    <table className="compare-table">
      <thead>
        <tr>
          <th scope="col" className="compare-table__feature-header">Feature</th>
          {comparison.entities.map((e) => (
            <th key={e.id} scope="col" className="compare-table__entity-header">
              <span className="compare-table__entity-name">{e.shortName ?? e.name}</span>
              {e.shortName && <span className="compare-table__entity-full">{e.name}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {comparison.features.map((f) => (
          <tr key={f.id} className={f.isDistinguisher ? 'compare-distinguisher' : ''}>
            <th scope="row" className="compare-table__feature">
              {f.isDistinguisher && <span aria-label="Pathognomonic distinguisher">{'\u2605'}</span>}
              {f.name}
            </th>
            {comparison.entities.map((e) => (
              <td key={e.id}>{f.values[e.id] ?? '\u2014'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
