"""Solved teaching examples, separate from the paper's experimental data.
Run with Python + NumPy, SciPy, Matplotlib, Pillow. Writes local static assets.
Acrobot dynamics: Gymnasium's unit-mass/unit-length book convention, continuous torque.
https://github.com/Farama-Foundation/Gymnasium/blob/main/gymnasium/envs/classic_control/acrobot.py
"""
from pathlib import Path
import os,json,time,tempfile
os.environ.setdefault('MPLCONFIGDIR',str(Path(tempfile.gettempdir())/'sobolev-matplotlib'))
import numpy as np
from scipy.optimize import minimize,nnls
from scipy.linalg import solve_discrete_are
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap,Normalize
from mpl_toolkits.mplot3d import proj3d

OUT=Path(__file__).resolve().parents[1]/'docs/assets'
OUT.mkdir(exist_ok=True)
Q=np.diag([30.,10.,1.,1.]);R=.08;DT=.05;H=12

def dynamics(s,u):
    q1,q2,v1,v2=np.moveaxis(s,-1,0)
    # M(q) qdd + C(q,qd)qd + G(q) = [0,u].
    m11=3.5+np.cos(q2);m12=1.25+.5*np.cos(q2);m22=1.25
    c1=-.5*np.sin(q2)*(2*v1*v2+v2*v2)
    c2=.5*np.sin(q2)*v1*v1
    g1=14.7*np.sin(q1)+4.9*np.sin(q1+q2);g2=4.9*np.sin(q1+q2)
    b1=-c1-g1;b2=u-c2-g2;det=m11*m22-m12*m12
    return np.stack([v1,v2,(m22*b1-m12*b2)/det,(-m12*b1+m11*b2)/det],axis=-1)

def rk4(s,u,dt=DT):
    a=dynamics(s,u);b=dynamics(s+dt*a/2,u);c=dynamics(s+dt*b/2,u);d=dynamics(s+dt*c,u)
    return s+dt*(a+2*b+2*c+d)/6

UP=np.array([np.pi,0.,0.,0.]);eps=1e-20
A=np.column_stack([rk4(UP.astype(complex)+1j*eps*np.eye(4)[i],0).imag/eps for i in range(4)])
B=(rk4(UP.astype(complex),1j*eps).imag/eps)[:,None]
P=solve_discrete_are(A,B,Q,np.array([[R]]));K=np.linalg.solve(np.array([[R]])+B.T@P@B,B.T@P@A).ravel()

def ac_cost_batch(us,s0):
    s=np.broadcast_to(s0,(len(us),4)).astype(us.dtype).copy();cost=np.zeros(len(us),dtype=us.dtype)
    for j in range(H):
        e=s-UP;cost+=np.einsum('bi,ij,bj->b',e,Q,e)+R*us[:,j]**2;s=rk4(s,us[:,j])
    e=s-UP;return cost+np.einsum('bi,ij,bj->b',e,P,e)

def solve_control(s,warm=None):
    if warm is None:warm=np.full(H,np.clip(-K@(s-UP),-8,8))
    def fg(u):
        pert=np.tile(u,(H+1,1)).astype(complex);pert[1:]+=1j*eps*np.eye(H)
        values=ac_cost_batch(pert,s);return values[0].real,values[1:].imag/eps
    sol=minimize(fg,warm,jac=True,bounds=[(-8,8)]*H,method='SLSQP',options={'ftol':1e-11,'maxiter':180})
    grad=fg(sol.x)[1];projected=sol.x-np.clip(sol.x-grad,-8,8)
    if np.max(np.abs(projected))>1e-3:raise RuntimeError(f'Acrobot stationarity {sol.message}: {np.max(abs(projected))}')
    return sol.x,float(np.max(abs(projected)))

