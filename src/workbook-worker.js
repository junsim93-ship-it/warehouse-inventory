importScripts('../vendor/xlsx.full.min.js');
self.onmessage=function(event){
  try{
    const bytes=event.data;
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>10*1024*1024)throw new Error('파일은 10MB 이하여야 합니다.');
    const wb=XLSX.read(bytes,{type:'array',sheetRows:20001,cellHTML:false,cellFormula:false,bookVBA:false});
    if(wb.SheetNames.length>40)throw new Error('시트는 40개 이하여야 합니다.');
    let count=0;
    for(const name of wb.SheetNames){
      const sheet=wb.Sheets[name];
      const range=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']||'A1');
      if(range.e.r>=20000||range.e.c>=200)throw new Error('시트는 20,000행, 200열 이하여야 합니다.');
      count+=Object.keys(sheet).length;
      if(count>500000)throw new Error('전체 셀 수가 너무 많습니다.');
    }
    self.postMessage({workbook:wb});
  }catch(e){self.postMessage({error:e.message||'파일을 읽지 못했습니다.'});}
};
