// client/script.js

// --- Configuration ---
const CONFIG = {
    WEBSOCKET_URL: "ws://localhost:8765",
    RECONNECTION_ATTEMPTS: 3,
    RECONNECTION_DELAY: 1000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    AUDIO_CHUNK_SIZE: 1024 * 1024 // 1MB chunks
};

// Medical dictionary for improved recognition
const MEDICAL_TERMS = [
    // Primary Lesions
    "macule", "patch", "papule", "plaque", "nodule", "tumor", "vesicle", "bulla", "pustule", "abscess",
    "wheal", "urticaria", "telangiectasia", "petechia", "purpura", "ecchymosis", "comedo", "milia",
    "cyst", "pseudocyst", "pseudovesicle", "pseudopustule", "pseudobulla", "pseudonodule",
    
    // Secondary Lesions
    "scale", "crust", "excoriation", "fissure", "erosion", "ulcer", "scar", "keloid", "atrophy",
    "lichenification", "striae", "comedone", "milia", "hyperkeratosis", "parakeratosis", "acanthosis",
    "spongiosis", "dyskeratosis", "apoptosis", "necrosis", "granulation", "fibrosis", "sclerosis",
    
    // Common Conditions
    "acne", "rosacea", "eczema", "atopic dermatitis", "contact dermatitis", "seborrheic dermatitis",
    "psoriasis", "lichen planus", "pityriasis rosea", "tinea", "candidiasis", "impetigo",
    "cellulitis", "erysipelas", "folliculitis", "furuncle", "carbuncle", "herpes simplex",
    "herpes zoster", "varicella", "molluscum", "warts", "verruca", "condyloma",
    "hidradenitis suppurativa", "pyoderma gangrenosum", "granuloma annulare", "sarcoidosis",
    "lichen sclerosus", "lichen nitidus", "lichen striatus", "pityriasis lichenoides",
    "pityriasis rubra pilaris", "darier disease", "hailey hailey", "grover disease",
    "granuloma faciale", "granuloma inguinale", "granuloma multiforme",
    
    // Neoplastic
    "melanoma", "basal cell carcinoma", "squamous cell carcinoma", "actinic keratosis",
    "dysplastic nevus", "seborrheic keratosis", "dermatofibroma", "lipoma",
    "merkel cell carcinoma", "kaposi sarcoma", "mycosis fungoides", "sezary syndrome",
    "lymphomatoid papulosis", "primary cutaneous lymphoma", "cutaneous t cell lymphoma",
    "primary cutaneous b cell lymphoma", "primary cutaneous anaplastic large cell lymphoma",
    "primary cutaneous marginal zone lymphoma", "primary cutaneous follicle center lymphoma",
    "primary cutaneous diffuse large b cell lymphoma", "primary cutaneous intravascular large b cell lymphoma",
    "primary cutaneous plasmablastic lymphoma", "primary cutaneous plasmacytoid dendritic cell neoplasm",
    "primary cutaneous gamma delta t cell lymphoma", "primary cutaneous aggressive epidermotropic cd8 t cell lymphoma",
    "primary cutaneous acral cd8 t cell lymphoma", "primary cutaneous cd4 small medium t cell lymphoproliferative disorder",
    "primary cutaneous peripheral t cell lymphoma", "primary cutaneous anaplastic large cell lymphoma",
    "primary cutaneous marginal zone lymphoma", "primary cutaneous follicle center lymphoma",
    "primary cutaneous diffuse large b cell lymphoma", "primary cutaneous intravascular large b cell lymphoma",
    "primary cutaneous plasmablastic lymphoma", "primary cutaneous plasmacytoid dendritic cell neoplasm",
    "primary cutaneous gamma delta t cell lymphoma", "primary cutaneous aggressive epidermotropic cd8 t cell lymphoma",
    "primary cutaneous acral cd8 t cell lymphoma", "primary cutaneous cd4 small medium t cell lymphoproliferative disorder",
    "primary cutaneous peripheral t cell lymphoma",
    
    // Hair and Nail
    "alopecia", "androgenetic alopecia", "alopecia areata", "trichotillomania",
    "onychomycosis", "paronychia", "onycholysis", "onychodystrophy", "onychogryphosis",
    "telogen effluvium", "anagen effluvium", "traction alopecia", "central centrifugal cicatricial alopecia",
    "lichen planopilaris", "frontal fibrosing alopecia", "pseudopelade", "folliculitis decalvans",
    "dissecting cellulitis", "acne keloidalis", "trichorrhexis nodosa", "monilethrix",
    "pili torti", "trichothiodystrophy", "woolly hair", "uncombable hair syndrome",
    "beaus lines", "mees lines", "muehrcke lines", "terry nails", "half and half nails",
    "yellow nail syndrome", "green nail syndrome", "blue nail syndrome", "red lunula",
    "koilonychia", "clubbing", "pitting", "trachyonychia", "onychoschizia",
    
    // Pigmentary
    "vitiligo", "melasma", "postinflammatory hyperpigmentation", "hypopigmentation",
    "depigmentation", "dyschromia", "ash leaf macule", "cafe au lait", "mongolian spot",
    "nevus of ota", "nevus of ito", "nevus spilus", "becker nevus", "nevus depigmentosus",
    "piebaldism", "albinism", "hermansky pudlak", "chediak higashi", "griscelli",
    "waardenburg", "tietz", "vogt koyanagi harada", "alezzandrini", "sutton",
    "halo nevus", "leukoderma", "leukomelanoderma", "erythromelanosis",
    
    // Inflammatory
    "urticaria", "angioedema", "erythema multiforme", "stevens johnson syndrome",
    "toxic epidermal necrolysis", "pemphigus", "pemphigoid", "dermatomyositis",
    "lupus", "scleroderma", "morphea", "lichen planus", "lichen nitidus",
    "lichen striatus", "lichen sclerosus", "lichen simplex chronicus",
    "lichen amyloidosis", "lichen myxedematosus", "lichen spinulosus",
    "lichen scrofulosorum", "lichen aureus", "lichen ruber moniliformis",
    "lichen ruber planus", "lichen ruber acuminatus", "lichen ruber verrucosus",
    "lichen ruber hypertrophicus", "lichen ruber atrophicus", "lichen ruber pemphigoides",
    "lichen ruber planus", "lichen ruber acuminatus", "lichen ruber verrucosus",
    "lichen ruber hypertrophicus", "lichen ruber atrophicus", "lichen ruber pemphigoides",
    
    // Procedures
    "biopsy", "excision", "cryotherapy", "electrodessication", "curettage",
    "phototherapy", "photodynamic therapy", "laser therapy", "dermabrasion",
    "microdermabrasion", "chemical peel", "botulinum toxin", "dermal fillers",
    "liposuction", "liposculpture", "liposuction assisted lipectomy",
    "ultrasound assisted lipectomy", "laser assisted lipectomy",
    "radiofrequency assisted lipectomy", "power assisted lipectomy",
    "tumescent liposuction", "superwet liposuction", "dry liposuction",
    "wet liposuction", "ultrasound assisted liposuction",
    "laser assisted liposuction", "radiofrequency assisted liposuction",
    "power assisted liposuction", "tumescent liposuction",
    "superwet liposuction", "dry liposuction", "wet liposuction",
    
    // Medications
    "topical", "systemic", "steroid", "corticosteroid", "antihistamine", "antibiotic",
    "antifungal", "antiviral", "immunosuppressant", "biologic", "retinoid",
    "calcineurin inhibitor", "phosphodiesterase inhibitor", "jak inhibitor",
    "tnf alpha inhibitor", "il17 inhibitor", "il23 inhibitor", "il4 inhibitor",
    "il13 inhibitor", "il31 inhibitor", "il33 inhibitor", "il36 inhibitor",
    "il37 inhibitor", "il38 inhibitor", "il39 inhibitor", "il40 inhibitor",
    
    // Descriptors
    "pruritic", "erythematous", "edematous", "indurated", "tender", "painful",
    "warm", "scaly", "crusty", "oozing", "weeping", "lichenified",
    "hyperkeratotic", "atrophic", "scarred", "hypopigmented", "hyperpigmented",
    "violaceous", "purpuric", "petechial", "ecchymotic", "telangiectatic",
    "verrucous", "papillomatous", "vegetating", "ulcerated", "necrotic",
    "gangrenous", "fissured", "erosive", "excoriated", "lichenified",
    "sclerotic", "fibrotic", "granulomatous", "infiltrated", "infiltrative",
    "infiltrating", "infiltrated", "infiltrative", "infiltrating",
    
    // Locations
    "trunk", "extremities", "face", "scalp", "oral", "genital", "intertriginous",
    "flexural", "extensor", "palmar", "plantar", "periungual", "periocular",
    "perioral", "perinasal", "periauricular", "periorbital", "perioral",
    "perinasal", "periauricular", "periorbital", "perioral", "perinasal",
    "periauricular", "periorbital", "perioral", "perinasal", "periauricular",
    "periorbital", "perioral", "perinasal", "periauricular", "periorbital",
    
    // Qualifiers
    "acute", "chronic", "recurrent", "persistent", "progressive", "resolving",
    "benign", "malignant", "premalignant", "metastatic", "localized", "generalized",
    "symmetric", "asymmetric", "bilateral", "unilateral", "solitary", "multiple",
    "discrete", "confluent", "coalescing", "annular", "arcuate", "circinate",
    "circular", "linear", "serpiginous", "reticulate", "reticulated", "reticular",
    "reticulated", "reticular", "reticulated", "reticular", "reticulated", "reticular"
];

