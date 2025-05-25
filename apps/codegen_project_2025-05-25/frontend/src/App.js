import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

// --- Mock Backend/API Functions (for simulation) ---
// In a real application, these would be actual API calls to your backend.
const mockBackend = {
  // Simulate API key validation/storage
  saveApiKey: async (key) => {
    return new Promise(resolve => setTimeout(() => {
      console.log('API Key saved (mock):', key);
      // In a real app, you'd send this to the backend securely.
      // For this frontend, we'll store it in a global state or context.
      resolve({ success: true });
    }, 500));
  },

  // Simulate PDF upload and processing
  uploadPdf: async (files) => {
    console.log('Uploading PDFs (mock):', files.map(f => f.name));
    return new Promise(resolve => setTimeout(() => {
      // Simulate processing and generating conditions
      const generatedConditions = [
        {
          "conditionName": "Atopic Dermatitis",
          "alternativeNames": ["Eczema"],
          "icd10Code": "L20.9",
          "overview": "Chronic inflammatory skin condition characterized by dry, itchy, and inflamed skin.",
          "etiology": {
            "description": "Complex interplay of genetic predisposition, immune dysfunction, and environmental factors.",
            "contributingFactors": ["Filaggrin mutations", "Allergens", "Irritants"]
          },
          "clinicalPresentation": {
            "symptoms": ["Pruritus", "Dry skin", "Erythema", "Lichenification"],
            "signs": [
              { "morphology": "Erythematous papules and plaques", "color": "Reddish-brown", "size": "Variable", "shape": "Irregular", "arrangement": "Patches", "distribution": "Flexural areas (children), hands/feet (adults)" }
            ],
            "commonSites": ["Antecubital fossae", "Popliteal fossae", "Neck", "Face"]
          },
          "diagnostics": {
            "diagnosticMethods": [
              { "methodName": "Clinical diagnosis", "findings": "Based on Hanifin and Rajka criteria", "utility": "Primary method" }
            ],
            "laboratoryTests": ["Elevated IgE", "Eosinophilia"],
            "imaging": ["Ultrasound (rarely)"]
          },
          "differentialDiagnosis": [
            { "conditionName": "Seborrheic Dermatitis", "distinguishingFeatures": "Greasy scales, scalp involvement" },
            { "conditionName": "Contact Dermatitis", "distinguishingFeatures": "Clear contact with allergen/irritant" }
          ],
          "treatment": {
            "treatment modalities": [
              {
                "modalityType": "Topical",
                "specificTreatments": [
                  { "name": "Topical Corticosteroids", "dosageAdministration": "Once or twice daily", "indications": "Inflammation", "contraindications": "Long-term use on face", "sideEffects": "Skin atrophy", "notes": "Potency varies" },
                  { "name": "Topical Calcineurin Inhibitors", "dosageAdministration": "Once or twice daily", "indications": "Inflammation, face/folds", "contraindications": "None specific", "sideEffects": "Burning sensation", "notes": "Non-steroidal" }
                ]
              },
              {
                "modalityType": "Systemic",
                "specificTreatments": [
                    { "name": "Cyclosporine", "dosageAdministration": "2.5-5 mg/kg/day", "indications": "Severe, refractory AD", "contraindications": "Renal impairment", "sideEffects": "Nephrotoxicity, hypertension", "notes": "Immunosuppressant" }
                ]
              }
            ],
            "generalManagement": "Moisturizers, avoidance of triggers, wet wraps"
          },
          "prognosis": "Chronic, relapsing course. Often improves with age.",
          "keyImageReferences": [
            { "pdfSource": "DermRefBook.pdf", "pageNumber": 125, "figureCaption": "Erythematous, lichenified plaques on antecubital fossa.", "description": "Classic appearance of atopic dermatitis." }
          ],
          "notes": "Patient education on skin care is crucial.",
          "sourceReferences": [
            { "documentId": "DermRefBook.pdf", "pageNumbers": [123, 126], "originalTextSnippet": "Atopic dermatitis is a common chronic inflammatory skin disease..." }
          ],
          "confidenceScore": 0.95,
          "lastRefinedTimestamp": new Date().toISOString()
        },
        {
          "conditionName": "Psoriasis",
          "alternativeNames": ["Psoriasis Vulgaris"],
          "icd10Code": "L40.0",
          "overview": "Chronic autoimmune condition leading to rapid skin cell turnover, causing thick, silvery scales.",
          "etiology": {
            "description": "Genetic predisposition combined with immune system dysregulation, leading to keratinocyte hyperproliferation.",
            "contributingFactors": ["Genetics", "Stress", "Infections", "Medications"]
          },
          "clinicalPresentation": {
            "symptoms": ["Itching", "Burning", "Scaling", "Joint pain (psoriatic arthritis)"],
            "signs": [
              { "morphology": "Erythematous plaques with silvery scales", "color": "Red", "size": "Variable", "shape": "Round to oval", "arrangement": "Coalescing patches", "distribution": "Extensor surfaces (elbows, knees), scalp, lower back, nails" }
            ],
            "commonSites": ["Elbows", "Knees", "Scalp", "Nails"]
          },
          "diagnostics": {
            "diagnosticMethods": [
              { "methodName": "Clinical diagnosis", "findings": "Auspitz sign, Koebner phenomenon", "utility": "Primary method" },
              { "methodName": "Skin biopsy", "findings": "Epidermal hyperplasia, neutrophilic infiltrates", "utility": "Confirmatory in atypical cases" }
            ],
            "laboratoryTests": ["ESR", "CRP (if psoriatic arthritis suspected)"],
            "imaging": ["X-rays for psoriatic arthritis"]
          },
          "differentialDiagnosis": [
            { "conditionName": "Seborrheic Dermatitis", "distinguishingFeatures": "Greasy scales, less defined borders, often confined to scalp/face" },
            { "conditionName": "Eczema", "distinguishingFeatures": "More diffuse, less scaly, different distribution" }
          ],
          "treatment": {
            "treatment modalities": [
              {
                "modalityType": "Topical",
                "specificTreatments": [
                  { "name": "Topical Corticosteroids", "dosageAdministration": "Daily application", "indications": "Mild to moderate plaques", "contraindications": "Long-term face/intertriginous areas", "sideEffects": "Skin atrophy", "notes": "Various potencies" },
                  { "name": "Vitamin D Analogs", "dosageAdministration": "Daily application", "indications": "Plaque psoriasis", "contraindications": "Hypercalcemia", "sideEffects": "Skin irritation", "notes": "Calcipotriene, Calcitriol" }
                ]
              },
              {
                "modalityType": "Phototherapy",
                "specificTreatments": [
                  { "name": "UVB phototherapy", "dosageAdministration": "3 times/week", "indications": "Moderate to severe psoriasis", "contraindications": "Photosensitivity", "sideEffects": "Erythema, skin aging", "notes": "Broadband or Narrowband" }
                ]
              },
              {
                "modalityType": "Systemic",
                "specificTreatments": [
                  { "name": "Methotrexate", "dosageAdministration": "Weekly oral/injectable", "indications": "Severe psoriasis, psoriatic arthritis", "contraindications": "Liver disease, pregnancy", "sideEffects": "Nausea, liver toxicity", "notes": "Immunosuppressant" },
                  { "name": "Biologics (e.g., Adalimumab)", "dosageAdministration": "Subcutaneous injection, frequency varies", "indications": "Moderate to severe plaque psoriasis, psoriatic arthritis", "contraindications": "Active infection, heart failure", "sideEffects": "Infections, injection site reactions", "notes": "Target specific immune pathways" }
                ]
              }
            ],
            "generalManagement": "Moisturizers, avoid triggers, stress management"
          },
          "prognosis": "Chronic, relapsing. Managed but rarely cured.",
          "keyImageReferences": [
            { "pdfSource": "DermAtlas.pdf", "pageNumber": 78, "figureCaption": "Psoriatic plaques on the elbow.", "description": "Typical thick, silvery scales on an erythematous base." }
          ],
          "notes": "Associated with metabolic syndrome and cardiovascular disease.",
          "sourceReferences": [
            { "documentId": "DermAtlas.pdf", "pageNumbers": [75, 79], "originalTextSnippet": "Psoriasis is a chronic inflammatory skin condition..." }
          ],
          "confidenceScore": 0.92,
          "lastRefinedTimestamp": new Date().toISOString()
        }
      ];
      resolve({ success: true, conditions: generatedConditions });
    }, 2000)); // Simulate 2-second processing time
  },

  // Simulate fetching conditions
  getConditions: async () => {
    return new Promise(resolve => setTimeout(() => {
      // In a real app, this would fetch from a database.
      // For now, we'll return the mock conditions from the upload.
      // This part would need to be more sophisticated to persist state.
      // For simplicity, let's assume conditions are 'stored' in a global var here
      // for the duration of this mock frontend session.
      resolve({ success: true, conditions: mockBackend._conditions || [] });
    }, 500));
  },

  // Simulate updating a condition
  updateCondition: async (updatedCondition) => {
    console.log('Updating condition (mock):', updatedCondition.conditionName);
    return new Promise(resolve => setTimeout(() => {
      if (mockBackend._conditions) {
        const index = mockBackend._conditions.findIndex(c => c.conditionName === updatedCondition.conditionName);
        if (index !== -1) {
          mockBackend._conditions[index] = { ...updatedCondition, lastRefinedTimestamp: new Date().toISOString() };
          resolve({ success: true, condition: mockBackend._conditions[index] });
        } else {
          resolve({ success: false, message: "Condition not found" });
        }
      } else {
        resolve({ success: false, message: "No conditions loaded" });
      }
    }, 700));
  }
};

