#!/usr/bin/env python3
"""Build an offline 81×81 signed-metre DEM for every game port (700 m spacing).
Source: AWS Terrain Tiles, Mapzen/Terrarium zoom 9. No Python dependencies.
Uses curl for TLS and a minimal standards-based RGB PNG decoder, never alters source tiles.
"""
import base64, concurrent.futures, json, math, pathlib, struct, subprocess, zlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=pathlib.Path('/tmp/deriva-terrain-tiles'); CACHE.mkdir(exist_ok=True)
ZOOM=9; N=81; STEP=700; METERS=111195.08
ports=json.loads(subprocess.check_output(['npx','tsx','-e',"import {PORTS} from './src/data/ports'; console.log(JSON.stringify(PORTS))"],cwd=ROOT,text=True))
def pixel(lat,lon):
    return ((lon+180)/360*2**ZOOM*256, (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**ZOOM*256)
def bounds(p):
    dy=STEP/METERS; dx=dy/math.cos(math.radians(p['lat']))
    return p['lat']-40*dy,p['lon']-40*dx,dy,dx
keys=set()
for p in ports:
    lat,lon,dy,dx=bounds(p)
    for yy in [lat,lat+dy*80]:
        for xx in [lon,lon+dx*80]:
            px,py=pixel(yy,xx)
    a,b=pixel(lat,lon); c,d=pixel(lat+dy*80,lon+dx*80)
    for x in range(int(a)//256,(int(c)+1)//256+1):
        for y in range(int(d)//256,(int(b)+1)//256+1): keys.add((x,y))
def download(key):
    x,y=key; target=CACHE/f'{ZOOM}-{x}-{y}.png'
    if not target.exists():
        subprocess.run(['curl','-fsSL','--retry','3','--max-time','60',f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png','-o',str(target)],check=True,stdout=subprocess.DEVNULL)
    return key,target
print(f'Downloading/verifying {len(keys)} source tiles for {len(ports)} ports',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: files=dict(pool.map(download,sorted(keys)))
def decode(path):
    content=path.read_bytes(); assert content[:8]==b'\x89PNG\r\n\x1a\n'
    pos=8; stream=b''
    while pos<len(content):
        length=struct.unpack('>I',content[pos:pos+4])[0]; kind=content[pos+4:pos+8]; data=content[pos+8:pos+8+length]; pos+=length+12
        if kind==b'IHDR':
            w,h,bits,color,_,_,interlace=struct.unpack('>IIBBBBB',data); assert bits==8 and color in (2,6) and interlace==0
        elif kind==b'IDAT': stream+=data
    bpp=3 if color==2 else 4; stride=w*bpp; raw=zlib.decompress(stream); result=bytearray(h*stride); source=0
    for row in range(h):
        mode=raw[source]; source+=1; line=bytearray(raw[source:source+stride]); source+=stride
        previous=result[(row-1)*stride:row*stride] if row else bytearray(stride)
        for i in range(stride):
            a=line[i-bpp] if i>=bpp else 0; b=previous[i]; c=previous[i-bpp] if i>=bpp else 0
            if mode==1: value=a
            elif mode==2: value=b
            elif mode==3: value=(a+b)//2
            elif mode==4:
                p=a+b-c; pa,pb,pc=abs(p-a),abs(p-b),abs(p-c); value=a if pa<=pb and pa<=pc else b if pb<=pc else c
            else: assert mode==0; value=0
            line[i]=(line[i]+value)&255
        result[row*stride:(row+1)*stride]=line
    return w,h,bpp,result
images={k:decode(p) for k,p in files.items()}
def elevation(x,y):
    tx,ty=int(x)//256,int(y)//256; w,h,bpp,data=images[tx,ty]; i=((int(y)%256)*w+(int(x)%256))*bpp
    return data[i]*256+data[i+1]+data[i+2]/256-32768
def sample(lat,lon):
    px,py=pixel(lat,lon); x,y=math.floor(px),math.floor(py); fx,fy=px-x,py-y
    a=elevation(x,y)*(1-fx)+elevation(x+1,y)*fx; b=elevation(x,y+1)*(1-fx)+elevation(x+1,y+1)*fx
    return round(a*(1-fy)+b*fy)
patches=[]; audit=[]
for p in ports:
    lat,lon,dy,dx=bounds(p); values=[sample(lat+j*dy,lon+i*dx) for j in range(N) for i in range(N)]
    heights=struct.pack('<'+'h'*len(values),*values)
    patches.append(dict(id=p['id'],latMin=lat,lonMin=lon,latStep=dy,lonStep=dx,data=base64.b64encode(heights).decode()))
    audit.append(dict(id=p['id'],min=min(values),max=max(values),landSamples=sum(v>0 for v in values)))
output=dict(version=1,size=N,spacingMeters=STEP,sourceZoom=ZOOM,encoding='int16-le-base64',source='https://registry.opendata.aws/terrain-tiles/',patches=patches)
path=ROOT/'public/data/port-elevations.json'; path.write_text(json.dumps(output,separators=(',',':'))+'\n')
(ROOT/'docs/elevation-audit.json').write_text(json.dumps(dict(sourceTiles=len(files),bytes=path.stat().st_size,ports=audit),indent=2)+'\n')
print(f'Wrote {path.stat().st_size:,} bytes, {len(patches)} patches',flush=True)
