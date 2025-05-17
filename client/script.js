// client/script.js

// --- Configuration ---
const WEBSOCKET_URL = "wss://dermascribe-backend.onrender.com"; // Ensure this matches your backend WebSocket server

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
let websocket;
let currentSessionId = null;
let isRecording = false;
let isPaused = false;
let isDiscussing = false; // For the discussion mic specifically
let currentImageBase64 = null;
let currentImageMimeType = null;
let currentImageDescription = ""; 

let timerInterval;
let secondsElapsed = 0;
let transcriptWordCount = 0; // Used by client for simple display, backend might do more complex tracking

// --- Web Speech API ---
let recognition;
let discussionRecognition;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function initializeRecognitionInstance() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    return rec;
}

if (SpeechRecognition) {
    recognition = initializeRecognitionInstance();
    discussionRecognition = initializeRecognitionInstance();
} else {
    console.error("Speech Recognition API not supported in this browser.");
    displayError("Speech Recognition API not supported. Try Chrome or Edge.");
    if(startButton) startButton.disabled = true;
    if(discussMicButton) discussMicButton.disabled = true;
}


// --- WebSocket Logic ---
function connectWebSocket() {
    websocket = new WebSocket(WEBSOCKET_URL);

    websocket.onopen = () => {
        console.log("WebSocket connection established.");
        // You could send an initial message if needed, e.g., to join a specific room or send client info
    };

    websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received from server:", message);

        switch (message.type) {
            case "connection_ack":
                currentSessionId = message.sessionId;
                console.log("Server Acknowledged Connection. Session ID:", currentSessionId);
                // Enable start button or other UI elements
                if(startButton) startButton.disabled = false;
                break;
            case "status":
                // Display status messages, e.g., "AI is thinking..."
                // You might want a dedicated status area or update a specific output
                let statusAreaId = 'discussionChatOutput'; // Default for general status
                if (message.area === 'suggestions') statusAreaId = 'realtimeSuggestionsOutput';
                else if (message.area === 'notes') statusAreaId = 'aiNotesOutput';
                else if (message.area === 'analysis') statusAreaId = 'aiAnalysisContentOutput';
                
                const statusArea = document.getElementById(statusAreaId);
                if (statusArea) {
                    const tempStatus = document.createElement('p');
                    tempStatus.className = 'text-sm text-slate-500 italic my-1 p-2';
                    tempStatus.textContent = message.message;
                    if (statusArea.firstChild && statusArea.firstChild.textContent && statusArea.firstChild.textContent.includes("will appear here")) {
                        statusArea.innerHTML = ''; // Clear placeholder
                    }
                    statusArea.appendChild(tempStatus);
                    statusArea.scrollTop = statusArea.scrollHeight;
                     // Remove after a delay if it's a temporary status
                    if (!message.persistent) {
                        setTimeout(() => { if (tempStatus.parentNode) tempStatus.remove(); }, 3000);
                    }
                }
                break;
            case "realtime_suggestions":
                displayRealtimeSuggestions(message.suggestions, message.message);
                break;
            case "initial_generation_complete":
                displayFormattedNotes(message.draftNote, 'aiNotesOutput');
                displayFormattedNotes(message.aiAnalysis, 'aiAnalysisContentOutput');
                if (message.message) addChatMessage(message.message, "ai", "discussionChatOutput");
                switchTab('right', 'draftedNote');
                switchTab('left', 'aiAnalysis');
                saveButton.disabled = false;
                break;
            case "note_updated":
                displayFormattedNotes(message.draftNote, 'aiNotesOutput');
                 if (message.message) addChatMessage(message.message, "ai", "discussionChatOutput");
                switchTab('right', 'draftedNote');
                saveButton.disabled = false;
                break;
            case "analysis_updated": // New case for analysis update
                displayFormattedNotes(message.aiAnalysis, 'aiAnalysisContentOutput');
                if (message.message) addChatMessage(message.message, "ai", "discussionChatOutput"); // Or a dedicated analysis chat
                switchTab('left', 'aiAnalysis');
                saveButton.disabled = false; // Assuming save should be enabled if analysis is updated
                break;
            case "image_analysis_result":
                imageAnalysisResult.textContent = message.description;
                currentImageDescription = message.description;
                imageApprovalControls.classList.remove('hidden');
                analyzeImageBtn.disabled = false;
                break;
            case "discussion_response":
                addChatMessage(message.text, "ai", "discussionChatOutput");
                break;
            case "error":
                displayError(message.message, message.area || 'transcriptionOutput');
                // Potentially reset UI states if it's a critical error
                if (message.critical) {
                    isRecording = false; isPaused = false; isDiscussing = false;
                    updateUIForRecordingState();
                }
                break;
            default:
                console.warn("Unknown message type from server:", message.type);
        }
    };

    websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        displayError("WebSocket connection error. Ensure the backend server is running.", "transcriptionOutput");
        if(startButton) startButton.disabled = true; // Disable start if WS fails
    };

    websocket.onclose = () => {
        console.log("WebSocket connection closed.");
        displayError("Connection to server lost. Please refresh.", "transcriptionOutput");
        isRecording = false; isPaused = false; isDiscussing = false;
        updateUIForRecordingState();
        if(startButton) startButton.disabled = true;
    };
}

