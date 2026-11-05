import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(search, replacement);
}

let html = readFileSync('index.html', 'utf8');
let app = readFileSync('app.js', 'utf8');

html = replaceOnce(
  html,
  '  <link rel="stylesheet" href="styles.css">',
  '  <link rel="manifest" href="manifest.webmanifest">\n  <link rel="icon" href="icon.svg" type="image/svg+xml">\n  <meta name="theme-color" content="#111827">\n  <link rel="stylesheet" href="styles.css">',
  'index head assets'
);

html = replaceOnce(
  html,
  '<div class="save-note">数据保存在当前浏览器</div>',
  '<div class="save-note">数据只存在本机浏览器，请每天导出备份</div>',
  'save note'
);

html = replaceOnce(
  html,
  '<button type="button" class="ghost-dark danger-text" id="resetBtn">重置演示数据</button>',
  '<button type="button" class="ghost-dark danger-text" id="resetBtn">清空全部数据</button>',
  'reset button label'
);

html = replaceOnce(
  html,
  '              <button type="button" class="btn small" id="exportCsvBtn">导出 CSV</button>',
  '              <button type="button" class="btn small" id="importCsvBtn">导入 CSV</button>\n              <input id="importCsvFile" type="file" accept=".csv,text/csv" hidden>\n              <button type="button" class="btn small" id="exportCsvBtn">导出 CSV</button>',
  'csv buttons'
);

app = replaceOnce(
  app,
  'let memoryState = null;',
  `function blankData() {
  return { customers: [], followups: [], orders: [], settings: { companyName: '我的电商团队' } };
}

let memoryState = null;`,
  'blank data helper'
);

app = replaceOnce(
  app,
  `  } catch (err) {
    console.warn('读取本地数据失败，使用演示数据。', err);
  }
  if (memoryState) return normalizeState(memoryState);
  return seedState();`,
  `  } catch (err) {
    console.warn('读取本地数据失败，使用空数据。', err);
  }
  if (memoryState) return normalizeState(memoryState);
  return blankData();`,
  'empty initial state'
);

app = replaceOnce(
  app,
  `  $('resetBtn').addEventListener('click', () => {
    if (!confirm('确定重置为演示数据？当前浏览器里的数据会被覆盖。')) return;
    state = seedState();
    saveState();
    closePanels();
    renderAll();
    toast('已重置为演示数据');
  });`,
  `  $('resetBtn').addEventListener('click', () => {
    if (!confirm('确定清空全部客户、跟进和订单？此操作不可恢复，建议先导出 JSON 备份。')) return;
    state = blankData();
    saveState();
    closePanels();
    renderAll();
    toast('全部数据已清空');
  });`,
  'clear data handler'
);

const csvHelpers = `function csvLabelToStatus(label) {
  const value = String(label || '').trim();
  if (CUSTOMER_STATUS[value]) return value;
  const normalized = value.replace(/\\s/g, '');
  const found = Object.entries(CUSTOMER_STATUS).find(([, meta]) => meta.label.replace(/\\s/g, '') === normalized);
  return found ? found[0] : 'new';
}

function csvLabelToPriority(label) {
  const value = String(label || '').trim();
  const map = { '高': 'high', '中': 'medium', '低': 'low', high: 'high', medium: 'medium', low: 'low' };
  return map[value.toLowerCase()] || 'medium';
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const source = String(text || '').replace(/^\\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i += 1; }
        else { inQuotes = false; }
      } else { field += ch; }
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch === '\\r') continue;
    field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((item) => item.some((cell) => String(cell).trim() !== ''));
}

function importCustomersCsv(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseCsvText(String(reader.result || ''));
      if (rows.length < 2) { toast('CSV 没有数据行'); return; }
      const headers = rows[0].map((item) => String(item).trim());
      if (!headers.includes('姓名')) { toast('CSV 缺少“姓名”列'); return; }
      const indexOf = (name) => headers.indexOf(name);
      const now = new Date().toISOString();
      const existing = new Set(state.customers.map((c) => \`\${c.name || ''}|\${c.phone || ''}|\${c.wechat || ''}\`));
      let added = 0;
      let skipped = 0;
      for (let r = 1; r < rows.length; r += 1) {
        const row = rows[r];
        const get = (name) => {
          const index = indexOf(name);
          return index >= 0 ? String(row[index] ?? '').trim() : '';
        };
        const name = get('姓名');
        if (!name) { skipped += 1; continue; }
        const key = \`\${name}|\${get('手机')}|\${get('微信')}\`;
        if (existing.has(key)) { skipped += 1; continue; }
        existing.add(key);
        const source = get('来源');
        state.customers.unshift({
          id: uid('c'),
          name,
          phone: get('手机'),
          wechat: get('微信'),
          source: SOURCES.includes(source) ? source : '其他',
          product: get('意向产品'),
          budget: Number(get('预算')) || 0,
          status: csvLabelToStatus(get('状态')),
          priority: csvLabelToPriority(get('优先级')),
          owner: get('负责人'),
          tags: get('标签').split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean),
          nextFollowUp: get('下次跟进'),
          notes: get('备注'),
          createdAt: now,
          lastContactAt: null
        });
        added += 1;
      }
      if (!added) { toast('没有导入新客户，可能全部重复或为空'); return; }
      saveState();
      renderAll();
      showView('customers');
      toast(\`已导入 \${added} 位客户\${skipped ? \`，跳过 \${skipped} 行\` : ''}\`);
    } catch (err) {
      console.error(err);
      toast('CSV 导入失败，请检查格式');
    }
  };
  reader.readAsText(file, 'utf-8');
}

`;

app = replaceOnce(app, 'function bindEvents() {', csvHelpers + 'function bindEvents() {', 'csv helpers');

app = replaceOnce(
  app,
  "  $('statusFilter').addEventListener('change', (e) => {",
  `  const importCsvBtn = $('importCsvBtn');
  const importCsvFile = $('importCsvFile');
  if (importCsvBtn && importCsvFile) {
    importCsvBtn.addEventListener('click', () => importCsvFile.click());
    importCsvFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importCustomersCsv(file);
      e.target.value = '';
    });
  }

  $('statusFilter').addEventListener('change', (e) => {`,
  'csv event bindings'
);

const pwaSetup = `

let deferredInstallPrompt = null;

function setupPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker 注册失败', err));
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    const button = document.getElementById('installAppBtn');
    if (button) button.hidden = false;
  });

  document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return;

    if (!document.querySelector('.team-link')) {
      const teamLink = document.createElement('a');
      teamLink.href = './team.html';
      teamLink.className = 'ghost-dark team-link';
      teamLink.textContent = '团队工作台';
      teamLink.style.display = 'block';
      teamLink.style.boxSizing = 'border-box';
      teamLink.style.textDecoration = 'none';
      footer.prepend(teamLink);
    }

    if (!document.getElementById('installAppBtn')) {
      const button = document.createElement('button');
      button.id = 'installAppBtn';
      button.type = 'button';
      button.className = 'ghost-dark';
      button.textContent = '安装到桌面';
      button.hidden = !deferredInstallPrompt;
      button.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        button.hidden = true;
      });
      footer.prepend(button);
    }
  });
}

setupPwa();
`;

app = replaceOnce(
  app,
  'document.addEventListener(\'DOMContentLoaded\', init);',
  `document.addEventListener('DOMContentLoaded', init);${pwaSetup}`,
  'pwa setup'
);

writeFileSync('index.html', html);
writeFileSync('app.js', app);
console.log('real-v1 patch applied');
