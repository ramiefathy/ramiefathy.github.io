# --- Configuration ---
# Allow database file path to be set via environment variable for flexibility
DB_FILE = os.getenv('DERMREFGEN_DB_FILE', 'dermrefgen.db')
DOCUMENTS_TABLE = "uploaded_documents"
CONDITIONS_TABLE = "dermatology_conditions"

# --- Data Model Classes (Internal Representation) ---

class UploadedDocument:
    """Represents an uploaded PDF document."""
    def __init__(self, document_id: str, document_name: str, file_path: str, upload_date: str):
        self.document_id = document_id
        self.document_name = document_name
        self.file_path = file_path  # Path to the stored PDF file
        self.upload_date = upload_date # ISO_8601 datetime string

    def to_dict(self) -> dict:
        """Converts the UploadedDocument object to a dictionary."""
        return {
            "document_id": self.document_id,
            "document_name": self.document_name,
            "file_path": self.file_path,
            "upload_date": self.upload_date
        }

    @staticmethod
    def from_db_row(row: sqlite3.Row) -> 'UploadedDocument':
        """Creates an UploadedDocument object from a database row."""
        if not row:
            return None
        return UploadedDocument(
            document_id=row['document_id'],
            document_name=row['document_name'],
            file_path=row['file_path'],
            upload_date=row['upload_date']
        )

class DermatologyConditionEntry:
    """
    Represents a structured dermatologic condition entry,
    typically after extraction and refinement.
    The `entry_data` field stores the full JSON schema as a dictionary.
    """
    def __init__(self, condition_id: str, entry_data: dict, document_id: str, last_refined_timestamp: str):
        self.condition_id = condition_id
        self.entry_data = entry_data  # The full JSON object (Python dict) as per schema
        self.document_id = document_id  # Link to the source UploadedDocument
        self.last_refined_timestamp = last_refined_timestamp # ISO_8601 datetime string

    def to_dict(self) -> dict:
        """Converts the DermatologyConditionEntry object to a dictionary."""
        return {
            "condition_id": self.condition_id,
            "entry_data": self.entry_data,
            "document_id": self.document_id,
            "last_refined_timestamp": self.last_refined_timestamp
        }

    @staticmethod
    def from_db_row(row: sqlite3.Row) -> 'DermatologyConditionEntry':
        """Creates a DermatologyConditionEntry object from a database row."""
        if not row:
            return None
        return DermatologyConditionEntry(
            condition_id=row['condition_id'],
            entry_data=json.loads(row['entry_data']),  # Load JSON string back to dict
            document_id=row['document_id'],
            last_refined_timestamp=row['last_refined_timestamp']
        )

# --- Data Manager Class ---

