const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const ctx={Intl,structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/core.js','utf8'),ctx);const C=ctx.LogoCore;
test('preset has exactly two objects: arc and horizontal',()=>{const p=C.createProject();assert.equal(p.canvas.width,1254);assert.equal(p.arc.id,'arc');assert.equal(p.horizontal.id,'horizontal');assert.equal(p.arc.words,undefined);assert.equal(p.arc.text,'SÁNG TẠO KẾT NỐI VÀ PHÁT TRIỂN');assert.equal(p.horizontal.text,'LOGO STUDIO');p.arc.radius=1;assert.equal(C.createProject().arc.radius,520)});
test('history restores edits and discards redo on a new edit',()=>{const h=new C.History(C.createProject());let p=h.current();p.horizontal.text='THIẾT KẾ MỚI';h.commit(p);assert.equal(h.undo().horizontal.text,'LOGO STUDIO');assert.equal(h.redo().horizontal.text,'THIẾT KẾ MỚI');h.undo();p=h.current();p.horizontal.text='LOGO MỚI';h.commit(p);assert.equal(h.canRedo,false)});
test('round trip preserves decomposed Vietnamese content',()=>{const p=C.createProject();p.arc.text='SA\u0301NG';assert.equal(C.parseProject(JSON.stringify(p)).arc.text,p.arc.text);assert.equal(C.graphemes(p.arc.text).length,4)});
test('invalid schema, geometry, IDs and remote font data are rejected',()=>{for(const mutate of[p=>p.version=99,p=>p.canvas.width=-1,p=>p.arc.radius=0,p=>p.horizontal.id='arc',p=>p.arc.start=null,p=>p.fonts.push({family:'x',data:'https://example.com/font.ttf'})]){const p=C.createProject();mutate(p);assert.throws(()=>C.parseProject(JSON.stringify(p)))}});
test('upper arc has correct position and tangent',()=>{assert.equal(C.arcPoint(627,1005,520,180).x,107);assert.equal(C.arcPoint(627,1005,520,90).y,485);assert.equal(C.arcPoint(627,1005,520,0).x,1147);assert.equal(C.arcPoint(627,1005,520,90).rotation,0)});
test('crop includes transformed bounds outside canvas',()=>{assert.equal(JSON.stringify(C.cropBounds([{x:-10,y:20,w:30,h:40},{x:50,y:-5,w:10,h:10}],8)),JSON.stringify({x:-18,y:-13,w:86,h:81}))});
test('snap centers and edges to the canvas within the provided tolerance',()=>{
 const center=C.snapBox({x:43,y:36,w:20,h:30},{width:100,height:100},[],4);
 assert.equal(center.dx,-3);assert.equal(center.dy,-1);assert.equal(center.x,50);assert.equal(center.y,50);
 const edge=C.snapBox({x:78,y:10,w:20,h:10},{width:100,height:100},[],3);
 assert.equal(edge.dx,2);assert.equal(edge.x,100);
});
test('snap uses nearest other-object alignment independently on both axes',()=>{
 const result=C.snapBox({x:117,y:237,w:20,h:20},{width:1000,height:1000},[{x:100,y:200,w:40,h:100}],4);
 assert.equal(result.dx,3);assert.equal(result.x,120);assert.equal(result.dy,3);assert.equal(result.y,250);
});
test('snap leaves out-of-range movement untouched and does not depend on zoom',()=>{
 const box={x:71,y:71,w:20,h:20},canvas={width:100,height:100};
 const free=C.snapBox(box,canvas,[],4);assert.equal(free.dx,0);assert.equal(free.dy,0);assert.equal(free.x,null);assert.equal(free.y,null);
 const near={x:43,y:43,w:20,h:20};assert.equal(C.snapBox(near,canvas,[],2).x,null);assert.equal(C.snapBox(near,canvas,[],4).x,50);
});