def swingup():
    # A fixed warm start selects a reproducible local branch of this nonconvex
    # open-loop search. Fourteen bounded knots define 70 piecewise-linear controls.
    steps=70;dt=.07;knots=np.array([7.999999999994093, 7.99999999999155, 7.999999999811916, -2.236231827842605, -7.999999999468886, -7.999999999975899, -7.999999999999715, -7.999999999997568, -4.806373265851006, 1.5225469120080102, 0.8225821131058411, 0.5367335505524375, 0.38766568228859427, 0.0042248319466564686])
    W=np.array([np.interp(np.linspace(0,1,steps),np.linspace(0,1,len(knots)),np.eye(len(knots))[k]) for k in range(len(knots))]).T
    weights=np.diag([3.,1.,.08,.08]);terminal=np.diag([3000.,1500.,180.,120.])
    def costs(us):
        state=np.zeros((len(us),4),dtype=us.dtype);value=np.zeros(len(us),dtype=us.dtype)
        for j in range(steps):
            e=state-UP;value+=np.einsum('bi,ij,bj->b',e,weights,e)+.04*us[:,j]**2;state=rk4(state,us[:,j],dt)
        e=state-UP;return value+np.einsum('bi,ij,bj->b',e,terminal,e)
    def fg(c):
        cc=np.tile(c,(len(c)+1,1)).astype(complex);cc[1:]+=1j*eps*np.eye(len(c));value=costs(cc@W.T)
        return value[0].real,value[1:].imag/eps
    sol=minimize(fg,knots,jac=True,bounds=[(-8,8)]*len(knots),method='SLSQP',options={'ftol':1e-12,'maxiter':600})
    pg=float(np.max(abs(sol.x-np.clip(sol.x-fg(sol.x)[1],-8,8))))
    if not sol.success or pg>.01:raise RuntimeError(f'Swing-up stationarity: {sol.message}, {pg}')
    state=np.zeros(4);path=[]
    for i,u in enumerate(W@sol.x):
        path.append({'state':state.tolist(),'u':float(u),'time':i*dt});state=rk4(state,u,dt)
    terminal_error=float(np.linalg.norm(state-UP))
    # Finish with the same local MPC used to compute the smooth surface.
    warm=None
    for i in range(100):
        u,_=solve_control(state,warm);path.append({'state':state.tolist(),'u':float(u[0]),'time':steps*dt+i*DT});state=rk4(state,u[0]);warm=np.r_[u[1:],u[-1]]
    return path,{'knots':sol.x.tolist(),'timeStep':dt,'horizon':steps,'stageQ':weights.diagonal().tolist(),'stageR':.04,'terminalQ':terminal.diagonal().tolist(),'projectedGradient':pg,'swingupTerminalError':terminal_error,'settledStateError':float(np.linalg.norm(state-UP))}

def make_control():
    # A local chart around the upright equilibrium with zero initial velocities.
    lim=.018;x=np.linspace(-lim,lim,25);y=np.linspace(-lim,lim,25);Z=np.zeros((len(y),len(x)));max_pg=0
    warm=None
    for j,q2 in enumerate(y):
        for i in (range(len(x)) if j%2==0 else reversed(range(len(x)))):
            u,pg=solve_control(UP+np.array([x[i],q2,0,0]),warm);warm=u;Z[j,i]=u[0];max_pg=max(max_pg,pg)
        if j%5==0:print('Acrobot row',j,flush=True)
    # A true nonlinear receding-horizon local stabilization trajectory.
    state=UP+np.array([-.05,.04,0,0]);roll=[];warm=None
    for i in range(100):
        u,pg=solve_control(state,warm);roll.append({'state':state.tolist(),'u':float(u[0]),'time':i*DT});state=rk4(state,u[0]);warm=np.r_[u[1:],u[-1]]
    motion,swing_meta=swingup()
    return {'x':x.tolist(),'y':y.tolist(),'z':Z.tolist(),'path':motion,'localStabilizationPath':roll,'swingup':swing_meta,'terminalP':P.tolist(),'maxProjectedGradient':max_pg,'timeStep':DT,'horizon':H,'Q':Q.diagonal().tolist(),'R':R,'torqueBound':8,'initialZeroVelocity':True,'finalStateError':float(np.linalg.norm(state-UP))}

