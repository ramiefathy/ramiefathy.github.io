from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EtiologySchema(BaseModel):
    description: Optional[str] = None
    contributingFactors: List[str] = Field(default_factory=list)

class SignDetailSchema(BaseModel):
    morphology: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    shape: Optional[str] = None
    arrangement: Optional[str] = None
    distribution: Optional[str] = None

class ClinicalPresentationSchema(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    signs: List[SignDetailSchema] = Field(default_factory=list)
    commonSites: List[str] = Field(default_factory=list)

class DiagnosticMethodSchema(BaseModel):
    methodName: Optional[str] = None
    findings: Optional[str] = None
    utility: Optional[str] = None

class DiagnosticsSchema(BaseModel):
    diagnosticMethods: List[DiagnosticMethodSchema] = Field(default_factory=list)
    laboratoryTests: List[str] = Field(default_factory=list)
    imaging: List[str] = Field(default_factory=list)

class DifferentialDiagnosisSchema(BaseModel):
    conditionName: Optional[str] = None
    distinguishingFeatures: Optional[str] = None

class SpecificTreatmentSchema(BaseModel):
    name: Optional[str] = None
    dosageAdministration: Optional[str] = None
    indications: Optional[str] = None
    contraindications: Optional[str] = None
    sideEffects: Optional[str] = None
    notes: Optional[str] = None

class TreatmentModalitySchema(BaseModel):
    modalityType: Optional[str] = None
    specificTreatments: List[SpecificTreatmentSchema] = Field(default_factory=list)

class TreatmentSchema(BaseModel):
    treatmentModalities: List[TreatmentModalitySchema] = Field(default_factory=list)
    generalManagement: Optional[str] = None

class KeyImageReferenceSchema(BaseModel):
    pdfSource: Optional[str] = None
    pageNumber: Optional[int] = None
    figureCaption: Optional[str] = None
    description: Optional[str] = None

class SourceReferenceSchema(BaseModel):
    documentId: Optional[str] = None
    pageNumbers: List[int] = Field(default_factory=list)
    originalTextSnippet: Optional[str] = None

class DermatologyConditionSchema(BaseModel):
    conditionName: str = Field(..., description="Official name of the dermatologic condition.")
    alternativeNames: List[str] = Field(default_factory=list, description="Synonyms or common names for the condition.")
    icd10Code: Optional[str] = Field(None, description="ICD-10 code if available and extractable.")
    overview: Optional[str] = Field(None, description="A brief overview or description of the condition.")
    etiology: Optional[EtiologySchema] = Field(None, description="Details regarding the cause and contributing factors.")
    clinicalPresentation: Optional[ClinicalPresentationSchema] = Field(None, description="Information about how the condition presents clinically.")
    diagnostics: Optional[DiagnosticsSchema] = Field(None, description="Methods and findings for diagnosing the condition.")
    differentialDiagnosis: List[DifferentialDiagnosisSchema] = Field(default_factory=list, description="Conditions that need to be differentiated from this one.")
    treatment: Optional[TreatmentSchema] = Field(None, description="Options and modalities for treating the condition.")
    prognosis: Optional[str] = Field(None, description="Expected outcome or course of the condition.")
    keyImageReferences: List[KeyImageReferenceSchema] = Field(default_factory=list, description="References to key images within the source PDFs.")
    notes: Optional[str] = Field(None, description="General additional notes about the condition.")
    sourceReferences: List[SourceReferenceSchema] = Field(default_factory=list, description="Specific textual sources within documents for the extracted information.")
    confidenceScore: Optional[float] = Field(None, ge=0.0, le=1.0, description="Overall confidence score (0.0 to 1.0) of the extracted and standardized entry.")
    lastRefinedTimestamp: Optional[datetime] = Field(None, description="Timestamp of the last refinement action on this entry.")