// --- DOM Elements ---
// (Most DOM elements are similar to the previous single-file version)
const modelNameClientInput = document.getElementById('modelNameClient'); // Client-side model preference
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const saveButton = document.getElementById('saveButton');

const transcriptionOutput = document.getElementById('transcriptionOutput');
const realtimeSuggestionsOutput = document.getElementById('realtimeSuggestionsOutput');
const aiNotesOutput = document.getElementById('aiNotesOutput'); 
const aiAnalysisContentOutput = document.getElementById('aiAnalysisContentOutput'); 

const recordingStatus = document.getElementById('recordingStatus');
const recordingDuration = document.getElementById('recordingDuration');
const dateTimeDisplay = document.getElementById('dateTimeDisplay');
const visitDateInput = document.getElementById('visitDate');
const currentYearSpan = document.getElementById('currentYear');

const discussionChatOutput = document.getElementById('discussionChatOutput');
const discussMicButton = document.getElementById('discussMicButton');
const physicianFeedbackInput = document.getElementById('physicianFeedbackInput');
const sendFeedbackButton = document.getElementById('sendFeedbackButton');

const uploadImageBtn = document.getElementById('uploadImageBtn');
const imageUploadModal = document.getElementById('imageUploadModal');
const closeImageModalBtn = document.getElementById('closeImageModalBtn');
const imageUploadInput = document.getElementById('imageUploadInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const analyzeImageBtn = document.getElementById('analyzeImageBtn');
const imageAnalysisResult = document.getElementById('imageAnalysisResult');
const imageApprovalControls = document.getElementById('imageApprovalControls');
const cancelImageAnalysisBtn = document.getElementById('cancelImageAnalysisBtn');
const approveImageDescriptionBtn = document.getElementById('approveImageDescriptionBtn');

// --- State Variables ---
const state = {
    websocket: null,
    isConnected: false,
    isRecording: false,
    currentSession: null,
    retryCount: 0,
    pendingMessages: [],
    mediaRecorder: null,
    audioChunks: [],
    recognition: null,
    finalTranscript: '',
    interimTranscript: ''
};

let timerInterval;
let secondsElapsed = 0;
let transcriptWordCount = 0; // Used by client for simple display, backend might do more complex tracking

// --- Web Speech API ---
let discussionRecognition;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Utility functions
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

function initializeRecognitionInstance() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    return rec;
}

