from flask import Blueprint, request, jsonify, send_file
import os
import uuid
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize a Blueprint for condition-related routes
condition_bp = Blueprint('condition', __name__)

# --- Helper function for deep merging dictionaries ---
def _deep_merge_dicts(target, source):
    """
    Recursively merges source dictionary into target dictionary.
    For lists, it appends unique items, converting dicts to JSON strings for uniqueness checks.
    """
    for k, v in source.items():
        if k in target and isinstance(target[k], dict) and isinstance(v, dict):
            target[k] = _deep_merge_dicts(target[k], v)
        elif k in target and isinstance(target[k], list) and isinstance(v, list):
            # For lists, append new unique items. Convert dicts to JSON strings for uniqueness check.
            existing_items_json = {json.dumps(item, sort_keys=True) for item in target[k] if isinstance(item, dict)}
            existing_items_non_dict = {item for item in target[k] if not isinstance(item, dict)}

            for item in v:
                if isinstance(item, dict):
                    if json.dumps(item, sort_keys=True) not in existing_items_json:
                        target[k].append(item)
                        existing_items_json.add(json.dumps(item, sort_keys=True))
                else:
                    if item not in existing_items_non_dict:
                        target[k].append(item)
                        existing_items_non_dict.add(item)
        else:
            target[k] = v
    return target

# --- Mock Data Manager and Data Refiner for demonstration purposes ---
# In a real multi-agent system, these would be imported from the respective
# service modules (e.g., backend.services.data_manager, backend.services.data_refiner).
# For this raw file, we include a mock to make the code runnable and demonstrate interaction.

