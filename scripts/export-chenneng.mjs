#!/usr/bin/env node

import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const siteRoot = path.join(projectRoot, 'chenneng');
const sourceFiles = ['index.html', 'styles.css', 'products.js', 'app.js'];

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[1] ?? match[2]) : null;
}

function localFilename(reference) {
  return reference?.split(/[?#]/, 1)[0].replace(/^\.\//, '');
}

function preventEndTag(source, element) {
  return source.replace(new RegExp(`</${element}`, 'gi'), match => `<\\/${match.slice(2)}`);
}

function inlinePage(files) {
  let stylesheetCount = 0;
  const scriptCounts = new Map([['products.js', 0], ['app.js', 0]]);
  let html = files['index.html'].replace(/<link\b[^>]*>/gi, tag => {
    if (attribute(tag, 'rel')?.toLowerCase() !== 'stylesheet'
      || localFilename(attribute(tag, 'href')) !== 'styles.css') return tag;
    stylesheetCount += 1;
    return `<style>\n${preventEndTag(files['styles.css'], 'style')}\n</style>`;
  });

  html = html.replace(/<script\b[^>]*>\s*<\/script\s*>/gi, tag => {
    const filename = localFilename(attribute(tag, 'src'));
    if (!scriptCounts.has(filename)) return tag;
    scriptCounts.set(filename, scriptCounts.get(filename) + 1);
    return '';
  });

  if (stylesheetCount !== 1 || [...scriptCounts.values()].some(count => count !== 1)) {
    throw new Error('index.html 必须各引用一次 styles.css、products.js 和 app.js。');
  }

  const closingBodies = [...html.matchAll(/<\/body\s*>/gi)];
  if (closingBodies.length !== 1) {
    throw new Error('index.html 必须包含且仅包含一个 </body> 结束标签。');
  }

  const inlineScripts = ['products.js', 'app.js']
    .map(filename => `<script>\n${preventEndTag(files[filename], 'script')}\n</script>`)
    .join('\n');
  return html.replace(/<\/body\s*>/i, () => `${inlineScripts}\n</body>`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('用法：node scripts/export-chenneng.mjs <输出文件.html>');
    console.log('将臣能页面样式与脚本内联，图片仍从输出文件旁的 assets/ 目录读取。');
    return;
  }
  if (args.length !== 1 || !args[0].trim()) {
    throw new Error('请指定一个输出路径：node scripts/export-chenneng.mjs <输出文件.html>');
  }

  const outputPath = path.resolve(args[0]);
  const isSourceFile = sourceFiles.some(filename =>
    path.relative(path.join(siteRoot, filename), outputPath) === '');
  if (isSourceFile) throw new Error('输出路径不能覆盖网站源文件。');
  if (path.extname(outputPath).toLowerCase() !== '.html') {
    throw new Error('输出文件必须使用 .html 扩展名。');
  }

  const sourceEntries = await Promise.all(sourceFiles.map(async filename => [
    filename,
    await readFile(path.join(siteRoot, filename), 'utf8')
  ]));
  const html = inlinePage(Object.fromEntries(sourceEntries));
  const outputDirectory = path.dirname(outputPath);
  await mkdir(outputDirectory, { recursive: true });
  const temporaryPath = path.join(outputDirectory, `.${path.basename(outputPath)}.${process.pid}.tmp`);
  let createdTemporaryFile = false;
  try {
    await writeFile(temporaryPath, html, { encoding: 'utf8', flag: 'wx' });
    createdTemporaryFile = true;
    await rename(temporaryPath, outputPath);
  } finally {
    if (createdTemporaryFile) await rm(temporaryPath, { force: true });
  }
  console.log(`已导出：${outputPath}`);
  console.log(`图片目录：${path.join(outputDirectory, 'assets')}`);
}

main().catch(error => {
  console.error(`导出失败：${error.message}`);
  process.exitCode = 1;
});