if (SpeechRecognition) {
    discussionRecognition = initializeRecognitionInstance();
} else {
    console.error("Speech Recognition API not supported in this browser.");
    displayError("Speech Recognition API not supported. Try Chrome or Edge.");
    if(startButton) startButton.disabled = true;
    if(discussMicButton) discussMicButton.disabled = true;
}

// WebSocket management
class WebSocketManager {
    constructor() {
        this.connect();
    }

    connect() {
        try {
            state.websocket = new WebSocket(CONFIG.WEBSOCKET_URL);
            this.setupEventListeners();
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleReconnection();
        }
    }

    setupEventListeners() {
        state.websocket.onopen = () => {
            console.log('WebSocket connected');
            state.isConnected = true;
            state.retryCount = 0;
            this.processPendingMessages();
            this.updateStatus('Connected to server');
        };

        state.websocket.onclose = () => {
            console.log('WebSocket disconnected');
            state.isConnected = false;
            this.updateStatus('Disconnected from server');
            this.handleReconnection();
        };

        state.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateStatus('Connection error');
        };

        state.websocket.onmessage = this.handleMessage.bind(this);
    }

    handleReconnection() {
        if (state.retryCount < CONFIG.RECONNECTION_ATTEMPTS) {
            state.retryCount++;
            this.updateStatus(`Reconnecting... Attempt ${state.retryCount} of ${CONFIG.RECONNECTION_ATTEMPTS}`);
            setTimeout(() => this.connect(), CONFIG.RECONNECTION_DELAY * state.retryCount);
        } else {
            console.error('Max reconnection attempts reached');
            this.showError('Connection failed. Please refresh the page.');
        }
    }

    send(message) {
        if (state.isConnected) {
            state.websocket.send(JSON.stringify(message));
        } else {
            state.pendingMessages.push(message);
        }
    }

    processPendingMessages() {
        while (state.pendingMessages.length > 0) {
            const message = state.pendingMessages.shift();
            this.send(message);
        }
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.processMessage(data);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    processMessage(data) {
        switch (data.type) {
            case 'connection_ack':
                this.handleConnectionAck(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            case 'generated_note':
                this.handleGeneratedNote(data);
                break;
            case 'ack':
                this.handleAck(data);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    handleConnectionAck(data) {
        this.updateStatus('Connected to server');
    }

    handleError(data) {
        this.showError(data.message);
    }

    handleGeneratedNote(data) {
        const outputDisplay = document.getElementById('outputDisplay');
        if (outputDisplay) {
            outputDisplay.innerHTML = marked.parse(data.content);
        }
    }

    handleAck(data) {
        console.log('Message acknowledged:', data);
    }

    updateStatus(message) {
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            statusDisplay.textContent = message;
        }
    }

    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        const errorMessage = document.getElementById('errorMessage');
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.classList.remove('hidden');
            setTimeout(() => {
                errorDisplay.classList.add('hidden');
            }, 5000);
        }
    }
}