class MockDataManager:
    """
    A mock class simulating the Data_Storage_Download_Agent's functionalities
    for managing dermatologic condition entries.
    In a real application, this would interact with a database.
    """
    _conditions = {} # In-memory dictionary to store condition entries by ID

    def __init__(self):
        # Populate with some initial mock data
        self._populate_mock_data()

    def _populate_mock_data(self):
        # Example structured data based on the detailed StandardizedDermatologyConditionSchema
        condition1_id = str(uuid.uuid4())
        self._conditions[condition1_id] = {
            "conditionId": condition1_id,
            "conditionName": "Atopic Dermatitis",
            "alternativeNames": ["Eczema", "AD"],
            "icd10Code": ["L20.81"], # Keeping as list based on "ICD-10 Code(s)" in prompt
            "overview": "Chronic inflammatory skin condition characterized by intensely itchy, dry skin, often associated with a personal or family history of allergies.",
            "etiology": {
                "description": "Complex interplay of genetic, environmental, and immunological factors leading to skin barrier dysfunction (e.g., filaggrin mutations) and immune dysregulation (Th2-mediated inflammation).",
                "contributingFactors": ["Genetic predisposition", "Environmental allergens", "Irritants", "Microbiome dysbiosis"]
            },
            "clinicalPresentation": {
                "symptoms": ["Pruritus (itching)", "Dry skin (xerosis)", "Skin sensitivity"],
                "signs": [
                    {"morphology": "Erythematous papules and plaques", "color": "Red/violaceous", "size": "Variable", "shape": "Ill-defined to well-demarcated", "arrangement": "Patches", "distribution": "Flexural surfaces (antecubital and popliteal fossae), face, neck, hands, feet."}
                ],
                "commonSites": ["Face", "Neck", "Elbows (flexural)", "Knees (flexural)", "Hands", "Feet"],
            },
            "diagnostics": {
                "diagnosticMethods": [
                    {"methodName": "Clinical Diagnosis", "findings": "Based on characteristic morphology and distribution, associated symptoms like pruritus, and medical history (e.g., Hanifin and Rajka criteria, UK Working Party criteria).", "utility": "Primary diagnostic approach, no specific lab test."}
                ],
                "laboratoryTests": ["IgE levels (often elevated)", "Eosinophilia (sometimes)"],
                "imaging": []
            },
            "differentialDiagnosis": [
                {"conditionName": "Psoriasis", "distinguishingFeatures": "Sharply demarcated plaques with silvery scales, extensor surfaces."},
                {"conditionName": "Contact Dermatitis", "distinguishingFeatures": "Acute onset after exposure, often localized to contact area."},
                {"conditionName": "Seborrheic Dermatitis", "distinguishingFeatures": "Greasy scales, typically on scalp, face, chest."}
            ],
            "treatment": {
                "treatment_modalities": [
                    {
                        "modalityType": "Topical",
                        "specificTreatments": [
                            {"name": "Topical Corticosteroids", "dosageAdministration": "Applied once or twice daily during flares, various potencies.", "indications": "Acute flares, inflammation control.", "contraindications": "Long-term high potency use on thin skin.", "sideEffects": "Skin atrophy, striae, telangiectasias.", "notes": "First-line for acute exacerbations."},
                            {"name": "Topical Calcineurin Inhibitors (e.g., Tacrolimus, Pimecrolimus)", "dosageAdministration": "Applied twice daily.", "indications": "Long-term management, steroid-sparing.", "contraindications": "None specific beyond hypersensitivity.", "sideEffects": "Transient burning/stinging.", "notes": "Alternative to corticosteroids, especially on face/folds."}
                        ]
                    },
                    {
                        "modalityType": "General Management",
                        "specificTreatments": [
                            {"name": "Emollients/Moisturizers", "dosageAdministration": "Apply generously and frequently (multiple times daily), especially after bathing.", "indications": "Skin barrier restoration, symptom relief.", "contraindications": "None.", "sideEffects": "Rare, occasional irritation.", "notes": "Cornerstone of AD management."}
                        ]
                    }
                ],
                "generalManagement": "Avoidance of triggers (e.g., harsh soaps, irritants, specific allergens if identified). Lukewarm baths with mild cleansers, followed by immediate moisturization. Wet wrap therapy for severe flares."
            },
            "prognosis": "Chronic, relapsing course. Often improves spontaneously with age, especially in children, but can persist or reappear in adulthood. Severity is variable.",
            "keyImageReferences": [
                {"pdfSource": "Derm Textbook A.pdf", "pageNumber": 12, "figureCaption": "Typical flexural eczema in an adolescent.", "description": "Image showing erythematous, lichenified plaques in the antecubital fossa."}
            ],
            "notes": "Common in infants and children. Often associated with personal or family history of asthma, allergic rhinitis, or food allergies (Atopic Triad).",
            "sourceReferences": [
                {"documentId": "Derm Textbook A.pdf", "pageNumbers": [10, 11, 13], "originalTextSnippet": "Atopic dermatitis is a chronic, relapsing inflammatory skin condition..."}
            ],
            "confidenceScore": 0.95,
            "lastRefinedTimestamp": datetime.utcnow().isoformat() + "Z"
        }

        condition2_id = str(uuid.uuid4())
        self._conditions[condition2_id] = {
            "conditionId": condition2_id,
            "conditionName": "Psoriasis",
            "alternativeNames": ["Psoriatic disease"],
            "icd10Code": ["L40.0", "L40.5"], # Keeping as list
            "overview": "Chronic autoimmune inflammatory disease primarily affecting the skin, characterized by well-demarcated, red, scaly plaques. Can also involve nails and joints.",
            "etiology": {
                "description": "Genetic predisposition (e.g., HLA-Cw6) with environmental triggers (e.g., infections, trauma, stress, medications), leading to an aberrant immune response (Th17/Th1-mediated) causing rapid keratinocyte proliferation.",
                "contributingFactors": ["Genetics", "Stress", "Infections (e.g., Strep throat for guttate psoriasis)", "Skin trauma (Koebner phenomenon)", "Medications (e.g., Beta-blockers, Lithium)"]
            },
            "clinicalPresentation": {
                "symptoms": ["Pruritus", "Burning sensation", "Pain"],
                "signs": [
                    {"morphology": "Erythematous plaques with silvery scales", "color": "Red", "size": "Variable", "shape": "Well-demarcated", "arrangement": "Scattered, symmetrical", "distribution": "Extensor surfaces (elbows, knees), scalp, lower back, intergluteal cleft, nails."}
                ],
                "commonSites": ["Scalp", "Elbows", "Knees", "Lower back", "Nails", "Palms", "Soles"],
            },
            "diagnostics": {
                "diagnosticMethods": [
                    {"methodName": "Clinical Diagnosis", "findings": "Characteristic silvery scales on erythematous plaques, Koebner phenomenon (lesions appearing at sites of trauma), Auspitz sign (pinpoint bleeding after scale removal).", "utility": "Often sufficient for diagnosis."},
                    {"methodName": "Skin biopsy", "findings": "Histopathology shows epidermal hyperplasia (acanthosis), parakeratosis, elongation of rete ridges, Munro microabscesses, dilated dermal capillaries.", "utility": "Confirmatory in atypical cases or for research."}
                ],
                "laboratoryTests": [],
                "imaging": ["X-rays for psoriatic arthritis (if joint involvement suspected)"]
            },
            "differentialDiagnosis": [
                {"conditionName": "Atopic Dermatitis", "distinguishingFeatures": "More diffuse, less demarcated, flexural distribution, intense pruritus."},
                {"conditionName": "Seborrheic Dermatitis", "distinguishingFeatures": "Greasy, yellowish scales, typically on scalp, face, chest, less inflammatory."},
                {"conditionName": "Lichen Planus", "distinguishingFeatures": "Pruritic, purple, polygonal papules, often on wrists/ankles, Wickham striae."}
            ],
            "treatment": {
                "treatment_modalities": [
                    {
                        "modalityType": "Topical",
                        "specificTreatments": [
                            {"name": "Topical Corticosteroids", "dosageAdministration": "Various potencies, applied once or twice daily.", "indications": "Localized plaque psoriasis.", "contraindications": "Long-term use on face/folds.", "sideEffects": "Skin atrophy, striae.", "notes": "First-line for mild to moderate disease."},
                            {"name": "Vitamin D Analogues (e.g., Calcipotriene)", "dosageAdministration": "Applied once or twice daily.", "indications": "Plaque psoriasis.", "contraindications": "Hypercalcemia (rare).", "sideEffects": "Irritation, burning.", "notes": "Often combined with topical corticosteroids."}
                        ]
                    },
                    {
                        "modalityType": "Phototherapy",
                        "specificTreatments": [
                            {"name": "Narrowband UVB (NBUVB)", "dosageAdministration": "Controlled exposure to UV light, 2-3 times/week.", "indications": "Moderate-to-severe widespread psoriasis.", "contraindications": "Photosensitivity.", "sideEffects": "Erythema, increased skin cancer risk over time.", "notes": "Highly effective, well-tolerated."}
                        ]
                    },
                    {
                        "modalityType": "Systemic",
                        "specificTreatments": [
                            {"name": "Methotrexate", "dosageAdministration": "Weekly oral or subcutaneous dose.", "indications": "Severe plaque psoriasis, psoriatic arthritis.", "contraindications": "Liver disease, pregnancy.", "sideEffects": "Hepatotoxicity, myelosuppression.", "notes": "Long-standing systemic option."},
                            {"name": "Biologics (e.g., Adalimumab, Secukinumab)", "dosageAdministration": "Subcutaneous injections, varying frequencies.", "indications": "Moderate-to-severe plaque psoriasis, psoriatic arthritis unresponsive to conventional therapy.", "contraindications": "Active infection.", "sideEffects": "Increased infection risk, injection site reactions.", "notes": "Highly effective targeted therapies."}
                        ]
                    }
                ],
                "generalManagement": "Moisturizers, tar preparations, salicylic acid for scale reduction. Stress reduction. Avoidance of triggers like smoking and excessive alcohol consumption."
            },
            "prognosis": "Chronic, lifelong condition with unpredictable course of remissions and exacerbations. Affects approximately 2-3% of the global population. Can be associated with psoriatic arthritis (up to 30% of patients), metabolic syndrome, and cardiovascular disease.",
            "keyImageReferences": [
                {"pdfSource": "Derm Journal X.pdf", "pageNumber": 52, "figureCaption": "Characteristic psoriatic plaques on the elbow.", "description": "Close-up of well-demarcated, erythematous plaque with silvery scales on an elbow."}
            ],
            "notes": "Psoriasis can significantly impact quality of life due to its visible nature and associated symptoms.",
            "sourceReferences": [
                {"documentId": "Derm Journal X.pdf", "pageNumbers": [50, 53, 54], "originalTextSnippet": "Psoriasis is a chronic inflammatory skin condition..."}
            ],
            "confidenceScore": 0.90,
            "lastRefinedTimestamp": datetime.utcnow().isoformat() + "Z"
        }

    def get_all_conditions(self):
        """Returns a list of all stored condition entries."""
        logger.info("DataManager: Fetching all conditions.")
        return list(self._conditions.values())

    def get_condition_by_id(self, condition_id: str):
        """Returns a single condition entry by its ID."""
        logger.info(f"DataManager: Fetching condition {condition_id}.")
        return self._conditions.get(condition_id)

    def update_condition(self, condition_id: str, new_data: dict):
        """
        Updates an existing condition entry with new data.
        Performs a deep merge for top-level keys and updates nested dicts/lists.
        Also logs changes to refinement history.
        """
        logger.info(f"DataManager: Attempting to update condition {condition_id}.")
        current_data = self._conditions.get(condition_id)
        if not current_data:
            logger.warning(f"DataManager: Condition {condition_id} not found for update.")
            return None

        # Apply updates to the current data using the helper deep merge function
        updated_data = _deep_merge_dicts(current_data, new_data)
        
        # Mark as user refined and update timestamp
        updated_data["lastRefinedByUser"] = True
        updated_data["lastRefinedTimestamp"] = datetime.utcnow().isoformat() + "Z"

        # Log to refinement history (simplified for mock)
        if "refinementHistory" not in updated_data:
            updated_data["refinementHistory"] = []
        
        # A more detailed change tracking would compare old_data vs new_data
        updated_data["refinementHistory"].append({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "user_action": "edited_fields",
            "changes_made": f"User updated {len(new_data)} top-level fields.", # Could be more specific about changed paths
            "payload_snippet": json.dumps(new_data, indent=None, ensure_ascii=False)[:200] + ("..." if len(json.dumps(new_data)) > 200 else "")
        })

        self._conditions[condition_id] = updated_data
        logger.info(f"DataManager: Successfully updated condition {condition_id}.")
        return updated_data

    def export_conditions(self, condition_ids: list = None, format: str = "json"):
        """
        Exports condition data to a file.
        In a real application, this would save to a persistent storage and return a path.
        """
        logger.info(f"DataManager: Preparing to export conditions. Format: {format}.")
        
        data_to_export = []
        if condition_ids:
            for cid in condition_ids:
                if cid in self._conditions:
                    data_to_export.append(self._conditions[cid])
                else:
                    logger.warning(f"Condition ID {cid} not found for export.")
        else:
            data_to_export = list(self._conditions.values())
        
        if not data_to_export:
            logger.info("No conditions found to export.")
            return None 

        output_dir = "temp_downloads"
        os.makedirs(output_dir, exist_ok=True)
        
        file_name = f"dermrefgen_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        file_path = os.path.join(output_dir, file_name)

        if format == "json":
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data_to_export, f, indent=2, ensure_ascii=False)
            logger.info(f"DataManager: Exported {len(data_to_export)} conditions to {file_path}.")
            return file_path
        else:
            logger.error(f"DataManager: Unsupported export format requested: {format}.")
            raise ValueError(f"Unsupported export format: {format}")

