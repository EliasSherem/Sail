/** Offline generation of explicit, collision-checked ocean corridors; no runtime A*. */
import fs from "node:fs";
import { PORTS } from "../src/data/ports";
import { EXPANDED_PORTS } from "../src/data/expandedPorts";
import { worldFromGeoJSON } from "../src/geo/world";
import { destination, distance, bearing, toLocal, fromLocal } from "../src/geo/math";
import type { LatLon } from "../src/types";
const world = worldFromGeoJSON(JSON.parse(fs.readFileSync("public/data/land.geojson", "utf8")));
type Node = LatLon & { id: string; approach?: boolean };
const nodes = new Map<string, Node>(PORTS.map(p => [p.id, p]));
const generated = new Map<string, Node>();
const chains: string[][] = [];
const audit: object[] = [];
const add = (node: Node) => { nodes.set(node.id, node); generated.set(node.id, node); return node; };
const manuals: [string,number,number][] = [
  ["cadiz-exterior",36,-6.25], ["cabo-exterior",-33.8,17], ["new-york-exterior",39,-72], ["uraga-sur",34.95,139.72], ["sydney-exterior",-33.845,151.322],
  ["norway-lindesnes",57.7,7], ["oslo-mouth",58.9,10.6], ["atl-cape-sable",43.1,-65.6], ["atl-cape-cod",41.55,-69.7], ["atl-hatteras",34.9,-75.15], ["atl-florida",27.1,-79.6],
  ["africa-liberia",2,-14], ["africa-angola",-18,8],
  ["pac-mex-south",14,-97], ["pac-guatemala",12,-90], ["pac-chile-south",-48,-78], ["pac-cape-horn-west",-56.5,-73], ["pac-cape-horn-east",-56.7,-64], ["atl-patagonia",-44,-60],
  ["med-sardinia-east",39.3,10.1], ["med-sicily-south",35.3,14.5], ["med-matapan",35.7,22.2], ["med-peloponnese-east",36.25,23.65],
  ["red-bab-south",12.25,43.75], ["red-aden",12.1,45], ["arab-socotra",13,55], ["arab-oman",24.7,58.7], ["arab-hormuz-east",25.6,57], ["arab-hormuz-north",26.6,56.2],
  ["india-west",13,72], ["india-south",6.6,76.5], ["sri-lanka-south",5.6,80.5], ["malacca-west",5.7,94], ["malacca-central",3.4,100.1],
  ["china-sea-south",8,109], ["taiwan-west",25,119.4], ["jeju-south",32.4,127.2], ["kyushu-west",32.1,128.3], ["kyushu-south",30.1,131.5], ["japan-south",31.3,136],
  ["sunda-west",-6,103.5], ["sunda-south",-10,107], ["australia-southwest",-35.5,114], ["australia-bight",-38,134], ["bass-west",-39.5,143.7], ["bass-east",-39.5,149], ["nz-north",-34,173],
];
const oldIds=new Set(["cadiz-exterior","cabo-exterior","new-york-exterior","uraga-sur","sydney-exterior"]);
for(const [id,lat,lon] of manuals) { const n={id,lat,lon,approach:true}; nodes.set(id,n); if(!oldIds.has(id))generated.set(id,n); }
const offshore = new Map<string,string>();
for(const port of PORTS) {
  if(!EXPANDED_PORTS.some(p=>p.id===port.id) && !["new-york","cape-town","genoa","sydney","yokohama"].includes(port.id))continue;
  let found: Node | undefined;
  for(const meters of [3500,2500,1500,700,5500,9000]) {
    for(const turn of [0,20,-20,45,-45,70,-70,100,-100,135,-135,180]) {
      const p=destination(port,port.heading+turn*Math.PI/180,meters);
      if(world.clearance(p)<300 || world.sweep(port,p,95).hit) continue;
      found=add({id:`offshore-${port.id}`,lat:p.lat,lon:p.lon,approach:true});break;
    }
    if(found)break;
  }
  if(!found) throw Error(`No seaward exit: ${port.id}`);
  offshore.set(port.id,found.id); chains.push([port.id,found.id]);
}
// Each addition bundle retains its geographic sources alongside the authored
// service chains. Port seeds are merged into docs/port-seeds.json before generation.
const serviceNetworks: string[][] = ["regional", "atlantic", "coastal", "drake"].flatMap(region => {
  const file = `docs/${region}-service-additions.json`;
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")).networks : [];
});
const networks: string[][] = [
 ...serviceNetworks,
 ["cadiz-exterior","cadiz","lisbon","porto","vigo","a-coruna","brest","cork","killybegs","stornoway","torshavn","hofn","vestmannaeyjar","reykjavik","isafjordur","tasiilaq","prins-christian-sund","nanortalik","qaqortoq","paamiut","nuuk","sisimiut","qikiqtarjuaq","pangnirtung","iqaluit","saglek","nain","cartwright","st-anthony","st-johns","saint-pierre","halifax","atl-cape-sable","boston","atl-cape-cod","new-york"],
 ["brest","falmouth","rotterdam","hamburg","bergen","norway-lindesnes","oslo-mouth","oslo"], ["stornoway","bergen"],
 ["lisbon","funchal","las-palmas","dakar","africa-liberia","africa-angola","cabo-exterior"], ["cadiz","casablanca","las-palmas"],
 ["lisbon","ponta-delgada","horta","bermuda","new-york"],
 ["new-york","atl-hatteras","atl-florida","miami","nassau","havana","cancun","veracruz"], ["veracruz","havana"],
 ["nassau","san-juan","cartagena-colombia","colon"], ["miami","bermuda","san-juan"],
 ["balboa","pac-guatemala","pac-mex-south","acapulco","manzanillo","los-cabos","san-diego","los-angeles","san-francisco","seattle","vancouver"],
 ["balboa","callao","valparaiso","pac-chile-south","pac-cape-horn-west","pac-cape-horn-east","atl-patagonia","montevideo","buenos-aires"],
 ["montevideo","santos","rio-de-janeiro","dakar"], ["santos","cape-town"],
 ["genoa","med-sardinia-east","med-sicily-south","med-matapan","med-peloponnese-east","piraeus","istanbul"],
 ["piraeus","port-said","ashdod","haifa"],
 ["suez","jeddah","red-bab-south","red-aden","arab-socotra","arab-oman","arab-hormuz-east","arab-hormuz-north","dubai"], ["suez","eilat","jeddah"],
 ["arab-oman","mumbai","india-west","india-south","colombo","sri-lanka-south","malacca-west","malacca-central","singapore","china-sea-south","hong-kong","taiwan-west","shanghai","jeju-south","busan","kyushu-west","kyushu-south","japan-south","uraga-sur"],
 ["singapore","sunda-west","sunda-south","fremantle","australia-southwest","australia-bight","bass-west","bass-east","sydney-exterior"],
 ["sydney","brisbane"], ["sydney","nz-north","auckland"],
];
class Queue { a:{key:string;score:number}[]=[]; push(key:string,score:number){const a=this.a;let i=a.length;a.push({key,score});while(i>0){const j=(i-1)>>1;if(a[j].score<=score)break;a[i]=a[j];i=j;}a[i]={key,score};} pop(){const a=this.a,first=a[0],last=a.pop();if(!a.length||!last)return first;let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].score<a[j].score)j++;if(a[j].score>=last.score)break;a[i]=a[j];i=j;}a[i]=last;return first;} }
const cacheFile="docs/ocean-route-cache.json";
const pathCache: Record<string,LatLon[]> = fs.existsSync(cacheFile)?JSON.parse(fs.readFileSync(cacheFile,"utf8")):{};
function gridPath(start:LatLon,end:LatLon,step:number):LatLon[]|null {
 const target=toLocal(end,start),total=Math.hypot(target.x,target.z),pad=Math.max(210000,total*.3),limit=45000;
 const minX=Math.floor((Math.min(0,target.x)-pad)/step),maxX=Math.ceil((Math.max(0,target.x)+pad)/step),minZ=Math.floor((Math.min(0,target.z)-pad)/step),maxZ=Math.ceil((Math.max(0,target.z)+pad)/step);
 const coords=new Map<string,LatLon>([["0,0",start]]),cost=new Map<string,number>([["0,0",0]]),previous=new Map<string,string>(),queue=new Queue(),closed=new Set<string>();
 queue.push("0,0",total);let last:string|undefined;
 while(queue.a.length&&closed.size<limit){const item=queue.pop()!;if(closed.has(item.key))continue;closed.add(item.key);const [x,z]=item.key.split(',').map(Number),p=coords.get(item.key)!;
  if(Math.hypot(target.x-x*step,target.z-z*step)<step*2.9&&!world.sweep(p,end,100).hit){last=item.key;break;}
  for(const [dx,dz] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[1,-2],[-1,2],[1,2]]) {
   const nx=x+dx,nz=z+dz;if(nx<minX||nx>maxX||nz<minZ||nz>maxZ)continue;const key=`${nx},${nz}`;if(closed.has(key))continue;
   const nextCost=cost.get(item.key)!+Math.hypot(dx,dz)*step;if(nextCost>=(cost.get(key)??Infinity))continue;
   let q=coords.get(key);if(!q){q=fromLocal(nx*step,nz*step,start);coords.set(key,q);}if(world.isLand(q)||world.sweep(p,q,100).hit)continue;
   cost.set(key,nextCost);previous.set(key,item.key);queue.push(key,nextCost+Math.hypot(target.x-nx*step,target.z-nz*step));
  }
 }
 if(!last)return null;const result=[end];let current:string|undefined=last;while(current){result.push(coords.get(current)!);current=previous.get(current);}return result.reverse();
}
function simplify(points:LatLon[]) {const result=[points[0]];let i=0;while(i<points.length-1){let next=points.length-1;while(next>i+1&&world.sweep(points[i],points[next],100).hit)next--;result.push(points[next]);i=next;}return result;}
const failed:string[]=[]; const done=new Set<string>();
for(const network of networks)for(let i=1;i<network.length;i++){
 const startId=offshore.get(network[i-1])??network[i-1],endId=offshore.get(network[i])??network[i],key=`${startId}/${endId}`;if(done.has(key))continue;done.add(key);
 const start=nodes.get(startId)!,end=nodes.get(endId)!;if(!start||!end)throw Error(`unknown ${key}`);
 const time=performance.now();let path=pathCache[key];
 if(path && (distance(path[0],start)>1||distance(path.at(-1)!,end)>1||path.slice(1).some((p,i)=>world.sweep(path[i],p,95).hit)))path=undefined as unknown as LatLon[];
 if(!path){if(!world.sweep(start,end,100).hit)path=[start,end];else for(const step of [20000,8000,3000,1000]){const raw=gridPath(start,end,step);if(raw){path=simplify(raw);break;}}
  if(path){pathCache[key]=path;fs.writeFileSync(cacheFile,JSON.stringify(pathCache));}
 }
 if(!path){console.log(`FAILED ${key}`);failed.push(key);continue;}
 const chain=[startId];for(let j=1;j<path.length-1;j++){const id=`route-${network[i-1]}-${network[i]}-${j}`;add({id,lat:+path[j].lat.toFixed(8),lon:+path[j].lon.toFixed(8),approach:true});chain.push(id);}chain.push(endId);chains.push(chain);
 const length=path.reduce((sum,p,j)=>sum+(j?distance(path[j-1],p):0),0);audit.push({from:network[i-1],to:network[i],km:+(length/1000).toFixed(2),points:path.length});
 console.log(`${network[i-1]} > ${network[i]}: ${(length/1000).toFixed(1)} km / ${path.length} points / ${Math.round(performance.now()-time)} ms`);
}
fs.writeFileSync("src/geo/expandedRoutes.ts", `import type { LatLon } from "../types";\n\n// Generated offline against the exact land/canal/dock collision geometry.\n// Regional corridors use >=100 m swept clearance; port approach legs use >=95 m.\n// These conservative fictional routes do not model ice, traffic separation or local restrictions.\nexport const EXPANDED_WAYPOINTS: Array<LatLon & { id:string; approach?:boolean }> = ${JSON.stringify([...generated.values()],null,2)};\nexport const EXPANDED_CHAINS: string[][] = ${JSON.stringify(chains,null,2)};\n`);
fs.writeFileSync("docs/ocean-route-audit.json",JSON.stringify({failed,legs:audit},null,2));
console.log(JSON.stringify({newNodes:generated.size,chains:chains.length,failed}));
if (failed.length) process.exitCode = 1;
