(function(){
  'use strict';
  const normalize = value => String(value || '').trim().normalize('NFC').toLocaleLowerCase('ko');
  function catalog(entries) {
    const found = new Map();
    for (const entry of entries) {
      const name = String(entry.name || '').trim();
      if (!name) continue;
      const key = normalize(name);
      const item = found.get(key) || {name, codes:[]};
      const code = String(entry.code || '').trim();
      if (code && !item.codes.includes(code)) item.codes.push(code);
      found.set(key,item);
    }
    return [...found.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));
  }
  const filter = (items, query) => items.filter(item=>normalize([item.name,...item.codes].join('\n')).includes(normalize(query)));
  function create(value, getOptions) {
    const root = document.createElement('div'); root.className='product-select';
    const trigger = document.createElement('button'); trigger.type='button'; trigger.className='product-trigger';
    trigger.setAttribute('aria-label','등록 품목 선택'); trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false');
    const panel = document.createElement('div'); panel.className='product-popup'; panel.popover='auto'; panel.id='products-'+crypto.randomUUID();
    trigger.setAttribute('popovertarget',panel.id);
    const search=document.createElement('input'); search.type='text'; search.placeholder='품목코드 또는 제품명 검색'; search.maxLength=300;
    search.setAttribute('role','combobox'); search.setAttribute('aria-label','품목 검색'); search.setAttribute('aria-autocomplete','list'); search.setAttribute('aria-expanded','false');
    const list=document.createElement('div'); list.className='product-options'; list.id=panel.id+'-list'; list.setAttribute('role','listbox'); list.setAttribute('aria-label','검색된 품목');
    search.setAttribute('aria-controls',list.id); trigger.setAttribute('aria-controls',list.id);
    const empty=document.createElement('p'); empty.className='picker-note'; empty.setAttribute('role','status');
    const add=document.createElement('button'); add.type='button'; add.className='picker-add';
    const clear=document.createElement('button'); clear.type='button'; clear.className='picker-clear'; clear.textContent='선택 해제';
    panel.append(search,list,empty,add,clear); root.append(trigger,panel);
    let options=[], results=[], active=0;
    const label=()=>{trigger.textContent=value.value || '품목 선택';}; label();
    function close(){panel.hidePopover();trigger.focus();}
    function choose(name){value.value=name;label();value.dispatchEvent(new Event('change',{bubbles:true}));close();}
    function highlight(){
      [...list.children].forEach((el,i)=>el.classList.toggle('active',i===active));
      if(list.children[active])search.setAttribute('aria-activedescendant',list.children[active].id);
      else search.removeAttribute('aria-activedescendant');
    }
    function render(){
      results=filter(options,search.value);active=0;list.replaceChildren();
      results.forEach((item,index)=>{
        const button=document.createElement('button');button.type='button';button.tabIndex=-1;button.id=panel.id+'-'+index;button.setAttribute('role','option');button.setAttribute('aria-selected',String(value.value===item.name));
        button.textContent=(item.codes.length?item.codes.join(', ')+' · ':'')+item.name;
        button.addEventListener('click',()=>choose(item.name));button.addEventListener('mouseenter',()=>{active=index;highlight();});list.append(button);
      });
      empty.textContent=results.length?'':'검색 결과가 없습니다.';empty.hidden=!!results.length;
      const name=search.value.trim(); add.hidden=!name||options.some(item=>normalize(item.name)===normalize(name));
      add.textContent='“'+name+'” 새 제품명으로 입력'; clear.hidden=!value.value;highlight();
    }
    trigger.addEventListener('click',()=>{
      options=getOptions();search.value='';render();
      const rect=trigger.getBoundingClientRect(), width=Math.min(Math.max(rect.width,360),innerWidth-32);
      const below=innerHeight-rect.bottom-16,above=rect.top-16,up=below<240&&above>below;
      Object.assign(panel.style,{left:Math.max(16,Math.min(rect.left,innerWidth-width-16))+'px',width:width+'px',maxHeight:Math.max(120,Math.min(360,(up?above:below)-6))+'px',top:up?'auto':rect.bottom+6+'px',bottom:up?innerHeight-rect.top+6+'px':'auto'});
    });
    panel.addEventListener('toggle',event=>{
      const open=event.newState==='open';trigger.setAttribute('aria-expanded',String(open));search.setAttribute('aria-expanded',String(open));if(open)search.focus();
    });
    search.addEventListener('input',render);
    search.addEventListener('keydown',event=>{
      if(event.isComposing)return;
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();active=Math.max(0,Math.min(results.length-1,active+(event.key==='ArrowDown'?1:-1)));highlight();list.children[active]?.scrollIntoView({block:'nearest'});
      }
      if(event.key==='Enter'){event.preventDefault();if(results[active])choose(results[active].name);}
      if(event.key==='Tab')panel.hidePopover();
    });
    panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}});
    add.addEventListener('click',()=>choose(search.value.trim()));clear.addEventListener('click',()=>choose(''));
    return root;
  }
  window.WarehouseProducts={catalog,filter,create};
})();