# Instantiate the mock data manager.
# In a real Flask app, this might be managed by a dependency injection system
# or initialized in the main app factory and passed to blueprints.
data_manager = MockDataManager()

# Mock for Data_Refinement_Agent's potential interaction
# For this endpoint, the data refinement agent's full logic is not exposed directly
# via a simple PUT. The PUT is for saving user edits. If AI-assisted refinement
# were triggered, it would happen potentially within the data_manager.update_condition
# or a separate endpoint that calls data_refiner.
# For simplicity, we'll assume the PUT directly updates data, and the refinement agent
# works on its own schedule or via other specific AI-triggering endpoints if needed.
# from backend.services import data_refiner # Placeholder for real import
# class MockDataRefiner:
#    def trigger_ai_refinement(self, condition_id, initial_data, user_feedback_prompt):
#        logger.info(f"MockDataRefiner: Triggering AI refinement for {condition_id} with prompt: {user_feedback_prompt}")
#        # Simulate AI processing and update data_manager
#        refined_data = initial_data.copy()
#        refined_data['overview'] = refined_data['overview'] + " (AI refined)"
#        data_manager.update_condition(condition_id, refined_data) # This would be an internal call
#        return refined_data
# data_refiner = MockDataRefiner()


# --- API Endpoints ---

@condition_bp.route('/conditions', methods=['GET'])
def get_all_condition_entries():
    """
    Retrieves all dermatologic condition entries.
    Success is seamless CRUD operations and data export for condition entries.
    """
    logger.info("Received GET /conditions request.")
    try:
        conditions = data_manager.get_all_conditions()
        return jsonify(conditions), 200
    except Exception as e:
        logger.error(f"Error fetching all conditions: {e}", exc_info=True)
        return jsonify({"message": "An error occurred while retrieving conditions.", "error": str(e)}), 500

