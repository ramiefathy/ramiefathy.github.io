const { startOfWeek, format, parseISO } = require('date-fns');

const TIME_SLOTS = ['AM', 'PM'];

const legacyClinicKey = (session = {}) => {
  const siteId = session.siteId || 'site';
  const day = typeof session.dayOfWeek === 'number' ? session.dayOfWeek : 0;
  const timeSlot = session.timeSlot || 'AM';
  return `legacy_${siteId}_${day}_${timeSlot}`;
};

const convertLegacyClinicSchedule = (legacySchedule = []) => {
  const clinicsMap = new Map();
  legacySchedule.forEach(session => {
    const key = session.clinicId || legacyClinicKey(session);
    if (!clinicsMap.has(key)) {
      clinicsMap.set(key, {
        id: key,
        name: session.clinicName || 'Clinic',
        siteId: session.siteId || '',
        residentCapacity: session.maxResidents || session.capacity || 0,
        defaultSessions: []
      });
    }
    const clinic = clinicsMap.get(key);
    clinic.defaultSessions.push({
      dayOfWeek: typeof session.dayOfWeek === 'number' ? session.dayOfWeek : 0,
      timeSlot: session.timeSlot || 'AM'
    });
    if (session.maxResidents || session.capacity) {
      clinic.residentCapacity = session.maxResidents || session.capacity;
    }
  });
  return Array.from(clinicsMap.values());
};

const normalizeClinics = (clinics = []) => {
  if (!Array.isArray(clinics)) return [];
  return clinics.filter(Boolean).map(clinic => ({
    id: clinic.id || legacyClinicKey(clinic),
    name: clinic.name || 'Clinic',
    siteId: clinic.siteId || '',
    residentCapacity: Number.isFinite(clinic.residentCapacity)
      ? clinic.residentCapacity
      : (clinic.capacity || clinic.maxResidents || 0),
    defaultSessions: Array.isArray(clinic.defaultSessions)
      ? clinic.defaultSessions.map(session => ({
          dayOfWeek: session.dayOfWeek,
          timeSlot: session.timeSlot
        }))
      : []
  }));
};

const normalizeAttending = (attendingDoc = {}, sites = []) => {
  const normalizedClinics = normalizeClinics(
    attendingDoc.clinics && attendingDoc.clinics.length
      ? attendingDoc.clinics
      : convertLegacyClinicSchedule(attendingDoc.clinicSchedule || [])
  );
  return {
    ...attendingDoc,
    clinics: normalizedClinics,
    scheduleOverrides: Array.isArray(attendingDoc.scheduleOverrides)
      ? attendingDoc.scheduleOverrides
      : []
  };
};

const makeSlotKey = ({ date, timeSlot, attendingId, clinicId }) =>
  `${date}|${timeSlot}|${attendingId || 'none'}|${clinicId || 'noClinic'}`;

const makeGenericSlotKey = ({ date, timeSlot, attendingId }) =>
  `${date}|${timeSlot}|${attendingId || 'none'}`;

const buildSlotsForMoment = (attending, dateStr, dayOfWeek, timeSlot) => {
  const slots = [];
  if (!attending) return slots;
  const overrides = Array.isArray(attending.scheduleOverrides) ? attending.scheduleOverrides : [];
  const cancelSet = new Set(
    overrides.filter(override => override.date === dateStr && override.timeSlot === timeSlot && override.action === 'cancel')
      .map(override => override.clinicId)
  );

  const additions = new Map();
  overrides
    .filter(override => override.date === dateStr && override.timeSlot === timeSlot && override.action === 'add')
    .forEach(override => {
      const key = override.clinicId || `override_${override.id}`;
      if (!additions.has(key)) {
        additions.set(key, { override, capacity: 0 });
      }
      additions.get(key).capacity += override.residentCapacity || 0;
    });

  (attending.clinics || []).forEach(clinic => {
    const hasDefault = clinic.defaultSessions?.some(session => session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot);
    const added = additions.get(clinic.id);
    if (!hasDefault) {
      if (added && added.capacity > 0) {
        slots.push({
          key: makeSlotKey({ date: dateStr, timeSlot, attendingId: attending.id, clinicId: `${clinic.id}_${dateStr}_${timeSlot}` }),
          assignmentClinicId: clinic.id,
          attendingId: attending.id,
          clinicId: clinic.id,
          siteId: added.override.siteId || clinic.siteId || '',
          date: dateStr,
          timeSlot,
          capacity: added.capacity,
          overrideType: 'add',
          clinicName: clinic.name || added.override.label || 'Clinic'
        });
      }
      additions.delete(clinic.id);
      return;
    }
    if (cancelSet.has(clinic.id)) {
      additions.delete(clinic.id);
      return;
    }
    let capacity = Number.isFinite(clinic.residentCapacity) ? clinic.residentCapacity : 0;
    if (added && added.capacity > 0) {
      capacity += added.capacity;
      additions.delete(clinic.id);
    }
    if (capacity > 0) {
      slots.push({
        key: makeSlotKey({ date: dateStr, timeSlot, attendingId: attending.id, clinicId: clinic.id }),
        assignmentClinicId: clinic.id,
        attendingId: attending.id,
        clinicId: clinic.id,
        siteId: clinic.siteId || '',
        date: dateStr,
        timeSlot,
        capacity,
        overrideType: 'default',
        clinicName: clinic.name || 'Clinic'
      });
    }
  });

  additions.forEach(({ override, capacity }, key) => {
    if (capacity <= 0) return;
    slots.push({
      key: makeSlotKey({ date: dateStr, timeSlot, attendingId: attending.id, clinicId: key }),
      assignmentClinicId: override.clinicId,
      attendingId: attending.id,
      clinicId: override.clinicId || key,
      siteId: override.siteId || '',
      date: dateStr,
      timeSlot,
      capacity,
      overrideType: 'add',
      clinicName: override.label || 'Clinic'
    });
  });

  return slots;
};

const getWeekKey = (dateStr) => {
  const start = startOfWeek(parseISO(dateStr), { weekStartsOn: 0 });
  return format(start, 'yyyy-MM-dd');
};

module.exports = {
  TIME_SLOTS,
  legacyClinicKey,
  normalizeClinics,
  convertLegacyClinicSchedule,
  normalizeAttending,
  makeSlotKey,
  makeGenericSlotKey,
  buildSlotsForMoment,
  getWeekKey
};