// Audio recording
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    this.sendAudioChunk(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start(1000); // Collect data every second
            state.isRecording = true;
            this.updateUI();
        } catch (error) {
            console.error('Error starting recording:', error);
            websocketManager.showError('Could not access microphone. Please check permissions.');
        }
    }

    stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            state.isRecording = false;
            this.updateUI();
        }
    }

    async sendAudioChunk(chunk) {
        try {
            const arrayBuffer = await chunk.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            websocketManager.send({
                type: 'audio_data',
                session_id: state.currentSession,
                audio_data: base64Audio
            });
        } catch (error) {
            console.error('Error sending audio chunk:', error);
        }
    }

    updateUI() {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        
        if (startButton && stopButton) {
            startButton.disabled = state.isRecording;
            stopButton.disabled = !state.isRecording;
        }
    }
}

// Speech recognition
class SpeechRecognitionManager {
    constructor() {
        this.setupRecognition();
    }

    setupRecognition() {
        if ('webkitSpeechRecognition' in window) {
            state.recognition = new webkitSpeechRecognition();
            state.recognition.continuous = true;
            state.recognition.interimResults = true;
            state.recognition.lang = 'en-US';
            
            // Add medical terms to improve recognition
            if (state.recognition.grammars) {
                const grammar = `#JSGF V1.0; grammar medical; public <term> = ${MEDICAL_TERMS.join(' | ')};`;
                const speechRecognitionList = new webkitSpeechGrammarList();
                speechRecognitionList.addFromString(grammar, 1);
                state.recognition.grammars = speechRecognitionList;
            }
            
            this.setupRecognitionEvents();
        } else {
            console.error('Speech recognition not supported');
            websocketManager.showError('Speech recognition is not supported in your browser');
        }
    }

    setupRecognitionEvents() {
        state.recognition.onstart = () => {
            state.isRecording = true;
            this.updateUI();
            websocketManager.updateStatus('Recording...');
        };

        state.recognition.onend = () => {
            if (state.isRecording) {
                state.recognition.start();
            }
        };

        state.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update the display
            const outputDisplay = document.getElementById('outputDisplay');
            if (outputDisplay) {
                if (finalTranscript) {
                    state.finalTranscript += finalTranscript;
                    outputDisplay.textContent = state.finalTranscript + interimTranscript;
                } else {
                    outputDisplay.textContent = state.finalTranscript + interimTranscript;
                }
            }

            // Send final transcript to server
            if (finalTranscript) {
                this.sendTranscript(finalTranscript);
            }
        };

        state.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            websocketManager.showError(`Speech recognition error: ${event.error}`);
        };
    }

    start() {
        if (state.recognition) {
            state.finalTranscript = '';
            state.interimTranscript = '';
            state.recognition.start();
        }
    }

    stop() {
        if (state.recognition) {
            state.recognition.stop();
            state.isRecording = false;
            this.updateUI();
            websocketManager.updateStatus('Ready to start');
        }
    }

    sendTranscript = debounce((transcript) => {
        websocketManager.send({
            type: 'transcript_segment',
            session_id: state.currentSession,
            segment: transcript,
            is_final: true
        });
    }, 300);

    updateUI() {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        
        if (startButton && stopButton) {
            startButton.disabled = state.isRecording;
            stopButton.disabled = !state.isRecording;
        }
    }
}

