// Dermatopathology Data Deduplication Script

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Merging configuration - Updated to preserve clinical distinctions
// Note: Interface dermatitis patterns and vesiculobullous findings are kept separate per clinical requirements
const mergingMap = {
  "Spongiosis": {
    primaryName: "Spongiosis",
    mergeFrom: ["Spongiosis (Ko)", "Spongiosis (Jackson)"],
    category: "Epidermal Changes",
    alternativeNames: ["Intercellular edema", "Epidermal spongiosis"],
    preserveSources: true
  },
  "Acantholysis": {
    primaryName: "Acantholysis",
    mergeFrom: ["Acantholysis (Ko)", "Acantholysis (Jackson)", "Acantholysis (Rapini)"],
    category: "Epidermal Changes",
    alternativeNames: ["Loss of intercellular connections", "Intraepidermal clefting"],
    preserveSources: true
  },
  "Pseudoepitheliomatous Hyperplasia (PEH)": {
    primaryName: "Pseudoepitheliomatous Hyperplasia (PEH)",
    mergeFrom: [
      "Pseudoepitheliomatous Hyperplasia (PEH) (Jackson)",
      "Pseudoepitheliomatous Hyperplasia (PEH) (Lipoff)",
      "Pseudoepitheliomatous hyperplasia (PEH) (Rapini)"
    ],
    category: "Epidermal Changes",
    alternativeNames: ["PEH", "Pseudocarcinomatous hyperplasia"],
    preserveSources: true
  },
  "Spindle Cells": {
    primaryName: "Spindle Cells",
    mergeFrom: ["Spindle cells (Ko)", "Spindle Cells (Jackson)"],
    category: "Cellular Patterns",
    alternativeNames: ["Fusiform cells", "Elongated cells"],
    relatedFindings: ["Spindle cell neoplasms (Rapini)", "SLAM DDx (Spindle Cell Malignancy) (Alikhan)"],
    preserveSources: true
  },
  "Basaloid Cells": {
    primaryName: "Basaloid Cells",
    mergeFrom: ["Basaloid Cells (Jackson)", "Basaloid cells (Rapini)"],
    category: "Cellular Patterns",
    alternativeNames: ["Small blue cells", "Primitive cells"],
    preserveSources: true
  },
  // Note: Interface dermatitis patterns are kept separate per clinical requirements
  // - Lichenoid interface dermatitis remains distinct
  // - Vacuolar interface dermatitis remains distinct
  "Pagetoid Spread": {
    primaryName: "Pagetoid Spread",
    mergeFrom: [
      "Pagetoid Cells (Jackson)",
      "Pagetoid Scatter Pattern (Alikhan)",
      "Pagetoid Spread (Lipoff)",
      "Epidermotropism and pagetoid cells (Rapini)"
    ],
    category: "Cellular Patterns",
    alternativeNames: ["Pagetoid scatter", "Epidermotropism", "Buckshot scatter"],
    preserveSources: true
  }
};

// Import the original data
import { dermDifferentialData } from '../dermatopathology-differentials-data.js';

