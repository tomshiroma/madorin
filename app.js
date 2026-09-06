const canvas = document.getElementById('floorCanvas');
const ctx = canvas.getContext('2d');
const emptyHint = document.getElementById('emptyHint');
const labels = { living:['リビング','LIVING', '#edf5df'], bedroom:['寝室','BED ROOM','#f7f2e8'], kitchen:['キッチン','KITCHEN','#e5f2ed'], bath:['浴室','BATH ROOM','#e7f0f4'], toilet:['トイレ','TOILET','#f0eaf4'], storage:['収納','STORAGE','#f0f2ee'], door:['ドア','DOOR','#fff'], window:['窓','WINDOW','#fff'] };
let placementType = null, selectedIndex = -1, items = [], history = [[]], historyIndex = 0, zoom = 1, drag = null, snapGuides = [];

function snapshot(){ history = history.slice(0,historyIndex+1); history.push(JSON.parse(JSON.stringify(items))); historyIndex++; updateControls(); }
function updateControls(){const status=document.getElementById('selectionStatus'),item=items[selectedIndex];document.getElementById('undoBtn').disabled=historyIndex===0;document.getElementById('redoBtn').disabled=historyIndex===history.length-1;document.getElementById('rotateBtn').disabled=!item;document.getElementById('sendBackwardBtn').disabled=!item||selectedIndex===0;document.getElementById('bringForwardBtn').disabled=!item||selectedIndex===items.length-1;if(placementType){status.textContent=`配置モード：${labels[placementType][0]}`;status.classList.add('is-active');}else if(item){status.textContent=`選択中：${labels[item.type][0]}`;status.classList.add('is-active');}else{status.textContent='未選択';status.classList.remove('is-active');}canvas.style.cursor=placementType?'crosshair':'default';}
function pointer(e){ const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}; }
function localPoint(p,o){const a=-(o.rotation||0)*Math.PI/180,cx=o.x+o.w/2,cy=o.y+o.h/2,dx=p.x-cx,dy=p.y-cy;return{x:dx*Math.cos(a)-dy*Math.sin(a)+o.w/2,y:dx*Math.sin(a)+dy*Math.cos(a)+o.h/2};}
function bounds(o){const vertical=(o.rotation||0)%180!==0,w=vertical?o.h:o.w,h=vertical?o.w:o.h;return{left:o.x+(o.w-w)/2,top:o.y+(o.h-h)/2,width:w,height:h,right:o.x+(o.w-w)/2+w,bottom:o.y+(o.h-h)/2+h};}
function snapItem(item,index){const threshold=12,m=bounds(item);let bestX=null,bestY=null;snapGuides=[];items.forEach((other,i)=>{if(i===index)return;const b=bounds(other);[[m.left,b.left],[m.left,b.right],[m.right,b.left],[m.right,b.right]].forEach(([from,to])=>{const delta=to-from;if(Math.abs(delta)<=threshold&&(!bestX||Math.abs(delta)<Math.abs(bestX.delta)))bestX={delta,line:to};});[[m.top,b.top],[m.top,b.bottom],[m.bottom,b.top],[m.bottom,b.bottom]].forEach(([from,to])=>{const delta=to-from;if(Math.abs(delta)<=threshold&&(!bestY||Math.abs(delta)<Math.abs(bestY.delta)))bestY={delta,line:to};});});if(bestX){item.x+=bestX.delta;snapGuides.push({axis:'x',value:bestX.line});}if(bestY){item.y+=bestY.delta;snapGuides.push({axis:'y',value:bestY.line});}}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height); emptyHint.style.display=items.length?'none':'flex';
  items.forEach((it,i)=>{ const d=labels[it.type]; ctx.save();ctx.translate(it.x+it.w/2,it.y+it.h/2);ctx.rotate((it.rotation||0)*Math.PI/180);ctx.fillStyle=d[2];ctx.strokeStyle='#31443d';ctx.lineWidth=i===selectedIndex?5:3;
    if(it.type==='door'){ctx.beginPath();ctx.moveTo(-it.w/2,it.h/2);ctx.lineTo(-it.w/2,-it.h/2);ctx.arc(-it.w/2,it.h/2,it.h,-Math.PI/2,0);ctx.stroke();}
    else if(it.type==='window'){ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-it.w/2,0);ctx.lineTo(it.w/2,0);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();}
    else {ctx.fillRect(-it.w/2,-it.h/2,it.w,it.h);ctx.strokeRect(-it.w/2,-it.h/2,it.w,it.h);ctx.fillStyle='#334740';ctx.font='600 16px "DM Sans"';ctx.textAlign='center';ctx.fillText(d[1],0,-5);ctx.font='13px "Noto Sans JP"';ctx.fillStyle='#74817c';ctx.fillText(d[0],0,18);ctx.fillStyle='#1e806c';ctx.fillRect(it.w/2-9,it.h/2-9,9,9);}
    if(i===selectedIndex){ctx.strokeStyle='#1e806c';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.strokeRect(-it.w/2-8,-it.h/2-8,it.w+16,it.h+16);ctx.setLineDash([]);}
    ctx.restore();
  });
  snapGuides.forEach(guide=>{ctx.save();ctx.strokeStyle='#1e806c';ctx.lineWidth=1;ctx.setLineDash([5,5]);ctx.beginPath();if(guide.axis==='x'){ctx.moveTo(guide.value,0);ctx.lineTo(guide.value,canvas.height);}else{ctx.moveTo(0,guide.value);ctx.lineTo(canvas.width,guide.value);}ctx.stroke();ctx.restore();});
}
document.querySelectorAll('.part').forEach(btn=>btn.addEventListener('click',()=>{const activating=placementType!==btn.dataset.type;document.querySelectorAll('.part').forEach(x=>x.classList.remove('active'));placementType=activating?btn.dataset.type:null;if(activating)btn.classList.add('active');updateControls();}));
canvas.addEventListener('pointerdown',e=>{const p=pointer(e); let found=-1, mode='move'; for(let i=items.length-1;i>=0;i--){let o=items[i],q=localPoint(p,o);if(q.x>=-10&&q.x<=o.w+10&&q.y>=-10&&q.y<=o.h+10){found=i;if(q.x>o.w-22&&q.y>o.h-22)mode='resize';break;}}
  if(found<0){if(!placementType){selectedIndex=-1;updateControls();draw();return;}let type=placementType,equipment=['door','window'].includes(type);items.push({type,x:p.x-(equipment?0:80),y:p.y-(equipment?0:55),w:type==='window'?100:equipment?55:160,h:type==='door'?55:type==='window'?5:110,rotation:0});selectedIndex=items.length-1;placementType=null;document.querySelectorAll('.part').forEach(x=>x.classList.remove('active'));snapshot();updateControls();draw();return;}
  selectedIndex=found;placementType=null;document.querySelectorAll('.part').forEach(x=>x.classList.remove('active'));updateControls();const o=items[found];drag={index:found,mode,start:p,original:{...o}};canvas.setPointerCapture(e.pointerId);draw();
});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=pointer(e),o=items[drag.index],dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(drag.mode==='move'){o.x=drag.original.x+dx;o.y=drag.original.y+dy;snapItem(o,drag.index);}else{o.w=Math.max(60,drag.original.w+dx);o.h=Math.max(50,drag.original.h+dy);snapGuides=[];}draw();});
canvas.addEventListener('pointerup',()=>{if(drag){drag=null;snapGuides=[];snapshot();draw();}});
document.getElementById('clearBtn').onclick=()=>{if(items.length){items=[];selectedIndex=-1;snapshot();updateControls();draw();}};
document.getElementById('undoBtn').onclick=()=>{if(historyIndex>0){items=JSON.parse(JSON.stringify(history[--historyIndex]));selectedIndex=-1;draw();updateControls();}};
document.getElementById('redoBtn').onclick=()=>{if(historyIndex<history.length-1){items=JSON.parse(JSON.stringify(history[++historyIndex]));selectedIndex=-1;draw();updateControls();}};
document.getElementById('rotateBtn').onclick=()=>{const item=items[selectedIndex];if(!item)return;item.rotation=((item.rotation||0)+90)%360;snapshot();updateControls();draw();};
document.getElementById('sendBackwardBtn').onclick=()=>{if(selectedIndex<=0)return;const [item]=items.splice(selectedIndex,1);items.splice(--selectedIndex,0,item);snapshot();draw();};
document.getElementById('bringForwardBtn').onclick=()=>{if(selectedIndex<0||selectedIndex>=items.length-1)return;const [item]=items.splice(selectedIndex,1);items.splice(++selectedIndex,0,item);snapshot();draw();};
function setZoom(v){zoom=Math.min(1.4,Math.max(.6,v));canvas.style.width=zoom*100+'%';canvas.style.height=zoom*100+'%';document.getElementById('zoomLabel').textContent=Math.round(zoom*100)+'%';}
document.getElementById('zoomIn').onclick=()=>setZoom(zoom+.1); document.getElementById('zoomOut').onclick=()=>setZoom(zoom-.1);
document.getElementById('downloadBtn').onclick=()=>{if(!items.length){alert('まずは間取りを作成してください。');return;}const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height;const out=output.getContext('2d');out.fillStyle='#ffffff';out.fillRect(0,0,output.width,output.height);out.drawImage(canvas,0,0);const a=document.createElement('a');a.download='madori-floorplan.png';a.href=output.toDataURL('image/png');a.click();};
document.querySelectorAll('[data-scroll-editor]').forEach(b=>b.onclick=()=>document.getElementById('editor').scrollIntoView({behavior:'smooth'}));
window.addEventListener('resize',draw); updateControls(); draw();
