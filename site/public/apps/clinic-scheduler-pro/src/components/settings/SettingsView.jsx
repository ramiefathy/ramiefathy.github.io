/**
 * SettingsView - Institution settings management component
 */

import React, { useState } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card, Modal } from '../shared';
import MembersManagement from './MembersManagement';
import BackupRestore from './BackupRestore';

// Site Form Component
const SiteForm = ({ site, existingSites, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: site.name || '',
        code: site.code || '',
        address: site.address || '',
        color: site.color || '#10b981',
        ...site
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Main Hospital"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., MAIN"
                    maxLength="5"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="123 Medical Center Dr, City, State 12345"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-20"
                    />
                    <span className="text-sm text-gray-600">{formData.color}</span>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Site</Button>
            </div>
        </form>
    );
};

// Rotation Form Component
const RotationForm = ({ rotation, sites, existingRotations, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: rotation.name || '',
        code: rotation.code || '',
        siteIds: rotation.siteIds || [],
        isMultiSite: rotation.isMultiSite || false,
        requirements: rotation.requirements || {},
        // Scheduling rules
        allowsSST: rotation.allowsSST ?? true,
        allowsARE: rotation.allowsARE ?? false,
        requiresClinics: rotation.requiresClinics ?? true,
        isConsultService: rotation.isConsultService ?? false,
        isFloat: rotation.isFloat ?? false,
        ...rotation
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Pediatrics"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., PEDS"
                    maxLength="10"
                    required
                />
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isMultiSite}
                        onChange={(e) => setFormData({ ...formData, isMultiSite: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Multi-site rotation</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Check if residents on this rotation work at multiple sites</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Associated Sites</label>
                <div className="space-y-2">
                    {sites.map(site => (
                        <label key={site.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.siteIds.includes(site.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({ ...formData, siteIds: [...formData.siteIds, site.id] });
                                    } else {
                                        setFormData({ ...formData, siteIds: formData.siteIds.filter(id => id !== site.id) });
                                    }
                                }}
                                className="rounded"
                            />
                            <span className="text-sm">{site.name} ({site.code})</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Scheduling Rules Section */}
            <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Scheduling Rules</label>
                <div className="space-y-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.requiresClinics}
                            onChange={(e) => setFormData({ ...formData, requiresClinics: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">Requires clinic staffing</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.isConsultService}
                            onChange={(e) => setFormData({ ...formData, isConsultService: e.target.checked, requiresClinics: e.target.checked ? false : formData.requiresClinics })}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">Consult service (CC only, no clinics)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.isFloat}
                            onChange={(e) => setFormData({ ...formData, isFloat: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">Float rotation (covers vacations)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.allowsSST}
                            onChange={(e) => setFormData({ ...formData, allowsSST: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">Allows SST (Self-Study Time)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.allowsARE}
                            onChange={(e) => setFormData({ ...formData, allowsARE: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">Allows ARE (Additional Research Elective)</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Rotation</Button>
            </div>
        </form>
    );
};

// Protected Time Form Component
const ProtectedTimeForm = ({ protectedTime, sites, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: protectedTime.name || '',
        dayOfWeek: protectedTime.dayOfWeek ?? 3, // Default to Wednesday
        timeSlot: protectedTime.timeSlot || 'AM',
        appliesTo: protectedTime.appliesTo || 'all',
        mandatory: protectedTime.mandatory ?? true,
        eventType: protectedTime.eventType || 'didactics',
        siteId: protectedTime.siteId || '',
        ...protectedTime
    });

    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const pgyLevels = ['all', 'PGY-1', 'PGY-2', 'PGY-3', 'PGY-4', 'PGY-5+'];
    const eventTypes = [
        { value: 'didactics', label: 'Didactics' },
        { value: 'grand-rounds', label: 'Grand Rounds' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'protected', label: 'Protected Education' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Weekly Didactics"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                    <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        {daysOfWeek.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                    <select
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
                <select
                    value={formData.appliesTo}
                    onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {pgyLevels.map(level => (
                        <option key={level} value={level}>
                            {level === 'all' ? 'All Residents' : level}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site (Optional)</label>
                <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="">All Sites</option>
                    {sites.map(site => (
                        <option key={site.id} value={site.id}>
                            {site.name} ({site.code})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.mandatory}
                        onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Mandatory Attendance</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                    If checked, residents must attend unless explicitly excused
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Protected Time</Button>
            </div>
        </form>
    );
};

const SettingsView = () => {
    const { firebaseService, institution } = useApp();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        institutionName: institution?.name || '',
        timezone: institution?.settings?.timezone || 'America/New_York',
        workDays: institution?.settings?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        autoScheduleEnabled: institution?.settings?.autoScheduleEnabled !== false,
        notificationsEnabled: institution?.settings?.notificationsEnabled !== false,
        sites: institution?.settings?.sites || [
            { id: 'site_1', name: 'Main Clinic', code: 'MAIN', color: '#10b981', address: '' }
        ],
        rotations: institution?.settings?.rotations || [
            { id: 'rot_1', name: 'General', code: 'GEN', siteIds: ['site_1'], isMultiSite: false, requirements: {} }
        ],
        protectedTimes: institution?.settings?.protectedTimes || []
    });
    const [saving, setSaving] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [editingRotation, setEditingRotation] = useState(null);
    const [editingProtectedTime, setEditingProtectedTime] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        await firebaseService.updateInstitutionSettings(settings);
        toast.success('Settings saved');
        setSaving(false);
    };

    const tabs = [
        { id: 'general', name: 'General', icon: 'settings' },
        { id: 'sites', name: 'Sites', icon: 'map-pin' },
        { id: 'rotations', name: 'Rotations', icon: 'repeat' },
        { id: 'protected', name: 'Protected Times', icon: 'shield' },
        { id: 'schedule', name: 'Schedule', icon: 'calendar' },
        { id: 'members', name: 'Members', icon: 'users' },
        { id: 'backup', name: 'Backup', icon: 'database' }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600">Configure institution preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon name={tab.icon} size={16} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <Card>
                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Institution Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                                    <input
                                        type="text"
                                        value={settings.institutionName}
                                        onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="America/New_York">Eastern Time</option>
                                        <option value="America/Chicago">Central Time</option>
                                        <option value="America/Denver">Mountain Time</option>
                                        <option value="America/Los_Angeles">Pacific Time</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sites' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Clinical Sites</h3>
                                <Button
                                    onClick={() => setEditingSite({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Site
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {settings.sites.map(site => (
                                    <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: site.color }}
                                            />
                                            <div>
                                                <div className="font-medium">{site.name} ({site.code})</div>
                                                {site.address && (
                                                    <div className="text-sm text-gray-500">{site.address}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingSite(site)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            {settings.sites.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            sites: settings.sites.filter(s => s.id !== site.id)
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rotations' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Rotation Types</h3>
                                <Button
                                    onClick={() => setEditingRotation({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Rotation
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {settings.rotations.map(rotation => (
                                    <div key={rotation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{rotation.name} ({rotation.code})</div>
                                            <div className="text-sm text-gray-500">
                                                {rotation.isMultiSite ? 'Multi-site' : 'Single site'} •
                                                {rotation.siteIds?.length || 0} site(s)
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {rotation.isConsultService && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">Consult</span>
                                                )}
                                                {rotation.isFloat && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">Float</span>
                                                )}
                                                {rotation.allowsSST && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">SST</span>
                                                )}
                                                {rotation.allowsARE && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">ARE</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingRotation(rotation)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            {settings.rotations.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            rotations: settings.rotations.filter(r => r.id !== rotation.id)
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'protected' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Protected Times</h3>
                                <Button
                                    onClick={() => setEditingProtectedTime({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Protected Time
                                </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Define recurring weekly events like Didactics, Grand Rounds, or protected educational time.
                            </p>
                            <div className="space-y-2">
                                {settings.protectedTimes.map(pt => (
                                    <div key={pt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{pt.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pt.dayOfWeek]} {pt.timeSlot}
                                                {pt.appliesTo && pt.appliesTo !== 'all' && ` • ${pt.appliesTo.toUpperCase()}`}
                                                {pt.mandatory && ' • Mandatory'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingProtectedTime(pt)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSettings({
                                                        ...settings,
                                                        protectedTimes: settings.protectedTimes.filter(p => p.id !== pt.id)
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Icon name="trash-2" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {settings.protectedTimes.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No protected times defined. Click "Add Protected Time" to create one.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Preferences</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Days</label>
                                    <div className="space-y-2">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                            <label key={day} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.workDays.includes(day)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSettings({ ...settings, workDays: [...settings.workDays, day] });
                                                        } else {
                                                            setSettings({ ...settings, workDays: settings.workDays.filter(d => d !== day) });
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm capitalize">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoScheduleEnabled}
                                            onChange={(e) => setSettings({ ...settings, autoScheduleEnabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Auto-Scheduling</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationsEnabled}
                                            onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <MembersManagement />
                    )}

                    {activeTab === 'backup' && (
                        <BackupRestore />
                    )}

                    {activeTab !== 'members' && activeTab !== 'backup' && (
                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Site Edit Modal */}
            {editingSite && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingSite(null)}
                    title={editingSite.id ? 'Edit Site' : 'Add Site'}
                >
                    <SiteForm
                        site={editingSite}
                        existingSites={settings.sites}
                        onSave={(siteData) => {
                            if (siteData.id) {
                                setSettings({
                                    ...settings,
                                    sites: settings.sites.map(s => s.id === siteData.id ? siteData : s)
                                });
                            } else {
                                const newSite = {
                                    ...siteData,
                                    id: `site_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    sites: [...settings.sites, newSite]
                                });
                            }
                            setEditingSite(null);
                        }}
                        onCancel={() => setEditingSite(null)}
                    />
                </Modal>
            )}

            {/* Rotation Edit Modal */}
            {editingRotation && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingRotation(null)}
                    title={editingRotation.id ? 'Edit Rotation' : 'Add Rotation'}
                >
                    <RotationForm
                        rotation={editingRotation}
                        sites={settings.sites}
                        existingRotations={settings.rotations}
                        onSave={(rotationData) => {
                            if (rotationData.id) {
                                setSettings({
                                    ...settings,
                                    rotations: settings.rotations.map(r => r.id === rotationData.id ? rotationData : r)
                                });
                            } else {
                                const newRotation = {
                                    ...rotationData,
                                    id: `rot_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    rotations: [...settings.rotations, newRotation]
                                });
                            }
                            setEditingRotation(null);
                        }}
                        onCancel={() => setEditingRotation(null)}
                    />
                </Modal>
            )}

            {/* Protected Time Edit Modal */}
            {editingProtectedTime && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingProtectedTime(null)}
                    title={editingProtectedTime.id ? 'Edit Protected Time' : 'Add Protected Time'}
                >
                    <ProtectedTimeForm
                        protectedTime={editingProtectedTime}
                        sites={settings.sites}
                        onSave={(ptData) => {
                            if (ptData.id) {
                                setSettings({
                                    ...settings,
                                    protectedTimes: settings.protectedTimes.map(pt => pt.id === ptData.id ? ptData : pt)
                                });
                            } else {
                                const newPT = {
                                    ...ptData,
                                    id: `pt_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    protectedTimes: [...settings.protectedTimes, newPT]
                                });
                            }
                            setEditingProtectedTime(null);
                        }}
                        onCancel={() => setEditingProtectedTime(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default SettingsView;