// Function to load the original data
async function loadOriginalData() {
  try {
    return dermDifferentialData;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

// Function to merge findings based on the configuration
function mergeFindings(originalData) {
  const mergedData = [];
  const processedFindings = new Set();

  // First, process all findings that need to be merged
  for (const [mergedName, config] of Object.entries(mergingMap)) {
    const mergedFinding = {
      finding: config.primaryName,
      alternativeNames: config.alternativeNames || [],
      category: config.category,
      sources: [],
      diagnoses: [],
      mergedFrom: config.mergeFrom,
      metadata: {
        lastUpdated: new Date().toISOString(),
        mergeCount: config.mergeFrom.length
      }
    };

    // Collect all diagnoses from sources to be merged
    const diagnosisMap = new Map(); // Use map to handle duplicates
    const sourceAuthors = new Set(); // Track all contributing authors

    config.mergeFrom.forEach(findingName => {
      const finding = originalData.find(f => f.finding === findingName);
      if (finding) {
        // Extract author name from finding
        const authorMatch = findingName.match(/\(([^)]+)\)/);
        const author = authorMatch ? authorMatch[1] : 'Unknown';
        sourceAuthors.add(author);

        // Add sources
        mergedFinding.sources = [...mergedFinding.sources, ...finding.sources];

        // Process diagnoses
        finding.diagnoses.forEach(diagnosis => {
          const key = diagnosis.name.toLowerCase();
          if (diagnosisMap.has(key)) {
            // Merge key features if diagnosis already exists
            const existing = diagnosisMap.get(key);
            // Add this author to the source list
            if (!existing.contributingSources) {
              existing.contributingSources = [existing.sources?.[0] || author];
            }
            existing.contributingSources.push(author);

            if (existing.keyFeatures !== diagnosis.keyFeatures) {
              // Combine features from different sources
              existing.keyFeatures = `${existing.keyFeatures} [${author}: ${diagnosis.keyFeatures}]`;
            }
          } else {
            // Add new diagnosis with source tracking
            diagnosisMap.set(key, {
              ...diagnosis,
              contributingSources: [author]
            });
          }
        });

        processedFindings.add(findingName);
      }
    });

    // Convert map back to array and add source attribution
    mergedFinding.diagnoses = Array.from(diagnosisMap.values()).map(diagnosis => {
      // Format contributing sources
      const sources = diagnosis.contributingSources || [];
      const sourceText = sources.length > 1
        ? `Combined from: ${sources.join(', ')}`
        : `Source: ${sources[0] || 'Unknown'}`;

      return {
        ...diagnosis,
        sourceAttribution: sourceText,
        contributingSources: sources
      };
    });

    // Add combined source information to the finding
    mergedFinding.combinedFrom = Array.from(sourceAuthors).join(', ');

    // Add related findings if specified
    if (config.relatedFindings) {
      mergedFinding.relatedFindings = config.relatedFindings;
    }

    // Add subcategories if specified
    if (config.subcategories) {
      mergedFinding.subcategories = config.subcategories;
    }

    mergedData.push(mergedFinding);
  }

  // Then, add all findings that weren't merged
  originalData.forEach(finding => {
    if (!processedFindings.has(finding.finding)) {
      // Determine category based on finding name
      let category = "Other";
      const findingLower = finding.finding.toLowerCase();

      // Categorize findings while preserving clinical distinctions
      if (findingLower.includes('vesicle') || findingLower.includes('bull')) {
        // Keep vesiculobullous findings separate - DO NOT merge
        category = "Vesiculobullous Disorders";

        // Add subcategory for better organization
        if (findingLower.includes('subepidermal')) {
          category = "Vesiculobullous Disorders - Subepidermal";
        } else if (findingLower.includes('intraepidermal')) {
          category = "Vesiculobullous Disorders - Intraepidermal";
        }
      } else if (findingLower.includes('interface')) {
        // Keep interface dermatitis patterns separate
        if (findingLower.includes('lichenoid')) {
          category = "Inflammatory Patterns - Lichenoid";
        } else if (findingLower.includes('vacuolar')) {
          category = "Inflammatory Patterns - Vacuolar";
        } else {
          category = "Inflammatory Patterns";
        }
      } else if (findingLower.includes('lichenoid') && !findingLower.includes('interface')) {
        category = "Inflammatory Patterns - Lichenoid";
      } else if (findingLower.includes('cell') || findingLower.includes('pagetoid')) {
        category = "Cellular Patterns";
      } else if (findingLower.includes('epiderm') ||
                 findingLower.includes('acantho') ||
                 findingLower.includes('hyperkeratosis') ||
                 findingLower.includes('parakeratosis')) {
        category = "Epidermal Changes";
      } else if (findingLower.includes('neutrophil') ||
                 findingLower.includes('eosinophil') ||
                 findingLower.includes('plasma cell')) {
        category = "Inflammatory Cells";
      } else if (findingLower.includes('granuloma')) {
        category = "Granulomatous Patterns";
      } else if (findingLower.includes('pigment') || findingLower.includes('melanin')) {
        category = "Pigmentary Changes";
      }

      // Extract author/source from finding name
      const authorMatch = finding.finding.match(/\(([^)]+)\)/);
      const author = authorMatch ? authorMatch[1] : null;

      mergedData.push({
        ...finding,
        category: category,
        alternativeNames: [],
        sourceAuthor: author,
        metadata: {
          isOriginal: true,
          preservedForClinicalDistinction:
            category.includes('Vesiculobullous') ||
            category.includes('Lichenoid') ||
            category.includes('Vacuolar')
        }
      });
    }
  });

  // Sort by category and then by finding name
  mergedData.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.finding.localeCompare(b.finding);
  });

  return mergedData;
}

// Function to generate summary statistics
function generateSummary(originalData, mergedData) {
  const summary = {
    originalCount: originalData.length,
    mergedCount: mergedData.length,
    reduction: originalData.length - mergedData.length,
    percentReduction: ((originalData.length - mergedData.length) / originalData.length * 100).toFixed(1),
    categoryCounts: {},
    mergedFindings: []
  };

  // Count by category
  mergedData.forEach(finding => {
    const category = finding.category || 'Other';
    summary.categoryCounts[category] = (summary.categoryCounts[category] || 0) + 1;

    if (finding.mergedFrom) {
      summary.mergedFindings.push({
        name: finding.finding,
        mergedCount: finding.mergedFrom.length,
        diagnosesCount: finding.diagnoses.length
      });
    }
  });

  return summary;
}

// Main execution
async function main() {
  console.log('Loading original data...');
  const originalData = await loadOriginalData();

  if (!originalData) {
    console.error('Failed to load original data');
    return;
  }

  console.log(`Loaded ${originalData.length} original findings`);

  console.log('Merging findings...');
  const mergedData = mergeFindings(originalData);

  console.log('Generating summary...');
  const summary = generateSummary(originalData, mergedData);

  console.log('\n=== DEDUPLICATION SUMMARY ===');
  console.log(`Original findings: ${summary.originalCount}`);
  console.log(`Merged findings: ${summary.mergedCount}`);
  console.log(`Reduction: ${summary.reduction} findings (${summary.percentReduction}%)`);

  console.log('\nFindings by category:');
  Object.entries(summary.categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

  console.log('\nMerged findings:');
  summary.mergedFindings.forEach(finding => {
    console.log(`  ${finding.name}: merged ${finding.mergedCount} sources, ${finding.diagnosesCount} total diagnoses`);
  });

  // Write the deduplicated data
  const outputContent = `// Deduplicated Dermatopathology Differential Diagnoses Data
// Generated on: ${new Date().toISOString()}
// Original findings: ${summary.originalCount}
// Merged findings: ${summary.mergedCount}

export const dermDifferentialDataDeduplicated = ${JSON.stringify(mergedData, null, 2)};

export const deduplicationSummary = ${JSON.stringify(summary, null, 2)};
`;

  fs.writeFileSync('dermatopathology-differentials-data-deduplicated.js', outputContent);
  console.log('\nDeduplicated data written to: dermatopathology-differentials-data-deduplicated.js');
}

// Run the script
main().catch(console.error);