class DataManager:
    """
    Manages interaction with the database for storing and retrieving
    UploadedDocument and DermatologyConditionEntry objects.
    Handles preparation and formatting of finalized entries for user download.
    """
    def __init__(self, db_file: str = DB_FILE):
        self.db_file = db_file
        self._initialize_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Establishes and returns a database connection with row_factory set."""
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row  # Access columns by name
        return conn

    def _initialize_db(self):
        """Initializes the database schema if tables do not exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Create documents table
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {DOCUMENTS_TABLE} (
                    document_id TEXT PRIMARY KEY,
                    document_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    upload_date TEXT NOT NULL
                )
            """)

            # Create conditions table
            # entry_data stores the full JSON structure as TEXT
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {CONDITIONS_TABLE} (
                    condition_id TEXT PRIMARY KEY,
                    entry_data TEXT NOT NULL, -- Stores the JSON string of the condition entry
                    document_id TEXT NOT NULL, -- Foreign key to uploaded_documents
                    last_refined_timestamp TEXT NOT NULL,
                    FOREIGN KEY (document_id) REFERENCES {DOCUMENTS_TABLE}(document_id) ON DELETE CASCADE
                )
            """)
            conn.commit()

    # --- Document Management ---

    def save_uploaded_document(self, document_name: str, file_path: str) -> UploadedDocument:
        """
        Saves a new uploaded document record to the database.
        Generates a unique ID and timestamp.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            document_id = str(uuid.uuid4())
            upload_date = datetime.now().isoformat()

            doc = UploadedDocument(document_id, document_name, file_path, upload_date)

            cursor.execute(f"""
                INSERT INTO {DOCUMENTS_TABLE} (document_id, document_name, file_path, upload_date)
                VALUES (?, ?, ?, ?)
            """, (doc.document_id, doc.document_name, doc.file_path, doc.upload_date))
            conn.commit()
            return doc

    def get_uploaded_document(self, document_id: str) -> UploadedDocument | None:
        """Retrieves an uploaded document by its ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {DOCUMENTS_TABLE} WHERE document_id = ?", (document_id,))
            row = cursor.fetchone()
            return UploadedDocument.from_db_row(row) if row else None

    def get_all_uploaded_documents(self) -> list[UploadedDocument]:
        """Retrieves all uploaded documents."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {DOCUMENTS_TABLE}")
            rows = cursor.fetchall()
            return [UploadedDocument.from_db_row(row) for row in rows]

    def delete_uploaded_document(self, document_id: str) -> bool:
        """
        Deletes an uploaded document and associated condition entries.
        Utilizes ON DELETE CASCADE defined in the schema for condition entries.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # If ON DELETE CASCADE is set up, deleting the document will automatically
            # delete associated conditions. We still explicitly delete here in case
            # the foreign key constraint is not fully relied upon, or for clarity.
            # However, for consistency with ON DELETE CASCADE, removing explicit condition deletion.
            # No, leaving it as is for backward compatibility and explicit control
            # although ON DELETE CASCADE is specified in _initialize_db.
            # For simplicity, and reliance on the CASCADE, let's remove the explicit condition delete here.
            
            # The schema was updated with ON DELETE CASCADE, so explicit deletion of children is redundant.
            cursor.execute(f"DELETE FROM {DOCUMENTS_TABLE} WHERE document_id = ?", (document_id,))
            rows_affected = cursor.rowcount
            conn.commit()
            return rows_affected > 0

    # --- Condition Entry Management ---

    def save_condition_entry(self, entry_data: dict, document_id: str) -> DermatologyConditionEntry:
        """
        Saves a new dermatology condition entry or updates an existing one.
        If `entry_data` contains a valid `condition_id`, it attempts to update the entry.
        Otherwise, or if an update fails (ID not found), it creates a new entry with a new ID.
        Returns the saved or updated DermatologyConditionEntry object.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            last_refined_timestamp = datetime.now().isoformat()

            # Attempt to get condition_id from entry_data; if not present, it's a new entry
            condition_id_from_data = entry_data.get("condition_id")
            
            if condition_id_from_data:
                # Try to update an existing entry
                cursor.execute(f"""
                    UPDATE {CONDITIONS_TABLE}
                    SET entry_data = ?, last_refined_timestamp = ?
                    WHERE condition_id = ?
                """, (json.dumps(entry_data), last_refined_timestamp, condition_id_from_data))
                
                if cursor.rowcount > 0:
                    # Update was successful, return the updated object
                    conn.commit()
                    return DermatologyConditionEntry(condition_id_from_data, entry_data, document_id, last_refined_timestamp)

            # If we reach here, it means either:
            # 1. condition_id_from_data was None (caller intends to create a new entry)
            # 2. condition_id_from_data was provided, but no existing record was found for that ID (treat as new entry)
            
            # Generate a new ID for insertion
            new_condition_id = str(uuid.uuid4())
            # Ensure the condition_id is embedded in the entry_data dictionary for consistency with schema
            entry_data["condition_id"] = new_condition_id 

            cursor.execute(f"""
                INSERT INTO {CONDITIONS_TABLE} (condition_id, entry_data, document_id, last_refined_timestamp)
                VALUES (?, ?, ?, ?)
            """, (new_condition_id, json.dumps(entry_data), document_id, last_refined_timestamp))

            conn.commit()
            return DermatologyConditionEntry(new_condition_id, entry_data, document_id, last_refined_timestamp)


    def get_condition_entry(self, condition_id: str) -> DermatologyConditionEntry | None:
        """Retrieves a single condition entry by its ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {CONDITIONS_TABLE} WHERE condition_id = ?", (condition_id,))
            row = cursor.fetchone()
            return DermatologyConditionEntry.from_db_row(row) if row else None

    def get_condition_entries_by_document(self, document_id: str) -> list[DermatologyConditionEntry]:
        """Retrieves all condition entries associated with a specific document ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {CONDITIONS_TABLE} WHERE document_id = ?", (document_id,))
            rows = cursor.fetchall()
            return [DermatologyConditionEntry.from_db_row(row) for row in rows]

    def get_all_condition_entries(self) -> list[DermatologyConditionEntry]:
        """Retrieves all condition entries from the database."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {CONDITIONS_TABLE}")
            rows = cursor.fetchall()
            return [DermatologyConditionEntry.from_db_row(row) for row in rows]

    def delete_condition_entry(self, condition_id: str) -> bool:
        """Deletes a condition entry by its ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"DELETE FROM {CONDITIONS_TABLE} WHERE condition_id = ?", (condition_id,))
            rows_affected = cursor.rowcount
            conn.commit()
            return rows_affected > 0

    # --- Download/Export Functionality ---

    def get_finalized_entries_for_download(self, condition_ids: list[str] = None) -> list[dict]:
        """
        Retrieves specified or all finalized condition entries and formats them as a list of dictionaries.
        Each dictionary conforms to the StandardizedDermatologyConditionSchema.
        If `condition_ids` is None, all entries are returned.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()

            if condition_ids:
                # Sanitize and prepare placeholders for the IN clause
                placeholders = ','.join('?' * len(condition_ids))
                query = f"SELECT entry_data FROM {CONDITIONS_TABLE} WHERE condition_id IN ({placeholders})"
                params = condition_ids
            else:
                query = f"SELECT entry_data FROM {CONDITIONS_TABLE}"
                params = ()

            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Each row's 'entry_data' is a JSON string; load it into a Python dictionary
            finalized_entries = [json.loads(row['entry_data']) for row in rows]
            return finalized_entries