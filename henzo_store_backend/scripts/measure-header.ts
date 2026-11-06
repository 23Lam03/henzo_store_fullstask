import { getJson } from './lib/commons-files';

const WIDTHS = [360, 414, 480, 600, 768, 814, 900, 1024, 1180, 1280, 1440];

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0}#f{border:0;display:block}</style></head>
<body><iframe id="f" src="http://localhost:5173/henzo_store/" width="__W__" height="700"></iframe>
<script>
window.addEventListener('message', e => { document.title = 'DONE'; });
</script></body></html>`;

async function main() {

  void HTML;
  void getJson;
  void WIDTHS;
}

void main();
