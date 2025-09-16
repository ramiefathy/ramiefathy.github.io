import logging
import os
from backend.celery_app import celery_app
from backend.services import pdf_processing
from backend.services import info_extraction
from backend.services import data_storage # Import the data_storage service

# Configure logging for Celery tasks
logger = logging.getLogger(__name__)
# If running locally, ensure basic config is set up or rely on Celery's default logging
# For a production system, this would typically be configured via a file or external service.
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@celery_app.task(bind=True, name="process_pdf_document")
def process_pdf_document_task(self, pdf_local_path: str, document_id: str, user_api_key: str):
    """
    Celery task to handle the initial processing of an uploaded PDF document.
    This includes text extraction and basic metadata collection.
    Upon successful PDF processing, it triggers the information extraction task.

    Args:
        pdf_local_path (str): The local file path where the uploaded PDF is temporarily stored.
        document_id (str): A unique identifier (UUID) assigned to the uploaded document.
        user_api_key (str): The API key provided by the user for external LLM services.
                            This is passed along to subsequent tasks that require it.
    """
    logger.info(f"Task {self.request.id}: Starting PDF processing for document_id={document_id} from {pdf_local_path}")
    
    try:
        # Step 1: Process the PDF using the pdf_processing service
        # This function extracts text, handles OCR (if implemented), and collects metadata.
        processed_data = pdf_processing.process_uploaded_pdf(pdf_local_path, document_id, user_api_key)

        # Update task state to provide progress feedback to the UI
        self.update_state(
            state='PROGRESS',
            meta={'step': 'PDF_PROCESSED', 'document_id': document_id, 'message': 'PDF processed, starting info extraction.'}
        )
        logger.info(f"Task {self.request.id}: PDF processing complete for document_id={document_id}.")

        # Step 2: Trigger the next asynchronous task for information extraction
        # The result of PDF processing (e.g., extracted text) is passed to the next task.
        extract_dermatologic_info_task.delay(processed_data, user_api_key)

        return {
            "status": "PDF_PROCESSING_INITIATED",
            "document_id": document_id,
            "message": "PDF processed and info extraction initiated.",
            "task_id": self.request.id
        }

    except FileNotFoundError:
        logger.error(f"Task {self.request.id}: PDF file not found at {pdf_local_path} for document_id={document_id}", exc_info=True)
        self.update_state(state='FAILURE', meta={'exc_type': 'FileNotFoundError', 'exc_message': 'Uploaded PDF file not found.'})
        raise
    except Exception as e:
        logger.error(f"Task {self.request.id}: Error during PDF processing for document_id={document_id}: {e}", exc_info=True)
        # Update task state to FAILED and re-raise to properly mark the task in Celery
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise # Re-raise the exception to ensure Celery marks the task as failed
    finally:
        # Step 3: Clean up the temporary local PDF file, regardless of success or failure
        if os.path.exists(pdf_local_path):
            os.remove(pdf_local_path)
            logger.info(f"Task {self.request.id}: Cleaned up temporary PDF file: {pdf_local_path}")


@celery_app.task(bind=True, name="extract_dermatologic_info")
def extract_dermatologic_info_task(self, processed_pdf_data: dict, user_api_key: str):
    """
    Celery task to extract dermatologic condition information from processed PDF data.
    This task leverages an LLM (via the `info_extraction` service) to identify and
    structure conditions according to the predefined schema.

    Args:
        processed_pdf_data (dict): A dictionary containing the output from `process_pdf_document_task`,
                                   typically includes 'text_content', 'metadata', 'pages', 'document_id', etc.
        user_api_key (str): The API key provided by the user for external LLM services.
    """
    document_id = processed_pdf_data.get('document_id', 'unknown_doc_id')
    original_filename = processed_pdf_data.get('original_filename', 'N/A')
    logger.info(f"Task {self.request.id}: Starting information extraction for document_id={document_id}, filename={original_filename}")

    try:
        # Step 1: Use the info_extraction service to call the LLM and extract data.
        extracted_conditions = info_extraction.extract_dermatologic_info_from_processed_pdf(
            processed_pdf_data,
            user_api_key
        )

        # Step 2: Store the extracted conditions.
        # This is where the Data_Storage_Download_Agent's responsibilities are invoked.
        # Ensure data_storage.save_extracted_conditions handles the document_id and the structured data.
        data_storage.save_extracted_conditions(document_id, extracted_conditions)
        logger.info(f"Task {self.request.id}: Successfully stored {len(extracted_conditions)} conditions for document_id={document_id}.")

        # Update task state to indicate completion and pass relevant metadata
        self.update_state(
            state='SUCCESS',
            meta={
                'step': 'INFO_EXTRACTED_COMPLETED',
                'document_id': document_id,
                'conditions_count': len(extracted_conditions),
                'message': f"Extraction complete. Found {len(extracted_conditions)} conditions."
                # In a real app, you might pass a URL/ID to access the stored results, not the full data.
            }
        )

        return {
            "status": "INFO_EXTRACTED",
            "document_id": document_id,
            "conditions_count": len(extracted_conditions),
            "task_id": self.request.id,
            "message": "Information extraction completed successfully."
        }

    except Exception as e:
        logger.error(f"Task {self.request.id}: Error during information extraction for document_id={document_id}: {e}", exc_info=True)
        # Update task state to FAILED
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise # Re-raise the exception to ensure Celery marks the task as failed