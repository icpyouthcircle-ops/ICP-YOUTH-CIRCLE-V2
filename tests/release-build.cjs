const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');const dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const file of ['index.html','admin.html','offline.html','sw.js','manifest.webmanifest'])assert.ok(fs.existsSync(path.join(dist,file)),file+' missing from release');
for(const forbidden of ['backend','node_modules','tests','tools','.git','package.json'])assert.ok(!fs.existsSync(path.join(dist,forbidden)),forbidden+' must not be published');
for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){const value=match[1];if(/^[a-z]+:|^\/\//i.test(value))continue;assert.ok(fs.existsSync(path.resolve(dist,value)),'Missing homepage asset '+value);}
const worker=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
for(const asset of html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+\?[^\"]+)"/g))assert.ok(worker.includes(asset[1]),'Service worker must match the current '+asset[1]);
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons)assert.ok(fs.existsSync(path.resolve(dist,icon.src)),'Missing install icon');
assert.match(fs.readFileSync(path.join(dist,'robots.txt'),'utf8'),/Disallow: \/admin.html/);
console.log('PASS release: complete assets, current service worker, install icons and no server/development files in deployment.');
