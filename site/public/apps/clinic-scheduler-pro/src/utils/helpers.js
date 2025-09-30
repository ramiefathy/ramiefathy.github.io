/**
 * Helper utilities for clinic scheduler
 * ID generation, data normalization, and transformations
 */

import { TIME_SLOTS } from './constants';

// Days of the week with IDs and display names
export const DAYS_OF_WEEK = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
];

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique identifier
 */
export const generateId = (prefix = 'id') =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Convert legacy clinic schedule format to modern format
 * @param {Array} legacySchedule - Old format schedule array
 * @param {Array} sites - Sites for name lookup
 * @returns {Array} Normalized clinics array
 */
export const convertLegacyClinicSchedule = (legacySchedule = [], sites = []) => {
    if (!Array.isArray(legacySchedule) || legacySchedule.length === 0) {
        return [];
    }

    const siteLookup = new Map(sites.map(site => [site.id, site]));
    const clinicsMap = new Map();

    legacySchedule.forEach((session = {}) => {
        const dayOfWeek = typeof session.dayOfWeek === 'number' ? session.dayOfWeek : null;
        const timeSlot = session.timeSlot || 'AM';
        const siteId = session.siteId || '';

        const fallbackId = `legacy_${siteId || 'none'}_${dayOfWeek}_${timeSlot}`;
        const clinicId = session.clinicId || session.id || fallbackId;

        if (!clinicsMap.has(clinicId)) {
            const site = siteLookup.get(siteId);
            const dayLabel = (dayOfWeek != null ? DAYS_OF_WEEK.find(d => d.id === dayOfWeek)?.short : 'Day');
            clinicsMap.set(clinicId, {
                id: clinicId,
                siteId,
                name: session.clinicName || `${site?.name || 'Clinic'} ${dayLabel || ''} ${timeSlot}`.trim(),
                residentCapacity: session.maxResidents || session.capacity || 2,
                defaultSessions: []
            });
        }

        const clinic = clinicsMap.get(clinicId);
        clinic.defaultSessions.push({
            dayOfWeek: dayOfWeek ?? 0,
            timeSlot
        });

        if (session.maxResidents || session.capacity) {
            clinic.residentCapacity = session.maxResidents || session.capacity;
        }
    });

    return Array.from(clinicsMap.values());
};

/**
 * Normalize clinics array to ensure consistent structure
 * @param {Array} clinics - Raw clinics data
 * @returns {Array} Normalized clinics array
 */
export const normalizeClinics = (clinics = []) => {
    if (!Array.isArray(clinics)) return [];
    return clinics
        .filter(Boolean)
        .map((clinic) => ({
            id: clinic.id || generateId('clinic'),
            name: clinic.name || 'Clinic',
            siteId: clinic.siteId || '',
            residentCapacity: Number.isFinite(clinic.residentCapacity)
                ? clinic.residentCapacity
                : (clinic.capacity || clinic.maxResidents || 2),
            defaultSessions: Array.isArray(clinic.defaultSessions)
                ? clinic.defaultSessions
                    .filter(session => typeof session?.dayOfWeek === 'number' && TIME_SLOTS.includes(session?.timeSlot || ''))
                    .map(session => ({ dayOfWeek: session.dayOfWeek, timeSlot: session.timeSlot || 'AM' }))
                : []
        }));
};

/**
 * Normalize attending record with clinic data
 * @param {Object} attending - Raw attending data
 * @param {Array} sites - Sites for legacy conversion
 * @returns {Object} Normalized attending record
 */
export const normalizeAttendingRecord = (attending = {}, sites = []) => {
    if (!attending) return attending;
    const clinics = normalizeClinics(attending.clinics);

    const normalizedClinics = clinics.length > 0
        ? clinics
        : convertLegacyClinicSchedule(attending.clinicSchedule, sites);

    return {
        ...attending,
        clinics: normalizeClinics(normalizedClinics),
        scheduleOverrides: Array.isArray(attending.scheduleOverrides) ? attending.scheduleOverrides : []
    };
};

export default {
    DAYS_OF_WEEK,
    generateId,
    convertLegacyClinicSchedule,
    normalizeClinics,
    normalizeAttendingRecord
};
