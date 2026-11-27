const views={warehouse:document.querySelector('#warehouseView'),calculator:document.querySelector('#calculatorView')};
function select(view,push=false){
  for(const [name,frame] of Object.entries(views)){
    frame.hidden=name!==view;
    const link=document.querySelector('[data-view="'+name+'"]');
    if(name===view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
  document.title=(view==='calculator'?'부자재 계산':'창고 재고')+' | 창고 · 부자재 통합 관리';
  if(push)history.pushState(null,'',view==='calculator'?'/calculator.html':'/');
}
document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-view]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if((link.dataset.view==='calculator')!==(location.pathname==='/calculator.html'))select(link.dataset.view,true);
});
window.addEventListener('popstate',()=>select(location.pathname==='/calculator.html'?'calculator':'warehouse'));
