window.readWorkbookSafely=function(buffer){
  return new Promise(function(resolve,reject){
    if(!(buffer instanceof ArrayBuffer)||buffer.byteLength>10*1024*1024){reject(new Error('파일은 10MB 이하여야 합니다.'));return;}
    var worker=new Worker(new URL('assets/workbook-worker.js',document.baseURI));
    var timer=setTimeout(function(){worker.terminate();reject(new Error('파일 처리 시간이 초과되었습니다.'));},15000);
    function finish(){clearTimeout(timer);worker.terminate();}
    worker.onmessage=function(e){finish();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.workbook);};
    worker.onerror=function(){finish();reject(new Error('파일을 읽지 못했습니다.'));};
    worker.postMessage(buffer,[buffer]);
  });
};