@condition_bp.route('/conditions/<string:condition_id>', methods=['GET'])
def get_single_condition_entry(condition_id):
    """
    Retrieves a single dermatologic condition entry by its unique ID.
    Success is seamless CRUD operations and data export for condition entries.
    """
    logger.info(f"Received GET /conditions/{condition_id} request.")
    try:
        condition = data_manager.get_condition_by_id(condition_id)
        if condition:
            return jsonify(condition), 200
        else:
            logger.warning(f"Condition with ID {condition_id} not found.")
            return jsonify({"message": "Condition not found."}), 404
    except Exception as e:
        logger.error(f"Error fetching condition {condition_id}: {e}", exc_info=True)
        return jsonify({"message": f"An error occurred while retrieving condition {condition_id}.", "error": str(e)}), 500

@condition_bp.route('/conditions/<string:condition_id>', methods=['PUT'])
def update_condition_entry(condition_id):
    """
    Updates (refines) a single dermatologic condition entry.
    This route is typically used for user-driven refinements.
    Success is seamless CRUD operations and data export for condition entries.
    """
    logger.info(f"Received PUT /conditions/{condition_id} request for update/refinement.")
    if not request.is_json:
        logger.warning("Update request has non-JSON content type.")
        return jsonify({"message": "Request must be JSON."}), 400
    
    update_data = request.get_json()
    if not update_data:
        logger.warning("Update request received with empty JSON payload.")
        return jsonify({"message": "No data provided for update."}), 400

    try:
        updated_condition = data_manager.update_condition(condition_id, update_data)
        if updated_condition:
            logger.info(f"Condition {condition_id} updated successfully.")
            # If there was an AI refinement process tied to this PUT, it would be triggered here
            # e.g., if "ai_refine_prompt" in update_data:
            #     data_refiner.trigger_ai_refinement(condition_id, updated_condition, update_data["ai_refine_prompt"])
            #     # Then potentially re-fetch the condition after AI processing if it's asynchronous
            return jsonify(updated_condition), 200
        else:
            logger.warning(f"Condition with ID {condition_id} not found for update.")
            return jsonify({"message": "Condition not found or could not be updated."}), 404
    except Exception as e:
        logger.error(f"Error updating condition {condition_id}: {e}", exc_info=True)
        return jsonify({"message": f"An error occurred while updating condition {condition_id}.", "error": str(e)}), 500

