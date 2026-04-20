import React, { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { DiagramCitation } from '../types';

export interface SideDrawerContent {
  title: string;
  markdown: string;                    // raw HTML string from authored JSON; sanitized at render
  citations?: DiagramCitation[];
  meta?: string;                       // optional Space Mono caption shown above title
}

export interface SideDrawerProps {
  content: SideDrawerContent | null;
  onClose: () => void;
}

export function SideDrawer({ content, onClose }: SideDrawerProps) {
  const safeBody = useMemo(
    () => (content ? DOMPurify.sanitize(content.markdown ?? '') : ''),
    [content],
  );
  if (!content) return null;
  return (
    <aside className="side-drawer" role="complementary" aria-label="Concept detail">
      <button type="button" className="side-drawer__close" onClick={onClose} aria-label="Close detail">×</button>
      {content.meta && <p className="side-drawer__meta">{content.meta}</p>}
      <h3 className="side-drawer__title">{content.title}</h3>
      <div
        className="side-drawer__body"
        dangerouslySetInnerHTML={{ __html: safeBody }}
      />
      {content.citations && content.citations.length > 0 && (
        <div className="side-drawer__citations">
          <h4>Citations</h4>
          <ul>
            {content.citations.map((c, i) => (
              <li key={i}>
                {c.quote && <span>{c.quote}</span>}
                {c.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`} target="_blank" rel="noreferrer">PMID {c.pmid}</a>}
                {c.doi && <a href={`https://doi.org/${c.doi}`} target="_blank" rel="noreferrer">DOI {c.doi}</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
