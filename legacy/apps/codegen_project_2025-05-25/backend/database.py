import uuid
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

from sqlalchemy.types import JSON

# Define the Base for declarative models
Base = declarative_base()

# --- Database Models ---

class UploadedDocument(Base):
    """
    SQLAlchemy model for storing information about uploaded PDF documents.
    """
    __tablename__ = 'uploaded_documents'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False) # Path to the original PDF or its temporary storage
    processed_text_path = Column(String, nullable=True) # Path to the extracted text file
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    processing_status = Column(String, default='pending') # e.g., 'pending', 'processing', 'completed', 'failed'
    error_message = Column(String, nullable=True) # To store details if processing fails

    # Define relationships
    condition_entries = relationship("DermatologyConditionEntry", back_populates="source_document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UploadedDocument(id='{self.id}', filename='{self.filename}', status='{self.processing_status}')>"

class DermatologyConditionEntry(Base):
    """
    SQLAlchemy model for storing standardized dermatologic condition entries.
    The 'data' column stores the detailed JSON structure of the condition.
    """
    __tablename__ = 'dermatology_condition_entries'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey('uploaded_documents.id'), nullable=False)
    condition_name = Column(String, nullable=False, index=True) # For quick lookup
    
    # Using SQLAlchemy's built-in JSON type. For SQLite, this transparently handles dict <-> JSON string.
    data = Column(JSON, nullable=False) 
    
    last_refined_timestamp = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confidence_score = Column(Float, nullable=True) # Overall confidence of the extracted entry (0.0 to 1.0)

    # Define relationships
    source_document = relationship("UploadedDocument", back_populates="condition_entries")
    refinement_history = relationship("RefinementHistory", back_populates="condition_entry", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DermatologyConditionEntry(id='{self.id}', condition_name='{self.condition_name}')>"

class RefinementHistory(Base):
    """
    SQLAlchemy model for tracking refinement actions on DermatologyConditionEntry records.
    """
    __tablename__ = 'refinement_history'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entry_id = Column(String(36), ForeignKey('dermatology_condition_entries.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_action = Column(String, nullable=False) # e.g., 'edited_symptoms', 'added_treatment', 'AI_suggestion_accepted'
    changes_made = Column(Text, nullable=False) # Detailed description of the change, could be a JSON diff string

    # Define relationships
    condition_entry = relationship("DermatologyConditionEntry", back_populates="refinement_history")

    def __repr__(self):
        return f"<RefinementHistory(id='{self.id}', entry_id='{self.entry_id}', action='{self.user_action}')>"


# --- Database Initialization and Session Management ---

# Database URL. For development, use SQLite. For production, consider PostgreSQL etc.
# Load from environment variable for flexibility.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dermrefgen.db")

# Conditional connect_args for SQLite-specific parameters
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes the database by creating all tables defined in Base.metadata."""
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created (if they didn't exist).")

def get_db():
    """
    Dependency to get a database session.
    Ensures the session is closed after use.
    
    Yields:
        Session: A SQLAlchemy session object.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Example usage (can be removed or put in a separate script/test)
if __name__ == '__main__':
    # Initialize the database (create tables)
    init_db()

    print("\nDatabase initialized. You can now import SessionLocal and Base from this module.")
    print("Example: from backend.database import SessionLocal, UploadedDocument, DermatologyConditionEntry")

    # Example of adding data (for testing)
    with SessionLocal() as db:
        # Create a new document
        new_doc = UploadedDocument(
            filename="sample_derm_paper.pdf",
            filepath="/tmp/sample_derm_paper.pdf",
            processing_status="completed",
            processed_text_path="/tmp/sample_derm_paper_text.txt"
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        print(f"\nAdded document: {new_doc}")

        # Create a sample condition entry
        sample_condition_data = {
            "conditionName": "Atopic Dermatitis",
            "alternativeNames": ["Eczema"],
            "icd10Code": "L20.9",
            "overview": "Chronic inflammatory skin condition...",
            "clinicalPresentation": {
                "symptoms": ["Pruritus", "Dry skin"],
                "signs": [
                    {"morphology": "Erythematous patches", "distribution": "Flexural areas"}
                ]
            },
            "sourceReferences": [
                {"documentId": new_doc.id, "pageNumbers": [5, 12], "originalTextSnippet": "Atopic dermatitis is characterized by..."}
            ],
            "confidenceScore": 0.95
        }

        new_entry = DermatologyConditionEntry(
            document_id=new_doc.id,
            condition_name="Atopic Dermatitis",
            data=sample_condition_data,
            confidence_score=0.95
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        print(f"Added condition entry: {new_entry}")

        # Add refinement history
        refinement_1 = RefinementHistory(
            entry_id=new_entry.id,
            user_action="edited_symptoms",
            changes_made="Changed 'Dry skin' to 'Xerosis'"
        )
        db.add(refinement_1)
        db.commit()
        db.refresh(refinement_1)
        print(f"Added refinement history: {refinement_1}")

        # Query and print to verify
        retrieved_doc = db.query(UploadedDocument).filter_by(id=new_doc.id).first()
        print(f"\nRetrieved document: {retrieved_doc}")

        retrieved_entry = db.query(DermatologyConditionEntry).filter_by(id=new_entry.id).first()
        print(f"Retrieved condition data: {retrieved_entry.data}")

        retrieved_history = db.query(RefinementHistory).filter_by(entry_id=new_entry.id).all()
        print(f"Retrieved refinement history: {retrieved_history}")