function sendMessageToServer(type, data = {}) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        const message = { type, data: { ...data, sessionId: currentSessionId, modelName: modelNameClientInput.value } };
        websocket.send(JSON.stringify(message));
    } else {
        console.error("WebSocket is not connected.");
        displayError("Not connected to server. Please refresh.", "transcriptionOutput");
    }
}

// --- UI & Helper Functions --- (Many are similar to previous version)
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
        if (isRecording && !isPaused) {
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

function updateUIForRecordingState() {
    // Simplified: actual state managed by server events or direct user action
    startButton.disabled = (isRecording && !isPaused) || isDiscussing;
    pauseButton.disabled = !isRecording || isDiscussing;
    stopButton.disabled = !isRecording || isDiscussing;
    saveButton.disabled = isRecording || isDiscussing || !document.getElementById('aiNotesOutput').textContent.trim() || document.getElementById('aiNotesOutput').textContent.includes("will appear here"); // Enable if note exists
    discussMicButton.disabled = isRecording || isDiscussing;
    uploadImageBtn.disabled = isRecording || isDiscussing;

    if (isDiscussing) {
        discussMicButton.classList.add('text-red-500');
        discussMicButton.title = "Stop Discussion Recording";
    } else {
        discussMicButton.classList.remove('text-red-500');
        discussMicButton.title = "Use Microphone for Feedback";
    }

    if (isRecording && !isPaused) {
        recordingStatus.textContent = 'Recording...';
        recordingStatus.classList.remove('text-red-500', 'text-yellow-500');
        recordingStatus.classList.add('text-green-500');
        pauseButton.innerHTML = '<span class="material-symbols-outlined mr-2">pause</span>Pause';
    } else if (isRecording && isPaused) {
        recordingStatus.textContent = 'Paused';
        recordingStatus.classList.remove('text-red-500', 'text-green-500');
        recordingStatus.classList.add('text-yellow-500');
        pauseButton.innerHTML = '<span class="material-symbols-outlined mr-2">play_arrow</span>Resume';
        startButton.disabled = true;
    } else {
        recordingStatus.textContent = 'Not Recording';
        recordingStatus.classList.remove('text-green-500', 'text-yellow-500');
        recordingStatus.classList.add('text-red-500');
        pauseButton.innerHTML = '<span class="material-symbols-outlined mr-2">pause</span>Pause';
        pauseButton.disabled = true;
        startButton.disabled = isDiscussing;
    }
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

window.switchTab = (column, tabName) => {
    let tabButtonsQuery, tabContentsQuery, activeBtnId, activeContentId;
    if (column === 'left') {
        tabButtonsQuery = '#tabLiveTranscriptionBtn, #tabDiscussNoteBtn, #tabAiAnalysisBtn';
        tabContentsQuery = '#tabContentLiveTranscription, #tabContentDiscussNote, #tabContentAiAnalysis';
    } else {
        tabButtonsQuery = '#tabRealtimeSuggestionsBtn, #tabDraftedNoteBtn';
        tabContentsQuery = '#tabContentRealtimeSuggestions, #tabContentDraftedNote';
    }
    activeBtnId = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`;
    activeContentId = `tabContent${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;

    document.querySelectorAll(tabButtonsQuery).forEach(button => button.classList.remove('active'));
    document.querySelectorAll(tabContentsQuery).forEach(content => content.classList.remove('active'));
    
    const activeBtn = document.getElementById(activeBtnId);
    const activeContent = document.getElementById(activeContentId);
    if(activeBtn) activeBtn.classList.add('active');
    if(activeContent) activeContent.classList.add('active');
};

function displayRealtimeSuggestions(suggestionsArray, messageIfEmpty) {
    if (realtimeSuggestionsOutput.innerHTML.includes("will appear here")) {
        realtimeSuggestionsOutput.innerHTML = '';
    }
    // Clear only old "thinking" or "no suggestions" messages
    const oldStatusMessages = realtimeSuggestionsOutput.querySelectorAll('.italic.text-slate-500, .italic.text-slate-400');
    oldStatusMessages.forEach(msg => msg.remove());

    if (suggestionsArray && suggestionsArray.length > 0) {
        suggestionsArray.forEach(suggestionText => {
            const p = document.createElement('p');
            p.className = 'note-item animate-fadeIn';
            p.innerHTML = `<strong>Suggestion:</strong> ${suggestionText}`;
            realtimeSuggestionsOutput.insertBefore(p, realtimeSuggestionsOutput.firstChild);
        });
    } else if (messageIfEmpty) {
        const p = document.createElement('p');
        p.className = 'note-item italic text-slate-400 text-xs';
        p.textContent = messageIfEmpty;
        realtimeSuggestionsOutput.insertBefore(p, realtimeSuggestionsOutput.firstChild);
        setTimeout(() => {if(p.parentNode) p.remove();}, 5000);
    }
    while (realtimeSuggestionsOutput.children.length > 7) {
        realtimeSuggestionsOutput.removeChild(realtimeSuggestionsOutput.lastChild);
    }
}


// --- Speech Recognition Event Handlers ---
function setupRecognitionEvents(recInstance, isDiscussionMic = false) {
    if (!recInstance) return;
    let currentLineElement = null; // Manages the current line being transcribed visually

    recInstance.onstart = () => {
        console.log(`Speech recognition started (${isDiscussionMic ? 'discussion' : 'main'}).`);
        if (isDiscussionMic) {
            isDiscussing = true;
            // UI updates for discussion mic
            discussMicButton.classList.add('text-red-500', 'animate-pulse');
            physicianFeedbackInput.disabled = true;
            sendFeedbackButton.disabled = true;
        } else { // Main recording
            isRecording = true;
            isPaused = false;
            startTimer();
            clearAllPlaceholders();
            // Real-time suggestions will be triggered by server based on transcript segments
        }
        updateUIForRecordingState();
    };

    recInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscriptSegment += transcriptPart;
                sendMessageToServer("transcript_segment", { segment: transcriptPart, is_final: true });
                if (!isDiscussionMic) transcriptWordCount += transcriptPart.split(' ').filter(Boolean).length;
            } else {
                interimTranscript += transcriptPart;
                // Optionally send interim results to server for even faster (but less accurate) processing
                // sendMessageToServer("transcript_segment", { segment: transcriptPart, is_final: false });
            }
        }
        
        const outputTarget = isDiscussionMic ? discussionChatOutput : transcriptionOutput;
        // Visual update for live transcription
        if (interimTranscript || finalTranscriptSegment) {
             if (outputTarget.innerHTML.includes("will appear here") || (outputTarget.firstChild && outputTarget.firstChild.classList && outputTarget.firstChild.classList.contains('text-slate-400'))) {
                outputTarget.innerHTML = ''; // Clear placeholder
            }
        }

        if (interimTranscript) {
            if (!currentLineElement || (currentLineElement && finalTranscriptSegment)) {
                if (currentLineElement && currentLineElement.querySelector('.blinking-cursor')) {
                    currentLineElement.querySelector('.blinking-cursor').remove();
                }
                currentLineElement = document.createElement('p');
                currentLineElement.className = 'mb-1';
                outputTarget.appendChild(currentLineElement);
            }
            currentLineElement.innerHTML = `<span class="text-slate-700">${finalTranscriptSegment || ''}</span><span class="text-slate-500">${interimTranscript}</span><span class="blinking-cursor">|</span>`;
        }

        if (finalTranscriptSegment) {
             if (currentLineElement && currentLineElement.querySelector('.blinking-cursor')) {
                currentLineElement.querySelector('.blinking-cursor').remove();
            }
            const finalP = document.createElement('p');
            finalP.className = 'mb-1 text-slate-700';
            finalP.textContent = finalTranscriptSegment;
            
            if(currentLineElement && currentLineElement.textContent.startsWith(finalTranscriptSegment.trim())) {
                currentLineElement.innerHTML = `<span class="text-slate-700">${finalTranscriptSegment}</span>`;
            } else { 
                outputTarget.appendChild(finalP);
            }
            currentLineElement = null; 
        }
        outputTarget.scrollTop = outputTarget.scrollHeight;
    };

    recInstance.onerror = (event) => {
        console.error(`Speech recognition error (${isDiscussionMic ? 'discussion' : 'main'}):`, event.error);
        displayError(`Speech error: ${event.error}.`, isDiscussionMic ? 'discussionChatOutput' : 'transcriptionOutput');
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            if(isRecording && !isDiscussionMic) stopButton.click(); // Simulate stop
            if(isDiscussing && isDiscussionMic) { 
                isDiscussing = false;
                discussMicButton.classList.remove('text-red-500', 'animate-pulse');
                physicianFeedbackInput.disabled = false;
                sendFeedbackButton.disabled = false;
                updateUIForRecordingState();
            }
        }
    };

    recInstance.onend = () => {
        console.log(`Speech recognition ended (${isDiscussionMic ? 'discussion' : 'main'}).`);
         if (currentLineElement && currentLineElement.querySelector('.blinking-cursor')) {
            currentLineElement.querySelector('.blinking-cursor').remove();
        }
        if (isDiscussionMic) {
            isDiscussing = false;
            discussMicButton.classList.remove('text-red-500', 'animate-pulse');
            physicianFeedbackInput.disabled = false;
            sendFeedbackButton.disabled = false;
            updateUIForRecordingState();
            // The final segment is sent by onresult, no need to send tempTranscript here
        } else if (isRecording && !isPaused) { // Main mic ended unexpectedly while it should be recording
            // This can happen if user stops talking for too long. Try to restart.
            console.log("Main recognition ended but still in recording state. Attempting restart.");
            if (recognition && !isPaused) { // Check isPaused again in case it changed
                try { recognition.start(); }
                catch (e) { console.error("Error restarting main recognition:", e); }
            }
        } else { // Main mic ended due to pause or stop
             clearInterval(aiSuggestionInterval);
        }
    };
}