Y=1/complex(.025,.16)
def power(v):
    voltage=v[0]*np.exp(1j*v[1]);s01=np.conj(Y*(1-voltage));s10=voltage*np.conj(Y*(voltage-1));return s01,s10

def ac_values(v,pd,qd):
    s0,s1=power(v);return np.array([s0.real,s0.imag,pd+s1.real,qd+s1.imag])

def ac_margins(v,pd,qd):
    p0,q0,p1,q1=ac_values(v,pd,qd);a,b=power(v)
    return np.array([p0,1.5-p0,p1,1.5-p1,q0+.6,.8-q0,q1+.4,.4-q1,.9**2-abs(a)**2,.9**2-abs(b)**2])

def solve_dispatch(pd,qd,warm=None):
    def obj(v):
        p0,_,p1,_=ac_values(v,pd,qd);return .8*p0*p0+p0+3*p1*p1+3*p1
    guesses=([warm] if warm is not None else [])+[[1.,-.08],[1.03,-.12],[.96,-.1]]
    best=None
    for guess in guesses:
        sol=minimize(obj,guess,method='SLSQP',bounds=[(.94,1.06),(-.6,.6)],constraints={'type':'ineq','fun':lambda v:ac_margins(v,pd,qd)},options={'ftol':1e-11,'maxiter':160})
        violation=max(0,-float(ac_margins(sol.x,pd,qd).min()))
        if violation<2e-7 and (best is None or sol.fun<best.fun):
            best=sol;break
    if best is None:raise RuntimeError(f'AC infeasible solve {pd,qd}: {sol.message}, {violation}')
    p0,q0,p1,q1=ac_values(best.x,pd,qd);s0,s1=power(best.x);margins=ac_margins(best.x,pd,qd)
    return {'pd':float(pd),'qd':float(qd),'v':best.x.tolist(),'p0':float(p0),'q0':float(q0),'p1':float(p1),'q1':float(q1),'flow':float(abs(s0)),'cost':float(best.fun),'maxViolation':max(0.,float(-margins.min())),'active':[int(k) for k,v in enumerate(margins) if v<1e-5]}

def make_dispatch():
    x=np.linspace(.35,1.7,37);y=np.linspace(.1,.6,33);Z=np.zeros((len(y),len(x)));active=np.zeros_like(Z,dtype=int);worst=0;warm=None
    for j,qd in enumerate(y):
        for i in (range(len(x)) if j%2==0 else reversed(range(len(x)))):
            s=solve_dispatch(x[i],qd,warm);warm=s['v'];Z[j,i]=s['p0'];active[j,i]=sum(1<<k for k in s['active']);worst=max(worst,s['maxViolation'])
    path=[]
    for a in np.linspace(0,2*np.pi,160,endpoint=False):
        pd=1.025+.60*np.sin(a);qd=.35+.20*np.cos(a);point=solve_dispatch(pd,qd)
        jac=[]
        for dp,dq in [(1e-4,0),(0,1e-4)]:
            plus=solve_dispatch(pd+dp,qd+dq,point['v']);minus=solve_dispatch(pd-dp,qd-dq,point['v'])
            jac.append([(plus[k]-minus[k])/(2e-4) for k in ['p0','p1']])
        point['jacobian']=np.array(jac).T.tolist();path.append(point)
    # Multistart check on a spread of parameters for this nonconvex toy model.
    gap=0
    for pd in x[::9]:
        for qd in y[::8]:
            reference=solve_dispatch(pd,qd)
            for guess in [[.95,-.15],[1.04,-.05],[1.,-.22]]:
                other=solve_dispatch(pd,qd,guess);gap=max(gap,abs(other['cost']-reference['cost']))
    print('AC-OPF complete',worst,'multistart gap',gap,flush=True)
    return {'x':x.tolist(),'y':y.tolist(),'z':Z.tolist(),'activeSets':active.tolist(),'path':path,'lineImpedance':[.025,.16],'lineRating':.9,'maxViolation':worst,'multistartMaxCostDifference':gap}

