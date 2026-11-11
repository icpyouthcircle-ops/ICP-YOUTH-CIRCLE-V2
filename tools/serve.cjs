const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const args=process.argv.slice(2);
const option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400);res.end();return;}
  if(name==='/')name='/index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)||name.split('/').some(x=>x.startsWith('.'))||name.startsWith('/backend/')||name.startsWith('/node_modules/')){res.writeHead(404);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(Number(option('--port',process.env.PORT||3000)),option('--host','0.0.0.0'),()=>console.log('ICP Youth Circle preview ready'));
