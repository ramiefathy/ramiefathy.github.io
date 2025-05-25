import React, { useState, useEffect, useCallback } from 'react';

const ConditionEditor = ({
  condition,
  onSave,
  onFlagInaccuracy,
  onSuggestAIEdit,
  isSaving = false,
  isLoadingAI = false,
  aiSuggestion = null, // { fieldPath: string, suggestion: string }
  onClearAISuggestion // Callback to clear the suggestion once applied/dismissed
}) => {
  const [editedCondition, setEditedCondition] = useState(condition);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [currentFlagField, setCurrentFlagField] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [currentAIField, setCurrentAIField] = useState('');
  const [aiInstruction, setAIInstruction] = useState('');

  // Update editedCondition when the 'condition' prop changes
  useEffect(() => {
    setEditedCondition(condition);
  }, [condition]);

  // Helper for deep cloning JSON-serializable objects
  const deepClone = useCallback((obj) => {
    return JSON.parse(JSON.stringify(obj));
  }, []);

  // Helper for immutably updating nested fields
  // This function modifies the passed 'obj' (which should already be a clone)
  const updateNestedField = useCallback((obj, path, value) => {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      // Ensure the intermediate path part is an object, create if not
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object' || Array.isArray(current[parts[i]])) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    return obj; // Returns the mutated (cloned) object
  }, []);

  // Helper to get nested field value
  const getNestedFieldValue = useCallback((obj, path) => {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      if (current === null || typeof current !== 'object' || !current.hasOwnProperty(parts[i])) {
        return undefined; // Path not found or intermediate value is not an object
      }
      current = current[parts[i]];
    }
    return current;
  }, []);

  // Generic handler for single-value field changes (string, number, boolean)
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let newCondition = deepClone(editedCondition);

    if (type === 'checkbox') {
      updateNestedField(newCondition, name, checked);
    } else {
      updateNestedField(newCondition, name, value);
    }
    setEditedCondition(newCondition);
  }, [editedCondition, deepClone, updateNestedField]);

  // Handler for changes in arrays of primitive values (e.g., 'alternativeNames')
  const handleArrayChange = useCallback((e, fieldPathWithIndex) => {
    const { value } = e.target;
    let newCondition = deepClone(editedCondition);
    const parts = fieldPathWithIndex.split('.');
    const arrayPath = parts.slice(0, -1).join('.'); // Path to the array itself
    const index = parseInt(parts[parts.length - 1], 10); // Index of the item in the array

    const currentArray = getNestedFieldValue(newCondition, arrayPath);
    if (Array.isArray(currentArray)) {
      currentArray[index] = value; // Mutate the cloned array directly
    }
    setEditedCondition(newCondition);
  }, [editedCondition, deepClone, getNestedFieldValue]);

  // Handler for changes in object properties within arrays of objects (e.g., 'clinicalPresentation.signs[index].morphology')
  const handleObjectArrayChange = useCallback((e, fieldPath, index, subField) => {
    const { value, name } = e.target;
    // For handling pageNumbers, where the value is an array
    const actualValue = (subField === 'pageNumbers' && typeof value === 'string') ? value.split(',').map(Number) : value;

    let newCondition = deepClone(editedCondition);
    const parts = fieldPath.split('.');
    const parentPath = parts.slice(0, -1).join('.'); // Path to the array of objects
    const arrayName = parts[parts.length - 1]; // Name of the array field within the parent object

    const currentArray = getNestedFieldValue(newCondition, parentPath)?.[arrayName]; // Get the array itself
    if (Array.isArray(currentArray)) {
      currentArray[index] = { ...currentArray[index], [subField]: actualValue }; // Immutable update of the object in the array
    }
    setEditedCondition(newCondition);
  }, [editedCondition, deepClone, getNestedFieldValue]);

  // Add an item to an array of primitive values
  const addArrayItem = useCallback((fieldPath, defaultValue = '') => {
    let newCondition = deepClone(editedCondition);
    const parts = fieldPath.split('.');
    const parentPath = parts.slice(0, -1).join('.');
    const arrayName = parts[parts.length - 1];

    let currentArray = getNestedFieldValue(newCondition, parentPath);
    if (!currentArray || !Array.isArray(currentArray[arrayName])) {
      updateNestedField(newCondition, fieldPath, []); // Initialize array if it doesn't exist or is not an array
      currentArray = getNestedFieldValue(newCondition, parentPath); // Re-get reference after initialization
    }
    currentArray[arrayName].push(defaultValue);
    setEditedCondition(newCondition);
  }, [editedCondition, deepClone, updateNestedField, getNestedFieldValue]);

  // Remove an item from an array (primitive or object array)
  const removeArrayItem = useCallback((fieldPath, index) => {
    let newCondition = deepClone(editedCondition);
    const parts = fieldPath.split('.');
    const parentPath = parts.slice(0, -1).join('.');
    const arrayName = parts[parts.length - 1];

    const currentArray = getNestedFieldValue(newCondition, parentPath)?.[arrayName];
    if (Array.isArray(currentArray)) {
      currentArray.splice(index, 1); // Mutate the cloned array directly
    }
    setEditedCondition(newCondition);
  }, [editedCondition, deepClone, getNestedFieldValue]);

  // Add a new object to an array of objects
  const addNestedObjectToArray = useCallback((fieldPath, defaultObject) => {
    let newCondition = deepClone(editedCondition);
    const parts = fieldPath.split('.');
    const parentPath = parts.slice(0, -1).join('.');
    const arrayName = parts[parts.length - 1];

    let currentArray = getNestedFieldValue(newCondition, parentPath);
    if (!currentArray || !Array.isArray(currentArray[arrayName])) {
      updateNestedField(newCondition, fieldPath, []); // Initialize array
      currentArray = getNestedFieldValue(newCondition, parentPath); // Re-get reference
    }
    currentArray[arrayName].push(defaultObject);
    setEditedCondition(newCondition);
  }, [editedCondition, deepClone, updateNestedField, getNestedFieldValue]);

  // Handler for saving the entire condition
  const handleSave = useCallback(() => {
    onSave(editedCondition);
  }, [editedCondition, onSave]);

  // Handler for flagging an inaccuracy
  const handleFlagClick = useCallback((fieldPath) => {
    setCurrentFlagField(fieldPath);
    setFlagReason('');
    setShowFlagModal(true);
  }, []);

  // Submit flag reason
  const submitFlag = useCallback(() => {
    if (currentFlagField && flagReason) {
      onFlagInaccuracy(currentFlagField, flagReason);
      setShowFlagModal(false);
      setFlagReason(''); // Clear reason after submission
    }
  }, [currentFlagField, flagReason, onFlagInaccuracy]);

  // Handler to open AI suggestion modal
  const handleAISuggestionClick = useCallback((fieldPath) => {
    setCurrentAIField(fieldPath);
    setAIInstruction('');
    setShowAIModal(true);
  }, []);

  // Request AI suggestion from parent component
  const requestAISuggestion = useCallback(() => {
    if (currentAIField && aiInstruction) {
      const currentContent = getNestedFieldValue(editedCondition, currentAIField);
      // Pass the current content of the field for context
      onSuggestAIEdit(currentAIField, currentContent, aiInstruction);
    }
  }, [currentAIField, aiInstruction, editedCondition, getNestedFieldValue, onSuggestAIEdit]);

  // Apply AI suggestion to editedCondition state (triggered by user clicking "Apply")
  const applyAISuggestion = useCallback(() => {
    if (aiSuggestion && aiSuggestion.fieldPath === currentAIField && !isLoadingAI) {
      const newCondition = deepClone(editedCondition); // Deep clone the condition
      updateNestedField(newCondition, aiSuggestion.fieldPath, aiSuggestion.suggestion); // Apply suggestion immutably

      setEditedCondition(newCondition);
      setShowAIModal(false); // Close modal
      onClearAISuggestion(); // Clear parent's suggestion state
    }
  }, [aiSuggestion, currentAIField, editedCondition, isLoadingAI, deepClone, updateNestedField, onClearAISuggestion]);

  // Render method for arrays of primitive values
  const renderArrayField = (label, fieldPath, type = 'text') => (
    <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
      <strong>{label}:</strong>
      {(getNestedFieldValue(editedCondition, fieldPath) || []).map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          {type === 'textarea' ? (
            <textarea
              name={`${fieldPath}.${index}`}
              value={item}
              onChange={(e) => handleArrayChange(e, `${fieldPath}.${index}`)}
              style={{ flexGrow: 1, marginRight: '10px', minHeight: '50px' }}
            />
          ) : (
            <input
              type={type}
              name={`${fieldPath}.${index}`}
              value={item}
              onChange={(e) => handleArrayChange(e, `${fieldPath}.${index}`)}
              style={{ flexGrow: 1, marginRight: '10px' }}
            />
          )}
          <button onClick={() => removeArrayItem(fieldPath, index)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Remove</button>
          <button onClick={() => handleFlagClick(`${fieldPath}.${index}`)} style={{ marginLeft: '5px', background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Flag</button>
          <button onClick={() => handleAISuggestionClick(`${fieldPath}.${index}`)} style={{ marginLeft: '5px', background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI</button>
        </div>
      ))}
      <button onClick={() => addArrayItem(fieldPath)} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add {label}</button>
    </div>
  );

  // Render method for single input fields
  const renderInputField = (label, fieldPath, type = 'text') => (
    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
      <label style={{ width: '150px', fontWeight: 'bold' }}>{label}:</label>
      {type === 'textarea' ? (
        <textarea
          name={fieldPath}
          value={getNestedFieldValue(editedCondition, fieldPath) || ''}
          onChange={handleChange}
          style={{ flexGrow: 1, marginRight: '10px', minHeight: '80px' }}
        />
      ) : (
        <input
          type={type}
          name={fieldPath}
          value={getNestedFieldValue(editedCondition, fieldPath) || ''}
          onChange={handleChange}
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
      )}
      <button onClick={() => handleFlagClick(fieldPath)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Flag</button>
      <button onClick={() => handleAISuggestionClick(fieldPath)} style={{ marginLeft: '5px', background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI</button>
    </div>
  );

  if (!editedCondition || Object.keys(editedCondition).length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Select a condition to edit.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px', color: '#333' }}>
        Editing: {editedCondition.conditionName || 'New Condition'}
      </h2>

      {renderInputField('Condition Name', 'conditionName')}
      {renderArrayField('Alternative Names', 'alternativeNames')}
      {renderInputField('ICD-10 Code', 'icd10Code')}
      {renderInputField('Overview', 'overview', 'textarea')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Etiology</h3>
      {renderInputField('Description', 'etiology.description', 'textarea')}
      {renderArrayField('Contributing Factors', 'etiology.contributingFactors')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Clinical Presentation</h3>
      {renderArrayField('Symptoms', 'clinicalPresentation.symptoms')}
      <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
        <strong>Signs:</strong>
        {(getNestedFieldValue(editedCondition, 'clinicalPresentation.signs') || []).map((sign, index) => (
          <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Morphology:</label>
              <input type="text" value={sign.morphology || ''} onChange={(e) => handleObjectArrayChange(e, 'clinicalPresentation.signs', index, 'morphology')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Color:</label>
              <input type="text" value={sign.color || ''} onChange={(e) => handleObjectArrayChange(e, 'clinicalPresentation.signs', index, 'color')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Size:</label>
              <input type="text" value={sign.size || ''} onChange={(e) => handleObjectArrayChange(e, 'clinicalPresentation.signs', index, 'size')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Shape:</label>
              <input type="text" value={sign.shape || ''} onChange={(e) => handleObjectArrayChange(e, 'clinicalPresentation.signs', index, 'shape')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Arrangement:</label>
              <input type="text" value={sign.arrangement || ''} onChange={(e) => handleObjectArrayChange(e, 'clinicalPresentation.signs', index, 'arrangement')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Distribution:</label>
              <input type="text" value={sign.distribution || ''} onChange={(e) => handleObjectArrayChange(e, 'clinicalPresentation.signs', index, 'distribution')} style={{ flexGrow: 1 }} />
            </div>
            <button onClick={() => removeArrayItem('clinicalPresentation.signs', index)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Remove Sign</button>
            <button onClick={() => handleFlagClick(`clinicalPresentation.signs.${index}`)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Flag Sign</button>
            <button onClick={() => handleAISuggestionClick(`clinicalPresentation.signs.${index}`)} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI Sign</button>
          </div>
        ))}
        <button onClick={() => addNestedObjectToArray('clinicalPresentation.signs', { morphology: '', color: '', size: '', shape: '', arrangement: '', distribution: '' })} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Sign</button>
      </div>
      {renderArrayField('Common Sites', 'clinicalPresentation.commonSites')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Diagnostics</h3>
      <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
        <strong>Diagnostic Methods:</strong>
        {(getNestedFieldValue(editedCondition, 'diagnostics.diagnosticMethods') || []).map((method, index) => (
          <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Method Name:</label>
              <input type="text" value={method.methodName || ''} onChange={(e) => handleObjectArrayChange(e, 'diagnostics.diagnosticMethods', index, 'methodName')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Findings:</label>
              <textarea value={method.findings || ''} onChange={(e) => handleObjectArrayChange(e, 'diagnostics.diagnosticMethods', index, 'findings')} style={{ flexGrow: 1, minHeight: '50px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Utility:</label>
              <input type="text" value={method.utility || ''} onChange={(e) => handleObjectArrayChange(e, 'diagnostics.diagnosticMethods', index, 'utility')} style={{ flexGrow: 1 }} />
            </div>
            <button onClick={() => removeArrayItem('diagnostics.diagnosticMethods', index)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Remove Method</button>
            <button onClick={() => handleFlagClick(`diagnostics.diagnosticMethods.${index}`)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Flag Method</button>
            <button onClick={() => handleAISuggestionClick(`diagnostics.diagnosticMethods.${index}`)} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI Method</button>
          </div>
        ))}
        <button onClick={() => addNestedObjectToArray('diagnostics.diagnosticMethods', { methodName: '', findings: '', utility: '' })} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Diagnostic Method</button>
      </div>
      {renderArrayField('Laboratory Tests', 'diagnostics.laboratoryTests')}
      {renderArrayField('Imaging', 'diagnostics.imaging')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Differential Diagnosis</h3>
      <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
        {(getNestedFieldValue(editedCondition, 'differentialDiagnosis') || []).map((ddx, index) => (
          <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Condition Name:</label>
              <input type="text" value={ddx.conditionName || ''} onChange={(e) => handleObjectArrayChange(e, 'differentialDiagnosis', index, 'conditionName')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Distinguishing Features:</label>
              <textarea value={ddx.distinguishingFeatures || ''} onChange={(e) => handleObjectArrayChange(e, 'differentialDiagnosis', index, 'distinguishingFeatures')} style={{ flexGrow: 1, minHeight: '50px' }} />
            </div>
            <button onClick={() => removeArrayItem('differentialDiagnosis', index)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Remove DDx</button>
            <button onClick={() => handleFlagClick(`differentialDiagnosis.${index}`)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Flag DDx</button>
            <button onClick={() => handleAISuggestionClick(`differentialDiagnosis.${index}`)} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI DDx</button>
          </div>
        ))}
        <button onClick={() => addNestedObjectToArray('differentialDiagnosis', { conditionName: '', distinguishingFeatures: '' })} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Differential Diagnosis</button>
      </div>

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Treatment</h3>
      <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
        <strong>Treatment Modalities:</strong>
        {(getNestedFieldValue(editedCondition, 'treatment.treatmentModalities') || []).map((modality, modIndex) => (
          <div key={modIndex} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '120px' }}>Modality Type:</label>
              <input type="text" value={modality.modalityType || ''} onChange={(e) => handleObjectArrayChange(e, 'treatment.treatmentModalities', modIndex, 'modalityType')} style={{ flexGrow: 1 }} />
            </div>
            <h4 style={{ margin: '10px 0', borderBottom: '1px dotted #ccc', paddingBottom: '5px' }}>Specific Treatments for {modality.modalityType || 'this modality'}</h4>
            {(modality.specificTreatments || []).map((treatment, treatIndex) => (
              <div key={treatIndex} style={{ border: '1px dotted #ddd', padding: '10px', marginBottom: '10px', marginLeft: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ width: '100px' }}>Name:</label>
                  <input type="text" value={treatment.name || ''} onChange={(e) => handleObjectArrayChange(e, `treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex, 'name')} style={{ flexGrow: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ width: '100px' }}>Dosage/Admin:</label>
                  <textarea value={treatment.dosageAdministration || ''} onChange={(e) => handleObjectArrayChange(e, `treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex, 'dosageAdministration')} style={{ flexGrow: 1, minHeight: '50px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ width: '100px' }}>Indications:</label>
                  <textarea value={treatment.indications || ''} onChange={(e) => handleObjectArrayChange(e, `treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex, 'indications')} style={{ flexGrow: 1, minHeight: '50px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ width: '100px' }}>Contraind.:</label>
                  <textarea value={treatment.contraindications || ''} onChange={(e) => handleObjectArrayChange(e, `treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex, 'contraindications')} style={{ flexGrow: 1, minHeight: '50px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ width: '100px' }}>Side Effects:</label>
                  <textarea value={treatment.sideEffects || ''} onChange={(e) => handleObjectArrayChange(e, `treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex, 'sideEffects')} style={{ flexGrow: 1, minHeight: '50px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ width: '100px' }}>Notes:</label>
                  <textarea value={treatment.notes || ''} onChange={(e) => handleObjectArrayChange(e, `treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex, 'notes')} style={{ flexGrow: 1, minHeight: '50px' }} />
                </div>
                <button onClick={() => removeArrayItem(`treatment.treatmentModalities.${modIndex}.specificTreatments`, treatIndex)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Remove Treatment</button>
                <button onClick={() => handleFlagClick(`treatment.treatmentModalities.${modIndex}.specificTreatments.${treatIndex}`)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Flag Treatment</button>
                <button onClick={() => handleAISuggestionClick(`treatment.treatmentModalities.${modIndex}.specificTreatments.${treatIndex}`)} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI Treatment</button>
              </div>
            ))}
            <button onClick={() => addNestedObjectToArray(`treatment.treatmentModalities.${modIndex}.specificTreatments`, { name: '', dosageAdministration: '', indications: '', contraindications: '', sideEffects: '', notes: '' })} style={{ background: 'purple', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Specific Treatment</button>
            <button onClick={() => removeArrayItem('treatment.treatmentModalities', modIndex)} style={{ background: 'darkred', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px', marginLeft: '10px' }}>Remove Modality</button>
          </div>
        ))}
        <button onClick={() => addNestedObjectToArray('treatment.treatmentModalities', { modalityType: '', specificTreatments: [] })} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Treatment Modality</button>
      </div>
      {renderInputField('General Management', 'treatment.generalManagement', 'textarea')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Prognosis</h3>
      {renderInputField('Prognosis', 'prognosis', 'textarea')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Key Image References</h3>
      <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
        {(getNestedFieldValue(editedCondition, 'keyImageReferences') || []).map((imgRef, index) => (
          <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>PDF Source:</label>
              <input type="text" value={imgRef.pdfSource || ''} onChange={(e) => handleObjectArrayChange(e, 'keyImageReferences', index, 'pdfSource')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Page Number:</label>
              <input type="number" value={imgRef.pageNumber || ''} onChange={(e) => handleObjectArrayChange(e, 'keyImageReferences', index, 'pageNumber')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Figure Caption:</label>
              <textarea value={imgRef.figureCaption || ''} onChange={(e) => handleObjectArrayChange(e, 'keyImageReferences', index, 'figureCaption')} style={{ flexGrow: 1, minHeight: '50px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '100px' }}>Description:</label>
              <textarea value={imgRef.description || ''} onChange={(e) => handleObjectArrayChange(e, 'keyImageReferences', index, 'description')} style={{ flexGrow: 1, minHeight: '50px' }} />
            </div>
            <button onClick={() => removeArrayItem('keyImageReferences', index)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Remove Image Ref</button>
            <button onClick={() => handleFlagClick(`keyImageReferences.${index}`)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Flag Image Ref</button>
            <button onClick={() => handleAISuggestionClick(`keyImageReferences.${index}`)} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI Image Ref</button>
          </div>
        ))}
        <button onClick={() => addNestedObjectToArray('keyImageReferences', { pdfSource: '', pageNumber: null, figureCaption: '', description: '' })} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Image Reference</button>
      </div>

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Notes</h3>
      {renderInputField('General Notes', 'notes', 'textarea')}

      <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' }}>Source References</h3>
      <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
        {(getNestedFieldValue(editedCondition, 'sourceReferences') || []).map((srcRef, index) => (
          <div key={index} style={{ border: '19px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '120px' }}>Document ID:</label>
              <input type="text" value={srcRef.documentId || ''} onChange={(e) => handleObjectArrayChange(e, 'sourceReferences', index, 'documentId')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '120px' }}>Page Numbers (comma-separated):</label>
              <input type="text" value={(srcRef.pageNumbers || []).join(', ') || ''} onChange={(e) => handleObjectArrayChange(e, 'sourceReferences', index, 'pageNumbers')} style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ width: '120px' }}>Original Snippet:</label>
              <textarea value={srcRef.originalTextSnippet || ''} onChange={(e) => handleObjectArrayChange(e, 'sourceReferences', index, 'originalTextSnippet')} style={{ flexGrow: 1, minHeight: '50px' }} />
            </div>
            <button onClick={() => removeArrayItem('sourceReferences', index)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Remove Source</button>
            <button onClick={() => handleFlagClick(`sourceReferences.${index}`)} style={{ background: 'orange', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>Flag Source</button>
            <button onClick={() => handleAISuggestionClick(`sourceReferences.${index}`)} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>AI Source</button>
          </div>
        ))}
        <button onClick={() => addNestedObjectToArray('sourceReferences', { documentId: '', pageNumbers: [], originalTextSnippet: '' })} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px' }}>Add Source Reference</button>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ marginRight: '20px' }}>Confidence Score: <strong>{(condition.confidenceScore * 100).toFixed(1) || 'N/A'}%</strong></span>
          <span>Last Refined: <strong>{condition.lastRefinedTimestamp ? new Date(condition.lastRefinedTimestamp).toLocaleString() : 'N/A'}</strong></span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '12px 25px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Flag Inaccuracy Modal */}
      {showFlagModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '15px' }}>Flag Inaccuracy for: {currentFlagField}</h3>
            <textarea
              placeholder="Reason for inaccuracy (e.g., outdated, incorrect, missing detail)"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              style={{ width: '100%', minHeight: '100px', marginBottom: '15px', padding: '10px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFlagModal(false)} style={{ background: '#ccc', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Cancel</button>
              <button onClick={submitFlag} disabled={!flagReason} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Submit Flag</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Modal */}
      {showAIModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '500px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '15px' }}>AI Refinement for: {currentAIField}</h3>
            <p><strong>Current Content:</strong> <span style={{ fontStyle: 'italic', color: '#555' }}>{getNestedFieldValue(editedCondition, currentAIField) || 'N/A'}</span></p>
            <textarea
              placeholder="Provide instructions for AI (e.g., 'Make more concise', 'Elaborate on this point from page 3', 'Rephrase for clarity')"
              value={aiInstruction}
              onChange={(e) => setAIInstruction(e.target.value)}
              style={{ width: '100%', minHeight: '100px', marginBottom: '15px', padding: '10px' }}
            />
            {isLoadingAI && <div style={{ textAlign: 'center', color: '#007bff', marginBottom: '10px' }}>Generating AI suggestion...</div>}
            {aiSuggestion && aiSuggestion.fieldPath === currentAIField && !isLoadingAI && (
              <div style={{ background: '#f8f9fa', border: '1px solid #ced4da', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                <p><strong>AI Suggestion:</strong></p>
                <p>{aiSuggestion.suggestion}</p>
                {/* User explicitly applies the suggestion */}
                <button onClick={applyAISuggestion} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Apply Suggestion</button>
                <button onClick={() => { setShowAIModal(false); onClearAISuggestion(); }} style={{ background: '#ccc', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px', marginTop: '10px' }}>Dismiss</button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button onClick={() => setShowAIModal(false)} style={{ background: '#ccc', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Cancel</button>
              <button onClick={requestAISuggestion} disabled={!aiInstruction || isLoadingAI} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Get AI Suggestion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionEditor;