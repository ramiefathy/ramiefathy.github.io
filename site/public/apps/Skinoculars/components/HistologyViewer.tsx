import React, { useState, useCallback } from 'react';
import { LangCode } from '../types';

export interface HistologyImage {
  id: string;
  title: string;
  description: string;
  stainType: 'H&E' | 'PAS' | 'Masson' | 'IHC' | 'Silver' | 'Other';
  magnification: '4x' | '10x' | '20x' | '40x' | '100x';
  structureId: string;
  imageUrl?: string; // For future image loading
  annotations?: HistologyAnnotation[];
  educationalNotes?: string;
  clinicalRelevance?: string;
}

export interface HistologyAnnotation {
  id: string;
  label: string;
  description: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color?: string;
}

interface HistologyViewerProps {
  structureId: string | null;
  lang: LangCode;
  onClose: () => void;
  isOpen: boolean;
}

// Sample histology data - in production, this would be loaded from a database
const HISTOLOGY_DATA: Record<string, HistologyImage[]> = {
  'epidermis': [
    {
      id: 'epidermis_he_10x',
      title: 'Epidermis - H&E Stain',
      description: 'Cross-section showing all epidermal layers from stratum basale to stratum corneum.',
      stainType: 'H&E',
      magnification: '10x',
      structureId: 'epidermis',
      annotations: [
        { id: 'sc', label: 'Stratum Corneum', description: 'Anucleate corneocytes (basket-weave pattern)', x: 50, y: 10, color: '#f59e0b' },
        { id: 'sg', label: 'Stratum Granulosum', description: 'Basophilic keratohyalin granules visible', x: 50, y: 25, color: '#8b5cf6' },
        { id: 'ss', label: 'Stratum Spinosum', description: 'Polyhedral cells with "spiny" intercellular bridges', x: 50, y: 45, color: '#3b82f6' },
        { id: 'sb', label: 'Stratum Basale', description: 'Single layer of columnar/cuboidal cells on BM', x: 50, y: 65, color: '#10b981' },
        { id: 'dej', label: 'DEJ', description: 'Dermal-epidermal junction (basement membrane zone)', x: 50, y: 75, color: '#ef4444' }
      ],
      educationalNotes: 'The epidermis is a stratified squamous keratinizing epithelium. Note the progressive flattening and loss of nuclei as keratinocytes migrate superficially. The stratum lucidum (not visible here) is only present in thick skin (palms, soles).',
      clinicalRelevance: 'In psoriasis, you would see parakeratosis (retained nuclei in stratum corneum), acanthosis (epidermal thickening), and elongated rete ridges.'
    },
    {
      id: 'epidermis_he_40x',
      title: 'Epidermal Layers - High Power',
      description: 'High magnification showing cellular detail of keratinocyte differentiation.',
      stainType: 'H&E',
      magnification: '40x',
      structureId: 'epidermis',
      annotations: [
        { id: 'kh', label: 'Keratohyalin', description: 'Dense basophilic granules containing profilaggrin', x: 30, y: 30, color: '#8b5cf6' },
        { id: 'melanin', label: 'Melanin', description: 'Brown pigment in basal keratinocytes', x: 60, y: 70, color: '#92400e' },
        { id: 'mitosis', label: 'Mitotic Figure', description: 'Active cell division in stratum basale', x: 75, y: 68, color: '#dc2626' }
      ],
      educationalNotes: 'At high power, individual keratohyalin granules are visible in the stratum granulosum. Melanin caps can be seen over keratinocyte nuclei in the basal layer, protecting DNA from UV damage.',
      clinicalRelevance: 'Increased mitotic figures and atypical mitoses suggest dysplasia or malignancy. In actinic keratosis, atypical keratinocytes are confined to the lower epidermis.'
    }
  ],
  'dermis': [
    {
      id: 'dermis_he_10x',
      title: 'Dermis - H&E Stain',
      description: 'Papillary and reticular dermis with collagen bundles and dermal appendages.',
      stainType: 'H&E',
      magnification: '10x',
      structureId: 'dermis',
      annotations: [
        { id: 'pd', label: 'Papillary Dermis', description: 'Loose connective tissue with fine collagen (type III)', x: 50, y: 20, color: '#f472b6' },
        { id: 'rd', label: 'Reticular Dermis', description: 'Dense irregular CT with thick type I collagen bundles', x: 50, y: 55, color: '#a855f7' },
        { id: 'vessels', label: 'Blood Vessels', description: 'Superficial vascular plexus', x: 25, y: 25, color: '#ef4444' },
        { id: 'fibroblast', label: 'Fibroblasts', description: 'Spindle-shaped cells producing ECM', x: 70, y: 45, color: '#3b82f6' }
      ],
      educationalNotes: 'The papillary dermis contains loose connective tissue, more type III collagen, and the superficial vascular plexus. The reticular dermis has dense irregular connective tissue with thick type I collagen bundles.',
      clinicalRelevance: 'In scleroderma/morphea, you see homogenization of collagen bundles with loss of normal basket-weave pattern. Solar elastosis shows basophilic degeneration of dermal collagen in photoaged skin.'
    },
    {
      id: 'dermis_masson_20x',
      title: 'Dermal Collagen - Masson Trichrome',
      description: 'Masson trichrome stain highlighting collagen (blue) and muscle (red).',
      stainType: 'Masson',
      magnification: '20x',
      structureId: 'dermis',
      annotations: [
        { id: 'collagen', label: 'Collagen', description: 'Blue-stained collagen fibers', x: 50, y: 50, color: '#3b82f6' },
        { id: 'muscle', label: 'Smooth Muscle', description: 'Red-stained arrector pili muscle', x: 30, y: 60, color: '#ef4444' }
      ],
      educationalNotes: 'Masson trichrome is invaluable for assessing collagen content and organization. Blue = collagen, Red = muscle/keratin, Black = nuclei. This stain helps distinguish keloids (disorganized collagen) from hypertrophic scars.',
      clinicalRelevance: 'In fibrotic conditions, Masson trichrome reveals the extent of collagen deposition. Useful for grading liver fibrosis, cardiac fibrosis, and dermal scarring.'
    }
  ],
  'hair_follicle': [
    {
      id: 'follicle_he_4x',
      title: 'Hair Follicle - Longitudinal Section',
      description: 'Complete pilosebaceous unit showing hair shaft, follicle, and associated structures.',
      stainType: 'H&E',
      magnification: '4x',
      structureId: 'hair_follicle',
      annotations: [
        { id: 'shaft', label: 'Hair Shaft', description: 'Keratinized hair fiber', x: 50, y: 15, color: '#92400e' },
        { id: 'irs', label: 'Inner Root Sheath', description: 'Surrounds and molds the hair shaft', x: 40, y: 40, color: '#f59e0b' },
        { id: 'ors', label: 'Outer Root Sheath', description: 'Continuous with epidermis', x: 60, y: 45, color: '#10b981' },
        { id: 'bulb', label: 'Hair Bulb', description: 'Matrix cells and dermal papilla', x: 50, y: 85, color: '#3b82f6' },
        { id: 'sebaceous', label: 'Sebaceous Gland', description: 'Holocrine gland producing sebum', x: 25, y: 35, color: '#f472b6' },
        { id: 'arrector', label: 'Arrector Pili', description: 'Smooth muscle for piloerection', x: 70, y: 50, color: '#ef4444' }
      ],
      educationalNotes: 'The pilosebaceous unit includes the hair follicle, sebaceous gland, and arrector pili muscle. The bulge region (not easily visible at this magnification) contains hair follicle stem cells.',
      clinicalRelevance: 'In alopecia areata, lymphocytic infiltrate surrounds the hair bulb ("swarm of bees"). In androgenetic alopecia, follicles undergo miniaturization with decreased follicle depth and shaft diameter.'
    }
  ],
  'sweat_gland': [
    {
      id: 'eccrine_he_20x',
      title: 'Eccrine Sweat Gland',
      description: 'Coiled secretory portion and straight duct of eccrine sweat gland.',
      stainType: 'H&E',
      magnification: '20x',
      structureId: 'sweat_gland',
      annotations: [
        { id: 'secretory', label: 'Secretory Coil', description: 'Clear (light) and dark (mucoid) cells', x: 40, y: 60, color: '#3b82f6' },
        { id: 'myoepithelial', label: 'Myoepithelial Cells', description: 'Contractile cells around secretory coil', x: 55, y: 55, color: '#ef4444' },
        { id: 'duct', label: 'Sweat Duct', description: 'Two-layered cuboidal epithelium', x: 70, y: 30, color: '#10b981' }
      ],
      educationalNotes: 'Eccrine glands have a coiled secretory portion deep in the dermis and a straight duct that opens directly onto the skin surface. The secretory coil has clear cells (watery secretion), dark cells (glycoprotein), and myoepithelial cells.',
      clinicalRelevance: 'In hyperhidrosis, eccrine glands are structurally normal but overactive. Eccrine hidradenomas are benign tumors arising from eccrine ducts. Syringomas arise from eccrine ducts and appear as small papules around the eyes.'
    }
  ],
  'collagen': [
    {
      id: 'collagen_polarized',
      title: 'Collagen - Polarized Light',
      description: 'Picrosirius red stain viewed under polarized light to assess collagen organization.',
      stainType: 'Other',
      magnification: '20x',
      structureId: 'collagen',
      annotations: [
        { id: 'type1', label: 'Type I Collagen', description: 'Orange-red birefringence (mature, thick fibers)', x: 50, y: 40, color: '#f97316' },
        { id: 'type3', label: 'Type III Collagen', description: 'Green birefringence (thin, immature fibers)', x: 30, y: 60, color: '#22c55e' }
      ],
      educationalNotes: 'Picrosirius red under polarized light differentiates collagen types: Type I (thick, mature) shows orange-red birefringence; Type III (thin, immature) shows green birefringence. This is useful for assessing wound healing and fibrosis.',
      clinicalRelevance: 'In early wound healing, type III collagen predominates (green). Mature scars show type I collagen (orange-red). Keloids show disorganized collagen with mixed birefringence patterns.'
    }
  ],
  'blood_vessels': [
    {
      id: 'vessels_he_20x',
      title: 'Dermal Vasculature',
      description: 'Postcapillary venules and arterioles in the superficial dermis.',
      stainType: 'H&E',
      magnification: '20x',
      structureId: 'blood_vessels',
      annotations: [
        { id: 'arteriole', label: 'Arteriole', description: 'Thick muscular wall, round lumen', x: 30, y: 40, color: '#ef4444' },
        { id: 'venule', label: 'Venule', description: 'Thin wall, irregular lumen', x: 65, y: 50, color: '#3b82f6' },
        { id: 'endothelium', label: 'Endothelium', description: 'Single layer of flat cells lining vessels', x: 45, y: 35, color: '#10b981' }
      ],
      educationalNotes: 'The dermal vasculature includes arterioles, capillaries, and venules. Arterioles have a thicker muscular wall. Postcapillary venules are the site of leukocyte extravasation in inflammation.',
      clinicalRelevance: 'In leukocytoclastic vasculitis, neutrophils infiltrate and damage postcapillary venule walls, causing "nuclear dust" (karyorrhexis). Increased vessel density and dilation is seen in rosacea.'
    }
  ],
  'nerves': [
    {
      id: 'meissner_he_40x',
      title: 'Meissner Corpuscle',
      description: 'Encapsulated mechanoreceptor in dermal papilla of glabrous skin.',
      stainType: 'H&E',
      magnification: '40x',
      structureId: 'nerves',
      annotations: [
        { id: 'capsule', label: 'Capsule', description: 'Connective tissue capsule', x: 50, y: 30, color: '#6366f1' },
        { id: 'lamellar', label: 'Lamellar Cells', description: 'Stacked Schwann cell-derived cells', x: 50, y: 50, color: '#f472b6' },
        { id: 'nerve', label: 'Nerve Fiber', description: 'Myelinated afferent entering corpuscle', x: 50, y: 75, color: '#eab308' }
      ],
      educationalNotes: 'Meissner corpuscles are rapidly adapting mechanoreceptors for light touch discrimination. They are located in dermal papillae of glabrous (hairless) skin, especially fingertips, lips, and eyelids.',
      clinicalRelevance: 'Meissner corpuscle density decreases with age, contributing to reduced tactile sensitivity in elderly patients. They are absent in hairy skin where hair follicle receptors serve similar functions.'
    }
  ],
  'stratum_corneum': [
    {
      id: 'sc_he_40x',
      title: 'Stratum Corneum - Basket Weave Pattern',
      description: 'High-power view of the stratum corneum showing typical basket-weave arrangement of corneocytes.',
      stainType: 'H&E',
      magnification: '40x',
      structureId: 'stratum_corneum',
      annotations: [
        { id: 'corneocytes', label: 'Corneocytes', description: 'Anucleate, flattened dead keratinocytes', x: 50, y: 30, color: '#f59e0b' },
        { id: 'basket', label: 'Basket-Weave', description: 'Normal loose arrangement of stratum corneum', x: 50, y: 50, color: '#10b981' },
        { id: 'sg', label: 'Stratum Granulosum', description: 'Transition zone below stratum corneum', x: 50, y: 80, color: '#8b5cf6' }
      ],
      educationalNotes: 'The basket-weave pattern is normal stratum corneum appearance in processed tissue. Corneocytes are terminally differentiated keratinocytes that have lost nuclei and organelles. They are surrounded by a lipid matrix ("brick and mortar" model).',
      clinicalRelevance: 'In psoriasis, parakeratosis (retained nuclei) replaces normal orthokeratosis. Compact orthokeratosis (tightly packed layers) is seen in lichen simplex chronicus and ichthyosis.'
    }
  ],
  'keratinocytes': [
    {
      id: 'keratinocytes_he_40x',
      title: 'Keratinocytes - Stratum Basale',
      description: 'High-power view showing basal keratinocytes with mitotic activity.',
      stainType: 'H&E',
      magnification: '40x',
      structureId: 'keratinocytes',
      annotations: [
        { id: 'basal', label: 'Basal Keratinocytes', description: 'Columnar/cuboidal cells with prominent nuclei', x: 50, y: 60, color: '#10b981' },
        { id: 'mitosis', label: 'Mitotic Figure', description: 'Active cell division in stratum basale', x: 70, y: 55, color: '#ef4444' },
        { id: 'melanin', label: 'Melanin Caps', description: 'Protective pigment over nuclei', x: 35, y: 65, color: '#92400e' },
        { id: 'bm', label: 'Basement Membrane', description: 'Dermal-epidermal junction', x: 50, y: 80, color: '#3b82f6' }
      ],
      educationalNotes: 'Basal keratinocytes are the stem cells of the epidermis. They express K5/K14 keratins. As they differentiate and migrate upward, they switch to K1/K10 expression. Melanin caps protect DNA from UV damage.',
      clinicalRelevance: 'Increased mitotic figures may indicate hyperproliferative conditions (psoriasis) or malignancy. Atypical mitoses suggest dysplasia or SCC. Suprabasal mitoses are seen in Bowen disease.'
    }
  ],
  'hypodermis': [
    {
      id: 'hypodermis_he_4x',
      title: 'Hypodermis (Subcutis) - Overview',
      description: 'Low-power view showing adipose tissue organized into lobules separated by connective tissue septa.',
      stainType: 'H&E',
      magnification: '4x',
      structureId: 'hypodermis',
      annotations: [
        { id: 'lobules', label: 'Fat Lobules', description: 'Clusters of adipocytes', x: 50, y: 50, color: '#fbbf24' },
        { id: 'septa', label: 'Fibrous Septa', description: 'Connective tissue dividing lobules', x: 30, y: 40, color: '#3b82f6' },
        { id: 'vessels', label: 'Blood Vessels', description: 'Deep vascular plexus in septa', x: 70, y: 45, color: '#ef4444' },
        { id: 'dermis', label: 'Deep Dermis', description: 'Transition zone above hypodermis', x: 50, y: 15, color: '#a855f7' }
      ],
      educationalNotes: 'The hypodermis (subcutis) connects skin to underlying fascia. Fat lobules are separated by fibrous septa containing vessels, nerves, and lymphatics. This layer provides insulation, cushioning, and energy storage.',
      clinicalRelevance: 'Panniculitis (inflammation of subcutaneous fat) can be classified as septal or lobular based on the primary location of inflammation. Erythema nodosum is a septal panniculitis; lupus panniculitis is lobular.'
    }
  ],
  'adipose': [
    {
      id: 'adipose_he_20x',
      title: 'Adipocytes - White Adipose Tissue',
      description: 'Mature adipocytes with characteristic signet-ring appearance due to single large lipid droplet.',
      stainType: 'H&E',
      magnification: '20x',
      structureId: 'adipose',
      annotations: [
        { id: 'adipocyte', label: 'Adipocyte', description: 'Signet-ring cell with peripheral nucleus', x: 50, y: 50, color: '#fbbf24' },
        { id: 'lipid', label: 'Lipid Droplet', description: 'Single large fat droplet (appears empty on H&E)', x: 50, y: 40, color: '#f5f5f4' },
        { id: 'nucleus', label: 'Peripheral Nucleus', description: 'Flattened nucleus pushed to cell periphery', x: 70, y: 60, color: '#6366f1' },
        { id: 'capillary', label: 'Capillary', description: 'Blood supply to adipose tissue', x: 25, y: 45, color: '#ef4444' }
      ],
      educationalNotes: 'White adipose tissue adipocytes contain a single large lipid droplet that displaces the nucleus and cytoplasm to the cell periphery. The lipid is dissolved during processing, leaving an empty-appearing cell.',
      clinicalRelevance: 'Lipomas show mature adipocytes without atypia. Well-differentiated liposarcoma shows adipocytes with nuclear atypia and lipoblasts (cells with scalloped nuclei from multiple lipid droplets).'
    }
  ],
  'arrector_pili': [
    {
      id: 'arrector_he_20x',
      title: 'Arrector Pili Muscle',
      description: 'Smooth muscle bundle extending from hair follicle bulge region to papillary dermis.',
      stainType: 'H&E',
      magnification: '20x',
      structureId: 'arrector_pili',
      annotations: [
        { id: 'muscle', label: 'Smooth Muscle', description: 'Eosinophilic spindle cells with central nuclei', x: 50, y: 50, color: '#ef4444' },
        { id: 'follicle', label: 'Hair Follicle', description: 'Outer root sheath attachment point', x: 30, y: 35, color: '#10b981' },
        { id: 'sebaceous', label: 'Sebaceous Gland', description: 'Located between muscle and follicle', x: 25, y: 55, color: '#f472b6' },
        { id: 'dermis', label: 'Papillary Dermis', description: 'Superior attachment point', x: 70, y: 25, color: '#3b82f6' }
      ],
      educationalNotes: 'The arrector pili muscle is a small bundle of smooth muscle that attaches to the hair follicle at the bulge region and extends obliquely to the papillary dermis. Contraction causes piloerection (goosebumps).',
      clinicalRelevance: 'Preservation vs. destruction of arrector pili distinguishes non-scarring from scarring alopecia. In lichen planopilaris, perifollicular fibrosis destroys the arrector pili muscle insertion.'
    }
  ]
};

