(function(){
var IVA=0.19;
var PRESETS={
  mantencion:{label:'Mantención',mdo_cobro:60000,mdo_costo:25000,traslado:8000,partes:[
    {nombre:'Aceite motor',costo:18000,cantidad:1,markup:30,iva:false},
    {nombre:'Filtro aceite',costo:4500,cantidad:1,markup:50,iva:false},
    {nombre:'Filtro aire',costo:6000,cantidad:1,markup:50,iva:false}]},
  frenos:{label:'Frenos',mdo_cobro:80000,mdo_costo:35000,traslado:8000,partes:[
    {nombre:'Pastillas del. par',costo:28000,cantidad:1,markup:30,iva:false},
    {nombre:'Pastillas tras. par',costo:22000,cantidad:1,markup:30,iva:false},
    {nombre:'Líquido de frenos',costo:5000,cantidad:1,markup:30,iva:false}]},
  suspension:{label:'Suspensión',mdo_cobro:90000,mdo_costo:40000,traslado:8000,partes:[
    {nombre:'Amortiguadores del. (par)',costo:90000,cantidad:1,markup:30,iva:false},
    {nombre:'Neumáticos',costo:30000,cantidad:4,markup:30,iva:false}]},
  custom:{label:'Personalizado',mdo_cobro:60000,mdo_costo:25000,traslado:8000,partes:[]}
};

var partes=[], externos=[];

function fmt(n){return '$'+Math.round(n).toLocaleString('es-CL')}
function gv(id){return parseFloat(document.getElementById(id).value)||0}
function gc(id){return document.getElementById(id).checked}
function neto(v,conIva){return conIva?v/(1+IVA):v}
function cpNeto(p){return p.iva?p.costo/(1+IVA):p.costo}
function pv(p){return cpNeto(p)*(1+p.markup/100)}

// Tabs
var tabsEl=document.getElementById('tabs');
Object.keys(PRESETS).forEach(function(k){
  var b=document.createElement('button');
  b.className='tab'+(k==='mantencion'?' on':'');
  b.textContent=PRESETS[k].label;
  b.setAttribute('data-key',k);
  tabsEl.appendChild(b);
});
tabsEl.addEventListener('click',function(e){
  var b=e.target.closest?e.target.closest('.tab'):(e.target.className.indexOf('tab')>=0?e.target:null);
  if(!b)return;
  setTab(b.getAttribute('data-key'));
});

function setTab(k){
  var btns=tabsEl.querySelectorAll('.tab');
  for(var i=0;i<btns.length;i++){btns[i].className='tab'+(btns[i].getAttribute('data-key')===k?' on':'')}
  var p=PRESETS[k];
  document.getElementById('mdo_cobro').value=p.mdo_cobro;
  document.getElementById('mdo_costo').value=p.mdo_costo;
  document.getElementById('traslado').value=p.traslado;
  ['mdo_cobro_iva','mdo_costo_iva','traslado_iva'].forEach(function(id){document.getElementById(id).checked=false});
  partes=p.partes.map(function(x){return{nombre:x.nombre,costo:x.costo,cantidad:x.cantidad,markup:x.markup,iva:x.iva}});
  externos=[];
  renderPartes(); renderExternos(); calc();
}

['mdo_cobro','mdo_costo','traslado'].forEach(function(id){
  document.getElementById(id).addEventListener('input',calc);
});
['mdo_cobro_iva','mdo_costo_iva','traslado_iva'].forEach(function(id){
  document.getElementById(id).addEventListener('change',calc);
});
document.getElementById('btn-add-ext').addEventListener('click',function(){
  externos.push({nombre:'',cobro:0,costo:0,iva:false});renderExternos();
});
document.getElementById('btn-add-parte').addEventListener('click',function(){
  partes.push({nombre:'',costo:0,cantidad:1,markup:30,iva:false});renderPartes();
});

// helper: labeled input
function lInput(labelTxt, inp){
  var wrap=document.createElement('div');
  wrap.style.cssText='display:flex;flex-direction:column;gap:3px;flex:1;min-width:0';
  var lbl=document.createElement('span');
  lbl.textContent=labelTxt;
  lbl.style.cssText='font-size:10px;color:var(--faint);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase';
  wrap.appendChild(lbl);
  wrap.appendChild(inp);
  return wrap;
}

function makeInput(type, val, opts){
  var inp=document.createElement('input');
  inp.type=type;
  if(type==='number')inp.inputMode='numeric';
  if(val!==undefined&&val!=='')inp.value=val;
  inp.style.cssText='width:100%;font-family:var(--mono);font-size:14px;padding:9px 8px;border:1px solid var(--border);border-radius:3px;background:var(--bg);color:var(--text);-webkit-appearance:none;outline:none;min-width:0';
  if(opts&&opts.center)inp.style.textAlign='center';
  if(opts&&opts.placeholder)inp.placeholder=opts.placeholder;
  return inp;
}

function makePill(iva){
  var pill=document.createElement('div');
  pill.style.cssText='font-family:var(--mono);font-size:11px;padding:9px 8px;border-radius:3px;text-align:center;cursor:pointer;border:1px solid var(--border);user-select:none;-webkit-user-select:none;white-space:nowrap';
  setPillStyle(pill,iva);
  return pill;
}
function setPillStyle(pill,iva){
  if(iva){pill.style.background='var(--amber-bg)';pill.style.color='var(--amber-t)';pill.style.borderColor='#d4b96a';pill.textContent='con IVA'}
  else{pill.style.background='var(--bg)';pill.style.color='var(--faint)';pill.style.borderColor='var(--border)';pill.textContent='neto'}
}

function renderExternos(){
  var el=document.getElementById('ext-list');
  el.innerHTML='';
  externos.forEach(function(e,i){
    var card=document.createElement('div');
    card.style.cssText='background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:10px;margin-bottom:8px';

    // nombre + delete
    var top=document.createElement('div');
    top.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:8px';
    var nm=makeInput('text',e.nombre,{placeholder:'Descripción'});
    nm.style.fontFamily='var(--sans)';
    nm.addEventListener('input',function(){externos[i].nombre=this.value});
    var del=document.createElement('button');
    del.textContent='✕';
    del.style.cssText='padding:9px 10px;border:1px solid var(--border);border-radius:3px;background:transparent;color:var(--faint);cursor:pointer;font-size:13px;flex-shrink:0;-webkit-appearance:none';
    del.addEventListener('click',function(){externos.splice(i,1);renderExternos();calc()});
    top.appendChild(nm); top.appendChild(del);

    // cobro + costo + iva
    var bot=document.createElement('div');
    bot.style.cssText='display:flex;gap:6px;align-items:flex-end';

    var c1=makeInput('number',e.cobro||'',{placeholder:'0'});
    c1.addEventListener('input',function(){externos[i].cobro=parseFloat(this.value)||0;calc()});

    var c2=makeInput('number',e.costo||'',{placeholder:'0'});
    c2.addEventListener('input',function(){externos[i].costo=parseFloat(this.value)||0;calc()});

    var pill=makePill(e.iva);
    pill.style.flexShrink='0';
    pill.addEventListener('click',function(){
      externos[i].iva=!externos[i].iva;
      setPillStyle(pill,externos[i].iva);
      calc();
    });

    bot.appendChild(lInput('Cobro cliente',c1));
    bot.appendChild(lInput('Costo para mí',c2));
    bot.appendChild(pill);

    card.appendChild(top); card.appendChild(bot);
    el.appendChild(card);
  });
}

function renderPartes(){
  var el=document.getElementById('partes-list');
  el.innerHTML='';
  partes.forEach(function(p,i){
    var card=document.createElement('div');
    card.style.cssText='background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:10px;margin-bottom:8px';

    // nombre + delete
    var top=document.createElement('div');
    top.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:8px';
    var nm=makeInput('text',p.nombre,{placeholder:'Descripción'});
    nm.style.fontFamily='var(--sans)';
    nm.addEventListener('input',function(){partes[i].nombre=this.value});
    var del=document.createElement('button');
    del.textContent='✕';
    del.style.cssText='padding:9px 10px;border:1px solid var(--border);border-radius:3px;background:transparent;color:var(--faint);cursor:pointer;font-size:13px;flex-shrink:0;-webkit-appearance:none';
    del.addEventListener('click',function(){partes.splice(i,1);renderPartes();calc()});
    top.appendChild(nm); top.appendChild(del);

    // row 1: cantidad + costo + markup
    var r1=document.createElement('div');
    r1.style.cssText='display:flex;gap:6px;margin-bottom:8px';

    var qty=makeInput('number',p.cantidad,{center:true});
    var costoInp=makeInput('number',p.costo);
    var pvEl=makeInput('number',Math.round(pv(p)));
    var mkEl=makeInput('number',p.markup,{center:true});

    qty.addEventListener('input',function(){partes[i].cantidad=parseFloat(this.value)||1;updatePfoot();calc()});
    costoInp.addEventListener('input',function(){
      partes[i].costo=parseFloat(this.value)||0;
      pvEl.value=Math.round(pv(partes[i]));
      updatePfoot();calc();
    });
    mkEl.addEventListener('input',function(){
      partes[i].markup=parseFloat(this.value)||0;
      pvEl.value=Math.round(pv(partes[i]));
      updatePfoot();calc();
    });
    pvEl.addEventListener('input',function(){
      var cn=cpNeto(partes[i]);
      if(cn>0){partes[i].markup=((parseFloat(this.value)||0)/cn-1)*100;mkEl.value=partes[i].markup.toFixed(1)}
      updatePfoot();calc();
    });

    r1.appendChild(lInput('Cant.',qty));
    r1.appendChild(lInput('Costo unit.',costoInp));
    r1.appendChild(lInput('Markup %',mkEl));

    // row 2: p.venta + iva pill
    var r2=document.createElement('div');
    r2.style.cssText='display:flex;gap:6px;align-items:flex-end';

    var pill=makePill(p.iva);
    pill.style.flexShrink='0';
    pill.addEventListener('click',function(){
      partes[i].iva=!partes[i].iva;
      pvEl.value=Math.round(pv(partes[i]));
      setPillStyle(pill,partes[i].iva);
      updatePfoot();calc();
    });

    r2.appendChild(lInput('P. venta unit.',pvEl));
    r2.appendChild(pill);

    card.appendChild(top); card.appendChild(r1); card.appendChild(r2);
    el.appendChild(card);
  });
  updatePfoot();
}

function updatePfoot(){
  var ct=0,co=0;
  partes.forEach(function(p){ct+=cpNeto(p)*p.cantidad;co+=pv(p)*p.cantidad});
  var el=document.getElementById('pfoot');
  el.innerHTML=partes.length?'<div>Costo neto: <b>'+fmt(ct)+'</b></div><div>Cobro total: <b>'+fmt(co)+'</b></div>':'';
}

function calc(){
  var mc=neto(gv('mdo_cobro'),gc('mdo_cobro_iva'));
  var mk=neto(gv('mdo_costo'),gc('mdo_costo_iva'));
  var tr=neto(gv('traslado'),gc('traslado_iva'));
  var mc_iva=gc('mdo_cobro_iva'),mk_iva=gc('mdo_costo_iva'),tr_iva=gc('traslado_iva');

  var ce=0,ie=0;
  externos.forEach(function(e){ce+=e.iva?e.costo/(1+IVA):e.costo;ie+=e.cobro});

  var cp=0,ip=0;
  partes.forEach(function(p){cp+=cpNeto(p)*p.cantidad;ip+=pv(p)*p.cantidad});

  var iT=mc+tr+ie+ip;
  var cT=mk+tr+ce+cp;
  var util=iT-cT;
  var mg=iT>0?(util/iT*100):0;
  var conIva=iT*(1+IVA);
  var cls=mg>=40?'g':mg>=20?'':mg>=0?'w':'b';

  var hasIva=mc_iva||mk_iva||tr_iva||partes.some(function(p){return p.iva})||externos.some(function(e){return e.iva});
  document.getElementById('iva-note').textContent=hasIva?'— valores en neto (sin IVA)':'';

  var mEl=document.getElementById('metrics');
  mEl.innerHTML='';
  [{l:'Utilidad neta',v:fmt(util)},{l:'Margen',v:mg.toFixed(1)+'%'},{l:'Ingreso total neto',v:fmt(iT)}].forEach(function(x,idx){
    var d=document.createElement('div');
    d.className='met'+(idx<2?' '+cls:'');
    d.innerHTML='<div class="ml">'+x.l+'</div><div class="mv">'+x.v+'</div>';
    mEl.appendChild(d);
  });

  var bd=document.getElementById('breakdown');
  var rows=[
    {lb:'M. de obra cobrada'+(mc_iva?'<span class="ibadge">IVA→neto</span>':''),v:fmt(mc),cls:'vp'},
    {lb:'Traslado cobrado'+(tr_iva?'<span class="ibadge">IVA→neto</span>':''),v:fmt(tr),cls:'vp'}
  ];
  externos.forEach(function(e){rows.push({lb:e.nombre||'Serv. externo',v:fmt(e.cobro),cls:'vp'})});
  rows.push({lb:'Partes cobradas al cliente',v:fmt(ip),cls:'vp'});
  rows.push({lb:'Ingreso total neto',v:fmt(iT),cls:'vp',st:true});
  rows.push({lb:'Costo M. de obra'+(mk_iva?'<span class="ibadge">IVA→neto</span>':''),v:'−'+fmt(mk),cls:'vn'});
  rows.push({lb:'Traslado / combustible',v:'−'+fmt(tr),cls:'vn'});
  externos.forEach(function(e){rows.push({lb:'Costo: '+(e.nombre||'Serv. externo')+(e.iva?'<span class="ibadge">IVA→neto</span>':''),v:'−'+fmt(e.iva?e.costo/(1+IVA):e.costo),cls:'vn'})});
  rows.push({lb:'Costo partes (neto)',v:'−'+fmt(cp),cls:'vn'});
  rows.push({lb:'Utilidad neta',v:(util>=0?'':'-')+fmt(Math.abs(util)),cls:util>=0?'vp':'vn',st:true});

  bd.innerHTML='';
  rows.forEach(function(r){
    var d=document.createElement('div');
    d.className='br'+(r.st?' st':'');
    d.innerHTML='<span class="lb">'+r.lb+'</span><span class="'+r.cls+'">'+r.v+'</span>';
    bd.appendChild(d);
  });
  var tot=document.createElement('div');
  tot.className='br tot';
  tot.innerHTML='<span class="lb">Precio final al cliente</span><div style="text-align:right"><div class="mv">'+fmt(iT)+'</div><div class="sv">'+fmt(conIva)+' c/IVA</div></div>';
  bd.appendChild(tot);
}

setTab('mantencion');

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js');
}
})();
