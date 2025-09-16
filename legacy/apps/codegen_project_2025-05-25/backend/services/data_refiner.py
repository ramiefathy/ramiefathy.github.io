import datetime
import uuid
import logging
from typing import Dict, Any, List, Optional
import re

# Configure logging for the entire module once
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Mock classes for development/testing purposes ---
class MockInfoExtractor:
    """
    A mock class simulating the InfoExtractor's capability to re-query an LLM.
    """
    def __init__(self):
        self.logger = logging.getLogger('MockInfoExtractor')
        self.logger.info("MockInfoExtractor initialized.")

    async def re_query_for_refinement(self, current_data: Dict[str, Any], feedback_prompt: str, api_key: str) -> Dict[str, Any]:
        """
        Simulates re-querying an LLM (e.g., Gemini Pro) for refinement.
        In a real scenario, this would make an actual API call to the LLM
        or to the InfoExtraction_Agent's endpoint.
        """
        self.logger.info(f"Re-querying for refinement with prompt: '{feedback_prompt}' for condition ID: {current_data.get('condition_id')}")
        
        # Simulate AI processing and returning a refined version
        refined_data = current_data.copy()
        
        # Simple simulation logic based on feedback_prompt
        if "concise" in feedback_prompt.lower() and "overview" in refined_data:
            if refined_data.get("overview"):
                refined_data["overview"] = f"AI-concised: {refined_data['overview'][:max(50, len(refined_data['overview']) - 20)]}..."
            else:
                refined_data["overview"] = "AI-concised: No prior overview, created a new one."
        
        if "treatment" in feedback_prompt.lower() and "treatment" in refined_data:
            if "generalManagement" not in refined_data["treatment"] or not refined_data["treatment"]["generalManagement"]:
                refined_data["treatment"]["generalManagement"] = "AI-suggested general management: Maintain good skin hygiene and avoid triggers."
            else:
                refined_data["treatment"]["generalManagement"] += " (AI-expanded)."

        if "diagnostic" in feedback_prompt.lower() and "diagnostics" in refined_data:
            if "diagnosticMethods" not in refined_data["diagnostics"] or not refined_data["diagnostics"]["diagnosticMethods"]:
                refined_data["diagnostics"]["diagnosticMethods"] = [{"methodName": "Clinical Examination", "details": "AI-suggested: based on characteristic rash and symptoms.", "utility": "Primary"}]
            else:
                if isinstance(refined_data["diagnostics"]["diagnosticMethods"], list):
                    refined_data["diagnostics"]["diagnosticMethods"].append({"methodName": "Biopsy (AI-added)", "details": "AI-suggested: For atypical cases or to rule out other conditions.", "utility": "Confirmatory"})
                else:
                    self.logger.warning(f"'diagnosticMethods' is not a list in {current_data.get('condition_id')}, cannot append AI suggestion.")
        
        # Simulate increased confidence after AI refinement
        refined_data["confidenceScore"] = min(1.0, refined_data.get("confidenceScore", 0.7) + 0.05) 
        
        # Add a note about AI refinement
        if "notes" not in refined_data:
            refined_data["notes"] = ""
        refined_data["notes"] += f"\n[AI Proposed Refinement on {datetime.datetime.now().isoformat()} based on: '{feedback_prompt}']"

        self.logger.info(f"Returning AI-refined data proposal for {current_data.get('condition_id')}")
        return refined_data