if (recognition) setupRecognitionEvents(recognition, false);
if (discussionRecognition) setupRecognitionEvents(discussionRecognition, true);


function displayFormattedNotes(notesText, outputElementId) {
    const outputDiv = document.getElementById(outputElementId);
    outputDiv.innerHTML = ''; 
    const lines = notesText.split('\n');
    let currentSectionDiv = null;
    let currentList = null; 

    const knownSectionTitles = [
        "CHIEF COMPLAINT", "HISTORY OF PRESENT ILLNESS", "PAST MEDICAL HISTORY", 
        "MEDICATIONS", "ALLERGIES", "OBJECTIVE FINDINGS", "ASSESSMENT", "PLAN",
        "CASE SUMMARY", 
        "DIFFERENTIAL DIAGNOSIS (ORDERED BY LIKELIHOOD)", "RATIONALE FOR DIFFERENTIALS",
        "POTENTIAL \"DON'T MISS\" DIAGNOSES (IF APPLICABLE)", 
        "SUGGESTED WORKUP (FOR TOP DIFFERENTIALS)",
        "ADDITIONAL WORKUP (FOR \"DON'T MISS\" DIAGNOSES, IF APPLICABLE AND PERTINENT)"
    ].map(s => s.toUpperCase()); 

    lines.forEach(line => {
        const trimmedLine = line.trim();
        const upperTrimmedLine = trimmedLine.toUpperCase();
        
        let isTitle = false;
        if (knownSectionTitles.includes(upperTrimmedLine)) {
            isTitle = true;
        }

        if (isTitle) {
            if (currentSectionDiv && currentSectionDiv.children.length === 1 && currentSectionDiv.firstChild.classList.contains('ai-note-section-title')) { 
                const emptyText = document.createElement('p');
                emptyText.className = 'empty-section-text pl-4';
                const sectionTitleText = currentSectionDiv.firstChild.textContent.toUpperCase();
                 if (sectionTitleText === 'ALLERGIES' || sectionTitleText === 'MEDICATIONS' || sectionTitleText === 'PAST MEDICAL HISTORY') {
                     emptyText.textContent = 'None identified from transcript.';
                 } else if (sectionTitleText.includes("DON'T MISS") && sectionTitleText.includes("IF APPLICABLE")) {
                     emptyText.textContent = 'No critical "don\'t miss" diagnoses immediately apparent based on current information.';
                 }  else if (sectionTitleText.includes("ADDITIONAL WORKUP") && sectionTitleText.includes("IF APPLICABLE AND PERTINENT")) {
                     emptyText.textContent = 'N/A';
                 }
                 if(emptyText.textContent) currentSectionDiv.appendChild(emptyText);
            }

            if (currentSectionDiv) outputDiv.appendChild(currentSectionDiv); 
            
            currentSectionDiv = document.createElement('div');
            currentSectionDiv.className = 'ai-note-section';

            const titleElement = document.createElement('h3');
            titleElement.className = 'ai-note-section-title';
            titleElement.textContent = trimmedLine; 
            currentSectionDiv.appendChild(titleElement);
            currentList = null; 
        } else if (currentSectionDiv) { 
            let processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            if (processedLine.startsWith('- ') || processedLine.startsWith('* ')) {
                if (!currentList || currentList.tagName !== 'UL') { 
                    currentList = document.createElement('ul');
                    currentList.className = 'list-disc'; 
                    currentSectionDiv.appendChild(currentList);
                }
                const li = document.createElement('li');
                li.innerHTML = processedLine.substring(processedLine.indexOf(' ') + 1);
                currentList.appendChild(li);
            } else if (processedLine.match(/^\d+\.\s/)) { 
                 if (!currentList || currentList.tagName !== 'OL') { 
                    currentList = document.createElement('ol');
                    currentList.className = 'list-decimal';
                    currentSectionDiv.appendChild(currentList);
                }
                const li = document.createElement('li');
                li.innerHTML = processedLine.substring(processedLine.indexOf(' ') + 1);
                currentList.appendChild(li);
            } else if (processedLine) { 
                const p = document.createElement('p');
                p.innerHTML = processedLine;
                currentSectionDiv.appendChild(p);
                currentList = null; 
            } else if (!trimmedLine && currentSectionDiv.children.length > 1 ) { 
                const lastChild = currentSectionDiv.lastChild;
                if (!(lastChild.tagName === 'P' && lastChild.innerHTML === '&nbsp;')) {
                    const p = document.createElement('p');
                    p.innerHTML = '&nbsp;'; 
                    currentSectionDiv.appendChild(p);
                }
                currentList = null; 
            }
        } else if (trimmedLine) { 
             const p = document.createElement('p');
             p.innerHTML = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
             outputDiv.appendChild(p);
        }
    });
    if (currentSectionDiv) { 
         if (currentSectionDiv.children.length === 1 && currentSectionDiv.firstChild.classList.contains('ai-note-section-title')) { 
            const emptyText = document.createElement('p');
            emptyText.className = 'empty-section-text pl-4';
             const sectionTitleText = currentSectionDiv.firstChild.textContent.toUpperCase();
             if (sectionTitleText === 'ALLERGIES' || sectionTitleText === 'MEDICATIONS' || sectionTitleText === 'PAST MEDICAL HISTORY') {
                 emptyText.textContent = 'None identified from transcript.';
             } else if (sectionTitleText.includes("DON'T MISS") && sectionTitleText.includes("IF APPLICABLE")) {
                 emptyText.textContent = 'None specifically identified as "Don\'t Miss" based on current information.';
             } else if (sectionTitleText.includes("ADDITIONAL WORKUP") && sectionTitleText.includes("IF APPLICABLE AND PERTINENT")) {
                 emptyText.textContent = 'N/A';
             }
             if(emptyText.textContent) currentSectionDiv.appendChild(emptyText);
        }
        outputDiv.appendChild(currentSectionDiv);
    }
    
    if (outputDiv.innerHTML.trim() === '') {
         outputDiv.innerHTML = `<p class="empty-section-text">${outputElementId === 'aiNotesOutput' ? 'Clinical note will appear here.' : 'AI Analysis will appear here.'}</p>`;
    }
    outputDiv.scrollTop = 0; 
}

