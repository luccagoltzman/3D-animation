/**
 * Shader Reminder - App de lembretes
 * Dados persistidos em localStorage
 */

const STORAGE_KEY = 'shader-reminder-items';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

let items = loadItems();
let filter = 'all';

const form = $('#form');
const input = $('#input');
const list = $('#list');
const countEl = $('#count');
const clearDoneBtn = $('#clear-done');

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  const filtered =
    filter === 'all'
      ? items
      : filter === 'done'
        ? items.filter((i) => i.done)
        : items.filter((i) => !i.done);

  list.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.setAttribute('role', 'status');
    if (filter === 'all') {
      empty.innerHTML = '<p>Nenhum lembrete ainda.</p><p>Adicione um acima.</p>';
    } else if (filter === 'done') {
      empty.innerHTML = '<p>Nenhum lembrete concluído.</p>';
    } else {
      empty.innerHTML = '<p>Nenhum lembrete pendente.</p>';
    }
    list.appendChild(empty);
  } else {
    filtered.forEach((item) => list.appendChild(createItemEl(item)));
  }

  const activeCount = items.filter((i) => !i.done).length;
  countEl.textContent =
    activeCount === 1 ? '1 item' : `${activeCount} itens`;
}

function createItemEl(item) {
  const li = document.createElement('li');
  li.className = 'reminder-item' + (item.done ? ' done' : '');
  li.dataset.id = item.id;

  const checkbox = document.createElement('button');
  checkbox.type = 'button';
  checkbox.className = 'checkbox';
  checkbox.setAttribute('aria-label', item.done ? 'Marcar como pendente' : 'Marcar como concluído');
  checkbox.addEventListener('click', () => toggleDone(item.id));

  const span = document.createElement('span');
  span.className = 'reminder-text';
  span.textContent = item.text;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn-delete';
  del.setAttribute('aria-label', 'Excluir lembrete');
  del.textContent = '×';
  del.addEventListener('click', () => removeItem(item.id));

  li.append(checkbox, span, del);
  return li;
}

function addItem(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  items.push({
    id: crypto.randomUUID(),
    text: trimmed,
    done: false,
    createdAt: Date.now()
  });
  saveItems();
  render();
  input.value = '';
  input.focus();
}

function toggleDone(id) {
  const item = items.find((i) => i.id === id);
  if (item) {
    item.done = !item.done;
    saveItems();
    render();
  }
}

function removeItem(id) {
  items = items.filter((i) => i.id !== id);
  saveItems();
  render();
}

function clearDone() {
  items = items.filter((i) => !i.done);
  saveItems();
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  addItem(input.value);
});

$$('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    $$('.filter').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

clearDoneBtn.addEventListener('click', clearDone);

render();
