(() => {
  const STORAGE_KEY = 'master-suite-panel-v1';
  const $ = (s, root=document) => root.querySelector(s);
  const uid = () => 'w' + Math.random().toString(36).slice(2, 9);
  const defaultRooms = [
    {name:'LIVING ROOM',x:3,y:8,w:29,h:34},
    {name:'DINING ROOM',x:3,y:65,w:25,h:24},
    {name:'KITCHEN',x:31,y:65,w:22,h:24},
    {name:'ENTRY',x:34,y:43,w:28,h:18},
    {name:'MASTER SUITE',x:64,y:8,w:31,h:35},
    {name:'BATHROOM',x:78,y:47,w:17,h:20},
    {name:'UTILITY',x:63,y:72,w:32,h:18},
    {name:'PORCH',x:31,y:83,w:26,h:11}
  ];
  const makePage = (name, variant=0) => {
    const headings=['MASTER SUITE','WEEKEND MODE','SPECIAL PROTOCOL 01','SPECIAL PROTOCOL 02'];
    const clocks=[['THURSDAY','29 MAY 2122  /  21:06'],['FRIDAY','30 MAY 2122  /  08:15'],['ALERT ACTIVE','30 MAY 2122  /  23:48'],['OVERRIDE','31 MAY 2122  /  02:10']];
    const temperatures=[
      [['74C','67H','6:30\nAM'],['77C','67H','9:00\nAM'],['77C','68H','4:00\nPM'],['77C','68H','8:30\nPM'],['74C','64H','11:15\nPM'],['****','****','**:**\n**']],
      [['72C','66H','7:00\nAM'],['75C','67H','10:00\nAM'],['76C','68H','3:30\nPM'],['74C','67H','7:45\nPM'],['72C','64H','11:30\nPM'],['****','****','**:**\n**']],
      [['68C','65H','00:00'],['68C','65H','04:00'],['70C','65H','08:00'],['70C','65H','12:00'],['68C','64H','18:00'],['LOCK','LOCK','ACTIVE']],
      [['60C','60H','00:00'],['60C','60H','04:00'],['62C','60H','08:00'],['62C','60H','12:00'],['60C','60H','18:00'],['LOCK','LOCK','ACTIVE']]
    ];
    return ({
    name,
    widgets: [
      {id:uid(),type:'heading',x:27,y:2,w:43,h:10,title:headings[variant]||'MASTER SUITE',body:'CENTRAL ENVIRONMENT CONTROL // MAIN TERMINAL'},
      {id:uid(),type:'clock',x:74,y:2,w:22,h:8,title:clocks[variant][0],body:clocks[variant][1]},
      {id:uid(),type:'label',x:3,y:21,w:30,h:7,title:'TEMP. SCHEDULES',body:'DAILY PERIODS  /  DESIRED TEMPERATURE'},
      {id:uid(),type:'schedule',x:3,y:29,w:94,h:24,title:'',body:'DESIRED TEMPERATURE  /  DESIRED START TIME',cells:temperatures[variant].map((c,i)=>({period:String.fromCharCode(65+i),temp:c[0]+'\n'+c[1],time:c[2]}))},
      {id:uid(),type:'map',x:3,y:56,w:61,h:38,title:variant===0?'MAIN LEVEL':variant===1?'CREW QUARTERS':variant===2?'RESTRICTED AREA':'EMERGENCY ROUTE',body:'',rooms:JSON.parse(JSON.stringify(defaultRooms))},
      {id:uid(),type:'info',x:67,y:57,w:29,h:16,title:variant===2?'SECURITY STATUS':'MASTER SUITE',body:variant===2?'ALERT LEVEL 02\nACCESS RESTRICTED':variant===3?'OVERRIDE ACTIVE\nLIFE SUPPORT: ON':'IS 69°\n77C / 67H'},
      {id:uid(),type:'actions',x:67,y:75,w:29,h:17,title:'CONTROL MENU',items:['SET UP SCHEDULE','SET UP OVERRIDE','COPY SCHEDULES']},
      {id:uid(),type:'footer',x:3,y:95,w:94,h:4,title:'',body:variant>=2?'WARNING: RESTRICTED SYSTEM SETTINGS  //  AUTHORIZATION REQUIRED':'THIS ZONE IS USING THE SCHEDULED SETTINGS  //  SYSTEM ONLINE'}
    ]
  });
  };
  const defaultBoot = { brand:'WEYLAND-YUTANI // SYSTEMS', lines:['BIOS CHECK ................. OK','MEMORY TEST ................ 640K BASE / EXTENDED OK','WEYLAND-YUTANI NETWORK ..... CONNECTED','LOADING ENVIRONMENT CONTROL MODULES...','  [OK] LIFE SUPPORT INTERFACE','  [OK] HABITAT MAP DATABASE','  [OK] CREW / ACCESS REGISTRY','  [OK] SECURITY PROTOCOLS','RESTORING LOCAL SESSION ...... COMPLETE','AUTHORIZATION: MASTER ACCESS GRANTED','','STARTING MASTER CONTROL INTERFACE...'] };
  const defaults = {
    active:0, boot:structuredClone(defaultBoot),
    pages:[makePage('WEEKDAY'), makePage('WEEKEND',1), makePage('SPECIAL 1',2), makePage('SPECIAL 2',3)]
  };
  let state = loadState();
  let selectedId = null;
  let editMode = false;
  let moveMode = false;
  let playerMode = false;
  let drag = null;
  let mapDrag = null;
  let mapEditMode = false;
  let selectedMapItemId = null;
  let confirmCallback = null;
  let toastTimer = null;

  function normalizeState(value){
    if(!value || !Array.isArray(value.pages) || !value.pages.length) return structuredClone(defaults);
    value.active=Number.isInteger(value.active)?value.active:0;
    value.pages.forEach(page=>{
      page.widgets=Array.isArray(page.widgets)?page.widgets:[];
      page.widgets.forEach(w=>{
        if(w.type==='actions') w.items=(w.items||[]).map(item=>typeof item==='string'?({text:item,active:false,action:'none',message:'',targetPage:0}):({text:item.text||'COMMAND',active:!!item.active,action:item.action||'none',message:item.message||'',targetPage:Number(item.targetPage)||0,targetMapWidget:item.targetMapWidget||'',targetMapItem:item.targetMapItem||''}));
        if(w.type==='checklist') w.items=(w.items||[]).map(item=>typeof item==='string'?({text:item,done:false}):({text:item.text||'NEW OBJECTIVE',done:!!item.done}));
        if(w.type==='log') w.entries=Array.isArray(w.entries)?w.entries:[];
        if(w.type==='status') w.rows=(w.rows||[]).map(row=>({label:row.label||'SYSTEM',value:row.value||'ONLINE',active:!!row.active}));
        if(w.type==='schedule') w.cells=Array.isArray(w.cells)&&w.cells.length?w.cells.map((c,i)=>({period:String(c.period??String.fromCharCode(65+i)),temp:String(c.temp??''),time:String(c.time??'')})):[{period:'A',temp:'--C\n--H',time:'00:00'}];
        if(w.type==='table') {
          w.columns=Array.isArray(w.columns)&&w.columns.length?w.columns:['FIELD','VALUE'];
          w.rows=Array.isArray(w.rows)?w.rows:[];
          w.rows=w.rows.map(row=>{const cells=Array.isArray(row)?row.slice():[]; while(cells.length<w.columns.length) cells.push(''); return cells.slice(0,w.columns.length).map(v=>String(v??''));});
        }
        if(w.type==='map') {
          if(!Array.isArray(w.mapItems)) {
            const legacy=Array.isArray(w.rooms)?w.rooms:defaultRooms;
            w.mapItems=legacy.map(r=>({id:uid(),type:'rect',x:Number(r.x)||0,y:Number(r.y)||0,w:Number(r.w)||20,h:Number(r.h)||15,text:String(r.name||'ROOM'),angle:0}));
          }
          w.mapItems=w.mapItems.map(item=>({id:item.id||uid(),type:['rect','line','text'].includes(item.type)?item.type:'rect',x:Number(item.x)||0,y:Number(item.y)||0,w:Number(item.w)||20,h:Number(item.h)||10,text:String(item.text??item.name??''),angle:Number(item.angle)||0,lit:!!item.lit}));
          delete w.rooms;
        }
      });
    });
    value.active=Math.max(0,Math.min(value.active,value.pages.length-1));
    value.boot={...structuredClone(defaultBoot),...(value.boot||{})};
    value.boot.brand=String(value.boot.brand||defaultBoot.brand);
    value.boot.lines=Array.isArray(value.boot.lines)?value.boot.lines.map(v=>String(v)):structuredClone(defaultBoot.lines);
    return value;
  }
  function loadState(){
    try { const raw=localStorage.getItem(STORAGE_KEY); if(raw){ const parsed=JSON.parse(raw); if(parsed && Array.isArray(parsed.pages) && parsed.pages.length) return normalizeState(parsed); } } catch(e) {}
    return normalizeState(structuredClone(defaults));
  }
  function save(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#saveStatus').textContent='SALVO'; }
    catch(e){ $('#saveStatus').textContent='EXPORTAR BACKUP'; }
  }
  function activePage(){ return state.pages[state.active] || state.pages[0]; }
  function selectedWidget(){ return activePage().widgets.find(w=>w.id===selectedId) || null; }
  function showToast(message){
    const el=$('#toast'); el.textContent=message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2100);
  }
  function askConfirm(title,message,onAccept,acceptLabel='CONFIRMAR'){
    $('#confirmTitle').textContent=title;
    $('#confirmMessage').textContent=message;
    $('#confirmAccept').textContent=acceptLabel;
    confirmCallback=onAccept;
    $('#confirmOverlay').classList.add('open');
  }
  function closeConfirm(){ $('#confirmOverlay').classList.remove('open'); confirmCallback=null; }
  $('#confirmCancel').addEventListener('click',closeConfirm);
  $('#confirmAccept').addEventListener('click',()=>{const action=confirmCallback;closeConfirm();if(typeof action==='function')action();});
  $('#confirmOverlay').addEventListener('click',e=>{if(e.target.id==='confirmOverlay')closeConfirm();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && $('#confirmOverlay').classList.contains('open'))closeConfirm();});
  let powerOff=false;
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase()==='d'){
      e.preventDefault();
      if(!powerOff){ powerOff=true; $('#app').style.display='none'; $('#bootScreen').style.display='none'; $('#powerOffScreen').style.display='flex'; }
      else { powerOff=false; $('#powerOffScreen').style.display='none'; $('#app').style.display=''; playerMode=true; document.body.classList.add('player-mode'); render(); runBootSequence(); }
      return;
    }
    if(powerOff) return;
    if(e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase()==='j'){
      e.preventDefault(); setPlayerMode(!playerMode); showToast(playerMode?'MODO JOGADOR ATIVADO':'MODO MESTRE ATIVADO');
    }
  });
  document.addEventListener('keydown',e=>{
    if(!['Delete','Del'].includes(e.key) || playerMode || $('#confirmOverlay').classList.contains('open')) return;
    if(e.target.matches('input,textarea,select,[contenteditable="true"]')) return;
    const w=selectedWidget(); if(!w) return;
    if(w.type==='map' && selectedMapItemId){ w.mapItems=w.mapItems.filter(item=>item.id!==selectedMapItemId); selectedMapItemId=null; render(); save(); showToast('Elemento do setor removido.'); return; }
    activePage().widgets=activePage().widgets.filter(item=>item.id!==selectedId); selectedId=null; moveMode=false; render(); save(); showToast('Caixa removida.');
  });
  function esc(value){ return String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function positionStyle(w){ return `left:${w.x}%;top:${w.y}%;width:${w.w}%;height:${w.h}%;`; }
  function editAttr(field, index){ return `class="editable" data-field="${field}" ${index!==undefined?`data-index="${index}"`:''}`; }

  function renderTabs(){
    const bar=$('#tabbar'); bar.innerHTML='';
    state.pages.forEach((page,i)=>{
      const b=document.createElement('button'); b.className='tab'+(i===state.active?' active':'');
      b.textContent=page.name; b.title='Abrir '+page.name;
      b.addEventListener('click',()=>{ state.active=i; selectedId=null; selectedMapItemId=null; mapEditMode=false; render(); save(); });
      if(!playerMode){ b.title+=' — botão direito para renomear'; b.addEventListener('contextmenu',e=>{
        e.preventDefault(); e.stopPropagation();
        const input=document.createElement('input'); input.className='tab-rename-input'; input.value=page.name;
        input.setAttribute('aria-label','Novo nome da aba'); b.replaceWith(input); input.focus(); input.select();
        let cancelled=false; const finish=()=>{ if(!cancelled){const value=input.value.trim(); if(value) page.name=value.toUpperCase();} render(); save(); if(!cancelled)showToast('Nome da aba atualizado.'); };
        input.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();input.blur();} if(ev.key==='Escape'){cancelled=true;input.blur();}});
        input.addEventListener('blur',finish,{once:true});
      }); }
      bar.appendChild(b);
    });
  }

  function renderWidget(w){
    const classByType={heading:'heading-widget',clock:'clock-widget',label:'label-widget',schedule:'schedule-widget',map:'map-widget',info:'info-widget',actions:'actions-widget',footer:'footer-widget',checklist:'checklist-widget',log:'log-widget',status:'status-widget',table:'table-widget'};
    const node=document.createElement('div');
    node.className='widget '+(classByType[w.type]||'generic-widget');
    if(w.id===selectedId && !playerMode) node.classList.add('selected');
    if(selectedId===w.id && moveMode && !playerMode) node.classList.add('movable');
    node.dataset.id=w.id; node.style.cssText=positionStyle(w);
    if(w.type==='heading' || w.type==='clock' || w.type==='label' || w.type==='info'){
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title)}</div><div class="widget-body" ${editAttr('body')}>${esc(w.body||'')}</div>`;
    } else if(w.type==='schedule'){
      const cells=(w.cells||[]).map((c,i)=>`<div class="period">
        <div class="period-name editable" data-field="period" data-index="${i}">${esc(c.period)}</div>
        <div class="period-temp editable" data-field="temp" data-index="${i}">${esc(c.temp)}</div>
        <div class="period-time editable" data-field="time" data-index="${i}">${esc(c.time)}</div>
      </div>`).join('');
      node.innerHTML=`<div class="schedule-head">${w.title?`<div class="widget-title editable" data-field="title">${esc(w.title)}</div>`:''}<div class="editable" data-field="body">${esc(w.body||'SCHEDULE')}</div></div><div class="schedule-grid" style="grid-template-columns:repeat(${Math.max(1,(w.cells||[]).length)},minmax(0,1fr))">${cells}</div>`;
    } else if(w.type==='map'){
      const objects=(w.mapItems||[]).map(item=>{
        const selected=!playerMode && mapEditMode && selectedMapItemId===item.id;
        const cls=item.type==='line'?'map-line':item.type==='text'?'map-text':'map-rect';
        const style=`left:${item.x}%;top:${item.y}%;width:${item.w}%;height:${item.type==='line'?0:item.h}%;transform:rotate(${item.type==='line'?item.angle:0}deg);`;
        return `<div class="map-object ${cls}${selected?' map-selected':''}${item.lit?' sector-lit':''}" data-map-item-id="${esc(item.id)}" style="${style}">${item.type==='line'?'':esc(item.text)}${selected?'<span class="map-object-handle" title="Redimensionar"></span>':''}</div>`;
      }).join('');
      node.innerHTML=`<div class="map-title editable" data-field="title">${esc(w.title)}</div><div class="map-inner${!playerMode && mapEditMode && selectedId===w.id?' map-editing':''}">${objects}</div>`;
    } else if(w.type==='actions'){
      const items=(w.items||[]).map((item,i)=>`<button type="button" class="action-item${item.active?' active':''}" data-action-index="${i}"><span class="editable" data-field="item" data-index="${i}">${esc(item.text)}</span>${item.active?'<span class="action-preview-state">[ON]</span>':''}</button>`).join('');
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title||'CONTROL MENU')}</div>${items}`;
    } else if(w.type==='checklist'){
      const items=(w.items||[]).map((item,i)=>`<div class="check-row" data-check-index="${i}"><span class="check-box${item.done?' checked':''}"></span><span class="editable" data-field="checkItem" data-index="${i}">${esc(item.text)}</span></div>`).join('');
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title||'OBJECTIVES')}</div>${items}`;
    } else if(w.type==='log'){
      const entries=(w.entries||[]).map((entry,i)=>`<div class="log-line editable" data-field="logItem" data-index="${i}">${esc(entry)}</div>`).join('');
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title||'SYSTEM LOG')}</div><div class="log-lines">${entries}</div><button type="button" class="log-add">+ NEW RECORD</button>`;
    } else if(w.type==='status'){
      const rows=(w.rows||[]).map((row,i)=>`<div class="status-row${row.active?' active':''}" data-status-index="${i}"><span class="status-dot"></span><span class="editable" data-field="statusLabel" data-index="${i}">${esc(row.label)}</span><span class="status-value editable" data-field="statusValue" data-index="${i}">${esc(row.value)}</span></div>`).join('');
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title||'SYSTEM STATUS')}</div><div class="status-rows">${rows}</div>`;
    } else if(w.type==='table'){
      const heads=(w.columns||[]).map((col,i)=>`<th class="editable" data-field="tableHead" data-index="${i}">${esc(col)}</th>`).join('');
      const rows=(w.rows||[]).map((row,r)=>`<tr>${(w.columns||[]).map((_,c)=>`<td class="editable" data-field="tableCell" data-row="${r}" data-index="${c}">${esc(row[c]||'')}</td>`).join('')}</tr>`).join('');
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title||'DATA TABLE')}</div><div class="table-scroll"><table class="data-table"><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table></div>`;
    } else if(w.type==='footer'){
      node.innerHTML=`<div class="widget-body" ${editAttr('body')}>${esc(w.body||'')}</div>`;
    } else {
      node.innerHTML=`<div class="widget-title" ${editAttr('title')}>${esc(w.title||'NEW MODULE')}</div><div class="widget-body" ${editAttr('body')}>${esc(w.body||'')}</div>`;
    }
    if(moveMode && !playerMode){ const h=document.createElement('span'); h.className='resize-handle'; h.title='Redimensionar'; node.appendChild(h); }
    return node;
  }

  function render(){
    const screen=$('#screen');
    [...screen.querySelectorAll('.widget')].forEach(n=>n.remove());
    renderTabs();
    activePage().widgets.forEach(w=>screen.appendChild(renderWidget(w)));
    screen.classList.toggle('moving',moveMode && !playerMode);
    $('#activePageName').textContent=activePage().name;
    updateInspector();
  }

  function updateInspector(){
    const box=$('#inspectorContent'); const w=selectedWidget();
    if(!w){ box.innerHTML='<div class="inspector-empty">Nenhum elemento selecionado.<br><br>Escolha uma caixa no painel para editar título, conteúdo, funções e posição.</div>'; return; }
    let specific='';
    if(w.type==='actions'){
      specific=`<div class="editor-subpanel"><h3>CONFIGURAÇÃO DOS BOTÕES</h3><p class="hint">Um mesmo botão pode executar várias funções. As ações podem ser testadas diretamente no modo mestre.</p>${(w.items||[]).map((item,i)=>{const acts=item.actions||([item.action&&item.action!=='none'?item.action: null].filter(Boolean));return `<div class="editor-subpanel">
        <h3>BOTÃO ${i+1}</h3>
        <label class="field"><span>Texto do botão</span><input type="text" data-action-text="${i}" value="${esc(item.text)}"></label>
        <label class="inline-toggle"><input type="checkbox" data-action-active="${i}" ${item.active?'checked':''}> DESTAQUE VERDE / ESTADO INICIAL</label>
        <div class="field"><span>Funções ao clicar (selecione várias)</span>
          <label class="inline-toggle"><input type="checkbox" data-action-fn="notice" data-action-index="${i}" ${acts.includes('notice')?'checked':''}> EXIBIR MENSAGEM</label>
          <label class="inline-toggle"><input type="checkbox" data-action-fn="sector" data-action-index="${i}" ${acts.includes('sector')?'checked':''}> ACENDER / APAGAR SETOR</label>
          <label class="inline-toggle"><input type="checkbox" data-action-fn="toggle" data-action-index="${i}" ${acts.includes('toggle')?'checked':''}> ALTERNAR VERDE DO BOTÃO</label>
          <label class="inline-toggle"><input type="checkbox" data-action-fn="goto" data-action-index="${i}" ${acts.includes('goto')?'checked':''}> ABRIR OUTRA ABA</label>
        </div>
        <label class="field"><span>Mensagem (se aplicável)</span><input type="text" data-action-message="${i}" value="${esc(item.message||'')}"></label>
        <label class="field"><span>Aba de destino (se aplicável)</span><select data-action-target="${i}">${state.pages.map((page,j)=>`<option value="${j}" ${Number(item.targetPage)===j?'selected':''}>${esc(page.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Mapa que contém o setor</span><select data-action-map="${i}"><option value="">Selecione o mapa</option>${activePage().widgets.filter(v=>v.type==='map').map(m=>`<option value="${esc(m.id)}" ${item.targetMapWidget===m.id?'selected':''}>${esc(m.title||'MAPA')}</option>`).join('')}</select></label>
        <label class="field"><span>Setor a acender</span><select data-action-sector="${i}"><option value="">Selecione o setor</option>${(activePage().widgets.find(v=>v.id===item.targetMapWidget)?.mapItems||[]).map(m=>`<option value="${esc(m.id)}" ${item.targetMapItem===m.id?'selected':''}>${esc(m.text||'SETOR')}</option>`).join('')}</select></label>
        <button class="mini-btn" data-remove-action="${i}">REMOVER BOTÃO</button>
      </div>`;}).join('')}<button class="mini-btn" id="addActionItem">+ ADICIONAR BOTÃO</button></div>`;
    } else if(w.type==='checklist'){
      specific=`<div class="editor-subpanel"><h3>ITENS DA LISTA</h3>${(w.items||[]).map((item,i)=>`<div class="row-editor"><input type="text" data-check-text="${i}" value="${esc(item.text)}"><button class="mini-btn" data-remove-check="${i}">X</button></div><label class="inline-toggle"><input type="checkbox" data-check-done="${i}" ${item.done?'checked':''}> MARCADO COMO CONCLUÍDO</label>`).join('')}<button class="mini-btn" id="addCheckItem">+ ADICIONAR OBJETIVO</button></div>`;
    } else if(w.type==='log'){
      specific=`<div class="editor-subpanel"><h3>REGISTROS</h3>${(w.entries||[]).map((entry,i)=>`<div class="row-editor"><input type="text" data-log-text="${i}" value="${esc(entry)}"><button class="mini-btn" data-remove-log="${i}">X</button></div>`).join('')}<button class="mini-btn" id="addLogItem">+ ADICIONAR REGISTRO</button></div>`;
    } else if(w.type==='status'){
      specific=`<div class="editor-subpanel"><h3>INDICADORES</h3>${(w.rows||[]).map((row,i)=>`<div class="editor-subpanel"><h3>INDICADOR ${i+1}</h3><label class="field"><span>Nome</span><input type="text" data-status-label="${i}" value="${esc(row.label)}"></label><label class="field"><span>Valor</span><input type="text" data-status-value="${i}" value="${esc(row.value)}"></label><label class="inline-toggle"><input type="checkbox" data-status-active="${i}" ${row.active?'checked':''}> INDICADOR ACESO / VERDE</label><button class="mini-btn" data-remove-status="${i}">REMOVER INDICADOR</button></div>`).join('')}<button class="mini-btn" id="addStatusItem">+ ADICIONAR INDICADOR</button></div>`;
    } else if(w.type==='table'){
      specific=`<div class="editor-subpanel"><h3>COLUNAS</h3>${(w.columns||[]).map((col,i)=>`<div class="row-editor table-head-editor"><input type="text" data-table-head="${i}" value="${esc(col)}" aria-label="Nome da coluna ${i+1}"><button class="mini-btn" data-remove-table-column="${i}" title="Remover coluna">X</button></div>`).join('')}<button class="mini-btn" id="addTableColumn">+ ADICIONAR COLUNA</button></div>
      <div class="editor-subpanel"><h3>LINHAS E CÉLULAS</h3>${(w.rows||[]).map((row,r)=>`<div class="map-item-editor"><h4>LINHA ${r+1}</h4>${(w.columns||[]).map((col,c)=>`<label class="field"><span>${esc(col||'COLUNA '+(c+1))}</span><input type="text" data-table-cell-row="${r}" data-table-cell-col="${c}" value="${esc(row[c]||'')}"></label>`).join('')}<button class="mini-btn" data-remove-table-row="${r}">REMOVER LINHA</button></div>`).join('')}<button class="mini-btn" id="addTableRow">+ ADICIONAR LINHA</button></div>`;
    } else if(w.type==='schedule'){
      specific=`<div class="editor-subpanel"><h3>PERÍODOS / COLUNAS DA AGENDA</h3><p class="hint">Edite cada período, temperatura e horário individualmente. Os valores aparecem imediatamente na agenda.</p>${(w.cells||[]).map((cell,i)=>`<div class="map-item-editor"><h4>PERÍODO ${i+1}</h4><label class="field"><span>Identificação do período</span><input type="text" data-schedule-period="${i}" value="${esc(cell.period)}"></label><label class="field"><span>Temperatura / informações</span><textarea data-schedule-temp="${i}" rows="2">${esc(cell.temp)}</textarea></label><label class="field"><span>Horário de início</span><input type="text" data-schedule-time="${i}" value="${esc(cell.time)}"></label><button class="mini-btn" data-remove-schedule-period="${i}">REMOVER PERÍODO</button></div>`).join('')}<button class="mini-btn" id="addSchedulePeriod">+ ADICIONAR PERÍODO</button></div>`;
    } else if(w.type==='map'){
      specific=`<div class="editor-subpanel"><h3>FERRAMENTAS DO MAPA</h3><p class="map-hint">Dê dois cliques no elemento do mapa para selecioná-lo. Depois, arraste para mover. A seleção de cada setor fica sempre acessível na lista abaixo.</p><div class="map-tools"><button class="mini-btn" id="addMapRect">+ QUADRADO</button><button class="mini-btn" id="addMapLine">+ LINHA</button><button class="mini-btn" id="addMapText">+ TEXTO</button></div></div>
      <div class="editor-subpanel"><h3>ELEMENTOS DO SETOR</h3>${(w.mapItems||[]).map((item,i)=>`<div class="map-item-editor${selectedMapItemId===item.id?' selected':''}"><div class="map-item-top"><strong>${esc(item.text?.trim() || (item.type==='line'?'LINHA':item.type==='text'?'TEXTO':'QUADRADO')+' '+(i+1))}</strong><button type="button" class="mini-btn" data-select-map-item="${esc(item.id)}">${selectedMapItemId===item.id?'SELECIONADO':'SELECIONAR'}</button></div><details><summary>EDITAR PROPRIEDADES</summary><div>${item.type!=='line'?`<label class="field"><span>Texto / identificação</span><input type="text" data-map-text="${esc(item.id)}" value="${esc(item.text)}"></label>`:''}<div class="coord-grid"><label class="field"><span>X (%)</span><input type="number" min="0" max="100" data-map-prop="x" data-map-id="${esc(item.id)}" value="${item.x}"></label><label class="field"><span>Y (%)</span><input type="number" min="0" max="100" data-map-prop="y" data-map-id="${esc(item.id)}" value="${item.y}"></label><label class="field"><span>${item.type==='line'?'Comprimento':'Largura'} (%)</span><input type="number" min="1" max="100" data-map-prop="w" data-map-id="${esc(item.id)}" value="${item.w}"></label>${item.type!=='line'?`<label class="field"><span>Altura (%)</span><input type="number" min="1" max="100" data-map-prop="h" data-map-id="${esc(item.id)}" value="${item.h}"></label>`:`<label class="field"><span>Ângulo (graus)</span><input type="number" min="-360" max="360" data-map-prop="angle" data-map-id="${esc(item.id)}" value="${item.angle}"></label>`}</div><button class="mini-btn" data-remove-map-item="${esc(item.id)}">REMOVER ELEMENTO</button></div></details></div>`).join('')||'<p class="hint">Nenhum elemento no mapa. Use os botões acima para começar a desenhar.</p>'}</div>`;
    }
    box.innerHTML=bootEditorMarkup()+`
      <label class="field"><span>Título / identificação</span><input id="propTitle" type="text" value="${esc(w.title||'')}" /></label>
      <label class="field"><span>Texto / conteúdo</span><textarea id="propBody">${esc(w.body||'')}</textarea></label>
      <div class="coord-grid">
        <label class="field"><span>Posição X (%)</span><input id="propX" type="number" min="0" max="98" step="1" value="${w.x}" /></label>
        <label class="field"><span>Posição Y (%)</span><input id="propY" type="number" min="0" max="98" step="1" value="${w.y}" /></label>
        <label class="field"><span>Largura (%)</span><input id="propW" type="number" min="5" max="100" step="1" value="${w.w}" /></label>
        <label class="field"><span>Altura (%)</span><input id="propH" type="number" min="4" max="100" step="1" value="${w.h}" /></label>
      </div>
      ${specific}
      <div class="inspector-actions">
        <button class="tool-btn" id="duplicateBtn">DUPLICAR</button>
        <button class="tool-btn danger" id="deleteBtn">EXCLUIR CAIXA</button>
      </div>`;
    // Cada item repetido do inspetor começa recolhido, exibindo apenas seu nome.
    box.querySelectorAll('.map-item-editor, .editor-subpanel > .editor-subpanel').forEach(card=>{
      const heading=card.querySelector('h4, h3'); if(!heading) return;
      const details=document.createElement('details'); details.className=card.className;
      const summary=document.createElement('summary'); summary.textContent=heading.textContent;
      const content=document.createElement('div');
      [...card.children].forEach(child=>{if(child!==heading)content.appendChild(child);});
      details.append(summary,content); card.replaceWith(details);
    });
    bindBootEditor(box);
    const bind=(id,prop)=>{
      const input=$(id); input.addEventListener('input',()=>{
        const val=input.type==='number'?Number(input.value):input.value;
        w[prop]=val;
        if(['x','y','w','h'].includes(prop)) w[prop]=Math.max(prop==='w'||prop==='h'?5:0,Math.min(100,Number(val)||0));
        const node=$(`.widget[data-id="${w.id}"]`);
        if(node) node.style.cssText=positionStyle(w);
        if(prop==='title'||prop==='body') { const target=node?.querySelector(prop==='title'?'.widget-title':'.widget-body'); if(target) target.textContent=val; }
        save();
      });
    };
    bind('#propTitle','title'); bind('#propBody','body'); bind('#propX','x'); bind('#propY','y'); bind('#propW','w'); bind('#propH','h');
    $('#duplicateBtn').addEventListener('click',()=>{
      const copy=structuredClone(w); copy.id=uid(); copy.x=Math.min(95,w.x+3); copy.y=Math.min(95,w.y+3); activePage().widgets.push(copy); selectedId=copy.id; render(); save(); showToast('Caixa duplicada.');
    });
    $('#deleteBtn').addEventListener('click',()=>{
      activePage().widgets=activePage().widgets.filter(v=>v.id!==w.id); selectedId=null; render(); save(); showToast('Caixa removida.');
    });
    const rerenderSave=()=>{ render(); save(); };
    box.querySelectorAll('[data-action-text]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.actionText)].text=el.value;const n=$(`.widget[data-id="${w.id}"]`);const t=n?.querySelectorAll('.action-item .editable')[Number(el.dataset.actionText)];if(t)t.textContent=el.value;save();}));
    box.querySelectorAll('[data-action-active]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.actionActive)].active=el.checked;rerenderSave();}));
    box.querySelectorAll('[data-action-fn]').forEach(el=>el.addEventListener('change',()=>{const it=w.items[Number(el.dataset.actionIndex)];it.actions=it.actions||([it.action&&it.action!=='none'?it.action:null].filter(Boolean));const fn=el.dataset.actionFn;if(el.checked&&!it.actions.includes(fn))it.actions.push(fn);if(!el.checked)it.actions=it.actions.filter(v=>v!==fn);it.action=it.actions[0]||'none';save();}));
    box.querySelectorAll('[data-action-message]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.actionMessage)].message=el.value;save();}));
    box.querySelectorAll('[data-action-target]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.actionTarget)].targetPage=Number(el.value);save();}));
    box.querySelectorAll('[data-action-map]').forEach(el=>el.addEventListener('change',()=>{const it=w.items[Number(el.dataset.actionMap)];it.targetMapWidget=el.value;it.targetMapItem='';updateInspector();save();}));
    box.querySelectorAll('[data-action-sector]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.actionSector)].targetMapItem=el.value;save();}));
    box.querySelectorAll('[data-remove-action]').forEach(el=>el.addEventListener('click',()=>{w.items.splice(Number(el.dataset.removeAction),1);rerenderSave();}));
    $('#addActionItem')?.addEventListener('click',()=>{w.items.push({text:'NEW COMMAND',active:false,actions:[],action:'none',message:'',targetPage:0,targetMapWidget:'',targetMapItem:''});rerenderSave();});
    box.querySelectorAll('[data-check-text]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.checkText)].text=el.value;rerenderSave();}));
    box.querySelectorAll('[data-check-done]').forEach(el=>el.addEventListener('change',()=>{w.items[Number(el.dataset.checkDone)].done=el.checked;rerenderSave();}));
    box.querySelectorAll('[data-remove-check]').forEach(el=>el.addEventListener('click',()=>{w.items.splice(Number(el.dataset.removeCheck),1);rerenderSave();}));
    $('#addCheckItem')?.addEventListener('click',()=>{w.items.push({text:'NEW OBJECTIVE',done:false});rerenderSave();});
    box.querySelectorAll('[data-log-text]').forEach(el=>el.addEventListener('change',()=>{w.entries[Number(el.dataset.logText)]=el.value;rerenderSave();}));
    box.querySelectorAll('[data-remove-log]').forEach(el=>el.addEventListener('click',()=>{w.entries.splice(Number(el.dataset.removeLog),1);rerenderSave();}));
    $('#addLogItem')?.addEventListener('click',()=>{w.entries.push('NEW ENTRY');rerenderSave();});
    box.querySelectorAll('[data-status-label]').forEach(el=>el.addEventListener('change',()=>{w.rows[Number(el.dataset.statusLabel)].label=el.value;rerenderSave();}));
    box.querySelectorAll('[data-status-value]').forEach(el=>el.addEventListener('change',()=>{w.rows[Number(el.dataset.statusValue)].value=el.value;rerenderSave();}));
    box.querySelectorAll('[data-status-active]').forEach(el=>el.addEventListener('change',()=>{w.rows[Number(el.dataset.statusActive)].active=el.checked;rerenderSave();}));
    box.querySelectorAll('[data-remove-status]').forEach(el=>el.addEventListener('click',()=>{w.rows.splice(Number(el.dataset.removeStatus),1);rerenderSave();}));
    $('#addStatusItem')?.addEventListener('click',()=>{w.rows.push({label:'NEW SYSTEM',value:'ONLINE',active:true});rerenderSave();});
    box.querySelectorAll('[data-table-head]').forEach(el=>el.addEventListener('change',()=>{w.columns[Number(el.dataset.tableHead)]=el.value;rerenderSave();}));
    box.querySelectorAll('[data-table-cell-row]').forEach(el=>el.addEventListener('change',()=>{const r=Number(el.dataset.tableCellRow),c=Number(el.dataset.tableCellCol);if(w.rows[r])w.rows[r][c]=el.value;save();const td=$(`.widget[data-id="${w.id}"] tr:nth-child(${r+1}) td:nth-child(${c+1})`);if(td)td.textContent=el.value;}));
    $('#addTableRow')?.addEventListener('click',()=>{w.rows.push(w.columns.map(()=>''));rerenderSave();});
    box.querySelectorAll('[data-remove-table-row]').forEach(el=>el.addEventListener('click',()=>{w.rows.splice(Number(el.dataset.removeTableRow),1);rerenderSave();}));
    $('#addTableColumn')?.addEventListener('click',()=>{w.columns.push('NEW COLUMN');w.rows.forEach(row=>row.push(''));rerenderSave();});
    box.querySelectorAll('[data-remove-table-column]').forEach(el=>el.addEventListener('click',()=>{const c=Number(el.dataset.removeTableColumn);if(w.columns.length<=1){showToast('A tabela precisa manter pelo menos uma coluna.');return;}w.columns.splice(c,1);w.rows.forEach(row=>row.splice(c,1));rerenderSave();}));
    box.querySelectorAll('[data-schedule-period]').forEach(el=>el.addEventListener('change',()=>{w.cells[Number(el.dataset.schedulePeriod)].period=el.value;rerenderSave();}));
    box.querySelectorAll('[data-schedule-temp]').forEach(el=>el.addEventListener('change',()=>{w.cells[Number(el.dataset.scheduleTemp)].temp=el.value;rerenderSave();}));
    box.querySelectorAll('[data-schedule-time]').forEach(el=>el.addEventListener('change',()=>{w.cells[Number(el.dataset.scheduleTime)].time=el.value;rerenderSave();}));
    $('#addSchedulePeriod')?.addEventListener('click',()=>{const n=(w.cells||[]).length;w.cells.push({period:String.fromCharCode(65+n),temp:'--C\n--H',time:'00:00'});rerenderSave();});
    box.querySelectorAll('[data-remove-schedule-period]').forEach(el=>el.addEventListener('click',()=>{if(w.cells.length<=1){showToast('A agenda precisa manter pelo menos um período.');return;}w.cells.splice(Number(el.dataset.removeSchedulePeriod),1);rerenderSave();}));
    const addMapObject=(type)=>{const count=(w.mapItems||[]).length;const item={id:uid(),type,x:Math.min(82,8+(count*7)%72),y:Math.min(82,8+(count*9)%72),w:type==='line'?30:type==='text'?25:20,h:type==='line'?1:type==='text'?10:18,text:type==='line'?'':type==='text'?'NEW TEXT':'NEW ROOM',angle:type==='line'?0:0};w.mapItems.push(item);selectedMapItemId=item.id;mapEditMode=true;render();save();};
    $('#addMapRect')?.addEventListener('click',()=>addMapObject('rect'));
    $('#addMapLine')?.addEventListener('click',()=>addMapObject('line'));
    $('#addMapText')?.addEventListener('click',()=>addMapObject('text'));
    box.querySelectorAll('[data-map-text]').forEach(el=>el.addEventListener('change',()=>{const item=w.mapItems.find(v=>v.id===el.dataset.mapText);if(item)item.text=el.value;rerenderSave();}));
    box.querySelectorAll('[data-map-prop]').forEach(el=>el.addEventListener('change',()=>{const item=w.mapItems.find(v=>v.id===el.dataset.mapId);if(item){const prop=el.dataset.mapProp;item[prop]=Number(el.value)||0;item[prop]=prop==='x'||prop==='y'?Math.max(0,Math.min(100,item[prop])):item[prop];}rerenderSave();}));
    box.querySelectorAll('[data-select-map-item]').forEach(el=>el.addEventListener('click',()=>{selectedMapItemId=el.dataset.selectMapItem;mapEditMode=true;render();}));
    box.querySelectorAll('[data-remove-map-item]').forEach(el=>el.addEventListener('click',()=>{w.mapItems=w.mapItems.filter(v=>v.id!==el.dataset.removeMapItem);selectedMapItemId=null;rerenderSave();}));
  }

  // Text editing is deliberately activated separately from navigation, so tabs remain clickable.
  $('#editBtn').addEventListener('click',()=>{
    editMode=!editMode; $('#editBtn').classList.toggle('active',editMode); $('#editBtn').textContent=editMode?'FINALIZAR TEXTOS':'EDITAR TEXTOS';
    render(); showToast(editMode?'Edição de texto ativada. Dê dois cliques em um texto.':'Alterações de texto finalizadas.');
  });
  function makeWidget(type){
    const base={id:uid(),type,x:35,y:35,w:30,h:22,title:'NEW MODULE',body:''};
    if(type==='info') return {...base,type:'info',title:'INFORMATION',body:'ENTER DETAILS HERE',w:28,h:18};
    if(type==='actions') return {...base,type:'actions',title:'COMMAND MENU',items:[{text:'SET UP SCHEDULE',active:true,action:'notice',message:'Schedule interface selected.',targetPage:0},{text:'SET UP OVERRIDE',active:false,action:'toggle',message:'',targetPage:0}],w:27,h:25};
    if(type==='schedule') return {...base,type:'schedule',title:'SCHEDULE',body:'PERIODS / SETTINGS',cells:[{period:'A',temp:'72C\n66H',time:'06:00'},{period:'B',temp:'74C\n67H',time:'12:00'},{period:'C',temp:'70C\n65H',time:'18:00'}],w:48,h:24};
    if(type==='checklist') return {...base,type:'checklist',title:'MISSION OBJECTIVES',items:[{text:'Locate the access key',done:false},{text:'Restore auxiliary power',done:false},{text:'Return to the airlock',done:true}],w:32,h:24};
    if(type==='log') return {...base,type:'log',title:'SYSTEM LOG',entries:['21:06 // TERMINAL ONLINE','21:07 // WAITING FOR INPUT'],w:34,h:26};
    if(type==='status') return {...base,type:'status',title:'SYSTEM STATUS',rows:[{label:'LIFE SUPPORT',value:'ONLINE',active:true},{label:'REACTOR',value:'STABLE',active:true},{label:'SECURITY',value:'LOCKED',active:false}],w:31,h:23};
    if(type==='table') return {...base,type:'table',title:'CREW / DATA REGISTER',columns:['ID','NAME','STATUS'],rows:[['001','CREW MEMBER','ACTIVE'],['002','UNKNOWN','MISSING']],w:45,h:28};
    if(type==='map') return {...base,type:'map',title:'SECTOR MAP',mapItems:defaultRooms.map(r=>({id:uid(),type:'rect',x:r.x,y:r.y,w:r.w,h:r.h,text:r.name,angle:0})),w:48,h:35};
    return {...base,type:'generic',title:'NEW MODULE',body:'DOUBLE-CLICK TO EDIT THIS TEXT'};
  }
  $('#addBtn').addEventListener('click',()=>$('#addMenu').classList.toggle('open'));
  $('#addMenu').addEventListener('click',e=>{
    const option=e.target.closest('[data-widget-type]'); if(!option)return;
    const w=makeWidget(option.dataset.widgetType); activePage().widgets.push(w); selectedId=w.id; selectedMapItemId=null; mapEditMode=false;
    $('#addMenu').classList.remove('open'); render(); save(); showToast('Módulo especializado adicionado.');
  });
  document.addEventListener('click',e=>{if(!e.target.closest('#addMenu')&&!e.target.closest('#addBtn'))$('#addMenu').classList.remove('open');});
  $('#addPageBtn').addEventListener('click',()=>{
    if(state.pages.length>=8){ showToast('Limite de 8 abas atingido.'); return; }
    const name='NEW TAB '+(state.pages.length+1); const page=makePage(name); state.pages.push(page); state.active=state.pages.length-1; selectedId=null; render(); save(); showToast('Nova aba criada. Dê dois cliques no nome para renomear.');
  });
  $('#removePageBtn').addEventListener('click',()=>{
    if(state.pages.length<=1){showToast('O painel precisa manter pelo menos uma aba.');return;}
    const name=activePage().name;
    askConfirm('REMOVER ABA',`Remover a aba "${name}" e todos os elementos dela? Esta ação não pode ser desfeita.`,()=>{
      state.pages.splice(state.active,1); state.active=Math.max(0,Math.min(state.active,state.pages.length-1)); selectedId=null;selectedMapItemId=null;render();save();showToast('Aba removida.');
    },'REMOVER');
  });
  $('#resetBtn').addEventListener('click',()=>{
    askConfirm('RESETAR PAINEL','Restaurar o painel original? Todas as alterações deste painel neste navegador serão substituídas.',()=>{
      state=normalizeState(structuredClone(defaults)); selectedId=null;selectedMapItemId=null;mapEditMode=false;editMode=false;moveMode=false;
      $('#editBtn').classList.remove('active');$('#editBtn').textContent='EDITAR TEXTOS';
      render();save();showToast('Painel restaurado.');
    },'RESETAR');
  });
  function setPlayerMode(on){
    playerMode=on; document.body.classList.toggle('player-mode',on);
    $('#editBtn').disabled=on;
    if(on){ editMode=false; moveMode=false; mapEditMode=false; selectedMapItemId=null; $('#editBtn').classList.remove('active'); }
    render();
    if(on) runBootSequence();
  }

  // Dois cliques selecionam elementos para movimentação; depois, arraste com o botão pressionado.
  $('#screen').addEventListener('dblclick',e=>{
    if(playerMode) return;
    const mapObject=e.target.closest('.map-object');
    if(mapObject){ const mapNode=mapObject.closest('.map-widget'); if(!mapNode)return; selectedId=mapNode.dataset.id; selectedMapItemId=mapObject.dataset.mapItemId; mapEditMode=true; render(); showToast('Elemento selecionado. Arraste para mover.'); return; }
    const widget=e.target.closest('.widget');
    if(widget && !e.target.closest('.editable')){ selectedId=widget.dataset.id; moveMode=true; mapEditMode=false; renderInspectorSelectionOnly(); showToast('Caixa selecionada. Arraste para mover.'); return; }
    if(!editMode) return;
    const target=e.target.closest('.editable'); if(!target) return;
    e.preventDefault(); target.contentEditable='true'; target.focus();
    const range=document.createRange(); range.selectNodeContents(target); const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    const finish=()=>{
      target.contentEditable='false';
      const node=target.closest('.widget'); const w=activePage().widgets.find(v=>v.id===node?.dataset.id); if(!w) return;
      const field=target.dataset.field; const index=target.dataset.index!==undefined?Number(target.dataset.index):null;
      const value=target.innerText.replace(/\r/g,'').trim();
      if(index!==null){
        if(field==='mapItemText') { const mapItem=w.mapItems?.find(v=>v.id===target.dataset.mapItemId); if(mapItem)mapItem.text=value; }
        else if(field==='item') w.items[index].text=value;
        else if(field==='checkItem') w.items[index].text=value;
        else if(field==='logItem') w.entries[index]=value;
        else if(field==='statusLabel') w.rows[index].label=value;
        else if(field==='statusValue') w.rows[index].value=value;
        else if(field==='tableHead') w.columns[index]=value;
        else if(field==='tableCell') w.rows[Number(target.dataset.row)][index]=value;
        else if(w.cells?.[index]) w.cells[index][field]=value;
      } else { w[field]=value; }
      save();
      // Rebuild this widget so the inspector and data stay synchronized.
      const fresh=renderWidget(w); if(node && node.isConnected) node.replaceWith(fresh);
      selectedId=w.id; updateInspector();
    };
    target.addEventListener('blur',finish,{once:true});
    target.addEventListener('keydown',ev=>{ if(ev.key==='Escape'){ target.blur(); } if(ev.key==='Enter' && !ev.shiftKey && target.dataset.field!=='body' && target.dataset.field!=='temp' && target.dataset.field!=='time'){ ev.preventDefault(); target.blur(); } });
  });

  // Selecting a box opens its properties. Clicking action buttons in player mode shows a briefing toast.
  $('#screen').addEventListener('click',e=>{
    const clickedAction=e.target.closest('.action-item');
    if(clickedAction){
      const actionWidget=clickedAction.closest('.widget'); const actionOwner=activePage().widgets.find(v=>v.id===actionWidget?.dataset.id);
      if(actionOwner?.type==='actions'){
        const item=actionOwner.items[Number(clickedAction.dataset.actionIndex)]; if(!item)return;
        const acts=item.actions||([item.action&&item.action!=='none'?item.action:null].filter(Boolean));
        if(acts.includes('toggle') || (!acts.length && item.action==='toggle')) item.active=!item.active;
        if(acts.includes('sector') || item.action==='sector'){
          const map=activePage().widgets.find(v=>v.id===item.targetMapWidget && v.type==='map'); const sector=map?.mapItems?.find(v=>v.id===item.targetMapItem);
          if(sector) sector.lit=!sector.lit; else showToast('SETOR NÃO CONFIGURADO.');
        }
        if(acts.includes('notice') || item.action==='notice') showToast(item.message||item.text);
        if(acts.includes('goto') || item.action==='goto') state.active=Math.max(0,Math.min(Number(item.targetPage)||0,state.pages.length-1));
        if(!acts.length && !['toggle','sector','notice','goto'].includes(item.action)) showToast(item.text+' — comando selecionado.');
        selectedId=null; selectedMapItemId=null; mapEditMode=false; render(); save();
        if(!playerMode && !acts.includes('notice') && item.message && acts.length) showToast(item.message);
        return;
      }
    }
    if(playerMode){
      const node=e.target.closest('.widget'); const w=activePage().widgets.find(v=>v.id===node?.dataset.id);
      const check=e.target.closest('.check-row');
      if(check && w?.type==='checklist') { const item=w.items[Number(check.dataset.checkIndex)]; item.done=!item.done; render(); save(); return; }
      const status=e.target.closest('.status-row');
      if(status && w?.type==='status') { const row=w.rows[Number(status.dataset.statusIndex)]; row.active=!row.active; render(); save(); return; }
      const addLog=e.target.closest('.log-add');
      if(addLog && w?.type==='log') { const entry=prompt('Novo registro:'); if(entry&&entry.trim()){const now=new Date();const stamp=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});w.entries.push(stamp+' // '+entry.trim());render();save();} return; }
      return;
    }
    const node=e.target.closest('.widget'); if(!node || e.target.closest('.editable[contenteditable="true"]')) return;
    if(mapEditMode && node.classList.contains('map-widget')){
      const mapObj=e.target.closest('.map-object');selectedId=node.dataset.id;selectedMapItemId=mapObj?.dataset.mapItemId||null;render();return;
    }
    selectedId=node.dataset.id;selectedMapItemId=null;if(!node.classList.contains('map-widget'))mapEditMode=false; render();
  });

  // Pointer-based drag and resize. Coordinates are stored as percentages of the screen.
  $('#screen').addEventListener('pointerdown',e=>{
    if(!playerMode && mapEditMode){
      const mapInner=e.target.closest('.map-inner');
      if(mapInner){
        const mapNode=mapInner.closest('.widget');const mapWidget=activePage().widgets.find(v=>v.id===mapNode?.dataset.id);if(!mapWidget)return;
        selectedId=mapWidget.id;
        const obj=e.target.closest('.map-object');
        if(obj){
          selectedMapItemId=obj.dataset.mapItemId;
          const item=mapWidget.mapItems.find(v=>v.id===selectedMapItemId);if(!item)return;
          const rect=mapInner.getBoundingClientRect();
          mapDrag={widgetId:mapWidget.id,itemId:item.id,startX:e.clientX,startY:e.clientY,origX:item.x,origY:item.y,origW:item.w,origH:item.h,rect,resize:e.target.classList.contains('map-object-handle'),pointerId:e.pointerId};
          mapInner.setPointerCapture?.(e.pointerId);
        } else { selectedMapItemId=null; }
        renderInspectorSelectionOnly();e.preventDefault();return;
      }
    }
    if(playerMode) return;
    const node=e.target.closest('.widget'); if(!node || e.target.closest('.editable')) return;
    // Só permite arrastar a caixa depois de ela ter sido selecionada com duplo clique.
    if(selectedId!==node.dataset.id) return;
    const w=activePage().widgets.find(v=>v.id===node.dataset.id); if(!w) return;
    const rect=$('#screen').getBoundingClientRect(); const isResize=e.target.classList.contains('resize-handle');
    selectedId=w.id;
    drag={id:w.id,startX:e.clientX,startY:e.clientY,origX:w.x,origY:w.y,origW:w.w,origH:w.h,rect,resize:isResize};
    node.setPointerCapture?.(e.pointerId); e.preventDefault(); renderInspectorSelectionOnly();
  });
  function renderInspectorSelectionOnly(){
    document.querySelectorAll('.widget').forEach(n=>n.classList.toggle('selected',n.dataset.id===selectedId)); updateInspector();
  }
  $('#screen').addEventListener('pointermove',e=>{
    if(mapDrag){
      const pageWidget=activePage().widgets.find(v=>v.id===mapDrag.widgetId);const item=pageWidget?.mapItems?.find(v=>v.id===mapDrag.itemId);if(!item)return;
      const dx=(e.clientX-mapDrag.startX)/mapDrag.rect.width*100;const dy=(e.clientY-mapDrag.startY)/mapDrag.rect.height*100;
      if(mapDrag.resize){item.w=Math.max(2,Math.min(100-mapDrag.origX,mapDrag.origW+dx));if(item.type!=='line')item.h=Math.max(2,Math.min(100-mapDrag.origY,mapDrag.origH+dy));}
      else {item.x=Math.max(0,Math.min(100-item.w,mapDrag.origX+dx));item.y=Math.max(0,Math.min(100-item.h,mapDrag.origY+dy));}
      const obj=$(`.map-object[data-map-item-id="${item.id}"]`);if(obj){obj.style.left=item.x+'%';obj.style.top=item.y+'%';obj.style.width=item.w+'%';if(item.type!=='line')obj.style.height=item.h+'%';}
      ['x','y','w','h'].forEach(prop=>{const field=$(`[data-map-prop="${prop}"][data-map-id="${item.id}"]`);if(field)field.value=Math.round(item[prop]);});
      return;
    }
    if(!drag) return;
    const w=activePage().widgets.find(v=>v.id===drag.id); if(!w) return;
    const dx=(e.clientX-drag.startX)/drag.rect.width*100; const dy=(e.clientY-drag.startY)/drag.rect.height*100;
    if(drag.resize){ w.w=Math.max(5,Math.min(100-drag.origX,drag.origW+dx)); w.h=Math.max(4,Math.min(100-drag.origY,drag.origH+dy)); }
    else { w.x=Math.max(0,Math.min(100-w.w,drag.origX+dx)); w.y=Math.max(0,Math.min(100-w.h,drag.origY+dy)); }
    const node=$(`.widget[data-id="${w.id}"]`); if(node) node.style.cssText=positionStyle(w);
    ['X','Y','W','H'].forEach((suffix,i)=>{ const input=$('#prop'+suffix); if(input) input.value=Math.round([w.x,w.y,w.w,w.h][i]); });
  });
  const endDrag=()=>{ if(drag){ drag=null; save(); } if(mapDrag){ mapDrag=null; save(); } };
  $('#screen').addEventListener('pointerup',endDrag); $('#screen').addEventListener('pointercancel',endDrag);

  $('#exportBtn').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='backup-master-suite.json'; a.click(); URL.revokeObjectURL(url); showToast('Backup exportado.');
  });
  $('#importBtn').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0]; if(!file) return;
    try{
      const parsed=JSON.parse(await file.text());
      if(!parsed || !Array.isArray(parsed.pages) || !parsed.pages.length) throw new Error('invalid');
      state=normalizeState(parsed); selectedId=null; render(); save(); showToast('Backup importado com sucesso.');
    }catch(err){ showToast('Não foi possível importar este arquivo.'); }
    e.target.value='';
  });
  // Tela de inicialização exibida somente ao entrar no modo jogador.
  function bootEditorMarkup(){
    const boot=state.boot||defaultBoot;
    return `<details class="editor-subpanel boot-editor"><summary>TERMINAL DE INICIALIZAÇÃO</summary><div>
      <p class="hint">Personalize a tela exibida antes de abrir a visão dos jogadores.</p>
      <label class="field"><span>Identificação do terminal</span><input id="bootBrand" type="text" value="${esc(boot.brand)}"></label>
      <label class="field"><span>Linhas digitadas (uma por linha)</span><textarea id="bootLinesEditor" rows="10">${esc((boot.lines||[]).join('\n'))}</textarea></label>
      <button type="button" class="mini-btn" id="bootResetText">RESTAURAR TEXTO PADRÃO</button>
    </div></details>`;
  }
  function bindBootEditor(root){
    const brand=$('#bootBrand',root), lines=$('#bootLinesEditor',root);
    if(brand) brand.addEventListener('change',()=>{state.boot.brand=brand.value;save();});
    if(lines) lines.addEventListener('change',()=>{state.boot.lines=lines.value.replace(/\r/g,'').split('\n');save();});
    $('#bootResetText',root)?.addEventListener('click',()=>{state.boot=structuredClone(defaultBoot);updateInspector();save();showToast('Texto padrão restaurado.');});
  }
  function runBootSequence(){
    if(!playerMode) return;
    const overlay=$('#bootScreen'), output=$('#bootLines'), progress=$('#bootProgress');
    if(!overlay || !output){ return; }
    overlay.style.display='flex'; overlay.classList.remove('exit');
    $('.boot-brand',overlay).textContent=state.boot.brand||defaultBoot.brand;
    output.textContent=''; progress.style.width='0%';
    const lines=Array.isArray(state.boot.lines)?state.boot.lines:defaultBoot.lines;
    let line=0, char=0, finished=false;
    const finish=()=>{
      if(finished)return; finished=true; progress.style.width='100%';
      setTimeout(()=>{overlay.classList.add('exit');setTimeout(()=>{overlay.style.display='none';overlay.classList.remove('exit');},680);},450);
    };
    const typeNext=()=>{
      if(!playerMode){overlay.style.display='none';return;}
      if(line>=lines.length){finish();return;}
      const current=lines[line];
      if(char<current.length){output.textContent+=current[char++];setTimeout(typeNext,current.length>35?9:15);}
      else{output.textContent+='\n';line++;char=0;progress.style.width=Math.round(line/Math.max(1,lines.length)*100)+'%';setTimeout(typeNext,line%4===0?220:85);}
    };
    const skip=()=>{if(finished)return;line=lines.length;output.textContent=lines.join('\n');finish();};
    overlay.onclick=skip;
    setTimeout(typeNext,350);
  }
})();
