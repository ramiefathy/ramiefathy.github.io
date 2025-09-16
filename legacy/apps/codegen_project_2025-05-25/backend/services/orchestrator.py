import uuid
import os
import datetime
import logging
from typing import List, Dict, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Mock classes for demonstration purposes as actual service implementations are not provided yet.
# In a real system, these would be proper service classes imported from their respective modules.

class PDFProcessorService:
    """
    Mock PDF Processing Agent. Simulates extracting text and metadata from a PDF.
    """
    def process_pdf(self, file_path: str, document_id: str) -> Dict[str, Any]:
        """
        Simulates processing a PDF file.

        Args:
            file_path (str): The path to the PDF file.
            document_id (str): The unique ID for the document.

        Returns:
            Dict: Contains processed text and metadata.
        """
        # In a real scenario, this would use libraries like PyPDF2, pdfminer.six, or PyMuPDF
        logger.info(f"PDFProcessorService: Processing PDF '{os.path.basename(file_path)}' for document ID: {document_id}")
        
        # Simulate extracted content adhering to the spirit of the data flow
        # Example data based on the provided PDF content snippets
        extracted_text = {
            "title": f"Dermatology Reference Document {document_id[-4:]}",
            "pages": {
                "1": "Eczema, also known as atopic dermatitis, is a chronic inflammatory skin condition characterized by itchy, inflamed skin.",
                "2": "Psoriasis presents as red, scaly patches on the skin, often on extensor surfaces. Treatment options include topical corticosteroids and phototherapy."
            }
        }
        metadata = {
            "filename": os.path.basename(file_path),
            "total_pages": len(extracted_text["pages"]),
            "extraction_date": datetime.datetime.now().isoformat()
        }
        return {"processed_text": extracted_text, "metadata": metadata}