class MockDataStorage:
    """
    A mock class simulating the DataStorage_Download_Agent's persistent storage.
    Uses an in-memory dictionary for simplicity.
    """
    def __init__(self):
        self._data = {} # Simulates in-memory storage for conditions
        self.logger = logging.getLogger('MockDataStorage')
        self.logger.info("MockDataStorage initialized.")

    async def load_condition(self, condition_id: str) -> Optional[Dict[str, Any]]:
        """Loads a condition entry by ID from mock storage."""
        self.logger.debug(f"Loading condition {condition_id}")
        return self._data.get(condition_id)

    async def save_condition(self, condition_entry: Dict[str, Any]):
        """Saves a condition entry to mock storage."""
        condition_id = condition_entry.get("condition_id")
        if not condition_id:
            self.logger.error("Attempted to save condition without 'condition_id'.")
            raise ValueError("Condition entry must have a 'condition_id'.")
        self._data[condition_id] = condition_entry
        self.logger.debug(f"Saved condition {condition_id}")

    async def get_all_conditions(self) -> List[Dict[str, Any]]:
        """Returns all stored conditions."""
        return list(self._data.values())

    async def add_initial_condition(self, condition_entry: Dict[str, Any]):
        """Helper for initial data setup for testing."""
        if "condition_id" not in condition_entry:
            condition_entry["condition_id"] = str(uuid.uuid4())
        await self.save_condition(condition_entry)
        self.logger.info(f"Added initial condition {condition_entry['conditionName']} ({condition_entry['condition_id']})")
# --- End Mock classes ---

