import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DATA = resolve('src/data/resume.js');
const TEMPLATES = resolve('src/content/templates.js');

/**
 * Injects the resume HTML (generated from src/data/resume.js) into index.html,
 * so all the text is static, crawlable and visible even without JavaScript.
 * In dev, editing the data or the templates triggers a full page reload.
 */
export default function resumeHtml() {
  let base = '/';

  const render = async () => {
    const stamp = `?t=${Date.now()}`;
    const { resume } = await import(pathToFileURL(DATA).href + stamp);
    const { renderPage } = await import(pathToFileURL(TEMPLATES).href + stamp);
    return renderPage(resume, base);
  };

  return {
    name: 'resume-html',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        const { head, body } = await render();
        return html.replace('<!--app:head-->', head).replace('<!--app:body-->', body);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file === DATA || file === TEMPLATES) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}
