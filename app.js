const canvas = document.getElementById('floorCanvas');
const ctx = canvas.getContext('2d');
const emptyHint = document.getElementById('emptyHint');
const labels = { living:['リビング','LIVING', '#edf5df'], bedroom:['寝室','BED ROOM','#f7f2e8'], kitchen:['キッチン','KITCHEN','#e5f2ed'], bath:['浴室','BATH ROOM','#e7f0f4'], toilet:['トイレ','TOILET','#f0eaf4'], storage:['収納','STORAGE','#f0f2ee'], door:['ドア','DOOR','#fff'], window:['窓','WINDOW','#fff'] };
let selected = 'living', selectedIndex = -1, items = [], history = [[]], historyIndex = 0, zoom = 1, drag = null;

function snapshot(){ history = history.slice(0,historyIndex+1); history.push(JSON.parse(JSON.stringify(items))); historyIndex++; updateControls(); }
function updateControls(){ document.getElementById('undoBtn').disabled=historyIndex===0; document.getElementById('redoBtn').disabled=historyIndex===history.length-1; document.getElementById('rotateBtn').disabled=selectedIndex<0||!items[selectedIndex]; }
function pointer(e){ const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}; }
function localPoint(p,o){const a=-(o.rotation||0)*Math.PI/180,cx=o.x+o.w/2,cy=o.y+o.h/2,dx=p.x-cx,dy=p.y-cy;return{x:dx*Math.cos(a)-dy*Math.sin(a)+o.w/2,y:dx*Math.sin(a)+dy*Math.cos(a)+o.h/2};}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height); emptyHint.style.display=items.length?'none':'flex';
  items.forEach((it,i)=>{ const d=labels[it.type]; ctx.save();ctx.translate(it.x+it.w/2,it.y+it.h/2);ctx.rotate((it.rotation||0)*Math.PI/180);ctx.fillStyle=d[2];ctx.strokeStyle='#31443d';ctx.lineWidth=i===selectedIndex?5:3;
    if(it.type==='door'){ctx.beginPath();ctx.moveTo(-it.w/2,it.h/2);ctx.lineTo(-it.w/2,-it.h/2);ctx.arc(-it.w/2,it.h/2,it.h,-Math.PI/2,0);ctx.stroke();}
    else if(it.type==='window'){ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-it.w/2,0);ctx.lineTo(it.w/2,0);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();}
    else {ctx.fillRect(-it.w/2,-it.h/2,it.w,it.h);ctx.strokeRect(-it.w/2,-it.h/2,it.w,it.h);ctx.fillStyle='#334740';ctx.font='600 16px "DM Sans"';ctx.textAlign='center';ctx.fillText(d[1],0,-5);ctx.font='13px "Noto Sans JP"';ctx.fillStyle='#74817c';ctx.fillText(d[0],0,18);ctx.fillStyle='#1e806c';ctx.fillRect(it.w/2-9,it.h/2-9,9,9);}
    ctx.restore();
  });
}
document.querySelectorAll('.part').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.part').forEach(x=>x.classList.remove('active'));btn.classList.add('active');selected=btn.dataset.type;}));
canvas.addEventListener('pointerdown',e=>{const p=pointer(e); let found=-1, mode='move'; for(let i=items.length-1;i>=0;i--){let o=items[i],q=localPoint(p,o);if(q.x>=-10&&q.x<=o.w+10&&q.y>=-10&&q.y<=o.h+10){found=i;if(q.x>o.w-22&&q.y>o.h-22)mode='resize';break;}}
  if(found<0){let equipment=['door','window'].includes(selected);items.push({type:selected,x:p.x-(equipment?0:80),y:p.y-(equipment?0:55),w:selected==='window'?100:equipment?55:160,h:selected==='door'?55:selected==='window'?5:110,rotation:0});selectedIndex=items.length-1;snapshot();updateControls();draw();return;}
  selectedIndex=found;updateControls();const o=items[found];drag={index:found,mode,start:p,original:{...o}};canvas.setPointerCapture(e.pointerId);draw();
});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=pointer(e),o=items[drag.index],dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(drag.mode==='move'){o.x=drag.original.x+dx;o.y=drag.original.y+dy}else{o.w=Math.max(60,drag.original.w+dx);o.h=Math.max(50,drag.original.h+dy)}draw();});
canvas.addEventListener('pointerup',()=>{if(drag){drag=null;snapshot();draw();}});
document.getElementById('clearBtn').onclick=()=>{if(items.length){items=[];selectedIndex=-1;snapshot();updateControls();draw();}};
document.getElementById('undoBtn').onclick=()=>{if(historyIndex>0){items=JSON.parse(JSON.stringify(history[--historyIndex]));selectedIndex=-1;draw();updateControls();}};
document.getElementById('redoBtn').onclick=()=>{if(historyIndex<history.length-1){items=JSON.parse(JSON.stringify(history[++historyIndex]));selectedIndex=-1;draw();updateControls();}};
document.getElementById('rotateBtn').onclick=()=>{const item=items[selectedIndex];if(!item)return;item.rotation=((item.rotation||0)+90)%360;snapshot();updateControls();draw();};
function setZoom(v){zoom=Math.min(1.4,Math.max(.6,v));canvas.style.width=zoom*100+'%';canvas.style.height=zoom*100+'%';document.getElementById('zoomLabel').textContent=Math.round(zoom*100)+'%';}
document.getElementById('zoomIn').onclick=()=>setZoom(zoom+.1); document.getElementById('zoomOut').onclick=()=>setZoom(zoom-.1);
document.getElementById('downloadBtn').onclick=()=>{if(!items.length){alert('まずは間取りを作成してください。');return;}const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height;const out=output.getContext('2d');out.fillStyle='#ffffff';out.fillRect(0,0,output.width,output.height);out.drawImage(canvas,0,0);const a=document.createElement('a');a.download='madori-floorplan.png';a.href=output.toDataURL('image/png');a.click();};
document.querySelectorAll('[data-scroll-editor]').forEach(b=>b.onclick=()=>document.getElementById('editor').scrollIntoView({behavior:'smooth'}));
window.addEventListener('resize',draw); updateControls(); draw();
