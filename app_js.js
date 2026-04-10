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
  var b=e.target.closest ? e.target.closest('.tab') : (e.target.className.indexOf('tab')>=0?e.target:null);
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

// Eventos base
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

function renderExternos(){
  var el=document.getElementById('ext-list');
  el.innerHTML='';
  externos.forEach(function(e,i){
    var row=document.createElement('div');
    row.className='eg';

    var t=document.createElement('input'); t.type='text'; t.placeholder='Descripción'; t.value=e.nombre;
    t.addEventListener('input',function(){externos[i].nombre=this.value});

    var c1=document.createElement('input'); c1.type='number'; c1.inputMode='numeric'; c1.placeholder='0'; if(e.cobro)c1.value=e.cobro;
    c1.addEventListener('input',function(){externos[i].cobro=parseFloat(this.value)||0;calc()});

    var c2=document.createElement('input'); c2.type='number'; c2.inputMode='numeric'; c2.placeholder='0'; if(e.costo)c2.value=e.costo;
    c2.addEventListener('input',function(){externos[i].costo=parseFloat(this.value)||0;calc()});

    var pill=document.createElement('div'); pill.className='pill '+(e.iva?'c':'n'); pill.textContent=e.iva?'c/IVA':'neto';
    pill.addEventListener('click',function(){
      externos[i].iva=!externos[i].iva;
      pill.className='pill '+(externos[i].iva?'c':'n');
      pill.textContent=externos[i].iva?'c/IVA':'neto';
      calc();
    });

    var del=document.createElement('button'); del.className='del'; del.textContent='✕';
    del.addEventListener('click',function(){externos.splice(i,1);renderExternos();calc()});

    row.appendChild(t); row.appendChild(c1); row.appendChild(c2); row.appendChild(pill); row.appendChild(del);
    el.appendChild(row);
  });
}

function renderPartes(){
  var el=document.getElementById('partes-list');
  el.innerHTML='';
  partes.forEach(function(p,i){
    var row=document.createElement('div');
    row.className='pg';

    var nm=document.createElement('input'); nm.type='text'; nm.placeholder='Descripción'; nm.value=p.nombre;
    nm.addEventListener('input',function(){partes[i].nombre=this.value});

    var qty=document.createElement('input'); qty.type='number'; qty.inputMode='numeric'; qty.value=p.cantidad; qty.min=1; qty.style.textAlign='center';
    qty.addEventListener('input',function(){partes[i].cantidad=parseFloat(this.value)||1;updatePfoot();calc()});

    var costo=document.createElement('input'); costo.type='number'; costo.inputMode='numeric'; costo.value=p.costo;
    var pvEl=document.createElement('input'); pvEl.type='number'; pvEl.inputMode='numeric'; pvEl.value=Math.round(pv(p));
    var mkEl=document.createElement('input'); mkEl.type='number'; mkEl.inputMode='numeric'; mkEl.value=p.markup; mkEl.style.textAlign='center';

    costo.addEventListener('input',function(){
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

    var pill=document.createElement('div'); pill.className='pill '+(p.iva?'c':'n'); pill.textContent=p.iva?'c/IVA':'neto';
    pill.addEventListener('click',function(){
      partes[i].iva=!partes[i].iva;
      pvEl.value=Math.round(pv(partes[i]));
      pill.className='pill '+(partes[i].iva?'c':'n');
      pill.textContent=partes[i].iva?'c/IVA':'neto';
      updatePfoot();calc();
    });

    var del=document.createElement('button'); del.className='del'; del.textContent='✕';
    del.addEventListener('click',function(){partes.splice(i,1);renderPartes();calc()});

    row.appendChild(nm); row.appendChild(qty); row.appendChild(costo);
    row.appendChild(mkEl); row.appendChild(pvEl); row.appendChild(pill); row.appendChild(del);
    el.appendChild(row);
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
  var mc_iva=gc('mdo_cobro_iva'), mk_iva=gc('mdo_costo_iva'), tr_iva=gc('traslado_iva');

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

// Service Worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js');
}
})();
