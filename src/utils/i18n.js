export const I18n = (() => {
  let current = 'fr';
  let dict = {};

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch {} }
  };

  const t = (key) => dict[key] ?? key;

  const apply = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const html = t(key);
      if (el.hasAttribute('data-i18n-placeholder')) {
        el.placeholder = html.replace(/<[^>]+>/g, '');
      } else {
        el.innerHTML = html;
      }
    });
  };

  const load = async (lang) => {
    current = lang;
    const res = await fetch(`/i18n/${lang}.json`, { cache: 'no-cache' });
    dict = await res.json();
    storage.set('lang', lang);
    apply();
  };

  const init = async () => {
    const saved = storage.get('lang') || (navigator.language || 'fr').slice(0, 2);
    const lang = ['fr', 'en'].includes(saved) ? saved : 'fr';
    await load(lang);
    const switcher = document.getElementById('langSwitcher');
    if (switcher) {
      switcher.value = lang;
      switcher.addEventListener('change', (e) => load(e.target.value));
    }
  };

  return { init, load, t };
})();


