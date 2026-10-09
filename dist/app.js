'use strict';
const C=LogoCore,R=LogoRenderer,$=id=>document.getElementById(id),STORE='logo-studio.two-objects.v1';
let project=C.createProject(),history=new C.History(project),selected='arc',reference=null,zoom=1,pan={x:0,y:0},space=false,ready=false,toastTimer,drag=null;
let snapEnabled=true;
const svg=$('preview');
function toast(message,error=false){$('toast').textContent=message;$('toast').classList.toggle('error',error);$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),6000)}
function autosave(){try{localStorage.setItem(STORE,JSON.stringify(project));$('saveStatus').textContent='Đã lưu tự động trên máy'}catch(e){$('saveStatus').textContent='Không thể lưu tự động';toast('Bộ nhớ trình duyệt không khả dụng hoặc đã đầy. Hãy lưu dự án JSON.',true)}}
function commit(){try{C.validate(project);history.commit(project);autosave();updateHistory()}catch(e){project=history.current();toast(e.message,true);refresh()}}
function updateHistory(){$('undo').disabled=!history.canUndo;$('redo').disabled=!history.canRedo}
function get(path){return path.split('.').reduce((o,k)=>o[k],project)}
function set(path,value){const keys=path.split('.'),last=keys.pop();keys.reduce((o,k)=>o[k],project)[last]=value}
function field(label,path,{type='number',min,max,step=1,options,full=false}={}){
  const wrapper=document.createElement('label');wrapper.className=type==='checkbox'?'check':'field'+(full?' full':'');
  const caption=document.createElement('span');caption.textContent=label;
  let input;if(options){input=document.createElement('select');for(const [value,name]of options){const opt=document.createElement('option');opt.value=value;opt.textContent=name;input.append(opt)}}else if(type==='textarea'){input=document.createElement('textarea');input.maxLength=500}else{input=document.createElement('input');input.type=type;if(min!==undefined)input.min=min;if(max!==undefined)input.max=max;input.step=step}
  input.dataset.path=path;input.setAttribute('aria-label',label);if(type==='checkbox')input.checked=get(path);else input.value=get(path);
  input.addEventListener('input',()=>{
    if(type==='number'&&(!input.value||!input.checkValidity()))return;
    const before=C.clone(project),previous=get(path),value=type==='checkbox'?input.checked:type==='number'?Number(input.value):input.value;set(path,value);
    if(path==='canvas.width'&&project.canvas.lockAspect)project.canvas.height=Math.round(project.canvas.height*value/previous);
    if(path==='canvas.height'&&project.canvas.lockAspect)project.canvas.width=Math.round(project.canvas.width*value/previous);
    if((path.endsWith('scaleX')||path.endsWith('scaleY'))&&project[selected].lockAspect){const key=path.endsWith('scaleX')?'scaleY':'scaleX';project[selected][key]=value}
    try{C.validate(project);render();updateMetrics();if(path.startsWith('export.'))exportInfo()}catch(e){project=before;render();updateMetrics();toast(e.message,true)}
  });
  input.addEventListener('change',()=>{commit();refresh()});
  if(type==='checkbox')wrapper.append(input,caption);else wrapper.append(caption,input);return wrapper;
}
function fields(container,items){const grid=document.createElement('div');grid.className='fields';for(const item of items)grid.append(field(...item));container.append(grid)}
function section(container,title,items){const s=document.createElement('section');s.className='inspector-section';const t=document.createElement('div');t.className='section-title';t.textContent=title;s.append(t);fields(s,items);container.append(s);return s}
const num=(min=-10000,max=10000,step=.1)=>({min,max,step});
const aligns=[['left','Trái'],['center','Giữa'],['right','Phải']];
function render(){if(!ready)return;R.render(svg,project,{selected,reference});$('canvasSize').textContent=`${project.canvas.width} × ${project.canvas.height} px`;for(const[k,id]of[['guides','toggleGuides'],['grid','toggleGrid'],['target','toggleTarget']])$(id).setAttribute('aria-pressed',project.view[k]);$('selectionStatus').textContent=(selected==='arc'?'Vòng cung':'Chữ ngang')+' được chọn';}
function refresh(){
  if(!ready)return;render();updateHistory();$('projectName').textContent=project.name;
  $('layers').replaceChildren();for(const[id,label,icon]of[['arc','Chữ vòng cung','◠'],['horizontal','Chữ ngang','T']]){const button=document.createElement('button');button.className='layer'+(selected===id?' active':'');button.dataset.select=id;button.setAttribute('aria-pressed',selected===id);const mark=document.createElement('span');mark.className='layer-icon';mark.textContent=icon;const text=document.createElement('span');text.className='layer-text';text.textContent=label;const small=document.createElement('small');small.textContent=project[id].text;text.append(small);const eye=document.createElement('span');eye.className='layer-eye';eye.textContent=project[id].visible?'●':'○';button.append(mark,text,eye);button.onclick=()=>{commit();selected=id;refresh()};$('layers').append(button)}
  $('canvasControls').replaceChildren();fields($('canvasControls'),[['Chiều rộng · px','canvas.width',num(32,10000,1)],['Chiều cao · px','canvas.height',num(32,10000,1)],['Màu nền','canvas.background',{type:'color',full:true}],['Khóa tỷ lệ khung','canvas.lockAspect',{type:'checkbox'}],['Nền trong suốt','canvas.transparent',{type:'checkbox'}]]);
  $('referenceControls').replaceChildren();if(reference)fields($('referenceControls'),[['Độ mờ · 0–1','reference.opacity',{min:0,max:1,step:.05,full:true}],['Hiển thị ảnh','view.reference',{type:'checkbox'}]]);$('removeReference').hidden=!reference;
  $('selectedName').textContent=selected==='arc'?'Chữ vòng cung':'Chữ ngang';$('selectedIcon').textContent=selected==='arc'?'◠':'T';
  const panel=$('inspector'),key=selected,o=project[key],fontOptions=[['Anton','Anton Regular'],...project.fonts.map(f=>[f.family,f.family])];panel.replaceChildren();
  section(panel,'NỘI DUNG',[
    ['Văn bản',key+'.text',{type:'textarea',full:true}],['Font chữ',key+'.family',{options:fontOptions,full:true}],['Cỡ chữ · px',key+'.fontSize',num(1,2000)],['Giãn chữ · px',key+'.letterSpacing',num(-100,1000)],['Màu chữ',key+'.color',{type:'color',full:true}]
  ]);
  if(key==='arc')section(panel,'ĐƯỜNG VÒNG CUNG',[
    ['Tâm X · px','arc.centerX',num()],['Tâm Y · px','arc.centerY',num()],['Bán kính · px','arc.radius',num(1,10000)],['Vị trí trên cung · %','arc.offset',num(0,100)],['Góc đầu · °','arc.start',num(0,360)],['Góc cuối · °','arc.end',num(-360,360)],['Căn chữ','arc.align',{options:aligns,full:true}],['Tự giảm cỡ chữ để vừa cung','arc.fit',{type:'checkbox'}]
  ]);else section(panel,'VỊ TRÍ & KHUNG CHỮ',[
    ['X · px','horizontal.x',num()],['Đường chân Y · px','horizontal.y',num()],['Khung X · px','horizontal.bbox.x',num()],['Khung Y · px','horizontal.bbox.y',num()],['Rộng · px','horizontal.bbox.w',num(.1)],['Cao · px','horizontal.bbox.h',num(.1)],['Căn chữ','horizontal.align',{options:aligns,full:true}],['Fit vào khung đích','horizontal.fit',{type:'checkbox'}]
  ]);
  section(panel,'BIẾN ĐỔI',[
    ['Dịch X · px',key+'.dx',num()],['Dịch Y · px',key+'.dy',num()],['Tỷ lệ X',key+'.scaleX',num(.01,20,.01)],['Tỷ lệ Y',key+'.scaleY',num(.01,20,.01)],['Góc xoay · °',key+'.rotation',num(-360,360)],['Khóa tỷ lệ',key+'.lockAspect',{type:'checkbox'}],['Khóa kéo vị trí',key+'.locked',{type:'checkbox'}],['Hiển thị đối tượng',key+'.visible',{type:'checkbox'}]
  ]);
  const boundsSection=section(panel,'KÍCH THƯỚC ĐỐI CHIẾU',[]);const metrics=document.createElement('div');metrics.id='metrics';boundsSection.append(metrics);updateMetrics();
  $('fontDescription').replaceChildren(document.createTextNode(o.family+' Regular'));const small=document.createElement('small');small.textContent='Trọng lượng 400 · không giả lập đậm';$('fontDescription').append(small);
  if($('exportDialog').open)exportPanel();
}
function updateMetrics(){const container=$('metrics');if(!container)return;const actual=R.bounds(svg,selected),target=project[selected].bbox;container.replaceChildren();const table=document.createElement('table');table.className='box-table';const head=document.createElement('thead');head.innerHTML='<tr><th>Khung</th><th>X</th><th>Y</th><th>W</th><th>H</th></tr>';table.append(head);const body=document.createElement('tbody');for(const[label,b]of[['Thực tế',actual],['Đích',target],['Sai lệch',actual?{x:actual.x-target.x,y:actual.y-target.y,w:actual.w-target.w,h:actual.h-target.h}:null]]){const tr=document.createElement('tr');for(const v of[label,...['x','y','w','h'].map(k=>b?b[k].toFixed(1):'—')]){const td=document.createElement('td');td.textContent=v;tr.append(td)}body.append(tr)}table.append(body);container.append(table);const note=document.createElement('p');note.className='bounds-note';note.textContent='Đơn vị px gốc. Khung thực tế được đo trên SVG sau biến đổi; khung đích lấy từ đặc tả, không mặc định trùng nhau.';container.append(note);const warnings=R.missing(project);if(warnings.length){note.textContent=warnings.join(' · ');note.classList.add('error')}}
function fitView(){const rect=$('stage').getBoundingClientRect();const size=Math.min(rect.width-100,rect.height-130);$('artboard').style.width=Math.max(180,size)+'px';$('artboard').style.height=Math.max(180,size)*project.canvas.height/project.canvas.width+'px';zoom=1;pan={x:0,y:0};updateView()}
function updateView(){$('artboard').style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;$('zoomLabel').textContent=Math.round(zoom*100)+'%'}
function localPoint(event){return new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse())}
$('stage').addEventListener('pointerdown',event=>{
  if(event.target.closest('button'))return;const object=event.target.closest('[data-object]');
  if(space||event.button===1){drag={kind:'pan',client:{x:event.clientX,y:event.clientY},before:{...pan}};event.preventDefault()}
  else if(object){commit();selected=object.dataset.object;refresh();if(project[selected].locked)return;drag={kind:'object',start:localPoint(event),dx:project[selected].dx,dy:project[selected].dy,id:selected,box:R.bounds(svg,selected),others:['arc','horizontal'].filter(id=>id!==selected).map(id=>R.bounds(svg,id)).filter(Boolean)};event.preventDefault()}
  if(drag)$('stage').setPointerCapture(event.pointerId);
});
$('stage').addEventListener('pointermove',event=>{
  if(!drag)return;if(drag.kind==='pan'){pan={x:drag.before.x+event.clientX-drag.client.x,y:drag.before.y+event.clientY-drag.client.y};updateView();return}
  const p=localPoint(event),o=project[drag.id],dx=p.x-drag.start.x,dy=p.y-drag.start.y;let snap=null;
  if(snapEnabled&&!event.altKey&&drag.box){const matrix=svg.getScreenCTM();const tolerance=7/Math.hypot(matrix.a,matrix.b);snap=C.snapBox({...drag.box,x:drag.box.x+dx,y:drag.box.y+dy},project.canvas,drag.others,tolerance)}
  o.dx=drag.dx+dx+(snap?.dx??0);o.dy=drag.dy+dy+(snap?.dy??0);render();updateMetrics();
  if(snap){const guides=R.el('g',{'data-editor':'','data-snap':'','pointer-events':'none',stroke:'#f190d3','stroke-width':1.5,'stroke-dasharray':'6 4','vector-effect':'non-scaling-stroke'});
    if(snap.x!==null)guides.append(R.el('line',{x1:snap.x,y1:0,x2:snap.x,y2:project.canvas.height,'vector-effect':'non-scaling-stroke'}));
    if(snap.y!==null)guides.append(R.el('line',{x1:0,y1:snap.y,x2:project.canvas.width,y2:snap.y,'vector-effect':'non-scaling-stroke'}));
    if(guides.childElementCount)svg.append(guides);
  }
});
function endDrag(){if(!drag)return;const save=drag.kind==='object';drag=null;if(save){commit();refresh()}}
$('stage').addEventListener('pointerup',endDrag);$('stage').addEventListener('pointercancel',endDrag);
document.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,select'))return;if(event.code==='Space'){space=true;event.preventDefault()}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();restore(event.shiftKey?'redo':'undo')}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();saveProject()}if(event.key==='ArrowLeft'||event.key==='ArrowRight'||event.key==='ArrowUp'||event.key==='ArrowDown'){if(project[selected].locked)return;event.preventDefault();const delta=event.shiftKey?10:1;if(event.key==='ArrowLeft')project[selected].dx-=delta;if(event.key==='ArrowRight')project[selected].dx+=delta;if(event.key==='ArrowUp')project[selected].dy-=delta;if(event.key==='ArrowDown')project[selected].dy+=delta;commit();refresh()}});
document.addEventListener('keyup',event=>{if(event.code==='Space')space=false});window.addEventListener('blur',()=>{space=false;endDrag()});
async function restore(direction){project=history[direction]();try{await R.loadFonts(project);autosave();refresh()}catch(e){toast(e.message,true)}}
$('undo').onclick=()=>restore('undo');$('redo').onclick=()=>restore('redo');
for(const[id,key]of[['toggleGuides','guides'],['toggleGrid','grid'],['toggleTarget','target']])$(id).onclick=()=>{project.view[key]=!project.view[key];commit();refresh()};
$('toggleSnap').onclick=()=>{snapEnabled=!snapEnabled;$('toggleSnap').setAttribute('aria-pressed',snapEnabled);svg.querySelector('[data-snap]')?.remove();toast(snapEnabled?'Đã bật bám điểm. Giữ Alt để kéo tự do.':'Đã tắt bám điểm khi kéo.')};
$('zoomIn').onclick=()=>{zoom=Math.min(5,zoom*1.2);updateView()};$('zoomOut').onclick=()=>{zoom=Math.max(.2,zoom/1.2);updateView()};$('fitView').onclick=fitView;window.addEventListener('resize',fitView);
$('resetObject').onclick=()=>{project[selected]=C.createProject()[selected];commit();refresh()};
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function saveProject(){commit();download(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),'logo-project.json');toast('Đã xuất dự án JSON kèm font tùy chỉnh.')}
$('saveProject').onclick=saveProject;$('exportJSON').onclick=saveProject;
$('newProject').onclick=()=>{project=C.createProject();reference=null;selected='arc';commit();refresh();fitView();toast('Đã tạo bản gốc mới. Có thể hoàn tác bằng Ctrl+Z.')};
$('openProject').onclick=()=>$('projectFile').click();
$('projectFile').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>50000000)throw Error('Dự án vượt quá 50 MB.');const next=C.parseProject(await file.text());await R.loadFonts(next);project=next;commit();refresh();fitView();toast('Đã mở dự án.')}catch(e){toast('Không mở được dự án: '+e.message,true)}event.target.value=''};
const readData=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Không đọc được file.'));reader.readAsDataURL(file)});
$('uploadReference').onclick=()=>$('referenceFile').click();$('removeReference').onclick=()=>{reference=null;refresh()};
$('referenceFile').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20000000)throw Error('Chọn ảnh PNG/JPG/WebP tối đa 20 MB.');const data=await readData(file),img=new Image();img.src=data;await img.decode();reference=data;project.view.reference=true;commit();refresh();toast('Ảnh tham chiếu chỉ dùng đối chiếu, không có trong file xuất.')}catch(e){toast(e.message,true)}event.target.value=''};
$('uploadFont').onclick=()=>$('fontFile').click();$('fontFile').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(!/\.(ttf|otf)$/i.test(file.name)||file.size>10000000)throw Error('Chọn font TTF/OTF tối đa 10 MB.');const raw=await readData(file),family='Custom '+(project.fonts.length+1)+' '+file.name.replace(/\.[^.]+$/,'').replace(/[^\w -]/g,'').slice(0,45),data='data:font/'+(/\.otf$/i.test(file.name)?'otf':'ttf')+';base64,'+raw.split(',')[1];await R.loadFont(family,data);project.fonts.push({family,data});project[selected].family=family;commit();refresh();const warn=R.missing(project);toast(warn.length?warn.join(' · '):'Đã áp dụng font cho đối tượng đang chọn.',!!warn.length)}catch(e){toast('Không tải được font: '+e.message,true)}event.target.value=''};
function exportPanel(){$('exportControls').replaceChildren();fields($('exportControls'),[['Nền trong suốt','export.transparent',{type:'checkbox'}],['Cắt gọn theo logo','export.crop',{type:'checkbox'}],['SVG chuyển chữ thành outline','export.outline',{type:'checkbox'}],['Padding · px','export.padding',num(0,2000,1)],['Độ phân giải PNG · ×','export.scale',num(.1,8,.1)]]);exportInfo()}
function exportBox(){return project.export.crop?C.cropBounds(['arc','horizontal'].map(id=>R.bounds(svg,id)).filter(b=>b&&b.w&&b.h),project.export.padding):{x:0,y:0,w:project.canvas.width,h:project.canvas.height}}
function exportInfo(){try{const b=exportBox();$('exportInfo').textContent=`SVG ${Math.ceil(b.w)} × ${Math.ceil(b.h)} px · PNG ${Math.ceil(b.w*project.export.scale)} × ${Math.ceil(b.h*project.export.scale)} px`;}catch(e){$('exportInfo').textContent=e.message}}
$('showExport').onclick=()=>{commit();exportPanel();$('exportDialog').showModal()};
function makeExport(forceOutline=false){
  const warnings=R.missing(project);if(warnings.length)throw Error(warnings.join(' · '));
  if(R.clipped(svg,project))throw Error('Chữ vượt ra ngoài cung. Bật tự giảm cỡ chữ, giảm cỡ chữ hoặc điều chỉnh vị trí trên cung trước khi xuất.');
  const out=R.el('svg',{xmlns:'http://www.w3.org/2000/svg'});out.style.cssText='position:fixed;left:-50000px;top:0;width:1254px;height:1254px';document.body.append(out);
  try{const p=C.clone(project);p.canvas.transparent=true;R.render(out,p,{editor:false});const b=exportBox();if(forceOutline||project.export.outline)R.outline(out,p);else{const style=R.el('style',{},R.fontCSS(p));out.querySelector('defs').append(style)}
    if(!project.export.transparent)out.insertBefore(R.el('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:project.canvas.background}),out.querySelector('[data-logo]'));
    out.append(R.el('metadata',{},JSON.stringify({originalText:{arc:project.arc.text,horizontal:project.horizontal.text}})));
    out.setAttribute('viewBox',`${b.x} ${b.y} ${b.w} ${b.h}`);out.setAttribute('width',Math.ceil(b.w));out.setAttribute('height',Math.ceil(b.h));out.removeAttribute('style');out.querySelectorAll('[data-object]').forEach(g=>{g.removeAttribute('class');g.removeAttribute('data-object')});out.querySelector('[data-logo]')?.removeAttribute('data-logo');return{xml:new XMLSerializer().serializeToString(out),box:b};
  }finally{out.remove()}
}
$('exportSVG').onclick=()=>{try{const{xml}=makeExport();download(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}),'logo.svg');toast('Đã xuất SVG '+(project.export.outline?'outline.':'kèm font nhúng.'))}catch(e){toast(e.message,true)}};
$('exportPNG').onclick=async()=>{const button=$('exportPNG');button.disabled=true;let url;try{const{xml,box}=makeExport(true),width=Math.ceil(box.w*project.export.scale),height=Math.ceil(box.h*project.export.scale);if(width>16000||height>16000||width*height>40000000)throw Error('PNG quá lớn (tối đa 40 triệu pixel). Giảm độ phân giải hoặc kích thước khung.');url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0,width,height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Trình duyệt không tạo được PNG.');download(blob,'logo.png');toast(`Đã xuất PNG ${width} × ${height} px.`)}catch(e){toast(e.message,true)}finally{if(url)URL.revokeObjectURL(url);button.disabled=false}};
async function init(){try{let saved;try{saved=localStorage.getItem(STORE)}catch(e){toast('Trình duyệt không hỗ trợ autosave. Có thể lưu dự án JSON.',true)}if(saved){try{project=C.parseProject(saved)}catch(e){toast('Bản tự lưu không hợp lệ; đang mở preset gốc.',true)}}await R.loadFonts(project);history=new C.History(project);ready=true;refresh();fitView();$('saveStatus').textContent=saved?'Đã khôi phục bản tự lưu':'Sẵn sàng · font đã tải'}catch(e){$('saveStatus').textContent='Không thể khởi tạo';toast(e.message,true)}}
init();