// Stain type descriptions
const STAIN_DESCRIPTIONS: Record<string, string> = {
  'H&E': 'Hematoxylin & Eosin - Standard stain. Nuclei = blue/purple, Cytoplasm = pink.',
  'PAS': 'Periodic Acid-Schiff - Highlights glycogen, basement membranes, fungi (magenta).',
  'Masson': 'Masson Trichrome - Collagen = blue, Muscle/keratin = red, Nuclei = black.',
  'IHC': 'Immunohistochemistry - Uses antibodies to detect specific antigens.',
  'Silver': 'Silver stains - Reticulin, melanin, fungi, spirochetes.',
  'Other': 'Specialized staining technique (see description).'
};

export const HistologyViewer: React.FC<HistologyViewerProps> = ({
  structureId,
  lang,
  onClose,
  isOpen
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const images = structureId ? (HISTOLOGY_DATA[structureId] || []) : [];
  const currentImage = images[selectedImageIndex];

  const handleAnnotationClick = useCallback((annotationId: string) => {
    setSelectedAnnotation(prev => prev === annotationId ? null : annotationId);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Histology Reference</h2>
              <p className="text-[10px] text-slate-400">
                {structureId ? `Viewing: ${structureId.replace(/_/g, ' ')}` : 'Select a structure'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-slate-300 font-medium mb-1">No histology images available</h3>
              <p className="text-slate-500 text-sm">
                {structureId
                  ? `Histology references for "${structureId.replace(/_/g, ' ')}" are not yet available.`
                  : 'Select a structure to view histology references.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Main image area */}
            <div className="flex-1 flex flex-col">
              {/* Image viewer */}
              <div className="relative flex-1 bg-slate-950 min-h-[300px]">
                {/* Placeholder for actual histology image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full bg-gradient-to-br from-pink-900/20 via-purple-900/30 to-blue-900/20 flex items-center justify-center">
                    {/* Simulated histology pattern */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `
                          radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.3) 0%, transparent 30%),
                          radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.3) 0%, transparent 30%),
                          radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 30%),
                          linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%),
                          linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%)
                        `,
                        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 8px 8px, 8px 8px'
                      }} />
                    </div>

                    <div className="relative z-10 text-center">
                      <p className="text-slate-400 text-sm">
                        [Histology image placeholder]
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {currentImage?.title}
                      </p>
                    </div>

                    {/* Annotation markers */}
                    {showAnnotations && currentImage?.annotations?.map(annotation => (
                      <button
                        key={annotation.id}
                        className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                          selectedAnnotation === annotation.id
                            ? 'scale-125 z-20'
                            : 'hover:scale-110'
                        }`}
                        style={{
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: annotation.color || '#3b82f6',
                          borderColor: selectedAnnotation === annotation.id ? '#fff' : 'transparent'
                        }}
                        onClick={() => handleAnnotationClick(annotation.id)}
                        onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                        onMouseLeave={() => setHoveredAnnotation(null)}
                      >
                        {annotation.id.charAt(0).toUpperCase()}
                      </button>
                    ))}

                    {/* Annotation tooltip */}
                    {hoveredAnnotation && !selectedAnnotation && (
                      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-2 z-30">
                        {(() => {
                          const annotation = currentImage?.annotations?.find(a => a.id === hoveredAnnotation);
                          return annotation ? (
                            <>
                              <p className="text-xs font-medium text-slate-200">{annotation.label}</p>
                              <p className="text-[10px] text-slate-400">{annotation.description}</p>
                            </>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Magnification badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300">
                  {currentImage?.magnification} | {currentImage?.stainType}
                </div>

                {/* Controls */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                      showAnnotations
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    {showAnnotations ? 'Hide Labels' : 'Show Labels'}
                  </button>
                </div>
              </div>

              {/* Image thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-2 bg-slate-950 border-t border-slate-800 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setSelectedAnnotation(null);
                      }}
                      className={`flex-shrink-0 w-16 h-12 rounded border-2 transition-all ${
                        idx === selectedImageIndex
                          ? 'border-purple-500 ring-1 ring-purple-500/50'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-pink-900/30 to-purple-900/30 flex items-center justify-center">
                        <span className="text-[8px] text-slate-400">{img.magnification}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="w-72 border-l border-slate-700 bg-slate-900/50 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    {currentImage?.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {currentImage?.description}
                  </p>
                </div>

                {/* Stain Info */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <h4 className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Stain Type
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {STAIN_DESCRIPTIONS[currentImage?.stainType || 'Other']}
                  </p>
                </div>

                {/* Annotations list */}
                {currentImage?.annotations && currentImage.annotations.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Structures
                    </h4>
                    <div className="space-y-1">
                      {currentImage.annotations.map(annotation => (
                        <button
                          key={annotation.id}
                          onClick={() => handleAnnotationClick(annotation.id)}
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                            selectedAnnotation === annotation.id
                              ? 'bg-purple-500/20 text-purple-200'
                              : 'hover:bg-slate-800/50 text-slate-400'
                          }`}
                        >
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: annotation.color || '#3b82f6' }}
                          />
                          {annotation.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected annotation details */}
                {selectedAnnotation && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    {(() => {
                      const annotation = currentImage?.annotations?.find(a => a.id === selectedAnnotation);
                      return annotation ? (
                        <>
                          <h4 className="text-xs font-semibold text-purple-200 mb-1">
                            {annotation.label}
                          </h4>
                          <p className="text-[11px] text-slate-300">
                            {annotation.description}
                          </p>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Educational Notes */}
                {currentImage?.educationalNotes && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <h4 className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">
                      Educational Notes
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentImage.educationalNotes}
                    </p>
                  </div>
                )}

                {/* Clinical Relevance */}
                {currentImage?.clinicalRelevance && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <h4 className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                      Clinical Relevance
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentImage.clinicalRelevance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistologyViewer;
