const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const name of ['index.html','admin.html','offline.html','manifest.webmanifest','sw.js','css','js','assets'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
// Vercel supplies the deployment hostname at build time. Keep crawlers on this site.
const hostname=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;
if(hostname){const base='https://'+hostname+'/';const file=path.join(out,'index.html');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('https://icpyouthcircle-ops.github.io/ICP-YOUTH-CIRCLE/',base));}
fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /admin.html\n');
console.log('Built static portal in dist/');
