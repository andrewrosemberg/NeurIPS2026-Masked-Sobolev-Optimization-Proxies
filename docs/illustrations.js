'use strict';
(() => {
  const colors={ink:'#202a33',muted:'#687078',purple:'#7551a7',blue:'#6486b1',copper:'#bc7944',green:'#739654',line:'#ddded8'};
  const durations={workflow:20,control:16,dispatch:16,portfolio:16};
  const widgets=new Map(),assets={},toys={};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function label(ctx,str,x,y,size=28,color=colors.ink,align='left',serif=false){ctx.font=`${size}px ${serif?'Georgia, serif':'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(str,x,y);}
  function line(ctx,points,color=colors.line,width=3,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineJoin='round';points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
  function dot(ctx,x,y,r,color,ring=false){ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();if(ring){ctx.strokeStyle='white';ctx.lineWidth=3;ctx.stroke();}}
  function arrow(ctx,x,y,xx,yy,color,width=4){line(ctx,[[x,y],[xx,yy]],color,width);const a=Math.atan2(yy-y,xx-x),r=12;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-r*Math.cos(a-.45),yy-r*Math.sin(a-.45));ctx.lineTo(xx-r*Math.cos(a+.45),yy-r*Math.sin(a+.45));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function box(ctx,x,y,w,h,fill,stroke=null,r=8){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
  function seedRandom(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let z=Math.imul(a^a>>>15,1|a);z=z+Math.imul(z^z>>>7,61|z)^z;return((z^z>>>14)>>>0)/4294967296;};}
  function mask(seed){const rand=seedRandom(seed),a=Array.from({length:64},(_,i)=>i);for(let i=63;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return new Set(a.slice(0,3));}
  function fit(ctx,img,x,y,w,h){const scale=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);}
  function matrix(ctx,x,y,selected){for(let i=0;i<64;i++){box(ctx,x+(i%8)*16,y+Math.floor(i/8)*16,13,13,selected.has(i)?colors.purple:'#ffffff99',null,1);}}
  // Arc-length parameterization keeps every moving marker on the drawn polyline.
  function pathPoint(points,fraction){const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let distance=clamp(fraction,0,1)*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const f=distance/lengths[i];return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f];}distance-=lengths[i];}return points.at(-1);}
  function moving(ctx,phase,start,end,points,color,occlude=[]){if(phase<start||phase>end)return;const [x,y]=pathPoint(points,(phase-start)/(end-start));if(occlude.some(([xx,yy,w,h])=>x>xx&&x<xx+w&&y>yy&&y<yy+h))return;dot(ctx,x,y,9,color,true);}

  function workflow(ctx,t){
    ctx.clearRect(0,0,1600,1120);ctx.fillStyle='white';ctx.fillRect(0,0,1600,1120);ctx.save();ctx.translate(-135,-58);ctx.drawImage(assets.method,0,0,1800,1234);
    const step=Math.floor(t/5)%4,phase=t%5,selected=mask(51+step);
    // Reuse the paper's own network, solver, caches, AD/DiffOpt loops and arrows.
    box(ctx,395,387,70,60,'#ffead0',null,0);label(ctx,`p${'₁₂₃₄'[step]}`,430,434,48,'#111','center',true);
    box(ctx,1273,210,367,220,'#dce8fb','#7395c7',0);fit(ctx,assets['proxy-jacobian'],1320,221,272,45);matrix(ctx,1393,268,selected);label(ctx,'same 3 / 64 entries',1456,419,20,'#44576e','center');
    box(ctx,1273,742,367,220,'#ffead0','#d8a00b',0);fit(ctx,assets['reference-jacobian'],1320,753,272,45);matrix(ctx,1393,800,selected);label(ctx,'same 3 / 64 entries',1456,950,20,'#6d5335','center');
    box(ctx,1090,559,513,110,'#f7d2ce','#bd5a54',18);
    fit(ctx,assets['loss-main'],1107,579,194,39);fit(ctx,assets['loss-value'],1107,624,194,29);
    fit(ctx,assets['loss-numerator'],1310,575,278,35);line(ctx,[[1312,614],[1585,614]],'#5e4240',1.5);fit(ctx,assets['loss-denominator'],1389,621,122,34);
    moving(ctx,phase,.10,.80,[[505,375],[610,375]],colors.blue);
    moving(ctx,phase,.1,1.2,[[430,485],[430,815]],colors.copper);
    // Successive layer highlights show neural evaluation without inventing wire paths.
    for(let j=0;j<5;j++){const start=.75+j*.17;if(phase>start&&phase<start+.35){const x=[632,704,741,778,815][j],y=[357,320,395,320,395][j];dot(ctx,x,y,14,'#9db2d5');}}
    moving(ctx,phase,1.2,2.0,[[870,375],[1124,375]],colors.blue);
    moving(ctx,phase,2.05,2.8,[[1180,432],[1180,552]],colors.blue);
    moving(ctx,phase,1.3,2.1,[[638,964],[829,964]],colors.copper);
    moving(ctx,phase,2.1,2.85,[[981,965],[1180,965],[1180,858]],colors.copper);
    moving(ctx,phase,2.85,3.5,[[1180,741],[1180,674]],colors.copper);
    moving(ctx,phase,.85,1.65,[[871,247],[907,247],[907,192],[614,192],[614,261]],colors.purple,[[705,119,130,91]]);
    moving(ctx,phase,1.7,2.7,[[835,155],[1053,155],[1053,266],[1267,266]],colors.purple);
    moving(ctx,phase,2.75,3.5,[[1456,432],[1456,552]],colors.blue);
    moving(ctx,phase,1.0,1.9,[[638,852],[710,852],[710,779]],colors.purple);
    moving(ctx,phase,1.9,2.45,[[595,724],[475,724]],colors.purple);
    moving(ctx,phase,1.9,2.6,[[815,724],[905,724],[905,846]],colors.copper);
    moving(ctx,phase,2.6,3.4,[[981,1017],[1456,1017],[1456,967]],colors.copper);
    moving(ctx,phase,3.4,4.0,[[1456,741],[1456,674]],colors.copper);
    moving(ctx,phase,4.1,4.85,[[1090,614],[1054,614],[1054,454],[871,454]],'#bd5a54');
    ctx.restore();
  }

  function frame(name,t){const data=toys[name],n=data.path.length;return data.path[Math.min(n-1,Math.floor((t%durations[name])/durations[name]*n))];}
  function scientificMap(ctx,name,index){ctx.drawImage(assets[name],0,400,1248,976);const p=toys[name].markerPixels[index];if(p)dot(ctx,1248*p[0],400+976*p[1],11,colors.ink,true);}
  function clear(ctx){ctx.clearRect(0,0,1248,1376);ctx.fillStyle='white';ctx.fillRect(0,0,1248,1376);line(ctx,[[40,396],[1208,396]],colors.line,2);}
  function control(ctx,t){
    clear(ctx);const data=toys.control,idx=Math.min(data.path.length-1,Math.floor(t/16*data.path.length)),p=data.path[idx],s=p.state;
    label(ctx,'NONLINEAR ACROBOT · SWING-UP',48,52,25,colors.muted);
    const origin=[290,220],l=78,q1=s[0],q2=s[1];const elbow=[origin[0]+l*Math.sin(q1),origin[1]+l*Math.cos(q1)],tip=[elbow[0]+l*Math.sin(q1+q2),elbow[1]+l*Math.cos(q1+q2)];
    line(ctx,[[290,65],[290,380]],'#dedbd6',2,[5,6]);line(ctx,[origin,elbow],colors.ink,13);line(ctx,[elbow,tip],colors.purple,13);dot(ctx,...origin,14,colors.ink);dot(ctx,...elbow,15,colors.purple,true);dot(ctx,...tip,9,colors.copper);
    // A visible actuator cue reflects the sign and magnitude of the actual optimal torque.
    if(Math.abs(p.u)>.05){const sign=Math.sign(p.u),start=-.6*Math.PI,end=start-sign*1.3*Math.PI,r=24;ctx.beginPath();ctx.arc(elbow[0],elbow[1],r,start,end,sign>0);ctx.strokeStyle=colors.copper;ctx.lineWidth=3;ctx.stroke();const ex=elbow[0]+r*Math.cos(end),ey=elbow[1]+r*Math.sin(end),tangent=end-sign*Math.PI/2;arrow(ctx,ex-8*Math.cos(tangent),ey-8*Math.sin(tangent),ex,ey,colors.copper,3);}
    label(ctx,`t = ${p.time.toFixed(2)} s`,610,112,32,colors.ink);
    label(ctx,`Torque  ${p.u.toFixed(2)} N·m`,610,163,30,colors.purple);
    label(ctx,'Bounded-torque swing-up',610,214,26,colors.muted);
    label(ctx,'The actuator acts only at the second joint.',610,255,23,colors.muted);
    label(ctx,'Below: a solved local MPC map near upright.',610,315,23,colors.muted);
    scientificMap(ctx,'control',idx);
  }
  function dispatch(ctx,t){
    clear(ctx);const data=toys.dispatch,idx=Math.min(data.path.length-1,Math.floor(t/16*data.path.length)),p=data.path[idx],a=[215,180],b=[615,180];
    label(ctx,'SOLVED TWO-BUS AC NETWORK',48,48,25,colors.muted);
    const thermal=p.active.includes(8),edge=thermal?colors.copper:'#a4afb8';arrow(ctx,...a,...b,edge,7);dot(ctx,...a,20,'white');ctx.strokeStyle=colors.ink;ctx.lineWidth=3;ctx.stroke();dot(ctx,...b,20,'white');ctx.stroke();
    line(ctx,[[215,105],[215,158]],colors.blue,4);line(ctx,[[615,105],[615,158]],colors.copper,4);
    label(ctx,'G₀ · lower cost',215,83,25,colors.blue,'center');label(ctx,'G₁ · higher cost',615,83,25,colors.copper,'center');
    label(ctx,`${p.p0.toFixed(2)} p.u.`,215,131,24,colors.blue,'center');label(ctx,`${p.p1.toFixed(2)} p.u.`,615,131,24,colors.copper,'center');
    label(ctx,`Line loading ${(p.flow/.9*100).toFixed(0)}%`,415,221,24,thermal?colors.copper:colors.muted,'center');
    arrow(ctx,615,205,615,265,colors.ink,3);label(ctx,`Pᴰ = ${p.pd.toFixed(2)}   Qᴰ = ${p.qd.toFixed(2)}`,415,305,25,colors.ink,'center');label(ctx,`|V₁| = ${p.v[0].toFixed(3)} p.u.`,415,347,24,colors.green,'center');
    // Actual numerical map sensitivities enter a deliberately small shared proxy:
    // ghat_k(p)=b_k + theta_P P^D + theta_Q Q^D, k=0,1; theta=(.5,0).
    // For each generator's Jacobian-row loss, grad=2*(theta-Dg_k).
    const center=[1010,207],J=p.jacobian;
    label(ctx,'Shared proxy parameters',1000,48,24,colors.muted,'center');line(ctx,[[865,207],[1160,207]],'#dfddd8',2);line(ctx,[[1010,75],[1010,330]],'#dfddd8',2);
    for(let k=0;k<2;k++){const gx=2*(.5-J[k][0]),gy=-2*J[k][1];arrow(ctx,...center,center[0]+gx*83,center[1]-gy*83,k===0?colors.blue:colors.copper,5);}
    dot(ctx,...center,5,colors.ink);label(ctx,'θP',1165,215,22,colors.muted);label(ctx,'θQ',1021,91,22,colors.muted);
    label(ctx,'G₀ / G₁ sensitivity-loss gradients',1000,365,21,colors.muted,'center');
    scientificMap(ctx,'dispatch',idx);
  }
  function portfolio(ctx,t){
    clear(ctx);const data=toys.portfolio,idx=Math.min(data.path.length-1,Math.floor(t/16*data.path.length)),p=data.path[idx];
    label(ctx,'SOLVED EIGHT-ASSET PORTFOLIO',48,48,25,colors.muted);
    const left=70,top=200,w=420,h=105;line(ctx,[[left,95],[left,305],[left+w,305]],colors.line,2);
    for(let k=0;k<2;k++){const points=[];for(let i=0;i<=70;i++){const j=(idx-70+i+data.path.length)%data.path.length;points.push([left+w*i/70,305-data.path[j].mu[k]/.14*190]);}line(ctx,points,k===0?colors.purple:colors.blue,4);dot(ctx,...points.at(-1),6,k===0?colors.purple:colors.blue);}
    label(ctx,'Expected returns · A / B',left,347,24,colors.muted);label(ctx,`Risk ${p.risk.toFixed(3)} / 0.100`,left,382,23,colors.muted);
    label(ctx,'Optimal allocations',655,84,28,colors.ink);
    p.allocation.forEach((x,i)=>{const y=102+i*31;label(ctx,String.fromCharCode(65+i),655,y+21,23,colors.muted);box(ctx,694,y,345,23,'#f0eeea',null,3);if(x>1e-8)box(ctx,694,y,345*x,23,i===0?colors.purple:i===1?colors.blue:colors.copper,null,3);label(ctx,`${(100*x).toFixed(0)}%`,1060,y+21,23,colors.ink);});
    label(ctx,`Cash ${(100*p.cash).toFixed(0)}%`,694,383,23,colors.muted);
    scientificMap(ctx,'portfolio',idx);
  }

  const renderers={workflow,control,dispatch,portfolio},reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function imageAsset(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Image unavailable: ${url}`));img.src=url;});}
  const ready=Promise.all([
    imageAsset('assets/method.png').then(img=>assets.method=img),
    ...['proxy-jacobian','reference-jacobian','loss-main','loss-value','loss-numerator','loss-denominator'].map(name=>imageAsset(`assets/${name}.png`).then(img=>assets[name]=img)),
    ...['control','dispatch','portfolio'].flatMap(name=>[
      imageAsset(`assets/${name}-landscape.png`).then(img=>assets[name]=img),
      fetch(`assets/${name}-toy.json`).then(r=>{if(!r.ok)throw Error(`Toy data: ${name}`);return r.json();}).then(data=>toys[name]=data)
    ])
  ]).then(()=>{
    for(const figure of document.querySelectorAll('[data-animation]')){
      const id=figure.dataset.animation,canvas=figure.querySelector('canvas'),ctx=canvas.getContext('2d'),button=figure.querySelector('[data-action="play"]');
      const s={id,figure,canvas,ctx,button,t:0,playing:!reduced.matches,visible:false,last:null};widgets.set(id,s);
      const sync=()=>{button.textContent=s.playing?'Pause':'Play';button.setAttribute('aria-pressed',String(s.playing));button.setAttribute('aria-label',`${s.playing?'Pause':'Play'} ${id} animation`);};
      button.addEventListener('click',()=>{s.playing=!s.playing;s.last=null;sync();});sync();draw(s);
    }
    const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=widgets.get(e.target.dataset.animation);s.visible=e.isIntersecting;s.last=null;}},{rootMargin:'30px'});for(const s of widgets.values())observer.observe(s.figure);
    requestAnimationFrame(tick);
  }).catch(error=>{
    for(const figure of document.querySelectorAll('[data-animation]')){const id=figure.dataset.animation,name={workflow:'masking-workflow',control:'acrobot-geometry',dispatch:'dispatch-geometry',portfolio:'portfolio-geometry'}[id],img=document.createElement('img');img.src=`assets/${name}.png`;img.alt=figure.querySelector('canvas').getAttribute('aria-label');figure.querySelector('canvas').replaceWith(img);figure.querySelector('[data-action="play"]').hidden=true;}throw error;
  });
  function draw(s){renderers[s.id](s.ctx,s.t);}
  function tick(now){for(const s of widgets.values()){if(!s.playing||!s.visible||document.hidden){s.last=null;continue;}if(s.last!==null&&now-s.last<50)continue;if(s.last!==null)s.t=(s.t+Math.min((now-s.last)/1000,.15))%durations[s.id];s.last=now;draw(s);}requestAnimationFrame(tick);}
  reduced.addEventListener('change',e=>{if(e.matches)for(const s of widgets.values()){s.playing=false;s.last=null;s.button.textContent='Play';s.button.setAttribute('aria-pressed','false');s.button.setAttribute('aria-label',`Play ${s.id} animation`);}});
  window.paperIllustrations={ready,durations,pathPoint,renderFrame(id,t){const s=widgets.get(id);if(!s)throw Error(`Unknown illustration ${id}`);s.playing=false;s.t=t;draw(s);return s.canvas.toDataURL('image/png');}};
})();