class InfoExtractorService:
    """
    Mock Information Extraction Agent (Gemini Pro powered). Simulates identifying
    and extracting information about dermatologic conditions, adhering to the
    StandardizedDermatologyConditionSchema.
    """
    def extract_conditions(self, document_id: str, processed_text: Dict[str, Any], api_key: str) -> List[Dict[str, Any]]:
        """
        Simulates extracting dermatologic conditions and their details.

        Args:
            document_id (str): The unique ID of the document.
            processed_text (Dict): The text extracted from the PDF.
            api_key (str): API key for the LLM service.

        Returns:
            List[Dict]: A list of standardized dermatologic condition entries conforming to the schema.
        """
        logger.info(f"InfoExtractorService: Extracting conditions for document ID: {document_id} (using API key: {'*' * (len(api_key) - 4) + api_key[-4:] if api_key else 'None'})")
        
        # Simulate condition extraction based on the provided schema example
        condition_id_1 = str(uuid.uuid4())
        condition_id_2 = str(uuid.uuid4())
        
        return [
            {
                "condition_id": condition_id_1,
                "condition_name": "Eczema",
                "alternate_names": ["Atopic Dermatitis"],
                "icd_10_codes": ["L20.9"],
                "summary": "A common chronic inflammatory skin condition.",
                "etiology_pathophysiology": {
                    "description": "Complex interplay of genetic, environmental, and immunological factors.",
                    "contributingFactors": ["Filaggrin mutations", "Allergens", "Irritants"]
                },
                "clinical_presentation": {
                    "symptoms": ["Pruritus (intense itching)", "Dry skin"],
                    "signs": [
                        {
                            "morphology": "Erythematous patches and plaques", 
                            "color": "Red", 
                            "size": "Variable",
                            "shape": "Irregular",
                            "arrangement": "Diffuse",
                            "distribution": "Flexural areas (e.g., elbows, knees)"
                        }
                    ],
                    "common_sites": ["Face", "Neck", "Flexural folds"]
                },
                "diagnostic_methods": {
                    "diagnostic_methods": [{"method_name": "Clinical diagnosis", "details": "Based on characteristic rash and itching"}],
                    "laboratory_tests": [],
                    "imaging": []
                },
                "differential_diagnosis": [
                    {"condition_name": "Contact Dermatitis", "distinguishingFeatures": "Often presents acutely after exposure to an allergen/irritant."}
                ],
                "treatment_options": {
                    "treatment_modalities": [
                        {"modality": "Topical", "specific_treatments": [{"treatment_name": "Topical Corticosteroids", "dosageAdministration": "Once or twice daily", "efficacy_notes": "Reduces inflammation", "side_effects_risks": "Skin thinning with prolonged use"}]},
                        {"modality": "Systemic", "specific_treatments": [{"treatment_name": "Oral Antihistamines", "dosageAdministration": "As needed", "efficacy_notes": "For pruritus", "side_effects_risks": "Drowsiness"}]}
                    ],
                    "general_management": "Moisturizers, avoiding triggers, lukewarm baths."
                },
                "prognosis": "Chronic, relapsing course, often improves with age.",
                "key_images_description": [],
                "additional_notes": "Often associated with asthma and allergic rhinitis.",
                "source_documents": [
                    {"document_name": processed_text["metadata"]["filename"], "relevant_pages": [1], "extraction_date": datetime.datetime.now().isoformat()}
                ],
                "confidence_score": 0.92,
                "last_refined_timestamp": datetime.datetime.now().isoformat(),
                "last_refined_by_user": False # Initial extraction, not refined by user yet
            },
            {
                "condition_id": condition_id_2,
                "condition_name": "Psoriasis",
                "alternate_names": ["Psoriatic Dermatitis"],
                "icd_10_codes": ["L40.9"],
                "summary": "A chronic autoimmune skin disease characterized by rapid skin cell turnover.",
                "etiology_pathophysiology": {
                    "description": "Genetic predisposition combined with environmental triggers.",
                    "contributingFactors": ["Stress", "Infections", "Medications"]
                },
                "clinical_presentation": {
                    "symptoms": ["Scaling", "Itching", "Burning"],
                    "signs": [
                        {
                            "morphology": "Erythematous plaques with silvery scales", 
                            "color": "Red", 
                            "size": "Variable",
                            "shape": "Round or oval",
                            "arrangement": "Coalescing",
                            "distribution": "Extensor surfaces (e.g., elbows, knees), scalp, lower back"
                        }
                    ],
                    "common_sites": ["Elbows", "Knees", "Scalp", "Nails"]
                },
                "diagnostic_methods": {
                    "diagnostic_methods": [{"method_name": "Skin biopsy", "details": "Acanthosis, parakeratosis, Munro microabscesses"}],
                    "laboratory_tests": [],
                    "imaging": []
                },
                "differential_diagnosis": [
                    {"condition_name": "Seborrheic Dermatitis", "distinguishingFeatures": "Greasy scales, typically on scalp, face, and chest."}
                ],
                "treatment_options": {
                    "treatment_modalities": [
                        {"modality": "Topical", "specific_treatments": [{"treatment_name": "Topical Corticosteroids", "dosageAdministration": "As prescribed", "efficacy_notes": "First-line for mild-moderate cases", "side_effects_risks": "Skin thinning"}]},
                        {"modality": "Phototherapy", "specific_treatments": [{"treatment_name": "UVB Phototherapy", "dosageAdministration": "2-3 times/week", "efficacy_notes": "Effective for widespread disease", "side_effects_risks": "Sunburn, increased skin cancer risk"}]},
                        {"modality": "Systemic", "specific_treatments": [{"treatment_name": "Methotrexate", "dosageAdministration": "Weekly", "efficacy_notes": "For severe cases", "side_effects_risks": "Hepatotoxicity, myelosuppression"}]}
                    ],
                    "general_management": "Moisturizers, stress reduction."
                },
                "prognosis": "Chronic, relapsing, but manageable with treatment.",
                "key_images_description": [],
                "additional_notes": "Can be associated with psoriatic arthritis.",
                "source_documents": [
                    {"document_name": processed_text["metadata"]["filename"], "relevant_pages": [2], "extraction_date": datetime.datetime.now().isoformat()}
                ],
                "confidence_score": 0.88,
                "last_refined_timestamp": datetime.datetime.now().isoformat(),
                "last_refined_by_user": False
            }
        ]

