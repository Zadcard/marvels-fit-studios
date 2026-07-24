// jsPDF lazily imports canvg/dompurify/html2canvas only for its optional
// .svg()/.html() plugins, which lib/receipts/pdf-generator.ts never calls
// (it only uses plain text/line drawing APIs). Those packages pull in a
// broken transitive core-js chain in this environment, so instead of
// installing them we alias their specifiers to this empty stub via
// next.config.ts's turbopack.resolveAlias. Never actually invoked.
const unusedJspdfPluginStub = {};
export default unusedJspdfPluginStub;
