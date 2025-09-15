export type AppEntry = {
  title: string;
  path: string;
  description?: string;
  tags?: string[];
};

export const apps: AppEntry[] = [
  { title: 'DermaScribe (React)', path: '/apps/dermascribe', tags: ['AI', 'scribe'] },
  { title: 'Dermpath Differentials', path: '/apps/dermpath-differentials', tags: ['dermatopathology'] },
  { title: 'DermaScore', path: '/apps/dermascore.html', tags: ['calculator'] },
  { title: 'Clinic Scheduler', path: '/apps/Scheduler.html', tags: ['scheduling'] },
  { title: 'PDF Merger', path: '/apps/pdf-merger', tags: ['pdf'] },
  { title: 'PDF Splitter', path: '/apps/pdf-splitter', tags: ['pdf'] },
  { title: 'Text Extractor', path: '/apps/text-extractor', tags: ['pdf', 'ocr'] },
  { title: 'Coding Tutor', path: '/apps/coding-tutor', tags: ['education'] },
  { title: 'Dermatology Study System', path: '/apps/study-system', tags: ['study'] },
  { title: 'Mindmaps: Alopecia', path: '/apps/mindmaps/alopecia', tags: ['study'] },
  { title: 'Research Feed', path: '/apps/research', tags: ['research'] },
  { title: 'Apps Index', path: '/apps', tags: ['index'] }
];
