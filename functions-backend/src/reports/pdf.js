/**
 * PDF Report Generation
 * Functions for generating schedule reports as PDF documents
 */

const PDFDocument = require('pdfkit');
const { describeAssignmentType } = require('../utils/user');

/**
 * Group assignments by date
 * @param {Array} assignments - Array of assignment documents
 * @returns {Object} Assignments grouped by date
 */
function groupAssignmentsByDate(assignments) {
  const grouped = {};
  assignments.forEach(assignment => {
    const dateKey = assignment.date;
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(assignment);
  });
  return grouped;
}

/**
 * Calculate assignment statistics
 * @param {Array} assignments - Array of assignment documents
 * @returns {Object} Statistics summary
 */
function calculateStatistics(assignments) {
  const totalAssignments = assignments.length;
  const uniqueResidents = new Set(assignments.map(a => a.residentId)).size;
  const uniqueAttendings = new Set(assignments.map(a => a.attendingId).filter(id => id)).size;
  const uniqueSites = new Set(assignments.map(a => a.siteId).filter(id => id)).size;

  let clinicalCount = 0;
  let continuityCount = 0;
  let protectedCount = 0;

  assignments.forEach(assignment => {
    const type = assignment.type;
    if (type === 'continuity') continuityCount++;
    else if (type === 'protected') protectedCount++;
    else clinicalCount++;
  });

  return {
    totalAssignments,
    uniqueResidents,
    uniqueAttendings,
    uniqueSites,
    clinicalCount,
    continuityCount,
    protectedCount
  };
}

/**
 * Add header section to PDF
 * @param {PDFDocument} doc - PDF document
 * @param {Object} params - Header parameters
 */
function addPDFHeader(doc, params) {
  const { institutionName, startDate, endDate, residentName, residentPGY } = params;

  doc.fontSize(20).text(institutionName, { align: 'center' });
  doc.fontSize(16).text('Schedule Report', { align: 'center' });
  doc.fontSize(12).text(`${startDate} to ${endDate}`, { align: 'center' });
  doc.moveDown();

  if (residentName) {
    const residentInfo = `Resident: ${residentName}${residentPGY ? ` (${residentPGY})` : ''}`;
    doc.fontSize(14).text(residentInfo, { align: 'center' });
    doc.moveDown();
  }
}

/**
 * Add assignments section to PDF
 * @param {PDFDocument} doc - PDF document
 * @param {Object} params - Assignment parameters
 */
function addPDFAssignments(doc, params) {
  const { assignmentsByDate, residents, attendings, sites, rotations } = params;

  Object.keys(assignmentsByDate).sort().forEach(date => {
    doc.fontSize(14).text(date, { underline: true });
    doc.moveDown(0.5);

    assignmentsByDate[date].forEach(assignment => {
      const resident = residents[assignment.residentId];
      const attending = assignment.attendingId ? attendings[assignment.attendingId] : null;
      const site = sites.find(s => s.id === assignment.siteId);
      const rotation = rotations.find(r => r.id === assignment.rotationId);

      const assignmentType = describeAssignmentType(assignment.type, { variant: 'short' });

      let text = `${assignment.timeSlot}: ${resident?.name || 'Unknown'}`;
      if (attending) {
        text += ` with ${attending.name}`;
      }
      text += ` at ${site?.name || 'Clinic'}`;
      text += ` (${assignmentType})`;
      if (rotation) {
        text += ` - ${rotation.name}`;
      }

      doc.fontSize(10).text(text, { indent: 20 });
    });

    doc.moveDown();
  });
}

/**
 * Add statistics section to PDF
 * @param {PDFDocument} doc - PDF document
 * @param {Object} stats - Statistics object
 */
function addPDFStatistics(doc, stats) {
  doc.addPage();
  doc.fontSize(16).text('Statistics', { underline: true });
  doc.moveDown();

  doc.fontSize(12)
    .text(`Total Assignments: ${stats.totalAssignments}`)
    .text(`Clinical: ${stats.clinicalCount}`)
    .text(`Continuity Clinics: ${stats.continuityCount}`)
    .text(`Protected Time: ${stats.protectedCount}`)
    .text(`Unique Residents: ${stats.uniqueResidents}`)
    .text(`Unique Attendings: ${stats.uniqueAttendings}`)
    .text(`Sites Used: ${stats.uniqueSites}`);
}

/**
 * Generate schedule PDF report
 * @param {Object} params - Report parameters
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateSchedulePDF(params) {
  const {
    institutionName,
    startDate,
    endDate,
    assignments,
    residents,
    attendings,
    sites,
    rotations,
    residentId
  } = params;

  // Create lookup maps for residents and attendings
  const residentMap = {};
  const attendingMap = {};

  residents.forEach(r => {
    residentMap[r.id] = r;
  });

  attendings.forEach(a => {
    attendingMap[a.id] = a;
  });

  // Group assignments by date
  const assignmentsByDate = groupAssignmentsByDate(assignments);

  // Calculate statistics
  const stats = calculateStatistics(assignments);

  // Create PDF document
  const doc = new PDFDocument();
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  // Add header
  const residentInfo = residentId && residentMap[residentId]
    ? {
      residentName: residentMap[residentId].name,
      residentPGY: residentMap[residentId].pgyStatus
    }
    : {};

  addPDFHeader(doc, {
    institutionName,
    startDate,
    endDate,
    ...residentInfo
  });

  // Add assignments
  addPDFAssignments(doc, {
    assignmentsByDate,
    residents: residentMap,
    attendings: attendingMap,
    sites,
    rotations
  });

  // Add statistics
  addPDFStatistics(doc, stats);

  // Finalize PDF
  doc.end();

  // Wait for PDF generation to complete
  await new Promise(resolve => doc.on('end', resolve));

  // Return PDF buffer
  return Buffer.concat(chunks);
}

module.exports = {
  generateSchedulePDF,
  groupAssignmentsByDate,
  calculateStatistics,
  addPDFHeader,
  addPDFAssignments,
  addPDFStatistics
};