function addChatMessage(text, sender, outputElementId = 'discussionChatOutput') { 
    const chatOutputDiv = document.getElementById(outputElementId);
    if(!chatOutputDiv) return; 

    if (chatOutputDiv.innerHTML.includes("will appear here") || (chatOutputDiv.firstChild && chatOutputDiv.firstChild.nodeName === 'P' && chatOutputDiv.firstChild.classList.contains('text-slate-400'))) {
        chatOutputDiv.innerHTML = '';
    }
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'physician' ? 'chat-bubble-physician' : 'chat-bubble-ai'}`;
    bubble.textContent = text;
    chatOutputDiv.appendChild(bubble);
    chatOutputDiv.scrollTop = chatOutputDiv.scrollHeight;
}

// --- Image Modal Logic ---
uploadImageBtn.addEventListener('click', () => imageUploadModal.classList.add('active'));
closeImageModalBtn.addEventListener('click', () => imageUploadModal.classList.remove('active'));
cancelImageAnalysisBtn.addEventListener('click', () => imageUploadModal.classList.remove('active'));

imageUploadInput.addEventListener('change', (event) => {
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
});

analyzeImageBtn.addEventListener('click', () => {
    if (!currentImageBase64 || !currentImageMimeType) {
        displayError("Please select an image first.", "imageAnalysisResult");
        return;
    }
    imageAnalysisResult.innerHTML = '<p class="text-slate-500 italic">AI is analyzing the image, please wait...</p>';
    analyzeImageBtn.disabled = true;
    sendMessageToServer("analyze_image", { 
        imageBase64: currentImageBase64, 
        imageMimeType: currentImageMimeType 
    });
});

approveImageDescriptionBtn.addEventListener('click', () => {
    if (currentImageDescription) {
        sendMessageToServer("integrate_image_description", { description: currentImageDescription });
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
});


// --- Button Event Listeners ---
startButton.addEventListener('click', () => {
    if (!SpeechRecognition || !websocket || websocket.readyState !== WebSocket.OPEN) {
        displayError("WebSocket not connected. Please ensure server is running and refresh.");
        return;
    }
    if (!isRecording) {
        // Reset states for a new recording session
        clearAllPlaceholders();
        resetTimer();
        sendMessageToServer("start_new_session"); // Inform backend to reset session data
        
        transcriptionOutput.innerHTML = '<p class="text-slate-400 italic">Initializing microphone...</p>';
        try {
            recognition.start(); // onstart will set isRecording = true
        } catch (e) {
            displayError(`Could not start microphone: ${e.message}.`);
        }
    }
});

pauseButton.addEventListener('click', () => {
    if (!SpeechRecognition || !isRecording || isDiscussing) return;
    isPaused = !isPaused;
    if (isPaused) {
        recognition.stop(); // Will trigger onend, which should not try to restart if paused
        stopTimer();
        clearInterval(aiSuggestionInterval);
        console.log("Recording paused");
    } else {
        try {
            recognition.start(); // onstart will set isPaused = false
            // aiSuggestionInterval = setInterval(fetchAndDisplayAiSuggestions, 15000); // Restart suggestions
            console.log("Recording resumed");
        } catch (e) {
            displayError(`Could not resume microphone: ${e.message}.`);
            isPaused = true; // Revert if failed
        }
    }
    updateUIForRecordingState();
});

stopButton.addEventListener('click', () => {
    if (!SpeechRecognition || !isRecording || isDiscussing) return;
    
    isRecording = false;
    isPaused = false;
    recognition.stop();
    stopTimer();
    clearInterval(aiSuggestionInterval);
    updateUIForRecordingState();
    sendMessageToServer("stop_finalize_recording");
});

sendFeedbackButton.addEventListener('click', () => {
    const feedback = physicianFeedbackInput.value;
    if (feedback.trim()) {
        addChatMessage(feedback, 'physician', 'discussionChatOutput');
        sendMessageToServer("discussion_input", { text: feedback });
        physicianFeedbackInput.value = '';
    }
});

physicianFeedbackInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFeedbackButton.click();
    }
});

discussMicButton.addEventListener('click', () => {
    if (!discussionRecognition || isRecording || !websocket || websocket.readyState !== WebSocket.OPEN) return;
    if (isDiscussing) {
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
});

saveButton.addEventListener('click', () => {
    // Client-side save is a bit redundant if backend handles persistence.
    // This can be a "download current state" button.
    sendMessageToServer("request_session_data_for_save");
    // The server would then send back the data, and client can trigger download.
    // For now, just log a message.
    console.log("Save button clicked. In a full app, this would trigger a download or server-side save confirmation.");
    alert("Session data would be saved/downloaded here. For this demo, check server logs if persistence is implemented there.");
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    currentYearSpan.textContent = new Date().getFullYear();
    updateUIForRecordingState();
    switchTab('left', 'liveTranscription');
    switchTab('right', 'realtimeSuggestions');
    connectWebSocket(); // Establish WebSocket connection on load

    const adjustMinHeight = () => {
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
    };
    adjustMinHeight();
    window.addEventListener('resize', adjustMinHeight);
});

</script>
</body>
</html>
