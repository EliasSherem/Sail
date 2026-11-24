// Shared analytic swell remains identical to the physical wave field. The smaller
// capillary waves are shading only and are anchored to geographic water space.
export const waterVertex = `
  uniform float uTime;
  uniform vec2 uCenter;
  uniform vec2 uDetailOrigin;
  uniform vec4 uWaves[3];
  uniform vec3 uPhase;
  varying vec3 vWorld;
  varying vec2 vWave;
  varying vec2 vDetail;
  varying float vElevation;
  void main() {
    vec3 p=position;
    vec2 wavePos=vec2(p.x,-p.z)+uCenter;
    float elevation=0.0;
    for(int i=0;i<3;i++) {
      vec4 w=uWaves[i];
      float phase=w.y*dot(wavePos,vec2(sin(w.z),cos(w.z)))-w.w*uTime+uPhase[i];
      elevation+=w.x*sin(phase);
    }
    p.y=elevation;
    vec4 world=modelMatrix*vec4(p,1.0);
    vWorld=world.xyz; vWave=wavePos; vDetail=wavePos+uDetailOrigin; vElevation=elevation;
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;

const noise = `
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 noiseD(vec2 p){
   vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f),du=6.0*f*(1.0-f);
   float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.));
   return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
     du*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
 }
 float noise(vec2 p){return noiseD(p).x;}
 float fbm(vec2 p){float f=0.;float a=.55;for(int i=0;i<4;i++){f+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+8.4;a*=.47;}return f;}
