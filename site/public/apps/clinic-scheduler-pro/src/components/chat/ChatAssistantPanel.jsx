/**
 * ChatAssistantPanel - AI chat interface for scheduling assistance
 * AssistantGuideView - Onboarding guide for the chat assistant
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card } from '../shared';

// Utils
import { generateId } from '../../utils/helpers';

const ChatAssistantPanel = ({ onClose }) => {
    const { firebaseService, user } = useApp();
    const institutionId = firebaseService.currentInstitution;
    const firstName = user?.name ? user.name.split(' ')[0] : 'there';
    const [messages, setMessages] = useState(() => ([
        { id: generateId('msg'), role: 'assistant', content: `Hi ${firstName}! How can I help with the schedule today?` }
    ]));
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const todayIso = () => new Date().toISOString().split('T')[0];

    const sendMessage = async (text, options = {}) => {
        const trimmed = typeof text === 'string' ? text.trim() : '';
        const hasDirectAction = Boolean(options?.directAction?.name);
        if ((!trimmed && !hasDirectAction) || !institutionId) {
            return;
        }

        const userContent = trimmed || options.fallbackUserMessage || 'Request sent.';
        const userMessage = { id: generateId('msg'), role: 'user', content: userContent };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        if (!window.firebase?.functions) {
            toast.error('Realtime functions are not available right now.');
            return;
        }

        setIsSending(true);
        try {
            const chatFn = window.firebase.functions.httpsCallable('chatAssistant');
            const historyPayload = messages
                .concat(userMessage)
                .slice(-10)
                .map(entry => ({ role: entry.role, content: entry.content }));

            const payload = {
                institutionId,
                message: userContent,
                history: historyPayload
            };

            if (hasDirectAction) {
                payload.directAction = options.directAction;
            }

            const response = await chatFn(payload);

            const data = response?.data || {};
            const assistantText = data.reply || 'Done.';
            const assistantMessage = {
                id: generateId('msg'),
                role: 'assistant',
                content: assistantText,
                metadata: data
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat assistant send error', error);
            toast.error(error.message || 'The assistant could not complete that request.');
            setMessages(prev => [...prev, { id: generateId('msg'), role: 'assistant', content: 'Sorry, I could not complete that request. Please try again.' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (isSending) return;
        sendMessage(inputValue);
    };

    const handleUndo = () => {
        if (isSending) return;
        sendMessage('Undo the last change.', {
            directAction: {
                name: 'undo_action',
                args: { steps: 1 }
            }
        });
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div ref={listRef} className="flex-1 overflow-y-auto pr-2 space-y-3">
                {messages.map(message => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${
                                message.role === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                            {message.metadata?.action && (
                                <p className="mt-1 text-xs opacity-80">Action: {message.metadata.action}</p>
                            )}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="text-gray-500 text-sm italic">Assistant is thinking…</div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex items-end gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask the assistant to add, adjust, or review schedules…"
                        className="flex-1 h-24 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <Button type="submit" disabled={isSending || !inputValue.trim()}>
                        <Icon name="send" size={16} className="mr-2" />
                        Send
                    </Button>
                </div>
            </form>

            <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleUndo} disabled={isSending}>
                        <Icon name="rotate-ccw" size={14} className="mr-1" />
                        Undo last action
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => sendMessage('Summarize today\'s clinic coverage.', {
                            directAction: {
                                name: 'summarize_coverage',
                                args: { date: todayIso() }
                            }
                        })}
                        disabled={isSending}
                    >
                        <Icon name="sparkles" size={14} className="mr-1" />
                        Summarize today
                    </Button>
                </div>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
};

export const AssistantGuideView = () => {
    const sections = [
        {
            title: 'Prerequisites',
            description: 'Before launching the assistant, make sure the basics are covered.',
            icon: 'badge-check',
            items: [
                'Sign in with an account that has admin, program_admin, chief_resident, or scheduler permissions.',
                'Confirm the Firebase Functions deployment includes the chatAssistant callable.',
                'Set environment config: gemini.location, gemini.model, chatbot.rate_limit, chatbot.undo_limit.',
                'For local testing, point GOOGLE_APPLICATION_CREDENTIALS to the service account JSON (keep it outside Git).'
            ]
        },
        {
            title: 'Launching the Assistant',
            description: 'Find the assistant inside the Schedule view.',
            icon: 'rocket',
            items: [
                'Open Clinic Scheduler Pro and navigate to the Schedule tab.',
                'Select the floating "Chat Assistant" button at the bottom right.',
                'Use the modal to review conversation history, send requests, or trigger quick actions like Undo and Summarize.'
            ]
        },
        {
            title: 'Request Tips',
            description: 'Provide structured details so Gemini can take precise action.',
            icon: 'list-checks',
            items: [
                'Include date (YYYY-MM-DD), time slot (AM/PM), attending/resident IDs, and site or clinic when known.',
                'Describe recurrence explicitly, e.g., "every week for 4 weeks starting 2025-10-02".',
                'State the desired outcome in one sentence—avoid multi-step instructions in a single message.',
                'Roster uploads should list one person per line with name and PGY (add email/phone if available).',
                'Ask for a coverage summary and include a specific date or range when you need staffing snapshots.'
            ]
        },
        {
            title: 'Coverage & Rosters',
            description: 'Leverage purpose-built tools for summaries and bulk directory updates.',
            icon: 'file-text',
            items: [
                'Use the Summarize quick action or say "summarize coverage for 2025-11-04" to get slot-by-slot assignments.',
                'Undo up to 25 chatbot actions in one go, e.g., "undo the last 3 changes".',
                'Keep bulk additions to 400 people or fewer to stay within Firestore write limits.'
            ]
        },
        {
            title: 'Guardrails & Limits',
            description: 'The assistant enforces safety rules before saving changes.',
            icon: 'shield-alert',
            items: [
                'Protected continuity clinics, didactics, and approved time off cannot be edited by the assistant.',
                'Rate limiting defaults to 20 requests per hour per user—slow down when you see a cooldown message.',
                'Undo reverts up to the last 25 bot actions for your account (per request or stacked); manual calendar edits remain untouched.'
            ]
        },
        {
            title: 'Troubleshooting',
            description: 'How to recover when something feels off.',
            icon: 'life-buoy',
            items: [
                'If responses hang on "Assistant is thinking…", inspect Firebase logs (`firebase functions:log --only chatAssistant`).',
                'Permission errors typically mean your Firestore member record lacks the required role.',
                'Missing credentials? Redeploy with the chatbot service account or update GOOGLE_APPLICATION_CREDENTIALS locally.',
                'Large rollbacks: use the standard schedule restore workflow beyond the 25-step undo stack.'
            ]
        }
    ];

    const samplePrompts = [
        '"Schedule resident r_jackson with attending a_cole on 2025-10-14 AM at continuity clinic."',
        '"Move Taylor\'s October 09 AM clinic to Friday October 10 PM."',
        '"Undo the last 3 actions."',
        '"Summarize today\'s clinic coverage."',
        '"Add the following residents: Olivia Pierog, PGY-2; Jonathan Lai, PGY-2; Catherine Reilly, PGY-2; Diem-Phuong Dao, PGY-2."'
    ];

    const bestPractices = [
        'Break complex reorganizations into smaller requests and review results between each step.',
        'Let the UI trim older chat history to keep responses fast; long transcripts increase latency.',
        'Document high-impact bot changes in audit notes so teammates understand the context.',
        'Coordinate with other schedulers to avoid overlapping edits during busy clinic weeks.',
        'Use quick actions for undo and coverage summaries to call the underlying tools directly.'
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary-50 via-white to-primary-50 border-primary-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="uppercase tracking-widest text-xs text-primary-500 font-semibold">Assistant Onboarding</p>
                        <h2 className="text-2xl font-display font-bold text-medical-900 mt-1">Get Started with the Clinic Scheduler Chat Assistant</h2>
                        <p className="text-gray-600 mt-3 max-w-2xl">
                            Learn how to safely automate scheduling changes with Gemini. Follow these guidelines to request updates, respect guardrails, and recover quickly when something goes sideways.
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-5 py-4 bg-white border border-primary-100 rounded-xl shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary-100 rounded-xl">
                                <Icon name="bot" size={28} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Roles with access</p>
                                <p className="font-semibold text-medical-900">Admin · Program Admin · Chief Resident · Scheduler</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
                {sections.map(section => (
                    <Card key={section.title} className="h-full">
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-medical-50 rounded-xl shadow-inner">
                                <Icon name={section.icon} size={24} className="text-medical-600" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-medical-900">{section.title}</h3>
                                    <p className="text-sm text-gray-600">{section.description}</p>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
                                    {section.items.map(item => (
                                        <li key={item} className="flex gap-2 items-start">
                                            <Icon name="check" size={16} className="mt-0.5 text-primary-500" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card className="h-full">
                    <h3 className="text-lg font-semibold text-medical-900 mb-3">Sample Prompts</h3>
                    <p className="text-sm text-gray-600 mb-4">Use these templates as a starting point and adjust IDs, dates, and clinics to fit your scenario.</p>
                    <div className="space-y-3">
                        {samplePrompts.map(prompt => (
                            <div key={prompt} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">
                                {prompt}
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="h-full">
                    <h3 className="text-lg font-semibold text-medical-900 mb-3">Best Practices</h3>
                    <p className="text-sm text-gray-600 mb-4">Keep collaboration tight and reduce rework by following these habits.</p>
                    <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                        {bestPractices.map(item => (
                            <li key={item} className="flex gap-2 items-start">
                                <Icon name="sparkles" size={16} className="mt-0.5 text-primary-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <Card className="bg-medical-50 border-medical-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-medical-900">Need help or spotting anomalies?</h3>
                        <p className="text-sm text-gray-600 mt-1">Check the chatAssistant logs first. Escalate via #clinic-scheduler Slack or contact the platform ops team for urgent issues.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => navigator.clipboard?.writeText('firebase functions:log --only chatAssistant')}
                            className="bg-white"
                        >
                            <Icon name="clipboard-copy" size={16} className="mr-2" />
                            Copy log command
                        </Button>
                        <Button
                            onClick={() => toast.success('Remember to share context in #clinic-scheduler when you reach out!')}
                        >
                            <Icon name="message-circle" size={16} className="mr-2" />
                            Notify ops team
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ChatAssistantPanel;
