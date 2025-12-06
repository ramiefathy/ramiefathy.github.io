import type { CameraPose } from './zoomLevels';

export interface TourStep {
  id: string;
  camera: CameraPose;
  title: string;
  narrative: string;
}

export interface TourDefinition {
  id: string;
  label: string;
  steps: TourStep[];
}

export const TOURS: TourDefinition[] = [
  {
    id: 'basic_layers',
    label: 'Layer overview',
    steps: [
      {
        id: 'layers_overview',
        camera: {
          position: [9, 7, 11],
          target: [0, 0, 0]
        },
        title: 'All layers',
        narrative: 'Overview of the epidermis, dermis, and hypodermis as an integrated organ.'
      },
      {
        id: 'epidermis_focus',
        camera: {
          position: [4.5, 4.5, 3],
          target: [0, 1.3, 0]
        },
        title: 'Epidermis',
        narrative: 'Focus on the epidermis, highlighting the stratum corneum and the living keratinocyte layers beneath.'
      },
      {
        id: 'dermis_focus',
        camera: {
          position: [4.5, 3.5, 3],
          target: [0, -0.3, 0]
        },
        title: 'Dermis',
        narrative: 'Examine the collagen matrix, blood vessels, hair follicles, and sweat glands within the dermis.'
      },
      {
        id: 'hypodermis_focus',
        camera: {
          position: [4.5, 1.5, 3],
          target: [0, -2.5, 0]
        },
        title: 'Hypodermis',
        narrative: 'View the adipose lobules and their role in cushioning and insulating the overlying skin.'
      }
    ]
  },
  {
    id: 'psoriasis_tour',
    label: 'Psoriasis pathology',
    steps: [
      {
        id: 'psoriasis_overview',
        camera: {
          position: [8, 6, 10],
          target: [0, 0.5, 0]
        },
        title: 'Psoriatic skin',
        narrative: 'Psoriasis causes epidermal hyperplasia with characteristic silvery scales on erythematous plaques.'
      },
      {
        id: 'psoriasis_epidermis',
        camera: {
          position: [3, 4, 2.5],
          target: [0, 1.5, 0]
        },
        title: 'Thickened epidermis',
        narrative: 'Notice the increased epidermal thickness due to rapid keratinocyte proliferation (hyperkeratosis).'
      },
      {
        id: 'psoriasis_stratum',
        camera: {
          position: [2, 3.5, 1.5],
          target: [0, 2, 0]
        },
        title: 'Stratum corneum',
        narrative: 'The stratum corneum shows parakeratosis with retained nuclei and increased flaking.'
      },
      {
        id: 'psoriasis_dermis',
        camera: {
          position: [4, 3, 3],
          target: [0, -0.2, 0]
        },
        title: 'Dermal inflammation',
        narrative: 'The dermis shows dilated blood vessels and inflammatory infiltrates characteristic of psoriasis.'
      }
    ]
  },
  {
    id: 'acne_tour',
    label: 'Acne pathology',
    steps: [
      {
        id: 'acne_overview',
        camera: {
          position: [7, 5, 9],
          target: [0, 0, 0]
        },
        title: 'Acne vulgaris',
        narrative: 'Acne involves follicular hyperkeratinization, sebum overproduction, and bacterial colonization.'
      },
      {
        id: 'acne_follicle',
        camera: {
          position: [3, 3, 2],
          target: [0, 0, 0]
        },
        title: 'Blocked follicle',
        narrative: 'Hair follicles become blocked by keratin plugs and sebum, forming comedones.'
      },
      {
        id: 'acne_inflammation',
        camera: {
          position: [4, 2.5, 3],
          target: [0, -0.5, 0]
        },
        title: 'Inflammatory response',
        narrative: 'P. acnes bacteria trigger inflammation, leading to papules, pustules, or nodules.'
      }
    ]
  },
  {
    id: 'vascular_tour',
    label: 'Vascular anatomy',
    steps: [
      {
        id: 'vascular_overview',
        camera: {
          position: [8, 5, 8],
          target: [0, -0.5, 0]
        },
        title: 'Skin vasculature',
        narrative: 'The skin contains an extensive vascular network essential for temperature regulation and nutrient delivery.'
      },
      {
        id: 'vascular_superficial',
        camera: {
          position: [4, 4, 3],
          target: [0, 0.5, 0]
        },
        title: 'Superficial plexus',
        narrative: 'The superficial vascular plexus lies at the dermal-epidermal junction, supplying the epidermis.'
      },
      {
        id: 'vascular_deep',
        camera: {
          position: [4, 2, 3],
          target: [0, -1, 0]
        },
        title: 'Deep plexus',
        narrative: 'The deep vascular plexus resides at the dermal-hypodermal interface, connecting to larger vessels.'
      }
    ]
  },
  {
    id: 'appendages_tour',
    label: 'Skin appendages',
    steps: [
      {
        id: 'appendages_overview',
        camera: {
          position: [7, 5, 8],
          target: [0, 0, 0]
        },
        title: 'Adnexal structures',
        narrative: 'Skin appendages include hair follicles, sweat glands, and sebaceous glands.'
      },
      {
        id: 'hair_structure',
        camera: {
          position: [3, 3, 2],
          target: [0, -0.3, 0]
        },
        title: 'Hair follicle',
        narrative: 'Hair follicles extend deep into the dermis with associated arrector pili muscles.'
      },
      {
        id: 'sweat_structure',
        camera: {
          position: [3, 2, 2.5],
          target: [-1, -1, 0]
        },
        title: 'Eccrine sweat gland',
        narrative: 'Eccrine sweat glands are coiled tubular glands that open directly to the skin surface.'
      }
    ]
  },
  {
    id: 'nerve_tour',
    label: 'Nerve distribution',
    steps: [
      {
        id: 'nerve_overview',
        camera: {
          position: [8, 5, 9],
          target: [0, 0, 0]
        },
        title: 'Cutaneous nerves',
        narrative: 'The skin is richly innervated with sensory and autonomic nerve fibers.'
      },
      {
        id: 'nerve_dermis',
        camera: {
          position: [4, 3, 3],
          target: [0, -0.5, 0]
        },
        title: 'Dermal nerve plexus',
        narrative: 'Nerve bundles branch throughout the dermis, supplying sensory receptors and appendages.'
      },
      {
        id: 'nerve_epidermis',
        camera: {
          position: [3, 4, 2],
          target: [0, 1, 0]
        },
        title: 'Free nerve endings',
        narrative: 'Free nerve endings extend into the epidermis, detecting pain, temperature, and itch.'
      }
    ]
  },
  {
    id: 'wound_healing_tour',
    label: 'Wound healing',
    steps: [
      {
        id: 'wound_overview',
        camera: {
          position: [8, 6, 10],
          target: [0, 0, 0]
        },
        title: 'Wound healing phases',
        narrative: 'Wound healing proceeds through hemostasis, inflammation, proliferation, and remodeling phases.'
      },
      {
        id: 'wound_inflammation',
        camera: {
          position: [5, 4, 4],
          target: [0, 0, 0]
        },
        title: 'Inflammatory phase',
        narrative: 'Neutrophils and macrophages clean the wound site and release growth factors.'
      },
      {
        id: 'wound_proliferation',
        camera: {
          position: [4, 3.5, 3],
          target: [0, 0.5, 0]
        },
        title: 'Proliferative phase',
        narrative: 'Keratinocytes migrate to re-epithelialize while fibroblasts deposit new collagen matrix.'
      },
      {
        id: 'wound_remodeling',
        camera: {
          position: [4, 3, 3],
          target: [0, -0.3, 0]
        },
        title: 'Remodeling phase',
        narrative: 'Collagen reorganizes over months, strengthening the scar tissue to near-normal tensile strength.'
      }
    ]
  }
];
