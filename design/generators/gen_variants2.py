# Three ways to separate header/body of the member card without side notches. Source: D-BadgeN1 (lanyard kept, no slot/notches).
import re
P='/home/claude/project/'
src=open(P+'D-BadgeN1.dc.html',encoding='utf-8').read()
def title(s,t): return re.sub(r'<title>.*?</title>','<title>'+t+'</title>',s,count=1)
ART_OPEN='<article style="position: relative; margin-top: 84px; width: 308px; height: 340px; box-sizing: border-box; border: 2.5px solid #1E1633; border-radius: 28px; background: #FFF9EC; overflow: hidden; box-shadow: 0 4px 0 #1E1633;">'
assert ART_OPEN in src
HDR_OPEN='<div style="position: relative; height: 150px; box-sizing: border-box; padding: 22px 20px 0; background: var(--org); color: var(--on); border-bottom: 2.5px solid #1E1633; display: flex; flex-direction: column; align-items: center; overflow: hidden;">'
assert HDR_OPEN in src
# ---- a: logo circle straddles the boundary
a=src.replace(ART_OPEN,ART_OPEN.replace('height: 340px','height: 346px'))
a=a.replace(HDR_OPEN,'<div style="position: relative; height: 134px; box-sizing: border-box; padding: 22px 20px 0; background: var(--org); color: var(--on); border-bottom: 2.5px solid #1E1633; display: flex; flex-direction: column; align-items: center; overflow: visible;"><div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;"><span style="position: absolute; top: -70px; right: -50px; width: 180px; height: 180px; border-radius: 50%; background: rgba(255,255,255,0.16);"></span><span style="position: absolute; bottom: -60px; left: -40px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.12);"></span></div>')
# remove original decorative spans + original circle; re-add circle at the boundary
a=re.sub(r'(<div style="position: absolute; inset: 0; overflow: hidden[^>]*>.*?</div>)\n<span style="position: absolute; top: -70px.*?</span>\n<span style="position: absolute; bottom: -60px.*?</span>\n',r'\1\n',a,count=1,flags=re.S)
circ=re.search(r'<div style="position: relative; margin-top: 10px; width: 62px;.*?\{\{letter\}\}</div>\n',a,flags=re.S)
a=a.replace(circ.group(0),'')
a=a.replace('<h1 style="position: relative; margin: 8px 0 0;','<h1 style="position: relative; margin: 8px 0 0;')
a=a.replace('<span style="position: relative; margin-top: 6px; transform: rotate(-2deg);','<span style="position: relative; margin-top: 6px; transform: rotate(-2deg);',1)
btn_end='</button>\n</div>\n'
i=a.index('aria-label="הפוך את הכרטיס לקוד כניסה"'); j=a.index(btn_end,i)+len(btn_end)
straddle='<div style="position: absolute; left: 50%; bottom: -33px; margin-inline-start: -33px; width: 66px; height: 66px; box-sizing: border-box; border-radius: 50%; background: #FFFFFF; color: #1E1633; border: 2.5px solid #1E1633; box-shadow: 0 3px 0 #1E1633; display: flex; align-items: center; justify-content: center; font-family: \'Secular One\', sans-serif; font-size: 34px; z-index: 2;">{{letter}}</div>\n'
a=a[:j-len('</div>\n')]+straddle+'</div>\n'+a[j:]
a=a.replace('<div style="box-sizing: border-box; padding: 20px 20px 0; text-align: center;">','<div style="box-sizing: border-box; padding: 42px 20px 0; text-align: center;">',1)
a=a.replace('top: 120px; inset-inline-end: 14px','top: 104px; inset-inline-end: 14px',1)
a=title(a,'ד · כרטיס חברות · הפרדה: לוגו חוצה (ניסוי)')
open(P+'D-BadgeN1a.dc.html','w',encoding='utf-8').write(a)
# ---- b: soft curved boundary
b=src.replace(HDR_OPEN,'<div style="position: relative; height: 158px; box-sizing: border-box; padding: 22px 20px 0; background: var(--org); color: var(--on); border-bottom: 2.5px solid #1E1633; border-bottom-left-radius: 50% 26px; border-bottom-right-radius: 50% 26px; display: flex; flex-direction: column; align-items: center; overflow: hidden;">')
b=b.replace('<div style="box-sizing: border-box; padding: 20px 20px 0; text-align: center;">','<div style="box-sizing: border-box; padding: 16px 20px 0; text-align: center;">',1)
b=b.replace('top: 120px; inset-inline-end: 14px','top: 128px; inset-inline-end: 14px',1)
b=title(b,'ד · כרטיס חברות · הפרדה: קו מעוגל (ניסוי)')
open(P+'D-BadgeN1b.dc.html','w',encoding='utf-8').write(b)
# ---- c: two stacked pieces with a gap
c=src.replace(ART_OPEN,'<article style="position: relative; margin-top: 84px; width: 308px; height: 360px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px;">')
c=c.replace(HDR_OPEN,'<div style="position: relative; height: 150px; flex-shrink: 0; box-sizing: border-box; padding: 22px 20px 0; background: var(--org); color: var(--on); border: 2.5px solid #1E1633; border-radius: 28px; box-shadow: 0 4px 0 #1E1633; display: flex; flex-direction: column; align-items: center; overflow: hidden;">')
# open body wrapper right after header closes: header ends before the sticker div
k=c.index('<div style="position: absolute; top: 120px; inset-inline-end: 14px;')
c=c[:k]+'<div style="position: relative; flex: 1; min-height: 0; box-sizing: border-box; background: #FFF9EC; border: 2.5px solid #1E1633; border-radius: 28px; box-shadow: 0 4px 0 #1E1633;">\n'+c[k:]
c=c.replace('top: 120px; inset-inline-end: 14px','top: -22px; inset-inline-end: 14px',1)
c=c.replace('bottom: 14px; display: flex; align-items: flex-end;','bottom: 12px; display: flex; align-items: flex-end;',1)
c=c.replace('</article>','</div>\n</article>',1)
c=c.replace('<div style="box-sizing: border-box; padding: 20px 20px 0; text-align: center;">','<div style="box-sizing: border-box; padding: 18px 20px 0; text-align: center;">',1)
c=title(c,'ד · כרטיס חברות · הפרדה: שני חלקים (ניסוי)')
open(P+'D-BadgeN1c.dc.html','w',encoding='utf-8').write(c)
print('ok')