// Initialize managers
const websocketManager = new WebSocketManager();
const audioRecorder = new AudioRecorder();
const speechManager = new SpeechRecognitionManager();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Setup UI event listeners
    setupUIEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    currentYearSpan.textContent = new Date().getFullYear();
    updateUIForRecordingState();
    switchTab('left', 'liveTranscription');
    switchTab('right', 'realtimeSuggestions');
});

function setupUIEventListeners() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const clearButton = document.getElementById('clearButton');
    
    if (startButton) {
        startButton.addEventListener('click', () => {
            speechManager.start();
        });
    }
    
    if (stopButton) {
        stopButton.addEventListener('click', () => {
            speechManager.stop();
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            const outputDisplay = document.getElementById('outputDisplay');
            if (outputDisplay) {
                outputDisplay.innerHTML = '<p class="text-gray-500 italic">Your generated note will appear here...</p>';
            }
            const additionalContext = document.getElementById('additionalContext');
            if (additionalContext) {
                additionalContext.value = '';
            }
            state.finalTranscript = '';
            state.interimTranscript = '';
        });
    }
}

function updateDateTime() {
    const now = new Date();
    dateTimeDisplay.textContent = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (!visitDateInput.value) {
        visitDateInput.valueAsDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (state.isRecording && !state.isPaused) {
            secondsElapsed++;
            recordingDuration.textContent = formatTime(secondsElapsed);
        }
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }
function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    transcriptWordCount = 0;
    recordingDuration.textContent = formatTime(0);
}

function displayError(message, containerId = 'transcriptionOutput') {
    const container = document.getElementById(containerId);
    if (!container) { console.error(`Container ${containerId} not found for error.`); return; }
    const errorElement = document.createElement('p');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    if (container.firstChild && container.firstChild.textContent && container.firstChild.textContent.includes("will appear here")) {
        container.innerHTML = '';
    }
    container.appendChild(errorElement);
    container.scrollTop = container.scrollHeight;
}

function clearAllPlaceholders() {
    const areas = [transcriptionOutput, realtimeSuggestionsOutput, aiNotesOutput, aiAnalysisContentOutput, discussionChatOutput];
    areas.forEach(area => {
        if (area && area.innerHTML.includes("will appear here")) area.innerHTML = '';
        if (area && area.innerHTML.includes("Ask questions, provide case details")) area.innerHTML = '';
        if (area && area.innerHTML.includes("AI generated Case Summary")) area.innerHTML = '';

    });
}

function uploadImageBtnClick() {
    imageUploadModal.classList.add('active');
    }

function closeImageModalBtnClick() {
    imageUploadModal.classList.remove('active');
}

function cancelImageAnalysisBtnClick() {
    imageUploadModal.classList.remove('active');
}

function imageUploadInputChange(event) {
    const file = event.target.files[0];
    if (file) {
        currentImageMimeType = file.type;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            currentImageBase64 = e.target.result.split(',')[1];
            imagePreviewContainer.classList.remove('hidden');
            analyzeImageBtn.disabled = false;
            imageAnalysisResult.innerHTML = '<p class="text-slate-400 italic">AI description of image findings will appear here...</p>';
            imageApprovalControls.classList.add('hidden');
        }
        reader.readAsDataURL(file);
    } else { /* Reset */ }
}

function analyzeImageBtnClick() {
    if (!currentImageBase64 || !currentImageMimeType) {
        displayError("Please select an image first.", "imageAnalysisResult");
        return;
    }
    imageAnalysisResult.innerHTML = '<p class="text-slate-500 italic">AI is analyzing the image, please wait...</p>';
    analyzeImageBtn.disabled = true;
    websocketManager.send({
        type: 'analyze_image',
        data: {
        imageBase64: currentImageBase64, 
        imageMimeType: currentImageMimeType 
        }
    });
}

function approveImageDescriptionBtnClick() {
    if (currentImageDescription) {
        websocketManager.send({
            type: 'integrate_image_description',
            data: { description: currentImageDescription }
        });
        imageUploadModal.classList.remove('active');
        // Reset modal state
        imagePreviewContainer.classList.add('hidden');
        imagePreview.src = "#";
        imageUploadInput.value = ""; 
        analyzeImageBtn.disabled = true;
        imageAnalysisResult.innerHTML = '<p class="text-slate-400 italic">AI description of image findings will appear here...</p>';
        imageApprovalControls.classList.add('hidden');
        currentImageBase64 = null; currentImageMimeType = null; currentImageDescription = "";
    }
}

