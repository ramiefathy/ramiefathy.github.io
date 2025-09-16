import google.generativeai as genai
import json
from datetime import datetime
import uuid
import logging
from typing import List, Dict, Any, Optional, Union

# Configure logging for the agent
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class InfoExtractionAgent:
    """
    The InfoExtractionAgent is responsible for processing raw text from PDF documents
    to identify dermatologic conditions and extract key information according to a
    predefined structured schema. It leverages the Google Gemini Pro API for
    advanced Natural Language Processing tasks.
    """
    def __init__(self, api_key: str):
        """
        Initializes the InfoExtractionAgent with a Gemini API key.
        Args:
            api_key: The API key for Google Gemini Pro.
        """
        if not api_key:
            logging.error("Gemini API key is missing. InfoExtractionAgent cannot be initialized.")
            raise ValueError("API key must be provided for InfoExtractionAgent.")
            
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.generation_config = {
            "temperature": 0.2, # Lower temperature for more factual, less creative output
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192, # Maximum tokens for the model's response
        }
        # Safety settings are set to BLOCK_NONE to prevent blocking of legitimate medical terms
        # that might be flagged by default safety filters. This should be reviewed for
        # specific application contexts.
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        # Define the expected JSON schema for a single dermatologic condition entry,
        # using the detailed 'StandardizedDermatologyConditionSchema' from the prompt.
        # This schema guides the LLM on the desired output structure.
        self.DERMATOLOGY_SCHEMA_PROMPT = """
        {
          "conditionName": "string",
          "alternativeNames": ["string"],
          "icd10Code": "string",
          "overview": "string",
          "etiology": {
            "description": "string",
            "contributingFactors": ["string"]
          },
          "clinicalPresentation": {
            "symptoms": ["string"],
            "signs": [
              {
                "morphology": "string",
                "color": "string",
                "size": "string",
                "shape": "string",
                "arrangement": "string",
                "distribution": "string"
              }
            ],
            "commonSites": ["string"]
          },
          "diagnostics": {
            "diagnosticMethods": [
              {
                "methodName": "string",
                "findings": "string",
                "utility": "string"
              }
            ],
            "laboratoryTests": ["string"],
            "imaging": ["string"]
          },
          "differentialDiagnosis": [
            {
              "conditionName": "string",
              "distinguishingFeatures": "string"
            }
          ],
          "treatment": {
            "treatmentModalities": [
              {
                "modalityType": "string",
                "specificTreatments": [
                  {
                    "name": "string",
                    "dosageAdministration": "string",
                    "indications": "string",
                    "contraindications": "string",
                    "sideEffects": "string",
                    "notes": "string"
                  }
                ]
              }
            ],
            "generalManagement": "string"
          },
          "prognosis": "string",
          "keyImageReferences": [
            {
              "pdfSource": "string",
              "pageNumber": "integer",
              "figureCaption": "string",
              "description": "string"
            }
          ],
          "notes": "string",
          "sourceReferences": [
            {
              "documentId": "string",
              "pageNumbers": ["integer"],
              "originalTextSnippet": "string"
            }
          ],
          "confidenceScore": "float",
          "lastRefinedTimestamp": "datetime",
          "refinementHistory": [
            {
              "timestamp": "ISO_8601_datetime",
              "userAction": "string",
              "changesMade": "string"
            }
          ]
        }
        """

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        """
        Helper method to call the Gemini API with standard configuration.
        Includes robust error handling for API-specific issues and general exceptions.
        Args:
            prompt: The prompt string to send to the model.
        Returns:
            The model's generated text, or None if an error occurs or no content is returned.
        """
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
            # Prioritize response.text if available, as it's the most direct way to get text.
            if hasattr(response, 'text') and response.text:
                return response.text
            
            # Fallback to candidates if response.text is not directly available (e.g., streaming behavior)
            if response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts') and candidate.content.parts:
                        # Concatenate parts, though usually it's one for text responses
                        return "".join([part.text for part in candidate.content.parts if hasattr(part, 'text')])
            logging.warning("Gemini API call returned no text content or candidates.")
            return None
        except genai.types.BlockedPromptException as e:
            logging.error(f"Gemini API BlockedPromptException: {e}. Blocked reason: {e.response.prompt_feedback.block_reason.name}")
            return None
        except genai.types.APIError as e:
            logging.error(f"Gemini APIError: {e}")
            return None
        except Exception as e:
            logging.error(f"An unexpected error occurred during Gemini API call: {e}", exc_info=True)
            return None

    def _identify_conditions(self, text_content: str) -> List[str]:
        """
        Identifies dermatologic conditions mentioned in the text content using Gemini.
        Args:
            text_content: The full text extracted from the PDF.
        Returns:
            A list of unique dermatologic condition names identified.
        """
        # Heuristic limit for prompt size. For very large texts, consider
        # chunking the text and processing chunks separately, then consolidating results.
        text_for_prompt = text_content[:20000] # Use a portion of the text to manage token limits.
        
        prompt = (
            "From the following medical text, identify and list all distinct dermatologic conditions mentioned. "
            "Provide only the names, one per line, without any additional formatting, numbering, or explanations. "
            "Focus strictly on medical conditions, not general symptoms, treatments, or diagnostic methods themselves "
            "unless they are also recognized condition names. "
            "Example Output:\nPsoriasis\nEczema\nMelanoma\n\n"
            f"Text:\n```\n{text_for_prompt}\n```"
        )
        
        response_text = self._call_gemini_api(prompt)
        if response_text:
            conditions = [
                line.strip()
                for line in response_text.split('\n')
                if line.strip() and len(line.strip()) > 2 # Basic filter for meaningful condition names
            ]
            unique_conditions = list(set(conditions))
            logging.info(f"Identified {len(unique_conditions)} conditions: {unique_conditions}")
            return unique_conditions
        logging.warning("No conditions identified from text content.")
        return []

    def _extract_condition_details(
        self,
        condition_name: str,
        text_content: str,
        document_name: str,
        page_texts: Dict[int, str]
    ) -> Optional[Dict[str, Any]]:
        """
        Extracts detailed information for a single dermatologic condition
        and formats it according to the predefined schema using Gemini.
        Args:
            condition_name: The name of the dermatologic condition.
            text_content: The full text extracted from the PDF. While the full text is passed,
                          for very large documents, extracting a more relevant, smaller context
                          around the condition's mentions would improve LLM focus and performance.
            document_name: The name of the source document.
            page_texts: A dictionary mapping page numbers to their full text content,
                        used to identify relevant pages for source references.
        Returns:
            A dictionary representing the standardized entry for the condition, or None if extraction fails.
        """
        # Prompt the LLM directly with the detailed schema, instructing it to adhere strictly.
        prompt = (
            f"Extract all relevant information about '{condition_name}' from the provided medical text. "
            "Strictly adhere to the JSON schema provided below. Fill in all fields that can be extracted "
            "from the text. If information for a field is not explicitly present "
            "in the text, set its value to null or an empty array/object as appropriate (do not invent information). "
            "Ensure all keys are camelCase as per the schema. "
            "The output MUST be a valid JSON object, without any surrounding text or markdown fences like ```json.\n\n"
            f"JSON Schema:\n{self.DERMATOLOGY_SCHEMA_PROMPT}\n\n"
            f"Text about '{condition_name}':\n```\n{text_content}\n```"
        )
        
        response_text = self._call_gemini_api(prompt)
        if not response_text:
            logging.warning(f"No response text from Gemini for condition: {condition_name}")
            return None

        try:
            # Clean up common LLM JSON formatting (e.g., removing markdown fences)
            json_str = response_text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[len("```json"):].strip()
            elif json_str.startswith("```"): # In case it just uses ```
                json_str = json_str[len("```"):].strip()
            if json_str.endswith("```"):
                json_str = json_str[:-len("```")].strip()
            
            extracted_data = json.loads(json_str)

            # --- Post-processing: Ensure schema adherence and populate derived fields ---
            # This section acts as a validator and standardizer for the LLM's output.

            # Initialize a complete template for the final entry based on the schema
            final_entry: Dict[str, Any] = {
                "conditionId": str(uuid.uuid4()),
                "conditionName": condition_name,
                "alternativeNames": [],
                "icd10Code": None,
                "overview": None,
                "etiology": {"description": None, "contributingFactors": []},
                "clinicalPresentation": {
                    "symptoms": [],
                    "signs": [],
                    "commonSites": []
                },
                "diagnostics": {
                    "diagnosticMethods": [],
                    "laboratoryTests": [],
                    "imaging": []
                },
                "differentialDiagnosis": [],
                "treatment": {
                    "treatmentModalities": [],
                    "generalManagement": None
                },
                "prognosis": None,
                "keyImageReferences": [],
                "notes": None,
                "sourceReferences": [],
                "confidenceScore": 0.0, # Initial confidence score, can be refined by Data_Refinement_Agent
                "lastRefinedTimestamp": datetime.utcnow().isoformat(),
                "refinementHistory": [] # Initial empty history, managed by Data_Refinement_Agent
            }

            # Helper function to recursively merge LLM's extracted data into the template
            # This prioritizes LLM's output while ensuring base structure from template.
            def merge_extracted_data(target: Dict, source: Dict):
                for key, value in source.items():
                    if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                        merge_extracted_data(target[key], value)
                    elif key in target and isinstance(target[key], list) and isinstance(value, list):
                        # For lists, extend new items but avoid duplicates if exact matches
                        # For complex objects, this might need more sophisticated merging logic
                        target[key].extend([item for item in value if item not in target[key]]) 
                    else:
                        target[key] = value

            # Merge the LLM's raw output into the standardized template
            merge_extracted_data(final_entry, extracted_data)

            # --- Specific post-processing to validate types and structures ---
            
            # Ensure top-level list fields are indeed lists, converting if LLM provides single string or null
            list_fields_to_ensure = [
                "alternativeNames", 
                "etiology.contributingFactors",
                "clinicalPresentation.symptoms", "clinicalPresentation.commonSites",
                "diagnostics.laboratoryTests", "diagnostics.imaging"
            ]
            for field_path in list_fields_to_ensure:
                parts = field_path.split('.')
                current_dict = final_entry
                for i, part in enumerate(parts):
                    if part not in current_dict or current_dict[part] is None:
                        current_dict[part] = [] # Initialize if missing or null
                    if i == len(parts) - 1: # It's the target field
                        if isinstance(current_dict[part], str):
                            current_dict[part] = [current_dict[part].strip()] if current_dict[part].strip() else []
                        elif not isinstance(current_dict[part], list):
                            current_dict[part] = [] # Ensure it's a list if it's something else
                        break # Done with this path
                    # Navigate deeper
                    current_dict = current_dict[part] if isinstance(current_dict[part], dict) else {}

            # Handle complex lists of objects, ensuring correct structure and data types
            # clinicalPresentation.signs
            if not isinstance(final_entry["clinicalPresentation"]["signs"], list):
                final_entry["clinicalPresentation"]["signs"] = []
            else:
                cleaned_signs = []
                for sign in final_entry["clinicalPresentation"]["signs"]:
                    if isinstance(sign, dict):
                        cleaned_signs.append({
                            "morphology": sign.get("morphology"), "color": sign.get("color"),
                            "size": sign.get("size"), "shape": sign.get("shape"),
                            "arrangement": sign.get("arrangement"), "distribution": sign.get("distribution")
                        })
                    elif isinstance(sign, str): # If LLM provides a simple string description
                        cleaned_signs.append({"morphology": sign})
                final_entry["clinicalPresentation"]["signs"] = [s for s in cleaned_signs if any(v is not None for v in s.values())]

            # diagnostics.diagnosticMethods
            if not isinstance(final_entry["diagnostics"]["diagnosticMethods"], list):
                final_entry["diagnostics"]["diagnosticMethods"] = []
            else:
                cleaned_methods = []
                for method in final_entry["diagnostics"]["diagnosticMethods"]:
                    if isinstance(method, dict) and method.get("methodName"):
                        cleaned_methods.append({
                            "methodName": method.get("methodName"),
                            "findings": method.get("findings"),
                            "utility": method.get("utility")
                        })
                    elif isinstance(method, str): # If LLM provides a simple string name
                        cleaned_methods.append({"methodName": method})
                final_entry["diagnostics"]["diagnosticMethods"] = [m for m in cleaned_methods if m.get("methodName")]

            # differentialDiagnosis
            if not isinstance(final_entry["differentialDiagnosis"], list):
                final_entry["differentialDiagnosis"] = []
            else:
                cleaned_dd = []
                for dd_item in final_entry["differentialDiagnosis"]:
                    if isinstance(dd_item, dict) and dd_item.get("conditionName"):
                        cleaned_dd.append({
                            "conditionName": dd_item.get("conditionName"),
                            "distinguishingFeatures": dd_item.get("distinguishingFeatures")
                        })
                    elif isinstance(dd_item, str): # If LLM provides a simple string name
                        cleaned_dd.append({"conditionName": dd_item})
                final_entry["differentialDiagnosis"] = [d for d in cleaned_dd if d.get("conditionName")]

            # treatment.treatmentModalities
            if not isinstance(final_entry["treatment"]["treatmentModalities"], list):
                final_entry["treatment"]["treatmentModalities"] = []
            else:
                cleaned_modalities = []
                for modality in final_entry["treatment"]["treatmentModalities"]:
                    if isinstance(modality, dict) and modality.get("modalityType") and isinstance(modality.get("specificTreatments"), list):
                        cleaned_specific_treatments = []
                        for st in modality["specificTreatments"]:
                            if isinstance(st, dict) and st.get("name"):
                                cleaned_specific_treatments.append({
                                    "name": st.get("name"),
                                    "dosageAdministration": st.get("dosageAdministration"),
                                    "indications": st.get("indications"),
                                    "contraindications": st.get("contraindications"),
                                    "sideEffects": st.get("sideEffects"),
                                    "notes": st.get("notes")
                                })
                            elif isinstance(st, str):
                                cleaned_specific_treatments.append({"name": st})
                        
                        if cleaned_specific_treatments:
                            cleaned_modalities.append({
                                "modalityType": modality["modalityType"],
                                "specificTreatments": cleaned_specific_treatments
                            })
                final_entry["treatment"]["treatmentModalities"] = cleaned_modalities

            # keyImageReferences
            if not isinstance(final_entry["keyImageReferences"], list):
                final_entry["keyImageReferences"] = []
            else:
                cleaned_image_refs = []
                for img_ref in final_entry["keyImageReferences"]:
                    if isinstance(img_ref, dict) and (img_ref.get("description") or img_ref.get("pdfSource")):
                        page_num_val = img_ref.get("pageNumber")
                        if isinstance(page_num_val, str):
                            try:
                                page_str_numbers = ''.join(filter(str.isdigit, page_num_val))
                                page_num_val = int(page_str_numbers) if page_str_numbers else -1
                            except ValueError:
                                page_num_val = -1
                        elif not isinstance(page_num_val, int):
                            page_num_val = -1 # Default to -1 if not an integer
                        
                        cleaned_image_refs.append({
                            "pdfSource": img_ref.get("pdfSource", document_name), # Default to current document name
                            "pageNumber": page_num_val,
                            "figureCaption": img_ref.get("figureCaption"),
                            "description": img_ref.get("description")
                        })
                final_entry["keyImageReferences"] = cleaned_image_refs

            # sourceReferences (Populate based on page_texts where condition name is found)
            relevant_pages_for_condition = []
            for page_num, page_text in page_texts.items():
                if condition_name.lower() in page_text.lower():
                    relevant_pages_for_condition.append(page_num)
            
            final_entry["sourceReferences"] = [{
                "documentId": document_name,
                "pageNumbers": sorted(list(set(relevant_pages_for_condition))),
                "originalTextSnippet": None # Populating this would require more advanced text retrieval (e.g., semantic search for snippets)
            }]
            
            # refinementHistory
            if not isinstance(final_entry["refinementHistory"], list):
                final_entry["refinementHistory"] = []
            else:
                cleaned_history = []
                for entry in final_entry["refinementHistory"]:
                    if isinstance(entry, dict) and entry.get("timestamp"):
                        cleaned_history.append({
                            "timestamp": entry.get("timestamp"),
                            "userAction": entry.get("userAction"),
                            "changesMade": entry.get("changesMade")
                        })
                final_entry["refinementHistory"] = cleaned_history


            # Ensure icd10Code is a string (comma-separated if LLM returned multiple)
            if isinstance(final_entry.get("icd10Code"), list):
                final_entry["icd10Code"] = ", ".join(final_entry["icd10Code"])
            elif final_entry.get("icd10Code") is None:
                final_entry["icd10Code"] = ""
            elif not isinstance(final_entry.get("icd10Code"), str):
                final_entry["icd10Code"] = str(final_entry["icd10Code"])

            # Ensure confidenceScore is a float
            if not isinstance(final_entry.get("confidenceScore"), (float, int)):
                final_entry["confidenceScore"] = 0.0
            else:
                final_entry["confidenceScore"] = float(final_entry["confidenceScore"])
            
            # Ensure lastRefinedTimestamp is a valid datetime string
            if not isinstance(final_entry.get("lastRefinedTimestamp"), str):
                final_entry["lastRefinedTimestamp"] = datetime.utcnow().isoformat()
            
            # Set top-level string fields to None if empty strings were extracted by LLM
            # (prefer null if nothing was found, otherwise keep LLM's non-empty string)
            string_fields_to_null_if_empty = [
                "overview", "etiology.description", "prognosis", "notes",
                "treatment.generalManagement", "icd10Code" # Add icd10Code here to handle empty string as null
            ]

            for field_path in string_fields_to_null_if_empty:
                parts = field_path.split('.')
                current_dict = final_entry
                for i, part in enumerate(parts):
                    if i == len(parts) - 1:
                        if current_dict.get(part) == "":
                            current_dict[part] = None
                    else:
                        # Safely navigate nested dictionaries
                        current_dict = current_dict.get(part, {})
                        if not isinstance(current_dict, dict): # If it's not a dict, stop navigation
                            break


            logging.info(f"Successfully extracted and structured data for '{condition_name}'.")
            return final_entry
        except json.JSONDecodeError as e:
            logging.error(f"JSON decoding error for condition '{condition_name}': {e}. Response text snippet: {response_text[:1000]}...")
            return None
        except Exception as e:
            logging.error(f"An unexpected error occurred during detail extraction for '{condition_name}': {e}", exc_info=True)
            return None

    def extract_info(self, raw_text: str, document_name: str, page_texts: Dict[int, str]) -> List[Dict[str, Any]]:
        """
        Main method for the InfoExtractionAgent.
        Processes raw text to identify dermatologic conditions and extract key information.
        Args:
            raw_text: The full text content extracted from the PDF.
            document_name: The name of the original PDF document.
            page_texts: A dictionary where keys are page numbers (int) and values are
                        the full text content of that page (str). This is crucial for
                        linking extracted info back to relevant pages.
        Returns:
            A list of standardized dermatologic condition entries (dictionaries).
        """
        logging.info(f"Starting information extraction for document: '{document_name}'")
        
        # 1. Identify all dermatologic conditions from the raw text
        identified_conditions = self._identify_conditions(raw_text)
        if not identified_conditions:
            logging.warning(f"No dermatologic conditions identified in document: '{document_name}'. Returning empty list.")
            return []

        extracted_entries: List[Dict[str, Any]] = []

        # 2. For each identified condition, extract detailed information
        for i, condition_name in enumerate(identified_conditions):
            logging.info(f"Processing condition {i+1}/{len(identified_conditions)}: '{condition_name}' for detailed extraction.")
            condition_entry = self._extract_condition_details(
                condition_name, raw_text, document_name, page_texts
            )
            
            if condition_entry:
                extracted_entries.append(condition_entry)
            else:
                logging.error(f"Failed to extract or properly structure details for condition: '{condition_name}'. Skipping.")

        logging.info(f"Finished extraction for document: '{document_name}'. Successfully extracted {len(extracted_entries)} entries.")
        return extracted_entries