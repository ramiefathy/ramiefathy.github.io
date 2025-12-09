/**
 * Dashboard - Overview statistics and quick actions
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card } from '../shared';

// Date functions
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

const Dashboard = () => {
    const { attendings, residents, assignments, rules, institution, firebaseService } = useApp();

    const stats = useMemo(() => {
        const totalAssignments = Object.values(assignments).flat().length;
        const thisWeek = Object.entries(assignments)
            .filter(([key]) => {
                const [date] = key.split('_');
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
                const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
                const assignmentDate = parseISO(date);
                return assignmentDate >= weekStart && assignmentDate <= weekEnd;
            })
            .reduce((sum, [, items]) => sum + items.length, 0);

        return [
            { label: 'Total Attendings', value: attendings.length, icon: 'users', color: 'blue' },
            { label: 'Total Residents', value: residents.length, icon: 'user-check', color: 'green' },
            { label: 'This Week', value: thisWeek, icon: 'calendar', color: 'purple' },
            { label: 'Active Rules', value: rules.filter(r => r.isActive).length, icon: 'shield-check', color: 'amber' }
        ];
    }, [attendings, residents, assignments, rules]);

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            amber: 'bg-amber-100 text-amber-600'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6 fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-medical-900">Dashboard</h2>
                    <p className="text-medical-700">Real-time overview of coverage, demand, and activity</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={async () => {
                            try {
                                const calculateAnalytics = window.firebase.functions.httpsCallable('calculateAnalytics');
                                const startDate = new Date();
                                startDate.setMonth(startDate.getMonth() - 1);
                                const result = await calculateAnalytics({
                                    institutionId: firebaseService.currentInstitution,
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0]
                                });
                                console.log('Analytics:', result.data);
                                toast.success('Analytics calculated - check console');
                            } catch (error) {
                                toast.error('Failed to calculate analytics');
                            }
                        }}
                    >
                        <Icon name="bar-chart" size={16} className="mr-2" />
                        Analytics
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={async () => {
                            try {
                                const generatePDF = window.firebase.functions.httpsCallable('generateSchedulePDF');
                                const startDate = new Date();
                                const endDate = new Date();
                                endDate.setDate(endDate.getDate() + 30);
                                const result = await generatePDF({
                                    institutionId: firebaseService.currentInstitution,
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: endDate.toISOString().split('T')[0]
                                });
                                // Download the PDF
                                const binaryPdf = atob(result.data.pdf);
                                const byteArray = new Uint8Array(binaryPdf.length);
                                for (let i = 0; i < binaryPdf.length; i++) {
                                    byteArray[i] = binaryPdf.charCodeAt(i);
                                }
                                const blob = new Blob([byteArray], { type: 'application/pdf' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.data.filename;
                                a.click();
                                toast.success('PDF generated and downloaded');
                            } catch (error) {
                                toast.error('Failed to generate PDF');
                            }
                        }}
                    >
                        <Icon name="download" size={16} className="mr-2" />
                        Export PDF
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-medical-100 rounded-lg">
                        <div className="w-2 h-2 bg-medical-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-medical-700 font-medium">Live Sync</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Card hover className="glass-card overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 via-white to-medical-50 opacity-80 pointer-events-none" />
                            <div className="absolute -right-10 -top-10 w-24 h-24 bg-medical-200 rounded-full blur-3xl opacity-40" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-medical-700">{stat.label}</p>
                                    <p className="text-3xl font-bold text-medical-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl shadow-glass ${getColorClasses(stat.color)}`}>
                                    <Icon name={stat.icon} size={22} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