class DataRefinerService:
    """
    Mock Data Refinement Agent (Gemini Pro powered). Simulates taking user feedback
    and applying it to refine extracted condition entries.
    """
    def refine_entry(self, condition_entry: Dict[str, Any], user_feedback: Dict[str, Any], document_context: Optional[Dict[str, Any]] = None, api_key: str = None) -> Dict[str, Any]:
        """
        Simulates refining a condition entry based on user feedback.
        Can optionally use LLM for advanced refinement if api_key is provided.

        Args:
            condition_entry (Dict): The original condition entry.
            user_feedback (Dict): A dictionary of changes/edits from the user.
            document_context (Optional[Dict]): Relevant snippets from the original document.
            api_key (str): API key for LLM services.

        Returns:
            Dict: The refined condition entry.
        """
        logger.info(f"DataRefinerService: Refining condition '{condition_entry.get('condition_name')}' (ID: {condition_entry.get('condition_id')}) with user feedback.")
        
        refined_entry = condition_entry.copy()
        
        # Simple merging logic for demonstration, handles nested structures specified in schema
        def merge_dicts(target, source):
            for key, value in source.items():
                if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                    target[key] = merge_dicts(target[key], value)
                elif key in target and isinstance(target[key], list) and isinstance(value, list):
                    # For lists, extend with unique items, or replace if complete overwrite intended
                    # For simplicity, here we extend unique items. More complex logic needed for full replacement.
                    for item in value:
                        if item not in target[key]: # Basic uniqueness check, might need custom equality for dicts in lists
                            target[key].append(item)
                else:
                    target[key] = value
            return target

        refined_entry = merge_dicts(refined_entry, user_feedback)
        
        # Update refinement history and timestamp
        if "refinement_history" not in refined_entry:
            refined_entry["refinement_history"] = []
        
        # Simplified change tracking for the mock
        changes_description = ", ".join([f"'{k}' updated" for k in user_feedback.keys()])
        
        refined_entry["refinement_history"].append({
            "timestamp": datetime.datetime.now().isoformat(),
            "user_action": "User edit",
            "changes_made": changes_description
        })
        
        refined_entry["last_refined_timestamp"] = datetime.datetime.now().isoformat()
        refined_entry["last_refined_by_user"] = True # Mark as refined by user
        
        # Simulate LLM interaction if api_key was provided and specific complex feedback given
        if api_key and "rephrase_summary" in user_feedback:
            # In a real scenario, this would involve a call to the LLM API
            # For example: llm_response = GeminiAPI.rephrase(current_summary, user_feedback["rephrase_summary"])
            # refined_entry["summary"] = llm_response
            logger.info(f"DataRefinerService: Simulating AI rephrasing based on feedback.")
            refined_entry["summary"] = f"AI-rephrased: {user_feedback['rephrase_summary']}"
        
        return refined_entry

