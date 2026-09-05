		        // ========== WebSocket Backend Integration ==========
		        const DEFAULT_WS_PORT = 8765;
			        const WS_URL_STORAGE_KEY = 'dermascribe.websocketUrl';
			        const TOKEN_STORAGE_KEY = 'dermascribe.sessionToken';
			        const JWT_TOKEN_STORAGE_KEY = 'dermascribe.sessionJwt';
			        const REMEMBER_AUTH_STORAGE_KEY = 'dermascribe.rememberBackendAuth';
			        const SENSITIVE_STORAGE_KEYS = new Set([
			            TOKEN_STORAGE_KEY,
			            JWT_TOKEN_STORAGE_KEY
			        ]);

			        function isSensitiveStorageKey(key) {
			            return SENSITIVE_STORAGE_KEYS.has(key);
			        }
			
			        function getRememberAuthEnabled() {
			            return localStorage.getItem(REMEMBER_AUTH_STORAGE_KEY) === 'true';
			        }
			
			        function getStoredValue(key) {
			            if (isSensitiveStorageKey(key)) {
			                return sessionStorage.getItem(key) || '';
			            }
			            return sessionStorage.getItem(key) || localStorage.getItem(key) || '';
			        }
			
			        function setStoredValue(key, value, remember) {
			            const cleaned = (value || '').trim();
			            if (isSensitiveStorageKey(key)) {
			                if (cleaned) {
			                    sessionStorage.setItem(key, cleaned);
			                } else {
			                    sessionStorage.removeItem(key);
			                }
			                localStorage.removeItem(key);
			                return;
			            }

			            if (remember) {
			                if (cleaned) {
			                    localStorage.setItem(key, cleaned);
			                } else {
			                    localStorage.removeItem(key);
			                }
			                sessionStorage.removeItem(key);
			            } else {
			                if (cleaned) {
			                    sessionStorage.setItem(key, cleaned);
			                } else {
			                    sessionStorage.removeItem(key);
			                }
			                localStorage.removeItem(key);
			            }
			        }
		
		        function getWebSocketUrl() {
		            const stored = getStoredValue(WS_URL_STORAGE_KEY);
		            if (stored) return stored;
		
		            const hostname = window.location.hostname;
		            if (hostname === 'localhost' || hostname === '127.0.0.1') {
		                return `ws://localhost:${DEFAULT_WS_PORT}`;
		            }
		            // On static hosts (e.g., GitHub Pages), the backend will be on a different host.
		            // Do not guess an invalid default like `${hostname}:${DEFAULT_WS_PORT}`.
		            return '';
		        }

        let websocket = null;
        let currentSessionId = null;
        let wsConnected = false;
	        let wsReconnectAttempts = 0;
	        const MAX_RECONNECT_ATTEMPTS = 5;
	        let pendingRequests = new Map();
	        let fullTranscript = '';
	        let currentDraftNote = '';
	        let currentAiAnalysis = '';
	        let pendingSaveRequest = null;
	        let currentManagementPlan = '';

		        // Global state
			        let currentMode = null;
			        let isRecording = false;
			        let recognition = null;
			        let transcriptionUiInitialized = false;
			        let sessionToken = getStoredValue(TOKEN_STORAGE_KEY);
			        let sessionJwtToken = sessionStorage.getItem(JWT_TOKEN_STORAGE_KEY) || '';
			        let sessionStartTime = null;
			        let sessionAnalytics = {
			            transcriptionWords: 0,
		            aiGenerations: 0,
		            exportCount: 0
	        };

		        // Auto-save / recovery (research prototype quality-of-life)
		        const AUTOSAVE_INTERVAL_MS = 30000;
		        let autosaveTimerId = null;
		        let autosaveDirty = false;

		        function setRecoveryBanner(message, variant = 'info') {
		            const banner = document.getElementById('recovery-banner');
		            if (!banner) return;
		            banner.classList.remove('hidden');
		            banner.classList.toggle('is-success', variant === 'success');
		            banner.classList.toggle('is-error', variant === 'error');
		            banner.innerHTML = `<h3>Session Recovery</h3><p>${message}</p>`;
		        }

		        function hideRecoveryBanner() {
		            const banner = document.getElementById('recovery-banner');
		            if (!banner) return;
		            banner.classList.add('hidden');
		            banner.innerHTML = '';
		        }
		
		        function base64urlEncode(text) {
		            const bytes = new TextEncoder().encode(text);
		            let binary = '';
		            bytes.forEach((b) => {
		                binary += String.fromCharCode(b);
		            });
		            return btoa(binary)
		                .replace(/\+/g, '-')
		                .replace(/\//g, '_')
		                .replace(/=+$/g, '');
		        }
		
		        function buildAuthProtocols(token) {
		            if (!token) return [];
		            return [`ramie-auth.${base64urlEncode(token)}`];
		        }

		        // ========== WebSocket Connection Manager ==========
		        function connectWebSocket() {
		            if (websocket && websocket.readyState === WebSocket.OPEN) return;

		            const activeToken = (sessionJwtToken || sessionToken || '').trim();
		            if (!activeToken) {
		                updateConnectionStatus(false);
		                return;
		            }

	            let wsUrl;
	            try {
	                wsUrl = new URL(getWebSocketUrl());
	            } catch (e) {
		                showNotification('Invalid WebSocket URL. Please update Backend Connection settings.', 'error');
		                updateConnectionStatus(false);
		                return;
		            }
		
		            websocket = new WebSocket(wsUrl.toString(), buildAuthProtocols(activeToken));

            websocket.onopen = () => {
                console.log('WebSocket connection established');
                wsConnected = true;
                wsReconnectAttempts = 0;
                updateConnectionStatus(true);
            };

            websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (!message || typeof message !== 'object' || typeof message.type !== 'string') throw new Error('Invalid message');
                    handleWebSocketMessage(message);
                } catch {
                    discardProvisionalOutput();
                    showNotification('Invalid server response; previous output retained.', 'error');
                }
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                updateConnectionStatus(false);
            };

		            websocket.onclose = (event) => {
		                console.log('WebSocket connection closed');
                        discardProvisionalOutput();
		                wsConnected = false;
		                updateConnectionStatus(false);

		                if (event && event.code === 4008) {
		                    // Backend uses 4008 for auth required.
		                    // If we were using a short-lived server-issued JWT, clear it and retry using the
		                    // configured long-lived access token (shared secret or JWT).
		                    if (sessionJwtToken) {
		                        sessionJwtToken = '';
		                        sessionStorage.removeItem(JWT_TOKEN_STORAGE_KEY);
		                        showNotification('Session token expired. Reconnecting with configured access token…', 'warning');
		                        try {
		                            if (websocket) websocket.close();
		                        } catch (e) {
		                            // ignore
		                        }
		                        websocket = null;
		                        wsConnected = false;
		                        wsReconnectAttempts = 0;
		                        connectWebSocket();
		                        return;
		                    }
		                    showNotification('Authentication required. Set a valid backend token to connect.', 'error');
		                    return;
		                }
		                attemptReconnect();
		            };
		        }

		        function attemptReconnect() {
		            if (!sessionToken && !sessionJwtToken) return;
		            if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
		                wsReconnectAttempts++;
		                const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 30000);
	                console.log(`Reconnecting in ${delay}ms (attempt ${wsReconnectAttempts})...`);
	                setTimeout(connectWebSocket, delay);
	            } else {
	                showNotification('Unable to connect to AI server. Please refresh the page.', 'error');
	            }
	        }

        function updateConnectionStatus(connected) {
            const statusBadge = document.getElementById('sessionMode');
            if (statusBadge) {
                if (!connected) {
                    statusBadge.textContent = 'Disconnected';
                    statusBadge.classList.remove('status-processing', 'status-recording');
                    statusBadge.classList.add('status-idle');
                }
            }
        }

        function sendToServer(type, data = {}) {
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                showNotification('Not connected to server. Attempting to reconnect...', 'warning');
                connectWebSocket();
                return false;
            }
            const message = { type, data: { ...data, sessionId: currentSessionId } };
            websocket.send(JSON.stringify(message));
            return true;
        }

	        // Streaming buffers
	        let streamBuffers = {
	            note: '',
	            chat: '',
	            analysis: ''
	        };
	        let isStreaming = false;
	
		        function escapeHtml(value) {
		            return String(value).replace(/[&<>"']/g, (ch) => {
		                switch (ch) {
		                    case '&': return '&amp;';
		                    case '<': return '&lt;';
		                    case '>': return '&gt;';
		                    case '"': return '&quot;';
		                    case "'": return '&#39;';
		                    default: return ch;
		                }
		            });
		        }
		
		        function formatInlineMarkdownSafe(text) {
		            const escaped = escapeHtml(text ?? '');
		            return escaped
		                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		                .replace(/\n/g, '<br>');
		        }
		
		        function formatBlockMarkdownSafe(text) {
		            // Escape first to prevent XSS, then apply a tiny markdown-ish formatter.
		            let html = escapeHtml(text ?? '');
		            html = html
		                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		                .replace(/^### (.*$)/gm, '<h5 class="mt-3">$1</h5>')
		                .replace(/^## (.*$)/gm, '<h4 class="text-accent mt-3">$1</h4>')
		                .replace(/^# (.*$)/gm, '<h3 class="text-accent mt-3">$1</h3>')
		                .replace(/^- (.*$)/gm, '<li>$1</li>')
		                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
		                .replace(/\n\n/g, '<br><br>')
		                .replace(/\n/g, '<br>');
		
		            // Wrap lists
		            html = html.replace(/(<li>.*<\/li>)+/g, '<ul class="mt-2">$&</ul>');
		            return html;
		        }

        function handleWebSocketMessage(message) {
            console.log('Server message:', message.type);

	            switch (message.type) {
		                case 'connection_ack':
		                    currentSessionId = message.sessionId;
		                    if (message.token) {
		                        // Server-issued JWTs are short-lived; keep them session-scoped and separate from
		                        // the user-configured long-lived access token.
		                        sessionJwtToken = message.token;
		                        sessionStorage.setItem(JWT_TOKEN_STORAGE_KEY, sessionJwtToken);
		                    }
		                    loadBackendConfigIntoUI();
		                    showNotification('Connected to AI server', 'success');
		                    break;

                case 'status':
                    // Status updates from server
                    if (message.message) {
                        showNotification(message.message, 'info');
                    }
                    break;

                case 'realtime_suggestions':
                    displayRealtimeSuggestions(message.suggestions);
                    break;

		                case 'initial_generation_complete':
		                    currentDraftNote = message.draftNote || '';
		                    currentAiAnalysis = message.aiAnalysis || '';
		                    displayDifferentialDiagnosis(currentAiAnalysis);
		                    displaySOAPNote(currentDraftNote);
		                    markAutosaveDirty();
		                    sessionAnalytics.aiGenerations++;
		                    showNotification('AI outputs updated', 'success');
		                    if (currentMode === 'chat') {
		                        // In chat mode, the outputs are not visible in the 4-panel layout. Present them explicitly.
		                        openOutputsModal();
		                    }
		                    break;

                case 'stream_chunk':
                    // Handle streaming text chunks
                    isStreaming = true;
                    const streamType = message.streamType || 'note';
                    if (!Object.prototype.hasOwnProperty.call(streamBuffers, streamType) || typeof message.text !== 'string') break;
                    streamBuffers[streamType] += message.text;

                    if (streamType === 'note') {
                        displayStreamingNote(streamBuffers.note);
                    } else if (streamType === 'chat') {
                        displayStreamingChat(streamBuffers.chat);
                    } else if (streamType === 'analysis') {
                        displayStreamingAnalysis(streamBuffers.analysis);
                    }
                    break;

		                case 'stream_complete':
	                    // Streaming finished
	                    isStreaming = false;
	                    const completeType = message.streamType || 'note';

		                    if (completeType === 'note') {
	                        if (typeof message.noteText === 'string' && message.noteText.trim()) {
	                            currentDraftNote = message.noteText;
	                        } else {
                                discardProvisionalOutput();
                                showNotification('Incomplete note response; previous output retained.', 'error');
                                break;
	                        }
		                        if (typeof message.analysisText === 'string') {
		                            currentAiAnalysis = message.analysisText;
		                            displayDifferentialDiagnosis(currentAiAnalysis);
		                        }
		                        displaySOAPNote(currentDraftNote);
		                        markAutosaveDirty();
		                    } else if (completeType === 'chat') {
		                        document.getElementById('streamingChatMessage')?.remove();
	                        addChatMessage(streamBuffers.chat, 'ai');
		                    } else if (completeType === 'analysis') {
		                        currentAiAnalysis = streamBuffers.analysis;
		                        displayDifferentialDiagnosis(currentAiAnalysis);
		                        markAutosaveDirty();
		                    }

                    // Reset buffer
                    streamBuffers[completeType] = '';
                    sessionAnalytics.aiGenerations++;
                    showNotification('Generation complete', 'success');
                    break;

		                case 'note_updated':
		                    currentDraftNote = message.draftNote || '';
		                    displaySOAPNote(currentDraftNote);
		                    markAutosaveDirty();
		                    showNotification('Note updated', 'success');
		                    if (currentMode === 'chat' && document.getElementById('outputsModal')) {
		                        openOutputsModal();
		                    }
		                    break;

	                case 'session_data_response': {
	                    if (!pendingSaveRequest) {
	                        console.warn('Received session_data_response with no pending save request');
	                        break;
	                    }

	                    const { type, localSnapshot } = pendingSaveRequest;
	                    pendingSaveRequest = null;

	                    const transcriptFromServer = typeof message.transcript === 'string' ? message.transcript : '';
	                    const noteFromServer = typeof message.aiClinicalNote === 'string' ? message.aiClinicalNote : '';
	                    const analysisFromServer = typeof message.aiAnalysis === 'string' ? message.aiAnalysis : '';

	                    const merged = {
	                        ...localSnapshot,
	                        source: 'server',
	                        patientId: message.patientId,
	                        visitDate: message.visitDate,
	                        duration: message.duration,
	                        transcript: transcriptFromServer.trim() ? transcriptFromServer : (localSnapshot.transcript || fullTranscript),
	                        draftNote: noteFromServer.trim() ? noteFromServer : (localSnapshot.draftNote || currentDraftNote),
	                        aiAnalysis: analysisFromServer.trim() ? analysisFromServer : (localSnapshot.aiAnalysis || currentAiAnalysis)
	                    };

	                    // Persist the merged snapshot locally (IndexedDB).
	                    saveSessionToStorage(type, merged);
	                    break;
	                }

			                case 'discussion_response':
			                    hideTypingIndicator();
			                    if (pendingDiscussionTarget === 'management') {
			                        currentManagementPlan = message.text || '';
			                        displayManagementPlan(currentManagementPlan);
			                        markAutosaveDirty();
			                        pendingDiscussionTarget = 'chat';
			                    } else {
			                        addChatMessage(message.text, 'ai');
			                    }
			                    break;

                case 'image_analysis_result':
                    handleImageAnalysisResult(message.description);
                    break;

                case 'error':
                    if (message.area !== 'suggestions') discardProvisionalOutput();
                    showNotification(message.message || 'An error occurred', 'error');
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        }

        // Provisional text must never remain looking like a completed clinical result.
        function discardProvisionalOutput() {
            isStreaming = false;
            streamBuffers.note = '';
            streamBuffers.chat = '';
            streamBuffers.analysis = '';
            document.getElementById('streamingChatMessage')?.remove();
            hideTypingIndicator();
            displaySOAPNote(currentDraftNote);
            displayDifferentialDiagnosis(currentAiAnalysis);
        }

        // Streaming display functions
        function displayStreamingNote(text) {
            const output = document.getElementById('soapNoteOutput');
            if (!output) return;

            output.innerHTML = `
                <h4 class="text-accent mb-3">Provisional note — not saved: <span class="streaming-indicator">●</span></h4>
                <div class="ai-content streaming">
                    ${formatAiOutputRaw(text)}
                </div>
            `;
            output.scrollTop = output.scrollHeight;
        }

        function displayStreamingChat(text) {
            hideTypingIndicator();
            let streamingMsg = document.getElementById('streamingChatMessage');

            if (!streamingMsg) {
                const messagesContainer = document.getElementById('chatMessages');
                streamingMsg = document.createElement('div');
                streamingMsg.id = 'streamingChatMessage';
                streamingMsg.className = 'chat-message chat-message-ai';
                streamingMsg.innerHTML = `
                    <div class="chat-avatar">
                        <span class="material-symbols-outlined" style="color: #0f1419;">smart_toy</span>
                    </div>
                    <div class="chat-content">
                        <p class="streaming-text"></p>
                        <span class="streaming-indicator">●</span>
                    </div>
                `;
                messagesContainer.appendChild(streamingMsg);
            }

	            const textEl = streamingMsg.querySelector('.streaming-text');
	            textEl.innerHTML = formatInlineMarkdownSafe(text);

            const container = document.getElementById('chatMessages');
            container.scrollTop = container.scrollHeight;
        }

        function displayStreamingAnalysis(text) {
            const output = document.getElementById('differentialOutput');
            if (!output) return;

            output.innerHTML = `
                <h4 class="text-accent mb-3">Provisional analysis — not saved: <span class="streaming-indicator">●</span></h4>
                <div class="ai-content streaming">
                    ${formatAiOutputRaw(text)}
                </div>
            `;
        }

	        function formatAiOutputRaw(text) {
	            return formatBlockMarkdownSafe(text);
	        }

        // Function to trigger streaming generation
        function generateStreamingNote() {
            const output = document.getElementById('soapNoteOutput');
            output.innerHTML = `
                <div class="loading-spinner"></div>
                <p class="text-muted">Generating clinical note...</p>
            `;

            streamBuffers.note = '';
            sendToServer('stream_generate', {
                streamType: 'note',
                transcript: fullTranscript
            });
        }

        function sendStreamingChat(message) {
            streamBuffers.chat = '';

            // Remove streaming message element if exists
            const streamingMsg = document.getElementById('streamingChatMessage');
            if (streamingMsg) streamingMsg.remove();

            sendToServer('stream_generate', {
                streamType: 'chat',
                text: message,
                transcript: fullTranscript
            });
        }

	        function displayRealtimeSuggestions(suggestions) {
	            const output = document.getElementById('differentialOutput');
	            if (!output) return;

	            if (suggestions && suggestions.length > 0) {
	                const suggestionsHtml = suggestions.map(s =>
	                    `<p class="note-item"><strong>Suggestion:</strong> ${escapeHtml(s)}</p>`
	                ).join('');
	                output.innerHTML = suggestionsHtml + output.innerHTML;
	            }
	        }

        // Note Templates Library
        const NOTE_TEMPLATES = {
            'general-skin': {
                name: 'General Skin Exam',
                template: `**Chief Complaint:** [CC]

**History of Present Illness:**
Patient presents with [duration] history of [description] involving [location].
Associated symptoms include: [symptoms]
Aggravating factors: [factors]
Relieving factors: [factors]

**Physical Examination:**
- Distribution: [localized/generalized]
- Primary lesion: [type]
- Secondary changes: [none/scaling/crusting/lichenification]
- Color: [description]

**Assessment:**
1. [Diagnosis]

**Plan:**
- [Treatment]
- Follow-up: [timeframe]`
            },
            'acne': {
                name: 'Acne Vulgaris',
                template: `**Chief Complaint:** Acne

**HPI:**
[Age]-year-old [gender] with [duration] history of acne.
Location: [face/back/chest]
Current treatments: [list]
Previous treatments tried: [list]

**Physical Exam:**
- Comedones: [open/closed] - quantity [few/moderate/many]
- Papules: [count estimate]
- Pustules: [count estimate]
- Nodules/Cysts: [present/absent]
- Scarring: [none/atrophic/hypertrophic/post-inflammatory]

**Assessment:**
Acne vulgaris, [mild/moderate/severe], [comedonal/papulopustular/nodulocystic]

**Plan:**
- Topical: [retinoid/benzoyl peroxide/antibiotic]
- Oral: [if applicable]
- Lifestyle: Non-comedogenic products, avoid picking
- F/U: [timeframe]`
            },
            'psoriasis': {
                name: 'Psoriasis',
                template: `**Chief Complaint:** Psoriasis evaluation

**HPI:**
[Duration] history of psoriasis.
Current involvement: [scalp/elbows/knees/nails/other]
Psoriatic arthritis symptoms: [present/absent]
Prior treatments: [list]
Current therapy: [list]

**Physical Exam:**
- Distribution: [pattern]
- Plaques: [well-demarcated/ill-defined], [silvery scale/other]
- Nails: [pitting/onycholysis/oil spots]
- BSA estimate: [percentage]%
- PASI score: [if calculated]

**Assessment:**
Psoriasis vulgaris, [mild/moderate/severe]
BSA: [%], PASI: [score]

**Plan:**
- Topicals: [steroid class/vitamin D analog]
- Systemic: [if indicated]
- Phototherapy: [if applicable]
- Labs: [if on systemic therapy]
- F/U: [timeframe]`
            },
            'eczema': {
                name: 'Atopic Dermatitis/Eczema',
                template: `**Chief Complaint:** Eczema/Atopic dermatitis

**HPI:**
[Duration] history of eczema.
Current flare duration: [timeframe]
Triggers identified: [list]
Associated atopy: [asthma/allergic rhinitis/food allergies]
Current treatments: [list]

**Physical Exam:**
- Distribution: [flexural/extensor/generalized]
- Acute findings: [erythema/vesicles/weeping]
- Chronic findings: [lichenification/hyperpigmentation]
- Excoriations: [present/absent]
- Secondary infection: [yes/no]

**Assessment:**
Atopic dermatitis, [mild/moderate/severe]
[Acute flare/Chronic/Acute on chronic]

**Plan:**
- Emollients: [specific recommendation]
- Topical corticosteroid: [potency and location]
- Antihistamine: [if pruritus severe]
- Infection tx: [if indicated]
- F/U: [timeframe]`
            }
        };

        // Quick Macro Shortcuts
        const QUICK_MACROS = {
            '.bp': 'Blood pressure: ___ mmHg',
            '.nad': 'No acute distress',
            '.wnl': 'Within normal limits',
            '.nka': 'No known allergies',
            '.nkda': 'No known drug allergies',
            '.rlq': 'Right lower quadrant',
            '.ruq': 'Right upper quadrant',
            '.llq': 'Left lower quadrant',
            '.luq': 'Left upper quadrant',
            '.htn': 'Hypertension',
            '.dm': 'Diabetes mellitus',
            '.sob': 'Shortness of breath',
            '.cp': 'Chest pain',
            '.ha': 'Headache',
            '.abd': 'Abdominal',
            '.bilat': 'Bilateral',
            '.prn': 'As needed',
            '.bid': 'Twice daily',
            '.tid': 'Three times daily',
            '.qd': 'Once daily',
            '.qhs': 'At bedtime',
            '.topical': 'Apply topically to affected area',
            '.fu': 'Follow up in',
            '.rto': 'Return to office',
            '.skin': 'Skin examination shows',
            '.lesion': 'Lesion characteristics:',
            '.biopsy': 'Recommend skin biopsy for definitive diagnosis',
            '.path': 'Pathology results pending',
            '.photo': 'Consider phototherapy',
            '.derm': 'Dermatology referral recommended'
        };

        // Keyboard shortcuts configuration
        const KEYBOARD_SHORTCUTS = {
            'ctrl+k': { action: 'openCommandPalette', description: 'Open command palette' },
            'ctrl+s': { action: 'saveSession', description: 'Save current session' },
            'ctrl+e': { action: 'exportNote', description: 'Export note' },
            'ctrl+t': { action: 'openTemplates', description: 'Open templates' },
            'ctrl+shift+r': { action: 'toggleRecording', description: 'Toggle recording' },
            'escape': { action: 'closeModals', description: 'Close modals' }
        };

        // Initialize Speech Recognition
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
        }

			        // Backend (WebSocket) Configuration
			        function loadBackendConfigIntoUI() {
		            const wsInput = document.getElementById('websocketUrlInput');
		            if (wsInput) {
		                wsInput.value = getWebSocketUrl();
		            }
		
		            const tokenInput = document.getElementById('sessionTokenInput');
		            if (tokenInput) {
		                const hasAccessToken = Boolean((sessionToken || '').trim());
		                const hasJwtToken = Boolean((sessionJwtToken || '').trim());
		                tokenInput.placeholder = hasAccessToken
		                    ? 'Access token configured (not shown)'
		                    : (hasJwtToken ? 'Session token active (JWT; expires)' : 'Enter backend token (shared secret or JWT)');
		            }
		
		            const rememberCheckbox = document.getElementById('rememberTokenCheckbox');
		            if (rememberCheckbox) {
		                rememberCheckbox.checked = getRememberAuthEnabled();
		            }
		        }
		
		        function saveBackendConfig() {
		            const wsInput = document.getElementById('websocketUrlInput');
		            const tokenInput = document.getElementById('sessionTokenInput');
		            const rememberCheckbox = document.getElementById('rememberTokenCheckbox');
		            const remember = rememberCheckbox ? rememberCheckbox.checked : false;
		            localStorage.setItem(REMEMBER_AUTH_STORAGE_KEY, remember ? 'true' : 'false');
		
		            const wsUrlRaw = wsInput ? wsInput.value.trim() : '';
		            if (wsUrlRaw) {
		                if (!wsUrlRaw.startsWith('ws://') && !wsUrlRaw.startsWith('wss://')) {
		                    showNotification('WebSocket URL must start with ws:// or wss://', 'error');
	                    return;
	                }
		                try {
		                    // Validate URL shape
		                    new URL(wsUrlRaw);
		                    setStoredValue(WS_URL_STORAGE_KEY, wsUrlRaw, remember);
		                } catch (e) {
		                    showNotification('Invalid WebSocket URL', 'error');
		                    return;
		                }
		            } else {
		                setStoredValue(WS_URL_STORAGE_KEY, '', remember);
		            }
		
		            // Only update the token if the user explicitly typed one.
		            const nextToken = tokenInput ? tokenInput.value.trim() : '';
		            if (nextToken) {
		                sessionToken = nextToken;
		                setStoredValue(TOKEN_STORAGE_KEY, nextToken, remember);
		                // Clear any cached server-issued JWT; we'll obtain a fresh one if needed.
		                sessionJwtToken = '';
		                sessionStorage.removeItem(JWT_TOKEN_STORAGE_KEY);
		
		                if (tokenInput) tokenInput.value = '';
		            }
	
	            loadBackendConfigIntoUI();
	            showNotification('Backend settings saved', 'success');
	
	            // Reconnect with updated settings
	            try {
	                if (websocket) websocket.close();
	            } catch (e) {
	                // ignore
	            }
		            websocket = null;
		            wsConnected = false;
		            wsReconnectAttempts = 0;
		            connectWebSocket();
		        }

		        function resetSessionState() {
		            // In-memory session state
		            fullTranscript = '';
		            currentDraftNote = '';
		            currentAiAnalysis = '';
		            currentManagementPlan = '';
		            chatHistory = [];
		            pendingSaveRequest = null;
		            pendingDiscussionTarget = 'chat';
		
		            // Streaming buffers / flags
		            streamBuffers = { note: '', chat: '', analysis: '' };
		            isStreaming = false;
		
		            // Clear any attached images
		            chatImageBase64 = null;
		            chatImageMimeType = null;
		            lastImageAnalysisDescription = '';
		            removeChatImagePreview();
		
		            // Stop speech recognition if active
		            if (recognition && isRecording) {
		                try {
		                    recognition.stop();
		                } catch (e) {
		                    // ignore
		                }
		                isRecording = false;
		            }
		        }
		
		        function resetTranscriptionOutputsUI() {
		            const transcriptionOutput = document.getElementById('transcriptionOutput');
		            if (transcriptionOutput) {
		                transcriptionOutput.innerHTML = `<p class="transcript-placeholder">Press 'Start' to begin transcription...</p>`;
		            }
		
		            const diagnosesInput = document.getElementById('diagnosesInput');
		            if (diagnosesInput) diagnosesInput.value = '';
		
		            const transcriptSummary = document.getElementById('transcriptSummary');
		            if (transcriptSummary) transcriptSummary.value = '';
		
		            const managementPlanResult = document.getElementById('managementPlanResult');
		            if (managementPlanResult) managementPlanResult.innerHTML = '';
		
		            const differentialOutput = document.getElementById('differentialOutput');
		            if (differentialOutput) {
		                differentialOutput.innerHTML = `
		                    <p class="text-muted">AI-suggested diagnoses based on the refined transcript.</p>
		                    <div class="mt-4">
		                        <p class="text-accent mb-3" style="text-align: center;">
		                            Start transcription. Differential diagnoses will be automatically generated here.
		                        </p>
		                    </div>
		                `;
		            }
		
		            const soapNoteOutput = document.getElementById('soapNoteOutput');
		            if (soapNoteOutput) {
		                soapNoteOutput.innerHTML = `
		                    <p class="text-muted mb-3">AI-generated SOAP note summarizing the session.</p>
		                    <div class="mt-4" style="text-align: center;">
		                        <p class="text-accent">
		                            Generate a management plan first. The SOAP note will appear here after clicking
		                            "Generate Note".
		                        </p>
		                    </div>
		                `;
		            }
		        }
		
		        function resetChatUI() {
		            const messagesContainer = document.getElementById('chatMessages');
		            if (messagesContainer) {
		                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		                messagesContainer.innerHTML = `
		                    <div class="chat-message chat-message-ai">
		                        <div class="chat-avatar">
		                            <span class="material-symbols-outlined" style="color: #0f1419;">smart_toy</span>
		                        </div>
		                        <div class="chat-content">
		                            <p>Hello! I am RAMIE, your Realtime Medical Explorer assistant. How can I help you today?</p>
		                            <p class="text-muted mt-2" style="font-size: 0.75rem;">${time}</p>
		                        </div>
		                    </div>
		                `;
		            }
		
		            const input = document.getElementById('chatInput');
		            if (input) input.value = '';
		        }
		
		        function beginNewChatSession() {
		            resetSessionState();
		            startSession();
		            startChatMode();
		            resetChatUI();
		            resetTranscriptionOutputsUI();
		            sendToServer('start_new_session', {});
		            showNotification('New chat session started', 'success');
		        }
		
		        function beginNewTranscriptionSession() {
		            resetSessionState();
		            startSession();
		            startTranscriptionMode();
		            resetChatUI();
		            resetTranscriptionOutputsUI();
		            // Also reset server-side session state
		            sendToServer('start_new_session', {});
		            showNotification('New transcription session started', 'success');
		        }
		
	        // Mode Selection
	        function startChatMode() {
	            currentMode = 'chat';
	            document.getElementById('landingPage').classList.add('hidden');
	            document.getElementById('mainApp').classList.remove('hidden');
            document.getElementById('chatView').classList.remove('hidden');
            document.getElementById('transcriptionView').classList.add('hidden');
            document.getElementById('sessionMode').textContent = 'Chat Mode';
            document.getElementById('sessionMode').classList.remove('status-idle');
            document.getElementById('sessionMode').classList.add('status-processing');
	            startAutosave();
        }

	        function startTranscriptionMode() {
	            currentMode = 'transcription';
	            document.getElementById('landingPage').classList.add('hidden');
	            document.getElementById('mainApp').classList.remove('hidden');
	            document.getElementById('transcriptionView').classList.remove('hidden');
	            document.getElementById('chatView').classList.add('hidden');
	            document.getElementById('sessionMode').textContent = 'Live Transcription Mode';
	            document.getElementById('sessionMode').classList.remove('status-idle');
	            document.getElementById('sessionMode').classList.add('status-recording');
	            setupTranscription();
	            startAutosave();
	        }

	        function backToHome() {
	            currentMode = null;
	            document.getElementById('mainApp').classList.add('hidden');
	            document.getElementById('landingPage').classList.remove('hidden');
            if (recognition && isRecording) {
                recognition.stop();
                isRecording = false;
            }
	            stopAutosave();
	        }

	        // Transcription Setup
	        function setupTranscription() {
	            if (transcriptionUiInitialized) return;
	            transcriptionUiInitialized = true;

	            const startBtn = document.getElementById('startBtn');
	            const stopBtn = document.getElementById('stopBtn');
	            const clearBtn = document.getElementById('clearTranscriptBtn');

	            startBtn.addEventListener('click', startRecording);
	            stopBtn.addEventListener('click', stopRecording);
	            clearBtn.addEventListener('click', clearTranscript);

	            document.getElementById('generatePlanBtn').addEventListener('click', generateManagementPlan);
	            document.getElementById('generateNoteBtn').addEventListener('click', generateSOAPNote);
	        }

	        function startRecording() {
	            if (!recognition) {
	                showNotification('Speech recognition not supported', 'error');
	                return;
	            }

            isRecording = true;
            document.getElementById('startBtn').classList.add('hidden');
            document.getElementById('stopBtn').classList.remove('hidden');
            document.getElementById('transcriptionOutput').innerHTML =
                '<p class="text-accent">Listening...</p>';

	            recognition.onresult = (event) => {
	                let interimTranscript = '';
	                let finalTranscript = '';

	                for (let i = event.resultIndex; i < event.results.length; i++) {
	                    const transcript = event.results[i][0].transcript;
	                    if (event.results[i].isFinal) {
	                        finalTranscript += transcript + ' ';
	                    } else {
	                        interimTranscript += transcript;
	                    }
	                }
	
	                if (finalTranscript && finalTranscript.trim()) {
	                    fullTranscript = `${fullTranscript}${finalTranscript}`.trim() + ' ';
	                    sessionAnalytics.transcriptionWords = fullTranscript.trim().split(/\s+/).filter(Boolean).length;
	                    markAutosaveDirty();
	                }

	                const output = document.getElementById('transcriptionOutput');
	                const finalHtml = fullTranscript.trim()
	                    ? `<p class="transcript-text">${escapeHtml(fullTranscript.trim())}</p>`
	                    : `<p class="transcript-placeholder">Press 'Start' to begin transcription...</p>`;
	                const interimHtml = interimTranscript
	                    ? `<p class="text-muted" style="font-style: italic;">${escapeHtml(interimTranscript)}</p>`
	                    : '';
	                output.innerHTML = `${finalHtml}${interimHtml}`;

	                // Send transcript segments to server for real-time suggestions
	                if (finalTranscript && finalTranscript.trim() && wsConnected) {
	                    sendToServer('transcript_segment', {
	                        segment: finalTranscript.trim(),
	                        is_final: true
	                    });
	                }
	            };

            recognition.start();
        }

	        function stopRecording() {
	            isRecording = false;
	            if (recognition) recognition.stop();
	            document.getElementById('stopBtn').classList.add('hidden');
	            document.getElementById('startBtn').classList.remove('hidden');

	            // Final DDx generation
	            const transcript = fullTranscript.trim();
	            if (transcript && transcript.length > 50) {
	                generateDifferentialDiagnosis(transcript);
	            } else {
	                showNotification('Transcript is too short to generate a note/analysis yet', 'warning');
	            }
	        }

	        function clearTranscript() {
            // Confirmation dialog for destructive action
            if (fullTranscript && fullTranscript.length > 50) {
                if (!confirm('Are you sure you want to clear the transcript? This action cannot be undone.')) {
                    return;
                }
            }
	            fullTranscript = '';
	            currentDraftNote = '';
	            currentAiAnalysis = '';
	            currentManagementPlan = '';
	            document.getElementById('transcriptionOutput').innerHTML =
	                '<p class="transcript-placeholder">Press \'Start\' to begin transcription...</p>';
            document.getElementById('differentialOutput').innerHTML =
                '<p class="text-muted">AI analysis will appear here...</p>';
	            document.getElementById('soapNoteOutput').innerHTML =
	                '<p class="text-muted">SOAP note will appear here after generation.</p>';
	            const planResult = document.getElementById('managementPlanResult');
	            if (planResult) {
	                planResult.innerHTML = '';
	            }

	            // Start new session on server
	            sendToServer('start_new_session', {});
	            showNotification('Transcript cleared', 'info');
	        }

        // ========== AI Generation Functions (WebSocket-backed) ==========
        function generateDifferentialDiagnosis(transcript) {
            const output = document.getElementById('differentialOutput');
            output.innerHTML = `
                <div class="loading-spinner"></div>
                <p class="text-muted">Generating differential diagnosis via AI...</p>
            `;

            // Store transcript and trigger server-side generation
            fullTranscript = transcript;
            sendToServer('stop_finalize_recording', { transcript: fullTranscript });
        }

	        function displayDifferentialDiagnosis(analysisText) {
	            const output = document.getElementById('differentialOutput');
	            if (!output) return;

            if (!analysisText) {
                output.innerHTML = `<p class="text-muted">No differential diagnosis available yet.</p>`;
                return;
            }

            // Parse and format the AI analysis
	            const formattedHtml = formatAiOutput(analysisText, 'Differential Diagnosis & Analysis');
	            output.innerHTML = formattedHtml;
	        }

	        function displayManagementPlan(planText) {
	            const output = document.getElementById('managementPlanResult') || document.getElementById('managementOutput');
	            if (!output) return;

	            if (!planText) {
	                output.innerHTML = '';
	                return;
	            }

	            output.innerHTML = formatAiOutput(planText, 'Management Plan');
	        }

	        function generateManagementPlan() {
	            const diagnoses = document.getElementById('diagnosesInput').value;
	            const summary = document.getElementById('transcriptSummary').value;

            if (!diagnoses && !fullTranscript) {
                showNotification('Please enter diagnoses or record a transcript first', 'warning');
                return;
            }

	            const output = document.getElementById('managementPlanResult') || document.getElementById('managementOutput');
	            currentManagementPlan = '';
	            output.innerHTML = `
	                <div class="loading-spinner"></div>
	                <p class="text-muted">Generating management plan via AI...</p>
	            `;

            // Add diagnoses to transcript context and request plan
	            const additionalContext = diagnoses ? `\n\n--- PHYSICIAN DIAGNOSES ---\n${diagnoses}\n--- END DIAGNOSES ---` : '';
	            const transcriptWithContext = (summary || fullTranscript) + additionalContext;

	            pendingDiscussionTarget = 'management';
	            sendToServer('discussion_input', {
	                intent: 'management_plan',
	                text: `Based on this consultation and the diagnoses (${diagnoses}), please generate a comprehensive management plan including investigations, treatments, and follow-up recommendations.`,
	                transcript: transcriptWithContext
	            });
	        }

	        function generateSOAPNote() {
	            const output = document.getElementById('soapNoteOutput');
	            output.innerHTML = `
	                <div class="loading-spinner"></div>
	                <p class="text-muted">Generating SOAP note via AI...</p>
	            `;

	            const summary = document.getElementById('transcriptSummary')?.value?.trim() || '';
	            const transcript = fullTranscript.trim() ? fullTranscript.trim() : summary;
	
	            if (!transcript) {
	                showNotification('Please record a consultation or paste a summary first', 'warning');
	                output.innerHTML = `<p class="text-muted">Record a consultation or paste a summary to generate a SOAP note.</p>`;
	                return;
	            }
	
	            // Ask the backend to generate the structured note + analysis (SOAP is derived from the note output).
	            fullTranscript = transcript + ' ';
	            sendToServer('stop_finalize_recording', { transcript });
	        }

        function displaySOAPNote(noteText) {
            const output = document.getElementById('soapNoteOutput');
            if (!output) return;

            if (!noteText) {
                output.innerHTML = `<p class="text-muted">SOAP note will appear here after generation.</p>`;
                return;
            }

            const formattedHtml = formatAiOutput(noteText, 'Clinical Note');
            output.innerHTML = formattedHtml;
        }

	        function formatAiOutput(text, title) {
	            const safeTitle = escapeHtml(title ?? '');
	            const html = formatBlockMarkdownSafe(text);
	            return `<h4 class="text-accent mb-3">${safeTitle}:</h4><div class="ai-content">${html}</div>`;
	        }

	        // ========== Chat Functions (WebSocket-backed) ==========
	        let chatHistory = [];
	        let pendingDiscussionTarget = 'chat'; // 'chat' | 'management'

	        function sendChatMessage() {
	            const input = document.getElementById('chatInput');
	            const message = input.value.trim();

            if (!message) return;

            // Add user message to UI
            addChatMessage(message, 'user');
            chatHistory.push({ role: 'user', content: message });
	            markAutosaveDirty();
            input.value = '';

	            // Show typing indicator
	            showTypingIndicator();

	            // Send to server for AI response
	            pendingDiscussionTarget = 'chat';
	            sendToServer('discussion_input', {
	                text: message,
	                transcript: fullTranscript,
	                chatHistory: chatHistory
	            });
	        }

        function showTypingIndicator() {
            const messagesContainer = document.getElementById('chatMessages');
            const indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.className = 'chat-message chat-message-ai';
            indicator.innerHTML = `
                <div class="chat-avatar">
                    <span class="material-symbols-outlined" style="color: #0f1419;">smart_toy</span>
                </div>
                <div class="chat-content">
                    <div class="loading-spinner" style="width: 20px; height: 20px;"></div>
                </div>
            `;
            messagesContainer.appendChild(indicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function hideTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
        }

	        function addChatMessage(text, sender, options = {}) {
	            hideTypingIndicator();

            const messagesContainer = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message chat-message-${sender}`;

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	            const formattedHtml = sender === 'ai'
	                ? formatInlineMarkdownSafe(text)
	                : escapeHtml(text ?? '').replace(/\n/g, '<br>');

	            messageDiv.innerHTML = `
	                <div class="chat-avatar">
	                    <span class="material-symbols-outlined" style="color: #0f1419;">
	                        ${sender === 'user' ? 'person' : 'smart_toy'}
	                    </span>
	                </div>
	                <div class="chat-content">
	                    <p>${formattedHtml}</p>
	                    <p class="text-muted mt-2" style="font-size: 0.75rem;">${time}</p>
	                </div>
	            `;

            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

	            const shouldRecordInHistory = options.record !== false;
	            if (sender === 'ai' && shouldRecordInHistory) {
	                chatHistory.push({ role: 'assistant', content: text });
	                markAutosaveDirty();
	            }
	        }

	        function getChatTranscriptSnapshot() {
	            if (!Array.isArray(chatHistory) || chatHistory.length === 0) return '';
	            return chatHistory.map(m => {
	                const roleLabel = m.role === 'user' ? 'Physician' : 'AI';
	                return `${roleLabel}: ${m.content ?? ''}`.trim();
	            }).join('\n\n').trim();
	        }

	        function buildLocalSessionSnapshot(type) {
	            const base = {
	                sessionId: currentSessionId,
	                mode: currentMode,
	                schemaVersion: 1
	            };

	            if (type === 'chat') {
	                const transcript = getChatTranscriptSnapshot();
	                return {
	                    ...base,
	                    transcript: transcript,
	                    draftNote: currentDraftNote,
	                    aiAnalysis: currentAiAnalysis,
	                    chatHistory: Array.isArray(chatHistory) ? [...chatHistory] : []
	                };
	            }

	            return {
	                ...base,
	                transcript: fullTranscript,
	                draftNote: currentDraftNote,
	                aiAnalysis: currentAiAnalysis,
	                managementPlan: currentManagementPlan
	            };
	        }

	        function saveCurrentSession() {
	            if (!currentMode) {
	                showNotification('Start a session before saving', 'warning');
	                return;
	            }

	            const type = currentMode === 'chat' ? 'chat' : 'transcription';
	            const localSnapshot = buildLocalSessionSnapshot(type);

	            if (pendingSaveRequest) {
	                showNotification('Save already in progress…', 'info');
	                return;
	            }

	            const canAskServer = wsConnected && websocket && websocket.readyState === WebSocket.OPEN;
	            if (canAskServer) {
	                pendingSaveRequest = { type, localSnapshot };
	                showNotification('Saving session…', 'info');

	                const visitDate = new Date().toISOString().slice(0, 10);
	                const sent = sendToServer('request_session_data_for_save', { visitDate });
	                if (!sent) {
	                    pendingSaveRequest = null;
	                    saveSessionToStorage(type, { ...localSnapshot, source: 'client' });
	                    return;
	                }

	                // Fallback if the server never responds (e.g., transient network issues).
	                setTimeout(() => {
	                    if (!pendingSaveRequest) return;
	                    const fallback = pendingSaveRequest;
	                    pendingSaveRequest = null;
	                    saveSessionToStorage(fallback.type, { ...fallback.localSnapshot, source: 'client', saveError: 'timeout' });
	                    showNotification('Server save timed out; saved local snapshot instead', 'warning');
	                }, 6500);
	                return;
	            }

	            saveSessionToStorage(type, { ...localSnapshot, source: 'client' });
	        }

	        // Backwards-compat: older UI/shortcuts called this.
	        function saveRawChat() {
	            saveCurrentSession();
	        }

	        function finalizeAndGenerateNote() {
	            if (chatHistory.length === 0) {
	                showNotification('No chat history to generate note from', 'warning');
	                return;
            }

            showNotification('Generating clinical note from chat...', 'info');

            // Compile chat into transcript format
            const chatTranscript = chatHistory.map(m =>
                `${m.role === 'user' ? 'Physician' : 'AI'}: ${m.content}`
            ).join('\n\n');

            fullTranscript = chatTranscript;
            sendToServer('stop_finalize_recording', { transcript: fullTranscript });
            sessionAnalytics.aiGenerations++;
        }

        // Template Library Functions
        function openTemplates() {
            const modal = document.createElement('div');
            modal.className = 'modal-backdrop';
            modal.id = 'templatesModal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0; color: var(--text-primary);">Note Templates</h2>
	                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="templatesModal">
	                            <span class="material-symbols-outlined">close</span>
	                        </button>
                    </div>
                    <p class="text-muted mb-4">Select a template to insert into your note.</p>
                    <div class="template-grid" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                        ${Object.entries(NOTE_TEMPLATES).map(([key, tmpl]) => `
	                            <button class="template-card" type="button" data-action="insert-template" data-template-key="${key}" style="
	                                padding: 1rem;
	                                background: var(--bg-tertiary);
	                                border: 1px solid var(--border-color);
                                border-radius: var(--border-radius);
                                text-align: left;
                                cursor: pointer;
                                transition: background-color 160ms ease, border-color 160ms ease;
                            ">
                                <h4 style="margin: 0 0 0.5rem; color: var(--accent-primary);">${tmpl.name}</h4>
                                <p class="text-muted" style="font-size: 0.75rem; margin: 0;">Click to insert</p>
                            </button>
                        `).join('')}
                    </div>
                    <div class="macro-section" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Quick Macros</h3>
                        <p class="text-muted mb-3" style="font-size: 0.875rem;">Type these shortcuts in any text field to expand:</p>
                        <div style="display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); max-height: 200px; overflow-y: auto;">
                            ${Object.entries(QUICK_MACROS).slice(0, 12).map(([key, value]) => `
                                <div style="font-size: 0.75rem;">
                                    <code style="background: var(--bg-primary); padding: 2px 6px; border-radius: 4px;">${key}</code>
                                    <span class="text-muted"> → ${value.substring(0, 25)}${value.length > 25 ? '...' : ''}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal('templatesModal');
            });
        }

        function insertTemplate(templateKey) {
            const template = NOTE_TEMPLATES[templateKey];
            if (!template) return;

            // Insert into transcript summary if in transcription mode
            const transcriptSummary = document.getElementById('transcriptSummary');
            if (transcriptSummary && currentMode === 'transcription') {
                transcriptSummary.value = template.template;
                showNotification(`${template.name} template inserted`, 'success');
            } else if (currentMode === 'chat') {
                // Insert into chat input
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    chatInput.value = `Use this template:\n\n${template.template}`;
                }
                showNotification(`${template.name} template ready to send`, 'success');
            }
            closeModal('templatesModal');
        }

        // Macro expansion for text inputs
        function setupMacroExpansion(inputElement) {
            inputElement.addEventListener('input', (e) => {
                const value = e.target.value;
                for (const [macro, expansion] of Object.entries(QUICK_MACROS)) {
                    if (value.endsWith(macro + ' ') || value.endsWith(macro)) {
                        const hasSpace = value.endsWith(macro + ' ');
                        const newValue = value.replace(
                            hasSpace ? macro + ' ' : macro,
                            expansion + ' '
                        );
                        e.target.value = newValue;
                        showNotification(`Expanded: ${macro}`, 'info');
                        break;
                    }
                }
            });
        }

        // Export Functions
        async function exportNote(format = 'text') {
            const content = getFullNoteContent();
            if (!content) {
                showNotification('No content to export', 'warning');
                return;
            }

            sessionAnalytics.exportCount++;

            try {
                switch (format) {
                    case 'json':
                        downloadFile(JSON.stringify(buildSessionExportObject(), null, 2), 'ramie-session.json', 'application/json');
                        showNotification('Session exported as JSON', 'success');
                        break;
                    case 'pdf':
                        await exportPdf(content);
                        showNotification('Exported as PDF', 'success');
                        break;
                    case 'docx':
                        await exportDocx(content);
                        showNotification('Exported as DOCX', 'success');
                        break;
                    case 'text':
                        downloadFile(content, 'clinical-note.txt', 'text/plain');
                        showNotification('Exported as TXT', 'success');
                        break;
                    case 'markdown':
                        downloadFile(content, 'clinical-note.md', 'text/markdown');
                        showNotification('Exported as Markdown', 'success');
                        break;
                    case 'html': {
                        const htmlContent = `<!DOCTYPE html>
<html><head><title>Clinical Note</title><style>
body{font-family:Arial,sans-serif;max-width:800px;margin:2rem auto;padding:1rem;line-height:1.6;}
h1,h2,h3,h4,h5{color:#333;}
</style></head><body>
${formatInlineMarkdownSafe(content)}
</body></html>`;
                        downloadFile(htmlContent, 'clinical-note.html', 'text/html');
                        showNotification('Exported as HTML', 'success');
                        break;
                    }
                    default:
                        downloadFile(content, 'clinical-note.txt', 'text/plain');
                        showNotification('Exported as TXT', 'success');
                }
            } catch (error) {
                console.error('Export error:', error);
                showNotification(`Export failed: ${error?.message || 'Unknown error'}`, 'error');
            }
        }

	        function buildSessionExportObject() {
	            const base = {
	                exportedAt: new Date().toISOString(),
	                sessionId: currentSessionId,
	                mode: currentMode,
	                analytics: { ...sessionAnalytics },
	            };

	            if (currentMode === 'chat') {
	                return {
	                    ...base,
	                    transcript: getChatTranscriptSnapshot(),
	                    chatHistory: Array.isArray(chatHistory) ? [...chatHistory] : [],
	                    draftNote: currentDraftNote,
	                    aiAnalysis: currentAiAnalysis,
	                    managementPlan: currentManagementPlan
	                };
	            }

	            return {
	                ...base,
	                transcript: fullTranscript,
	                draftNote: currentDraftNote,
	                aiAnalysis: currentAiAnalysis,
	                managementPlan: currentManagementPlan
	            };
	        }

        function getFullNoteContent() {
            let content = '';

	            if (currentMode === 'transcription') {
	                const transcript = document.getElementById('transcriptionOutput')?.textContent || '';
	                const ddx = document.getElementById('differentialOutput')?.textContent || '';
	                const plan = document.getElementById('managementPlanResult')?.textContent || document.getElementById('managementOutput')?.textContent || '';
	                const soap = document.getElementById('soapNoteOutput')?.textContent || '';

                content = `CLINICAL NOTE - ${new Date().toLocaleString()}\n\n`;
                content += `=== TRANSCRIPT ===\n${transcript}\n\n`;
                content += `=== DIFFERENTIAL DIAGNOSIS ===\n${ddx}\n\n`;
                content += `=== MANAGEMENT PLAN ===\n${plan}\n\n`;
	                content += `=== SOAP NOTE ===\n${soap}\n`;
	            } else if (currentMode === 'chat') {
	                content = `CHAT SESSION - ${new Date().toLocaleString()}\n\n`;

	                const chatTranscript = getChatTranscriptSnapshot();
	                if (chatTranscript) {
	                    content += `=== CHAT TRANSCRIPT ===\n${chatTranscript}\n\n`;
	                }

	                if (typeof currentAiAnalysis === 'string' && currentAiAnalysis.trim()) {
	                    content += `=== AI ANALYSIS ===\n${currentAiAnalysis.trim()}\n\n`;
	                }
	                if (typeof currentManagementPlan === 'string' && currentManagementPlan.trim()) {
	                    content += `=== MANAGEMENT PLAN ===\n${currentManagementPlan.trim()}\n\n`;
	                }
	                if (typeof currentDraftNote === 'string' && currentDraftNote.trim()) {
	                    content += `=== CLINICAL NOTE ===\n${currentDraftNote.trim()}\n`;
	                }
	            }

            return content;
        }

        function downloadFile(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

	        function downloadBlob(blob, filename) {
	            const url = URL.createObjectURL(blob);
	            const link = document.createElement('a');
	            link.href = url;
	            link.download = filename;
	            document.body.appendChild(link);
	            link.click();
	            document.body.removeChild(link);
	            URL.revokeObjectURL(url);
	        }

	        function loadScriptOnce(src, globalCheck) {
	            return new Promise((resolve, reject) => {
	                try {
	                    if (typeof globalCheck === 'function' && globalCheck()) {
	                        resolve();
	                        return;
	                    }
	                    const existing = document.querySelector(`script[data-ramie-src="${src}"]`);
	                    if (existing) {
	                        existing.addEventListener('load', () => resolve());
	                        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
	                        return;
	                    }
	                    const script = document.createElement('script');
	                    script.src = src;
	                    script.async = true;
	                    script.dataset.ramieSrc = src;
	                    script.onload = () => resolve();
	                    script.onerror = () => reject(new Error(`Failed to load ${src}`));
	                    document.head.appendChild(script);
	                } catch (err) {
	                    reject(err);
	                }
	            });
	        }

	        async function ensureJsPdfLoaded() {
	            await loadScriptOnce('vendor/jspdf.umd.min.js', () => window.jspdf && window.jspdf.jsPDF);
	            if (!(window.jspdf && window.jspdf.jsPDF)) {
	                throw new Error('jsPDF failed to load');
	            }
	            return window.jspdf;
	        }

	        async function ensureDocxLoaded() {
	            await loadScriptOnce('vendor/docx.umd.js', () => window.docx && window.docx.Document && window.docx.Packer);
	            if (!(window.docx && window.docx.Document && window.docx.Packer)) {
	                throw new Error('docx library failed to load');
	            }
	            return window.docx;
	        }

	        async function exportPdf(text) {
	            const { jsPDF } = await ensureJsPdfLoaded();
	            const doc = new jsPDF({ unit: 'pt', format: 'letter' });

	            const margin = 40;
	            const pageWidth = doc.internal.pageSize.getWidth();
	            const pageHeight = doc.internal.pageSize.getHeight();
	            const maxWidth = pageWidth - margin * 2;
	            const lineHeight = 12;

	            const lines = doc.splitTextToSize(String(text ?? ''), maxWidth);
	            let y = margin;

	            doc.setFont('helvetica', 'normal');
	            doc.setFontSize(10);

	            lines.forEach((line) => {
	                if (y > pageHeight - margin) {
	                    doc.addPage();
	                    y = margin;
	                }
	                doc.text(line, margin, y);
	                y += lineHeight;
	            });

	            doc.save('clinical-note.pdf');
	        }

	        async function exportDocx(text) {
	            const docx = await ensureDocxLoaded();
	            const { Document, Packer, Paragraph, TextRun } = docx;

	            const lines = String(text ?? '').split('\n');
	            const children = lines.map((line) => {
	                if (!line.trim()) {
	                    return new Paragraph({ children: [new TextRun({ text: '' })] });
	                }
	                return new Paragraph({ children: [new TextRun({ text: line })] });
	            });

	            const document = new Document({
	                sections: [
	                    {
	                        properties: {},
	                        children
	                    }
	                ]
	            });

	            const blob = await Packer.toBlob(document);
	            downloadBlob(blob, 'clinical-note.docx');
	        }

	        // Export Modal
	        function openExportModal() {
	            const modal = document.createElement('div');
	            modal.className = 'modal-backdrop';
	            modal.id = 'exportModal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0; color: var(--text-primary);">Export Note</h2>
	                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="exportModal">
	                            <span class="material-symbols-outlined">close</span>
	                        </button>
                    </div>
                    <p class="text-muted mb-4">Choose an export format:</p>
                    <div style="display: grid; gap: 0.75rem;">
	                        <button class="btn-modern btn-primary" style="width: 100%;" type="button" data-action="export-note" data-export-format="json">
	                            <span class="material-symbols-outlined">data_object</span>
	                            JSON (.json)
	                        </button>
	                        <button class="btn-modern btn-primary" style="width: 100%;" type="button" data-action="export-note" data-export-format="pdf">
	                            <span class="material-symbols-outlined">picture_as_pdf</span>
	                            PDF (.pdf)
	                        </button>
	                        <button class="btn-modern btn-primary" style="width: 100%;" type="button" data-action="export-note" data-export-format="docx">
	                            <span class="material-symbols-outlined">description</span>
	                            Word (.docx)
	                        </button>
	                        <button class="btn-modern btn-primary" style="width: 100%;" type="button" data-action="export-note" data-export-format="text">
	                            <span class="material-symbols-outlined">description</span>
	                            Plain Text (.txt)
	                        </button>
	                        <button class="btn-modern btn-primary" style="width: 100%;" type="button" data-action="export-note" data-export-format="markdown">
	                            <span class="material-symbols-outlined">code</span>
	                            Markdown (.md)
	                        </button>
	                        <button class="btn-modern btn-primary" style="width: 100%;" type="button" data-action="export-note" data-export-format="html">
	                            <span class="material-symbols-outlined">html</span>
	                            HTML (.html)
	                        </button>
	                        <button class="btn-modern btn-ghost" style="width: 100%;" type="button" data-action="copy-note">
	                            <span class="material-symbols-outlined">content_copy</span>
	                            Copy to Clipboard
	                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
	            modal.addEventListener('click', (e) => {
	                if (e.target === modal) closeModal('exportModal');
	            });
	        }

	        function openOutputsModal() {
	            const hasNote = typeof currentDraftNote === 'string' && currentDraftNote.trim().length > 0;
	            const hasAnalysis = typeof currentAiAnalysis === 'string' && currentAiAnalysis.trim().length > 0;
	            const hasPlan = typeof currentManagementPlan === 'string' && currentManagementPlan.trim().length > 0;

	            if (!hasNote && !hasAnalysis && !hasPlan) {
	                showNotification('No generated outputs yet. Generate a note/analysis first.', 'info');
	                return;
	            }

	            closeModal('outputsModal');

	            const modal = document.createElement('div');
	            modal.className = 'modal-backdrop';
	            modal.id = 'outputsModal';

	            const noteSection = hasNote
	                ? `<div style="margin-bottom: 1rem;">${formatAiOutput(currentDraftNote, 'Clinical Note')}</div>`
	                : '';
	            const analysisSection = hasAnalysis
	                ? `<div style="margin-bottom: 1rem;">${formatAiOutput(currentAiAnalysis, 'AI Analysis')}</div>`
	                : '';
	            const planSection = hasPlan
	                ? `<div style="margin-bottom: 1rem;">${formatAiOutput(currentManagementPlan, 'Management Plan')}</div>`
	                : '';

		            modal.innerHTML = `
		                <div class="modal-content" style="max-width: 900px; max-height: 85vh; overflow-y: auto; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
		                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
		                        <h2 style="margin: 0; color: var(--text-primary);">Session Outputs</h2>
		                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="outputsModal">
		                            <span class="material-symbols-outlined">close</span>
		                        </button>
		                    </div>
		                    <p class="text-muted mb-4">These outputs are generated by the backend and stored in-memory for this session.</p>
		                    ${planSection}
		                    ${analysisSection}
		                    ${noteSection}
		                    <div class="flex gap-2" style="justify-content: flex-end; margin-top: 1rem;">
		                        <button class="btn-modern btn-ghost" type="button" data-action="save-session">
		                            <span class="material-symbols-outlined">save</span>
		                            Save Session
		                        </button>
		                        <button class="btn-modern btn-primary" type="button" data-action="open-export-modal">
		                            <span class="material-symbols-outlined">download</span>
		                            Export
		                        </button>
		                    </div>
		                </div>
		            `;

	            document.body.appendChild(modal);
	            modal.addEventListener('click', (e) => {
	                if (e.target === modal) closeModal('outputsModal');
	            });
	        }

        function copyNoteToClipboard() {
            const content = getFullNoteContent();
            if (content) {
                navigator.clipboard.writeText(content).then(() => {
                    showNotification('Note copied to clipboard', 'success');
                }).catch(() => {
                    showNotification('Failed to copy', 'error');
                });
            }
        }

        // Session Analytics
        function startSession() {
            sessionStartTime = new Date();
            sessionAnalytics = {
                transcriptionWords: 0,
                aiGenerations: 0,
                exportCount: 0
            };
        }

        function getSessionDuration() {
            if (!sessionStartTime) return 'N/A';
            const diff = new Date() - sessionStartTime;
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }

	        function showSessionAnalytics() {
	            const modal = document.createElement('div');
	            modal.className = 'modal-backdrop';
	            modal.id = 'analyticsModal';
	            modal.innerHTML = `
	                <div class="modal-content" style="max-width: 400px; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
	                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
	                        <h2 style="margin: 0; color: var(--text-primary);">Session Analytics</h2>
	                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="analyticsModal">
	                            <span class="material-symbols-outlined">close</span>
	                        </button>
	                    </div>
	                    <div style="display: grid; gap: 1rem;">
	                        <div class="stat-card" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius);">
	                            <p class="text-muted" style="margin: 0; font-size: 0.75rem;">Session Duration</p>
                            <p style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--accent-primary);">${getSessionDuration()}</p>
                        </div>
                        <div class="stat-card" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius);">
                            <p class="text-muted" style="margin: 0; font-size: 0.75rem;">Transcription Words</p>
                            <p style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--accent-primary);">${sessionAnalytics.transcriptionWords}</p>
                        </div>
                        <div class="stat-card" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius);">
                            <p class="text-muted" style="margin: 0; font-size: 0.75rem;">AI Generations</p>
                            <p style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--accent-primary);">${sessionAnalytics.aiGenerations}</p>
                        </div>
                        <div class="stat-card" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius);">
                            <p class="text-muted" style="margin: 0; font-size: 0.75rem;">Exports</p>
                            <p style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--accent-primary);">${sessionAnalytics.exportCount}</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal('analyticsModal');
            });
        }

	        function closeModal(modalId) {
	            const modal = document.getElementById(modalId);
	            if (modal) modal.remove();
	        }
	
	        function handleDataActionClick(event) {
	            const actionElement = event.target.closest('[data-action]');
	            if (!actionElement) return;
	
	            const action = actionElement.getAttribute('data-action');
	            switch (action) {
	                case 'close-modal': {
	                    const modalId = actionElement.getAttribute('data-modal-id');
	                    if (modalId) closeModal(modalId);
	                    break;
	                }
	                case 'insert-template': {
	                    const key = actionElement.getAttribute('data-template-key');
	                    if (key) insertTemplate(key);
	                    break;
	                }
	                case 'export-note': {
	                    const format = actionElement.getAttribute('data-export-format') || 'text';
	                    exportNote(format);
	                    closeModal('exportModal');
	                    break;
	                }
	                case 'copy-note':
	                    copyNoteToClipboard();
	                    break;
	                case 'save-session':
	                    saveCurrentSession();
	                    break;
	                case 'open-export-modal':
	                    openExportModal();
	                    break;
	                case 'run-command': {
	                    const commandId = actionElement.getAttribute('data-command-id');
	                    if (commandId) runCommandPaletteCommand(commandId);
	                    break;
	                }
	                case 'load-saved-session': {
	                    const sessionId = Number(actionElement.getAttribute('data-session-id'));
	                    if (Number.isFinite(sessionId)) loadSavedSession(sessionId);
	                    break;
	                }
	                case 'delete-saved-session': {
	                    event.stopPropagation();
	                    const sessionId = Number(actionElement.getAttribute('data-session-id'));
	                    if (Number.isFinite(sessionId)) deleteSavedSession(sessionId);
	                    break;
	                }
	                case 'integrate-image-findings': {
	                    integrateImageFindingsAndRegenerate();
	                    const modalId = actionElement.getAttribute('data-modal-id') || 'imageIntegrationModal';
	                    closeModal(modalId);
	                    break;
	                }
	                default:
	                    // Unknown action; ignore.
	                    break;
	            }
	        }

	        // Command Palette
	        function openCommandPalette() {
            const modal = document.createElement('div');
            modal.className = 'modal-backdrop';
            modal.id = 'commandPalette';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1rem;">
                    <input type="text" id="commandSearch" placeholder="Type a command..." style="
                        width: 100%;
                        padding: 0.75rem 1rem;
                        background: var(--bg-tertiary);
                        border: 1px solid var(--border-color);
                        border-radius: var(--border-radius);
                        color: var(--text-primary);
                        font-size: 1rem;
                        margin-bottom: 0.75rem;
                    " autofocus>
                    <div id="commandList" style="max-height: 300px; overflow-y: auto;">
                        ${generateCommandList()}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal('commandPalette');
            });

            const searchInput = document.getElementById('commandSearch');
            searchInput.addEventListener('input', (e) => {
                document.getElementById('commandList').innerHTML = generateCommandList(e.target.value);
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeModal('commandPalette');
            });
        }

	        function generateCommandList(filter = '') {
	            const commands = [
	                { id: 'open-templates', name: 'Open Templates', icon: 'description' },
	                { id: 'export-note', name: 'Export Note', icon: 'download' },
	                { id: 'session-analytics', name: 'Session Analytics', icon: 'analytics' },
	                { id: 'start-recording', name: 'Start Recording', icon: 'mic' },
	                { id: 'stop-recording', name: 'Stop Recording', icon: 'stop' },
	                { id: 'clear-transcript', name: 'Clear Transcript', icon: 'clear_all' },
	                { id: 'generate-ddx', name: 'Generate DDx', icon: 'psychology' },
	                { id: 'generate-soap', name: 'Generate SOAP Note', icon: 'note_add' },
	                { id: 'back-home', name: 'Back to Home', icon: 'home' },
	                { id: 'keyboard-shortcuts', name: 'Keyboard Shortcuts', icon: 'keyboard' }
	            ];

	            const filtered = filter
	                ? commands.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
	                : commands;

	            return filtered.map(cmd => `
	                <button type="button" class="command-palette-item" data-action="run-command" data-command-id="${cmd.id}" style="
	                    display: flex;
	                    align-items: center;
	                    gap: 0.75rem;
	                    width: 100%;
	                    padding: 0.75rem 1rem;
	                    background: transparent;
	                    border: none;
	                    border-radius: var(--border-radius);
	                    color: var(--text-primary);
	                    cursor: pointer;
	                    text-align: left;
	                ">
	                    <span class="material-symbols-outlined">${cmd.icon}</span>
	                    <span>${cmd.name}</span>
	                </button>
	            `).join('');
	        }
	
	        function runCommandPaletteCommand(commandId) {
	            closeModal('commandPalette');
	
	            switch (commandId) {
	                case 'open-templates':
	                    openTemplates();
	                    break;
	                case 'export-note':
	                    openExportModal();
	                    break;
	                case 'session-analytics':
	                    showSessionAnalytics();
	                    break;
	                case 'start-recording':
	                    if (currentMode !== 'transcription') {
	                        showNotification('Start transcription mode to record audio', 'warning');
	                        break;
	                    }
	                    startRecording();
	                    break;
	                case 'stop-recording':
	                    if (currentMode !== 'transcription') {
	                        showNotification('Not currently recording', 'info');
	                        break;
	                    }
	                    stopRecording();
	                    break;
	                case 'clear-transcript':
	                    if (currentMode !== 'transcription') {
	                        showNotification('Transcript tools are available in transcription mode', 'info');
	                        break;
	                    }
	                    clearTranscript();
	                    break;
	                case 'generate-ddx':
	                    if (!fullTranscript || !fullTranscript.trim()) {
	                        showNotification('No transcript available yet', 'warning');
	                        break;
	                    }
	                    generateDifferentialDiagnosis(fullTranscript);
	                    break;
	                case 'generate-soap':
	                    generateSOAPNote();
	                    break;
	                case 'back-home':
	                    backToHome();
	                    break;
	                case 'keyboard-shortcuts':
	                    showKeyboardShortcuts();
	                    break;
	                default:
	                    showNotification('Unknown command', 'warning');
	            }
	        }

	        function showKeyboardShortcuts() {
	            const modal = document.createElement('div');
	            modal.className = 'modal-backdrop';
	            modal.id = 'shortcutsModal';
	            modal.innerHTML = `
	                <div class="modal-content" style="max-width: 450px; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
	                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
	                        <h2 style="margin: 0; color: var(--text-primary);">Keyboard Shortcuts</h2>
	                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="shortcutsModal">
	                            <span class="material-symbols-outlined">close</span>
	                        </button>
	                    </div>
                    <div style="display: grid; gap: 0.5rem;">
                        ${Object.entries(KEYBOARD_SHORTCUTS).map(([key, config]) => `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 6px;">
                                <span class="text-muted">${config.description}</span>
                                <kbd style="background: var(--bg-primary); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${key}</kbd>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal('shortcutsModal');
            });
        }

	        // Global keyboard handler
	        function handleGlobalKeydown(e) {
            const key = [];
            if (e.ctrlKey || e.metaKey) key.push('ctrl');
            if (e.shiftKey) key.push('shift');
            if (e.altKey) key.push('alt');
            key.push(e.key.toLowerCase());
            const combo = key.join('+');

	            const shortcut = KEYBOARD_SHORTCUTS[combo];
	            if (shortcut) {
	                e.preventDefault();
	                switch (shortcut.action) {
	                    case 'openCommandPalette': openCommandPalette(); break;
	                    case 'saveSession': saveCurrentSession(); break;
	                    case 'exportNote': openExportModal(); break;
	                    case 'openTemplates': openTemplates(); break;
	                    case 'toggleRecording':
	                        isRecording ? stopRecording() : startRecording();
	                        break;
                    case 'closeModals':
                        document.querySelectorAll('.modal-backdrop').forEach(m => m.remove());
                        break;
                }
            }
        }

        // Utility Functions
        function showNotification(message, type = 'info') {
            // Simple notification (can be enhanced with a proper notification system)
            console.log(`[${type.toUpperCase()}] ${message}`);

            // Create temporary notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--accent-primary);
                border-radius: var(--border-radius);
                color: var(--text-primary);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }

        // ========== IndexedDB Session Storage ==========
        const DB_NAME = 'RAMIEScribeSessions';
        const DB_VERSION = 1;
        const STORE_NAME = 'sessions';

        function openDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('type', 'type', { unique: false });
                    }
                };
            });
        }

        async function saveSessionToStorage(type, data, options = {}) {
            const silent = options.silent === true;
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);

                const session = {
                    type: type,
                    timestamp: new Date().toISOString(),
                    transcript: fullTranscript,
                    draftNote: currentDraftNote,
                    aiAnalysis: currentAiAnalysis,
                    analytics: { ...sessionAnalytics },
                    chatHistory: type === 'chat' ? chatHistory : [],
                    ...data
                };

                store.add(session);
                await new Promise((resolve, reject) => {
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });

                if (type !== 'autosave') {
                    // Manual save supersedes any autosaved draft; clear it to avoid repeated recovery prompts.
                    clearAutosaveDrafts();
                }

                if (!silent) {
                    showNotification('Session saved successfully', 'success');
                }
                if (type !== 'autosave') {
                    window.LegacyShell?.setSaved(true);
                }
                return true;
            } catch (error) {
                console.error('Error saving session:', error);
                if (!silent) {
                    showNotification('Failed to save session', 'error');
                }
                return false;
            }
        }

        async function loadSessionFromStorage(sessionId) {
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);

                return new Promise((resolve, reject) => {
                    const request = store.get(sessionId);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error('Error loading session:', error);
                return null;
            }
        }

        async function getAllSessions() {
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('timestamp');

                return new Promise((resolve, reject) => {
                    const request = index.getAll();
                    request.onsuccess = () => resolve(request.result.reverse()); // Newest first
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error('Error getting sessions:', error);
                return [];
            }
        }

        async function deleteSession(sessionId) {
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.delete(sessionId);
                await new Promise((resolve, reject) => {
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });
                return true;
            } catch (error) {
                console.error('Error deleting session:', error);
                return false;
            }
        }

	        function markAutosaveDirty() {
	            autosaveDirty = true;
	            window.LegacyShell?.setSaved(false);
	        }

	        function startAutosave() {
	            if (autosaveTimerId) return;
	            autosaveTimerId = setInterval(() => {
	                performAutosave();
	            }, AUTOSAVE_INTERVAL_MS);
	        }

	        function stopAutosave() {
	            if (autosaveTimerId) {
	                clearInterval(autosaveTimerId);
	                autosaveTimerId = null;
	            }
	            autosaveDirty = false;
	        }

	        async function clearAutosaveDrafts() {
	            try {
	                const db = await openDatabase();
	                const tx = db.transaction(STORE_NAME, 'readwrite');
	                const store = tx.objectStore(STORE_NAME);
	                const index = store.index('type');

	                const keys = await new Promise((resolve, reject) => {
	                    const request = index.getAllKeys('autosave');
	                    request.onsuccess = () => resolve(request.result || []);
	                    request.onerror = () => reject(request.error);
	                });

	                keys.forEach((key) => store.delete(key));
	                await new Promise((resolve, reject) => {
	                    tx.oncomplete = resolve;
	                    tx.onerror = () => reject(tx.error);
	                });
	            } catch (error) {
	                console.warn('Failed to clear autosave drafts:', error);
	            }
	        }

	        async function getLatestAutosaveDraft() {
	            const sessions = await getAllSessions();
	            return sessions.find((s) => s.type === 'autosave') || null;
	        }

	        async function performAutosave() {
	            if (!autosaveDirty || !currentMode) return;

	            const snapshotType = currentMode === 'chat' ? 'chat' : 'transcription';
	            const snapshot = buildLocalSessionSnapshot(snapshotType);

	            const hasTranscript = typeof snapshot.transcript === 'string' && snapshot.transcript.trim();
	            const hasChat = Array.isArray(snapshot.chatHistory) && snapshot.chatHistory.length > 0;
	            const hasOutputs = (snapshot.draftNote && String(snapshot.draftNote).trim()) || (snapshot.aiAnalysis && String(snapshot.aiAnalysis).trim());

	            if (!hasTranscript && !hasChat && !hasOutputs) {
	                autosaveDirty = false;
	                return;
	            }

	            // Keep only one autosave draft to avoid cluttering the session list.
	            await clearAutosaveDrafts();
	            const ok = await saveSessionToStorage('autosave', { ...snapshot, autosaveFor: snapshotType }, { silent: true });
	            if (ok) autosaveDirty = false;
	        }

	        async function checkForAutosaveRecovery() {
	            try {
	                const seededRecovery = localStorage.getItem('legacy_recovery_seed');
	                if (seededRecovery) {
	                    const parsedSeed = JSON.parse(seededRecovery);
	                    const whenSeed = parsedSeed?.timestamp ? new Date(parsedSeed.timestamp).toLocaleString() : 'an earlier snapshot';
	                    setRecoveryBanner(`Recovered from ${whenSeed} snapshot (confidence: High).`);
	                    localStorage.removeItem('legacy_recovery_seed');
	                }

	                const autosave = await getLatestAutosaveDraft();
	                if (!autosave) return;

	                const hasTranscript = typeof autosave.transcript === 'string' && autosave.transcript.trim();
	                const hasChat = Array.isArray(autosave.chatHistory) && autosave.chatHistory.length > 0;
	                const hasOutputs = (autosave.draftNote && String(autosave.draftNote).trim()) || (autosave.aiAnalysis && String(autosave.aiAnalysis).trim());
	                if (!hasTranscript && !hasChat && !hasOutputs) return;

	                // Avoid repeated prompting during a single page lifecycle.
	                if (sessionStorage.getItem('dermascribe.autosavePrompted') === 'true') return;
	                sessionStorage.setItem('dermascribe.autosavePrompted', 'true');

	                const when = autosave.timestamp ? new Date(autosave.timestamp).toLocaleString() : 'an earlier session';
	                const shouldRecover = confirm(`Recover autosaved draft from ${when}?`);
	                if (shouldRecover) {
	                    await loadSavedSession(autosave.id);
	                    showNotification('Recovered autosaved draft', 'success');
	                    setRecoveryBanner(`Recovered from ${when} snapshot (confidence: High).`, 'success');
	                } else {
	                    setRecoveryBanner(`Recovery available from ${when} snapshot (confidence: Medium).`, 'info');
	                }
	            } catch (error) {
	                console.warn('Autosave recovery check failed:', error);
	                setRecoveryBanner('Autosave recovery check failed. Start a new session or load a saved session.', 'error');
	            }
	        }

	        async function viewSavedSessions() {
	            const sessions = (await getAllSessions()).filter((s) => s.type !== 'autosave');

            const modal = document.createElement('div');
            modal.className = 'modal-backdrop';
            modal.id = 'sessionsModal';

	            const sessionsList = sessions.length === 0
	                ? '<p class="text-muted">No saved sessions yet.</p>'
	                : sessions.map(s => `
	                    <div class="session-card" style="
	                        background: var(--bg-tertiary);
	                        border: 1px solid var(--border-primary);
	                        border-radius: var(--border-radius);
	                        padding: 1rem;
	                        margin-bottom: 0.75rem;
	                        cursor: pointer;
	                        transition: background-color 160ms ease, border-color 160ms ease;
	                    " data-action="load-saved-session" data-session-id="${s.id}">
	                        <div style="display: flex; justify-content: space-between; align-items: start;">
	                            <div>
	                                <h4 style="margin: 0 0 0.5rem; color: var(--text-primary);">
	                                    ${s.type === 'chat' ? 'Chat Session' : 'Transcription Session'}
	                                </h4>
	                                <p class="text-muted" style="font-size: 0.75rem; margin: 0;">
	                                    ${new Date(s.timestamp).toLocaleString()}
	                                </p>
	                                <p class="text-muted" style="font-size: 0.75rem; margin: 0.25rem 0 0;">
	                                    ${s.transcript ? escapeHtml(s.transcript.substring(0, 100)) + '...' : 'No transcript'}
	                                </p>
	                            </div>
	                            <button class="btn-modern btn-ghost btn-icon" type="button" data-action="delete-saved-session" data-session-id="${s.id}" title="Delete">
	                                <span class="material-symbols-outlined">delete</span>
	                            </button>
	                        </div>
	                    </div>
	                `).join('');

	            modal.innerHTML = `
	                <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
	                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
	                        <h2 style="margin: 0; color: var(--text-primary);">Saved Sessions</h2>
	                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="sessionsModal">
	                            <span class="material-symbols-outlined">close</span>
	                        </button>
	                    </div>
	                    <p class="text-muted mb-4">${sessions.length} session(s) saved locally in your browser.</p>
	                    <div id="sessionsList">
                        ${sessionsList}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal('sessionsModal');
            });
        }

        async function loadSavedSession(sessionId) {
	            const session = await loadSessionFromStorage(sessionId);
	            if (!session) {
	                showNotification('Failed to load session', 'error');
	                return;
	            }

	            // Restore session data
	            fullTranscript = session.transcript || '';
	            currentDraftNote = session.draftNote || '';
	            currentAiAnalysis = session.aiAnalysis || '';
	            currentManagementPlan = session.managementPlan || '';
	            chatHistory = session.chatHistory || [];

            // Switch to appropriate mode
            if (session.type === 'chat') {
                startChatMode();
                // Restore chat messages
                const messagesContainer = document.getElementById('chatMessages');
                messagesContainer.innerHTML = '';
                chatHistory.forEach(m => {
                    addChatMessage(m.content, m.role === 'user' ? 'user' : 'ai', { record: false });
                });
	            } else {
		                startTranscriptionMode();
		                // Restore transcription data
		                if (fullTranscript) {
		                    document.getElementById('transcriptionOutput').innerHTML =
		                        `<p class="transcript-text">${escapeHtml(fullTranscript)}</p>`;
		                }
		                if (currentManagementPlan) {
		                    displayManagementPlan(currentManagementPlan);
		                }
		                if (currentAiAnalysis) {
		                    displayDifferentialDiagnosis(currentAiAnalysis);
		                }
	                if (currentDraftNote) {
	                    displaySOAPNote(currentDraftNote);
	                }
	            }

            closeModal('sessionsModal');
            showNotification('Session loaded successfully', 'success');
        }

        async function deleteSavedSession(sessionId) {
            if (!confirm('Are you sure you want to delete this session?')) return;

            const success = await deleteSession(sessionId);
            if (success) {
                showNotification('Session deleted', 'success');
                // Refresh the sessions list
                closeModal('sessionsModal');
                viewSavedSessions();
            } else {
                showNotification('Failed to delete session', 'error');
            }
        }

        // ========== Image Upload + Integration ==========
        let chatImageBase64 = null;
        let chatImageMimeType = null;
	        let lastImageAnalysisDescription = '';

	        function openTranscriptionImageUpload() {
	            const input = document.createElement('input');
	            input.type = 'file';
	            input.accept = 'image/*';
	            input.onchange = (e) => {
	                const file = e.target.files[0];
	                if (!file) return;

	                const reader = new FileReader();
	                reader.onload = (event) => {
	                    const dataUrl = event.target.result;
	                    const base64 = String(dataUrl).split(',')[1] || '';
	                    if (!base64) {
	                        showNotification('Failed to read image data', 'error');
	                        return;
	                    }
	                    showNotification('Analyzing image…', 'info');
	                    sendToServer('analyze_image', {
	                        imageBase64: base64,
	                        imageMimeType: file.type || 'image/png'
	                    });
	                };
	                reader.readAsDataURL(file);
	            };
	            input.click();
	        }

	        function initializeChatImageUpload() {
	            const attachBtn = document.getElementById('chatAttachImageBtn');
	            if (!attachBtn) return;
	            attachBtn.addEventListener('click', (event) => {
	                event.preventDefault();
	                openChatImageUpload();
	            });
	        }

        function openChatImageUpload() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    chatImageMimeType = file.type;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        chatImageBase64 = event.target.result.split(',')[1];
                        showImagePreviewInChat(event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        }

	        function showImagePreviewInChat(dataUrl) {
	            const messagesContainer = document.getElementById('chatMessages');
	            if (!messagesContainer) return;

	            const previewDiv = document.createElement('div');
	            previewDiv.id = 'chatImagePreview';
	            previewDiv.className = 'chat-message chat-message-user';

	            const avatar = document.createElement('div');
	            avatar.className = 'chat-avatar';
	            const avatarIcon = document.createElement('span');
	            avatarIcon.className = 'material-symbols-outlined';
	            avatarIcon.style.color = '#0f1419';
	            avatarIcon.textContent = 'person';
	            avatar.appendChild(avatarIcon);

	            const content = document.createElement('div');
	            content.className = 'chat-content';
	            content.style.position = 'relative';

	            const img = document.createElement('img');
	            img.src = dataUrl;
	            img.style.maxWidth = '200px';
	            img.style.maxHeight = '200px';
	            img.style.borderRadius = '8px';

	            const removeBtn = document.createElement('button');
	            removeBtn.type = 'button';
	            removeBtn.textContent = '×';
	            removeBtn.style.position = 'absolute';
	            removeBtn.style.top = '-8px';
	            removeBtn.style.right = '-8px';
	            removeBtn.style.background = 'var(--error)';
	            removeBtn.style.border = 'none';
	            removeBtn.style.borderRadius = '50%';
	            removeBtn.style.width = '24px';
	            removeBtn.style.height = '24px';
	            removeBtn.style.cursor = 'pointer';
	            removeBtn.style.color = 'white';
	            removeBtn.style.fontSize = '12px';
	            removeBtn.setAttribute('aria-label', 'Remove attached image');
	            removeBtn.addEventListener('click', (event) => {
	                event.preventDefault();
	                removeChatImagePreview();
	            });

	            const hint = document.createElement('p');
	            hint.className = 'text-muted mt-2';
	            hint.style.fontSize = '0.75rem';
	            hint.textContent = 'Image attached - type a message to analyze';

	            content.appendChild(img);
	            content.appendChild(removeBtn);
	            content.appendChild(hint);

	            previewDiv.appendChild(avatar);
	            previewDiv.appendChild(content);

	            messagesContainer.appendChild(previewDiv);
	            messagesContainer.scrollTop = messagesContainer.scrollHeight;
	        }

        function removeChatImagePreview() {
            chatImageBase64 = null;
            chatImageMimeType = null;
            const preview = document.getElementById('chatImagePreview');
            if (preview) preview.remove();
        }

	        function handleImageAnalysisResult(description) {
	            const cleaned = String(description ?? '').trim();
	            if (!cleaned) {
	                showNotification('Image analysis returned an empty description', 'warning');
	                if (currentMode === 'chat') removeChatImagePreview();
	                return;
	            }

	            lastImageAnalysisDescription = cleaned;

	            // If we're in chat mode, also write the result to the chat transcript.
	            hideTypingIndicator();
	            if (currentMode === 'chat') {
	                addChatMessage(`**Image Analysis:** ${cleaned}`, 'ai');
	                removeChatImagePreview();
	            } else {
	                showNotification('Image analysis complete. Review and integrate if desired.', 'success');
	            }

	            openImageIntegrationModal();
	        }

	        function openImageIntegrationModal() {
	            if (!lastImageAnalysisDescription) return;
	            closeModal('imageIntegrationModal');

		            const modal = document.createElement('div');
		            modal.className = 'modal-backdrop';
		            modal.id = 'imageIntegrationModal';
		            modal.innerHTML = `
		                <div class="modal-content" style="max-width: 650px; background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1.5rem;">
		                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
		                        <h2 style="margin: 0; color: var(--text-primary);">Image Findings</h2>
		                        <button class="btn-modern btn-ghost btn-icon" type="button" data-action="close-modal" data-modal-id="imageIntegrationModal">
		                            <span class="material-symbols-outlined">close</span>
		                        </button>
		                    </div>
		                    <p class="text-muted mb-3">Review the AI-generated description. If you integrate it, RAMIE will regenerate the note and analysis including these findings.</p>
		                    <div class="ai-content" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1rem; max-height: 240px; overflow-y: auto;">
		                        ${formatBlockMarkdownSafe(lastImageAnalysisDescription)}
		                    </div>
		                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem;">
		                        <button class="btn-modern btn-ghost" type="button" data-action="close-modal" data-modal-id="imageIntegrationModal">Dismiss</button>
		                        <button class="btn-modern btn-primary" type="button" data-action="integrate-image-findings" data-modal-id="imageIntegrationModal">
		                            <span class="material-symbols-outlined">merge</span>
		                            Integrate & Regenerate
		                        </button>
		                    </div>
		                </div>
		            `;

	            document.body.appendChild(modal);
	            modal.addEventListener('click', (e) => {
	                if (e.target === modal) closeModal('imageIntegrationModal');
	            });
	        }

	        function integrateImageFindingsAndRegenerate() {
	            if (!lastImageAnalysisDescription) {
	                showNotification('No image findings available to integrate', 'warning');
	                return;
	            }

	            let baseTranscript = '';
	            if (currentMode === 'chat') {
	                baseTranscript = getChatTranscriptSnapshot();
	            } else {
	                const summary = document.getElementById('transcriptSummary')?.value?.trim() || '';
	                baseTranscript = fullTranscript.trim() || summary;
	            }

	            if (!baseTranscript) {
	                showNotification('Add a transcript/chat context before integrating image findings', 'warning');
	                return;
	            }

	            const transcriptWithImage = `${baseTranscript}\n\n--- CLINICAL IMAGE FINDINGS ---\n${lastImageAnalysisDescription}\n--- END CLINICAL IMAGE FINDINGS ---\n`.trim();
	            fullTranscript = transcriptWithImage + ' ';
	            markAutosaveDirty();

	            showNotification('Integrating image findings and regenerating outputs…', 'info');
	            sendToServer('stop_finalize_recording', { transcript: transcriptWithImage });

	            if (currentMode === 'transcription') {
	                const output = document.getElementById('transcriptionOutput');
	                if (output) {
	                    output.innerHTML = `<p class="transcript-text">${escapeHtml(transcriptWithImage)}</p>`;
	                }
	            }
	        }

	        // Override sendChatMessage to include image if attached
	        const originalSendChatMessage = sendChatMessage;
	        sendChatMessage = function () {
	            if (chatImageBase64) {
	                const input = document.getElementById('chatInput');
	                const message = input.value.trim();
	
	                // Send image for analysis first
	                addChatMessage(message || 'Analyze this image', 'user');
	                chatHistory.push({ role: 'user', content: message || 'Analyze this image' });
	                markAutosaveDirty();
	                input.value = '';
	
	                showTypingIndicator();
	                sendToServer('analyze_image', {
	                    imageBase64: chatImageBase64,
	                    imageMimeType: chatImageMimeType,
	                    userMessage: message
	                });
	                return;
	            }
	
	            // Fall back to the standard text-only handler
	            originalSendChatMessage();
	        };

        // Initialize on load
		        document.addEventListener('DOMContentLoaded', () => {
		            loadBackendConfigIntoUI();
		
		            // Connect to WebSocket backend (only if token is configured)
		            connectWebSocket();
		            checkForAutosaveRecovery();
		            window.LegacyGuidance?.maybeShow('dermatology-scribe-legacy', [
		                'Configure backend connection settings before starting a mode.',
		                'Use Save Session regularly to keep a durable local copy.',
		                'If recovery appears, verify content and continue or start fresh.'
		            ]);
		
		            // Global event delegation for CSP-safe modal actions
		            document.addEventListener('click', handleDataActionClick);
		
		            // Setup global keyboard shortcuts
		            document.addEventListener('keydown', handleGlobalKeydown);
		
		            const bindClick = (id, handler) => {
		                const el = document.getElementById(id);
		                if (!el) return;
		                el.addEventListener('click', (e) => {
		                    e.preventDefault();
		                    handler();
		                });
		            };
		
		            const bindCardActivation = (id, handler) => {
		                const el = document.getElementById(id);
		                if (!el) return;
		                el.addEventListener('click', (e) => {
		                    e.preventDefault();
		                    handler();
		                });
		                el.addEventListener('keydown', (e) => {
		                    if (e.key === 'Enter' || e.key === ' ') {
		                        e.preventDefault();
		                        handler();
		                    }
		                });
		            };
		
		            bindClick('saveBackendConfigBtn', saveBackendConfig);
		            bindCardActivation('startChatModeCard', beginNewChatSession);
		            bindCardActivation('startTranscriptionModeCard', beginNewTranscriptionSession);
		            bindCardActivation('viewSavedSessionsCard', viewSavedSessions);
		
		            bindClick('saveSessionBtn', saveCurrentSession);
		            bindClick('backToHomeBtn', backToHome);
		            bindClick('transcriptionImageUploadBtn', openTranscriptionImageUpload);
		
		            bindClick('chatSaveSessionBtn', saveCurrentSession);
		            bindClick('chatViewOutputsBtn', openOutputsModal);
		            bindClick('chatFinalizeBtn', finalizeAndGenerateNote);
		            bindClick('chatSendBtn', sendChatMessage);
		
		            const chatInput = document.getElementById('chatInput');
		            if (chatInput) {
		                chatInput.addEventListener('keydown', (e) => {
		                    if (e.key === 'Enter') {
		                        e.preventDefault();
		                        sendChatMessage();
		                    }
		                });
		            }
		
		            // Setup macro expansion on text inputs
		            const textInputs = document.querySelectorAll('input[type="text"], textarea');
		            textInputs.forEach(input => setupMacroExpansion(input));
		
		            // Initialize chat image upload
		            initializeChatImageUpload();
		
		            // Watch for dynamically added inputs
		            const observer = new MutationObserver((mutations) => {
		                mutations.forEach((mutation) => {
		                    mutation.addedNodes.forEach((node) => {
		                        if (node.nodeType === 1) {
		                            const inputs = node.querySelectorAll ? node.querySelectorAll('input[type="text"], textarea') : [];
		                            inputs.forEach(input => setupMacroExpansion(input));
		                            if (node.matches && node.matches('input[type="text"], textarea')) {
		                                setupMacroExpansion(node);
		                            }
		                        }
		                    });
		                });
		            });
		            observer.observe(document.body, { childList: true, subtree: true });
		        });
