import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root=process.cwd(), source=root+'/src/App.tsx', original=readFileSync(source,'utf8');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
const page=await browser.newPage({viewport:{width:1366,height:768}});
async function save(){
 await page.getByTitle('Guardar partida',{exact:true}).click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('deriva.save.v1')));
 const notice=page.getByRole('button',{name:'Cerrar aviso',exact:true}); if(await notice.isVisible()) await notice.click();
 return saved;
}
try{
 await page.goto(process.env.DEV_URL || 'http://localhost:5173');
 await page.getByRole('button',{name:'Spirit of Australia',exact:true}).click();
 await page.getByRole('button',{name:'Comenzar travesía',exact:true}).click();
 const before=await save();
 await page.getByRole('button',{name:'Carta náutica M',exact:true}).click();
 await page.getByRole('button',{name:'Calcular ruta navegable',exact:true}).click();
 await page.getByRole('button',{name:'Fijar rumbo',exact:true}).click();
 const afterRoute=await save();
 writeFileSync(source,original+'\n// Local reload regression probe.\n');
 await page.waitForTimeout(1800);
 const afterRefresh=await save();
 const r={before:before.state.shipId,afterRoute:afterRoute.state.shipId,afterRefresh:afterRefresh.state.shipId,routeBefore:afterRoute.routeTarget,routeAfter:afterRefresh.routeTarget};
 assert.equal(r.before,'spirit'); assert.equal(r.afterRoute,'spirit'); assert.equal(r.afterRefresh,'spirit');
 assert.equal(r.routeBefore,'cassis'); assert.equal(r.routeAfter,'cassis');
 await page.reload(); await page.getByRole('button',{name:/Continuar mi partida/}).click();
 const restored=await save(); assert.equal(restored.state.shipId,'spirit'); assert.equal(restored.routeTarget,'cassis');
 r.restoredShip=restored.state.shipId; r.restoredRoute=restored.routeTarget;
 await page.getByRole('button',{name:/Atracar en Marsella/}).click();
 await page.getByRole('button',{name:'Cambiar barco',exact:true}).click();
 await page.getByRole('button').filter({has:page.getByRole('heading',{name:'Aguja 9',exact:true})}).click();
 await page.getByRole('button',{name:'Cambiar de barco',exact:true}).click();
 await page.getByRole('button',{name:'Soltar amarras',exact:true}).click();
 assert.equal((await save()).state.shipId,'launch');
 await page.getByRole('button',{name:'Carta náutica M',exact:true}).click();
 await page.locator('#destination').selectOption('la-ciotat');
 await page.getByRole('button',{name:'Fijar rumbo',exact:true}).click();
 const fleetRoute=await save(); assert.equal(fleetRoute.state.shipId,'launch');
 writeFileSync(source,original+'\n// Local reload regression probe, fleet change.\n');
 await page.waitForTimeout(1800);
 const fleetRefresh=await save(); assert.equal(fleetRefresh.state.shipId,'launch'); assert.equal(fleetRefresh.routeTarget,'la-ciotat');
 r.fleet={shipBeforeRefresh:fleetRoute.state.shipId,shipAfterRefresh:fleetRefresh.state.shipId,routeAfterRefresh:fleetRefresh.routeTarget};
 mkdirSync(root+'/artifacts/planning',{recursive:true});writeFileSync(root+'/artifacts/planning/selection-after.json',JSON.stringify(r,null,2));console.log(r);
}finally{writeFileSync(source,original);await browser.close();}
