'use strict';
globalThis.LogoCore = (() => {
  const clone=x=>structuredClone(x);
  const common={family:'Anton',fontSize:125,letterSpacing:0,scaleX:1,scaleY:1,rotation:0,dx:0,dy:0,color:'#ffffff',visible:true,locked:false,lockAspect:false};
  const preset={version:1,name:'Thiết kế mẫu',canvas:{width:1254,height:1254,background:'#4b4b4b',transparent:false,lockAspect:true},font:{family:'Anton',weight:400},fonts:[],reference:{bbox:{x:41,y:384,w:1178,h:498},opacity:0.4},
    arc:{...clone(common),id:'arc',text:'SÁNG TẠO KẾT NỐI VÀ PHÁT TRIỂN',centerX:627,centerY:1005,radius:520,start:180,end:0,offset:50,align:'center',fit:true,bbox:{x:41,y:384,w:1178,h:498}},
    horizontal:{...clone(common),id:'horizontal',text:'LOGO STUDIO',fontSize:180,x:281,y:864,fit:true,align:'left',bbox:{x:281,y:711,w:694,h:153}},
    view:{guides:false,grid:false,target:false,reference:true},export:{crop:true,padding:24,transparent:true,scale:2,outline:true}};
  function freeze(x){Object.values(x).forEach(v=>{if(v&&typeof v==='object')freeze(v)});return Object.freeze(x)}freeze(preset);
  const graphemes=text=>Array.from(new Intl.Segmenter('vi',{granularity:'grapheme'}).segment(text),s=>s.segment);
  function arcPoint(cx,cy,r,angle){const a=angle*Math.PI/180;return{x:cx+r*Math.cos(a),y:cy-r*Math.sin(a),rotation:90-angle}}
  function cropBounds(boxes,padding=0){if(!boxes.length)throw Error('Không có đối tượng hiển thị để xuất.');const x=Math.min(...boxes.map(b=>b.x))-padding,y=Math.min(...boxes.map(b=>b.y))-padding;return{x,y,w:Math.max(...boxes.map(b=>b.x+b.w))+padding-x,h:Math.max(...boxes.map(b=>b.y+b.h))+padding-y}}
  function snapBox(box,canvas,others,tolerance){
    const anchors=(start,size)=>[start+size/2,start,start+size];
    function nearest(axis,size,limit){
      const targets=[limit/2,0,limit,...others.flatMap(b=>anchors(b[axis],b[size]))];let distance=tolerance,delta=0,line=null;
      for(const point of anchors(box[axis],box[size]))for(const target of targets){const gap=target-point;if(Math.abs(gap)<=distance&&(line===null||Math.abs(gap)<distance)){distance=Math.abs(gap);delta=gap;line=target}}
      return{delta,line};
    }
    const x=nearest('x','w',canvas.width),y=nearest('y','h',canvas.height);return{dx:x.delta,dy:y.delta,x:x.line,y:y.line};
  }
  function validate(p){
    const fail=()=>{throw Error('Dự án không hợp lệ hoặc không đúng schema phiên bản 1 (2 đối tượng).')};
    const num=(v,min=-100000,max=100000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail()};const str=(v,max=500)=>{if(typeof v!=='string'||v.length>max)fail()};const bool=v=>{if(typeof v!=='boolean')fail()};const color=v=>{if(typeof v!=='string'||!/^#[a-f\d]{6}$/i.test(v))fail()};
    const box=b=>{if(!b)fail();num(b.x);num(b.y);num(b.w,0.01);num(b.h,0.01)};
    if(!p||p.version!==1||!p.canvas||!p.arc||!p.horizontal||!p.view||!p.export||!p.reference||!p.font)fail();str(p.name);str(p.font.family);if(p.font.weight!==400)fail();num(p.canvas.width,32,10000);num(p.canvas.height,32,10000);color(p.canvas.background);bool(p.canvas.transparent);bool(p.canvas.lockAspect);box(p.reference.bbox);num(p.reference.opacity,0,1);
    for(const o of [p.arc,p.horizontal]){str(o.text);str(o.family,80);box(o.bbox);num(o.fontSize,1,2000);num(o.letterSpacing,-100,1000);num(o.scaleX,0.01,20);num(o.scaleY,0.01,20);num(o.rotation,-360,360);num(o.dx);num(o.dy);color(o.color);bool(o.visible);bool(o.locked);bool(o.lockAspect);bool(o.fit);if(!['left','center','right'].includes(o.align))fail()}
    if(p.arc.id!=='arc'||p.horizontal.id!=='horizontal')fail();num(p.arc.centerX);num(p.arc.centerY);num(p.arc.radius,1,10000);num(p.arc.start,0,360);num(p.arc.end,-360,360);num(p.arc.offset,0,100);if(p.arc.start<=p.arc.end||p.arc.start-p.arc.end>=360)fail();num(p.horizontal.x);num(p.horizontal.y);
    for(const k of ['guides','grid','target','reference'])bool(p.view[k]);for(const k of ['crop','transparent','outline'])bool(p.export[k]);num(p.export.padding,0,2000);num(p.export.scale,0.1,8);
    if(!Array.isArray(p.fonts)||p.fonts.length>20)fail();const families=new Set(['Anton']);for(const f of p.fonts){str(f.family,80);if(!/^[\w -]{1,80}$/.test(f.family)||families.has(f.family)||typeof f.data!=='string'||f.data.length>15000000||!/^data:font\/(ttf|otf);base64,[A-Za-z0-9+/]+=*$/.test(f.data))fail();families.add(f.family)}
    for(const o of [p.arc,p.horizontal,p.font])if(!families.has(o.family))fail();return p;
  }
  function parseProject(json){if(typeof json!=='string'||json.length>50000000)throw Error('File dự án quá lớn.');return validate(JSON.parse(json))}
  class History{constructor(p){this.items=[clone(p)];this.index=0}current(){return clone(this.items[this.index])}commit(p){validate(p);if(JSON.stringify(p)===JSON.stringify(this.items[this.index]))return;this.items.splice(this.index+1);this.items.push(clone(p));if(this.items.length>100)this.items.shift();this.index=this.items.length-1}get canUndo(){return this.index>0}get canRedo(){return this.index<this.items.length-1}undo(){if(this.canUndo)this.index--;return this.current()}redo(){if(this.canRedo)this.index++;return this.current()}}
  return{createProject:()=>clone(preset),parseProject,validate,History,graphemes,arcPoint,cropBounds,snapBox,clone};
})();
