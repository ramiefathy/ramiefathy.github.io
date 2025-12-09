/**
 * AboutPage - Comprehensive feature documentation and user guide
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../shared';

const Section = ({ id, title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-medical-50/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-medical-400 to-medical-600 rounded-xl shadow-lg shadow-medical-500/20">
                        <Icon name={icon} size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-medical-900">{title}</h3>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Icon name="chevron-down" size={20} className="text-medical-500" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-2 border-t border-medical-100">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Tip = ({ children }) => (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
        <Icon name="lightbulb" size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">{children}</p>
    </div>
);

const Feature = ({ icon, title, description }) => (
    <div className="flex items-start gap-3 py-3">
        <div className="p-2 bg-medical-100 rounded-lg flex-shrink-0">
            <Icon name={icon} size={16} className="text-medical-600" />
        </div>
        <div>
            <h4 className="font-semibold text-medical-900">{title}</h4>
            <p className="text-sm text-medical-600 mt-1">{description}</p>
        </div>
    </div>
);

const AboutPage = () => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
            >
                <div className="inline-flex p-4 bg-gradient-to-br from-medical-400 to-medical-600 rounded-2xl shadow-xl shadow-medical-500/30 mb-6">
                    <Icon name="calendar-days" size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-medical-900 mb-3">
                    Clinic Scheduler Pro
                </h1>
                <p className="text-medical-600 max-w-xl mx-auto">
                    Intelligent scheduling for residency programs. Automate assignments,
                    ensure compliance, and manage your team efficiently.
                </p>
            </motion.div>

            {/* Sections */}
            <div className="space-y-4">
                <Section id="getting-started" title="Getting Started" icon="rocket" defaultOpen={true}>
                    <p className="text-medical-700 mb-4">
                        Welcome to Clinic Scheduler Pro! This application helps residency programs
                        manage clinic assignments, track rotations, and ensure ACGME compliance.
                    </p>
                    <Feature
                        icon="log-in"
                        title="Sign In"
                        description="Use your institution email to sign in. New users can create an account or join an existing institution."
                    />
                    <Feature
                        icon="building"
                        title="Institution Setup"
                        description="Administrators configure sites, rotations, and scheduling rules in Settings."
                    />
                    <Feature
                        icon="sync"
                        title="Real-Time Sync"
                        description="All changes sync instantly across devices. The 'Live Sync' badge indicates active connection."
                    />
                    <Tip>
                        Start by setting up your Sites and Rotations in Settings, then add Attendings and Residents.
                    </Tip>
                </Section>

                <Section id="dashboard" title="Dashboard" icon="layout-dashboard">
                    <p className="text-medical-700 mb-4">
                        Your command center for scheduling operations and alerts.
                    </p>
                    <Feature
                        icon="bar-chart-3"
                        title="Stats Overview"
                        description="See total attendings, residents, and this week's assignments at a glance."
                    />
                    <Feature
                        icon="alert-triangle"
                        title="Conflict Alerts"
                        description="Immediate visibility into scheduling conflicts, vacation overlaps, and compliance issues."
                    />
                    <Feature
                        icon="zap"
                        title="Quick Actions"
                        description="Jump to common tasks like running the auto-scheduler or viewing upcoming assignments."
                    />
                </Section>

                <Section id="schedule" title="Schedule" icon="calendar">
                    <p className="text-medical-700 mb-4">
                        Visual calendar for viewing and managing all clinic assignments.
                    </p>
                    <Feature
                        icon="calendar-days"
                        title="Calendar View"
                        description="Week and month views with color-coded assignments by site or attending."
                    />
                    <Feature
                        icon="filter"
                        title="Filtering"
                        description="Filter by attending, resident, site, or date range to focus on specific schedules."
                    />
                    <Feature
                        icon="mouse-pointer-click"
                        title="Click to Assign"
                        description="Click any time slot to create or edit assignments. Drag to reschedule."
                    />
                    <Feature
                        icon="lock"
                        title="Locked Assignments"
                        description="Lock assignments to protect them from auto-scheduler changes."
                    />
                    <Tip>
                        Use the lock icon on any assignment to prevent the auto-scheduler from modifying it.
                    </Tip>
                </Section>

                <Section id="auto-scheduler" title="Auto-Scheduler" icon="wand-2">
                    <p className="text-medical-700 mb-4">
                        Intelligent algorithm that generates optimal clinic assignments automatically.
                    </p>
                    <Feature
                        icon="brain"
                        title="Smart Assignment"
                        description="Considers rotation compatibility, site preferences, fairness distribution, and conflicts."
                    />
                    <Feature
                        icon="shield-check"
                        title="Constraint Respect"
                        description="Honors vacation, half-days off, continuity clinic, and ACGME hour limits."
                    />
                    <Feature
                        icon="clock"
                        title="SST/ARE Fill"
                        description="Automatically assigns Self-Study Time (SST) or Additional Research Elective (ARE) to unfilled slots."
                    />
                    <Feature
                        icon="users"
                        title="Float Coverage"
                        description="Float rotation residents fill gaps when regular residents are on vacation."
                    />
                    <Feature
                        icon="eye"
                        title="Preview Mode"
                        description="Review proposed changes before applying. See additions, removals, and affected residents."
                    />
                    <Tip>
                        Run the auto-scheduler monthly after finalizing rotation assignments. Review the preview carefully before applying.
                    </Tip>
                </Section>

                <Section id="attendings" title="Attendings" icon="users">
                    <p className="text-medical-700 mb-4">
                        Manage attending physicians and their clinic schedules.
                    </p>
                    <Feature
                        icon="plus-circle"
                        title="Add Attendings"
                        description="Enter attending name and optional required rotation (for specialists like surgeons)."
                    />
                    <Feature
                        icon="calendar-plus"
                        title="Clinic Sessions"
                        description="Define recurring clinic sessions with site, day, time slot, and resident capacity."
                    />
                    <Feature
                        icon="tag"
                        title="Required Rotation"
                        description="Surgeons and pediatric dermatologists can require residents on specific rotations."
                    />
                </Section>

                <Section id="residents" title="Residents" icon="user-check">
                    <p className="text-medical-700 mb-4">
                        Track residents, their rotations, and availability.
                    </p>
                    <Feature
                        icon="graduation-cap"
                        title="PGY Level"
                        description="Track training year (PGY-2, PGY-3, PGY-4) for appropriate assignments."
                    />
                    <Feature
                        icon="calendar-off"
                        title="Vacation Weeks"
                        description="Mark vacation weeks to exclude residents from scheduling during those periods."
                    />
                    <Feature
                        icon="sun"
                        title="Half Days Off"
                        description="Configure specific half-days off for each resident."
                    />
                    <Feature
                        icon="flask"
                        title="ARE Eligibility"
                        description="Mark residents eligible for Additional Research Elective time for protected research blocks."
                    />
                    <Feature
                        icon="repeat"
                        title="Rotation Assignments"
                        description="Assign residents to monthly rotations to control which clinics they can work."
                    />
                </Section>

                <Section id="rotations" title="Rotations" icon="rotate-cw">
                    <p className="text-medical-700 mb-4">
                        Configure rotation types and their scheduling rules.
                    </p>
                    <Feature
                        icon="check-square"
                        title="Requires Clinics"
                        description="Rotations where residents must staff clinics (e.g., general derm rotations)."
                    />
                    <Feature
                        icon="phone"
                        title="Consult Service"
                        description="Consult rotations exclude residents from external clinic assignments."
                    />
                    <Feature
                        icon="shuffle"
                        title="Float Rotation"
                        description="Float residents provide coverage for vacationing residents."
                    />
                    <Feature
                        icon="clock"
                        title="Allows SST"
                        description="Rotations where unfilled slots can receive Self-Study Time."
                    />
                    <Feature
                        icon="flask"
                        title="Allows ARE"
                        description="Rotations where eligible residents can receive Additional Research Elective time."
                    />
                </Section>

                <Section id="rules" title="Rules" icon="shield-check">
                    <p className="text-medical-700 mb-4">
                        Define scheduling constraints and compliance rules.
                    </p>
                    <Feature
                        icon="clock"
                        title="ACGME Limits"
                        description="Configure weekly hour limits and duty hour restrictions for compliance."
                    />
                    <Feature
                        icon="alert-circle"
                        title="Conflict Detection"
                        description="Automatic detection of scheduling conflicts, overlaps, and violations."
                    />
                </Section>

                <Section id="chat-assistant" title="Chat Assistant" icon="bot">
                    <p className="text-medical-700 mb-4">
                        AI-powered assistant for natural language scheduling queries.
                    </p>
                    <Feature
                        icon="message-circle"
                        title="Ask Questions"
                        description="Ask about schedules, conflicts, or availability in plain English."
                    />
                    <Feature
                        icon="search"
                        title="Quick Lookups"
                        description="'Who is working with Dr. Smith next week?' or 'When is Ramie on vacation?'"
                    />
                    <Tip>
                        Click the chat bubble in the bottom-right corner to open the assistant anytime.
                    </Tip>
                </Section>

                <Section id="settings" title="Settings" icon="settings">
                    <p className="text-medical-700 mb-4">
                        Institution configuration and administration.
                    </p>
                    <Feature
                        icon="building"
                        title="Sites"
                        description="Define clinic locations with names and color coding."
                    />
                    <Feature
                        icon="rotate-cw"
                        title="Rotations"
                        description="Configure rotation types and their scheduling properties."
                    />
                    <Feature
                        icon="users"
                        title="Team Management"
                        description="Invite users and manage roles (Admin, Scheduler, Viewer)."
                    />
                </Section>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center py-8 text-medical-500 text-sm"
            >
                <p>Clinic Scheduler Pro • Built for residency programs</p>
            </motion.div>
        </div>
    );
};

export default AboutPage;
