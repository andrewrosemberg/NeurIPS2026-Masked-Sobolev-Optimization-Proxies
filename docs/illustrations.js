'use strict';
/* Native canvas illustrations. No experimental measurements are generated here.
   Deterministic frame rendering is shared by the live widgets and GIF exporter. */
(() => {
  const C = {ink:'#202a33', muted:'#687078', purple:'#7551a7', pale:'#eee8f5', copper:'#bb744a', blue:'#527b98', green:'#568777', line:'#ddded8', paper:'#f8f7f3', white:'#ffffff'};
  const TAU = Math.PI * 2;
  const durations = {workflow:14.4, control:12, dispatch:14.4, portfolio:16};
  const widgets = new Map();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function text(ctx,str,x,y,size=24,color=C.ink,align='left',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(str,x,y);}
  function line(ctx,pts,color=C.line,width=2,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
  function box(ctx,x,y,w,h,fill=C.paper,stroke=C.line,r=14){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function dot(ctx,x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill();}
  function arrow(ctx,x,y,xx,yy,color=C.purple,width=3,head=11){line(ctx,[[x,y],[xx,yy]],color,width);const a=Math.atan2(yy-y,xx-x);ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-head*Math.cos(a-.45),yy-head*Math.sin(a-.45));ctx.lineTo(xx-head*Math.cos(a+.45),yy-head*Math.sin(a+.45));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function polygon(ctx,pts,fill,stroke=C.line,width=1){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function seeded(seed){let a=seed|0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function mask(seed,n,k){const rand=seeded(seed),order=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]];}return new Set(order.slice(0,k));}
  function matrix(ctx,x,y,size,n,selected,dim=false){const gap=2.5,cell=(size-gap*(n-1))/n;for(let i=0;i<n*n;i++){const on=selected.has(i);box(ctx,x+(i%n)*(cell+gap),y+Math.floor(i/n)*(cell+gap),cell,cell,on?C.purple:(dim?'#e8e9e6':'#d9dce0'),null,1.5);}}
  function base(ctx,w,h){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.white;ctx.fillRect(0,0,w,h);}

  function workflow(ctx,t){
    base(ctx,960,640);
    const step=Math.floor(t/3.6)%4,phase=(t%3.6)/3.6,sel=mask(120+step,144,7);
    text(ctx,`UPDATE 0${step+1} / NEW INPUT + NEW MASK`,28,40,19,C.muted,'left',600);
    // Feedback updates the proxy only. Offline references have no backpropagation path.
    line(ctx,[[885,320],[885,70],[320,70],[320,173]],C.purple,2,[7,7]);
    text(ctx,'update θ',600,61,19,C.purple,'center');
    box(ctx,20,299,130,90,C.paper);text(ctx,`p${'₁₂₃₄'[step]}`,85,342,36,C.ink,'center');text(ctx,'input',85,371,18,C.muted,'center');
    line(ctx,[[150,344],[184,344],[184,222],[230,222]],C.line,3);line(ctx,[[184,344],[184,470],[230,470]],C.line,3);
    box(ctx,230,177,180,90,'#eef3f6','#cfdae1');text(ctx,'Proxy ĝθ',320,216,27,C.blue,'center',550);text(ctx,'autodiff',320,246,20,C.blue,'center');
    box(ctx,230,425,180,90,'#fbf0e8','#e5cdbd');text(ctx,'Reference g',320,464,25,C.copper,'center',550);text(ctx,'offline targets',320,494,19,C.copper,'center');
    line(ctx,[[410,222],[445,222],[445,121],[483,121]],C.blue,2.5);arrow(ctx,445,222,483,222,C.blue,2.5,8);
    line(ctx,[[410,470],[445,470],[445,582],[483,582]],C.copper,2.5);arrow(ctx,445,470,483,470,C.copper,2.5,8);
    box(ctx,483,94,132,54,'#eef3f6',null,7);text(ctx,'ĝθ(p)',549,129,25,C.blue,'center');
    box(ctx,483,555,132,54,'#fbf0e8',null,7);text(ctx,'g(p)',549,590,25,C.copper,'center');
    text(ctx,'Dĝθ(p)',549,179,24,C.blue,'center');matrix(ctx,483,193,132,12,sel,true);
    text(ctx,'Dg(p)',549,403,24,C.copper,'center');matrix(ctx,483,417,132,12,sel,true);
    line(ctx,[[615,121],[913,121],[913,320]],C.blue,2.5);line(ctx,[[615,582],[913,582],[913,405]],C.copper,2.5);
    text(ctx,'all values',735,111,19,C.muted,'center');text(ctx,'all values',735,610,19,C.muted,'center');
    line(ctx,[[615,259],[652,259],[652,350],[690,350]],C.blue,2.5);line(ctx,[[615,483],[652,483],[652,350]],C.copper,2.5);
    text(ctx,'same mask M',751,264,21,C.purple,'center',550);matrix(ctx,690,282,122,12,sel,true);text(ctx,'7 / 144',751,435,21,C.purple,'center');
    arrow(ctx,812,350,835,350,C.purple,3,8);box(ctx,835,320,108,85,C.pale,'#d6c7e6');text(ctx,'ℒ',889,360,34,C.purple,'center');text(ctx,'value + λ·deriv.',889,388,13,C.purple,'center');
    // Slow progress marks the input's travel and then holds the selected mask.
    const travel=clamp(phase/.64,0,1);dot(ctx,150+travel*79,344-122*travel,5,C.blue);
    const bar=clamp(phase,0,1);box(ctx,28,627,904,4,'#eae9e5',null,2);box(ctx,28,627,904*bar,4,C.purple,null,2);
  }

  // A projected response surface, not an optimization objective landscape.
  function surface(ctx,fn,{x=85,y=695,w=590,depth=190,height=170,zmax=1,marker=[0,0],title='Decision-map slice',xLabel='Input 1',yLabel='Input 2',zLabel='Response',n=19}={}){
    const project=(u,v,z)=>[x+w*(u+1)/2+depth*(v+1)/2,y-depth*.40*(v+1)-height*z/zmax];
    const floor=[project(-1,-1,0),project(1,-1,0),project(1,1,0),project(-1,1,0)];polygon(ctx,floor,'#f4f3ef','#e1dfd8');
    for(let j=n-1;j>=0;j--){for(let i=0;i<n;i++){const u=-1+2*i/n,v=-1+2*j/n,d=2/n,z=fn(u,v),a=clamp(z/zmax,0,1);polygon(ctx,[project(u,v,z),project(u+d,v,fn(u+d,v)),project(u+d,v+d,fn(u+d,v+d)),project(u,v+d,fn(u,v+d))],`rgb(${Math.round(227-91*a)},${Math.round(218-123*a)},${Math.round(239-68*a)})`,'#ffffffaa',.8);}}
    line(ctx,[floor[0],floor[1]],'#9c9a99',2);line(ctx,[floor[1],floor[2]],'#9c9a99',2);
    const [u,v]=marker,z=fn(u,v),p=project(u,v,z);const foot=project(u,v,0);line(ctx,[foot,p],C.copper,2,[4,5]);dot(ctx,...p,12,C.white);dot(ctx,...p,7,C.copper);
    text(ctx,title,40,455,26,C.ink,'left',550);text(ctx,xLabel,x+w*.55,y+39,20,C.muted,'center');text(ctx,yLabel,x+w+depth+5,y-depth*.37+20,20,C.muted,'right');text(ctx,zLabel,45,492,20,C.purple);
    return {project,point:p,value:z};
  }

  function control(ctx,t){
    base(ctx,960,870);const a=TAU*t/12;
    text(ctx,'ILLUSTRATIVE SWING-UP',40,45,20,C.muted,'left',600);
    // Closed, smooth kinematic cycle. This is not a controller rollout.
    const q1=Math.PI*Math.sin(a/2)**2+.32*Math.sin(3*a)*Math.sin(a)**2;
    const q2=.65*Math.sin(4*a)*Math.sin(a)**2;
    const origin=[250,235],l1=82,l2=78;
    const elbow=[origin[0]+l1*Math.sin(q1),origin[1]+l1*Math.cos(q1)];
    const tip=[elbow[0]+l2*Math.sin(q1+q2),elbow[1]+l2*Math.cos(q1+q2)];
    ctx.beginPath();ctx.arc(...origin,l1+l2,0,TAU);ctx.strokeStyle='#eeede9';ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.stroke();ctx.setLineDash([]);
    line(ctx,[[72,405],[445,405]],C.line,2);line(ctx,[origin,elbow],C.ink,11);line(ctx,[elbow,tip],C.purple,11);dot(ctx,...origin,13,C.ink);dot(ctx,...elbow,17,C.paper);dot(ctx,...elbow,9,C.purple);dot(ctx,...tip,10,C.copper);
    text(ctx,'actuated joint',535,119,23,C.purple);text(ctx,'Only the second joint',535,154,22,C.muted);text(ctx,'receives torque.',535,184,22,C.muted);
    text(ctx,'Smooth local response',535,260,25,C.ink,'left',550);text(ctx,'Nearby states can share',535,299,22,C.muted);text(ctx,'useful sensitivities.',535,330,22,C.muted);
    const u=.79*Math.sin(a),v=.72*Math.sin(a+.7);const fn=(u,v)=>(1+Math.tanh(1.2*Math.sin(1.15*u)+.55*v))/2;
    surface(ctx,fn,{marker:[u,v],title:'Synthetic local policy slice',xLabel:'State coordinate 1',yLabel:'State coordinate 2',zLabel:'Bounded action (rescaled)',y:770,height:150});
    text(ctx,'Smooth geometry is regional; feasibility alone is insufficient.',40,855,19,C.muted);
  }

  const gradientAngles=[.15,.85,1.55,2.3,2.95,3.5,4.0,4.6,5.1,5.65,2.7,.6];
  function dispatch(ctx,t,opts={}){
    base(ctx,960,870);const step=Math.floor(t/3.6)%4,sel=mask(330+step,12,opts.count??3),a=TAU*t/14.4;
    text(ctx,'SCHEMATIC DISPATCH / CHANGING DEMAND',40,43,20,C.muted,'left',600);
    const nodes=[[145,160],[430,115],[740,175],[560,335],[210,335]];
    const edges=[[0,1],[1,2],[2,3],[3,4],[4,0],[1,3],[0,3]];
    edges.forEach(([i,j],idx)=>{const [x,y]=nodes[i],[xx,yy]=nodes[j],hot=idx===2;line(ctx,[[x,y],[xx,yy]],hot?C.copper:'#a3afb7',hot?5:3);const p=(t*.11+idx*.19)%1;dot(ctx,x+(xx-x)*p,y+(yy-y)*p,5,hot?C.copper:C.purple);});
    nodes.forEach(([x,y],i)=>{dot(ctx,x,y,21,C.white);ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.stroke();text(ctx,String(i+1),x,y+7,20,C.ink,'center',600);});
    box(ctx,40,75,157,47,'#f0eee8',null,7);text(ctx,'G₁ · low cost',118,106,21,C.ink,'center');
    box(ctx,650,76,230,47,'#f0eee8',null,7);text(ctx,'G₂ · flexible supply',765,106,21,C.ink,'center');
    const demand=100+Math.round(25*Math.sin(a));text(ctx,`Demand ${demand} MW`,559,388,23,C.ink,'center',550);
    text(ctx,'voltage band',207,382,20,C.green,'center');text(ctx,'thermal limit',760,309,20,C.copper,'center');
    box(ctx,40,414,880,2,C.line,null,0);
    text(ctx,'ILLUSTRATIVE PROXY-PARAMETER LOSS LANDSCAPE',40,455,20,C.muted,'left',600);
    const center=[265,625];
    // Contours of an illustrative normalized mean of per-entry quadratic losses:
    // ell_k(theta)=.5*(1+a_k dot theta)^2; vectors below are its gradients at theta=0.
    let hxx=0,hxy=0,hyy=0,bx=0,by=0;
    for(const i of sel){const len=(95+18*Math.sin(i*1.7))/100,xx=len*Math.cos(gradientAngles[i]),yy=len*Math.sin(gradientAngles[i]);hxx+=xx*xx/sel.size;hxy+=xx*yy/sel.size;hyy+=yy*yy/sel.size;bx+=xx/sel.size;by+=yy/sel.size;}
    const det=hxx*hyy-hxy*hxy;ctx.save();ctx.beginPath();ctx.rect(70,480,395,285);ctx.clip();
    if(det>1e-5){const cx=-(hyy*bx-hxy*by)/det,cy=-(hxx*by-hxy*bx)/det,angle=.5*Math.atan2(2*hxy,hxx-hyy),disc=Math.sqrt((hxx-hyy)**2+4*hxy*hxy),l1=(hxx+hyy+disc)/2,l2=(hxx+hyy-disc)/2;
      const min=.5+.5*(bx*cx+by*cy),here=.5-min;
      for(const level of [.15,.35,.65,1,1.5,2.2]){const energy=here+level;ctx.beginPath();ctx.ellipse(center[0]+90*cx,center[1]-90*cy,90*Math.sqrt(2*energy/l1),90*Math.sqrt(2*energy/l2),-angle,0,TAU);ctx.strokeStyle='#e9e2ef';ctx.lineWidth=2;ctx.stroke();}
    }else{const angle=gradientAngles[[...sel][0]],nx=Math.cos(angle),ny=Math.sin(angle);for(let k=-4;k<=4;k++){const d=k*45;line(ctx,[[center[0]+nx*d-300*ny,center[1]-ny*d-300*nx],[center[0]+nx*d+300*ny,center[1]-ny*d+300*nx]],'#e9e2ef',2);}}
    ctx.restore();line(ctx,[[70,625],[465,625]],'#d6d4d0',2);line(ctx,[[265,478],[265,767]],'#d6d4d0',2);
    text(ctx,'θ₁',472,634,21,C.muted);text(ctx,'θ₂',278,494,21,C.muted);
    let sx=0,sy=0;
    gradientAngles.forEach((ang,i)=>{const len=95+18*Math.sin(i*1.7),dx=len*Math.cos(ang),dy=len*Math.sin(ang),on=sel.has(i);if(on){sx+=dx;sy+=dy;}arrow(ctx,...center,center[0]+dx,center[1]-dy,on?C.purple:'#e2e0dc',on?4:2,on?11:7);});
    const count=sel.size;const dx=sx/count,dy=sy/count;arrow(ctx,...center,center[0]+dx*1.6,center[1]-dy*1.6,C.ink,6,15);dot(ctx,...center,6,C.ink);
    text(ctx,`${count} / 12 derivative terms`,535,514,26,C.purple,'left',550);
    text(ctx,'Each arrow: ∇θ ℓd,k',535,560,23,C.ink);
    text(ctx,'Selected terms can pull',535,604,22,C.muted);text(ctx,'in opposing directions.',535,635,22,C.muted);
    line(ctx,[[538,686],[571,686]],C.purple,4);text(ctx,'selected sensitivity loss',585,693,20,C.muted);
    line(ctx,[[538,725],[571,725]],C.ink,5);text(ctx,'mean selected gradient × 1.6',585,732,18,C.muted);
    text(ctx,'The mask is uniform; it does not rank constraints or gradients.',40,855,19,C.muted);
  }

  // Exact KKT solution for a diagonal-covariance six-asset convex toy problem.
  // max μᵀx subject to x>=0, sum(x)<=1 and sum(d_i*x_i²)<=risk².
  const variances=[.22**2,.31**2,.18**2,.25**2,.21**2,.28**2];
  function allocation(mu,risk){
    const best=mu.indexOf(Math.max(...mu));if(mu[best]<=0)return mu.map(()=>0);
    if(risk>=Math.sqrt(variances[best]))return mu.map((_,i)=>i===best?1:0);
    const at=eta=>{const a=mu.map((m,i)=>Math.max(0,m-eta)/variances[i]);const norm=Math.sqrt(a.reduce((s,v,i)=>s+variances[i]*v*v,0));return a.map(v=>norm?risk*v/norm:0);};
    let x=at(0);if(x.reduce((a,b)=>a+b,0)<=1)return x;
    let lo=0,hi=mu[best];for(let i=0;i<65;i++){const mid=(lo+hi)/2;if(at(mid).reduce((a,b)=>a+b,0)>1)lo=mid;else hi=mid;}return at((lo+hi)/2);
  }
  const returns=(u,v)=>[.025+.13*u,.025+.13*v,.022,-.012,-.035,-.021];
  const surfaceCache=new Map();
  function portfolio(ctx,t,opts={}){
    base(ctx,960,870);const risk=opts.risk??.14,a=TAU*t/16;
    // Fixed deterministic synthetic fluctuations, not historical or live prices.
    const u=.72*Math.sin(a)+.10*Math.sin(5*a),v=.68*Math.cos(a+.3)+.12*Math.sin(7*a);
    const mu=returns(u,v),x=allocation(mu,risk);
    text(ctx,'SYNTHETIC MARKET INPUTS → OPTIMAL ALLOCATION',40,43,20,C.muted,'left',600);
    text(ctx,'Expected return μ',40,91,23,C.ink,'left',550);text(ctx,'Allocation x / B',500,91,23,C.ink,'left',550);
    const colors=[C.purple,C.blue,C.copper,C.green,'#9691a8','#a5aaa1'];
    // Market trails for A and B share the same values that drive the allocation map.
    const px=65,py=246,pw=355,ph=115;line(ctx,[[px,py-ph],[px,py+ph]],C.line,2);line(ctx,[[px,py],[px+pw,py]],C.line,2);
    for(let k=0;k<2;k++){const pts=[];for(let j=0;j<=90;j++){const q=a-(1-j/90)*TAU*.42;const uu=.72*Math.sin(q)+.10*Math.sin(5*q),vv=.68*Math.cos(q+.3)+.12*Math.sin(7*q);pts.push([px+pw*j/90,py-returns(uu,vv)[k]/.16*ph]);}line(ctx,pts,colors[k],3);dot(ctx,...pts.at(-1),5,colors[k]);}
    text(ctx,'0',52,253,18,C.muted,'right');text(ctx,'A',66,389,21,C.purple,'left',600);text(ctx,'B',117,389,21,C.blue,'left',600);text(ctx,'Fluctuating expected returns',161,389,20,C.muted);
    x.forEach((value,i)=>{const yy=120+i*43;text(ctx,String.fromCharCode(65+i),500,yy+23,21,colors[i],'left',600);box(ctx,535,yy,287,28,'#f0efeb',null,4);if(value>1e-6)box(ctx,535,yy,287*value,28,colors[i],null,4);text(ctx,`${(value*100).toFixed(0)}%`,844,yy+22,20,value<1e-6?C.muted:C.ink);});
    text(ctx,`Cash: ${Math.max(0,100*(1-x.reduce((s,v)=>s+v,0))).toFixed(0)}%`,535,410,20,C.muted);
    // Surface grid values cached by risk for continuous low-cost live rendering.
    const key=risk.toFixed(3);if(!surfaceCache.has(key)){const n=19,values=new Map();for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const uu=-1+2*i/n,vv=-1+2*j/n;values.set(`${i},${j}`,allocation(returns(uu,vv),risk)[0]);}surfaceCache.set(key,values);}
    const values=surfaceCache.get(key),n=19;
    const fn=(uu,vv)=>{const i=Math.round((uu+1)*n/2),j=Math.round((vv+1)*n/2);return Math.abs((uu+1)*n/2-i)<1e-7 && Math.abs((vv+1)*n/2-j)<1e-7 ? values.get(`${i},${j}`) : allocation(returns(uu,vv),risk)[0];};
    surface(ctx,fn,{marker:[u,v],title:'Convex program, sparse decision map',xLabel:'Expected return μA',yLabel:'Expected return μB',zLabel:'Optimal allocation xA / B',y:770,height:150});
    text(ctx,'Flat regions and kinks limit the reach of local sensitivities.',40,855,19,C.muted);
  }

  const renderers={workflow,control,dispatch,portfolio};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  for(const figure of document.querySelectorAll('[data-animation]')){
    const id=figure.dataset.animation,canvas=figure.querySelector('canvas'),ctx=canvas.getContext('2d');
    if(!ctx){canvas.hidden=true;continue;}
    const play=figure.querySelector('[data-action="play"]');
    const state={id,figure,canvas,ctx,t:id==='control'?2:id==='portfolio'?1.5:0,playing:!reduced.matches,visible:false,last:null,count:3,risk:.14,speed:1};widgets.set(id,state);
    const speed=document.createElement('select');speed.className='animation-speed';speed.setAttribute('aria-label',`${id} animation speed`);for(const [v,label] of [[.5,'0.5×'],[1,'1× speed'],[1.5,'1.5×']]){const option=document.createElement('option');option.value=v;option.textContent=label;option.selected=v===1;speed.append(option);}speed.addEventListener('change',()=>state.speed=Number(speed.value));play.after(speed);
    const sync=()=>{play.textContent=state.playing?'Pause':'Play';play.setAttribute('aria-pressed',String(state.playing));};
    play.addEventListener('click',()=>{state.playing=!state.playing;state.last=null;sync();});
    figure.querySelector('[data-action="step"]')?.addEventListener('click',()=>{state.playing=false;state.t=(Math.floor(state.t/3.6)+1)*3.6;state.t%=durations[id];sync();draw(state);});
    sync();draw(state);
  }
  function draw(state){renderers[state.id](state.ctx,state.t,{count:state.count,risk:state.risk});}
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const state=widgets.get(entry.target.dataset.animation);state.visible=entry.isIntersecting;state.last=null;}},{rootMargin:'50px'});for(const state of widgets.values())observer.observe(state.figure);
  document.getElementById('dispatch-density')?.addEventListener('input',event=>{const s=widgets.get('dispatch');s.count=Number(event.target.value);document.getElementById('dispatch-count').value=`${s.count} / 12`;draw(s);});
  document.getElementById('portfolio-risk')?.addEventListener('input',event=>{const s=widgets.get('portfolio');s.risk=Number(event.target.value)/100;document.getElementById('portfolio-risk-label').value=`${event.target.value}%`;draw(s);});
  reduced.addEventListener('change',event=>{if(event.matches)for(const s of widgets.values()){s.playing=false;s.last=null;const b=s.figure.querySelector('[data-action="play"]');b.textContent='Play';b.setAttribute('aria-pressed','false');}});
  function tick(now){for(const s of widgets.values()){if(!s.visible||!s.playing||document.hidden){s.last=null;continue;}if(s.last!==null && now-s.last<33)continue;if(s.last!==null){s.t=(s.t+Math.min((now-s.last)/1000,.1)*s.speed)%durations[s.id];}s.last=now;draw(s);}requestAnimationFrame(tick);}requestAnimationFrame(tick);
  for(const link of document.querySelectorAll('[data-result-link]'))link.addEventListener('click',()=>document.getElementById(`tab-${link.dataset.resultLink}`).click());
  // Shared frame API for reproducible, local export; no browser automation dependency on the site.
  window.paperIllustrations={durations,renderFrame(id,t,options={}){const s=widgets.get(id);if(!s)throw new Error(`Unknown illustration: ${id}`);s.playing=false;s.t=t;renderers[id](s.ctx,t,options);return s.canvas.toDataURL('image/png');},allocation};
})();
