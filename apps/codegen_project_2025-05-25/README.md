# DermRefGen: Dermatologic Condition Reference Generator & Refinement System

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Core Features](#2-core-features)
3.  [Architecture Overview](#3-architecture-overview)
4.  [Technology Stack](#4-technology-stack)
5.  [Data Structure](#5-data-structure)
6.  [Setup and Installation](#6-setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Cloning the Repository](#cloning-the-repository)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
7.  [Configuration](#7-configuration)
    *   [API Key Management](#api-key-management)
    *   [Redis Configuration](#redis-configuration)
8.  [Running the Application](#8-running-the-application)
    *   [Start Redis](#start-redis)
    *   [Start Backend API](#start-backend-api)
    *   [Start Celery Worker](#start-celery-worker)
    *   [Start Frontend](#start-frontend)
    *   [Accessing the Application](#accessing-the-application)
9.  [Usage Guide](#9-usage-guide)
    *   [Uploading PDF Documents](#uploading-pdf-documents)
    *   [Reviewing and Refining Entries](#reviewing-and-refining-entries)
    *   [Downloading Curated Data](#downloading-curated-data)
10. [Security Considerations](#10-security-considerations)
11. [Error Handling & Logging](#11-error-handling--logging)
12. [Scalability Notes](#12-scalability-notes)
13. [Deployment](#13-deployment)

---

## 1. Introduction

DermRefGen is a robust web application designed to streamline the process of extracting, standardizing, and refining information about dermatologic conditions from unstructured PDF documents. It empowers medical researchers, content creators, and clinicians to convert valuable knowledge locked in textbooks and papers into structured, verifiable, and machine-readable data.

The system leverages advanced AI (specifically Gemini Pro) and natural language processing techniques to identify conditions, extract key attributes, and facilitate an iterative user-driven refinement process, ensuring accuracy and completeness. The final output is a clean, structured JSON dataset ready for integration into other agentic systems or databases.

## 2. Core Features

*   **Secure API Key Handling:** Safely manages the user-provided API key for external LLM services.
*   **Robust PDF Parsing:** Capable of extracting text from various PDF formats, including scanned documents (via OCR) and multi-column layouts.
*   **AI-Powered Information Extraction:** Utilizes the Gemini Pro API to identify dermatologic conditions and extract detailed information (symptoms, diagnostic methods, treatments, etc.) based on a predefined schema.
*   **Standardized Data Generation:** Transforms extracted raw data into a consistent, structured JSON format for each condition.
*   **Intuitive Iterative Refinement UI:** A user-friendly interface that allows users to review, edit, add, and flag extracted information, with optional AI-assisted suggestions for complex refinements.
*   **Source Referencing:** Links extracted information directly back to its original source within the PDF documents (document name, page number).
*   **Curated Data Download:** Enables users to download finalized, structured dermatologic condition entries in JSON format, ready for other agentic systems.

## 3. Architecture Overview

DermRefGen is designed as a multi-agent system, with distinct functional components collaborating to achieve the overall goal. This modular approach enhances maintainability, scalability, and clarity of responsibilities.

*   **CoordinatorAgent:** Manages the overall workflow, orchestrates interactions between other agents, handles initial user requests (e.g., API key input, PDF upload), and routes them to the appropriate agents.
*   **PDFProcessingAgent:** Dedicated to handling PDF uploads, performing text extraction (including OCR for image-based PDFs), and basic content segmentation.
*   **DermatologyNERAgent:** (Powered by Gemini Pro) Specializes in Natural Language Processing (NLP) to identify dermatologic condition entities, symptoms, treatments, and other structured data points from the processed PDF text.
*   **StandardizationAgent:** Takes the raw extracted data from `DermatologyNERAgent` and maps it to the predefined `StandardizedDermatologyConditionSchema`, ensuring consistency and completeness.
*   **RefinementAgent:** Facilitates the user's iterative review and refinement process. It presents data to the user, captures feedback, applies changes, and can leverage Gemini Pro for AI-assisted refinement suggestions.
*   **DataManagementAgent:** Manages the storage and retrieval of uploaded documents, extracted raw data, and finalized standardized entries. It also handles the final data download process.
*   **SecurityAgent:** Responsible for ensuring the secure handling, transmission, and temporary storage of sensitive information, particularly the user-provided Gemini API key.

## 4. Technology Stack

*   **Frontend:** React (JavaScript/TypeScript)
*   **Backend:** Python 3.9+ (Flask)
*   **PDF Processing:** `PyMuPDF` (fitz) for fast PDF text extraction, `pytesseract` for OCR (requires Tesseract-OCR installed on the system).
*   **AI/NLP:** Google Gemini Pro API (via `google-generativeai` Python client), `spaCy` for advanced text processing (if needed for pre-processing).
*   **Database:** SQLite (for local development and simplicity; easily swappable for PostgreSQL/MongoDB for production).
*   **Task Queue:** Celery with Redis as the message broker (for handling long-running tasks like PDF processing and AI extraction asynchronously).
*   **Package Management:** `pip` (Python), `npm` (Node.js).

## 5. Data Structure

All extracted and refined dermatologic condition entries conform to the `StandardizedDermatologyConditionSchema`. This JSON structure is designed for comprehensive detail and easy machine readability.

A simplified example of a single entry:

```json
{
  "conditionName": "Acne Vulgaris",
  "alternativeNames": ["Common Acne"],
  "icd10Code": "L70.0",
  "overview": "A chronic inflammatory skin condition involving hair follicles and sebaceous glands.",
  "etiology": {
    "description": "Multifactorial, involving increased sebum production, follicular hyperkeratinization, Propionibacterium acnes colonization, and inflammation.",
    "contributingFactors": ["Hormonal changes", "Genetics", "Diet (controversial)"]
  },
  "clinicalPresentation": {
    "symptoms": ["Pimples", "Blackheads", "Whiteheads", "Cysts", "Nodules"],
    "signs": [
      {
        "morphology": "Comedo",
        "color": "Skin-colored",
        "size": "1-3mm",
        "shape": "Punctate",
        "arrangement": "Scattered",
        "distribution": "Face, chest, back"
      }
    ],
    "commonSites": ["Face", "Chest", "Back"]
  },
  "diagnostics": {
    "diagnosticMethods": [
      {
        "methodName": "Clinical Examination",
        "findings": "Presence of typical lesions",
        "utility": "Primary diagnostic method"
      }
    ],
    "laboratoryTests": [],
    "imaging": []
  },
  "differentialDiagnosis": [
    {
      "conditionName": "Rosacea",
      "distinguishingFeatures": "Absence of comedones, presence of flushing and telangiectasias."
    }
  ],
  "treatment": {
    "treatment modalities": [
      {
        "modalityType": "Topical",
        "specificTreatments": [
          {
            "name": "Benzoyl Peroxide",
            "dosageAdministration": "Apply 2.5-10% once or twice daily",
            "indications": "Mild to moderate acne",
            "contraindications": "Hypersensitivity",
            "sideEffects": "Dryness, irritation, redness",
            "notes": "Can bleach fabrics."
          }
        ]
      }
    ],
    "generalManagement": "Avoidance of harsh scrubs, gentle cleansing, non-comedogenic products."
  },
  "prognosis": "Generally good with treatment, but chronic and can recur.",
  "keyImageReferences": [
    {
      "pdfSource": "Dermatology_Textbook.pdf",
      "pageNumber": 125,
      "figureCaption": "Fig 5.1: Comedones in Acne Vulgaris",
      "description": "Close-up of open and closed comedones."
    }
  ],
  "notes": "Patient education on adherence is key.",
  "sourceReferences": [
    {
      "documentId": "Dermatology_Textbook.pdf",
      "pageNumbers": [123, 124, 126],
      "originalTextSnippet": "Acne vulgaris is a common inflammatory skin condition..."
    }
  ],
  "confidenceScore": 0.95,
  "lastRefinedTimestamp": "2023-10-27T10:30:00Z"
}
```

The full schema includes more detailed fields as outlined in the project instructions.

## 6. Setup and Installation

Follow these steps to set up and run DermRefGen on your local machine.

### Prerequisites

*   **Python 3.9+**
*   **Node.js 18+**
*   **pip** (Python package installer)
*   **npm** (Node.js package manager)
*   **Tesseract OCR:** Required for PDF image/scanned document processing.
    *   **macOS (Homebrew):** `brew install tesseract`
    *   **Ubuntu/Debian:** `sudo apt-get install tesseract-ocr`
    *   **Windows:** Download installer from [Tesseract OCR GitHub](https://tesseract-ocr.github.io/tessdoc/Downloads.html)
*   **Redis:** A local Redis instance is required for Celery.
    *   **macOS (Homebrew):** `brew install redis`
    *   **Ubuntu/Debian:** `sudo apt-get install redis-server`
    *   **Windows:** Download from [Redis Downloads](https://redis.io/download/) or use WSL2.

### Cloning the Repository

First, clone the DermRefGen repository to your local machine:

```bash
git clone <repository_url>
cd DermRefGen
```

### Backend Setup

1.  Navigate into the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a Python virtual environment:
    ```bash
    python3 -m venv venv
    ```
3.  Activate the virtual environment:
    *   **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    *   **Windows (Command Prompt):**
        ```bash
        venv\Scripts\activate.bat
        ```
    *   **Windows (PowerShell):**
        ```bash
        venv\Scripts\Activate.ps1
        ```
4.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
5.  Set up environment variables (see [Configuration](#7-configuration)).

### Frontend Setup

1.  Navigate back to the project root and then into the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install the Node.js dependencies:
    ```bash
    npm install
    ```

## 7. Configuration

Before running the application, you need to configure your environment variables.

### API Key Management

DermRefGen uses the Google Gemini Pro API for advanced AI processing. You will need to provide your API key.

1.  Create a `.env` file in the `backend` directory (at the same level as `app.py` and `requirements.txt`).
2.  Add your Gemini API key to this file:
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
    Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual API key obtained from Google AI Studio or Google Cloud.
    **IMPORTANT:** This file should NEVER be committed to version control. It's already in `.gitignore`.

### Redis Configuration

Ensure your Redis server is running. By default, Celery will try to connect to `redis://localhost:6379/0`. If your Redis instance is on a different host or port, you'll need to specify it in the `.env` file in the `backend` directory:

```
REDIS_URL="redis://<your_redis_host>:<your_redis_port>/0"
```
For local setup, the default is usually fine and this line might not be strictly necessary if Redis is running on localhost:6379.

## 8. Running the Application

DermRefGen consists of three main components that need to be run concurrently: the Redis server, the Flask backend API, the Celery worker, and the React frontend.

### Start Redis

Open a new terminal window and start your Redis server.
*   **macOS/Linux:**
    ```bash
    redis-server
    ```
*   **Windows:** (Start the Redis service or run `redis-server.exe` from its installation directory)

### Start Backend API

1.  Open a new terminal window and navigate to the `backend` directory.
2.  Activate your virtual environment:
    ```bash
    source venv/bin/activate # macOS/Linux
    # OR
    venv\Scripts\activate.bat # Windows
    ```
3.  Start the Flask development server:
    ```bash
    flask run
    ```
    This will typically run on `http://127.0.0.1:5000`.

### Start Celery Worker

1.  Open another new terminal window and navigate to the `backend` directory.
2.  Activate your virtual environment:
    ```bash
    source venv/bin/activate # macOS/Linux
    # OR
    venv\Scripts\activate.bat # Windows
    ```
3.  Start the Celery worker:
    ```bash
    celery -A app.celery_worker worker --loglevel=info
    ```
    This worker will process long-running tasks like PDF parsing and AI extraction.

### Start Frontend

1.  Open a final new terminal window and navigate to the `frontend` directory.
2.  Start the React development server:
    ```bash
    npm start
    ```
    This will usually open your browser to `http://localhost:3000`.

### Accessing the Application

Once all three components (Redis, Backend API, Celery Worker, Frontend) are running, open your web browser and navigate to:

`http://localhost:3000`

## 9. Usage Guide

### Uploading PDF Documents

1.  On the DermRefGen homepage, you will see a prominent PDF upload area.
2.  Drag and drop your dermatology-related PDF documents onto this area, or click to browse your files.
3.  Once files are selected, click the "Process Documents" button.
4.  The system will indicate processing status. This step involves PDF parsing, OCR, and initial AI extraction, which might take some time depending on document size and complexity.

### Reviewing and Refining Entries

1.  After processing is complete, the application will display a list of identified dermatologic conditions and their initially extracted entries.
2.  Click on a condition name to view its detailed structured entry.
3.  The interface allows you to:
    *   **Edit Fields:** Directly modify text within any field of the structured entry.
    *   **Add Information:** Populate empty fields or add new items to arrays (e.g., more symptoms, treatments).
    *   **Flag Inaccuracies:** Highlight information that seems incorrect or requires further review.
    *   **AI-Assisted Refinement:** For more complex changes, you can select text or a field and request AI assistance (e.g., "Summarize this," "Expand details from page X," "Check for contradictions"). The system will propose a refined version for your approval.
4.  Remember to save your changes periodically.

### Downloading Curated Data

1.  Once you are satisfied with the refined entries, navigate to the download section (or click a "Download All" button).
2.  You can select individual entries or choose to download all refined data.
3.  The system will compile the selected entries into a single JSON file (or a collection of JSON files) conforming to the `StandardizedDermatologyConditionSchema`, ready for use in other agentic systems or databases.

## 10. Security Considerations

*   **API Key Handling:** Your Gemini API key is crucial. The system is designed to handle it securely:
    *   It should be stored in an environment variable (`.env` file) and is explicitly excluded from version control.
    *   It is used server-side only to make requests to the Gemini API.
    *   It is not logged or exposed client-side.
*   **Data Privacy:** While DermRefGen is designed for reference documents, not patient health information (PHI), be mindful of the content you upload. For this project, it's assumed documents do not contain PHI. If PHI handling becomes a requirement, strict HIPAA (or equivalent) compliance measures would be necessary.
*   **Input Sanitization:** All user inputs (e.g., during refinement) are handled with care to prevent injection vulnerabilities.

## 11. Error Handling & Logging

The application includes comprehensive error handling to gracefully manage issues during PDF processing, AI extraction, and API communication. Informative error messages are provided to the user where applicable. Detailed logs are maintained server-side (without sensitive data) to assist with debugging and monitoring system performance. These logs are crucial for the `Orchestrator_Agent` to diagnose workflow issues.

## 12. Scalability Notes

DermRefGen is built with a modular, agent-based architecture which naturally lends itself to scalability.
*   **Asynchronous Processing:** Long-running tasks like PDF processing and AI extraction are handled by Celery workers, preventing the main API from blocking and allowing for parallel processing of multiple documents.
*   **Database Choice:** While SQLite is used for simplicity in local development, the `Data_Storage_Download_Agent` can easily integrate with more robust and scalable databases like PostgreSQL or MongoDB for production environments.
*   **Containerization:** The application is designed to be easily containerized using Docker, enabling deployment on platforms like Kubernetes for horizontal scaling.

## 13. Deployment

For production deployment, it is highly recommended to containerize the application using Docker.

1.  **Dockerize:** Create `Dockerfile`s for the `backend` and `frontend` services.
2.  **Orchestration:** Use `docker-compose` for local multi-service orchestration or Kubernetes for cloud-based scalable deployment.
3.  **Environment Variables:** Ensure all necessary environment variables (especially `GEMINI_API_KEY`, `REDIS_URL`) are securely injected into the containers at runtime.
4.  **Persistent Storage:** For document uploads and processed data that needs to persist across container restarts, configure Docker volumes.
5.  **Reverse Proxy:** Use a reverse proxy like Nginx for serving the frontend and routing API requests, handling SSL termination, etc.

Detailed deployment scripts and instructions would be provided in a dedicated `DEPLOYMENT.md` file or within `docs/` in a production-ready repository.