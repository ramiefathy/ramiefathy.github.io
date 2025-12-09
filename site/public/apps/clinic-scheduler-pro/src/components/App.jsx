/**
 * App - Main application shell component
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { useApp, usePermissions } from '../contexts/AppContext';
import { toast, Toaster } from '../contexts/ToastContext';

// Components
import { Icon, LoadingSpinner, Modal } from './shared';
import LoginPage from './auth/LoginPage';
import Dashboard from './dashboard/Dashboard';
import ScheduleCalendar from './schedule/ScheduleCalendar';
import ScheduleRequests from './schedule/ScheduleRequests';
import AttendingsList from './people/AttendingsList';
import ResidentsList from './people/ResidentsList';
import RulesList from './rules/RulesList';
import SettingsView from './settings/SettingsView';
import ChatAssistantPanel, { AssistantGuideView } from './chat/ChatAssistantPanel';
import AboutPage from './about/AboutPage';

const App = () => {
    const { user, loading, firebaseService } = useApp();
    const { canSchedule } = usePermissions();
    const [activeView, setActiveView] = useState('dashboard');
    const [scheduleFilterData, setScheduleFilterData] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showChatAssistant, setShowChatAssistant] = useState(false);

    const navigateToSchedule = (personType, personId) => {
        setScheduleFilterData({ type: personType, id: personId });
        setActiveView('schedule');
    };

    const handleNavClick = (viewId) => {
        setActiveView(viewId);
        setMobileMenuOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        ...(canSchedule ? [{ id: 'requests', label: 'Requests', icon: 'inbox' }] : []),
        { id: 'attendings', label: 'Attendings', icon: 'users' },
        { id: 'residents', label: 'Residents', icon: 'user-check' },
        { id: 'rules', label: 'Rules', icon: 'shield-check' },
        { id: 'assistant-guide', label: 'Assistant Guide', icon: 'bot' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
        { id: 'about', label: 'About', icon: 'info' }
    ];

    const handleSignOut = async () => {
        await firebaseService.signOut();
        toast.success('Signed out successfully');
    };

    return (
        <div className="min-h-screen font-body mesh-bg">
            {/* Premium Navigation Header */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="sticky top-0 z-50 glass-card border-b border-medical-200/20 backdrop-blur-xl"
                style={{ background: 'rgba(255, 255, 255, 0.82)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-medical-400 to-medical-600 rounded-2xl shadow-lg shadow-medical-500/20">
                                    <Icon name="calendar-days" size={26} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-display font-bold text-medical-900">Clinic Scheduler</h1>
                                </div>
                            </div>

                            <div className="hidden md:flex ml-12 space-x-2">
                                {navItems.map(item => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all relative
                                            ${activeView === item.id
                                                ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg shadow-medical-500/25'
                                                : 'text-medical-700 hover:bg-medical-50 hover:text-medical-900'
                                            }
                                        `}
                                    >
                                        <Icon name={item.icon} size={16} />
                                        {item.label}
                                        {activeView === item.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-medical-50 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <Icon
                                    name={mobileMenuOpen ? "x" : "menu"}
                                    size={24}
                                    className="text-medical-700"
                                />
                            </button>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="hidden sm:flex badge-live items-center gap-2 px-4 py-2 rounded-full"
                            >
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm text-white font-bold">Live Sync</span>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-3 glass-card rounded-full relative transition-all hover:shadow-lg"
                            >
                                <Icon name="bell" size={20} className="text-medical-700" />
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <span className="text-xs text-white font-bold">3</span>
                                </motion.span>
                            </motion.button>

                            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-medical-200">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-medical-900">{user.name || user.email}</p>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-xs text-medical-600 hover:text-medical-800 font-medium transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center shadow-lg shadow-medical-500/20"
                                >
                                    <Icon name="user" size={18} className="text-white" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Mobile Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="md:hidden fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h2 className="text-lg font-bold text-medical-900">Menu</h2>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close menu"
                                    >
                                        <Icon name="x" size={24} className="text-gray-600" />
                                    </button>
                                </div>

                                {/* User Info */}
                                <div className="p-4 bg-gradient-to-br from-medical-50 to-medical-100 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center">
                                            <Icon name="user" size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-medical-900">{user.name || 'User'}</p>
                                            <p className="text-sm text-medical-600">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Items */}
                                <nav className="flex-1 p-4">
                                    <ul className="space-y-2">
                        {navItems.map(item => (
                                            <li key={item.id}>
                                                <button
                                                    onClick={() => handleNavClick(item.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeView === item.id
                                                            ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg'
                                                            : 'hover:bg-medical-50 text-medical-700'
                                                        }`}
                                                >
                                                    <Icon name={item.icon} size={20} />
                                                    <span className="font-medium">{item.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                {/* Footer */}
                                <div className="p-4 border-t">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg mb-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm text-green-700 font-medium">Live Sync Active</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleSignOut();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <Icon name="log-out" size={20} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content with Glass Background */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'schedule' && (
                    <ScheduleCalendar
                        initialFilter={scheduleFilterData}
                        onNavigateToPerson={navigateToSchedule}
                        onOpenChatAssistant={() => setShowChatAssistant(true)}
                    />
                )}
                {activeView === 'requests' && <ScheduleRequests />}
                {activeView === 'attendings' && <AttendingsList navigateToSchedule={navigateToSchedule} />}
                {activeView === 'residents' && <ResidentsList navigateToSchedule={navigateToSchedule} />}
                {activeView === 'rules' && <RulesList />}
                {activeView === 'assistant-guide' && <AssistantGuideView />}
                {activeView === 'settings' && <SettingsView />}
                {activeView === 'about' && <AboutPage />}
            </main>

            {/* Global Chat Assistant Launcher */}
            <motion.button
                aria-label="Open Chat Assistant"
                onClick={() => setShowChatAssistant(true)}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 focus:outline-none focus:ring-4 focus:ring-primary-300 rounded-full flex items-center justify-center w-14 h-14"
            >
                <Icon name="bot" size={22} className="text-white" />
            </motion.button>

            <Toaster
                position="bottom-right"
                toastOptions={{
                    className: 'font-medium',
                    duration: 3000,
                    style: {
                        background: '#fff',
                        color: '#363636',
                    },
                }}
            />

            {showChatAssistant && (
                <Modal
                    isOpen={showChatAssistant}
                    onClose={() => setShowChatAssistant(false)}
                    title="Chat Assistant"
                    size="xl"
                >
                    <ChatAssistantPanel onClose={() => setShowChatAssistant(false)} />
                </Modal>
            )}
        </div>
    );
};

export default App;