N=8
F=np.array([[.14,.04,.00],[.18,-.01,.02],[.08,.12,.00],[.06,.04,.16],[.12,-.08,.04],[.02,.10,.08],[.09,.03,-.10],[.11,-.03,.07]])
COV=F@F.T+np.diag(np.linspace(.09,.16,N)**2)
BASE=np.array([.04,.04,.033,.041,.029,.037,.031,.036]);RISK=.10

def solve_portfolio(a,b,warm=None):
    mu=BASE.copy();mu[:2]=a,b
    if warm is None:warm=np.full(N,.08)
    cons=[{'type':'ineq','fun':lambda x:1-x.sum(),'jac':lambda x:-np.ones(N)}, {'type':'ineq','fun':lambda x:RISK**2-x@COV@x,'jac':lambda x:-2*COV@x}]
    sol=minimize(lambda x: -mu@x,warm,jac=lambda x:-mu,bounds=[(0,None)]*N,constraints=cons,method='SLSQP',options={'ftol':2e-12,'maxiter':150})
    w=sol.x;violation=max(0.,float(w.sum()-1),float(w@COV@w-RISK**2),float(-min(w)))
    # KKT stationarity with nonnegative duals. Sufficient for this convex program.
    columns=[]
    if 1-w.sum()<1e-6:columns.append(np.ones(N))
    if RISK**2-w@COV@w<1e-6:columns.append(2*COV@w)
    for k in range(N):
        if w[k]<1e-6:columns.append(-np.eye(N)[k])
    dual,residual=nnls(np.column_stack(columns),mu)
    if violation>1e-7 or residual>2e-5:raise RuntimeError(f'Portfolio KKT {sol.message}, {violation}, {residual}')
    return {'mu':mu.tolist(),'allocation':w.tolist(),'cash':float(max(0,1-w.sum())),'return':float(mu@w),'risk':float(np.sqrt(w@COV@w)),'maxViolation':violation,'kktResidual':float(residual)}

def make_portfolio():
    x=np.linspace(.0,.14,45);y=np.linspace(.0,.14,45);Z=np.zeros((len(y),len(x)));worst=0;residual=0;warm=None;active=np.zeros_like(Z)
    for j,b in enumerate(y):
        for i in (range(len(x)) if j%2==0 else reversed(range(len(x)))):
            s=solve_portfolio(x[i],b,warm);warm=np.array(s['allocation']);Z[j,i]=warm[0];active[j,i]=np.count_nonzero(warm>1e-5);worst=max(worst,s['maxViolation']);residual=max(residual,s['kktResidual'])
    path=[]
    for a in np.linspace(0,2*np.pi,160,endpoint=False):path.append(solve_portfolio(.07+.055*np.sin(a)+.008*np.sin(5*a),.07+.054*np.cos(a+.3)+.007*np.sin(7*a)))
    print('Portfolio complete',worst,residual,flush=True)
    return {'x':x.tolist(),'y':y.tolist(),'z':Z.tolist(),'activeAssets':active.tolist(),'path':path,'covariance':COV.tolist(),'riskCap':RISK,'maxViolation':worst,'maxKktResidual':residual}

