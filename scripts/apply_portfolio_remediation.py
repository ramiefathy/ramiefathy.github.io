#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
TODAY = "2026-08-05"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def append_once(path: str, marker: str, content: str) -> None:
    text = read(path)
    if marker not in text:
        write(path, text + "\n" + content)


def add_body_slug(path: str, slug: str) -> None:
    text = read(path)
    if f'data-app-slug="{slug}"' in text:
        return
    replaced, n = re.subn(r"<body(\s|>)", f'<body data-app-slug="{slug}"\\1', text, count=1, flags=re.I)
    if n != 1:
        raise RuntimeError(f"Unable to add body slug to {path}")
    write(path, replaced)


# ---------------------------------------------------------------------------
# 1. Authoritative portfolio manifest
# ---------------------------------------------------------------------------
apps_path = SITE / "src/data/apps.json"
apps = json.loads(apps_path.read_text(encoding="utf-8"))
by_slug = {app["slug"]: app for app in apps}

new_apps = {
    "dermatotarget-atlas": {
        "name": "DermatoTarget Atlas",
        "slug": "dermatotarget-atlas",
        "description": "Auditable public-data target-prioritization workbench across immune-mediated skin diseases.",
        "featured": True,
        "status": "active",
        "stack": ["Public Data", "Target Prioritization", "Reproducible Research"],
        "href": "/apps/dermatotarget-atlas/",
        "preview": "/apps/dermatotarget-atlas/",
        "accent": ["#334155", "#0f766e"],
    },
    "jeopagen": {
        "name": "JeopaGen",
        "slug": "jeopagen",
        "description": "Source-grounded Jeopardy-style game studio with review and offline export workflows.",
        "featured": True,
        "status": "active",
        "stack": ["React", "Source Grounding", "HTML/PPTX Export"],
        "href": "https://jeopagen.ramiefathy.com/",
        "preview": "https://jeopagen.ramiefathy.com/",
        "accent": ["#7c3aed", "#0f766e"],
    },
    "woundcare-archive": {
        "name": "Wound Care Webpages (2019 Archive)",
        "slug": "woundcare-archive",
        "description": "Historical 2019 wound-care reference preserved for code and methodology history only.",
        "status": "legacy",
        "listed": False,
        "stack": ["Historical Archive"],
        "href": "/apps/WoundCareWebpages.html",
    },
}
for slug, app in new_apps.items():
    if slug not in by_slug:
        apps.append(app)
        by_slug[slug] = app

