import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PORTS } from "../data/ports";
import { PORT_LANDMARKS, portSceneProfile, type OSMBuilding, type PortLandmark, type PortSceneAtlas, type PortSceneProfile } from "../data/portScenery";
import { destination, distance, fromLocal, toLocal } from "../geo/math";
import type { World } from "../geo/world";
import type { LatLon } from "../types";

let atlas: PortSceneAtlas | null = null;
let loading: Promise<void> | undefined;
/** Load once with World/DEM at startup. All requests remain on the local origin. */
export function preloadPortSceneryData(): Promise<void> {
  return loading ??= fetch("/data/port-scenes/osm-buildings.json").then(async (response) => {
    if (!response.ok) throw new Error(`No se pudieron cargar los edificios portuarios (${response.status}).`);
    const data = await response.json() as PortSceneAtlas;
    if (data.version !== 1 || !data.buildings) throw new Error("Atlas portuario no válido.");
    atlas = data;
  });
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hash = (text: string) => { let h = 2166136261; for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function randomFor(id: string) { let h = hash(id); return () => { h = Math.imul(h ^ (h >>> 15), 1 | h); h ^= h + Math.imul(h ^ (h >>> 7), 61 | h); return ((h ^ (h >>> 14)) >>> 0) / 4294967296; }; }
function facadeTextures() {
  const size = 64, color = new Uint8Array(size * size * 4), emission = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const window = x % 16 > 4 && x % 16 < 13 && y % 16 > 4 && y % 16 < 12;
    const on = window && ((Math.floor(x / 16) * 13 + Math.floor(y / 16) * 7) % 5 !== 0);
    const sill = y % 16 === 3;
    const value = window ? 65 + Math.floor(y / 16) * 8 : sill ? 189 : 239;
    color.set(window ? [value * .8, value, value * 1.12, 255] : [value, value, value * .97, 255], i);
    emission.set(on ? [200, 170, 115, 255] : [0, 0, 0, 255], i);
  }
  const make = (data: Uint8Array) => { const texture = new THREE.DataTexture(data, size, size); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true; return texture; };
  return { color: make(color), emission: make(emission) };
}

type Batch = "facade" | "solid" | "roof" | "metal" | "glass" | "green";
interface Footprint { portId: string; source: "osm" | "procedural" | "terminal" | "landmark"; points: LatLon[] }
interface PortStatistics { id: string; osmAccepted: number; osmRejected: number; procedural: number; landmarksAccepted: string[]; landmarksRejected: string[]; terminal: boolean }
interface Site { point: LatLon; x: number; z: number; base: number; ground: number[]; points: [number, number][]; samples: LatLon[] }

/** Decorative architecture never modifies coastline, port positions or colliders.
 * Every building's entire sampled base must already be land in World. */
export function createPortScenery(world: World, origin: LatLon, radius: number, surfaceAt: (point: LatLon) => number): THREE.Group {
  const result = new THREE.Group(); result.name = "geographic-port-scenery";
  const textures = facadeTextures();
  const materials: Record<Batch, THREE.MeshStandardMaterial> = {
    facade: new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, map: textures.color, emissive: "#e7c78e", emissiveMap: textures.emission, emissiveIntensity: .32, roughness: .86 }),
    solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .87 }),
    roof: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .46, roughness: .39 }),
    glass: new THREE.MeshStandardMaterial({ vertexColors: true, color: "#c8dce3", roughness: .26, metalness: .42, emissive: "#435b61", emissiveIntensity: .12 }),
    green: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  };
  const batches: Record<Batch, THREE.BufferGeometry[]> = { facade: [], solid: [], roof: [], metal: [], glass: [], green: [] };
  const footprints: Footprint[] = [], statistics: PortStatistics[] = [], occupied = new Set<string>();
  let buildings = 0;
  const occupiedKey = (x: number, z: number) => `${Math.round(x / 45)},${Math.round(z / 45)}`;
  function add(geometry: THREE.BufferGeometry, batch: Batch, color: string, matrix?: THREE.Matrix4) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    if (matrix) g.applyMatrix4(matrix);
    const count = g.getAttribute("position").count, c = new THREE.Color(color), colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    if (!g.getAttribute("uv")) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
    batches[batch].push(g);
  }
  function box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, batch: Batch = "solid", angle = 0) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    if (batch === "facade") {
      const uv = geometry.attributes.uv, pos = geometry.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(w, d) / 16, (pos.getY(i) + h / 2) / 13);
    }
    const matrix = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), angle), V(1, 1, 1));
    add(geometry, batch, color, matrix);
  }
  function rod(a: THREE.Vector3, b: THREE.Vector3, width: number, color: string, batch: Batch = "metal") {
    add(new THREE.CylinderGeometry(width, width, a.distanceTo(b), 8), batch, color,
      new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1)));
  }
  function ellipse(x: number, y: number, z: number, w: number, h: number, d: number, color: string, batch: Batch = "solid", half = false) {
    add(new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, half ? Math.PI / 2 : Math.PI), batch, color,
      new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(w, h, d)));
  }
  function rectangle(w: number, d: number, angle = 0): [number, number][] {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z]) => [x*c+z*s,-x*s+z*c]);
  }
  function site(point: LatLon, shape: [number, number][], maxSlope = 38): Site | null {
    if (shape.length < 3 || !world.isLand(point)) return null;
    const samples: LatLon[] = [point];
    for (let i = 0; i < shape.length; i++) {
      const a = shape[i], b = shape[(i + 1) % shape.length];
      samples.push(fromLocal(a[0], a[1], point), fromLocal((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, point));
    }
    if (samples.some((sample) => !world.isLand(sample))) return null;
    const heights = samples.map(surfaceAt);
    if (heights.some((height) => !Number.isFinite(height)) || Math.max(...heights) - Math.min(...heights) > maxSlope) return null;
    const local = toLocal(point, origin);
    return { point, x: local.x, z: local.z, points: shape, ground: heights, base: Math.max(0, ...heights) + .15, samples };
  }
  function footprint(portId: string, source: Footprint["source"], s: Site) { footprints.push({ portId, source, points: s.samples }); occupied.add(occupiedKey(s.x, s.z)); }
  function building(s: Site, h: number, color: string, roofColor: string, pitched: boolean, facade = true) {
    let outline = s.points.slice();
    const area = outline.reduce((sum, p, i) => { const q = outline[(i + 1) % outline.length]; return sum + p[0]*q[1]-q[0]*p[1]; }, 0);
    if (area > 0) outline.reverse();
    const positions: number[] = [], uv: number[] = [];
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length], width = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const bottom = Math.min(...s.ground) - 1, top = s.base + h;
      const vertices = [[a[0],bottom,a[1]],[b[0],bottom,b[1]],[b[0],top,b[1]],[a[0],bottom,a[1]],[b[0],top,b[1]],[a[0],top,a[1]]];
      for (const [x,y,z] of vertices) positions.push(x+s.x,y,z+s.z);
      uv.push(0,0,width/16,0,width/16,(top-bottom)/13,0,0,width/16,(top-bottom)/13,0,(top-bottom)/13);
    }
    const walls = new THREE.BufferGeometry(); walls.setAttribute("position", new THREE.Float32BufferAttribute(positions,3)); walls.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); walls.computeVertexNormals(); add(walls, facade ? "facade" : "solid", color);
    const roof: number[] = [];
    const contour = outline.map(([x,z])=>new THREE.Vector2(x,z));
    for (const face of THREE.ShapeUtils.triangulateShape(contour, [])) {
      const points = face.map(i=>outline[i]);
      const [a,b,c] = points;
      const yNormal = (b[1]-a[1])*(c[0]-a[0])-(b[0]-a[0])*(c[1]-a[1]);
      if (yNormal < 0) [points[1],points[2]] = [points[2],points[1]];
      for (const [x,z] of points) roof.push(s.x+x,s.base+h,s.z+z);
    }
    const roofGeometry = new THREE.BufferGeometry(); roofGeometry.setAttribute("position",new THREE.Float32BufferAttribute(roof,3)); roofGeometry.computeVertexNormals(); add(roofGeometry,"roof",roofColor);
    if (pitched && outline.length === 4) {
      const corners = outline.map(([x,z])=>V(s.x+x,s.base+h,s.z+z));
      const center = V(s.x,s.base+h+Math.min(5,h*.24),s.z);
      const top: number[]=[];
      for(let i=0;i<4;i++){ const a=corners[i],b=corners[(i+1)%4];top.push(...a.toArray(),...center.toArray(),...b.toArray()); }
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(top,3));g.computeVertexNormals();add(g,"roof",roofColor);
    }
    buildings++;
  }
  function nearestLand(point: LatLon, city?: LatLon): LatLon | null {
    if (city && site(city, rectangle(55,55),60)) return city;
    const center = city ?? point;
    for (let r=200;r<=15000;r+=300) for(let j=0;j<20;j++) {
      const candidate = destination(center, j * Math.PI / 10, r);
      if (site(candidate,rectangle(55,55),50)) return candidate;
    }
    return null;
  }
  function terminal(profile: PortSceneProfile, city: LatLon, stat: PortStatistics) {
    const requested = profile.terminalPosition ?? city;
    const industrial = profile.terminal === "container" || profile.terminal === "bulk";
    const research = profile.terminal === "research";
    let position: Site | null = null;
    const width = research ? 36 : industrial ? 285 : 125, depth = research ? 24 : industrial ? 255 : 80;
    for(let i=0;i<45 && !position;i++) {
      const point = i === 0 ? requested : destination(requested, i*2.39996, 110*Math.sqrt(i));
      position = site(point,rectangle(width,depth + (industrial ? 40 : 0)),25);
    }
    if(!position)return;
    const s=position, y=s.base;stat.terminal=true;footprint(profile.id,"terminal",s);
    if(research){
      // A modest shore landing, not a container terminal or a fleet of yachts.
      box(s.x,y+.16,s.z+4,10,.3,6,"#85817a");
      ellipse(s.x-8,y+.55,s.z-5,1.5,.5,3.2,"#434e52");
      box(s.x-8,y+.78,s.z-5,1.65,.25,3,"#80868a");
      for(let i=0;i<3;i++)add(new THREE.CylinderGeometry(.32,.32,.9,8),"metal",profile.palette[i],new THREE.Matrix4().makeTranslation(s.x+5+i*.9,y+.45,s.z+4));
      rod(V(s.x+11,y,s.z+6),V(s.x+11,y+6,s.z+6),.08,"#aab3b6");
      return;
    }
    box(s.x,y+.12,s.z,width,.25,depth,"#848885");
    box(s.x,y+7,s.z+depth*.28,width*.58,14,depth*.24,profile.palette[1],"facade");
    box(s.x,y+14.4,s.z+depth*.28,width*.59,.8,depth*.25,profile.roof,"roof");
    if(industrial){
      const colors=["#a85e42","#4c727d","#b7b19b","#708e7a","#caa36a"];
      for(let row=0;row<9;row++)for(let col=0;col<15;col++)for(let level=0;level<2+(col%3===0?1:0);level++)
        box(s.x-width*.40+col*15,y+1.3+level*2.7,s.z-depth*.27+row*8,12.2,2.6,2.5,colors[(row+col+level)%colors.length],"metal");
      for(let crane=0;crane<4;crane++){
        const x=s.x-width*.35+crane*width*.235,z=s.z-depth*.37,h=54;
        for(const sx of[-1,1])for(const sz of[-1,1])rod(V(x+sx*12,y,z+sz*10),V(x+sx*8,y+h*.65,z+sz*8),1.05,profile.craneColor);
        box(x,y+h*.65,z,31,3,25,profile.craneColor,"metal");
        for(const sx of[-1,1]){rod(V(x+sx*8,y+h*.65,z+5),V(x+sx*5,y+h,z+8),.8,profile.craneColor);rod(V(x+sx*5,y+h,z+8),V(x+sx*8,y+h*.67,z-37),.25,"#d1d0bd");}
        box(x,y+h*.69,z-13,18,2.2,67,profile.craneColor,"metal");
        rod(V(x,y+h*.69,z-35),V(x,y+7,z-35),.17,"#bac4c3");
      }
      if(profile.terminal==="bulk") for(let i=0;i<6;i++){
        const x=s.x-width*.40+i*21,z=s.z+depth*.35;
        add(new THREE.CylinderGeometry(8,8,25,14),"metal","#bac3bd",new THREE.Matrix4().makeTranslation(x,y+12.5,z));
        ellipse(x,y+25,z,8,3.5,8,"#a9b5b1","metal",true);
      }
    }else{
      // On-shore marina hardstand: boats are decorative only on land, never invisible channel obstacles.
      for(let i=0;i<12;i++){
        const x=s.x-width*.4+i*width*.072,z=s.z-depth*.14;
        ellipse(x,y+2.8,z,2.5,2,7,"#e5e2d5");box(x,y+3.8,z-1,3,1.7,4.5,"#eae6d8");
        if(profile.terminal!=="fishing")rod(V(x,y+4,z),V(x,y+17,z),.11,"#bbc5c7");
      }
      box(s.x-width*.39,y+10,s.z+depth*.29,13,20,13,"#d8ceb4","facade");
    }
  }
  function landmark(mark: PortLandmark, stat: PortStatistics) {
    const s=site(mark,rectangle(mark.width * 1.10,mark.depth * 1.10,mark.heading),70);
    if(!s){stat.landmarksRejected.push(mark.id);return;}stat.landmarksAccepted.push(mark.id);footprint(mark.portId,"landmark",s);
    const x=s.x,z=s.z,y=s.base,h=mark.height,w=mark.width,d=mark.depth;
    if(mark.kind==="world-trade"){
      box(x,y+35,z,w,70,d,"#bbc8ca","glass");
      const geometry=new THREE.CylinderGeometry(w*.48,w*.71,h*.64,4,1,false,Math.PI/4);add(geometry,"glass","#a5c0cc",new THREE.Matrix4().makeTranslation(x,y+70+h*.32,z));
      rod(V(x,y+h*.77,z),V(x,y+h,z),1.5,"#b1b9bd");
    }else if(mark.kind==="skypark"){
      for(const offset of[-.31,0,.31])box(x+w*offset,y+h*.46,z,w*.13,h*.92,d*.58,"#bdcacf","facade",mark.heading);
      box(x,y+h*.945,z,w,9,d*.65,"#d4d9ce","solid",mark.heading);
      box(x,y+h*.973,z-7,w*.79,1.8,d*.28,"#667c54","green",mark.heading);
    }else if(mark.kind==="opera"){
      box(x,y+7,z,w,14,d,"#c6b091");
      for(let row=0;row<2;row++)for(let i=0;i<4;i++){
        const xx=x+(row-.5)*w*.37,zz=z-d*.29+i*d*.20,hh=h*(.72-i*.13);
        const shellShape=new THREE.Shape(),span=w*.35;
        shellShape.moveTo(-span*.5,0);shellShape.quadraticCurveTo(-span*.46,hh*.55,-span*.10,hh);shellShape.quadraticCurveTo(span*.48,hh*.68,span*.5,0);shellShape.closePath();
        const shell=new THREE.ExtrudeGeometry(shellShape,{depth:d*.20,bevelEnabled:true,bevelSegments:2,bevelSize:1.1,bevelThickness:1.1,curveSegments:14});
        shell.translate(xx,y+14,zz-d*.10);add(shell,"solid","#e9e7d9");
      }
    }else if(mark.kind==="needle"){
      rod(V(x,y,z),V(x,y+h*.82,z),3.2,"#999e96");ellipse(x,y+h*.83,z,w*.50,h*.042,w*.50,"#b7a36d","metal");rod(V(x,y+h*.83,z),V(x,y+h,z),1.4,"#d0d4cf");
    }else if(mark.kind==="sail-hotel"){
      const shape=new THREE.Shape();shape.moveTo(-w*.46,0);shape.lineTo(w*.46,0);shape.quadraticCurveTo(w*.15,h*.6,-w*.36,h);shape.lineTo(-w*.46,0);
      const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:18});geo.translate(x,y,z-d/2);add(geo,"glass","#9fc2cf");
    }else if(mark.kind==="stepped-hotel"){
      for(let i=0;i<7;i++)box(x,y+(i+.5)*h/7,z,w*(1-i*.10),h/7,d*(1-i*.10),"#e5d4b7","facade");
    }else if(mark.kind==="gold-dome"||mark.kind==="basilica"||mark.kind==="cathedral"){
      box(x,y+h*.18,z,w*.75,h*.36,d*.65,"#dfd1b3","facade");
      if(mark.kind==="gold-dome"){
        add(new THREE.CylinderGeometry(w*.27,w*.30,h*.19,12),"solid","#e9ddc8",new THREE.Matrix4().makeTranslation(x,y+h*.46,z));
        ellipse(x,y+h*.56,z,w*.28,h*.34,d*.28,"#c5a04a","metal",true);rod(V(x,y+h*.85,z),V(x,y+h,z),.55,"#d1b565");
      }else{
        const tx=x-w*.31;box(tx,y+h*.44,z,w*.18,h*.88,d*.39,"#c8b591","facade");
        ellipse(x+w*.16,y+h*.42,z,w*.18,h*.24,d*.24,"#aaa28c","roof",true);
        rod(V(tx,y+h*.88,z),V(tx,y+h,z),1.0,"#c7aa56");
        if(mark.kind==="cathedral")ellipse(x-w*.03,y+h*.44,z,w*.19,h*.30,d*.29,"#a1a68e","roof",true);
      }
    }else if(mark.kind==="liberty"){
      box(x,y+h*.19,z,w*.65,h*.38,d*.65,"#b9ad96");
      add(new THREE.ConeGeometry(w*.21,h*.43,9),"solid","#7d9c83",new THREE.Matrix4().makeTranslation(x,y+h*.60,z));
      ellipse(x,y+h*.81,z,5,7,5,"#789d82");rod(V(x+4,y+h*.72,z),V(x+13,y+h*.97,z),2.2,"#799c82");ellipse(x+13,y+h*.99,z,2.5,4,2.5,"#cbb166","metal");
    }else{
      box(x,y+5,z,w,10,d,"#c6b397");rod(V(x,y+10,z),V(x,y+h*.82,z),mark.kind==="column"?3.2:7,"#d4c5aa","solid");
      ellipse(x,y+h*.86,z,mark.kind==="column"?5:10,4,mark.kind==="column"?5:10,"#a4977e","metal");rod(V(x,y+h*.86,z),V(x,y+h,z),2.3,"#929d89","solid");
    }
  }

  const visible=PORTS.filter(port=>distance(port,origin)<radius+5000).sort((a,b)=>distance(a,origin)-distance(b,origin)).slice(0,5);
  for(const [portIndex,port]of visible.entries()){
    if(buildings>=1000)break;
    const profile=portSceneProfile(port.id),random=randomFor(port.id),stat:PortStatistics={id:port.id,osmAccepted:0,osmRejected:0,procedural:0,landmarksAccepted:[],landmarksRejected:[],terminal:false};statistics.push(stat);
    const budget=Math.min(1000-buildings,profile.architecture==="polar"?profile.buildings:portIndex===0?750:220),start=buildings;
    const reserved = PORT_LANDMARKS.filter(mark=>mark.portId===port.id&&site(mark,rectangle(mark.width*1.10,mark.depth*1.10,mark.heading),70));
    const osm=[...(atlas?.buildings[port.id]??[]),...(port.id==="new-york"?atlas?.buildings["new-york-shore"]??[]:[])];
    // Keep the nearby coast populated, then spend the remaining budget on the
    // tallest actual distant buildings. Manhattan stays at its real coordinates;
    // weather fog still applies, and the combined OSM district shares one budget.
    osm.sort((a,b)=>{
      const da=distance(a,origin),db=distance(b,origin),nearA=da<=radius,nearB=db<=radius;
      if(nearA!==nearB)return nearA?-1:1;
      return nearA?da-db:b.h-a.h||da-db;
    });
    for(const b of osm){
      if(buildings-start>=budget)break;
      if(reserved.some(mark=>distance(b,mark)<Math.hypot(mark.width,mark.depth)*.55+Math.sqrt(b.a)*.5))continue;
      if(distance(b,origin)>radius && (b.h<=50||distance(b,origin)>43000))continue;
      const s=site(b,b.p);if(!s){stat.osmRejected++;continue;}
      const industrial=["warehouse","industrial","hangar","storage_tank"].includes(b.k);
      const estimated=industrial?9:profile.height*(.58+random()*.85);
      const height=b.h||Math.min(profile.highRise,estimated);
      building(s,height,profile.palette[b.id%profile.palette.length],profile.roof,["arctic","polar","northern","mediterranean"].includes(profile.architecture)&&height<25,!industrial);
      footprint(port.id,"osm",s);stat.osmAccepted++;
    }
    const city=nearestLand(port,profile.city);
    if(city){
      const local=toLocal(city,origin),count=Math.min(profile.buildings,budget),step=profile.architecture==="polar"?32:profile.architecture==="arctic"?48:profile.architecture==="metropolis"?85:65;
      for(let attempt=0;attempt<count*10 && buildings-start<Math.min(budget,Math.max(count,stat.osmAccepted));attempt++){
        const col=Math.round((random()-.5)*profile.cityRadius*2/step),row=Math.round((random()-.5)*profile.cityRadius*2/step);
        const xx=col*step,zz=row*step;if(Math.hypot(xx,zz)>profile.cityRadius)continue;
        const a=profile.streetAngle,c=Math.cos(a),sn=Math.sin(a),point=fromLocal(xx*c+zz*sn,-xx*sn+zz*c,city),xy=toLocal(point,origin);
        if(distance(point,origin)>radius||occupied.has(occupiedKey(xy.x,xy.z))||reserved.some(mark=>distance(point,mark)<Math.hypot(mark.width,mark.depth)*.55+step*.45))continue;
        const w=step*(.30+random()*.25),d=step*(.32+random()*.23),s=site(point,rectangle(w,d,a),28);if(!s)continue;
        const central=1-Math.min(1,Math.hypot(xy.x-local.x,xy.z-local.z)/profile.cityRadius);
        const tower=random()<.13*central&&profile.highRise>50;
        const height=tower?profile.highRise*(.45+random()*.55):profile.height*(.50+random());
        building(s,height,profile.palette[Math.floor(random()*profile.palette.length)],profile.roof,["arctic","polar","northern","mediterranean","tropical"].includes(profile.architecture)&&!tower);
        if(tower)box(s.x,s.base+height+1.3,s.z,w*.45,2.6,d*.45,profile.roof,"metal",a);
        footprint(port.id,"procedural",s);stat.procedural++;
      }
      // A second low coastal district is useful at offshore anchorages such as NY,
      // while the actual distant city skyline remains geographically separate.
      if(profile.city && distance(profile.city,port)>16000 && buildings-start<budget){
        const coast=nearestLand(port);if(coast)for(let i=0;i<180&&buildings-start<budget;i++){
          const point=fromLocal((random()-.5)*3400,(random()-.5)*1700,coast),s=site(point,rectangle(18+random()*13,20+random()*12));
          if(!s||occupied.has(occupiedKey(s.x,s.z)))continue;
          building(s,6+random()*17,profile.palette[i%5],profile.roof,true);footprint(port.id,"procedural",s);stat.procedural++;
        }
      }
      if(distance(city,origin)<radius)terminal(profile,city,stat);
    }
    for(const mark of PORT_LANDMARKS.filter(m=>m.portId===port.id&&distance(m,origin)<43000))landmark(mark,stat);
  }
  let triangles=0;
  for(const key of Object.keys(batches) as Batch[]){
    if(!batches[key].length){materials[key].dispose();continue;}
    const geometry=mergeGeometries(batches[key]);for(const g of batches[key])g.dispose();if(!geometry)continue;
    geometry.computeBoundingSphere();const object=new THREE.Mesh(geometry,materials[key]);object.castShadow=true;object.receiveShadow=true;object.name=`port-${key}`;result.add(object);triangles+=geometry.attributes.position.count/3;
  }
  result.userData={...result.userData,osmLoaded:!!atlas,buildings,triangles,drawCalls:result.children.length,ports:statistics,footprints,source:"© OpenStreetMap contributors · ODbL; regional procedural infill and approximate landmarks"};
  return result;
}