@condition_bp.route('/conditions/download', methods=['POST'])
def download_condition_entries():
    """
    Triggers data download of selected or all condition entries.
    The output is a JSON file conforming to the specified schema.
    Success is seamless CRUD operations and data export for condition entries.
    """
    logger.info("Received POST /conditions/download request.")
    if not request.is_json:
        logger.warning("Download request has non-JSON content type.")
        return jsonify({"message": "Request must be JSON."}), 400
    
    request_data = request.get_json()
    # Expects {'condition_ids': ['id1', 'id2'], 'format': 'json'}
    condition_ids_to_download = request_data.get('condition_ids', None)
    download_format = request_data.get('format', 'json').lower()

    if download_format != 'json':
        logger.warning(f"Unsupported download format requested: {download_format}.")
        return jsonify({"message": f"Unsupported download format: '{download_format}'. Only 'json' is supported."}), 400

    try:
        file_path = data_manager.export_conditions(condition_ids=condition_ids_to_download, format=download_format)
        
        if file_path and os.path.exists(file_path):
            logger.info(f"Successfully generated download file: {file_path}")
            # Use a callback to delete the file after it's sent
            @request.after_serving
            def remove_file():
                try:
                    os.remove(file_path)
                    logger.info(f"Successfully cleaned up temporary file: {file_path}")
                except Exception as e:
                    logger.error(f"Error cleaning up temporary file {file_path}: {e}", exc_info=True)

            return send_file(
                file_path,
                mimetype='application/json',
                as_attachment=True,
                download_name=os.path.basename(file_path)
            ), 200
        else:
            logger.error("Failed to generate download file (file_path is None or file does not exist).")
            return jsonify({"message": "No data available for download or an error occurred during file generation. Check logs for details."}), 500
            
    except ValueError as ve:
        logger.error(f"Validation error during download request: {ve}", exc_info=True)
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        logger.error(f"Unexpected error during condition download: {e}", exc_info=True)
        return jsonify({"message": "An unexpected error occurred during the download process.", "error": str(e)}), 500