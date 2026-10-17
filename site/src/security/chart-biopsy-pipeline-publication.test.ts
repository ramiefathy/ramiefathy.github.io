import fs from 'node:fs';
import path from 'node:path';
import {describe,it,expect} from 'vitest';
const root=path.resolve(process.cwd(),'public/research/chart-biopsy-pipeline-51616c580f');
const read=(file:string)=>fs.readFileSync(path.join(root,file),'utf8');
describe('Unlisted Chart Biopsy publication',()=>{
 it('keeps both pages unindexed without a canonical URL',()=>{
  for(const file of ['index.html','rubrics.html']){
   const text=read(file);expect(text).toContain('<meta name="robots" content="noindex, nofollow, noarchive">');expect(text).not.toMatch(/rel=["']canonical/);
  }
 });
 it('provides a separate reference sidebar page and eight complete categories',()=>{
  expect(read('index.html')).toContain('href="rubrics.html"');const text=read('rubrics.html');
  expect((text.match(/class="rubric-category"/g)||[])).toHaveLength(8);
  const ids=[...text.matchAll(/data-criterion="(M[1-8]-I[1-7])"/g)].map(m=>m[1]);expect(ids).toHaveLength(50);expect(new Set(ids).size).toBe(50);
  expect(text).toContain('href="index.html"');expect(text).toContain('not fifty mandatory scoring items');
 });
 it('ships only the intended public assets, without provider packets or private paths',()=>{
  expect(fs.readdirSync(root).sort()).toEqual(['app.js','index.html','mermaid.LICENSE.txt','mermaid.min.js','rubrics.html','style.css']);
  for(const file of ['index.html','rubrics.html','app.js'])expect(read(file)).not.toMatch(/\/Users\/|tail0fb3f8|input\.jsonl|COOKIE_SECRET/);
 });
 it('states the case-wide policy without pretending the server has been migrated',()=>{
  expect(read('app.js')).toContain('every run');expect(read('app.js')).toContain('No run in the case');expect(read('index.html')).toContain('existing local review server still needs case-wide enforcement');
 });
});
