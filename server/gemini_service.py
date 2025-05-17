# server/gemini_service.py
import google.generativeai as genai
import logging
import config # To access default model names

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self, api_key):
        if not api_key:
            raise ValueError("Gemini API Key is required for GeminiService.")
        self.api_key = api_key
        genai.configure(api_key=self.api_key)
        logger.info("GeminiService initialized.")

    async def call_gemini_api(self, prompt_text, model_name=None, image_base64=None, image_mime_type=None):
        """
        Calls the Gemini API with the given prompt and optional image data.
        """
        if not model_name:
            model_name = config.GEMINI_DEFAULT_MODEL
        
        logger.info(f"Calling Gemini API with model: {model_name}")
        # logger.debug(f"Prompt: {prompt_text[:500]}...") # Log beginning of prompt

        try:
            model = genai.GenerativeModel(model_name)
            
            parts = [prompt_text]
            if image_base64 and image_mime_type:
                if "vision" not in model_name.lower() and "flash" not in model_name.lower() : # Basic check, specific model names are better
                     logger.warning(f"Model {model_name} might not be vision-capable. Attempting image send anyway.")
                # For gemini-pro-vision and newer models that accept image in parts
                image_part = {
                    "mime_type": image_mime_type,
                    "data": image_base64
                }
                parts = [prompt_text, image_part] # Gemini API expects image after text for some models
                # If model expects text after image, structure would be [image_part, prompt_text]
                # For multimodal prompts, the structure is often:
                # model.generate_content(["Describe this image:", image_part])
                # So, the prompt_text here should be the textual part of the multimodal query.
                # If the prompt_text already IS the full query including image instructions,
                # then the parts array should be structured like:
                # contents = [
                #    {"role": "user", "parts": [prompt_text_part_1, image_part, prompt_text_part_2]}
                # ]
                # For simplicity now, assuming prompt_text is the main query and image is additional context.
                # The IMAGE_ANALYSIS_PROMPT_TEMPLATE is designed to take the image as the primary subject.
                
                # If the prompt is for image analysis, structure is usually [text_prompt, image_data]
                # If it's a general prompt where an image is supplemental, structure might vary.
                # For `gemini-pro-vision` and `gemini-1.5-flash` (and similar),
                # the API expects a list of parts. If image is primary, prompt text describes what to do with image.
                # If text is primary and image is supplemental, the text prompt needs to refer to the image.
                # The current IMAGE_ANALYSIS_PROMPT_TEMPLATE is a text prompt, so we send [text_prompt, image_data]
                # For other prompts that might use an image (e.g. initial generation if image was uploaded),
                # the prompt template should be aware an image might be present.
                
                # For gemini-pro-vision, the content can be a list: [prompt, image_blob]
                # For newer models, it's often a list of part objects.
                # The Python SDK handles this abstraction.
                # If `image_part` is present, `parts` will be [text, image_blob]
                # If not, `parts` will be just [text]
                
                # The `generateContent` method in the JS SDK takes `contents: [{ role: "user", parts: [...] }]`
                # The Python SDK `generate_content` takes the parts directly for the user role.

                if image_base64 and image_mime_type:
                    # For vision models, the typical input is a list of [text_prompt, image_object]
                    # The image_object is created by the SDK from mime_type and data.
                    # However, the SDK's `generate_content` can take a list of parts directly.
                    # Let's ensure `prompt_text` is the first part if an image is present.
                    content_parts = [prompt_text]
                    content_parts.append({"mime_type": image_mime_type, "data": image_base64})
                    response = await model.generate_content_async(content_parts)
                else:
                    response = await model.generate_content_async(prompt_text)

            
            # response = await model.generate_content_async(parts) # This should handle both cases
            
            # Basic safety check (though comprehensive checks are more complex)
            if not response.candidates or not response.candidates[0].content.parts:
                 logger.warning(f"Gemini API returned no valid candidates or parts. Response: {response}")
                 # Check for finish_reason:
                 if response.prompt_feedback and response.prompt_feedback.block_reason:
                     raise Exception(f"Prompt blocked: {response.prompt_feedback.block_reason_message or response.prompt_feedback.block_reason}")
                 if response.candidates[0].finish_reason != 1: # 1 = STOP
                     raise Exception(f"Generation stopped due to: {response.candidates[0].finish_reason}. Safety ratings: {response.candidates[0].safety_ratings}")
                 raise Exception("No content generated by Gemini API or content was blocked.")

            generated_text = "".join(part.text for part in response.candidates[0].content.parts if hasattr(part, 'text'))
            logger.info(f"Gemini API call successful for model {model_name}.")
            # logger.debug(f"Generated text: {generated_text[:500]}...")
            return generated_text

        except Exception as e:
            logger.error(f"Error calling Gemini API with model {model_name}: {e}", exc_info=True)
            # Try to get more specific error information if available
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"Gemini API Error Response: {e.response.text}")
            raise  # Re-raise the exception to be handled by the caller

    def parse_initial_generation(self, response_text):
        """
        Parses the combined output from the initial generation prompt into
        clinical note and AI analysis parts.
        """
        if "AI_ANALYSIS_SEPARATOR_V2" in response_text:
            parts = response_text.split("AI_ANALYSIS_SEPARATOR_V2", 1)
            note_text = parts[0].strip()
            analysis_text = parts[1].strip() if len(parts) > 1 else ""
            return note_text, analysis_text
        else:
            logger.warning("AI_ANALYSIS_SEPARATOR_V2 not found in Gemini response. Returning full response as note.")
            return response_text.strip(), "" # Assume everything is the note if separator is missing

