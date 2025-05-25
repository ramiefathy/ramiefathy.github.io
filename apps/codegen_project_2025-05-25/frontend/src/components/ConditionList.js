import React from 'react';

const ConditionList = ({ conditions, onSelectCondition, selectedConditionId }) => {
  return (
    <div className="condition-list-container">
      <h3 className="condition-list-heading">Identified Conditions</h3>
      {conditions && conditions.length > 0 ? (
        <ul className="condition-list">
          {conditions.map((condition) => (
            // Assuming 'id' field exists on each condition object for unique keying and selection state.
            // This 'id' is crucial for React list performance and UI selection logic,
            // even if the final export schema in Section 5 of the prompt doesn't explicitly list it.
            <li
              key={condition.id}
              className={`condition-list-item ${selectedConditionId === condition.id ? 'selected' : ''}`}
              onClick={() => onSelectCondition(condition)}
            >
              {/* Displaying 'conditionName' as per Section 5 of the prompt's schema */}
              <div className="condition-name">{condition.conditionName}</div>
              {/* Displaying 'icd10Code' as per Section 5 of the prompt's schema. It's a single string. */}
              {condition.icd10Code && (
                <div className="condition-icd10">ICD-10: {condition.icd10Code}</div>
              )}
              {/* Displaying 'overview' (formerly 'summary') as per Section 5 of the prompt's schema */}
              {condition.overview && (
                <div className="condition-overview">
                  {condition.overview.substring(0, 100)}
                  {condition.overview.length > 100 ? '...' : ''}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-conditions-message">No conditions identified yet. Upload a PDF to begin!</p>
      )}
    </div>
  );
};

export default ConditionList;