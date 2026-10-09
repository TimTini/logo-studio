// Package source as a single file that can be opened directly with file://.
const fs=require('node:fs');const path=require('node:path');
const root=__dirname,dist=path.join(root,'dist');
const data='data:font/ttf;base64,'+fs.readFileSync(path.join(dist,'assets/Anton-Regular.ttf')).toString('base64');
fs.writeFileSync(path.join(dist,'assets/font-data.js'),'const ANTON_DATA='+JSON.stringify(data)+';\n');
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const licenses=['assets/OFL.txt','vendor/LICENSE.txt'].map(file=>fs.readFileSync(path.join(dist,file),'utf8').replace(/--/g,'—')).join('\n\n');
html=html.replace('<!doctype html>','<!doctype html>\n<!-- Bundled font and library licenses:\n'+licenses+'\n-->');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(dist,'style.css'),'utf8')+'</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(path.join(dist,file),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(root,'Logo-Editor-Offline.html'),html);
console.log('Built offline HTML ('+Buffer.byteLength(html)+' bytes), local font data and static dist.');
