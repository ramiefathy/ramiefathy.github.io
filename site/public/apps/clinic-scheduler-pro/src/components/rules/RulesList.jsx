/**
 * RulesList - Scheduling rules management component
 */

import React, { useState, useEffect } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card, LoadingSpinner, Modal } from '../shared';

// Rule Form Component
const RuleForm = ({ rule, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: rule.name || '',
        description: rule.description || '',
        type: rule.type || 'soft',
        conditions: rule.conditions || '',
        active: rule.active !== false,
        ...rule
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="soft">Soft Rule (Preference)</option>
                    <option value="hard">Hard Rule (Constraint)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
                <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="e.g., Residents must not work more than 3 days in a row"
                    required
                />
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
            </div>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

const RulesList = () => {
    const { firebaseService } = useApp();
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        const unsubscribe = firebaseService.listenToRules((data) => {
            setRules(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [firebaseService.currentInstitution]);

    const handleSave = async (ruleData) => {
        if (ruleData.id) {
            await firebaseService.updateRule(ruleData.id, ruleData);
            toast.success('Rule updated');
        } else {
            await firebaseService.addRule(ruleData);
            toast.success('Rule added');
        }
        setEditingRule(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this rule?')) return;
        await firebaseService.deleteRule(id);
        toast.success('Rule deleted');
    };

    const handleToggleActive = async (rule) => {
        await firebaseService.updateRule(rule.id, { active: !rule.active });
        toast.success(`Rule ${rule.active ? 'disabled' : 'enabled'}`);
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Scheduling Rules</h2>
                    <p className="text-gray-600">Configure automatic scheduling constraints</p>
                </div>
                <Button onClick={() => setEditingRule({})}>
                    <Icon name="plus" size={16} className="mr-2" />
                    Add Rule
                </Button>
            </div>

            <div className="grid gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {rule.active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rule.type === 'hard' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {rule.type === 'hard' ? 'Hard Rule' : 'Soft Rule'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-2">{rule.description}</p>
                                <p className="text-sm text-gray-500 mt-2">Conditions: {rule.conditions}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(rule)}
                                    className="text-gray-600 hover:text-primary-600"
                                >
                                    <Icon name={rule.active ? 'toggle-right' : 'toggle-left'} size={20} />
                                </button>
                                <button
                                    onClick={() => setEditingRule(rule)}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    <Icon name="pencil" size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {editingRule && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingRule(null)}
                    title={editingRule.id ? 'Edit Rule' : 'Add Rule'}
                >
                    <RuleForm
                        rule={editingRule}
                        onSave={handleSave}
                        onCancel={() => setEditingRule(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default RulesList;
