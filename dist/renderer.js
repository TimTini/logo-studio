'use strict';
globalThis.LogoRenderer=(()=>{
  const NS='http://www.w3.org/2000/svg', C=LogoCore, fonts=new Map(), faces=new Map();
  // Canonically equivalent glyphs share one rendering sequence. Never mutate project text.
  const renderText=text=>text.normalize('NFC');
  function el(name,attrs={},text){const e=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e}
  function decode(data){return Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0)).buffer}
  async function loadFont(family,data){if(faces.get(family)===data)return;const bytes=decode(data),font=opentype.parse(bytes);const face=new FontFace(family,bytes,{weight:'400'});await face.load();document.fonts.add(face);fonts.set(family,{font,data});faces.set(family,data)}
  async function loadFonts(project){await loadFont('Anton',ANTON_DATA);for(const f of project.fonts)await loadFont(f.family,f.data);await document.fonts.ready}
  function missing(project){const warnings=[];for(const o of[project.arc,project.horizontal]){if(!o.visible)continue;const font=fonts.get(o.family)?.font;if(!font)throw Error('Font chưa tải: '+o.family);const chars=[...new Set(Array.from(o.text.normalize('NFC')).filter(c=>!(/\s/.test(c))&&font.charToGlyphIndex(c)===0))];if(chars.length)warnings.push(`${o.id==='arc'?'Vòng cung':'Chữ ngang'}: font thiếu ký tự ${chars.join(' ')}`)}return warnings}
  function arcPath(o){const a=C.arcPoint(o.centerX,o.centerY,o.radius,o.start),b=C.arcPoint(o.centerX,o.centerY,o.radius,o.end);return`M ${a.x} ${a.y} A ${o.radius} ${o.radius} 0 ${o.start-o.end>180?1:0} 1 ${b.x} ${b.y}`}
  function anchor(align){return{left:'start',center:'middle',right:'end'}[align]}
  function render(svg,p,{selected=null,reference=null,editor=true}={}){
    svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${p.canvas.width} ${p.canvas.height}`);
    const defs=el('defs');svg.append(defs);
    if(!p.canvas.transparent)svg.append(el('rect',{x:0,y:0,width:p.canvas.width,height:p.canvas.height,fill:p.canvas.background,'data-background':''}));
    if(editor&&reference&&p.view.reference)svg.append(el('image',{href:reference,x:0,y:0,width:p.canvas.width,height:p.canvas.height,preserveAspectRatio:'xMidYMid meet',opacity:p.reference.opacity,'data-editor':''}));
    const objects=el('g',{'data-logo':''});svg.append(objects);
    for(const o of[p.arc,p.horizontal]){
      if(!o.visible)continue;
      const g=el('g',{'data-object':o.id,fill:o.color,class:o.locked?'locked':''});objects.append(g);
      const text=el('text',{'font-family':o.family,'font-size':o.fontSize,'font-weight':400,'font-kerning':'none','font-variant-ligatures':'none','letter-spacing':o.letterSpacing,'text-anchor':anchor(o.align),'xml:space':'preserve'});
      g.append(text);
      if(o.id==='arc'){
        const path=el('path',{id:'curve-'+o.id,d:arcPath(o)});defs.append(path);
        const tp=el('textPath',{href:'#curve-'+o.id,startOffset:o.offset+'%'},renderText(o.text));text.append(tp);
        if(o.fit&&o.text){const length=path.getTotalLength(),natural=text.getComputedTextLength();if(natural>length*0.94)text.setAttribute('font-size',Math.max(1,o.fontSize*length*0.94/natural))}
        const pivot=C.arcPoint(o.centerX,o.centerY,o.radius,o.start-(o.start-o.end)*o.offset/100);
        g.setAttribute('transform',`translate(${o.dx} ${o.dy}) translate(${pivot.x} ${pivot.y}) rotate(${o.rotation}) scale(${o.scaleX} ${o.scaleY}) translate(${-pivot.x} ${-pivot.y})`);
      }else{
        text.setAttribute('x',o.x);text.setAttribute('y',o.y);text.textContent=renderText(o.text);
        let sx=1,sy=1,tx=0,ty=0;
        if(o.fit&&o.text){const b=text.getBBox();if(b.width&&b.height){sx=o.bbox.w/b.width;sy=o.bbox.h/b.height;if(o.lockAspect)sx=sy=Math.min(sx,sy);tx=o.bbox.x+(o.bbox.w-b.width*sx)/2-b.x*sx;ty=o.bbox.y+(o.bbox.h-b.height*sy)/2-b.y*sy}}
        const px=o.fit?o.bbox.x+o.bbox.w/2:o.x,py=o.fit?o.bbox.y+o.bbox.h/2:o.y;
        g.setAttribute('transform',`translate(${o.dx} ${o.dy}) translate(${px} ${py}) rotate(${o.rotation}) scale(${o.scaleX} ${o.scaleY}) translate(${-px} ${-py}) translate(${tx} ${ty}) scale(${sx} ${sy})`);
      }
    }
    if(editor){const guides=el('g',{'data-editor':'','pointer-events':'none'});svg.append(guides);
      if(p.view.grid){for(let x=0;x<=p.canvas.width;x+=100)guides.append(el('path',{d:`M ${x} 0 V ${p.canvas.height}`,stroke:'#a5b8de','stroke-width':0.6,opacity:.25}));for(let y=0;y<=p.canvas.height;y+=100)guides.append(el('path',{d:`M 0 ${y} H ${p.canvas.width}`,stroke:'#a5b8de','stroke-width':.6,opacity:.25}))}
      if(p.view.guides){guides.append(el('path',{d:arcPath(p.arc),fill:'none',stroke:'#81a6ff','stroke-width':1.5,'stroke-dasharray':'8 6'}));guides.append(el('path',{d:`M ${p.arc.centerX-15} ${p.arc.centerY} h 30 M ${p.arc.centerX} ${p.arc.centerY-15} v 30`,stroke:'#81a6ff','stroke-width':2}));guides.append(el('text',{x:p.arc.centerX+20,y:p.arc.centerY+5,fill:'#81a6ff','font-size':18},'O'))}
      if(p.view.target)for(const o of[p.arc,p.horizontal])guides.append(el('rect',{x:o.bbox.x,y:o.bbox.y,width:o.bbox.w,height:o.bbox.h,fill:'none',stroke:'#e7b67a','stroke-width':1.5,'stroke-dasharray':'6 5'}));
      if(selected){const b=bounds(svg,selected);if(b&&b.w&&b.h){guides.append(el('rect',{x:b.x-5,y:b.y-5,width:b.w+10,height:b.h+10,fill:'none',stroke:'#82a5ff','stroke-width':1.7}));for(const x of[b.x-5,b.x+b.w+5])for(const y of[b.y-5,b.y+b.h+5])guides.append(el('rect',{x:x-4,y:y-4,width:8,height:8,fill:'#fff',stroke:'#82a5ff','stroke-width':1.5}))}}
    }
    return svg;
  }
  function bounds(svg,id){const g=svg.querySelector(`[data-object="${id}"]`);if(!g||!g.textContent)return null;const b=g.getBBox(),m=svg.getCTM().inverse().multiply(g.getCTM());const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return{x:Math.min(...pts.map(p=>p.x)),y:Math.min(...pts.map(p=>p.y)),w:Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),h:Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y))}}
  function clipped(svg,project){
    const text=svg.querySelector('[data-object="arc"] text');if(!text)return false;let index=0;
    for(const grapheme of C.graphemes(renderText(project.arc.text))){const extent=text.getExtentOfChar(index);if(grapheme.trim()&&extent.width===0&&extent.height===0)return true;index+=grapheme.length}return false;
  }
  function outline(svg,project){
    for(const g of svg.querySelectorAll('[data-object]')){
      const o=project[g.dataset.object],text=g.querySelector('text'),font=fonts.get(o.family).font,size=Number(text.getAttribute('font-size'));const paths=[];let index=0;
      for(const grapheme of C.graphemes(renderText(o.text))){
        const pos=text.getStartPositionOfChar(index),angle=text.getRotationOfChar(index),d=font.getPath(grapheme.normalize('NFC'),0,0,size,{kerning:false}).toPathData(4);
        if(d)paths.push(el('path',{d,transform:`translate(${pos.x} ${pos.y}) rotate(${angle})`}));index+=grapheme.length;
      }
      g.replaceChildren(...paths);
    }
    svg.querySelector('defs')?.replaceChildren();
  }
  function fontCSS(project){return['Anton',...project.fonts.map(f=>f.family)].map(f=>`@font-face{font-family:'${f}';src:url('${fonts.get(f).data}');font-weight:400;font-style:normal}`).join('')}
  return{el,render,bounds,loadFonts,loadFont,missing,clipped,outline,fontCSS,fonts};
})();
