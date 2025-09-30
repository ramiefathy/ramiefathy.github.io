/**
 * BackupRestore - Data backup and restore component
 */

import React, { useState } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button } from '../shared';

// Utils
import { ExportUtils } from '../../utils/export';

const BackupRestore = () => {
    const { firebaseService, attendings, residents, assignments, institution } = useApp();
    const [importing, setImporting] = useState(false);
    const [exportType, setExportType] = useState('all');

    const handleExport = () => {
        let dataToExport = {};

        if (exportType === 'all' || exportType === 'institution') {
            dataToExport.institution = institution;
        }
        if (exportType === 'all' || exportType === 'attendings') {
            dataToExport.attendings = attendings;
        }
        if (exportType === 'all' || exportType === 'residents') {
            dataToExport.residents = residents;
        }
        if (exportType === 'all' || exportType === 'assignments') {
            dataToExport.assignments = assignments;
        }

        const json = ExportUtils.exportToJSON(dataToExport);
        const filename = ExportUtils.generateFilename(`backup_${exportType}`, 'json');
        ExportUtils.downloadFile(json, filename, 'application/json');
        toast.success(`${exportType} data exported successfully`);
    };

    const handleImport = () => {
        ExportUtils.selectFile('.json', async (content, filename) => {
            setImporting(true);

            const result = ExportUtils.parseImportedJSON(content);

            if (!result.success) {
                // Show detailed validation errors if present
                if (result.validationErrors && result.validationErrors.length > 0) {
                    const errorMessage = `Validation errors:\n${result.validationErrors.slice(0, 5).join('\n')}${
                        result.validationErrors.length > 5 ? `\n...and ${result.validationErrors.length - 5} more errors` : ''
                    }`;
                    toast.error(errorMessage);
                } else {
                    toast.error(result.error);
                }
                setImporting(false);
                return;
            }

            // Build confirmation message with validation info
            const dataTypes = Object.keys(result.data);
            let message = `Import Summary:\n`;

            if (result.validation) {
                message += `\n📊 Data to import:`;
                message += `\n• ${result.validation.summary.attendings} Attendings`;
                message += `\n• ${result.validation.summary.residents} Residents`;
                message += `\n• ${result.validation.summary.assignments} Assignments`;

                if (result.validation.warnings.length > 0) {
                    message += `\n\n⚠️ Warnings (${result.validation.warnings.length}):`;
                    message += `\n${result.validation.warnings.slice(0, 3).join('\n')}`;
                    if (result.validation.warnings.length > 3) {
                        message += `\n...and ${result.validation.warnings.length - 3} more warnings`;
                    }
                }
            } else {
                message += `\nData types: ${dataTypes.join(', ')}`;
            }

            message += `\n\nExported: ${result.exportDate || 'Unknown date'}`;
            message += `\n\nDo you want to continue?`;

            if (!confirm(message)) {
                setImporting(false);
                return;
            }

            try {
                // Import each data type
                if (result.data.attendings) {
                    for (const attending of result.data.attendings) {
                        await firebaseService.addAttending(attending);
                    }
                }
                if (result.data.residents) {
                    for (const resident of result.data.residents) {
                        await firebaseService.addResident(resident);
                    }
                }
                if (result.data.assignments) {
                    for (const assignment of result.data.assignments) {
                        await firebaseService.addAssignment(assignment);
                    }
                }

                toast.success('Data imported successfully');
            } catch (error) {
                console.error('Import error:', error);
                toast.error('Failed to import data');
            } finally {
                setImporting(false);
            }
        });
    };

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Restore</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Section */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-600">
                        Create a backup of your institution data
                    </p>

                    <select
                        value={exportType}
                        onChange={(e) => setExportType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="all">All Data</option>
                        <option value="institution">Institution Settings Only</option>
                        <option value="attendings">Attendings Only</option>
                        <option value="residents">Residents Only</option>
                        <option value="assignments">Assignments Only</option>
                    </select>

                    <Button onClick={handleExport} className="w-full">
                        <Icon name="download" size={16} className="mr-2" />
                        Export {exportType === 'all' ? 'All Data' : exportType}
                    </Button>
                </div>

                {/* Import Section */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Import Data</h4>
                    <p className="text-sm text-gray-600">
                        Restore data from a backup file
                    </p>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-2">
                            <Icon name="alert-triangle" size={16} className="text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium">Warning</p>
                                <p>Importing will add data to your existing records. Duplicate entries may be created.</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleImport}
                        disabled={importing}
                        variant="secondary"
                        className="w-full"
                    >
                        <Icon name="upload" size={16} className="mr-2" />
                        {importing ? 'Importing...' : 'Import from File'}
                    </Button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                    <Icon name="info" size={16} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Backup Best Practices</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Export your data regularly</li>
                            <li>Store backups in a secure location</li>
                            <li>Test restore functionality periodically</li>
                            <li>Keep multiple versions of backups</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupRestore;
