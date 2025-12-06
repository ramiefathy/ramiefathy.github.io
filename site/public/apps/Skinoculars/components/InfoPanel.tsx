/**
 * Enhanced InfoPanel Component
 * Tabbed interface for structure information
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StructureData, LangCode, getLocalizedString } from '../types';
import { getQuestionsForStructure, QuizQuestion } from '../quiz';

type InfoPanelTab = 'overview' | 'clinical' | 'histology' | 'practice';

interface InfoPanelProps {
  data: StructureData | null;
  onClose: () => void;
  lang: LangCode;
}

// Tab button component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}> = ({ active, onClick, label, badge }) => (
  <button
    onClick={onClick}
    className={`
      px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors
      ${active
        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }
    `}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-slate-700 text-slate-300">
        {badge}
      </span>
    )}
  </button>
);

// Overview tab content
const OverviewTab: React.FC<{
  data: StructureData;
  lang: LangCode;
}> = ({ data, lang }) => {
  const description = getLocalizedString(data.description, lang);
  const funFact = data.funFact ? getLocalizedString(data.funFact, lang) : '';
  const learningObjectives = data.learningObjectives ? getLocalizedString(data.learningObjectives, lang) : '';

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-xs text-slate-200 leading-relaxed">
        {description}
      </p>

      {/* Fun fact */}
      {funFact && (
        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
          <h3 className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            Did you know?
          </h3>
          <p className="text-slate-300 text-[11px] italic">
            {funFact}
          </p>
        </div>
      )}

      {/* Learning objectives */}
      {learningObjectives && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3">
          <h3 className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            Learning Objectives
          </h3>
          <div className="text-slate-200 text-[11px] space-y-1">
            {learningObjectives.split('\n').filter(Boolean).map((line, idx) => (
              <p key={idx} className="leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {data.references && data.references.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
            References
          </h3>
          <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
            {data.references.map((ref, idx) => (
              <li key={idx}>{ref}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Clinical tab content
const ClinicalTab: React.FC<{
  data: StructureData;
  lang: LangCode;
}> = ({ data, lang }) => {
  const clinicalCorrelates = data.clinicalCorrelates ? getLocalizedString(data.clinicalCorrelates, lang) : '';

  // Parse clinical correlates into sections
  const sections = useMemo(() => {
    if (!clinicalCorrelates) return [];

    const parts: Array<{ type: string; content: string }> = [];
    const lines = clinicalCorrelates.split('\n').filter(Boolean);

    lines.forEach(line => {
      if (line.startsWith('HIGH-YIELD:')) {
        parts.push({ type: 'high-yield', content: line.replace('HIGH-YIELD:', '').trim() });
      } else if (line.startsWith('BOARD PEARL:')) {
        parts.push({ type: 'board-pearl', content: line.replace('BOARD PEARL:', '').trim() });
      } else if (line.startsWith('CLINICAL:')) {
        parts.push({ type: 'clinical', content: line.replace('CLINICAL:', '').trim() });
      } else {
        parts.push({ type: 'general', content: line.trim() });
      }
    });

    return parts;
  }, [clinicalCorrelates]);

  if (!clinicalCorrelates) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No clinical correlates available for this structure.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => {
        if (section.type === 'high-yield') {
          return (
            <div key={idx} className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-400">⚡</span>
                <h3 className="text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  High-Yield
                </h3>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {section.content}
              </p>
            </div>
          );
        }

        if (section.type === 'board-pearl') {
          return (
            <div key={idx} className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-400">💎</span>
                <h3 className="text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                  Board Pearl
                </h3>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {section.content}
              </p>
            </div>
          );
        }

        if (section.type === 'clinical') {
          return (
            <div key={idx} className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-400">🏥</span>
                <h3 className="text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  Clinical Correlation
                </h3>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {section.content}
              </p>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-300 text-[11px] leading-relaxed">
            {section.content}
          </p>
        );
      })}

      {/* Related conditions */}
      {data.relatedConditions && data.relatedConditions.length > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <h3 className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
            Related Conditions
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {data.relatedConditions.map(condition => (
              <span
                key={condition}
                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
              >
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Histology tab content
const HistologyTab: React.FC<{
  data: StructureData;
  lang: LangCode;
}> = ({ data }) => {
  // Histology data based on structure ID
  const histologyInfo: Record<string, { stain: string; features: string[]; magnification: string }> = {
    epidermis: {
      stain: 'H&E',
      features: [
        'Stratified squamous keratinized epithelium',
        'Rete ridges interdigitating with dermal papillae',
        'Visible stratum basale (single layer of cuboidal/columnar cells)',
        'Stratum spinosum (polygonal cells with "spiny" appearance)',
        'Stratum granulosum (keratohyalin granules)',
        'Stratum corneum (acellular keratin layer)'
      ],
      magnification: '10x - 40x'
    },
    dermis: {
      stain: 'H&E, Masson Trichrome (collagen blue)',
      features: [
        'Papillary dermis: loose connective tissue, type III collagen',
        'Reticular dermis: dense irregular CT, type I collagen bundles',
        'Fibroblasts scattered throughout',
        'Blood vessels, nerves, and adnexal structures',
        'Mast cells near vessels (toluidine blue stain)'
      ],
      magnification: '4x - 20x'
    },
    collagen: {
      stain: 'Masson Trichrome, Sirius Red (polarized light)',
      features: [
        'Type I collagen: thick yellow/orange birefringent fibers',
        'Type III collagen: thin green birefringent fibers',
        'Wavy, bundled fiber arrangement',
        'Cross-linking pattern visible at high magnification'
      ],
      magnification: '20x - 40x'
    },
    hair_follicle: {
      stain: 'H&E',
      features: [
        'Outer root sheath (continuous with epidermis)',
        'Inner root sheath (Henle, Huxley layers)',
        'Hair matrix (rapidly dividing cells at bulb)',
        'Dermal papilla (specialized mesenchyme)',
        'Bulge region (stem cell niche)'
      ],
      magnification: '10x - 40x'
    },
    sweat_gland: {
      stain: 'H&E, PAS (basement membrane)',
      features: [
        'Secretory coil: cuboidal cells (clear + dark)',
        'Myoepithelial cells surrounding secretory portion',
        'Duct: two layers of cuboidal cells',
        'Straight duct ascending through dermis/epidermis'
      ],
      magnification: '20x - 40x'
    }
  };

  const info = histologyInfo[data.id];

  if (!info) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Histology information not yet available for this structure.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stain */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3">
        <h3 className="text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1">
          Recommended Stain
        </h3>
        <p className="text-slate-200 text-[11px]">{info.stain}</p>
      </div>

      {/* Magnification */}
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-slate-400">Magnification:</span>
        <span className="text-slate-200 font-medium">{info.magnification}</span>
      </div>

      {/* Key histologic features */}
      <div>
        <h3 className="text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-2">
          Key Histologic Features
        </h3>
        <ul className="space-y-1.5">
          {info.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span className="text-slate-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Microscopy tip */}
      <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
        <p className="text-[10px] text-slate-400 italic">
          Tip: Use the 3D model's "Zoom" control to see cellular-level detail when available.
        </p>
      </div>
    </div>
  );
};

// Practice tab content
const PracticeTab: React.FC<{
  data: StructureData;
  questions: QuizQuestion[];
}> = ({ data, questions }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No practice questions available for this structure yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-400 mb-2">
        {questions.length} question{questions.length !== 1 ? 's' : ''} related to {data.id.replace('_', ' ')}
      </p>

      {questions.slice(0, 5).map(q => (
        <div
          key={q.id}
          className="bg-slate-800/40 border border-slate-700/60 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
            className="w-full text-left p-3 hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`
                    px-1.5 py-0.5 rounded text-[9px] font-medium
                    ${q.difficulty === 'beginner' ? 'bg-emerald-900/50 text-emerald-300' :
                      q.difficulty === 'intermediate' ? 'bg-blue-900/50 text-blue-300' :
                      q.difficulty === 'advanced' ? 'bg-purple-900/50 text-purple-300' :
                      'bg-amber-900/50 text-amber-300'}
                  `}>
                    {q.difficulty}
                  </span>
                  {q.examLevels?.map(level => (
                    <span key={level} className="text-[9px] text-slate-500 uppercase">
                      {level}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-200 line-clamp-2">
                  {q.prompt}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${expandedQuestion === q.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedQuestion === q.id && (
            <div className="px-3 pb-3 pt-0">
              <div className="border-t border-slate-700 pt-3">
                {/* Options */}
                {q.options && (
                  <div className="space-y-1.5 mb-3">
                    {q.options.map(opt => (
                      <div
                        key={opt.id}
                        className={`
                          px-2 py-1.5 rounded text-[10px]
                          ${opt.isCorrect
                            ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                          }
                        `}
                      >
                        <span className="font-medium">{opt.id.toUpperCase()}.</span> {opt.text}
                        {opt.isCorrect && <span className="ml-2">✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                <div className="bg-slate-900/60 border border-slate-700/50 rounded p-2">
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {questions.length > 5 && (
        <p className="text-[10px] text-slate-500 text-center">
          +{questions.length - 5} more questions available in Quiz Mode
        </p>
      )}
    </div>
  );
};

// Main InfoPanel component
export const InfoPanel: React.FC<InfoPanelProps> = ({ data, onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<InfoPanelTab>('overview');

  // Reset tab when structure changes
  useEffect(() => {
    setActiveTab('overview');
  }, [data?.id]);

  // Get related quiz questions
  const relatedQuestions = useMemo(() => {
    if (!data) return [];
    return getQuestionsForStructure(data.id);
  }, [data?.id]);

  if (!data) {
    return null;
  }

  const title = getLocalizedString(data.title, lang);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/70 bg-slate-900">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
          <p className="text-[11px] text-slate-400">{data.layer}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-slate-700/70 bg-slate-900/50">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          label="Overview"
        />
        <TabButton
          active={activeTab === 'clinical'}
          onClick={() => setActiveTab('clinical')}
          label="Clinical"
        />
        <TabButton
          active={activeTab === 'histology'}
          onClick={() => setActiveTab('histology')}
          label="Histology"
        />
        <TabButton
          active={activeTab === 'practice'}
          onClick={() => setActiveTab('practice')}
          label="Practice"
          badge={relatedQuestions.length}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && <OverviewTab data={data} lang={lang} />}
        {activeTab === 'clinical' && <ClinicalTab data={data} lang={lang} />}
        {activeTab === 'histology' && <HistologyTab data={data} lang={lang} />}
        {activeTab === 'practice' && <PracticeTab data={data} questions={relatedQuestions} />}
      </div>
    </div>
  );
};

export default InfoPanel;
