// Optional authoring utility; the published website has no build step.
// npm install; npx playwright install chromium; node tools/render-gifs.mjs [case]
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(fileURLToPath(new URL('../docs/',import.meta.url)));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml','.gif':'image/gif','.json':'application/json'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+'/'))throw Error('Invalid path');const file=path===root?join(root,'index.html'):path;res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,temporary;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>window.paperIllustrations.ready);
  temporary=await mkdtemp(join(tmpdir(),'sobolev-gifs-'));
  const names={workflow:'masking-workflow',control:'acrobot-geometry',dispatch:'dispatch-geometry',portfolio:'portfolio-geometry'};
  const durations=await page.evaluate(()=>window.paperIllustrations.durations);
  const fps=10;
  for(const [id,name] of Object.entries(names)){
    if(process.argv[2] && process.argv[2]!==id)continue;
    const dir=join(temporary,id);await mkdir(dir);const frames=Math.round(durations[id]*fps);
    for(let i=0;i<frames;i++){
      const data=await page.evaluate(({id,t})=>{window.paperIllustrations.renderFrame(id,t);const source=document.querySelector(`[data-animation="${id}"] canvas`),scaled=document.createElement('canvas');scaled.width=id==='workflow'?1100:960;scaled.height=Math.round(source.height*scaled.width/source.width);scaled.getContext('2d').drawImage(source,0,0,scaled.width,scaled.height);return scaled.toDataURL('image/png').split(',')[1];},{id,t:i/fps});
      await writeFile(join(dir,`${String(i).padStart(4,'0')}.png`),Buffer.from(data,'base64'));
    }
    const still=id==='control'?20:id==='portfolio'?15:0;
    await writeFile(join(root,'assets',`${name}.png`),await readFile(join(dir,`${String(still).padStart(4,'0')}.png`)));
    const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',join(dir,'%04d.png'),'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle','-loop','0',join(root,'assets',`${name}.gif`)],{encoding:'utf8'});
    if(result.status!==0)throw new Error(result.stderr||'ffmpeg failed');
    console.log(`${name}: ${frames} frames, ${durations[id]} seconds`);
  }
}finally{await browser?.close();await new Promise(r=>server.close(r));if(temporary)await rm(temporary,{recursive:true,force:true});}
