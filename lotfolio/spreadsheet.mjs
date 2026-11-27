let loading;

export function loadSpreadsheet() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/xlsx.full.min.js';
      script.integrity = 'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT';
      script.crossOrigin = 'anonymous';
      function failed() {
        script.remove();
        reject(new Error('엑셀 도구를 불러오지 못했습니다. 다시 시도해 주세요.'));
      }
      script.onerror = failed;
      script.onload = () => window.XLSX ? resolve(window.XLSX) : failed();
      document.head.append(script);
    }).catch(error => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}
