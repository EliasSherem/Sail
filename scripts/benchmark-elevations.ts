import fs from 'node:fs';
import {PORTS} from '../src/data/ports';
import {worldFromGeoJSON} from '../src/geo/world';
import {setPortElevations} from '../src/render/elevation';
import {createTerrain} from '../src/render/terrain';
import {disposeObject} from '../src/render/shipModels';
setPortElevations(JSON.parse(fs.readFileSync('public/data/port-elevations.json','utf8')));
const world=worldFromGeoJSON(JSON.parse(fs.readFileSync('public/data/land.geojson','utf8')));
const results=[];
for(const id of ['marseille','marseille','marseille','new-york','cancun','eilat','los-cabos','nuuk','singapore']){
 const port=PORTS.find(p=>p.id===id)!;const start=performance.now();const terrain=createTerrain(world,port);const milliseconds=performance.now()-start;let vertices=0,meshes=0;
 terrain.traverse((o:any)=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;}});disposeObject(terrain);results.push({id,milliseconds,vertices,meshes});console.log(results.at(-1));
}
fs.writeFileSync('docs/elevation-performance.json',JSON.stringify(results,null,2));