metadata = {
    "dermatology-scribe": dict(category="clinical", outcome="Draft and review dermatology notes from text, audio, images, and documents in an explicitly experimental workspace.", audiences=["Dermatology clinicians", "Clinical informatics researchers"], maturity="research-prototype", visibility="public", clinicalUse="not-for-clinical-use", sortRank=10, dataFlow={"mode":"configured-backend","summary":"Browser drafts are local; connected audio, transcript, image, document, and AI requests may be sent to the configured RAMIE backend.","accountsRequired":False,"phiPolicy":"approved-deployment-only"}, quality={"acceptanceProfile":"ramie-research","lastReviewed":TODAY,"reviewIntervalDays":90,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "skinoculars": dict(category="learning", outcome="Explore normal and disease-associated skin structures in an interactive three-dimensional teaching model.", audiences=["Dermatology learners", "Educators"], maturity="educational-tool", visibility="external-public", clinicalUse="educational-only", sortRank=20, dataFlow={"mode":"local-only","summary":"Interactive rendering occurs in the browser; no patient data is required.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"educational-3d","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/Skinoculars"}),
    "dermatopathology-navigator": dict(category="learning", outcome="Study dermatopathology patterns, compare differentials, and practice retrieval through multiple reviewed learning modes.", audiences=["Dermatology residents", "Pathology learners"], maturity="educational-tool", visibility="public", clinicalUse="educational-only", sortRank=30, dataFlow={"mode":"local-only","summary":"Study state is stored locally in the browser unless an explicitly configured integration is used.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"dermpath-learning","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "mindmaps": dict(category="learning", outcome="Search and traverse dermatology concepts across diagnostic, mechanistic, and treatment maps.", audiences=["Dermatology learners", "Clinician educators"], maturity="reviewed-reference", visibility="public", clinicalUse="educational-reference", sortRank=40, dataFlow={"mode":"local-only","summary":"Maps and search run in the browser; annotations remain local.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"mindmap-reference","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "rheum-derm-immune-atlas": dict(category="reference", outcome="Trace evidence-graded relationships among diseases, pathways, manifestations, and therapies.", audiences=["Dermatologists", "Rheumatologists", "Researchers", "Educators"], maturity="reviewed-reference", visibility="public", clinicalUse="educational-reference", sortRank=10, dataFlow={"mode":"static-reference","summary":"The evidence atlas is delivered as a static, non-PHI reference application.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"evidence-atlas","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "rheum-derm-clinical-trials": dict(category="reference", outcome="Compare landmark and emerging rheum–derm studies by disease, intervention, endpoint, route, and evidence record.", audiences=["Trialists", "Dermatologists", "Rheumatologists"], maturity="research-companion", visibility="public", clinicalUse="research-reference", sortRank=20, dataFlow={"mode":"static-reference","summary":"The dashboard is a static evidence artifact and does not accept patient data.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"trials-evidence","lastReviewed":TODAY,"reviewIntervalDays":90,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "dermoscopy-llm-dashboard": dict(category="research", outcome="Inspect repeated multimodal-LLM dermoscopy evaluations while preserving the 100-image experimental denominator.", audiences=["AI researchers", "Dermatologists", "Methodologists"], maturity="research-companion", visibility="public", clinicalUse="not-for-clinical-use", sortRank=10, dataFlow={"mode":"static-reference","summary":"The dashboard displays aggregate research results and accepts no patient data.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"research-dashboard","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "ksa-sovereign-credit-analytics": dict(category="research", outcome="Monitor Saudi sovereign bonds, CDS, benchmarks, and scenarios in a private source-aware workspace.", audiences=["Authorized credit analysts"], maturity="private-internal", visibility="private-authenticated", clinicalUse="not-applicable", sortRank=90, dataFlow={"mode":"private-service","summary":"Licensed market data remains in the separately protected Docker/Postgres deployment.","accountsRequired":True,"phiPolicy":"not-applicable"}, quality={"acceptanceProfile":"private-analytics","lastReviewed":TODAY,"reviewIntervalDays":90,"reviewState":"current","sourceRepo":"separate-private-source"}),
    "biologic-monitoring": dict(category="reference", outcome="Review baseline screening, follow-up, warnings, and counseling for systemic dermatology therapies.", audiences=["Dermatology clinicians", "Pharmacists"], maturity="reviewed-reference", visibility="public", clinicalUse="clinical-reference", sortRank=30, dataFlow={"mode":"static-reference","summary":"Reference data are delivered locally and should not be used for patient-specific prescribing decisions without independent verification.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"medication-monitoring","lastReviewed":"2025-09-23","reviewIntervalDays":180,"reviewState":"review-required","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "skinscores": dict(category="clinical", outcome="Calculate and track dermatology severity instruments with explicit-input safeguards and citations.", audiences=["Dermatology clinicians", "Researchers"], maturity="clinical-workflow", visibility="external-public", clinicalUse="clinical-calculation-support", sortRank=20, dataFlow={"mode":"account-cloud","summary":"Anonymous calculations may be local; account-linked longitudinal workflows use the SkinScores Firebase deployment.","accountsRequired":False,"phiPolicy":"approved-deployment-only"}, quality={"acceptanceProfile":"clinical-calculator","lastReviewed":"2025-09-23","reviewIntervalDays":180,"reviewState":"review-required","sourceRepo":"ramiefathy/SkinScores"}),
    "pdf-tools": dict(category="productivity", outcome="Organize, extract, assemble, stamp, OCR, and clean PDFs without uploading them to an application server.", audiences=["General users", "Researchers", "Clinicians"], maturity="validated-release", visibility="public", clinicalUse="not-applicable", sortRank=10, dataFlow={"mode":"local-only","summary":"PDF operations run in the browser; the application does not upload documents.","accountsRequired":False,"phiPolicy":"local-use-only"}, quality={"acceptanceProfile":"local-document-tool","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "scheduler-pro": dict(category="clinical", outcome="Build and validate residency schedules with explicit constraints, role controls, and auditable automatic scheduling.", audiences=["Residency program administrators", "Chief residents"], maturity="production-workflow", visibility="external-public", clinicalUse="operational-workflow", sortRank=30, dataFlow={"mode":"account-cloud","summary":"Accounts, schedules, and program configuration are stored in the Clinisched Firebase deployment.","accountsRequired":True,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"scheduling-workflow","lastReviewed":TODAY,"reviewIntervalDays":90,"reviewState":"current","sourceRepo":"ramiefathy/clinisched"}),
    "dermai-reference": dict(category="productivity", outcome="Historical documentation for an incomplete reference-extraction prototype.", audiences=["Developers"], maturity="historical-archive", visibility="archived", clinicalUse="not-for-clinical-use", sortRank=90, dataFlow={"mode":"static-reference","summary":"Archived documentation only.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"archive","lastReviewed":TODAY,"reviewIntervalDays":365,"reviewState":"archived","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "dermascribe-legacy": dict(category="clinical", outcome="Historical static scribe prototype retained only for comparison with RAMIE.", audiences=["Developers"], maturity="historical-archive", visibility="archived", clinicalUse="not-for-clinical-use", sortRank=91, dataFlow={"mode":"static-reference","summary":"Archived prototype only.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"archive","lastReviewed":TODAY,"reviewIntervalDays":365,"reviewState":"archived","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "dermatotarget-atlas": dict(category="research", outcome="Prioritize therapeutic targets with decomposable scores, sensitivity analyses, negative controls, and source-level audit trails.", audiences=["Translational researchers", "Drug-development teams"], maturity="research-companion", visibility="public", clinicalUse="not-for-clinical-use", sortRank=20, dataFlow={"mode":"static-reference","summary":"Public non-PHI research data are delivered as a static workbench.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"target-prioritization","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
    "jeopagen": dict(category="learning", outcome="Turn source documents into reviewed Jeopardy-style games with offline HTML, PowerPoint, and answer-key exports.", audiences=["Educators", "Learners"], maturity="validated-release", visibility="external-public", clinicalUse="educational-only", sortRank=50, dataFlow={"mode":"local-with-optional-provider","summary":"Files are parsed in the browser; AI actions send selected source material directly to the user-configured Gemini API.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"source-grounded-generation","lastReviewed":TODAY,"reviewIntervalDays":180,"reviewState":"current","sourceRepo":"ramiefathy/JeopaGen"}),
    "woundcare-archive": dict(category="reference", outcome="Preserve the dated 2019 wound-care artifact for historical review only.", audiences=["Developers", "Historians"], maturity="historical-archive", visibility="archived", clinicalUse="not-for-clinical-use", sortRank=99, dataFlow={"mode":"static-reference","summary":"Archived static content.","accountsRequired":False,"phiPolicy":"prohibited"}, quality={"acceptanceProfile":"archive","lastReviewed":"2019-11-21","reviewIntervalDays":365,"reviewState":"archived","sourceRepo":"ramiefathy/ramiefathy.github.io"}),
}

for slug, values in metadata.items():
    if slug not in by_slug:
        raise RuntimeError(f"Missing app record for {slug}")
    by_slug[slug].update(values)
    by_slug[slug].setdefault("listed", values["visibility"] in {"public", "external-public"})
by_slug["ksa-sovereign-credit-analytics"]["listed"] = False
for slug in ("dermai-reference", "dermascribe-legacy", "woundcare-archive"):
    by_slug[slug]["listed"] = False
apps_path.write_text(json.dumps(apps, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

acceptance = {"schemaVersion":"1.0.0","generatedFor":TODAY,"commonReleaseGates":["Deterministic source-to-build provenance is recorded.","Unit/policy tests, production build, and desktop/mobile browser acceptance pass.","No uncaught runtime errors, failed same-origin requests, or document-level horizontal overflow occur.","Keyboard focus, reduced-motion behavior, semantic landmarks, and visible labels are verified.","Privacy, maturity, clinical-use boundary, data flow, release version, and review currency are visible.","Every exported artifact includes application/data version and a reproducible source reference where applicable."],"apps":{}}
app_specific = {
    "dermatology-scribe":["All existing chat, transcription, image/document, DDx, plan, note, session, and export controls remain reachable.","A prominent Research prototype boundary is visible above the fold.","Connected-backend data flow and PHI restrictions are explicit.","No generated clinical statement is represented as validated medical advice."],
    "skinoculars":["Disease transformations are labeled schematic rather than quantitatively validated histology.","Every modeled disease has an evidence-status and limitation record.","A non-3D semantic explanation remains available."],
    "dermatopathology-navigator":["Task-first entry points expose pattern identification, comparison, cases, and review.","Deduplicated concepts retain discriminating clinical and histologic distinctions.","All learning modes remain operational."],
    "mindmaps":["All manifests and nodes pass schema validation.","Cross-topic search returns deep links without exposing unsanitized markup.","Exports, deep links, keyboard access, and local state recovery pass."],
    "rheum-derm-immune-atlas":["Direct, derived, explicit-zero, filtered, and unknown relations remain distinct.","Every visible relation preserves source provenance and denominator context.","No overlap visualization implies efficacy, dose response, synergy, or safety."],
    "rheum-derm-clinical-trials":["The immutable dashboard artifact exactly matches its verified shard manifest.","A release manifest, methods page, accessible fallback, and data dictionary ship with the app.","Trial/program records are not presented as proof of positive efficacy."],
    "dermoscopy-llm-dashboard":["The UI distinguishes 100 unique images from 10,200 repeated evaluations.","Methods, model-snapshot, sampling, and repeated-measures limitations are visible.","The dashboard is not represented as a clinical diagnostic benchmark."],
    "biologic-monitoring":["Indications are structurally distinct from caution conditions.","Every entry has source links and visible content-review currency.","The September 23, 2025 source set is visibly flagged for re-review.","No output claims patient-specific prescribing appropriateness."],
    "skinscores":["Required inputs never receive silent clinical defaults.","Every instrument has a versioned registry record, source, intended population, missing-data rule, and reference vectors.","Longitudinal/account workflows disclose storage and deletion behavior."],
    "pdf-tools":["No document is transmitted to a non-same-origin endpoint.","All tools complete with deterministic output summaries and recoverable errors.","The UI does not call visual overlays secure redaction."],
    "scheduler-pro":["Every generated assignment has an auditable constraint explanation.","Tenant and role isolation, fairness metrics, publication versions, and rollback paths pass.","Schedule generation never silently overwrites protected assignments."],
    "dermatotarget-atlas":["Scores remain decomposable and sensitivity analyses are available.","Negative controls, empirical nulls, run metadata, and source snapshots are retained.","Rank is never presented as causal proof or efficacy."],
    "jeopagen":["Every generated item retains source-document and location provenance.","Human review is required before final export.","HTML/PPTX/answer-key exports and recovery pass on desktop and mobile.","No API key is embedded in a release artifact."],
    "woundcare-archive":["The 2019 date and historical-only status are unavoidable.","The route is excluded from the active catalog and search.","No current clinical-use claim is displayed."],
}
for app in apps:
    acceptance["apps"][app["slug"]] = {"profile":app["quality"]["acceptanceProfile"],"criteria":app_specific.get(app["slug"],["The application satisfies its declared maturity, privacy, accuracy, and release contract."])}
write("site/src/data/app-acceptance.json", json.dumps(acceptance, indent=2, ensure_ascii=False))

private_routes = {"schemaVersion":"1.0.0","defaultPublicBuildPolicy":"deny","routes":[
    {"route":"/tasks/","output":"tasks","classification":"private-internal","reason":"Account-backed personal task data require an authenticated deployment."},
    {"route":"/apps/dermie-vc-prep-rf-20260514-x7q9m2/","output":"apps/dermie-vc-prep-rf-20260514-x7q9m2","classification":"confidential-business","reason":"Pitch assumptions and financial materials must not rely on an unlisted URL."},
    {"route":"/strategy/egypt-ai-portfolio/","output":"strategy/egypt-ai-portfolio","classification":"private-strategy","reason":"Strategy source materials require an explicitly approved publication or authenticated deployment."},
    {"route":"/apps/dermatopathology-modern/test-fixes.html","output":"apps/dermatopathology-modern/test-fixes.html","classification":"test-only","reason":"Test fixtures belong in CI artifacts rather than production."},
]}
write("site/src/data/private-routes.json", json.dumps(private_routes, indent=2))

# ---------------------------------------------------------------------------
# 2. Catalog and public manifest
# ---------------------------------------------------------------------------
write("site/src/pages/apps/index.astro", dedent('''
---
import MainLayout from '../../layouts/MainLayout.astro';
import Header from '../../components/Header.jsx';
import apps from '../../data/apps.json';
const CATEGORY_ORDER = ['clinical', 'research', 'reference', 'learning', 'productivity'];
const CATEGORY_LABELS = { all:'All',featured:'Featured',clinical:'Clinical',research:'Research',reference:'Reference',learning:'Learning',productivity:'Productivity' };
const MATURITY_LABELS = {'research-prototype':'Research prototype','research-companion':'Research companion','reviewed-reference':'Reviewed reference','educational-tool':'Educational tool','clinical-workflow':'Clinical workflow','production-workflow':'Production workflow','validated-release':'Validated release'};
const FLOW_LABELS = {'local-only':'Runs locally','static-reference':'Static reference','configured-backend':'Configured backend','account-cloud':'Account-backed cloud','local-with-optional-provider':'Local + optional AI provider','private-service':'Private service'};
const active = apps.filter((app)=>app.status==='active'&&app.listed!==false&&['public','external-public'].includes(app.visibility)).sort((a,b)=>{if(Boolean(a.featured)!==Boolean(b.featured))return a.featured?-1:1;const c=CATEGORY_ORDER.indexOf(a.category)-CATEGORY_ORDER.indexOf(b.category);if(c)return c;const r=(a.sortRank??999)-(b.sortRank??999);return r||a.name.localeCompare(b.name)});
const categories=['all','featured',...CATEGORY_ORDER.filter((c)=>active.some((a)=>a.category===c))];
const counts=Object.fromEntries(categories.map((c)=>[c,c==='all'?active.length:c==='featured'?active.filter((a)=>a.featured).length:active.filter((a)=>a.category===c).length]));
---
<MainLayout title="Applications – Ramie Fathy, MD" description="Reviewed clinical, learning, research, reference, and productivity applications."><Header client:load /><main id="main-content"><section class="section"><div class="section-marker"><b>$</b><span>ls apps --reviewed</span></div><div class="section-head"><div><span class="kicker">Applications</span><h1 class="display1" style="margin-top:14px">Purpose-built<br><em>working tools</em>.</h1></div><div class="right">Clinical, research, learning,<br>reference, and workflow tools.<br><span style="color:var(--terracotta)">Each card states maturity and data flow.</span></div></div><p class="lede">The catalog distinguishes validated workflows, reviewed references, educational tools, and research prototypes. Open an application to see its clinical-use, privacy, evidence-currency, and release boundaries.</p><div class="apps-toolbar" style="margin-top:48px"><div class="left" id="apps-filters">{categories.map((category,index)=><button class={index===0?'active':''} data-filter={category} aria-pressed={index===0?'true':'false'}>{CATEGORY_LABELS[category]} <span class="c">{counts[category]}</span></button>)}</div><div class="right apps-search-wrap"><label for="apps-search">Search applications</label><span aria-hidden="true">›</span><input id="apps-search" type="search" placeholder="outcome, audience, stack, or category…" /></div></div><p id="apps-result-count" class="apps-result-count" aria-live="polite">Showing {active.length} applications.</p><div class="apps-plates" id="apps-grid">{active.map((app,idx)=>{const isExternal=app.href.startsWith('http');const searchText=[app.name,app.outcome,app.description,app.category,...(app.audiences||[]),...(app.stack||[])].join(' ').toLowerCase();return <a class={`app-plate cat-${app.category}`} href={app.href} target={isExternal?'_blank':undefined} rel={isExternal?'noreferrer':undefined} data-search={searchText} data-category={app.category} data-featured={app.featured?'true':'false'} data-maturity={app.maturity}><span class="swatch"></span><div class="stamp"><span class="pn">{String(idx+1).padStart(2,'0')}</span><span class={`st ${app.featured?'featured':''}`}>{MATURITY_LABELS[app.maturity]||app.maturity}</span></div><h4>{app.name.replace(/^RAMIE - /,'RAMIE — ')}</h4><p class="app-outcome">{app.outcome}</p><p class="app-boundary"><strong>{FLOW_LABELS[app.dataFlow.mode]||app.dataFlow.mode}</strong> · {app.dataFlow.phiPolicy==='prohibited'?'No PHI':app.dataFlow.phiPolicy==='approved-deployment-only'?'PHI only in an approved deployment':app.dataFlow.summary}</p><div class="stack">{(app.stack||[]).slice(0,3).map((tag)=><span>{tag}</span>)}</div></a>})}</div><div id="apps-empty" class="apps-empty" hidden><h2>No matching application</h2><p>Clear the search or choose another category.</p></div></section></main><script>const buttons=Array.from(document.querySelectorAll('#apps-filters button'));const search=document.getElementById('apps-search');const cards=Array.from(document.querySelectorAll('#apps-grid .app-plate'));const count=document.getElementById('apps-result-count');const empty=document.getElementById('apps-empty');let filter='all',query='';const apply=()=>{let visible=0;cards.forEach((card)=>{const filterMatch=filter==='all'||(filter==='featured'?card.dataset.featured==='true':card.dataset.category===filter);const searchMatch=!query||(card.dataset.search||'').includes(query);const show=filterMatch&&searchMatch;card.hidden=!show;if(show)visible+=1});count.textContent=`Showing ${visible} application${visible===1?'':'s'}.`;empty.hidden=visible!==0};buttons.forEach((button)=>button.addEventListener('click',()=>{buttons.forEach((item)=>{item.classList.remove('active');item.setAttribute('aria-pressed','false')});button.classList.add('active');button.setAttribute('aria-pressed','true');filter=button.dataset.filter||'all';apply()}));search?.addEventListener('input',()=>{query=search.value.trim().toLowerCase();apply()});</script><style>.apps-search-wrap{display:flex;align-items:center;gap:10px}.apps-search-wrap label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.app-outcome{font-size:16px!important;color:var(--ink)!important}.app-boundary{font-size:12px!important;line-height:1.45!important;border-top:1px solid var(--line);padding-top:12px;margin-top:16px!important}.app-boundary strong{color:var(--terracotta)}.apps-result-count{font:12px var(--font-mono);color:var(--muted);margin:18px 0}.apps-empty{border:1px solid var(--line);padding:32px;margin-top:20px}.app-plate[hidden]{display:none}</style></MainLayout>
'''))

write("site/src/pages/data/app-manifest.json.ts", dedent('''
import type { APIRoute } from 'astro';
import apps from '../../data/apps.json';
export const prerender = true;
export const GET: APIRoute = async () => new Response(JSON.stringify({schemaVersion:'1.0.0',generatedFrom:'site/src/data/apps.json',apps:apps.map(({name,slug,href,status,listed,category,outcome,audiences,maturity,visibility,clinicalUse,dataFlow,quality})=>({name,slug,href,status,listed,category,outcome,audiences,maturity,visibility,clinicalUse,dataFlow,quality}))},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300'}});
'''))

# ---------------------------------------------------------------------------
# 3. Shared application boundaries and review currency
# ---------------------------------------------------------------------------
append_once("site/public/apps/shared/legacy-shell.js", "PORTFOLIO_GOVERNANCE_NOTICE_V1", dedent('''
/* PORTFOLIO_GOVERNANCE_NOTICE_V1 */
(() => { const normalize=(value)=>value.replace(/\/+$/,'')||'/'; const routeMatches=(app,pathname)=>{if(!app?.href||app.href.startsWith('http'))return false;const target=normalize(new URL(app.href,window.location.origin).pathname);return normalize(pathname)===target||normalize(pathname).startsWith(`${target}/`)}; const formatDate=(value)=>value?new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(`${value}T00:00:00Z`)):'not recorded'; const mount=async()=>{if(document.querySelector('[data-portfolio-notice]'))return;try{const response=await fetch('/data/app-manifest.json',{cache:'no-cache'});if(!response.ok)return;const manifest=await response.json();const app=manifest.apps.find((entry)=>routeMatches(entry,window.location.pathname)||document.body.dataset.appSlug===entry.slug);if(!app)return;const notice=document.createElement('section');notice.dataset.portfolioNotice=app.slug;notice.className=`portfolio-app-notice portfolio-app-notice--${app.maturity}`;notice.setAttribute('aria-label','Application status and use boundary');const review=app.quality?.lastReviewed?`Content review: ${formatDate(app.quality.lastReviewed)}${app.quality.reviewState==='review-required'?' · review required':''}`:'Content review date not recorded';const boundary=app.clinicalUse==='not-for-clinical-use'?'Not validated for clinical care.':app.clinicalUse==='educational-only'?'Educational use only.':'';notice.innerHTML=`<div><span class="portfolio-app-notice__label">${app.maturity.replaceAll('-',' ')}</span><strong>${app.name}</strong></div><p>${boundary} ${app.dataFlow.summary}</p><small>${review}</small>`;const shell=document.querySelector('.legacy-shell');if(shell?.parentNode)shell.parentNode.insertBefore(notice,shell.nextSibling);else document.body.insertBefore(notice,document.body.firstChild)}catch(error){console.warn('Portfolio status metadata unavailable',error)}};window.addEventListener('DOMContentLoaded',()=>queueMicrotask(mount));})();
'''))
append_once("site/public/apps/shared/legacy-shell.css", "PORTFOLIO_GOVERNANCE_NOTICE_V1", dedent('''
/* PORTFOLIO_GOVERNANCE_NOTICE_V1 */
.portfolio-app-notice{margin:0;padding:12px clamp(16px,3vw,36px);display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.6fr) auto;gap:18px;align-items:center;border-bottom:1px solid var(--legacy-border,#d7dce2);background:#f8fafc;color:#172033;font:13px/1.45 system-ui,sans-serif}.portfolio-app-notice--research-prototype{background:#fff7ed;border-color:#fdba74}.portfolio-app-notice__label{display:block;font:700 10px/1.2 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em;color:#9a3412;margin-bottom:3px}.portfolio-app-notice strong{display:block;font-size:14px}.portfolio-app-notice p,.portfolio-app-notice small{margin:0}.portfolio-app-notice small{color:#5f6878;text-align:right}@media(max-width:760px){.portfolio-app-notice{grid-template-columns:1fr;gap:5px}.portfolio-app-notice small{text-align:left}}
'''))

# ---------------------------------------------------------------------------
# 4. RAMIE: preserve all capabilities; make prototype/data flow unavoidable
# ---------------------------------------------------------------------------
ramie_html = "site/public/apps/dermatology-scribe/index.html"
add_body_slug(ramie_html, "dermatology-scribe")
text = read(ramie_html)
if "ramie-prototype-banner" not in text:
    text, n = re.subn(r'(<main class="ramie-landing__main"[^>]*>)', r'''\1
                <section class="ramie-prototype-banner" data-portfolio-notice="dermatology-scribe" aria-label="RAMIE research-use boundary">
                    <span>Research prototype</span>
                    <strong>Feature-rich experimental dermatology assistant</strong>
                    <p>RAMIE retains chat, transcription, image/document analysis, differential, plan, note, session, and export workflows. It is not validated for clinical care. Do not enter PHI unless this client is connected to an institutionally approved deployment.</p>
                </section>''', text, count=1)
    if n != 1: raise RuntimeError("Unable to insert RAMIE prototype banner")
if "ramieDataFlowDisclosure" not in text:
    text = text.replace('                <div class="ramie-bottom-bar"', '                <p id="ramieDataFlowDisclosure" class="ramie-data-flow" role="status" aria-live="polite">No backend connected. Draft state remains in this browser; connected AI workflows may transmit data to the configured backend.</p>\n\n                <div class="ramie-bottom-bar"', 1)
write(ramie_html, text)
append_once("site/public/apps/dermatology-scribe/style-modern.css", "RAMIE_RESEARCH_PROTOTYPE_V1", dedent('''
/* RAMIE_RESEARCH_PROTOTYPE_V1 */
.ramie-prototype-banner{border:1px solid #fdba74;background:#fff7ed;padding:14px 16px;border-radius:12px;margin-bottom:18px;color:#431407}.ramie-prototype-banner span{display:block;font:700 10px/1.2 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.14em;color:#9a3412}.ramie-prototype-banner strong{display:block;margin:4px 0;font-size:15px}.ramie-prototype-banner p{margin:0;font-size:12px;line-height:1.5}.ramie-data-flow{font-size:12px;line-height:1.5;color:#475569;border-top:1px solid #e2e8f0;padding-top:12px;margin-top:16px}
'''))
append_once("site/public/apps/dermatology-scribe/app.js", "RAMIE_RESEARCH_PROTOTYPE_RUNTIME_V1", dedent('''
/* RAMIE_RESEARCH_PROTOTYPE_RUNTIME_V1 */
(() => { const disclosure=()=>document.getElementById('ramieDataFlowDisclosure'); const configuredUrl=()=>localStorage.getItem('dermascribe.websocketUrl')||sessionStorage.getItem('dermascribe.websocketUrl')||''; const update=()=>{const node=disclosure();if(!node)return;const value=configuredUrl();if(!value){node.textContent='No backend connected. Draft state remains in this browser; audio, transcript, image, document, and AI requests cannot be processed until a backend is configured.';return}try{const host=new URL(value).host;node.textContent=`Connected backend: ${host}. Audio, transcripts, images, documents, prompts, and generated outputs may be sent to that configured service. RAMIE remains a research prototype.`}catch{node.textContent='A backend value is stored but is not a valid ws:// or wss:// URL. Review Connection settings before transmitting data.'}};window.addEventListener('DOMContentLoaded',()=>{update();document.getElementById('saveBackendConfigBtn')?.addEventListener('click',()=>setTimeout(update,0));document.getElementById('startTranscriptionModeCard')?.setAttribute('title','Research prototype audio workflow; requires a configured RAMIE backend.')});window.addEventListener('storage',update)})();
'''))

# ---------------------------------------------------------------------------
# 5. Biologic monitoring
# ---------------------------------------------------------------------------
bio_html = "site/public/apps/biologic-monitoring-dashboard/index.html"
add_body_slug(bio_html, "biologic-monitoring")
text = read(bio_html)
text = text.replace('FDA prescribing information and consensus guidelines updated September&nbsp;23,&nbsp;2025. Use it to double-check baseline labs,', 'a source set last clinically reviewed September&nbsp;23,&nbsp;2025 and now flagged for re-review. Use it to organize, then independently verify, baseline labs,')
if "clinical-review-alert" not in text:
    text = text.replace('          <nav class="jump-nav"', '          <div class="clinical-review-alert" role="status"><strong>Clinical content review required.</strong> The embedded source set was last reviewed September 23, 2025. Confirm current prescribing information and institutional policy before use.</div>\n          <nav class="jump-nav"', 1)
write(bio_html, text)
append_once("site/public/apps/biologic-monitoring-dashboard/styles.css", "BIOLOGIC_REVIEW_BOUNDARY_V1", '/* BIOLOGIC_REVIEW_BOUNDARY_V1 */\n.clinical-review-alert{margin-top:18px;padding:12px 14px;border:1px solid #f59e0b;background:#fffbeb;color:#78350f;border-radius:10px;font-size:13px;line-height:1.5}.clinical-review-alert strong{display:block}')
bio_data = "site/public/apps/biologic-monitoring-dashboard/data.js"
text = read(bio_data)
old = "conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'hidradenitis-suppurativa', 'crohns-disease'],"
new = "conditions: ['plaque-psoriasis', 'psoriatic-arthritis', 'hidradenitis-suppurativa'],\n    cautionConditions: ['crohns-disease', 'ulcerative-colitis'],"
if old in text: text = text.replace(old, new, 1)
if "dataReviewStatus" not in text: text += "\nexport const dataReviewStatus = Object.freeze({ lastClinicalReview: '2025-09-23', nextReviewDue: '2026-03-23', status: 'review-required' });\n"
write(bio_data, text)
write("site/public/apps/biologic-monitoring-dashboard/clinical-content-contract.json", json.dumps({"schemaVersion":"1.0.0","lastClinicalReview":"2025-09-23","nextReviewDue":"2026-03-23","status":"review-required","requiredSeparation":["approved or evidence-supported indications","caution conditions","contraindications","label-required monitoring","guideline recommendations","institution-specific policy"],"patientSpecificPrescribing":False,"provenanceRequirement":"Every displayed baseline task, interval, warning, threshold, and hold criterion must remain linked to a current primary label or guideline source."}, indent=2))

# ---------------------------------------------------------------------------
# 6. Dermoscopy denominator/methods boundary
# ---------------------------------------------------------------------------
write("site/src/pages/research/dermoscopy-llm-dashboard.astro", dedent('''
---
import MainLayout from '../../layouts/MainLayout.astro';
import Header from '../../components/Header.jsx';
import DermoscopyLLMEvaluationDashboard from '../../components/DermoscopyLLMEvaluationDashboard.jsx';
---
<MainLayout title="Dermoscopy LLM Evaluation Dashboard – Ramie Fathy, MD" description="Research dashboard for 100 dermoscopy images evaluated repeatedly across 17 models and 6 prompting strategies."><Header client:load /><main id="main-content"><section class="section"><div class="section-marker"><b>$</b><span>open dermoscopy-llm-eval</span></div><div class="section-head"><div><span class="kicker">Research companion</span><h1 class="display1" style="margin-top:14px"><em>100 images.</em><br>10,200 repeated evaluations.</h1></div><div class="right">17 model configurations.<br>6 prompting strategies.<br><span style="color:var(--terracotta)">Not a clinical diagnostic tool.</span></div></div><div class="dash-cover"><div class="text"><span class="kicker">Question · Method · Limit</span><p class="lede" style="font-size:22px">How consistently did the evaluated multimodal model snapshots classify a fixed dermoscopy image set under different prompting strategies?</p><p class="body-copy">The experimental unit must not be confused with the repeated observation count: 100 unique images generated 10,200 model × prompt evaluations across 8 diagnostic labels.</p><div style="display:flex;gap:24px;margin-top:14px"><a class="button button--secondary" href="/research">Back to research →</a><a class="button button--primary" href="#methods">Read methods boundary →</a></div></div><div class="meta"><b>Unique images</b>100<b>Repeated evaluations</b>10,200<b>Models / prompts</b>17 / 6<b>Use boundary</b>Research only; no patient-level prediction.</div></div><section id="methods" class="methods-boundary" aria-labelledby="methods-heading"><div><span class="kicker">Methods boundary</span><h2 id="methods-heading">Interpret repeated observations as clustered by image.</h2></div><div><p>Model and prompt runs on the same image are not independent clinical cases. Any inferential comparison should use paired or image-clustered methods. Dashboard confidence intervals are descriptive unless the associated analysis explicitly documents clustered bootstrap or hierarchical inference.</p><dl><div><dt>Sampling</dt><dd>100 unique images across 8 configured diagnostic labels.</dd></div><div><dt>Snapshot scope</dt><dd>Results apply only to the recorded model and prompt versions at the time of evaluation.</dd></div><div><dt>Ground truth</dt><dd>See the associated study materials; the dashboard does not substitute for independent adjudication.</dd></div><div><dt>Clinical limit</dt><dd>No calibration, prospective workflow, or patient-outcome validation is implied.</dd></div></dl></div></section><div style="margin-top:48px"><DermoscopyLLMEvaluationDashboard client:load /></div></section></main></MainLayout><style>.methods-boundary{display:grid;grid-template-columns:minmax(240px,.8fr) minmax(0,1.2fr);gap:34px;margin-top:36px;padding:28px;border:1px solid var(--line);background:var(--paper)}.methods-boundary h2{font:clamp(28px,4vw,46px)/1 var(--font-display);margin:10px 0}.methods-boundary p{line-height:1.65}.methods-boundary dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.methods-boundary dl div{border-top:1px solid var(--line);padding-top:10px}.methods-boundary dt{font:700 11px var(--font-mono);text-transform:uppercase;letter-spacing:.1em}.methods-boundary dd{margin:5px 0;color:var(--muted)}@media(max-width:780px){.methods-boundary,.methods-boundary dl{grid-template-columns:1fr}}</style>
'''))
write("site/public/data/dermoscopy-llm-methods.json", json.dumps({"schemaVersion":"1.0.0","uniqueImages":100,"repeatedEvaluations":10200,"modelConfigurations":17,"promptingStrategies":6,"diagnosticLabels":8,"analysisUnit":"image","repeatedMeasures":"model and prompt observations are clustered within image","requiredInference":"paired/image-clustered bootstrap or hierarchical analysis for inferential comparisons","clinicalUse":False,"unknownOrExternalMethods":["image sampling details","ground-truth adjudication process","exact model snapshot dates","complete prompt templates"]}, indent=2))

# ---------------------------------------------------------------------------
# 7. PDF Studio
# ---------------------------------------------------------------------------
pdf_html = "site/public/apps/pdf-studio.html"
add_body_slug(pdf_html, "pdf-tools")
text = read(pdf_html)
if "Content-Security-Policy" not in text:
    text = text.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\'; img-src \'self\' data: blob:; font-src \'self\'; worker-src \'self\' blob:; connect-src \'self\'; object-src \'none\'; base-uri \'none\'; form-action \'self\'">', 1)
if "pdf-local-boundary" not in text:
    text = text.replace('<p class="cl-page-subtitle" id="pdf-studio-subtitle">Local-first professional PDF workflows with shared preflight and output summaries.</p>', '<p class="cl-page-subtitle" id="pdf-studio-subtitle">Local-first professional PDF workflows with shared preflight and output summaries.</p>\n        <p class="pdf-local-boundary" role="status"><strong>Local processing boundary:</strong> selected documents remain in this browser. The release permits same-origin asset loading only and does not upload PDFs to an application server.</p>', 1)
write(pdf_html, text)
append_once("site/public/apps/shared/pdf-studio.css", "PDF_LOCAL_BOUNDARY_V1", '/* PDF_LOCAL_BOUNDARY_V1 */\n.pdf-local-boundary{margin:12px 0 0;padding:10px 12px;border-left:3px solid #0f766e;background:#ecfdf5;color:#134e4a;font-size:12px;line-height:1.5}.pdf-local-boundary strong{display:inline}')
write("site/public/apps/shared/pdf-studio/network-policy.json", json.dumps({"schemaVersion":"1.0.0","processing":"browser-local","allowedConnectOrigins":["self"],"documentUploadEndpoint":None,"telemetry":False,"phiPolicy":"local-use-only"}, indent=2))

# ---------------------------------------------------------------------------
# 8. Mind Maps global search
# ---------------------------------------------------------------------------
write("site/src/pages/apps/mindmaps/search-index.json.ts", dedent('''
import type { APIRoute } from 'astro';
import { getMindMapDataset, listAvailableMindMaps } from '../../../apps/mindmaps/dataLoader';
export const prerender = true;
const rows = [];
function visit(topicId,topicTitle,tabId,node,path){const next=[...path,node.name];rows.push({topicId,topicTitle,tabId,nodeId:node.id,name:node.name,path:next,tags:node.tags??[]});node.children?.forEach((child)=>visit(topicId,topicTitle,tabId,child,next));}
for(const manifest of listAvailableMindMaps()){const dataset=getMindMapDataset(manifest.id);if(!dataset)continue;Object.entries(dataset.tabs).forEach(([tabId,root])=>visit(manifest.id,manifest.title,tabId,root,[]));}
export const GET: APIRoute = async () => new Response(JSON.stringify({schemaVersion:'1.0.0',nodeCount:rows.length,rows}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600'}});
'''))
write("site/src/pages/apps/mindmaps/index.astro", dedent('''
---
import MainLayout from '../../../layouts/MainLayout.astro';
import Header from '../../../components/Header.jsx';
import { listAvailableMindMaps } from '../../../apps/mindmaps/dataLoader';
const maps=listAvailableMindMaps();
---
<MainLayout title="Dermatology Mind Map Library" description="Search across all interactive dermatology mind maps and open deep-linked concepts."><Header client:load /><main id="main-content"><section class="section"><div class="section-marker"><b>$</b><span>search mindmaps --all-topics</span></div><div class="section-head"><div><span class="kicker">Mind map library</span><h1 class="display1" style="margin-top:14px">One search.<br><em>Every map.</em></h1></div><div class="right">{maps.length} reviewed topic maps.<br>Cross-topic concept search.<br><span style="color:var(--terracotta)">Deep links preserve context.</span></div></div><p class="lede">Search a disease, drug, pathway, histologic clue, or clinical presentation across the complete map collection.</p><label class="library-search" for="mindmap-global-search"><span>Global concept search</span><input id="mindmap-global-search" type="search" placeholder="e.g. interface dermatitis, IL-17, oral ulcers…" autocomplete="off"></label><p id="mindmap-search-status" aria-live="polite">Enter at least two characters to search every node.</p><div id="mindmap-search-results" class="mindmap-search-results"></div><div class="mindmap-library-grid">{maps.map((map)=><a href={`/apps/mindmaps/${map.id}`}><span>{map.id}</span><h2>{map.title}</h2><p>{map.tabs.length} focused perspectives · diagrams, comparisons, and atlas views where authored.</p></a>)}</div></section></main><script>const input=document.getElementById('mindmap-global-search'),results=document.getElementById('mindmap-search-results'),status=document.getElementById('mindmap-search-status');let index;const load=async()=>index||=(await(await fetch('/apps/mindmaps/search-index.json')).json()).rows;input?.addEventListener('input',async()=>{const q=input.value.trim().toLowerCase();results.replaceChildren();if(q.length<2){status.textContent='Enter at least two characters to search every node.';return}const rows=(await load()).filter((row)=>[row.name,row.topicTitle,...(row.path||[]),...(row.tags||[])].join(' ').toLowerCase().includes(q)).slice(0,30);status.textContent=`${rows.length} result${rows.length===1?'':'s'} shown.`;rows.forEach((row)=>{const a=document.createElement('a');a.href=`/apps/mindmaps/${row.topicId}#${row.tabId}:${row.nodeId}`;const strong=document.createElement('strong');strong.textContent=row.name;const small=document.createElement('small');small.textContent=`${row.topicTitle} · ${row.path.join(' › ')}`;a.append(strong,small);results.append(a)})});</script></MainLayout><style>.library-search{display:grid;gap:7px;margin:34px 0 8px}.library-search span{font:700 11px var(--font-mono);text-transform:uppercase;letter-spacing:.12em}.library-search input{font:20px var(--font-body);padding:16px;border:1px solid var(--line);background:var(--paper)}#mindmap-search-status{font:12px var(--font-mono);color:var(--muted)}.mindmap-search-results{display:grid;gap:6px;margin:18px 0 34px}.mindmap-search-results a,.mindmap-library-grid a{border:1px solid var(--line);padding:14px;text-decoration:none;color:inherit}.mindmap-search-results a{display:grid}.mindmap-search-results small{color:var(--muted);margin-top:3px}.mindmap-library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.mindmap-library-grid span{font:10px var(--font-mono);text-transform:uppercase;color:var(--terracotta)}.mindmap-library-grid h2{font:26px var(--font-display);margin:9px 0}.mindmap-library-grid p{color:var(--muted)}@media(max-width:850px){.mindmap-library-grid{grid-template-columns:1fr}}</style>
'''))

# ---------------------------------------------------------------------------
# 9. Dermatopathology task launcher
# ---------------------------------------------------------------------------
dermpath = "site/public/apps/dermatopathology-modern/index-fixed.html"
add_body_slug(dermpath, "dermatopathology-navigator")
text = read(dermpath)
if "dermpath-task-launcher" not in text:
    text, n = re.subn(r'(<body[^>]*>)', r'''\1
  <nav class="dermpath-task-launcher" aria-label="Dermatopathology learning tasks"><div><span>Educational tool</span><strong>Choose a learning task</strong></div><button type="button" data-dermpath-task="grid">Identify a pattern</button><button type="button" data-dermpath-task="compare">Compare differentials</button><button type="button" data-dermpath-task="quiz">Practice cases</button><button type="button" data-dermpath-task="study">Review saved learning</button><small id="dermpath-task-status" aria-live="polite"></small></nav>''', text, count=1, flags=re.I)
    if n != 1: raise RuntimeError("Unable to insert dermpath launcher")
    text = text.replace('</head>', '<style id="dermpath-task-launcher-style">.dermpath-task-launcher{position:relative;z-index:1000;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;background:#f8fafc;border-bottom:1px solid #cbd5e1;color:#0f172a;font:12px system-ui}.dermpath-task-launcher div{margin-right:auto}.dermpath-task-launcher span{display:block;font:700 9px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em;color:#0f766e}.dermpath-task-launcher strong{font-size:13px}.dermpath-task-launcher button{border:1px solid #94a3b8;background:white;padding:7px 9px;border-radius:7px;cursor:pointer}.dermpath-task-launcher small{width:100%;color:#475569}@media(max-width:720px){.dermpath-task-launcher div{width:100%}}</style></head>', 1)
    text = text.replace('</body>', '<script id="dermpath-task-launcher-runtime">(()=>{const labels={grid:[\'grid\',\'pattern\'],compare:[\'compare\'],quiz:[\'quiz\'],study:[\'study\']};const status=document.getElementById(\'dermpath-task-status\');const activate=(task)=>{const candidates=[...document.querySelectorAll(\'button,[role="tab"],a\')];const target=candidates.find((node)=>labels[task].some((label)=>(node.textContent||\'\').trim().toLowerCase()===label||(node.textContent||\'\').trim().toLowerCase().includes(label)));if(target){target.click();status.textContent=`Opened ${task} workflow.`}else status.textContent=`${task} mode is still loading; use the application navigation when ready.`};document.querySelectorAll(\'[data-dermpath-task]\').forEach((button)=>button.addEventListener(\'click\',()=>activate(button.dataset.dermpathTask)))})();</script></body>', 1)
write(dermpath, text)

# ---------------------------------------------------------------------------
# 10. WoundCare archive boundary
# ---------------------------------------------------------------------------
wound = "site/public/apps/WoundCareWebpages.html"
text = read(wound)
if 'name="robots"' not in text:
    text = text.replace('<meta name="description" content="Wound care reference page with a table of contents, searchable guidance, and locally rendered formulas." />', '<meta name="description" content="Historical 2019 wound-care reference preserved for archival review only." />\n<meta name="robots" content="noindex,nofollow,noarchive" />', 1)
if 'data-app-slug="woundcare-archive"' not in text:
    text, n = re.subn(r'<body([^>]*)>', r'<body data-app-slug="woundcare-archive"\1>', text, count=1, flags=re.I)
    if n != 1: raise RuntimeError("Unable to mark WoundCare body")
if "WOUNDCARE_ARCHIVE_BOUNDARY_V1" not in text:
    text = text.replace('</head>', '<style id="WOUNDCARE_ARCHIVE_BOUNDARY_V1">.woundcare-archive-boundary{position:relative;z-index:9999;padding:16px 22px;background:#fff7ed;border-bottom:2px solid #c2410c;color:#431407;font:14px/1.5 system-ui}.woundcare-archive-boundary strong{display:block;font-size:16px}</style></head>', 1)
    text = re.sub(r'(<body[^>]*>)', r'\1<div class="woundcare-archive-boundary cl-archive-banner" role="alert"><strong>Historical archive — November 21, 2019</strong>This content has not been clinically maintained and must not be used as current wound-care guidance. It is preserved for historical and code-review purposes only.</div>', text, count=1, flags=re.I)
write(wound, text)

# ---------------------------------------------------------------------------
# 11. DermatoTarget boundary and release manifest
# ---------------------------------------------------------------------------
dt_index = "site/public/apps/dermatotarget-atlas/index.html"
add_body_slug(dt_index, "dermatotarget-atlas")
text = read(dt_index)
if "research-boundary" not in text:
    text = text.replace('<main id="main" class="main" tabindex="-1">', '<main id="main" class="main" tabindex="-1">\n        <section class="research-boundary" aria-label="Research-use boundary"><strong>Research companion — hypothesis generation only</strong><span>Scores are decomposable prioritization signals, not causal proof, therapeutic efficacy, or clinical guidance. Open Methods and Validation before interpreting rank.</span><a href="submission/manuscript.md">Methods</a><a href="reports/validation/publication_validation_report.md">Validation</a></section>', 1)
write(dt_index, text)
append_once("site/public/apps/dermatotarget-atlas/styles.css", "DERMATOTARGET_RESEARCH_BOUNDARY_V1", '/* DERMATOTARGET_RESEARCH_BOUNDARY_V1 */\n.research-boundary{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;margin-bottom:16px;border:1px solid #f59e0b;background:#fffbeb;color:#78350f;border-radius:10px;font-size:12px}.research-boundary strong{font-size:13px}.research-boundary span{flex:1;min-width:260px}.research-boundary a{color:#78350f;font-weight:700}')
meta = json.loads(read("site/public/apps/dermatotarget-atlas/data/meta.json"))
write("site/public/apps/dermatotarget-atlas/release-manifest.json", json.dumps({"schemaVersion":"1.0.0","application":"DermatoTarget Atlas","runStartedAt":meta.get("run_started_at"),"runCompletedAt":meta.get("run_completed_at"),"rowCounts":meta.get("row_counts"),"scoring":meta.get("scoring"),"sources":meta.get("sources"),"validation":meta.get("validation"),"clinicalUse":False,"interpretation":"hypothesis-generating prioritization only"}, indent=2))

# ---------------------------------------------------------------------------
# 12. Rheum–Derm trials exact artifact companions
# ---------------------------------------------------------------------------
write("site/scripts/assemble-rheum-derm-dashboard.mjs", dedent('''
import { createHash } from 'node:crypto'; import { gunzipSync } from 'node:zlib'; import { promises as fs } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const SITE_ROOT=path.resolve(HERE,'..');const DIR=path.join(SITE_ROOT,'public','apps','rheum-derm-clinical-trials');const OUTPUT=path.join(DIR,'index.html');const SHARD_FILES=['dashboard.00.b64','dashboard.01.b64','dashboard.02.b64','dashboard.03.b64','dashboard.04.b64','dashboard.05.b64','dashboard.06.b64','dashboard.07.b64','dashboard.08a.b64','dashboard.08b.b64','dashboard.09.b64','dashboard.10.b64'];const EXPECTED_BASE64_CHARS=216104,EXPECTED_ARCHIVE_BYTES=162078,EXPECTED_ARCHIVE_SHA256='cc0fef45addb8c8bc97a72cc2f4de237c98878b1149bda4bf5843799bd31504d',EXPECTED_HTML_BYTES=864417,EXPECTED_HTML_SHA256='7da4751bb81838b1dfd7be71a4209d0b90fbcea0c0235b07d6e1da2f4f4e86dc';const sha256=(value)=>createHash('sha256').update(value).digest('hex');function exact(value,bytes,hash,label){if(value.length!==bytes)throw new Error(`${label} byte count ${value.length}; expected ${bytes}`);const actual=sha256(value);if(actual!==hash)throw new Error(`${label} sha256 ${actual}; expected ${hash}`);return actual;}const parts=await Promise.all(SHARD_FILES.map(async(name)=>{const value=(await fs.readFile(path.join(DIR,name),'utf8')).replace(/\s+/g,'');if(!value)throw new Error(`Empty shard ${name}`);return value;}));const encoded=parts.join('');if(encoded.length!==EXPECTED_BASE64_CHARS||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw new Error('Non-canonical dashboard payload');const archive=Buffer.from(encoded,'base64');const archiveSha=exact(archive,EXPECTED_ARCHIVE_BYTES,EXPECTED_ARCHIVE_SHA256,'Dashboard gzip archive');if(archive[0]!==0x1f||archive[1]!==0x8b)throw new Error('Not gzip');const dashboard=gunzipSync(archive);const htmlSha=exact(dashboard,EXPECTED_HTML_BYTES,EXPECTED_HTML_SHA256,'Decoded dashboard');const text=dashboard.toString('utf8');if(!text.startsWith('<!doctype html>')||!text.includes('Rheum')||!text.includes('214'))throw new Error('Content sanity checks failed');await fs.writeFile(OUTPUT,dashboard);await fs.writeFile(path.join(DIR,'release-manifest.json'),JSON.stringify({schemaVersion:'1.0.0',application:'Rheum–Derm Clinical Trials Evidence Dashboard',studyCount:214,sourceArtifact:{shards:SHARD_FILES,base64Characters:EXPECTED_BASE64_CHARS,gzipBytes:archive.length,gzipSha256:archiveSha,htmlBytes:dashboard.length,htmlSha256:htmlSha},clinicalUse:false,interpretation:'Evidence comparison and research reference; study inclusion does not establish positive efficacy.',methods:'methods.html',fallback:'fallback.html',dataDictionary:'data-dictionary.json'},null,2)+'\n');console.log(`Assembled verified dashboard: ${dashboard.length} bytes, sha256 ${htmlSha}`);
'''))
write("site/public/apps/rheum-derm-clinical-trials/methods.html", '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rheum–Derm Trials Dashboard — Methods and limits</title><style>body{max-width:860px;margin:40px auto;padding:0 20px;font:16px/1.65 system-ui;color:#17324d}h1,h2{font-family:Georgia,serif}aside{padding:16px;border-left:4px solid #b45309;background:#fffbeb}code{background:#eef2f7;padding:2px 5px}</style></head><body><main><h1>Methods and interpretation boundary</h1><aside><strong>Research reference, not clinical guidance.</strong> Inclusion of a trial or program does not establish efficacy, safety, approval, or suitability for an individual patient.</aside><h2>Release topology</h2><p>The interactive dashboard is an immutable HTML artifact reconstructed from an explicit, ordered shard list. Build-time byte counts and SHA-256 hashes must match before deployment. The adjacent <code>release-manifest.json</code> records those receipts.</p><h2>Required source model for future releases</h2><p>Each normalized record should preserve registry identifier, study class, disease and subtype, intervention and target, comparator, enrollment, phase/status, endpoints, dates, result availability, publication identifiers, extraction provenance, and last registry check. The current immutable release remains available while that source-first authoring model is established.</p><h2>Evidence classes</h2><p>Interventional trials, observational studies, extensions, regulatory actions, development programs, and mechanistic studies must remain distinguishable. Program presence must never be rendered as a positive efficacy conclusion.</p><p><a href="./">Open dashboard</a> · <a href="fallback.html">Accessible fallback</a> · <a href="data-dictionary.json">Data dictionary</a></p></main></body></html>')
write("site/public/apps/rheum-derm-clinical-trials/fallback.html", '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rheum–Derm Trials Dashboard — Accessible fallback</title><style>body{max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.65 system-ui;color:#17324d}h1{font-family:Georgia,serif}</style></head><body><main><h1>Rheum–Derm Clinical Trials Evidence Dashboard</h1><p>This release contains 214 study and development-program records. The full application requires JavaScript. This fallback preserves the release boundary and companion documentation.</p><ul><li><a href="methods.html">Methods and interpretation limits</a></li><li><a href="data-dictionary.json">Normalized source data dictionary</a></li><li><a href="release-manifest.json">Release provenance and checksums</a></li><li><a href="./">Try the interactive dashboard</a></li></ul><p><strong>Not medical advice.</strong> Study inclusion does not establish efficacy, approval, safety, or prescribing suitability.</p></main></body></html>')
write("site/public/apps/rheum-derm-clinical-trials/data-dictionary.json", json.dumps({"schemaVersion":"1.0.0","recordFields":{"registryId":"Stable trial/registry identifier","studyClass":"interventional|observational|extension|regulatory|program|mechanistic","disease":"Canonical condition identifier and label","subtype":"Optional disease subtype/endotype","intervention":"Agent, procedure, or program","target":"Molecular or pathway target when supported","comparator":"Comparator/standard of care/placebo","enrollment":"Planned or actual enrollment with status","phase":"Trial phase when applicable","recruitmentStatus":"Registry status","primaryEndpoints":"Structured endpoint definitions and timepoints","secondaryEndpoints":"Structured endpoint definitions and timepoints","resultsAvailable":"Registry/publication result state","publications":"PMID/DOI and source links","provenance":"Source, extraction date, method, reviewer, and last registry check"}}, indent=2))

# ---------------------------------------------------------------------------
# 13. Private-route pruning and deployment decoupling
# ---------------------------------------------------------------------------
write("site/scripts/prune-private-routes.mjs", "import { promises as fs } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'); const config=JSON.parse(await fs.readFile(path.join(root,'src/data/private-routes.json'),'utf8')); const include=process.env.INCLUDE_PRIVATE_ROUTES==='1'; if(include){console.log('INCLUDE_PRIVATE_ROUTES=1; private-route pruning skipped.');process.exit(0);} for(const item of config.routes){const target=path.join(root,'dist',item.output);await fs.rm(target,{recursive:true,force:true});console.log(`Pruned ${item.route}: ${item.classification}`);}")

pkg_path = SITE / "package.json"
pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
pkg["scripts"]["build"] = "node ./scripts/assemble-rheum-derm-dashboard.mjs && astro build && node ./scripts/prune-private-routes.mjs && node ./scripts/portfolio-audit.mjs --dist"
pkg["scripts"]["audit:portfolio"] = "node ./scripts/portfolio-audit.mjs"
pkg_path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")

write("site/scripts/portfolio-audit.mjs", dedent('''
import { promises as fs } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const apps=JSON.parse(await fs.readFile(path.join(root,'src/data/apps.json'),'utf8'));const acceptance=JSON.parse(await fs.readFile(path.join(root,'src/data/app-acceptance.json'),'utf8'));const privateRoutes=JSON.parse(await fs.readFile(path.join(root,'src/data/private-routes.json'),'utf8'));const errors=[];const allowedCategories=new Set(['clinical','research','reference','learning','productivity']);const allowedVisibility=new Set(['public','external-public','private-authenticated','archived']);const seen=new Set();for(const app of apps){if(seen.has(app.slug))errors.push(`duplicate slug ${app.slug}`);seen.add(app.slug);for(const field of ['name','slug','status','category','outcome','audiences','maturity','visibility','clinicalUse','dataFlow','quality'])if(app[field]===undefined)errors.push(`${app.slug}: missing ${field}`);if(!allowedCategories.has(app.category))errors.push(`${app.slug}: invalid category`);if(!allowedVisibility.has(app.visibility))errors.push(`${app.slug}: invalid visibility`);if(!acceptance.apps[app.slug])errors.push(`${app.slug}: missing acceptance criteria`);if(app.listed!==false&&app.status==='active'&&!['public','external-public'].includes(app.visibility))errors.push(`${app.slug}: listed but not public`);}const ramie=apps.find((a)=>a.slug==='dermatology-scribe');if(ramie?.maturity!=='research-prototype'||ramie?.clinicalUse!=='not-for-clinical-use')errors.push('RAMIE research boundary missing');if(ramie?.dataFlow?.phiPolicy!=='approved-deployment-only')errors.push('RAMIE PHI policy missing');const biologic=apps.find((a)=>a.slug==='biologic-monitoring');if(biologic?.quality?.reviewState!=='review-required'||biologic?.quality?.lastReviewed!=='2025-09-23')errors.push('Biologic review currency must remain explicit');for(const slug of ['dermatotarget-atlas','jeopagen'])if(!apps.some((a)=>a.slug===slug&&a.status==='active'&&a.listed!==false))errors.push(`${slug} missing from public catalog`);const catalog=await fs.readFile(path.join(root,'src/pages/apps/index.astro'),'utf8');if(catalog.includes('CATEGORY_BY_SLUG'))errors.push('Catalog duplicates category taxonomy');if(catalog.includes('No accounts. No tracking'))errors.push('Catalog contains false portfolio-wide privacy claim');const ramieHtml=await fs.readFile(path.join(root,'public/apps/dermatology-scribe/index.html'),'utf8');if(!ramieHtml.includes('Research prototype')||!ramieHtml.includes('ramieDataFlowDisclosure'))errors.push('RAMIE visible prototype/data-flow boundary absent');const bioData=await fs.readFile(path.join(root,'public/apps/biologic-monitoring-dashboard/data.js'),'utf8');if(/il17-inhibitors[\s\S]{0,1200}conditions:\s*\[[^\]]*crohns-disease/.test(bioData))errors.push('Crohn disease remains encoded as IL-17 indication');if(!bioData.includes("cautionConditions: ['crohns-disease', 'ulcerative-colitis']"))errors.push('IL-17 IBD caution structure absent');const dermoscopy=await fs.readFile(path.join(root,'src/pages/research/dermoscopy-llm-dashboard.astro'),'utf8');if(!dermoscopy.includes('100 images.')||!dermoscopy.includes('10,200 repeated evaluations'))errors.push('Dermoscopy denominator boundary absent');const pdf=await fs.readFile(path.join(root,'public/apps/pdf-studio.html'),'utf8');if(!pdf.includes('Content-Security-Policy')||!pdf.includes('Local processing boundary'))errors.push('PDF local-processing contract absent');const wound=await fs.readFile(path.join(root,'public/apps/WoundCareWebpages.html'),'utf8');if(!wound.includes('Historical archive — November 21, 2019')||!wound.includes('noindex,nofollow,noarchive'))errors.push('WoundCare archive boundary absent');if(process.argv.includes('--dist'))for(const item of privateRoutes.routes){try{await fs.access(path.join(root,'dist',item.output));errors.push(`private route shipped: ${item.route}`)}catch{}}const report={schemaVersion:'1.0.0',checkedApps:apps.length,publicListed:apps.filter((a)=>a.status==='active'&&a.listed!==false).length,errors};await fs.writeFile(path.join(root,'portfolio-audit.json'),JSON.stringify(report,null,2)+'\n');if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`Portfolio audit passed for ${apps.length} app records.`);
'''))

# Update canonical inventory.
inv_path = "docs/site-test-inventory.md"
inv_text = read(inv_path)
match = re.search(r"```json\n([\s\S]*?)\n```", inv_text)
if not match: raise RuntimeError("Canonical inventory JSON block not found")
inv = json.loads(match.group(1))
if "/apps/mindmaps" not in inv["astroRoutes"]: inv["astroRoutes"].insert(inv["astroRoutes"].index("/apps") + 1, "/apps/mindmaps")
inv["externalApps"] = [entry for entry in inv.get("externalApps", []) if entry.get("slug") != "jeopagen"]
inv["externalApps"].append({"slug":"jeopagen","canonicalUrl":"https://jeopagen.ramiefathy.com/","surfacesToCheck":["site/src/data/apps.json","site/src/pages/apps/index.astro"]})
private_set = {item["route"].rstrip("/") for item in private_routes["routes"]}
inv["unlistedStaticPages"] = [entry for entry in inv.get("unlistedStaticPages", []) if entry.get("route", "").rstrip("/") not in private_set]
inv["unlistedAstroRoutes"] = [entry for entry in inv.get("unlistedAstroRoutes", []) if entry.get("route", "").rstrip("/") not in private_set]
inv["legacyHtmlApps"] = [entry for entry in inv.get("legacyHtmlApps", []) if entry.get("route") != "/apps/dermatopathology-modern/test-fixes.html"]
inv["excludedFromPublicBuild"] = private_routes["routes"]
inv["separatelyGatedTools"] = [{"label":"Table Ledger D&D console","route":"/tools/dnd-l20-console-f2c7a9/","workflow":".github/workflows/table-ledger.yml","reason":"Personal tool is tested independently and cannot block unrelated professional-site releases."}]
new_block = "```json\n" + json.dumps(inv, indent=2, ensure_ascii=False) + "\n```"
write(inv_path, inv_text[:match.start()] + new_block + inv_text[match.end():])

write(".github/workflows/pages.yml", dedent('''
name: Deploy Astro site to GitHub Pages
on:
  push: { branches: [master] }
  workflow_dispatch:
concurrency: { group: pages, cancel-in-progress: true }
permissions: { contents: read }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with: { lfs: true, persist-credentials: false }
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc' }
      - run: npm --prefix site install
      - run: npm --prefix site run audit:portfolio
      - run: npm run site:test
      - run: npm run site:build
      - uses: actions/upload-pages-artifact@v3
        with: { path: site/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: '${{ steps.deploy.outputs.page_url }}' }
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
  live-smoke:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Verify portfolio manifest and public/private boundaries
        shell: bash
        run: |
          set -euo pipefail
          base=https://ramiefathy.com
          for attempt in $(seq 1 30); do
            key="${GITHUB_SHA}-${attempt}"
            if curl -fsSL "$base/apps?deploy=$key" | grep -Fq 'Purpose-built' \
              && curl -fsSL "$base/data/app-manifest.json?deploy=$key" | jq -e '.apps[] | select(.slug=="dermatology-scribe" and .maturity=="research-prototype")' >/dev/null \
              && curl -fsSL "$base/apps/dermatology-scribe/index.html?deploy=$key" | grep -Fq 'Research prototype' \
              && curl -fsSL "$base/apps/pdf-studio.html?deploy=$key" | grep -Fq 'Local processing boundary' \
              && curl -fsSL "$base/apps/dermatotarget-atlas/?deploy=$key" | grep -Fq 'Research workbench'; then
              task_code=$(curl -sS -o /dev/null -w '%{http_code}' "$base/tasks/?deploy=$key")
              vc_code=$(curl -sS -o /dev/null -w '%{http_code}' "$base/apps/dermie-vc-prep-rf-20260514-x7q9m2/?deploy=$key")
              [[ "$task_code" == 404 && "$vc_code" == 404 ]] && exit 0
            fi
            sleep 10
          done
          exit 1
'''))
write(".github/workflows/table-ledger.yml", dedent('''
name: Table Ledger isolated quality gate
on:
  pull_request:
    paths: ['tools/dnd-l20-console-f2c7a9/**','site/src/pages/tools/dnd-l20-console-f2c7a9/**','site/tests/dnd-console.spec.ts','.github/workflows/table-ledger.yml']
  push:
    branches: [master]
    paths: ['tools/dnd-l20-console-f2c7a9/**','site/src/pages/tools/dnd-l20-console-f2c7a9/**','site/tests/dnd-console.spec.ts','.github/workflows/table-ledger.yml']
permissions: { contents: read }
jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with: { persist-credentials: false }
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc' }
      - run: npm --prefix site install
      - run: npm run site:build
      - working-directory: site
        run: npx playwright install --with-deps chromium
      - working-directory: site
        run: npx playwright test tests/dnd-console.spec.ts --reporter=line
'''))
obsolete = ROOT / ".github/workflows/publish-jeopagen.yml"
if obsolete.exists(): obsolete.unlink()
ci_path = ".github/workflows/ci.yml"
ci = read(ci_path)
ci = re.sub(r"\n      - name: Verify direct D&D static build contract[\s\S]*?(?=\n      - name: Guard against simulated RAMIE scribe)", "", ci, count=1)
ci = re.sub(r"\n      - name: Upload built D&D console for audit[\s\S]*?(?=\n\n  e2e-playwright:)", "", ci, count=1)
ci = ci.replace("      - name: Run site unit tests\n        run: npm run site:test", "      - name: Run portfolio governance audit\n        run: npm --prefix site run audit:portfolio\n      - name: Run site unit tests\n        run: npm run site:test")
ci = ci.replace("run: npx playwright test --reporter=line", "run: npx playwright test --reporter=line --grep-invert \"Table Ledger D&D console\"")
write(ci_path, ci)

# ---------------------------------------------------------------------------
# 14. Strict automated acceptance tests
# ---------------------------------------------------------------------------
write("site/src/security/portfolio-governance.test.ts", dedent('''
import { describe, expect, it } from 'vitest'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');const json=(p)=>JSON.parse(fs.readFileSync(path.join(repo,p),'utf8'));const text=(p)=>fs.readFileSync(path.join(repo,p),'utf8');const apps=json('site/src/data/apps.json'),acceptance=json('site/src/data/app-acceptance.json'),privateRoutes=json('site/src/data/private-routes.json');
describe('portfolio governance contract',()=>{
 it('has unique, complete, acceptance-gated records',()=>{expect(new Set(apps.map((a)=>a.slug)).size).toBe(apps.length);for(const app of apps){for(const field of ['category','outcome','audiences','maturity','visibility','clinicalUse','dataFlow','quality'])expect(app[field],`${app.slug}.${field}`).toBeTruthy();expect(acceptance.apps[app.slug]).toBeTruthy();}});
 it('keeps RAMIE feature-rich but explicitly experimental',()=>{const app=apps.find((a)=>a.slug==='dermatology-scribe');expect(app.maturity).toBe('research-prototype');expect(app.clinicalUse).toBe('not-for-clinical-use');expect(app.dataFlow.phiPolicy).toBe('approved-deployment-only');const html=text('site/public/apps/dermatology-scribe/index.html');for(const marker of ['Start new conversation','Begin transcription','Resume session','Research prototype','ramieDataFlowDisclosure'])expect(html).toContain(marker);});
 it('separates IL-17 indications from IBD cautions and flags stale review',()=>{const data=text('site/public/apps/biologic-monitoring-dashboard/data.js');expect(data).toContain("cautionConditions: ['crohns-disease', 'ulcerative-colitis']");expect(data).not.toMatch(/id: 'il17-inhibitors'[\s\S]{0,1400}conditions: \[[^\]]*crohns-disease/);const app=apps.find((a)=>a.slug==='biologic-monitoring');expect(app.quality.reviewState).toBe('review-required');});
 it('corrects research denominators and local-processing claims',()=>{expect(text('site/src/pages/research/dermoscopy-llm-dashboard.astro')).toContain('100 images.');expect(text('site/src/pages/research/dermoscopy-llm-dashboard.astro')).toContain('10,200 repeated evaluations');const pdf=text('site/public/apps/pdf-studio.html');expect(pdf).toContain('Content-Security-Policy');expect(pdf).toContain('Local processing boundary');});
 it('archives WoundCare and excludes sensitive/test routes',()=>{const wound=text('site/public/apps/WoundCareWebpages.html');expect(wound).toContain('Historical archive — November 21, 2019');expect(wound).toContain('noindex,nofollow,noarchive');expect(privateRoutes.routes.map((x)=>x.route)).toEqual(expect.arrayContaining(['/tasks/','/apps/dermie-vc-prep-rf-20260514-x7q9m2/','/strategy/egypt-ai-portfolio/']));});
 it('uses one catalog taxonomy and lists high-value tools',()=>{const catalog=text('site/src/pages/apps/index.astro');expect(catalog).not.toContain('CATEGORY_BY_SLUG');expect(catalog).not.toContain('No accounts. No tracking');for(const slug of ['dermatotarget-atlas','jeopagen'])expect(apps.find((a)=>a.slug===slug&&a.listed!==false)).toBeTruthy();});
 it('decouples Table Ledger and removes the expiring publisher',()=>{expect(fs.existsSync(path.join(repo,'.github/workflows/table-ledger.yml'))).toBe(true);expect(text('.github/workflows/pages.yml')).not.toContain('DND_URL');expect(fs.existsSync(path.join(repo,'.github/workflows/publish-jeopagen.yml'))).toBe(false);});
});
'''))

write("site/tests/portfolio-app-acceptance.spec.ts", dedent('''
import { expect, test } from '@playwright/test';
const cleanRuntime=(page)=>{const errors=[];page.on('pageerror',(e)=>errors.push(e.message));page.on('console',(m)=>{if(m.type()==='error')errors.push(m.text())});return()=>expect(errors).toEqual([])};
test.describe('portfolio strict acceptance',()=>{
 test('catalog exposes outcome, maturity, data flow, search, and flagship entries',async({page})=>{const done=cleanRuntime(page);await page.goto('/apps',{waitUntil:'networkidle'});await expect(page.getByRole('heading',{name:/Purpose-built/})).toBeVisible();await expect(page.getByText('Research prototype',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'DermatoTarget Atlas'})).toBeVisible();await expect(page.getByRole('heading',{name:'JeopaGen'})).toBeVisible();await page.getByLabel('Search applications').fill('target prioritization');await expect(page.getByRole('heading',{name:'DermatoTarget Atlas'})).toBeVisible();await expect(page.locator('#apps-result-count')).toContainText('1 application');done();});
 test('RAMIE preserves all primary capabilities with an unavoidable prototype boundary',async({page})=>{const done=cleanRuntime(page);await page.goto('/apps/dermatology-scribe/index.html',{waitUntil:'networkidle'});await expect(page.getByText('Research prototype',{exact:true})).toBeVisible();for(const label of ['Start new conversation','Begin transcription','Resume session'])await expect(page.getByText(label,{exact:true})).toBeVisible();await expect(page.locator('#ramieDataFlowDisclosure')).toContainText(/backend|browser/i);done();});
 test('Biologic Monitoring visibly reports review currency',async({page})=>{const done=cleanRuntime(page);await page.goto('/apps/biologic-monitoring-dashboard/index.html',{waitUntil:'networkidle'});await expect(page.getByText('Clinical content review required.')).toBeVisible();await expect(page.getByText(/September 23, 2025/).first()).toBeVisible();done();});
 test('PDF Studio loads nine local tools without external requests',async({page})=>{const external=[];page.on('request',(r)=>{const url=new URL(r.url());if(url.origin!==new URL(page.url()||'http://127.0.0.1').origin&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url())});const done=cleanRuntime(page);await page.goto('/apps/pdf-studio.html',{waitUntil:'networkidle'});await expect(page.getByText('Local processing boundary:')).toBeVisible();await expect(page.locator('.pdf-studio__tool-button')).toHaveCount(9);expect(external).toEqual([]);done();});
 test('Mind Map library performs cross-topic search',async({page})=>{const done=cleanRuntime(page);await page.goto('/apps/mindmaps',{waitUntil:'networkidle'});await expect(page.getByRole('heading',{name:/One search/})).toBeVisible();await page.getByLabel('Global concept search').fill('psoriasis');await expect(page.locator('#mindmap-search-results a').first()).toBeVisible();done();});
 test('research and archive boundaries are visible',async({page})=>{await page.goto('/research/dermoscopy-llm-dashboard',{waitUntil:'networkidle'});await expect(page.getByText('10,200 repeated evaluations.')).toBeVisible();await expect(page.getByText(/clustered by image/)).toBeVisible();await page.goto('/apps/dermatotarget-atlas/',{waitUntil:'networkidle'});await expect(page.getByText(/hypothesis generation only/i)).toBeVisible();await page.goto('/apps/WoundCareWebpages.html',{waitUntil:'networkidle'});await expect(page.getByText(/Historical archive — November 21, 2019/)).toBeVisible();});
 test('clinical-trials provenance files ship',async({request})=>{for(const file of ['release-manifest.json','methods.html','fallback.html','data-dictionary.json'])expect((await request.get(`/apps/rheum-derm-clinical-trials/${file}`)).status(),file).toBe(200);const manifest=await(await request.get('/apps/rheum-derm-clinical-trials/release-manifest.json')).json();expect(manifest.studyCount).toBe(214);expect(manifest.sourceArtifact.htmlSha256).toHaveLength(64);});
 test('private/confidential routes are absent',async({request})=>{for(const route of ['/tasks/','/apps/dermie-vc-prep-rf-20260514-x7q9m2/','/strategy/egypt-ai-portfolio/','/apps/dermatopathology-modern/test-fixes.html'])expect((await request.get(route)).status(),route).toBe(404);});
 test('catalog and RAMIE are mobile-safe',async({browser})=>{const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});for(const route of ['/apps','/apps/dermatology-scribe/index.html']){await page.goto(route,{waitUntil:'networkidle'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow,route).toBeLessThanOrEqual(1)}await page.close();});
});
'''))

# ---------------------------------------------------------------------------
# 15. Quality standard and status
# ---------------------------------------------------------------------------
write("docs/portfolio-quality-standard.md", dedent('''
# Application portfolio quality and acceptance standard

**Version:** 1.0 · **Effective:** August 5, 2026

This is the release contract for every application displayed by `ramiefathy.com/apps` and for every separately gated or archived application retained in the repository. A passing software build is necessary but not sufficient: maturity, privacy, data flow, evidence currency, clinical-use boundaries, and source-to-release provenance must also pass.

## Universal release gate

A release is accepted only when all applicable unit/policy, production-build, desktop/mobile browser, keyboard, reduced-motion, runtime-console, same-origin request, overflow, export, recovery, and source-provenance checks pass. Generated and clinical content must have a review state; the interface may not imply stronger validation than the evidence supports. Private or confidential routes are denied from the default public artifact.

## Application-specific gates

### RAMIE
All chat, transcription, image/document, differential, management, note, session, and export workflows remain available. The launcher must identify RAMIE as a **research prototype**, state that it is not validated for clinical care, prohibit PHI except in an approved deployment, and disclose the configured backend data path. Feature preservation is explicitly tested.

### Skinoculars
The 3D experience must identify disease transformations as schematic unless a quantitative parameter has been independently validated. Every disease model requires evidence status, limitations, semantic non-3D explanation, keyboard access, context-loss recovery, mobile GPU handling, and visual regression coverage.

### Dermatopathology Navigator
Pattern identification, differential comparison, case practice, and saved review must be prominent task entrances without removing the existing learning modes. Content requires a structured dermpath schema, source/license metadata, discriminator preservation, and case-stage tests.

### Mind Maps
All manifests, nodes, diagrams, and comparisons must validate. Global cross-topic search, deep links, sanitization, export, local recovery, mobile gestures, keyboard operation, and provenance coverage are acceptance gates.

### Rheum–Derm Immune Atlas
Direct, derived, explicit-zero, filtered, and unknown relations remain distinct. Every visible relation retains provenance and denominators. Overlap never implies efficacy, dose response, synergy, antagonism, or safety. Existing P0–P2 scientific and interface suites remain authoritative.

### Rheum–Derm Clinical Trials
The decoded application must exactly match its ordered-shard byte and SHA-256 contract. Release manifest, methods page, accessible fallback, and normalized data dictionary must ship. Study presence is never represented as positive efficacy evidence.

### Dermoscopy LLM Dashboard
The application must display **100 unique images** separately from **10,200 repeated model × prompt evaluations**. Model snapshot scope, sampling, ground-truth boundary, repeated-measures limitation, and non-clinical status are mandatory.

### Biologic Monitoring
Indications, caution conditions, contraindications, label-required monitoring, guideline recommendations, and institutional policy are separate concepts. The September 23, 2025 source set remains visibly `review-required` until a clinician completes a source-level update. Patient-specific prescribing suitability is out of scope.

### SkinScores
No silent clinical defaults are permitted. Each instrument requires a governed version, original source, license status, intended population, missing-data handling, interpretation, meaningful-change information where established, reference test vectors, reviewer, and review date. Account/cloud data behavior is explicit.

### PDF Studio
Documents remain browser-local; external document transmission is prohibited. All nine workflows require deterministic preflight/output summaries, cancellation and error recovery, large-file safeguards, malformed/encrypted PDF tests, and an explicit ban on calling a visual overlay secure redaction.

### Clinisched
Hard/soft constraints, objective contributions, alternatives, role controls, tenant isolation, fairness distribution, schedule versions, approval, publication, amendment, and rollback are tested. Automatic scheduling may not silently overwrite protected assignments.

### DermatoTarget Atlas
Target scores are decomposable, source-versioned, and accompanied by ablation/sensitivity analysis, empirical nulls, negative controls, and run manifests. Rank is never causal proof or predicted efficacy.

### JeopaGen
Every candidate retains source-document and location provenance. Human approval precedes export. Duplicate, ambiguity, answer leakage, and source-support checks pass. HTML, PPTX/PPTM, answer-key, recovery, keyboard, mobile, and credential-leak tests pass. Deployment originates from the JeopaGen repository, not an expiring signed URL.

### WoundCare archive
The November 21, 2019 date and historical-only boundary are unavoidable. It is absent from the active catalog, noindexed, and never presented as current clinical guidance.

### Private and separately gated tools
Taskboard, confidential VC material, and private strategy routes are pruned from the default public build. Table Ledger remains separately tested and cannot block an unrelated professional-site release. KSA analytics remains behind authenticated private infrastructure.

## Evidence and accuracy interpretation

Automated tests verify calculations, schemas, provenance presence, internal consistency, and interaction behavior. They do **not** substitute for current clinician review of drug labels, guidelines, instruments, or treatment recommendations. Clinical applications fail visibly to `review-required` when the review interval lapses; the portfolio must never convert an overdue source set into an apparently current one merely by changing a date.
'''))
write("docs/portfolio-remediation-status.md", dedent('''
# Portfolio remediation status — August 5, 2026

## Implemented in this change

- One authoritative app manifest now drives category, outcome, audience, maturity, visibility, clinical-use, data-flow, review-currency, source-repository, and acceptance-profile metadata.
- Catalog search and sorting use that manifest; the false portfolio-wide “No accounts. No tracking” claim and duplicate slug taxonomy were removed.
- RAMIE retains all major features and is marked prominently as a research prototype with backend and PHI disclosure.
- Biologic Monitoring separates IL-17 IBD cautions from treatment indications and exposes its overdue September 23, 2025 review state.
- The Dermoscopy dashboard distinguishes 100 unique images from 10,200 repeated evaluations and adds a repeated-measures methods boundary.
- PDF Studio adds a local-processing disclosure, restrictive same-origin CSP, and a machine-readable network policy.
- Mind Maps adds a library route and global cross-topic node search.
- Dermatopathology Navigator adds task-oriented entry points while preserving its existing modes.
- WoundCare is converted to an unavoidable historical archive boundary.
- DermatoTarget gains catalog placement, release provenance, and a visible hypothesis-generation boundary.
- Rheum–Derm Trials gains exact release manifests, methods, fallback, and a normalized source data dictionary while preserving the immutable artifact hash.
- JeopaGen is cataloged at its standalone subdomain and the expired signed-URL website publisher is removed.
- Confidential/private routes are pruned from the default public artifact.
- Table Ledger is moved to an isolated path-scoped gate and removed as a single point of failure for the main deployment.
- Strict unit/policy and browser acceptance tests cover the cross-cutting and app-specific contracts.

## Deliberate safety state

Biologic Monitoring and SkinScores remain `review-required` rather than being falsely re-dated. Completion of a current clinical review requires source-by-source clinician adjudication; the interface and release gate now make that requirement visible and testable.

## Dependency

Rheum–Derm Immune Atlas source-specific P0–P2 remediation remains in PR #175 and is not duplicated here. This change consumes its quality contract without modifying its files.
'''))
print("Portfolio remediation applied successfully.")
