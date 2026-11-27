(() => {
  window.readWorkbookSafely = function(buffer) {
    return new Promise(function(resolve, reject) {
      if (!(buffer instanceof ArrayBuffer) || buffer.byteLength > 10 * 1024 * 1024) {
        reject(new Error("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."));
        return;
      }
      var worker = new Worker(new URL("assets/workbook-worker.js", document.baseURI));
      var timer = setTimeout(function() {
        worker.terminate();
        reject(new Error("\uD30C\uC77C \uCC98\uB9AC \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."));
      }, 15e3);
      function finish() {
        clearTimeout(timer);
        worker.terminate();
      }
      worker.onmessage = function(e) {
        finish();
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.workbook);
      };
      worker.onerror = function() {
        finish();
        reject(new Error("\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."));
      };
      worker.postMessage(buffer, [buffer]);
    });
  };
})();