`;

export const waterFragment = `
  precision highp float;
  uniform float uTime;
  uniform float uDay;
  uniform float uFog;
  uniform float uRoughness;
  uniform float uCloud;
  uniform sampler2D uEnvironment;uniform float uHasEnvironment;
  uniform vec3 uSun;
  uniform vec3 uSky;
  uniform vec3 uHorizon;
  uniform vec4 uWaves[3];
  uniform vec3 uPhase;
  varying vec3 vWorld;
  varying vec2 vWave;
  varying vec2 vDetail;
  varying float vElevation;
  ${noise}
  void main() {
    vec2 slope=vec2(0.0);
    for(int i=0;i<3;i++) {
      vec4 w=uWaves[i]; vec2 direction=vec2(sin(w.z),cos(w.z));
      float phase=w.y*dot(vWave,direction)-w.w*uTime+uPhase[i];
      slope+=w.x*w.y*cos(phase)*direction;
    }
    float distanceToCamera=distance(cameraPosition,vWorld);
    float detail=1.0-smoothstep(90.0,1000.0,distanceToCamera);
    vec2 p=vDetail+vec2(uTime*.36,-uTime*.16);
    mat2 rotation=mat2(.8,-.6,.6,.8);
    // Four irregular bands create wind streaks, broken ripples and tiny highlights.
    // Their coordinates never follow the vessel or its camera.
    vec3 n0=noiseD(p*vec2(.17,.32));
    vec3 n1=noiseD(rotation*p*vec2(.71,1.12)+n0.x*1.8);
    vec3 n2=noiseD(rotation*rotation*p*2.24+vec2(uTime*.1,0.));
    vec3 n3=noiseD(p*6.4+vec2(-uTime*.28,uTime*.2));
    slope+=(n0.yz*.065+n1.yz*.042+n2.yz*.025+n3.yz*.012)*detail*uRoughness;
    vec3 normal=normalize(vec3(-slope.x,1.0,slope.y));
    vec3 viewDirection=normalize(cameraPosition-vWorld);
    float ndv=max(dot(viewDirection,normal),0.0);
    float fresnel=.025+.975*pow(1.0-ndv,5.0);
    vec3 reflected=reflect(-viewDirection,normal);
    vec3 reflectedSky=mix(uHorizon,uSky,pow(max(reflected.y,0.0),.4));
    if(uHasEnvironment>.5){
      vec2 envUv=vec2(atan(reflected.z,reflected.x)/6.2831853+.5,asin(clamp(reflected.y,-1.,1.))/3.14159265+.5);
      vec3 realSky=vec3(1.)-exp(-texture2D(uEnvironment,envUv).rgb*vec3(.18,.24,.31));
      reflectedSky=mix(reflectedSky,realSky,uDay*.88*(1.-uCloud));
    }
    float skyCloud=fbm(reflected.xz/(max(reflected.y,0.)+.23)*3.0);
    reflectedSky=mix(reflectedSky,vec3(.23,.32,.39),smoothstep(.52,.77,skyCloud)*uDay*.16);
    float patches=noise(vDetail*.006);
    vec3 water=mix(vec3(.006,.028,.05),vec3(.009,.105,.14),uDay);
    water+=vec3(.004,.028,.023)*(patches+n0.x*.35)*uDay;
    vec3 color=mix(water,reflectedSky,fresnel*.78);
    // Broad reflected sun plus many sharper capillary-wave glints.
    vec3 halfDirection=normalize(viewDirection+uSun);
    float highlight=max(dot(normal,halfDirection),0.0);
    color+=vec3(1.0,.86,.62)*(pow(highlight,95.)*.22+pow(highlight,700.)*2.1)*uDay*(1.-uCloud);
    float forwardScatter=pow(max(dot(viewDirection,-uSun),0.),4.)*pow(1.-ndv,2.);
    color+=vec3(.005,.065,.06)*forwardScatter*uDay;
    // Sparse flecks sit on real world positions and provide a readable speed reference.
    float fleck=smoothstep(.82,.92,noise(vDetail*1.24))*smoothstep(.54,.7,n0.x);
    color=mix(color,vec3(.35,.48,.49)*(.15+.85*uDay),fleck*detail*.2);
    float fog=1.0-exp(-pow(distanceToCamera*uFog,1.3));
    color=mix(color,uHorizon,clamp(fog,0.0,.99));
    gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const skyVertex = `
 varying vec3 vPosition;
 void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
export const skyFragment = `
 precision highp float;
 uniform float uCloud;uniform vec3 uTop;uniform vec3 uHorizon;uniform vec3 uSun;uniform float uDay;uniform float uTime;
 uniform sampler2D uEnvironment;uniform float uHasEnvironment;
 varying vec3 vPosition;
 ${noise}
 void main(){
  vec3 direction=normalize(vPosition);float elevation=max(direction.y,0.0);
  vec3 color=mix(uHorizon,uTop,pow(elevation,.38));
  float alignment=max(dot(direction,uSun),0.);
  vec2 p=direction.xz/(elevation+.13)*2.7+vec2(uTime*.0011,0.0);
  float cloud=fbm(p);
  float band=smoothstep(.005,.05,elevation)*(1.0-smoothstep(.55,.9,elevation));
  float veil=smoothstep(.48,.67,cloud)*band;
  float lit=clamp(fbm(p+vec2(.14,.08))*1.8,.0,1.);
  vec3 cloudColor=mix(vec3(.32,.43,.54),vec3(.91,.93,.92),lit);
  cloudColor=mix(cloudColor,uHorizon*.65,uCloud);
  color=mix(color,cloudColor,veil*.87*uDay);
  if(uHasEnvironment>.5){
    vec2 envUv=vec2(atan(direction.z,direction.x)/6.2831853+.5,asin(clamp(direction.y,-1.,1.))/3.14159265+.5);
    vec3 photographed=texture2D(uEnvironment,envUv).rgb;
    // The fixed HDR supplies cloud detail, not a replacement for the moving
    // solar sky. Retain its procedural colour and fade/tint at sunset.
    float twilight=exp(-pow(abs(uSun.y)/.24,2.));
    float photoWeight=smoothstep(-.03,.12,direction.y)*uDay*(1.-uCloud)*.72*(1.-twilight*.82);
    photographed*=mix(vec3(1.),vec3(1.12,.64,.39),twilight);
    color=mix(color,photographed,photoWeight);
  }
  // Composite the live sun after the photograph so it cannot be overwritten.
  float sunVisible=smoothstep(-.04,.02,uSun.y)*(1.-uCloud);
  color+=vec3(1.0,.7,.38)*pow(alignment,18.)*.12*sunVisible;
  color+=vec3(1.0,.83,.6)*pow(alignment,220.)*.35*sunVisible;
  color+=vec3(6.0,5.1,3.8)*smoothstep(.9997,.99992,alignment)*sunVisible;
  // Sparse stars and a soft moon remain visible through clear night skies.
  vec2 starGrid=direction.xz/(elevation+.25)*160.;
  float starSeed=hash(floor(starGrid));
  float star=step(.996,starSeed)*(1.-smoothstep(.025,.15,length(fract(starGrid)-.5)));
  vec3 moonDirection=normalize(vec3(-.52,.42,-.72));
  float moonDot=max(dot(direction,moonDirection),0.);
  float moon=smoothstep(.9991,.99965,moonDot)+pow(moonDot,90.)*.065;
  color+=(vec3(.68,.79,1.)*star*.8+vec3(.7,.79,.95)*moon)*(1.-uDay)*(1.-uCloud)*smoothstep(.0,.12,elevation);
  gl_FragColor=vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;

export const wakeVertex = `
 uniform float uTime;uniform vec2 uOrigin;uniform vec4 uWaves[3];uniform vec3 uPhase;
 attribute float aAge; attribute float aEnergy;
 varying vec2 vUv;varying vec2 vWater;varying float vAge;varying float vEnergy;varying float vCrest;
 void main(){
  vUv=uv;vAge=aAge;vEnergy=aEnergy;
  vec4 world=modelMatrix*vec4(position,1.0);vec2 p=vec2(world.x,-world.z);vWater=p+uOrigin;
  float elevation=0.0;
  for(int i=0;i<3;i++){vec4 w=uWaves[i];elevation+=w.x*sin(w.y*dot(p,vec2(sin(w.z),cos(w.z)))-w.w*uTime+uPhase[i]);}
  float x=abs(uv.x*2.-1.);
  float fresh=exp(-max(aAge,0.)*4.0)*clamp(aEnergy,0.,1.);
  float ridge=(x-.65)*7.;float shoulder=exp(-ridge*ridge);
  float ripple=.5+.5*sin(uv.y*2.1-uTime*1.6);
  vCrest=fresh*(shoulder*.095+(1.-x*x)*ripple*.025);
  // A shallow, decaying ridge follows the same analytic swell as the ocean.
  // It is visual displacement only, with a small separation to avoid z-fighting.
  world.y=elevation+.032+vCrest;gl_Position=projectionMatrix*viewMatrix*world;
 }
`;

// Foam uses warped fine cells and contour filaments, instead of large opaque
// value-noise islands. Coordinates are geographic water positions, so a turn or
// origin rebase does not drag the foam texture along with the hull.
const foam = `
 // Keep hash phases small: large geographic cell IDs otherwise quantize into
 // a visible woven grid on float32 GPUs. Different prime periods avoid a square tile.
 float foamHash(vec2 p){
   p=mod(p,vec2(251.,263.));
   return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
 }
 float foamNoise(vec2 p){
   vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
   return mix(mix(foamHash(i),foamHash(i+vec2(1.,0.)),f.x),
              mix(foamHash(i+vec2(0.,1.)),foamHash(i+1.),f.x),f.y);
 }
 float foamField(vec2 p){
   mat2 r=mat2(.8,-.6,.6,.8);
   vec2 q=r*p;
   vec2 warp=vec2(foamNoise(q*.39),foamNoise(q*.39+vec2(9.2,4.7)))-.5;
   q+=warp*1.7;
   return foamNoise(q)*.55+foamNoise(r*q*2.17+5.8)*.30+foamNoise(r*r*q*4.83-3.1)*.15;
 }
 // Distance to jittered bubble centres. Two nearest cells produce foam rims
 // and intervening thin water channels; fwidth removes subpixel sparkle.
 vec2 foamCells(vec2 p){
   vec2 cell=floor(p),f=fract(p);float nearest=8.,second=8.;
   for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
     vec2 o=vec2(float(x),float(y));
     vec2 id=cell+o;
     vec2 centre=o+vec2(foamHash(id),foamHash(id+vec2(17.7,51.2)))-f;
     float d=dot(centre,centre);
     second=min(second,max(nearest,d));nearest=min(nearest,d);
   }
   float rim=sqrt(second)-sqrt(nearest);
   float aa=max(fwidth(rim)*1.1,.025);
   float walls=1.-smoothstep(.045-aa,.10+aa,rim);
   float small=1.-smoothstep(.12,.39,sqrt(nearest));
   return vec2(walls,small);
 }
`;

export const wakeFragment = `
 precision highp float;uniform float uTime;uniform float uDay;
 varying vec2 vUv;varying vec2 vWater;varying float vAge;varying float vEnergy;varying float vCrest;
 ${noise}
 ${foam}
 void main(){
  float age=clamp(vAge,0.,1.);float x=abs(vUv.x*2.-1.);
  vec2 drift=vec2(uTime*.035,-uTime*.018);
  float field=foamField(vWater*3.0+drift);
  float filament=1.-smoothstep(.025,.16,abs(field-.5));
  float flow=foamNoise(vWater*.85+drift);
  vec2 bubbles=foamCells(mat2(.8,-.6,.6,.8)*vWater*9.3+vec2(field*1.6,flow*1.4));
  float bend=(flow-.5)*.085+sin(vUv.y*.93)*.026;
  float innerRidge=(x-(.65+bend))*23.;float outerRidge=(x-(.84+bend*.55))*33.;
  float shoulder=exp(-innerRidge*innerRidge);float outer=exp(-outerRidge*outerRidge);
  float broken=smoothstep(.35,.65,flow*.65+field*.35);
  float centre=exp(-x*x*5.5);
  float churn=centre*(.11+filament*.38+bubbles.x*.24+bubbles.y*.14);
  float crests=(shoulder*.43+outer*.10*smoothstep(.4,.67,field))*broken;
  float fade=exp(-age*3.2)*(1.-smoothstep(.64,1.,age));
  // Old foam fragments into narrow filaments and tiny bubbles as it disperses.
  float erosion=mix(1.,smoothstep(.27,.62,field+bubbles.x*.2),age*.82);
  float edge=1.-smoothstep(.87,1.,x);
  float alpha=clamp((churn+crests)*fade*erosion*vEnergy*edge,0.,.86);
  vec3 daylight=mix(vec3(.50,.72,.74),vec3(.92,.97,.94),clamp(filament*.4+bubbles.x*.36+vCrest*3.,0.,1.));
  vec3 color=mix(vec3(.10,.18,.22),daylight,uDay);
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;

export const washVertex = `
 uniform float uTime;uniform vec2 uOrigin;uniform vec4 uWaves[3];uniform vec3 uPhase;
 uniform float uPower;uniform float uKind;
 varying vec2 vUv;varying vec2 vWater;
 void main(){
  vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vec2 p=vec2(world.x,-world.z);vWater=p+uOrigin;
  float elevation=0.;
  for(int i=0;i<3;i++){vec4 w=uWaves[i];elevation+=w.x*sin(w.y*dot(p,vec2(sin(w.z),cos(w.z)))-w.w*uTime+uPhase[i]);}
  vec2 q=uv*2.-1.;float edge=(1.-q.x*q.x)*(1.-q.y*q.y);
  float bowRidge=(abs(q.x)-.55)*6.;
  float crest=mix(exp(-q.x*q.x*4.),exp(-bowRidge*bowRidge),uKind);
  float churn=.5+.5*sin(uv.y*11.-uTime*4.+sin(uv.x*8.));
  world.y=elevation+.038+clamp(uPower,0.,1.)*edge*(crest*.09+churn*.035);
  gl_Position=projectionMatrix*viewMatrix*world;
 }
`;
export const washFragment = `
 precision highp float;uniform float uTime;uniform float uDay;uniform float uPower;uniform float uKind;
 varying vec2 vUv;varying vec2 vWater;
 ${noise}
 ${foam}
 void main(){
  vec2 p=vUv*2.-1.;
  float field=foamField(vWater*4.6+vec2(-uTime*.32,uTime*.18));
  vec2 bubbles=foamCells(mat2(.8,-.6,.6,.8)*vWater*11.2+vec2(field*1.5,-field));
  float filaments=1.-smoothstep(.035,.17,abs(field-.51));
  float width=.29+.34*(1.-vUv.y)+(field-.5)*.1;
  float along=1.-smoothstep(.45,.99,abs(p.y));
  float edge=1.-smoothstep(.68,.99,abs(p.x));
  float stern=exp(-p.x*p.x/max(.06,width*width))*along;
  float bowCentre=.23+.45*(1.-vUv.y)+(field-.5)*.065;
  float bowRidge=(abs(p.x)-bowCentre)*16.;float bow=exp(-bowRidge*bowRidge)*along;
  float shape=mix(stern,bow,uKind);
  float lace=.16+filaments*.40+bubbles.x*.23+bubbles.y*.17;
  float streak=.6+.4*field;
  float alpha=clamp(shape*lace*streak*edge*clamp(uPower,0.,1.),0.,.88);
  vec3 daylight=mix(vec3(.57,.76,.77),vec3(.96,.99,.96),clamp(filaments*.45+bubbles.x*.5,0.,1.));
  gl_FragColor=vec4(mix(vec3(.13,.22,.25),daylight,uDay),alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;