class DataRefiner:
    """
    Implements the core logic for the Data_Refinement_Agent.
    This includes functions to apply user edits to condition entries,
    manage version history, and optionally re-query the Gemini Pro API
    (via info_extractor.py) based on user feedback for AI-assisted refinement.
    """
    def __init__(self, info_extractor_service: MockInfoExtractor, data_storage_service: MockDataStorage):
        self.info_extractor_service = info_extractor_service
        self.data_storage_service = data_storage_service
        self.logger = logging.getLogger(__name__)
        self.logger.info("DataRefiner instance initialized.")

    async def _update_nested_dict(self, target_dict: Dict[str, Any], path: str, value: Any):
        """
        Updates a value in a nested dictionary given a dot-separated path,
        supporting explicit list indexing (e.g., "list_name[index].field").
        Handles creation of intermediate dictionaries if they don't exist.
        Raises errors if list is not found or index is out of bounds.
        """
        parts = path.split('.')
        current_level = target_dict

        for i, part in enumerate(parts):
            is_last_part = (i == len(parts) - 1)

            # Check for array access (e.g., 'key[index]')
            array_match = re.fullmatch(r'(\w+)\[(\d+)\]', part)

            if array_match:
                list_name = array_match.group(1)
                index = int(array_match.group(2))

                if list_name not in current_level or not isinstance(current_level[list_name], list):
                    self.logger.error(f"Path error: '{list_name}' is not a list or does not exist at '{'.'.join(parts[:i])}' for path '{path}'")
                    raise ValueError(f"Invalid path: '{list_name}' is not a list at this level.")

                target_list = current_level[list_name]

                if index >= len(target_list) or index < 0:
                    self.logger.error(f"Path error: Index {index} out of bounds for list '{list_name}' (size {len(target_list)}) at path '{'.'.join(parts[:i])}' for path '{path}'")
                    raise IndexError(f"Index {index} out of bounds for list '{list_name}'.")

                if is_last_part:
                    target_list[index] = value
                else:
                    if not isinstance(target_list[index], dict):
                        self.logger.error(f"Path error: Item at index {index} in list '{list_name}' is not a dictionary at path '{'.'.join(parts[:i])}' for path '{path}'")
                        raise TypeError(f"Invalid path: Item at index {index} in list '{list_name}' is not a dictionary; cannot descend further.")
                    current_level = target_list[index]
            else:
                # Regular dictionary key access
                if is_last_part:
                    current_level[part] = value
                else:
                    if part not in current_level or not isinstance(current_level[part], dict):
                        # Ensure intermediate path parts are dictionaries, create if not present
                        current_level[part] = {}
                    current_level = current_level[part]

    async def apply_user_edits(self, condition_id: str, edits: Dict[str, Any], user_id: str = "user") -> Optional[Dict[str, Any]]:
        """
        Applies user-provided edits to a specific dermatologic condition entry,
        records the change in history, and updates the entry in storage.

        Args:
            condition_id (str): The unique ID of the condition entry to edit.
            edits (Dict[str, Any]): A dictionary where keys are dot-separated paths
                                    to fields (e.g., "conditionName", "clinicalPresentation.symptoms")
                                    and values are the new data. Paths can include list indexing like "list_name[index].field".
            user_id (str): Identifier for the user making the edits.

        Returns:
            Optional[Dict[str, Any]]: The updated condition entry, or None if not found.
        """
        self.logger.info(f"Applying user edits for condition ID: {condition_id} by user: {user_id}")
        current_entry = await self.data_storage_service.load_condition(condition_id)

        if not current_entry:
            self.logger.warning(f"Condition with ID {condition_id} not found for editing.")
            return None

        changes_made_descriptions = []
        for path, new_value in edits.items():
            try:
                # Attempt to get the old value for logging before applying the update
                old_value_at_path = None
                try:
                    temp_val = current_entry
                    path_parts = path.split('.')
                    for part_idx, part in enumerate(path_parts):
                        array_match = re.fullmatch(r'(\w+)\[(\d+)\]', part)
                        if array_match:
                            list_name = array_match.group(1)
                            index = int(array_match.group(2))
                            if isinstance(temp_val, dict) and list_name in temp_val and isinstance(temp_val[list_name], list) and index < len(temp_val[list_name]):
                                temp_val = temp_val[list_name][index]
                            else:
                                temp_val = None # Path does not exist or invalid type
                                break
                        elif isinstance(temp_val, dict) and part in temp_val:
                            temp_val = temp_val[part]
                        else:
                            temp_val = None # Path does not exist
                            break
                    old_value_at_path = temp_val
                except (KeyError, TypeError, IndexError) as e:
                    self.logger.debug(f"Could not retrieve old value for path '{path}': {e}")
                    old_value_at_path = None # Path didn't fully resolve to a value

                await self._update_nested_dict(current_entry, path, new_value)
                
                # Compare old vs new for history description
                if old_value_at_path != new_value:
                    old_val_str = str(old_value_at_path)
                    new_val_str = str(new_value)
                    if old_value_at_path is None:
                        changes_made_descriptions.append(f"Added '{path}' with value: '{new_val_str[:200]}...'")
                    else:
                        changes_made_descriptions.append(f"Updated '{path}' from '{old_val_str[:200]}...' to '{new_val_str[:200]}...'")
                else:
                    self.logger.debug(f"Field '{path}' unchanged, skipping history entry.")

            except (ValueError, IndexError, TypeError) as e: # Catch specific errors from _update_nested_dict
                self.logger.error(f"Error applying edit for path '{path}': {e}", exc_info=True)
                changes_made_descriptions.append(f"Failed to apply edit for '{path}': {e}")
            except Exception as e: # Catch any other unexpected errors
                self.logger.error(f"An unexpected error occurred applying edit for path '{path}': {e}", exc_info=True)
                changes_made_descriptions.append(f"An unexpected error for '{path}': {e}")

        # Update metadata
        current_entry["lastRefinedTimestamp"] = datetime.datetime.now().isoformat()
        current_entry["last_refined_by_user"] = True # Indicates a direct user edit

        # Manage version history
        if "refinement_history" not in current_entry:
            current_entry["refinement_history"] = []

        if changes_made_descriptions:
            history_entry = {
                "timestamp": datetime.datetime.now().isoformat(),
                "user_action": "user_edited_fields",
                "user_id": user_id,
                "changes_made": "; ".join(changes_made_descriptions),
            }
            current_entry["refinement_history"].append(history_entry)
            self.logger.debug(f"Added history entry for {condition_id}: {history_entry}")
        else:
            self.logger.info(f"No effective changes detected for condition ID {condition_id} from provided edits.")

        await self.data_storage_service.save_condition(current_entry)
        self.logger.info(f"User edits applied and saved for condition ID: {condition_id}.")
        return current_entry

    async def request_ai_refinement(self, condition_id: str, feedback_prompt: str, api_key: str) -> Optional[Dict[str, Any]]:
        """
        Requests AI assistance (via InfoExtractor) to refine a condition entry
        based on user feedback. The AI's suggestion is returned for user review.

        Args:
            condition_id (str): The unique ID of the condition entry to refine.
            feedback_prompt (str): A natural language prompt/instruction for the AI.
            api_key (str): The API key for the LLM service (e.g., Gemini Pro).

        Returns:
            Optional[Dict[str, Any]]: A *proposed* refined version of the entry
                                      from the AI, or None if the entry is not found
                                      or AI refinement fails. This proposal is NOT
                                      saved as the final entry yet, it's for user review.
        """
        self.logger.info(f"Requesting AI refinement for condition ID: {condition_id} with prompt: '{feedback_prompt}'")
        current_entry = await self.data_storage_service.load_condition(condition_id)

        if not current_entry:
            self.logger.warning(f"Condition with ID {condition_id} not found for AI refinement.")
            return None

        try:
            # The info_extractor_service (e.g., InfoExtraction_Agent) returns a *proposed* refined entry.
            # It's up to the calling context (e.g., Frontend_Interface_Agent)
            # to present this to the user for acceptance/further modification.
            proposed_refined_entry = await self.info_extractor_service.re_query_for_refinement(
                current_entry, feedback_prompt, api_key
            )
            
            # Record the AI suggestion in history, but mark as "proposed"
            if "refinement_history" not in current_entry:
                current_entry["refinement_history"] = []

            # Calculate diff for ai_suggestion_preview
            ai_suggestion_preview = {}
            for k, v in proposed_refined_entry.items():
                # For top-level keys, if they differ, add to preview
                if k in current_entry and v != current_entry[k]:
                    ai_suggestion_preview[k] = v
                # Note: Deeper diffing for nested structures is complex and beyond
                # the scope of a simple history preview. For production,
                # a dedicated diffing utility might be needed.

            ai_history_entry = {
                "timestamp": datetime.datetime.now().isoformat(),
                "user_action": "ai_suggested_refinement",
                "feedback_prompt": feedback_prompt,
                "ai_suggestion_preview": ai_suggestion_preview,
                "status": "proposed" # Indicates this is an AI suggestion pending user approval
            }
            current_entry["refinement_history"].append(ai_history_entry)
            await self.data_storage_service.save_condition(current_entry) # Save the history of the suggestion

            self.logger.info(f"AI refinement requested and proposed for condition ID: {condition_id}. Proposal returned.")
            return proposed_refined_entry

        except Exception as e:
            self.logger.error(f"Failed to get AI refinement for condition ID {condition_id}: {e}", exc_info=True)
            return None

    async def get_refinement_history(self, condition_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves the version history for a specific dermatologic condition entry.

        Args:
            condition_id (str): The unique ID of the condition entry.

        Returns:
            List[Dict[str, Any]]: A list of historical changes for the entry.
                                  Returns an empty list if no history or entry not found.
        """
        self.logger.info(f"Retrieving refinement history for condition ID: {condition_id}")
        current_entry = await self.data_storage_service.load_condition(condition_id)

        if not current_entry:
            self.logger.warning(f"Condition with ID {condition_id} not found for history retrieval.")
            return []

        return current_entry.get("refinement_history", [])

# Example of how to use DataRefiner (for testing or integration)
async def main():
    # Adjust specific loggers to DEBUG to see more detail for mocks
    logging.getLogger(__name__).setLevel(logging.DEBUG) # DataRefiner logger
    logging.getLogger('MockInfoExtractor').setLevel(logging.DEBUG)
    logging.getLogger('MockDataStorage').setLevel(logging.DEBUG)


    # Initialize mock services
    mock_info_extractor = MockInfoExtractor()
    mock_data_storage = MockDataStorage()
    refiner = DataRefiner(mock_info_extractor, mock_data_storage)

    # Define a sample initial condition (conforming to the schema)
    initial_condition_data = {
        "condition_id": "derm_cond_1",
        "conditionName": "Atopic Dermatitis",
        "alternativeNames": ["Eczema"],
        "icd10Code": "L20.9",
        "overview": "A common, chronic inflammatory skin condition characterized by itchy, red, inflamed skin, often with a typical distribution pattern.",
        "etiology": {"description": "Complex interplay of genetics, immune dysfunction, and environmental factors leading to barrier defects.", "contributingFactors": []},
        "clinicalPresentation": {
            "symptoms": ["Intense pruritus (itching)", "Dry skin", "Erythema", "Lichenification in chronic cases"],
            "signs": [{
                "morphology": "Erythematous papules and plaques, excoriations",
                "color": "Red to brownish-gray",
                "size": "Variable",
                "shape": "Irregular",
                "arrangement": "Patches, confluent areas",
                "distribution": "Flexural surfaces (antecubital/popliteal fossae), neck, face in infants"
            }],
            "commonSites": ["Antecubital fossae", "Popliteal fossae", "Neck", "Face", "Hands"]
        },
        "diagnostics": {
            "diagnosticMethods": [
                {"methodName": "Clinical Diagnosis", "findings": "Based on characteristic presentation and history (e.g., Hanifin and Rajka criteria).", "utility": "Primary"}
            ],
            "laboratoryTests": ["Elevated IgE (common, not diagnostic)", "Eosinophilia (common, not diagnostic)"],
            "imaging": []
        },
        "differentialDiagnosis": [
            {"conditionName": "Contact Dermatitis", "distinguishingFeatures": "Often localized to contact area, specific allergen exposure history."},
            {"conditionName": "Seborrheic Dermatitis", "distinguishingFeatures": "Greasy scales, typically on scalp, face, chest."}
        ],
        "treatment": {
            "treatment modalities": [
                {
                    "modalityType": "Topical",
                    "specificTreatments": [
                        {"name": "Topical Corticosteroids", "dosageAdministration": "Low to high potency, as directed.", "indications": "Acute flares, inflammation control.", "contraindications": "Long-term use on thin skin.", "sideEffects": "Skin atrophy.", "notes": "First-line for inflammation."},
                        {"name": "Topical Calcineurin Inhibitors", "dosageAdministration": "Pimecrolimus, Tacrolimus twice daily.", "indications": "Face, intertriginous areas, long-term maintenance.", "contraindications": "None specific.", "sideEffects": "Burning, stinging.", "notes": "Steroid-sparing."}
                    ]
                },
                {
                    "modalityType": "Systemic",
                    "specificTreatments": [
                        {"name": "Systemic Corticosteroids", "dosageAdministration": "Oral Prednisone, short course.", "indications": "Severe acute flares.", "contraindications": "Long-term use.", "sideEffects": "Numerous.", "notes": "Bridge therapy."}
                    ]
                }
            ],
            "generalManagement": "Moisturizers, gentle cleansers, avoiding irritants."
        },
        "prognosis": "Chronic, often improves with age but can persist into adulthood.",
        "keyImageReferences": [
            {"pdfSource": "DermatologyTextbook.pdf", "pageNumber": 125, "figureCaption": "Fig 5.2: Atopic Dermatitis lesions in flexural areas.", "description": "Classic presentation of AD in an adult."}
        ],
        "notes": "Patient education is key for long-term management.",
        "sourceReferences": [
            {"documentId": "DermatologyTextbook.pdf", "pageNumbers": [120, 128], "originalTextSnippet": "Atopic dermatitis is a chronic inflammatory skin condition..."}
        ],
        "confidenceScore": 0.90,
        "lastRefinedTimestamp": datetime.datetime.now().isoformat(),
        "last_refined_by_user": False,
        "refinement_history": []
    }

    await mock_data_storage.add_initial_condition(initial_condition_data.copy())

    print("\n--- Initial State ---")
    retrieved_condition = await mock_data_storage.load_condition("derm_cond_1")
    print(f"Condition: {retrieved_condition['conditionName']}, Symptoms: {retrieved_condition['clinicalPresentation']['symptoms']}")
    print(f"Initial History: {await refiner.get_refinement_history('derm_cond_1')}")

    # Test 1: Apply user edits
    user_edits_1 = {
        "clinicalPresentation.symptoms": ["Intense itching", "Dry skin", "Erythema", "Lichenification", "Crusting (from excoriations)"],
        "icd10Code": "L20.89", # More specific ICD-10
        "notes": "User added crusting as a symptom and updated ICD-10 for 'other atopic dermatitis'."
    }
    await refiner.apply_user_edits("derm_cond_1", user_edits_1, user_id="derm_expert_1")

    print("\n--- After First User Edits ---")
    retrieved_condition_after_edit_1 = await mock_data_storage.load_condition("derm_cond_1")
    print(f"Condition: {retrieved_condition_after_edit_1['conditionName']}, Symptoms: {retrieved_condition_after_edit_1['clinicalPresentation']['symptoms']}")
    print(f"ICD-10: {retrieved_condition_after_edit_1['icd10Code']}")
    print(f"Notes: {retrieved_condition_after_edit_1['notes']}")
    print(f"History after Edit 1: {await refiner.get_refinement_history('derm_cond_1')}")

    # Test 2: Request AI refinement
    ai_feedback_prompt_1 = "Refine the overview to be more concise and ensure diagnostic methods are clearly listed."
    gemini_api_key = "YOUR_GEMINI_PRO_API_KEY" # Replace with actual key in a real deployment

    print("\n--- Requesting AI Refinement (Round 1) ---")
    proposed_ai_refinement_1 = await refiner.request_ai_refinement("derm_cond_1", ai_feedback_prompt_1, gemini_api_key)

    if proposed_ai_refinement_1:
        print("\n--- Proposed AI Refinement (Round 1 - For User Review) ---")
        print(f"AI Proposed Overview: {proposed_ai_refinement_1.get('overview')}")
        print(f"AI Proposed Diagnostic Methods: {proposed_ai_refinement_1['diagnostics'].get('diagnosticMethods')}")
        print(f"AI Proposed Confidence Score: {proposed_ai_refinement_1.get('confidenceScore')}")
    else:
        print("AI Refinement (Round 1) failed or returned no proposal.")

    # Show history after AI suggestion (before user acceptance)
    print("\n--- History after AI Suggestion (Round 1) ---")
    print(f"History: {await refiner.get_refinement_history('derm_cond_1')}")

    # Test 3: User accepts AI refinement (simulated by applying the proposed changes as user edits)
    if proposed_ai_refinement_1:
        print("\n--- User accepts AI refinement (Round 1) ---")
        accepted_edits_from_ai_1 = {
            "overview": proposed_ai_refinement_1["overview"],
            "diagnostics.diagnosticMethods": proposed_ai_refinement_1["diagnostics"]["diagnosticMethods"],
            "confidenceScore": proposed_ai_refinement_1["confidenceScore"],
            "notes": (retrieved_condition_after_edit_1.get("notes", "") + proposed_ai_refinement_1.get("notes", ""))
        }
        await refiner.apply_user_edits("derm_cond_1", accepted_edits_from_ai_1, user_id="derm_expert_1")

        print("\n--- After User Accepted AI Refinement (Round 1) ---")
        final_condition_1 = await mock_data_storage.load_condition("derm_cond_1")
        print(f"Condition: {final_condition_1['conditionName']}")
        print(f"Overview: {final_condition_1['overview']}")
        print(f"Diagnostic Methods: {final_condition_1['diagnostics']['diagnosticMethods']}")
        print(f"Final Confidence Score: {final_condition_1['confidenceScore']}")
        print(f"History after Acceptance (Round 1): {await refiner.get_refinement_history('derm_cond_1')}")
    else:
        print("Skipping AI acceptance test as no proposal was made.")

    # Test 4: Another user edit, proving iterative refinement
    user_edits_2 = {
        "treatment.treatment modalities[1].specificTreatments[0].notes": "Systemic corticosteroids are for severe, acute flares and require careful tapering.",
        "etiology.contributingFactors": ["Genetic predisposition", "Immune dysregulation", "Skin barrier dysfunction", "Environmental allergens/irritants"]
    }
    await refiner.apply_user_edits("derm_cond_1", user_edits_2, user_id="clinical_reviewer_2")

    print("\n--- After Second User Edits ---")
    retrieved_condition_after_edit_2 = await mock_data_storage.load_condition("derm_cond_1")
    print(f"Condition Name: {retrieved_condition_after_edit_2['conditionName']}")
    print(f"Systemic Corticosteroids Notes: {retrieved_condition_after_edit_2['treatment']['treatment modalities'][1]['specificTreatments'][0]['notes']}")
    print(f"Etiology Contributing Factors: {retrieved_condition_after_edit_2['etiology']['contributingFactors']}")
    print(f"History after Edit 2: {await refiner.get_refinement_history('derm_cond_1')}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())