export type LayerId = 'Epidermis' | 'Dermis' | 'Hypodermis';

export type LangCode = 'en' | 'es' | 'ar';

export type LocalizedString = string | { [lang: string]: string };

export type DiseaseId = 'normal' | 'psoriasis' | 'eczema' | 'photoaging' | 'acne' | 'rosacea' | 'vitiligo' | 'melanoma' | 'bcc' | 'urticaria' | 'contact_dermatitis';
export type TimelineId = 'none' | 'wound_healing';
export type ZoomLevelId = 'macro' | 'meso' | 'micro';

export interface StructureData {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  layer: LayerId;
  funFact?: LocalizedString;
  learningObjectives?: LocalizedString;
  clinicalCorrelates?: LocalizedString;
  references?: string[];
  relatedConditions?: string[];
}

export interface SkinLayerVisibility {
  epidermis: boolean;
  dermis: boolean;
  hypodermis: boolean;
  structures: {
    hair: boolean;
    sweat: boolean;
    collagen: boolean;
    nerves: boolean;
    vessels: boolean;
  };
}

/**
 * Helper to safely resolve localized strings while remaining compatible
 * with plain string values already present in the dataset.
 */
export function getLocalizedString(value: LocalizedString | undefined, lang: LangCode): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value['en'] ?? '';
}
