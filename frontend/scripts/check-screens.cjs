const {spawnSync}=require('child_process');
const cli=process.env.AGENT_BROWSER_CLI;
if(!cli)throw new Error('Set AGENT_BROWSER_CLI to the installed bin/agent-browser.js');
const run=(args)=>{const p=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:45000,windowsHide:true});if(p.status!==0)throw new Error(p.stderr||p.stdout);return p.stdout.trim();};
const width=process.argv[2] || '390';
run(['set','viewport',width,'844']);
const routes=process.argv.slice(3);
for(const route of routes){
  run(['errors','--clear']);run(['open','http://127.0.0.1:3098/'+route]);run(['wait','--load','networkidle']);
  const result=run(['eval',`JSON.stringify({route:location.pathname,width:innerWidth,bodyWidth:document.body.scrollWidth,content:document.body.innerText.trim().length,overflow:Array.from(document.querySelectorAll('input,button,[role="button"]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left < -2)&&!e.closest('[class*="overflowX-auto"]')}).length})`]);
  const errors=run(['errors']);
  console.log(result+(errors?' ERRORS: '+errors:''));
}
