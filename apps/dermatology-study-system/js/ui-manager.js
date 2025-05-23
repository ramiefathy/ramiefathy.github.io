class UIManager {
    constructor() {
        this.loadingOverlays = new Map();
        this.notifications = new Set();
        this.MAX_NOTIFICATIONS = 3;
        this.NOTIFICATION_DURATION = 5000; // 5 seconds
    }

    /**
     * Shows a loading overlay with a message
     * @param {string} id - Unique identifier for the loading overlay
     * @param {string} message - Loading message to display
     * @returns {string} The ID of the created overlay
     */
    showLoading(id = `loading_${Date.now()}`, message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <div class="flex items-center space-x-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="text-gray-700">${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.loadingOverlays.set(id, overlay);
        return id;
    }

    /**
     * Hides a loading overlay
     * @param {string} id - ID of the loading overlay to hide
     */
    hideLoading(id) {
        const overlay = this.loadingOverlays.get(id);
        if (overlay) {
            overlay.remove();
            this.loadingOverlays.delete(id);
        }
    }

    /**
     * Shows a notification message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // Remove oldest notification if at max capacity
        if (this.notifications.size >= this.MAX_NOTIFICATIONS) {
            const oldestNotification = Array.from(this.notifications)[0];
            oldestNotification.remove();
            this.notifications.delete(oldestNotification);
        }

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out z-50`;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-100', 'border-l-4', 'border-green-500', 'text-green-700');
                break;
            case 'error':
                notification.classList.add('bg-red-100', 'border-l-4', 'border-red-500', 'text-red-700');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-100', 'border-l-4', 'border-yellow-500', 'text-yellow-700');
                break;
            default:
                notification.classList.add('bg-blue-100', 'border-l-4', 'border-blue-500', 'text-blue-700');
        }

        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${this.getIconForType(type)}
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                        <span class="sr-only">Close</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add close button functionality
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            notification.remove();
            this.notifications.delete(notification);
        });

        document.body.appendChild(notification);
        this.notifications.add(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (this.notifications.has(notification)) {
                notification.remove();
                this.notifications.delete(notification);
            }
        }, this.NOTIFICATION_DURATION);
    }

    /**
     * Gets the appropriate icon for a notification type
     * @param {string} type - Type of notification
     * @returns {string} SVG icon HTML
     */
    getIconForType(type) {
        switch (type) {
            case 'success':
                return `
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                `;
            case 'error':
                return `
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                `;
            case 'warning':
                return `
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                `;
            default:
                return `
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                `;
        }
    }

    /**
     * Shows a confirmation dialog
     * @param {string} message - Message to display
     * @param {string} confirmText - Text for confirm button
     * @param {string} cancelText - Text for cancel button
     * @returns {Promise<boolean>} Promise that resolves to true if confirmed, false if cancelled
     */
    showConfirmation(message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
            dialog.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                    <p class="text-gray-700 mb-4">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" id="cancelBtn">
                            ${cancelText}
                        </button>
                        <button class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700" id="confirmBtn">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            const handleConfirm = () => {
                dialog.remove();
                resolve(true);
            };

            const handleCancel = () => {
                dialog.remove();
                resolve(false);
            };

            dialog.querySelector('#confirmBtn').addEventListener('click', handleConfirm);
            dialog.querySelector('#cancelBtn').addEventListener('click', handleCancel);
        });
    }

    /**
     * Shows an error message with retry option
     * @param {string} message - Error message to display
     * @param {Function} retryCallback - Function to call when retry is clicked
     */
    showErrorWithRetry(message, retryCallback) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="inline-flex text-red-400 hover:text-red-500 focus:outline-none" id="retryBtn">
                        <span class="sr-only">Retry</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(errorDiv);

        const retryButton = errorDiv.querySelector('#retryBtn');
        retryButton.addEventListener('click', () => {
            errorDiv.remove();
            retryCallback();
        });

        // Auto-remove after duration
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                errorDiv.remove();
            }
        }, this.NOTIFICATION_DURATION);
    }
}

// Create and export a singleton instance
const uiManager = new UIManager();
export default uiManager; 