// Internal "storage" for mock backend
mockBackend._conditions = [];


// --- Sub-Components ---

const ApiKeyInput = ({ onApiKeySubmit, loading, error }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onApiKeySubmit(key);
  };

  return (
    <div style={styles.container}>
      <h2>DermRefGen - API Key Input</h2>
      <p>Please enter your API Key to enable advanced AI features.</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter API Key"
          required
          style={styles.input}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Submitting...' : 'Submit API Key'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
};

const PdfUpload = ({ onPdfUpload, loading, error }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFiles.length > 0) {
      onPdfUpload(selectedFiles);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Upload PDF Documents</h2>
      <p>Upload dermatology-related PDF documents to extract conditions.</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          style={styles.input}
          disabled={loading}
        />
        <button type="submit" disabled={loading || selectedFiles.length === 0} style={styles.button}>
          {loading ? 'Processing...' : `Upload & Process ${selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}`}
        </button>
        {error && <p style={styles.error}>{error}</p>}
        {selectedFiles.length > 0 && (
          <div style={styles.fileList}>
            <h4>Selected Files:</h4>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};

const ConditionList = ({ conditions, onSelectCondition, loading, error }) => {
  if (loading) return <div style={styles.container}><p>Loading conditions...</p></div>;
  if (error) return <div style={styles.container}><p style={styles.error}>{error}</p></div>;
  if (conditions.length === 0) return <div style={styles.container}><p>No conditions extracted yet. Please upload PDFs.</p></div>;

  return (
    <div style={styles.container}>
      <h2>Extracted Dermatologic Conditions</h2>
      <p>Click on a condition to review and refine its details.</p>
      <ul style={styles.conditionList}>
        {conditions.map((condition, index) => (
          <li key={index} style={styles.conditionListItem}>
            <h3>{condition.conditionName}</h3>
            <p><strong>Overview:</strong> {condition.overview}</p>
            <p><strong>Source:</strong> {condition.sourceReferences?.[0]?.documentId} (p. {condition.sourceReferences?.[0]?.pageNumbers?.join(', ')})</p>
            <button onClick={() => onSelectCondition(condition.conditionName)} style={styles.smallButton}>Review/Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- Helper Components for ConditionEditor ---
const SignsEditor = ({ signs, onChange, loading }) => {
  const handleSignChange = (index, field, value) => {
    const newSigns = JSON.parse(JSON.stringify(signs)); // Deep clone
    if (!newSigns[index]) {
        newSigns[index] = {};
    }
    newSigns[index][field] = value;
    onChange(newSigns);
  };

  const addSign = () => {
    onChange([...signs, { morphology: '', color: '', size: '', shape: '', arrangement: '', distribution: '' }]);
  };

  const removeSign = (index) => {
    onChange(signs.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.nestedSection}>
      <h4 style={{marginTop: '0'}}>Signs</h4>
      {signs.map((sign, index) => (
        <div key={index} style={styles.nestedItem}>
          <label style={styles.label}>Sign #{index + 1}</label>
          <input type="text" placeholder="Morphology" value={sign.morphology || ''} onChange={(e) => handleSignChange(index, 'morphology', e.target.value)} style={styles.input} disabled={loading} />
          <input type="text" placeholder="Color" value={sign.color || ''} onChange={(e) => handleSignChange(index, 'color', e.target.value)} style={styles.input} disabled={loading} />
          <input type="text" placeholder="Size" value={sign.size || ''} onChange={(e) => handleSignChange(index, 'size', e.target.value)} style={styles.input} disabled={loading} />
          <input type="text" placeholder="Shape" value={sign.shape || ''} onChange={(e) => handleSignChange(index, 'shape', e.target.value)} style={styles.input} disabled={loading} />
          <input type="text" placeholder="Arrangement" value={sign.arrangement || ''} onChange={(e) => handleSignChange(index, 'arrangement', e.target.value)} style={styles.input} disabled={loading} />
          <input type="text" placeholder="Distribution" value={sign.distribution || ''} onChange={(e) => handleSignChange(index, 'distribution', e.target.value)} style={styles.input} disabled={loading} />
          <button type="button" onClick={() => removeSign(index)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', marginTop: '10px'}}>Remove Sign</button>
        </div>
      ))}
      <button type="button" onClick={addSign} style={{...styles.smallButton, backgroundColor: '#17a2b8'}}>Add Sign</button>
    </div>
  );
};

const DiagnosticMethodsEditor = ({ diagnosticMethods, onChange, loading }) => {
    const handleMethodChange = (index, field, value) => {
        const newMethods = JSON.parse(JSON.stringify(diagnosticMethods));
        if (!newMethods[index]) {
            newMethods[index] = {};
        }
        newMethods[index][field] = value;
        onChange(newMethods);
    };

    const addMethod = () => {
        onChange([...diagnosticMethods, { methodName: '', findings: '', utility: '' }]);
    };

    const removeMethod = (index) => {
        onChange(diagnosticMethods.filter((_, i) => i !== index));
    };

    return (
        <div style={styles.nestedSection}>
            <h4 style={{marginTop: '0'}}>Diagnostic Methods</h4>
            {diagnosticMethods.map((method, index) => (
                <div key={index} style={styles.nestedItem}>
                    <label style={styles.label}>Method #{index + 1}</label>
                    <input type="text" placeholder="Method Name" value={method.methodName || ''} onChange={(e) => handleMethodChange(index, 'methodName', e.target.value)} style={styles.input} disabled={loading} />
                    <textarea placeholder="Findings" value={method.findings || ''} onChange={(e) => handleMethodChange(index, 'findings', e.target.value)} style={styles.textarea} disabled={loading} />
                    <input type="text" placeholder="Utility" value={method.utility || ''} onChange={(e) => handleMethodChange(index, 'utility', e.target.value)} style={styles.input} disabled={loading} />
                    <button type="button" onClick={() => removeMethod(index)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', marginTop: '10px'}}>Remove Method</button>
                </div>
            ))}
            <button type="button" onClick={addMethod} style={{...styles.smallButton, backgroundColor: '#17a2b8'}}>Add Method</button>
        </div>
    );
};

const SpecificTreatmentEditor = ({ treatment, onChange, loading }) => {
    const handleTreatmentChange = (field, value) => {
        onChange({ ...treatment, [field]: value });
    };

    return (
        <div style={styles.nestedItemDetail}>
            <input type="text" placeholder="Treatment Name" value={treatment.name || ''} onChange={(e) => handleTreatmentChange('name', e.target.value)} style={styles.input} disabled={loading} />
            <input type="text" placeholder="Dosage/Administration" value={treatment.dosageAdministration || ''} onChange={(e) => handleTreatmentChange('dosageAdministration', e.target.value)} style={styles.input} disabled={loading} />
            <input type="text" placeholder="Indications" value={treatment.indications || ''} onChange={(e) => handleTreatmentChange('indications', e.target.value)} style={styles.input} disabled={loading} />
            <input type="text" placeholder="Contraindications" value={treatment.contraindications || ''} onChange={(e) => handleTreatmentChange('contraindications', e.target.value)} style={styles.input} disabled={loading} />
            <textarea placeholder="Side Effects" value={treatment.sideEffects || ''} onChange={(e) => handleTreatmentChange('sideEffects', e.target.value)} style={styles.textarea} disabled={loading} />
            <textarea placeholder="Notes" value={treatment.notes || ''} onChange={(e) => handleTreatmentChange('notes', e.target.value)} style={styles.textarea} disabled={loading} />
        </div>
    );
};

const TreatmentModalitiesEditor = ({ treatmentModalities, onChange, loading }) => {
    const handleModalityTypeChange = (index, value) => {
        const newModalities = JSON.parse(JSON.stringify(treatmentModalities));
        if (!newModalities[index]) {
            newModalities[index] = { modalityType: '', specificTreatments: [] };
        }
        newModalities[index].modalityType = value;
        onChange(newModalities);
    };

    const handleSpecificTreatmentsChange = (modalityIndex, newTreatments) => {
        const newModalities = JSON.parse(JSON.stringify(treatmentModalities));
        if (!newModalities[modalityIndex]) {
            newModalities[modalityIndex] = { modalityType: '', specificTreatments: [] };
        }
        newModalities[modalityIndex].specificTreatments = newTreatments;
        onChange(newModalities);
    };

    const addModality = () => {
        onChange([...treatmentModalities, { modalityType: '', specificTreatments: [] }]);
    };

    const removeModality = (index) => {
        onChange(treatmentModalities.filter((_, i) => i !== index));
    };

    const addSpecificTreatment = (modalityIndex) => {
        const newModalities = JSON.parse(JSON.stringify(treatmentModalities));
        if (!newModalities[modalityIndex]) {
            newModalities[modalityIndex] = { modalityType: '', specificTreatments: [] };
        }
        newModalities[modalityIndex].specificTreatments.push({ name: '', dosageAdministration: '', indications: '', contraindications: '', sideEffects: '', notes: '' });
        onChange(newModalities);
    };

    const removeSpecificTreatment = (modalityIndex, treatmentIndex) => {
        const newModalities = JSON.parse(JSON.stringify(treatmentModalities));
        newModalities[modalityIndex].specificTreatments = newModalities[modalityIndex].specificTreatments.filter((_, i) => i !== treatmentIndex);
        onChange(newModalities);
    };

    return (
        <div style={styles.nestedSection}>
            <h4 style={{marginTop: '0'}}>Treatment Modalities</h4>
            {treatmentModalities.map((modality, modalityIndex) => (
                <div key={modalityIndex} style={styles.nestedItem}>
                    <label style={styles.label}>Modality #{modalityIndex + 1} Type:</label>
                    <input type="text" placeholder="e.g., Topical, Systemic" value={modality.modalityType || ''} onChange={(e) => handleModalityTypeChange(modalityIndex, e.target.value)} style={styles.input} disabled={loading} />

                    <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Specific Treatments for {modality.modalityType || 'this modality'}</h5>
                    {modality.specificTreatments.map((treatment, treatmentIndex) => (
                        <div key={treatmentIndex} style={{position: 'relative'}}>
                            <SpecificTreatmentEditor treatment={treatment} onChange={(newTreatment) => {
                                const newTreatments = [...modality.specificTreatments];
                                newTreatments[treatmentIndex] = newTreatment;
                                handleSpecificTreatmentsChange(modalityIndex, newTreatments);
                            }} loading={loading} />
                            <button type="button" onClick={() => removeSpecificTreatment(modalityIndex, treatmentIndex)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', position: 'absolute', top: '10px', right: '10px', zIndex: '1'}}>Remove Treatment</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addSpecificTreatment(modalityIndex)} style={{...styles.smallButton, backgroundColor: '#17a2b8', marginTop: '10px'}}>Add Specific Treatment</button>
                    <button type="button" onClick={() => removeModality(modalityIndex)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', marginTop: '10px'}}>Remove Modality</button>
                </div>
            ))}
            <button type="button" onClick={addModality} style={{...styles.smallButton, backgroundColor: '#17a2b8'}}>Add Modality</button>
        </div>
    );
};

const DifferentialDiagnosisEditor = ({ differentialDiagnosis, onChange, loading }) => {
    const handleDdChange = (index, field, value) => {
        const newDd = JSON.parse(JSON.stringify(differentialDiagnosis));
        if (!newDd[index]) {
            newDd[index] = {};
        }
        newDd[index][field] = value;
        onChange(newDd);
    };

    const addDd = () => {
        onChange([...differentialDiagnosis, { conditionName: '', distinguishingFeatures: '' }]);
    };

    const removeDd = (index) => {
        onChange(differentialDiagnosis.filter((_, i) => i !== index));
    };

    return (
        <div style={styles.nestedSection}>
            <h4 style={{marginTop: '0'}}>Differential Diagnoses</h4>
            {differentialDiagnosis.map((dd, index) => (
                <div key={index} style={styles.nestedItem}>
                    <label style={styles.label}>DD #{index + 1}</label>
                    <input type="text" placeholder="Condition Name" value={dd.conditionName || ''} onChange={(e) => handleDdChange(index, 'conditionName', e.target.value)} style={styles.input} disabled={loading} />
                    <textarea placeholder="Distinguishing Features" value={dd.distinguishingFeatures || ''} onChange={(e) => handleDdChange(index, 'distinguishingFeatures', e.target.value)} style={styles.textarea} disabled={loading} />
                    <button type="button" onClick={() => removeDd(index)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', marginTop: '10px'}}>Remove DD</button>
                </div>
            ))}
            <button type="button" onClick={addDd} style={{...styles.smallButton, backgroundColor: '#17a2b8'}}>Add DD</button>
        </div>
    );
};

const KeyImageReferencesEditor = ({ keyImageReferences, onChange, loading }) => {
    const handleImageRefChange = (index, field, value) => {
        const newRefs = JSON.parse(JSON.stringify(keyImageReferences));
        if (!newRefs[index]) {
            newRefs[index] = {};
        }
        if (field === 'pageNumber') {
            newRefs[index][field] = parseInt(value);
        } else {
            newRefs[index][field] = value;
        }
        onChange(newRefs);
    };

    const addImageRef = () => {
        onChange([...keyImageReferences, { pdfSource: '', pageNumber: '', figureCaption: '', description: '' }]);
    };

    const removeImageRef = (index) => {
        onChange(keyImageReferences.filter((_, i) => i !== index));
    };

    return (
        <div style={styles.nestedSection}>
            <h4 style={{marginTop: '0'}}>Key Image References</h4>
            {keyImageReferences.map((ref, index) => (
                <div key={index} style={styles.nestedItem}>
                    <label style={styles.label}>Image Ref #{index + 1}</label>
                    <input type="text" placeholder="PDF Source (Filename)" value={ref.pdfSource || ''} onChange={(e) => handleImageRefChange(index, 'pdfSource', e.target.value)} style={styles.input} disabled={loading} />
                    <input type="number" placeholder="Page Number" value={ref.pageNumber || ''} onChange={(e) => handleImageRefChange(index, 'pageNumber', e.target.value)} style={styles.input} disabled={loading} />
                    <textarea placeholder="Figure Caption" value={ref.figureCaption || ''} onChange={(e) => handleImageRefChange(index, 'figureCaption', e.target.value)} style={styles.textarea} disabled={loading} />
                    <textarea placeholder="Description" value={ref.description || ''} onChange={(e) => handleImageRefChange(index, 'description', e.target.value)} style={styles.textarea} disabled={loading} />
                    <button type="button" onClick={() => removeImageRef(index)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', marginTop: '10px'}}>Remove Image Ref</button>
                </div>
            ))}
            <button type="button" onClick={addImageRef} style={{...styles.smallButton, backgroundColor: '#17a2b8'}}>Add Image Reference</button>
        </div>
    );
};

const SourceReferencesEditor = ({ sourceReferences, onChange, loading }) => {
    const handleSourceRefChange = (index, field, value) => {
        const newRefs = JSON.parse(JSON.stringify(sourceReferences));
        if (!newRefs[index]) {
            newRefs[index] = {};
        }
        if (field === 'pageNumbers') {
            newRefs[index][field] = value.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
        } else {
            newRefs[index][field] = value;
        }
        onChange(newRefs);
    };

    const addSourceRef = () => {
        onChange([...sourceReferences, { documentId: '', pageNumbers: [], originalTextSnippet: '' }]);
    };

    const removeSourceRef = (index) => {
        onChange(sourceReferences.filter((_, i) => i !== index));
    };

    return (
        <div style={styles.nestedSection}>
            <h4 style={{marginTop: '0'}}>Source References</h4>
            {sourceReferences.map((ref, index) => (
                <div key={index} style={styles.nestedItem}>
                    <label style={styles.label}>Source Ref #{index + 1}</label>
                    <input type="text" placeholder="Document ID (Filename)" value={ref.documentId || ''} onChange={(e) => handleSourceRefChange(index, 'documentId', e.target.value)} style={styles.input} disabled={loading} />
                    <input type="text" placeholder="Page Numbers (comma-separated)" value={(ref.pageNumbers || []).join(', ')} onChange={(e) => handleSourceRefChange(index, 'pageNumbers', e.target.value)} style={styles.input} disabled={loading} />
                    <textarea placeholder="Original Text Snippet" value={ref.originalTextSnippet || ''} onChange={(e) => handleSourceRefChange(index, 'originalTextSnippet', e.target.value)} style={styles.textarea} disabled={loading} />
                    <button type="button" onClick={() => removeSourceRef(index)} style={{...styles.secondaryButton, backgroundColor: '#dc3545', marginTop: '10px'}}>Remove Source Ref</button>
                </div>
            ))}
            <button type="button" onClick={addSourceRef} style={{...styles.smallButton, backgroundColor: '#17a2b8'}}>Add Source Reference</button>
        </div>
    );
};


const ConditionEditor = ({ condition, onSaveCondition, loading, error }) => {
  const [editableCondition, setEditableCondition] = useState(condition);
  const navigate = useNavigate();

  useEffect(() => {
    // Deep clone condition to avoid direct mutation of props
    setEditableCondition(JSON.parse(JSON.stringify(condition)));
  }, [condition]);

  if (!editableCondition) {
    return <div style={styles.container}><p>No condition selected or condition not found.</p><Link to="/conditions">Back to List</Link></div>;
  }

  // Generic handler for top-level or direct nested string/number fields
  const handleFieldChange = (field, value) => {
    if (field.includes('.')) { // Handle simple nested fields like 'etiology.description'
      setEditableCondition(prev => {
        const newCondition = JSON.parse(JSON.stringify(prev)); // Deep clone
        let current = newCondition;
        const parts = field.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {}; // Initialize if undefined
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newCondition;
      });
    } else if (Array.isArray(editableCondition[field])) { // Handle comma-separated string arrays
      setEditableCondition(prev => ({
        ...prev,
        [field]: value.split(',').map(s => s.trim()).filter(s => s)
      }));
    } else { // Handle simple top-level fields
      setEditableCondition(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNestedObjectChange = (objectPath, newValue) => {
    setEditableCondition(prev => {
        const newCondition = JSON.parse(JSON.stringify(prev));
        let current = newCondition;
        const parts = objectPath.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = newValue;
        return newCondition;
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveCondition(editableCondition);
  };

  const handleAiRefine = () => {
      // Simulate AI refinement call
      setLoading(true);
      setTimeout(() => {
          setEditableCondition(prev => {
              // Example: Simulate AI making a small refinement to the overview
              const refinedOverview = prev.overview + " (AI refined for conciseness and clarity)";
              alert("AI Refinement applied to Overview! (Simulated)");
              return { ...prev, overview: refinedOverview };
          });
          setLoading(false);
      }, 1500); // Simulate AI processing time
  };

  // Helper for rendering simple text fields
  const renderSimpleField = (label, fieldPath, type = 'text') => {
    let value = editableCondition;
    const parts = fieldPath.split('.');
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined; // Path not found
        break;
      }
    }
    const displayValue = value !== undefined ? (Array.isArray(value) ? value.join(', ') : value) : '';

    return (
      <div style={styles.formGroup} key={fieldPath}>
        <label style={styles.label}>{label}:</label>
        {type === 'textarea' ? (
          <textarea
            value={displayValue}
            onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
            style={styles.textarea}
            disabled={loading}
          />
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
            style={styles.input}
            disabled={loading}
          />
        )}
      </div>
    );
  };


  return (
    <div style={styles.container}>
      <h2>Edit Condition: {editableCondition.conditionName}</h2>
      <button onClick={handleAiRefine} disabled={loading} style={{...styles.button, marginBottom: '20px', backgroundColor: '#6f42c1'}}>
          {loading ? 'AI Refine In Progress...' : 'AI Refine Condition (Simulated)'}
      </button>
      <form onSubmit={handleSubmit} style={styles.form}>
        {renderSimpleField('Condition Name', 'conditionName')}
        {renderSimpleField('Alternative Names', 'alternativeNames')}
        {renderSimpleField('ICD-10 Code', 'icd10Code')}
        {renderSimpleField('Overview', 'overview', 'textarea')}

        <h3>Etiology</h3>
        {renderSimpleField('Description', 'etiology.description', 'textarea')}
        {renderSimpleField('Contributing Factors', 'etiology.contributingFactors')}

        <h3>Clinical Presentation</h3>
        {renderSimpleField('Symptoms', 'clinicalPresentation.symptoms')}
        <SignsEditor
            signs={editableCondition.clinicalPresentation.signs || []}
            onChange={(newSigns) => handleNestedObjectChange('clinicalPresentation.signs', newSigns)}
            loading={loading}
        />
        {renderSimpleField('Common Sites', 'clinicalPresentation.commonSites')}

        <h3>Diagnostics</h3>
        <DiagnosticMethodsEditor
            diagnosticMethods={editableCondition.diagnostics.diagnosticMethods || []}
            onChange={(newMethods) => handleNestedObjectChange('diagnostics.diagnosticMethods', newMethods)}
            loading={loading}
        />
        {renderSimpleField('Laboratory Tests', 'diagnostics.laboratoryTests')}
        {renderSimpleField('Imaging', 'diagnostics.imaging')}

        <h3>Differential Diagnosis</h3>
        <DifferentialDiagnosisEditor
            differentialDiagnosis={editableCondition.differentialDiagnosis || []}
            onChange={(newDd) => handleNestedObjectChange('differentialDiagnosis', newDd)}
            loading={loading}
        />

        <h3>Treatment</h3>
        <TreatmentModalitiesEditor
            treatmentModalities={editableCondition.treatment['treatment modalities'] || []}
            onChange={(newModalities) => handleNestedObjectChange('treatment.treatment modalities', newModalities)}
            loading={loading}
        />
        {renderSimpleField('General Management', 'treatment.generalManagement', 'textarea')}

        {renderSimpleField('Prognosis', 'prognosis', 'textarea')}

        <h3>Key Image References</h3>
        <KeyImageReferencesEditor
            keyImageReferences={editableCondition.keyImageReferences || []}
            onChange={(newRefs) => handleNestedObjectChange('keyImageReferences', newRefs)}
            loading={loading}
        />

        {renderSimpleField('Notes', 'notes', 'textarea')}

        <h3>Source References</h3>
        <SourceReferencesEditor
            sourceReferences={editableCondition.sourceReferences || []}
            onChange={(newRefs) => handleNestedObjectChange('sourceReferences', newRefs)}
            loading={loading}
        />

        {/* Display confidence score and last refined timestamp, not editable */}
        <div style={styles.formGroup}>
            <label style={styles.label}>Confidence Score:</label>
            <input type="text" value={editableCondition.confidenceScore !== undefined ? editableCondition.confidenceScore.toFixed(2) : 'N/A'} style={{...styles.input, backgroundColor: '#f9f9f9'}} disabled />
        </div>
        <div style={styles.formGroup}>
            <label style={styles.label}>Last Refined:</label>
            <input type="text" value={editableCondition.lastRefinedTimestamp ? new Date(editableCondition.lastRefinedTimestamp).toLocaleString() : 'N/A'} style={{...styles.input, backgroundColor: '#f9f9f9'}} disabled />
        </div>


        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Saving...' : 'Save Refinements'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
        <button type="button" onClick={() => navigate('/conditions')} style={styles.secondaryButton}>
          Back to List
        </button>
      </form>
    </div>
  );
};


// --- Main App Component ---

const App = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('dermrefgen_apiKey') || '');
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConditionName, setSelectedConditionName] = useState(null); // Used to pass to editor route
  const navigate = useNavigate();

  // Load conditions on component mount if API key exists (simulated persistence)
  useEffect(() => {
    const storedApiKey = localStorage.getItem('dermrefgen_apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      // In a real app, you'd trigger a fetch to your backend to get persisted conditions
      // For this mock, we'll assume they need to be re-uploaded or are loaded from mockBackend._conditions
      if (mockBackend._conditions.length > 0) { // If mock backend already has data from previous upload
        setConditions(mockBackend._conditions);
      } else {
        // Optionally fetch from backend if available, or stay on upload page
      }
    }
  }, []);

  const handleApiKeySubmit = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockBackend.saveApiKey(key);
      if (response.success) {
        setApiKey(key);
        localStorage.setItem('dermrefgen_apiKey', key); // Persist API key locally for demo
        navigate('/upload');
      } else {
        setError(response.message || 'Failed to save API key.');
      }
    } catch (err) {
      setError('An error occurred while submitting API key.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handlePdfUpload = useCallback(async (files) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockBackend.uploadPdf(files);
      if (response.success && response.conditions) {
        setConditions(response.conditions);
        mockBackend._conditions = response.conditions; // Update mock backend's 'storage'
        navigate('/conditions');
      } else {
        setError(response.message || 'Failed to process PDFs.');
      }
    } catch (err) {
      setError('An error occurred during PDF processing.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleSelectCondition = useCallback((conditionName) => {
    setSelectedConditionName(conditionName);
    navigate(`/conditions/${encodeURIComponent(conditionName)}`);
  }, [navigate]);

  const handleSaveCondition = useCallback(async (updatedCondition) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockBackend.updateCondition(updatedCondition);
      if (response.success) {
        setConditions(prevConditions =>
          prevConditions.map(c =>
            c.conditionName === updatedCondition.conditionName ? response.condition : c
          )
        );
        alert('Condition saved successfully!');
        navigate('/conditions'); // Go back to list after saving
      } else {
        setError(response.message || 'Failed to update condition.');
      }
    } catch (err) {
      setError('An error occurred while saving the condition.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleDownloadConditions = useCallback(() => {
    if (conditions.length === 0) {
      alert("No conditions to download!");
      return;
    }
    const dataStr = JSON.stringify(conditions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dermrefgen_conditions.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Conditions downloaded successfully!');
  }, [conditions]);


  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>DermRefGen</h1>
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Home</Link>
          {apiKey && <Link to="/upload" style={styles.navLink}>Upload PDFs</Link>}
          {conditions.length > 0 && <Link to="/conditions" style={styles.navLink}>View Conditions</Link>}
          {conditions.length > 0 && (
            <button onClick={handleDownloadConditions} style={styles.downloadButton}>
              Download All
            </button>
          )}
        </nav>
      </header>

      <main style={styles.main}>
        <Routes>
          <Route path="/" element={
            apiKey ? (
              <div style={styles.container}>
                <p>API Key is set. Ready to <Link to="/upload">Upload PDFs</Link> or <Link to="/conditions">View Extracted Conditions</Link>.</p>
                <button onClick={() => { setApiKey(''); localStorage.removeItem('dermrefgen_apiKey'); navigate('/'); }} style={styles.secondaryButton}>
                  Change API Key
                </button>
              </div>
            ) : (
              <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} loading={loading} error={error} />
            )
          } />
          <Route path="/upload" element={
            apiKey ? (
              <PdfUpload onPdfUpload={handlePdfUpload} loading={loading} error={error} />
            ) : (
              <div style={styles.container}>
                <p>Please enter your API Key first.</p>
                <Link to="/" style={styles.button}>Go to API Key Input</Link>
              </div>
            )
          } />
          <Route path="/conditions" element={
            apiKey ? (
              <ConditionList conditions={conditions} onSelectCondition={handleSelectCondition} loading={loading} error={error} />
            ) : (
              <div style={styles.container}>
                <p>Please enter your API Key and upload PDFs to view conditions.</p>
                <Link to="/" style={styles.button}>Go to API Key Input</Link>
              </div>
            )
          } />
          <Route path="/conditions/:conditionName" element={
            apiKey ? (
              <ConditionEditor
                condition={conditions.find(c => c.conditionName === decodeURIComponent(selectedConditionName || useParams().conditionName))}
                onSaveCondition={handleSaveCondition}
                loading={loading}
                error={error}
              />
            ) : (
              <div style={styles.container}>
                <p>Please enter your API Key and upload PDFs to edit conditions.</p>
                <Link to="/" style={styles.button}>Go to API Key Input</Link>
              </div>
            )
          } />
          <Route path="*" element={<div style={styles.container}><h2>Page Not Found</h2><p>Use the navigation above.</p></div>} />
        </Routes>
      </main>
    </div>
  );
};

// --- Basic Styling (Inline for simplicity, would be CSS modules/files in real app) ---
const styles = {
  app: {
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f7f6',
    color: '#333',
  },
  header: {
    backgroundColor: '#0056b3',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  nav: {
    display: 'flex',
    gap: '20px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.1em',
    padding: '5px 10px',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#003d80',
    },
  },
  downloadButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#218838',
    },
  },
  main: {
    flexGrow: 1,
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // Align content to top
  },
  container: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '800px',
    margin: '20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1em',
    minHeight: '80px',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#0056b3',
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed',
    },
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.3s ease',
    marginTop: '10px',
    '&:hover': {
      backgroundColor: '#5a6268',
    },
  },
  error: {
    color: 'red',
    marginTop: '10px',
  },
  fileList: {
    marginTop: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '15px',
  },
  conditionList: {
    listStyleType: 'none',
    padding: 0,
  },
  conditionListItem: {
    backgroundColor: '#e9f3ff',
    border: '1px solid #cce0ff',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  smallButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    alignSelf: 'flex-start',
    marginTop: '10px',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#0056b3',
    },
  },
  nestedSection: {
    borderLeft: '3px solid #e0e0e0',
    paddingLeft: '15px',
    marginBottom: '20px',
    marginTop: '15px',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px'
  },
  nestedItem: {
    border: '1px solid #eee',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: '#fff',
    position: 'relative', // for positioning remove button
  },
  nestedItemDetail: {
    border: '1px solid #ddd',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: '#fcfcfc',
  }
};

// Wrap the main App component with Router for routing to work
const WrappedApp = () => (
  <Router>
    <App />
  </Router>
);

export default WrappedApp;