class DataManagerService:
    """
    Mock Data Storage & Download Agent. Manages temporary and persistent storage
    of documents and extracted/refined data.
    """
    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {} # Stores document metadata {doc_id: {filename, status, user_id}}
        self.conditions: Dict[str, Dict[str, Any]] = {} # Stores condition entries {condition_id: condition_data}
        self.doc_conditions_map: Dict[str, List[str]] = {} # Maps document_id to list of condition_ids

    def save_document_metadata(self, document_id: str, filename: str, user_id: str, status: str) -> None:
        """Saves initial document metadata."""
        self.documents[document_id] = {"filename": filename, "user_id": user_id, "status": status}
        self.doc_conditions_map[document_id] = []
        logger.info(f"DataManagerService: Saved metadata for document ID: {document_id} (Status: {status})")

    def update_document_status(self, document_id: str, status: str) -> None:
        """Updates the processing status of a document."""
        if document_id in self.documents:
            self.documents[document_id]["status"] = status
            logger.info(f"DataManagerService: Updated document ID: {document_id} status to '{status}'")
        else:
            logger.warning(f"DataManagerService Warning: Document ID: {document_id} not found for status update.")

    def save_initial_entries(self, document_id: str, entries: List[Dict[str, Any]]) -> None:
        """Saves a list of newly extracted condition entries."""
        if document_id not in self.documents:
            logger.warning(f"DataManagerService Warning: Document ID: {document_id} not found when saving initial entries.")
            return

        for entry in entries:
            # Ensure condition_id is set or generate one
            condition_id = entry.get("condition_id", str(uuid.uuid4()))
            entry["condition_id"] = condition_id
            self.conditions[condition_id] = entry
            self.doc_conditions_map[document_id].append(condition_id)
        logger.info(f"DataManagerService: Saved {len(entries)} initial condition entries for document ID: {document_id}")

    def get_document_status(self, document_id: str) -> Optional[str]:
        """Retrieves the current status of a document."""
        return self.documents.get(document_id, {}).get("status")

    def get_entries_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Retrieves all condition entries associated with a specific document."""
        condition_ids = self.doc_conditions_map.get(document_id, [])
        return [self.conditions[cid] for cid in condition_ids if cid in self.conditions]

    def get_condition_entry(self, condition_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single condition entry by its ID."""
        return self.conditions.get(condition_id)

    def update_condition_entry(self, condition_id: str, updated_entry: Dict[str, Any]) -> None:
        """Updates an existing condition entry."""
        if condition_id in self.conditions:
            self.conditions[condition_id] = updated_entry
            logger.info(f"DataManagerService: Updated condition entry for ID: {condition_id}")
        else:
            logger.warning(f"DataManagerService Warning: Condition ID: {condition_id} not found for update.")

    def get_finalized_data(self, document_ids: Optional[List[str]] = None, condition_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Retrieves finalized condition data for download.
        If document_ids are provided, fetches all conditions from those documents.
        If condition_ids are provided, fetches those specific conditions.
        If neither, fetches all stored conditions.
        """
        results = []
        if condition_ids:
            for cid in condition_ids:
                if cid in self.conditions:
                    results.append(self.conditions[cid])
        elif document_ids:
            for doc_id in document_ids:
                results.extend(self.get_entries_for_document(doc_id))
        else: # If no specific filter, return all conditions
            results = list(self.conditions.values())
            
        logger.info(f"DataManagerService: Retrieved {len(results)} finalized data entries for download.")
        return results


class OrchestratorService:
    """
    Orchestrates the overall workflow of DermRefGen, coordinating tasks and data flow
    between PDF processing, information extraction, data refinement, and data management.
    It manages the state of document processing and condition extraction, ensuring
    seamless end-to-end processing from upload to refinement and download.
    This is the core logic of the Orchestrator_Agent.
    """

    def __init__(self,
                 pdf_processor_service: PDFProcessorService,
                 info_extractor_service: InfoExtractorService,
                 data_refiner_service: DataRefinerService,
                 data_manager_service: DataManagerService):
        """
        Initializes the OrchestratorService with instances of other necessary services.

        Args:
            pdf_processor_service (PDFProcessorService): Service for PDF parsing and text extraction.
            info_extractor_service (InfoExtractorService): Service for AI-powered information extraction.
            data_refiner_service (DataRefinerService): Service for handling user feedback and refining data.
            data_manager_service (DataManagerService): Service for data storage and retrieval.
        """
        self.pdf_processor = pdf_processor_service
        self.info_extractor = info_extractor_service
        self.data_refiner = data_refiner_service
        self.data_manager = data_manager_service
        logger.info("OrchestratorService initialized.")

    def process_new_document(self, file_path: str, user_id: str, api_key: str) -> Dict[str, Any]:
        """
        Handles the full lifecycle of a newly uploaded PDF document:
        1. Registers the document.
        2. Processes the PDF for text extraction.
        3. Extracts dermatologic conditions and their details.
        4. Saves the initial extracted entries.

        Args:
            file_path (str): The temporary path to the uploaded PDF file.
            user_id (str): Identifier for the user initiating the process.
            api_key (str): API key provided by the user for LLM services (passed to AI agents).

        Returns:
            Dict: A dictionary containing the document_id and its initial processing status.
        
        Raises:
            Exception: If any stage of the processing fails.
        """
        document_id = str(uuid.uuid4())
        filename = os.path.basename(file_path)

        try:
            logger.info(f"Orchestrator: Starting workflow for new document '{filename}' (ID: {document_id}).")

            # 1. Register document with Data Manager (initial status: UPLOADED)
            self.data_manager.save_document_metadata(document_id, filename, user_id, "UPLOADED")
            
            # 2. Process PDF to extract text and metadata
            self.data_manager.update_document_status(document_id, "PROCESSING_PDF")
            processed_pdf_data = self.pdf_processor.process_pdf(file_path, document_id)
            
            # 3. Extract dermatologic conditions and information
            self.data_manager.update_document_status(document_id, "EXTRACTING_INFO")
            extracted_conditions = self.info_extractor.extract_conditions(
                document_id, processed_pdf_data, api_key
            )
            
            # 4. Save initial extracted entries
            self.data_manager.save_initial_entries(document_id, extracted_conditions)
            self.data_manager.update_document_status(document_id, "EXTRACTION_COMPLETE")

            logger.info(f"Orchestrator: Document ID: {document_id} processed successfully. Found {len(extracted_conditions)} conditions.")
            return {
                "document_id": document_id,
                "status": "EXTRACTION_COMPLETE",
                "message": "Document processed and conditions extracted successfully.",
                "num_conditions_extracted": len(extracted_conditions)
            }

        except Exception as e:
            # Update document status to FAILED if an error occurs
            self.data_manager.update_document_status(document_id, "FAILED")
            logger.error(f"Orchestrator Error: Failed to process document ID: {document_id}. Error: {e}", exc_info=True)
            raise # Re-raise the exception for the calling API layer to handle

    def get_document_processing_status(self, document_id: str) -> Optional[str]:
        """
        Retrieves the current processing status of a specific document.

        Args:
            document_id (str): The unique ID of the document.

        Returns:
            Optional[str]: The current status string, or None if document not found.
        """
        status = self.data_manager.get_document_status(document_id)
        logger.info(f"Orchestrator: Status for document ID: {document_id} is '{status}'")
        return status

    def get_extracted_conditions_for_review(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all extracted (and potentially refined) condition entries
        associated with a specific document, intended for user review.

        Args:
            document_id (str): The unique ID of the document.

        Returns:
            List[Dict]: A list of dermatologic condition entries.
        """
        conditions = self.data_manager.get_entries_for_document(document_id)
        logger.info(f"Orchestrator: Retrieved {len(conditions)} conditions for review from document ID: {document_id}.")
        return conditions

    def refine_condition_entry(self, condition_id: str, user_feedback: Dict[str, Any], api_key: str) -> Dict[str, Any]:
        """
        Applies user feedback to refine a specific dermatologic condition entry.
        This involves retrieving the current entry, sending it to the data refiner,
        and then updating the stored entry.

        Args:
            condition_id (str): The unique ID of the condition entry to be refined.
            user_feedback (Dict): A dictionary containing the user's edits, corrections, or suggestions.
            api_key (str): API key for LLM services, used by the Data Refinement Agent for AI-assisted refinement.

        Returns:
            Dict: The updated and refined condition entry.

        Raises:
            ValueError: If the specified condition_id does not exist.
            Exception: If the refinement process itself fails.
        """
        current_entry = self.data_manager.get_condition_entry(condition_id)
        if not current_entry:
            raise ValueError(f"Condition entry with ID '{condition_id}' not found for refinement.")

        logger.info(f"Orchestrator: Initiating refinement for condition ID: {condition_id}.")
        
        # In a more advanced scenario, fetch relevant document context
        # (e.g., specific pages or text snippets) if the refiner needs to re-evaluate
        # based on the original source document.
        document_context = {} # Placeholder for now

        try:
            # Send the current entry and user feedback to the Data Refiner Agent
            refined_entry = self.data_refiner.refine_entry(
                current_entry, user_feedback, document_context, api_key
            )
            
            # Update the refined entry in the Data Manager
            self.data_manager.update_condition_entry(condition_id, refined_entry)
            logger.info(f"Orchestrator: Condition ID: {condition_id} successfully refined and updated.")
            return refined_entry
        except Exception as e:
            logger.error(f"Orchestrator Error: Failed to refine condition ID: {condition_id}. Error: {e}", exc_info=True)
            raise # Re-raise for the calling API layer

    def get_final_data_for_download(self, document_ids: Optional[List[str]] = None, condition_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Prepares and retrieves the finalized dermatologic condition data for user download.
        Allows fetching data for specific documents, specific conditions, or all available data.

        Args:
            document_ids (Optional[List[str]]): A list of unique document IDs to retrieve conditions from.
                                                If provided, all conditions linked to these documents will be returned.
            condition_ids (Optional[List[str]]): A list of unique condition IDs to retrieve directly.
                                                If provided, only these specific conditions will be returned.

        Returns:
            List[Dict]: A list of finalized dermatologic condition entries, formatted as per the schema.
        """
        logger.info(f"Orchestrator: Preparing data for download.")
        
        final_data = self.data_manager.get_finalized_data(document_ids=document_ids, condition_ids=condition_ids)
        
        logger.info(f"Orchestrator: {len(final_data)} entries prepared for download.")
        return final_data

# Example Usage (for testing the orchestrator's flow - this would typically be in a separate entry point/test file)
if __name__ == "__main__":
    import json
    # Create a dummy PDF file for testing
    mock_file_path = "/tmp/dermatology_doc_1.pdf"
    try:
        with open(mock_file_path, "w") as f:
            f.write("This is a dummy PDF content for testing.")
    except Exception as e:
        logger.error(f"Could not create mock PDF file: {e}. Please ensure /tmp is writable or change mock_file_path.")
        exit(1)

    # Initialize mock services
    pdf_svc = PDFProcessorService()
    info_svc = InfoExtractorService()
    refine_svc = DataRefinerService()
    data_mgr_svc = DataManagerService()

    # Initialize the Orchestrator
    orchestrator = OrchestratorService(
        pdf_processor_service=pdf_svc,
        info_extractor_service=info_svc,
        data_refiner_service=refine_svc,
        data_manager_service=data_mgr_svc
    )

    # --- Simulate Document Upload and Processing ---
    logger.info("\n--- Step 1: Simulating Document Upload and Processing ---")
    user_api_key = "sk-mock-gemini-key12345" # A mock API key
    user_id_example = "user123"

    document_id = None
    try:
        processing_result = orchestrator.process_new_document(mock_file_path, user_id_example, user_api_key)
        document_id = processing_result["document_id"]
        logger.info(f"Processing Result: {json.dumps(processing_result, indent=2)}")
    except Exception as e:
        logger.error(f"Error during initial processing: {e}")
        document_id = None

    if document_id:
        # --- Simulate Checking Document Status ---
        logger.info("\n--- Step 2: Simulating Checking Document Status ---")
        current_status = orchestrator.get_document_processing_status(document_id)
        logger.info(f"Document ID: {document_id} current status: {current_status}")

        # --- Simulate Getting Conditions for Review ---
        logger.info("\n--- Step 3: Simulating Getting Conditions for Review ---")
        conditions_for_review = orchestrator.get_extracted_conditions_for_review(document_id)
        if conditions_for_review:
            logger.info(f"Extracted Conditions for Review ({len(conditions_for_review)}):")
            for i, cond in enumerate(conditions_for_review):
                logger.info(f"  Condition {i+1}: {cond.get('condition_name')} (ID: {cond.get('condition_id')}) - Summary: {cond.get('summary', '')[:50]}...")
            
            # --- Simulate Refinement ---
            logger.info("\n--- Step 4: Simulating Refinement of a Condition Entry ---")
            condition_to_refine_id = conditions_for_review[0]["condition_id"] # Take the first extracted condition
            user_edits = {
                "summary": "Eczema is a non-contagious skin condition that causes itchy and inflamed skin. It often appears as dry, red patches, commonly on flexural areas.",
                "clinical_presentation": {
                    "symptoms": ["Intense itching (pruritus)", "Skin dryness", "Sensitivity to irritants"],
                    "signs": [
                        {"morphology": "Erythematous papules and vesicles leading to plaques", "color": "Red to brownish-gray", "distribution": "Common on face, scalp, hands, feet, flexural areas"}
                    ]
                },
                "additional_notes": "Patient education on skin care and trigger avoidance is crucial.",
                # Example of a feedback that might trigger AI-assisted refinement if implemented
                "rephrase_summary": "make it more concise and easy to understand for patients"
            }

            try:
                refined_condition = orchestrator.refine_condition_entry(condition_to_refine_id, user_edits, user_api_key)
                logger.info(f"Refined Condition '{refined_condition.get('condition_name')}' (ID: {refined_condition.get('condition_id')}):")
                logger.info(f"  New Summary: {refined_condition.get('summary')}")
                logger.info(f"  New Symptoms: {refined_condition.get('clinical_presentation', {}).get('symptoms')}")
                logger.info(f"  Last Refined By User: {refined_condition.get('last_refined_by_user')}")
                logger.info(f"  Refinement History Length: {len(refined_condition.get('refinement_history', []))}")
            except Exception as e:
                logger.error(f"Error during refinement: {e}")

            # --- Simulate Finalization and Download ---
            logger.info("\n--- Step 5: Simulating Finalization and Data Download ---")
            final_data = orchestrator.get_final_data_for_download(document_ids=[document_id])
            if final_data:
                logger.info(f"Downloaded {len(final_data)} entries. First entry's name: {final_data[0].get('condition_name')}")
                # logger.info(json.dumps(final_data, indent=2)) # Uncomment to see full JSON output

            # Simulate downloading all data
            all_data = orchestrator.get_final_data_for_download()
            logger.info(f"Downloaded all {len(all_data)} entries available in the system.")

        else:
            logger.info("No conditions extracted to review.")
    else:
        logger.info("Document processing failed, cannot proceed with further steps.")

    # Clean up dummy PDF file
    if os.path.exists(mock_file_path):
        try:
            os.remove(mock_file_path)
            logger.info(f"Cleaned up dummy file: {mock_file_path}")
        except Exception as e:
            logger.error(f"Error cleaning up dummy file {mock_file_path}: {e}")