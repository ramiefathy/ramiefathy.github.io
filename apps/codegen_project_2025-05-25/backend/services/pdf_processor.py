import io
from PIL import Image
import pytesseract
import fitz # PyMuPDF
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Encapsulates the core logic for ingesting PDF documents, including robust text extraction
    and OCR for scanned documents, handling multi-column layouts. This is a core component
    of the PDF_Processing_Agent.
    """
    def __init__(self, tesseract_cmd=None):
        """
        Initializes the PDFProcessor.
        Args:
            tesseract_cmd (str, optional): Path to the Tesseract executable.
                                           If None, pytesseract will attempt to find it in PATH.
                                           Can also be set via the TESSERACT_PATH environment variable.
        """
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            logger.info(f"Tesseract command explicitly set to: {tesseract_cmd}")
        elif 'TESSERACT_PATH' in os.environ:
            pytesseract.pytesseract.tesseract_cmd = os.environ['TESSERACT_PATH']
            logger.info(f"Tesseract command set from TESSERACT_PATH environment variable: {os.environ['TESSERACT_PATH']}")
        else:
            logger.info("Tesseract command not explicitly set, relying on system PATH or default discovery by pytesseract.")

    def _extract_text_with_pdfminer(self, pdf_bytes_stream):
        """
        Extracts text from a PDF using pdfminer.six, attempting to preserve layout for multi-column documents.
        Args:
            pdf_bytes_stream: io.BytesIO object containing PDF data.
        Returns:
            A list of dictionaries, each containing page_number and text_content.
            Returns None if an error occurs during extraction, indicating potential lack of extractable text.
        """
        extracted_pages_data = []
        try:
            # Reset stream position to beginning for pdfminer.six to read from start
            pdf_bytes_stream.seek(0)
            for page_num, page_layout in enumerate(extract_pages(pdf_bytes_stream), start=1):
                page_text_elements = []
                for element in page_layout:
                    if isinstance(element, LTTextContainer):
                        page_text_elements.append(element)
                
                # Sort elements primarily by y-coordinate (descending) then x-coordinate (ascending).
                # This heuristic attempts to reconstruct natural reading order for multi-column layouts.
                page_text_elements.sort(key=lambda x: (-x.y1, x.x0))
                
                page_text_content = []
                for element in page_text_elements:
                    text = element.get_text().strip()
                    if text:
                        page_text_content.append(text)
                
                extracted_pages_data.append({
                    "page_number": page_num,
                    "text_content": "\n\n".join(page_text_content), # Separate text blocks with double newline
                    "is_ocr_processed": False
                })
        except Exception as e:
            logger.error(f"Error during PDFMiner extraction: {e}", exc_info=True)
            return None
        return extracted_pages_data

    def _extract_text_with_ocr(self, pdf_bytes_stream):
        """
        Extracts text from a PDF using OCR (Tesseract via PyMuPDF for image rendering).
        Args:
            pdf_bytes_stream: io.BytesIO object containing PDF data.
        Returns:
            A list of dictionaries, each containing page_number and text_content.
            Returns None if an error occurs during extraction (e.g., Tesseract not found).
        """
        extracted_pages_data = []
        doc = None # Initialize doc to ensure it's defined for finally block
        try:
            # Reset stream position to beginning for PyMuPDF to read from start
            pdf_bytes_stream.seek(0)
            doc = fitz.open(stream=pdf_bytes_stream.getvalue(), filetype="pdf")
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                # Render page to a high-resolution pixmap for better OCR quality.
                # Zoom factor of 2 corresponds to 200 DPI for a typical 72 DPI PDF.
                zoom = 2  
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                
                # Convert pixmap to PIL Image for Tesseract processing
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Perform OCR, specifying English language for better results
                text = pytesseract.image_to_string(img, lang='eng') 
                extracted_pages_data.append({
                    "page_number": page_num + 1, # PyMuPDF pages are 0-indexed, convert to 1-indexed
                    "text_content": text.strip(),
                    "is_ocr_processed": True
                })
        except pytesseract.TesseractNotFoundError:
            logger.error("Tesseract OCR engine not found. Please ensure it's installed and accessible in PATH or set via tesseract_cmd parameter or TESSERACT_PATH environment variable.", exc_info=True)
            return None
        except Exception as e:
            logger.error(f"Error during OCR extraction: {e}", exc_info=True)
            return None
        finally:
            if doc:
                doc.close() # Ensure the document is closed to release resources
        return extracted_pages_data

    def extract_document_content(self, pdf_input):
        """
        Main function to extract content from a PDF.
        Attempts pdfminer.six first for robust text extraction and layout handling from text-based PDFs.
        Falls back to OCR if pdfminer.six extracts minimal or no text, indicating a scanned or image-based PDF.

        Args:
            pdf_input: Path to the PDF file (str) or PDF content as bytes.

        Returns:
            A dictionary with:
            - "extracted_pages": A list of dictionaries, where each dictionary represents a page with:
                - "page_number": int
                - "text_content": str (extracted text)
                - "is_ocr_processed": bool (True if OCR was used for this page)
            - "status": str (e.g., "success", "success_with_ocr_fallback", "file_not_found", "failed_all")
            - "error": str (error message if status is not "success", otherwise empty)
        """
        pdf_bytes = None
        if isinstance(pdf_input, bytes):
            pdf_bytes = pdf_input
        elif isinstance(pdf_input, str): # Assume input is a file path
            try:
                with open(pdf_input, 'rb') as f:
                    pdf_bytes = f.read()
            except FileNotFoundError:
                logger.error(f"PDF file not found at path: {pdf_input}")
                return {"extracted_pages": [], "status": "file_not_found", "error": "PDF file not found."}
            except Exception as e:
                logger.error(f"Error reading PDF file '{pdf_input}': {e}", exc_info=True)
                return {"extracted_pages": [], "status": "failed_file_read", "error": f"Error reading PDF file: {e}"}
        else:
            logger.error(f"Invalid input type: {type(pdf_input)}. Input must be a file path (str) or PDF content as bytes.")
            return {"extracted_pages": [], "status": "invalid_input_type", "error": "Input must be file path or bytes."}

        # Create an in-memory BytesIO object for the PDF content. This allows multiple parsers to read from it.
        pdf_bytes_stream = io.BytesIO(pdf_bytes)

        # Attempt pdfminer.six extraction first for natively text-based PDFs
        logger.info("Attempting text extraction with pdfminer.six...")
        pdfminer_result = self._extract_text_with_pdfminer(pdf_bytes_stream)
        
        # Heuristic to decide if OCR fallback is needed:
        should_fallback_to_ocr = False
        if not pdfminer_result:
            # pdfminer.six failed completely, suggesting it's likely a scanned PDF or corrupted
            should_fallback_to_ocr = True
            logger.warning("PDFMiner extraction failed completely or returned no pages. Falling back to OCR.")
        else:
            total_pdfminer_chars = sum(len(p['text_content']) for p in pdfminer_result)
            num_pages = len(pdfminer_result)
            
            # Define heuristic thresholds for triggering OCR fallback
            MIN_CHARS_PER_PAGE_THRESHOLD = 50  # Average characters per page below this
            MIN_TOTAL_CHARS_THRESHOLD = 200     # Total characters in document below this

            if num_pages == 0 and total_pdfminer_chars == 0:
                should_fallback_to_ocr = True
                logger.warning("PDFMiner found no pages or extracted no characters. Falling back to OCR.")
            elif num_pages > 0 and (total_pdfminer_chars / num_pages < MIN_CHARS_PER_PAGE_THRESHOLD):
                should_fallback_to_ocr = True
                logger.warning(f"PDFMiner extracted low average characters ({total_pdfminer_chars/num_pages:.2f} chars/page) per page. Falling back to OCR.")
            elif total_pdfminer_chars < MIN_TOTAL_CHARS_THRESHOLD:
                should_fallback_to_ocr = True
                logger.warning(f"PDFMiner extracted very few total characters ({total_pdfminer_chars}). Falling back to OCR.")
            
        final_extracted_content = []
        if not should_fallback_to_ocr:
            # If pdfminer.six was considered sufficient by the heuristic, use its results
            for page_data in pdfminer_result:
                final_extracted_content.append({
                    "page_number": page_data["page_number"],
                    "text_content": page_data["text_content"],
                    "is_ocr_processed": False
                })
            logger.info("PDFMiner extraction successful and deemed sufficient for content.")
            return {"extracted_pages": final_extracted_content, "status": "success", "error": ""}
        else:
            # Fall back to OCR if pdfminer.six was insufficient or failed
            logger.info("Attempting OCR extraction...")
            # Create a new BytesIO stream for OCR as pdfminer.six might have consumed/altered the position of the previous one
            ocr_result = self._extract_text_with_ocr(io.BytesIO(pdf_bytes))
            if ocr_result:
                for page_data in ocr_result:
                    final_extracted_content.append({
                        "page_number": page_data["page_number"],
                        "text_content": page_data["text_content"],
                        "is_ocr_processed": True
                    })
                logger.info("OCR extraction successful.")
                return {"extracted_pages": final_extracted_content, "status": "success_with_ocr_fallback", "error": ""}
            else:
                # If both methods fail, log and return a failure status
                logger.error("Failed to extract text using both PDFMiner and OCR methods.")
                return {"extracted_pages": [], "status": "failed_all", "error": "Could not extract text using any method (PDFMiner or OCR)."}