function startButtonClick() {
    if (!SpeechRecognition || !websocketManager.state.websocket || websocketManager.state.websocket.readyState !== WebSocket.OPEN) {
        displayError("WebSocket not connected. Please ensure server is running and refresh.");
        return;
    }
    if (!state.isRecording) {
        // Reset states for a new recording session
        clearAllPlaceholders();
        resetTimer();
        websocketManager.send({
            type: 'start_new_session'
        });
        
        transcriptionOutput.innerHTML = '<p class="text-slate-400 italic">Initializing microphone...</p>';
        try {
            audioRecorder.start(); // onstart will set isRecording = true
        } catch (e) {
            displayError(`Could not start microphone: ${e.message}.`);
        }
    }
}

function pauseButtonClick() {
    if (!SpeechRecognition || !state.isRecording || state.isDiscussing) return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        audioRecorder.stop(); // Will trigger onend, which should not try to restart if paused
        stopTimer();
        console.log("Recording paused");
    } else {
        try {
            audioRecorder.start(); // onstart will set isPaused = false
            console.log("Recording resumed");
        } catch (e) {
            displayError(`Could not resume microphone: ${e.message}.`);
            state.isPaused = true; // Revert if failed
        }
    }
    websocketManager.updateUIForRecordingState();
}

function stopButtonClick() {
    if (!SpeechRecognition || !state.isRecording || state.isDiscussing) return;
    
    state.isRecording = false;
    state.isPaused = false;
    audioRecorder.stop();
    stopTimer();
    websocketManager.updateUIForRecordingState();
    websocketManager.send({
        type: 'stop_finalize_recording'
});
}

function sendFeedbackButtonClick() {
    const feedback = physicianFeedbackInput.value;
    if (feedback.trim()) {
        websocketManager.handleChatMessage(feedback, 'physician', 'discussionChatOutput');
        websocketManager.send({
            type: 'discussion_input',
            data: { text: feedback }
        });
        physicianFeedbackInput.value = '';
    }
}

function physicianFeedbackInputKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFeedbackButtonClick();
    }
}

function discussMicButtonClick() {
    if (!discussionRecognition || state.isRecording || !websocketManager.state.websocket || websocketManager.state.websocket.readyState !== WebSocket.OPEN) return;
    if (state.isDiscussing) {
        discussionRecognition.stop();
    } else {
        if (discussionChatOutput.innerHTML.includes("will appear here")) {
            discussionChatOutput.innerHTML = '';
        }
        try {
            discussionRecognition.start(); // onstart will set isDiscussing = true
        } catch (e) {
            displayError(`Could not start discussion mic: ${e.message}.`, 'discussionChatOutput');
        }
    }
}

function saveButtonClick() {
    // Client-side save is a bit redundant if backend handles persistence.
    // This can be a "download current state" button.
    websocketManager.send({
        type: 'request_session_data_for_save'
    });
    // The server would then send back the data, and client can trigger download.
    // For now, just log a message.
    console.log("Save button clicked. In a full app, this would trigger a download or server-side save confirmation.");
    alert("Session data would be saved/downloaded here. For this demo, check server logs if persistence is implemented there.");
}

function adjustMinHeight() {
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        // const apiBarHeight = document.querySelector('.bg-slate-200')?.offsetHeight || 0; // API bar removed from client
        const patientBarHeight = document.querySelector('.bg-slate-100')?.offsetHeight || 0;
        const controlsHeight = document.querySelector('.bg-white.py-3.px-4')?.offsetHeight || 0;
        const footerHeight = document.querySelector('footer')?.offsetHeight || 0;
        const mainPadding = 32; 
        const tabNavHeight = document.querySelector('.border-b.border-slate-200 nav')?.offsetHeight || 40; 

        const availableHeight = window.innerHeight - headerHeight - patientBarHeight - controlsHeight - footerHeight - mainPadding - tabNavHeight - 40; 

        document.querySelectorAll('.lg\\:min-h-\\[calc\\(100vh-364px\\)\\]').forEach(el => { // Adjusted class name
            el.style.minHeight = `${Math.max(250, availableHeight)}px`; 
        });
}

    window.addEventListener('resize', adjustMinHeight);