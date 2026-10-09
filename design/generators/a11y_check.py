import sys,json
from playwright.sync_api import sync_playwright
JS=r"""
()=>{
const root=document.querySelector('div[dir=rtl]');
function parse(c){const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(Number);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)}
function bg(el){let layers=[];while(el){const c=parse(getComputedStyle(el).backgroundColor);if(c&&c.a>0){layers.push(c);if(c.a>=1)break}el=el.parentElement}
 let base={r:255,g:255,b:255};for(let i=layers.length-1;i>=0;i--){const l=layers[i];base={r:base.r*(1-l.a)+l.r*l.a,g:base.g*(1-l.a)+l.g*l.a,b:base.b*(1-l.a)+l.b*l.a}}return base}
const out={contrast:[],targets:[]};
const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const seen=new Set();
while(n=w.nextNode()){const t=n.textContent.trim();if(!t)continue;const el=n.parentElement;if(seen.has(el))continue;seen.add(el);
 const cs=getComputedStyle(el);const fg=parse(cs.color);const b=bg(el);const L1=lum(fg),L2=lum(b);const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
 const fs=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;const large=fs>=24||(fs>=18.66&&bold);const need=large?3:4.5;
 if(cr<need)out.contrast.push({t:t.slice(0,30),cr:+cr.toFixed(2),need,fs});}
root.querySelectorAll('a,button,[role=switch],[role=button]').forEach(el=>{const r=el.getBoundingClientRect();const pr=el.parentElement.getBoundingClientRect();if(el.getAttribute('role')==='switch'&&pr.height>=44)return;if(r.width&&(r.height<44||r.width<44)){out.targets.push({t:(el.textContent.trim()||el.getAttribute('aria-label')||'').slice(0,24),w:Math.round(r.width),h:Math.round(r.height)})}});
return out}
"""
res={}
with sync_playwright() as p:
    b=p.chromium.launch()
    for n in sys.argv[1:]:
        pg=b.new_page(viewport={'width':1500,'height':1000})
        pg.goto(f'file:///home/claude/project/{n}.dc.html');pg.wait_for_timeout(700)
        res[n]=pg.evaluate(JS)
    b.close()
for n,r in res.items():
    print('==',n,'contrast fails:',len(r['contrast']),'small targets:',len(r['targets']))
    for c in r['contrast'][:8]:print('  C',c)
    for t in r['targets'][:8]:print('  T',t)
