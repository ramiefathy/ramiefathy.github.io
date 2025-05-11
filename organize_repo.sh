# Step 2: Create the new directory structure
echo "Creating directories..."
mkdir -p assets/css
mkdir -p assets/js
mkdir -p assets/images
mkdir -p documents
mkdir -p analyses/namcs-topical-abx-biopsy
mkdir -p analyses/melanoma-aca
mkdir -p analyses/surgery-cyoa
mkdir -p analyses/ctcl
mkdir -p analyses/empd
mkdir -p analyses/wound-care-webpages
mkdir -p analyses/cd30-lymphoma
mkdir -p analyses/mycosis-fungoides
mkdir -p analyses/pcgdtcl # For Primary Cutaneous Gamma-Delta T-cell Lymphoma
mkdir -p analyses/sptcl # For Subcutaneous Panniculitis-like T-cell Lymphoma
mkdir -p analyses/sezary-syndrome
mkdir -p analyses/mammary-paget-disease
mkdir -p analyses/r-dermatology-subreddit-analysis
mkdir -p analyses/aad-modules-analysis
mkdir -p analyses/radiology-cyoa-analysis
echo "Directory creation complete."
echo ""

# Step 3: Move files using git mv
echo "Moving files..."

# Move assets
git mv style.css assets/css/style.css
git mv data.js assets/js/data.js
git mv favicon.ico assets/favicon.ico
git mv logo.pptx assets/images/logo.pptx

# Move documents
git mv "2013_PUF_Data_Dictionary.pdf" documents/
git mv "2014_PUF_Data_Dictionary.pdf" documents/
git mv "2015_PUF_Data_Dictionary.pdf" documents/
git mv "AAD Modules Combined.xls" documents/
git mv "ICD-O-3.pdf" documents/
git mv "NAMCSdoc2013.pdf" documents/
git mv "NAMCSdoc2014.pdf" documents/
git mv "NAMCSdoc2015.pdf" documents/
git mv "PBL.Faculty.Survey.pdf" documents/
git mv "PUF_Supplemental_Documentation.pdf" documents/
git mv "Research Website Instructions.docx" documents/
git mv "icd-o-3-site-text.pdf" documents/
git mv "lapolla2011.pdf" documents/
git mv "r_dermatology analysis data dictionary.docx" documents/

# Move analysis files and associated directories
# Note: If a file listed here doesn't exist (e.g., an Rmd source for an .nb.html), git mv will error for that specific file.
#       The associated *_files directories for .nb.html files are usually generated during rendering.
#       If they exist at the root and correspond to a moved .nb.html, they should also be moved.
#       The script assumes they are at the root if they exist.

git mv "20190813_NAMCS_TopicalAbxForBiopsyExcision_RAF.nb.html" analyses/namcs-topical-abx-biopsy/

git mv "20191014_Melanoma_ACA_nb.nb.html" analyses/melanoma-aca/
git mv "20191024_Melanoma_ACA.nb.html" analyses/melanoma-aca/ # Likely related or updated

git mv "20191021_SurgeryCYOA_RAF.nb.html" analyses/surgery-cyoa/

git mv "20191024_CTCL.nb.html" analyses/ctcl/
git mv "20191026_CTCL.nb.html" analyses/ctcl/
git mv "20191028_CTCL.nb.html" analyses/ctcl/
git mv "20191028_CTCL.nb2.html" analyses/ctcl/ # or 20191028_CTCL2.nb.html, check exact name
git mv "20191028_CTCL2.nb.html" analyses/ctcl/ # if different from nb2

git mv "20191024_EMPD.nb.html" analyses/empd/
git mv "20191105_EMPD.nb.html" analyses/empd/
git mv "20191218_EMPD.nb.html" analyses/empd/

git mv "20191121_WoundCareWebpages.html" analyses/wound-care-webpages/
git mv "20191121_WoundCareWebpages2.html" analyses/wound-care-webpages/ # This is also the file named "WoundCareWebpages.html" per SHA
git mv "WoundCareWebpages.html" analyses/wound-care-webpages/ # This has the same SHA as 20191121_WoundCareWebpages2.html, moving it to avoid confusion

git mv "20191216_CD30+.nb.nb.html" analyses/cd30-lymphoma/ # Check exact name for '+' if it causes issues
git mv "20191216_CD30.nb.html" analyses/cd30-lymphoma/

# Mycosis Fungoides - handle variants, ensure you quote filenames with spaces
git mv "20191216_Mycosis Fungoides.nb.html" "analyses/mycosis-fungoides/20191216_Mycosis Fungoides.nb.html"
git mv "20191216_Mycosis Fungoides.nb.nb.html" "analyses/mycosis-fungoides/20191216_Mycosis Fungoides.nb.nb.html"
git mv "20191216_Mycosis_Fungoides.nb.html" analyses/mycosis-fungoides/ # Underscore version

# Primary Cutaneous Gamma-Delta T-cell Lymphoma - handle variants
git mv "20191216_Primary Cutaneous Gamma-Delta T-cell Lymphoma.nb.html" "analyses/pcgdtcl/20191216_Primary Cutaneous Gamma-Delta T-cell Lymphoma.nb.html"
git mv "20191216_Primary_Cutaneous_Gamma-Delta_T-cell_Lymphoma.nb.html" analyses/pcgdtcl/

git mv "20191216_SPTCL.nb.html" analyses/sptcl/

# Sezary Syndrome - handle variants
git mv "20191216_Sezary Syndome.nb.nb.html" "analyses/sezary-syndrome/20191216_Sezary Syndome.nb.nb.html" # Note "Syndome" typo if present in filename
git mv "20191216_Sezary_Syndome.nb.html" "analyses/sezary-syndrome/20191216_Sezary_Syndome.nb.html" # Note "Syndome" typo
git mv "20191216_Sezary_Syndrome.nb.html" analyses/sezary-syndrome/ # Correct spelling

git mv "20191218_Mammary_Paget_Disease.nb.html" analyses/mammary-paget-disease/

git mv "20200102_r_dermatology_analysis_RAF.html" analyses/r-dermatology-subreddit-analysis/
git mv "20200102_r_dermatology_analysis_RAF.nb.html" analyses/r-dermatology-subreddit-analysis/

# AAD Modules Analysis - includes Rmd, html, pdf, and a _files directory
git mv "20200625_AAD Modules Analysis_RAF.Rmd" "analyses/aad-modules-analysis/20200625_AAD Modules Analysis_RAF.Rmd"
git mv "20200625_AAD-Modules-Analysis_RAF.html" analyses/aad-modules-analysis/
git mv "20200625_AAD-Modules-Analysis_RAF.pdf" analyses/aad-modules-analysis/
# If the _files directory exists at the root, move it. Otherwise, RMarkdown will recreate it in the new location on render.
if [ -d "20200625_AAD-Modules-Analysis_RAF_files" ]; then
  git mv "20200625_AAD-Modules-Analysis_RAF_files" analyses/aad-modules-analysis/
fi

git mv "Radiology CYOA Analysis.nb.html" "analyses/radiology-cyoa-analysis/Radiology CYOA Analysis.nb.html"

echo "File moving complete."
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Review the changes: Use 'git status' to see all staged changes."
echo "2. Update references: Manually edit your .Rmd files, _site.yml, and any other relevant files to point to the new locations of these moved files."
echo "3. Test locally: Re-render your site (e.g., using rmarkdown::render_site() or your build_site.R script) and check for broken links or rendering errors."
echo "4. Commit: Once satisfied, commit these changes (e.g., git commit -m \"Organize repository file structure\")."
