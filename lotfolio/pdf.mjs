const assetRoot = () => new URL('./vendor/pdfjs/', document.baseURI);
let library;
export async function openPdf(url) {
  const root = assetRoot();
  library ??= import(new URL('pdf.mjs', root).href).catch((error) => {
    library = undefined;
    throw error;
  });
  const pdf = await library;
  pdf.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', root).href;
  return pdf.getDocument({
    url,
    isEvalSupported: false,
    cMapUrl: new URL('cmaps/', root).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('standard_fonts/', root).href,
  });
}