CMAP=LinearSegmentedColormap.from_list('paper',['#4f386f','#9774bc','#eee7f2','#e8c9aa','#b96d39'])
def plot_surface(name,data,xlabel,ylabel,zlabel,azim=-125):
    X,Y=np.meshgrid(data['x'],data['y']);Z=np.array(data['z']);fig=plt.figure(figsize=(7.8,6.1),dpi=160,facecolor='white');ax=fig.add_subplot(111,projection='3d')
    ax.plot_surface(X,Y,Z,cmap=CMAP,linewidth=.15,edgecolor=(1,1,1,.18),antialiased=True,rstride=1,cstride=1,shade=True)
    ax.view_init(elev=27,azim=azim);ax.set_box_aspect((1.15,1,.72));ax.set_xlabel(xlabel,labelpad=12,fontsize=12);ax.set_ylabel(ylabel,labelpad=12,fontsize=12);ax.set_zlabel(zlabel,labelpad=10,fontsize=12)
    from matplotlib.ticker import MaxNLocator,StrMethodFormatter
    for a in [ax.xaxis,ax.yaxis,ax.zaxis]:
        a.set_major_locator(MaxNLocator(4));a.set_major_formatter(StrMethodFormatter('{x:.2f}'));a.pane.fill=False;a.pane.set_edgecolor('#e9e7e0');a._axinfo['grid']['color']='#e5e4df';a.line.set_color('#b2b0ad')
    ax.tick_params(colors='#626a72',labelsize=10,pad=2)
    fig.subplots_adjust(left=.015,right=.89,bottom=.08,top=.99);fig.canvas.draw()
    width,height=fig.canvas.get_width_height()
    # Save exact 3D -> image transform so live/GIF markers use the scientific projection.
    matrix=ax.get_proj();projection=[]
    for p in data['path']:
        if name=='control':xx=p['state'][0]-np.pi;yy=p['state'][1];zz=None
        elif name=='dispatch':xx=p['pd'];yy=p['qd'];zz=p['p0']
        else:xx=p['mu'][0];yy=p['mu'][1];zz=p['allocation'][0]
        if zz is None:projection.append(None);continue
        px,py,_=proj3d.proj_transform(xx,yy,zz,matrix);pixel=ax.transData.transform((px,py));projection.append([float(pixel[0]/width),float(1-pixel[1]/height)])
    data['markerPixels']=projection;data['imageSize']=[width,height]
    fig.savefig(OUT/f'{name}-landscape.png',dpi=160,facecolor='white');plt.close(fig)

def math_annotations():
    formulas={
        'proxy-jacobian':r'$\mathcal{M}\odot D\hat{g}_\theta(p_i)$',
        'reference-jacobian':r'$\mathcal{M}\odot Dg(p_i)$',
        'loss-main':r'$\mathcal{L}=\ell_v+\lambda$',
        'loss-value':r'$\ell_v=\|\tilde{x}-x^\star\|_2^2$',
        'loss-numerator':r'$\|\mathcal{M}\odot(D\hat{g}_\theta-Dg)\|_F^2$',
        'loss-denominator':r'$\|\mathcal{M}\|_0$'}
    for name,formula in formulas.items():
        fig=plt.figure(figsize=(8,1),dpi=180);fig.patch.set_alpha(0)
        fig.text(0,0,formula,fontsize=40,color='#202a33')
        fig.savefig(OUT/(name+'.png'),transparent=True,bbox_inches='tight',pad_inches=.03);plt.close(fig)

if __name__=='__main__':
    import argparse
    math_annotations()
    parser=argparse.ArgumentParser();parser.add_argument('--case',choices=['control','dispatch','portfolio','all'],default='all');args=parser.parse_args()
    for name,fn,labels in [('control',make_control,('Initial angle q₁ − π (rad)','Initial angle q₂ (rad)','First torque u₀* (N·m)')),('dispatch',make_dispatch,('Active demand Pᴰ (p.u.)','Reactive demand Qᴰ (p.u.)','Generation P₀* (p.u.)')),('portfolio',make_portfolio,('Expected return μA','Expected return μB','Allocation xA* / B'))]:
        if args.case not in [name,'all']:continue
        started=time.time();data=fn();plot_surface(name,data,*labels);(OUT/(name+'-toy.json')).write_text(json.dumps(data,separators=(',',':')));print(name,'seconds',round(time.time()-started,1),flush=True)
