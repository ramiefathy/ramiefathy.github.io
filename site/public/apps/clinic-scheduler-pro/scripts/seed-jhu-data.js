/**
 * JHU Dermatology Seed Data Script
 * Run this in the browser console after logging in to populate Firebase
 * 
 * Usage: Copy/paste this script into browser console at http://localhost:5174
 */

// Wait for Firebase service to be ready
const seedJHUData = async () => {
    const { firebaseService } = window.__APP__ || {};
    if (!firebaseService) {
        console.error('Firebase service not available. Make sure you are logged in.');
        return;
    }

    console.log('🏥 Starting JHU Dermatology data seed...');

    // === SITES ===
    const sites = [
        { id: 'site-gss', name: 'Green Spring Station', code: 'GSS', color: '#4F46E5' },
        { id: 'site-jhoc', name: 'Johns Hopkins Outpatient Center', code: 'JHOC', color: '#059669' },
        { id: 'site-hoco', name: 'Howard County (MPHC)', code: 'HoCo', color: '#D97706' },
        { id: 'site-sibley', name: 'Sibley Memorial', code: 'SMB', color: '#7C3AED' },
        { id: 'site-peds', name: 'Pediatric Dermatology (JHDMR)', code: 'PEDS', color: '#EC4899' }
    ];

    // === ROTATIONS ===
    const rotations = [
        {
            id: 'rot-gss', name: 'GSS General Derm', code: 'GSS',
            siteIds: ['site-gss'], isMultiSite: false,
            allowsSST: true, allowsARE: true, requiresClinics: true, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-jhoc', name: 'JHOC General Derm', code: 'JHOC',
            siteIds: ['site-jhoc'], isMultiSite: false,
            allowsSST: true, allowsARE: true, requiresClinics: true, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-hoco', name: 'HoCo General Derm', code: 'HoCo',
            siteIds: ['site-hoco'], isMultiSite: false,
            allowsSST: true, allowsARE: true, requiresClinics: true, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-sibley', name: 'Sibley General Derm', code: 'SMB',
            siteIds: ['site-sibley'], isMultiSite: false,
            allowsSST: true, allowsARE: true, requiresClinics: true, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-surgery', name: 'Surgery (MDE/Mohs)', code: 'SURG',
            siteIds: ['site-gss', 'site-jhoc', 'site-hoco'], isMultiSite: true,
            allowsSST: false, allowsARE: false, requiresClinics: true, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-peds', name: 'Pediatrics', code: 'PEDS',
            siteIds: ['site-peds'], isMultiSite: false,
            allowsSST: true, allowsARE: false, requiresClinics: true, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-jhh-consults', name: 'JHH Consults', code: 'CC-JHH',
            siteIds: [], isMultiSite: false,
            allowsSST: false, allowsARE: false, requiresClinics: false, isConsultService: true, isFloat: false
        },
        {
            id: 'rot-bv-consults', name: 'BV/Peds Consults', code: 'CC-BV',
            siteIds: [], isMultiSite: false,
            allowsSST: false, allowsARE: false, requiresClinics: false, isConsultService: true, isFloat: false
        },
        {
            id: 'rot-path', name: 'Dermatopathology', code: 'PATH',
            siteIds: [], isMultiSite: false,
            allowsSST: true, allowsARE: true, requiresClinics: false, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-elective', name: 'Elective', code: 'ELEC',
            siteIds: [], isMultiSite: false,
            allowsSST: false, allowsARE: true, requiresClinics: false, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-vacation', name: 'Vacation', code: 'VAC',
            siteIds: [], isMultiSite: false,
            allowsSST: false, allowsARE: false, requiresClinics: false, isConsultService: false, isFloat: false
        },
        {
            id: 'rot-float', name: 'Float', code: 'FLT',
            siteIds: ['site-gss', 'site-jhoc', 'site-hoco', 'site-sibley'], isMultiSite: true,
            allowsSST: false, allowsARE: false, requiresClinics: true, isConsultService: false, isFloat: true
        }
    ];

    // === ATTENDINGS ===
    // Helper to create default sessions array
    const sessions = (schedule) => {
        const result = [];
        const dayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5 };
        schedule.forEach(s => {
            const [day, slot] = s.split(' ');
            result.push({ dayOfWeek: dayMap[day], timeSlot: slot });
        });
        return result;
    };

    const attendings = [
        // === SURGEONS (require Surgery rotation) ===
        {
            id: 'att-lewis', name: 'Lewis', requiredRotationId: 'rot-surgery',
            clinics: [
                { id: 'cli-lewis-gss', name: 'Lewis MDE/Mohs', siteId: 'site-gss', residentCapacity: 1, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM']) }
            ]
        },
        {
            id: 'att-samaan', name: 'Samaan', requiredRotationId: 'rot-surgery',
            clinics: [
                { id: 'cli-samaan-gss', name: 'Samaan MDE/Mohs', siteId: 'site-gss', residentCapacity: 1, defaultSessions: sessions(['Wed AM', 'Wed PM', 'Thu AM', 'Thu PM']) }
            ]
        },
        {
            id: 'att-ng', name: 'Ng', requiredRotationId: 'rot-surgery',
            clinics: [
                { id: 'cli-ng-jhoc', name: 'Ng MDE/Mohs', siteId: 'site-jhoc', residentCapacity: 1, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue AM']) }
            ]
        },

        // === PEDIATRICS (require Peds rotation) ===
        {
            id: 'att-grossberg', name: 'Grossberg', requiredRotationId: 'rot-peds',
            clinics: [
                { id: 'cli-grossberg-peds', name: 'Grossberg Peds Derm', siteId: 'site-peds', residentCapacity: 1, defaultSessions: sessions(['Mon AM', 'Mon PM']) }
            ]
        },

        // === GSS ATTENDINGS ===
        {
            id: 'att-anhalt', name: 'Anhalt',
            clinics: [
                { id: 'cli-anhalt-gss', name: 'Anhalt GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM']) },
                { id: 'cli-anhalt-jhoc', name: 'Anhalt JHOC', siteId: 'site-jhoc', residentCapacity: 2, defaultSessions: sessions(['Tue PM', 'Thu PM']) }
            ]
        },
        {
            id: 'att-gerstenblith', name: 'Gerstenblith',
            clinics: [
                { id: 'cli-gerstenblith-gss', name: 'Gerstenblith GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Wed AM', 'Wed PM', 'Fri AM']) }
            ]
        },
        {
            id: 'att-gonzalez', name: 'Gonzalez',
            clinics: [
                { id: 'cli-gonzalez-gss', name: 'Gonzalez GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue PM', 'Wed AM']) }
            ]
        },
        {
            id: 'att-hsu', name: 'Hsu',
            clinics: [
                { id: 'cli-hsu-gss', name: 'Hsu GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Thu AM', 'Thu PM']) }
            ]
        },
        {
            id: 'att-johnson', name: 'Johnson',
            clinics: [
                { id: 'cli-johnson-gss', name: 'Johnson GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Wed AM', 'Thu PM']) }
            ]
        },
        {
            id: 'att-powers', name: 'Powers',
            clinics: [
                { id: 'cli-powers-gss', name: 'Powers GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue PM']) }
            ]
        },
        {
            id: 'att-succaria', name: 'Succaria',
            clinics: [
                { id: 'cli-succaria-gss', name: 'Succaria GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Thu PM']) },
                { id: 'cli-succaria-hoco', name: 'Succaria HoCo', siteId: 'site-hoco', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM']) }
            ]
        },
        {
            id: 'att-sunshine', name: 'Sunshine',
            clinics: [
                { id: 'cli-sunshine-gss', name: 'Sunshine GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Tue PM']) }
            ]
        },
        {
            id: 'att-sweren', name: 'Sweren',
            clinics: [
                { id: 'cli-sweren-gss', name: 'Sweren GSS', siteId: 'site-gss', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed AM', 'Wed PM', 'Thu AM', 'Thu PM']) }
            ]
        },

        // === JHOC ATTENDINGS ===
        {
            id: 'att-alhariri', name: 'Alhariri',
            clinics: [
                { id: 'cli-alhariri-jhoc', name: 'Alhariri JHOC', siteId: 'site-jhoc', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed PM', 'Thu AM', 'Thu PM']) }
            ]
        },
        {
            id: 'att-garza', name: 'Garza',
            clinics: [
                { id: 'cli-garza-jhoc', name: 'Garza JHOC', siteId: 'site-jhoc', residentCapacity: 2, defaultSessions: sessions(['Mon AM']) }
            ]
        },
        {
            id: 'att-kang', name: 'Kang',
            clinics: [
                { id: 'cli-kang-jhoc', name: 'Kang JHOC', siteId: 'site-jhoc', residentCapacity: 2, defaultSessions: sessions(['Tue AM', 'Thu AM']) }
            ]
        },
        {
            id: 'att-rozati', name: 'Rozati',
            clinics: [
                { id: 'cli-rozati-jhoc', name: 'Rozati JHOC', siteId: 'site-jhoc', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Tue AM', 'Thu AM']) }
            ]
        },
        {
            id: 'att-synkowski', name: 'Synkowski',
            clinics: [
                { id: 'cli-synkowski-jhoc', name: 'Synkowski JHOC', siteId: 'site-jhoc', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Fri PM']) }
            ]
        },

        // === HoCo ATTENDINGS ===
        {
            id: 'att-aguh', name: 'Aguh',
            clinics: [
                { id: 'cli-aguh-hoco', name: 'Aguh HoCo', siteId: 'site-hoco', residentCapacity: 2, defaultSessions: sessions(['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM']) }
            ]
        },
        {
            id: 'att-chien', name: 'Chien',
            clinics: [
                { id: 'cli-chien-hoco', name: 'Chien HoCo', siteId: 'site-hoco', residentCapacity: 2, defaultSessions: sessions(['Wed PM', 'Thu AM', 'Thu PM']) }
            ]
        },
        {
            id: 'att-harvey', name: 'Harvey',
            clinics: [
                { id: 'cli-harvey-hoco', name: 'Harvey HoCo', siteId: 'site-hoco', residentCapacity: 2, defaultSessions: sessions(['Tue AM', 'Tue PM', 'Wed PM']) }
            ]
        },
        {
            id: 'att-wan', name: 'Wan',
            clinics: [
                { id: 'cli-wan-hoco', name: 'Wan HoCo', siteId: 'site-hoco', residentCapacity: 2, defaultSessions: sessions(['Thu AM']) }
            ]
        }
    ];

    // === RESIDENTS ===
    const residents = [
        // PGY-4 (3rd year Derm)
        { id: 'res-autumn', name: 'Autumn', pgyStatus: 'PGY-4', areEligible: true, areActive: false },
        { id: 'res-priyanka', name: 'Priyanka', pgyStatus: 'PGY-4', areEligible: true, areActive: false },
        { id: 'res-justin', name: 'Justin', pgyStatus: 'PGY-4', areEligible: true, areActive: false },
        { id: 'res-jaci', name: 'Jaci', pgyStatus: 'PGY-4', areEligible: true, areActive: false },
        { id: 'res-ramie', name: 'Ramie', pgyStatus: 'PGY-4', areEligible: true, areActive: false },
        { id: 'res-andrew', name: 'Andrew', pgyStatus: 'PGY-4', areEligible: true, areActive: true }, // 2+2 research
        { id: 'res-sophie', name: 'Sophie', pgyStatus: 'PGY-4', areEligible: true, areActive: false },
        { id: 'res-austin', name: 'Austin', pgyStatus: 'PGY-4', areEligible: true, areActive: false },

        // PGY-3 (2nd year Derm)
        { id: 'res-david', name: 'David', pgyStatus: 'PGY-3', areEligible: true, areActive: false },
        { id: 'res-jerry', name: 'Jerry', pgyStatus: 'PGY-3', areEligible: true, areActive: false },
        { id: 'res-breanna', name: 'Breanna', pgyStatus: 'PGY-3', areEligible: true, areActive: false },
        { id: 'res-srona', name: 'Srona', pgyStatus: 'PGY-3', areEligible: true, areActive: false },
        { id: 'res-sai', name: 'Sai', pgyStatus: 'PGY-3', areEligible: true, areActive: false },
        { id: 'res-varsha', name: 'Varsha', pgyStatus: 'PGY-3', areEligible: true, areActive: false },
        { id: 'res-suzanne', name: 'Suzanne', pgyStatus: 'PGY-3', areEligible: true, areActive: false },

        // PGY-2 (1st year Derm)
        { id: 'res-megan', name: 'Megan', pgyStatus: 'PGY-2', areEligible: false, areActive: false },
        { id: 'res-phuong', name: 'Phuong', pgyStatus: 'PGY-2', areEligible: false, areActive: false },
        { id: 'res-cat', name: 'Cat', pgyStatus: 'PGY-2', areEligible: false, areActive: false },
        { id: 'res-libby', name: 'Libby', pgyStatus: 'PGY-2', areEligible: false, areActive: false },
        { id: 'res-jonathan', name: 'Jonathan', pgyStatus: 'PGY-2', areEligible: false, areActive: false },
        { id: 'res-olivia', name: 'Olivia', pgyStatus: 'PGY-2', areEligible: false, areActive: false }
    ];

    // === UPDATE INSTITUTION SETTINGS ===
    console.log('📍 Updating sites and rotations...');
    try {
        await firebaseService.updateInstitutionSettings({
            sites,
            rotations
        });
        console.log('✅ Sites and rotations updated');
    } catch (err) {
        console.error('❌ Failed to update settings:', err);
    }

    // === ADD ATTENDINGS ===
    console.log('👨‍⚕️ Adding attendings...');
    for (const attending of attendings) {
        try {
            // Check if exists first
            await firebaseService.addAttending(attending);
            console.log(`  ✅ ${attending.name}`);
        } catch (err) {
            console.log(`  ⚠️ ${attending.name}: ${err.message}`);
        }
    }

    // === ADD RESIDENTS ===
    console.log('👩‍⚕️ Adding residents...');
    for (const resident of residents) {
        try {
            await firebaseService.addResident(resident);
            console.log(`  ✅ ${resident.name}`);
        } catch (err) {
            console.log(`  ⚠️ ${resident.name}: ${err.message}`);
        }
    }

    console.log('🎉 JHU Dermatology data seed complete!');
    console.log(`   Sites: ${sites.length}`);
    console.log(`   Rotations: ${rotations.length}`);
    console.log(`   Attendings: ${attendings.length}`);
    console.log(`   Residents: ${residents.length}`);
};

// Run the seed
seedJHUData();
