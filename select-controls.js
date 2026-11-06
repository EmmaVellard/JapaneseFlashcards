// Accessible, theme-aware menus retain the original selects as the data source.
(function setupSelectControls() {
  const refreshers = [];
  document.querySelectorAll('select').forEach((select) => {
    const originalLabel = select.closest('label');
    if (!originalLabel || select.dataset.enhanced) return;
    const labelText = Array.from(originalLabel.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent)
      .join(' ')
      .trim();
    const field = document.createElement('div');
    field.className = originalLabel.className;
    const label = document.createElement('span');
    label.id = `${select.id}-label`;
    label.className = 'select-label';
    label.textContent = labelText;
    const root = document.createElement('div');
    root.className = 'custom-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${select.id}-menu`);
    const value = document.createElement('span');
    value.id = `${select.id}-value`;
    value.className = 'select-value';
    trigger.setAttribute('aria-labelledby', `${label.id} ${value.id}`);
    if (select.getAttribute('aria-describedby'))
      trigger.setAttribute(
        'aria-describedby',
        select.getAttribute('aria-describedby')
      );
    const chevron = document.createElement('span');
    chevron.className = 'select-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.append(value, chevron);
    const menu = document.createElement('ul');
    menu.id = `${select.id}-menu`;
    menu.className = 'select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-labelledby', label.id);
    menu.hidden = true;
    root.append(trigger, menu);
    originalLabel.replaceWith(field);
    field.append(label, select, root);
    select.dataset.enhanced = 'true';
    select.classList.add('hidden');
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    let options = [];
    let search = '';
    let lastTypedAt = 0;

    function close(returnFocus = false) {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      root.classList.remove('is-open', 'opens-above');
      if (returnFocus) trigger.focus({ preventScroll: true });
    }
    function choose(option) {
      select.value = option.value;
      close(true);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      render();
    }
    function render() {
      value.textContent = select.selectedOptions[0]?.label || '';
      trigger.disabled = select.disabled;
      menu.replaceChildren();
      options = Array.from(select.options)
        .filter((option) => !option.hidden && !option.disabled)
        .map((option) => {
          const item = document.createElement('li');
          item.className = 'select-option';
          item.setAttribute('role', 'option');
          item.setAttribute(
            'aria-selected',
            String(option.value === select.value)
          );
          item.textContent = option.label;
          item.tabIndex = -1;
          item.dataset.value = option.value;
          item.addEventListener('click', () => choose(option));
          menu.appendChild(item);
          return item;
        });
    }
    function open(position = 'selected') {
      if (trigger.disabled || options.length === 0) return;
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      root.classList.add('is-open');
      const bounds = trigger.getBoundingClientRect();
      const below = window.innerHeight - bounds.bottom;
      root.classList.toggle(
        'opens-above',
        below < Math.min(menu.scrollHeight, 260) && bounds.top > below
      );
      const selected = options.findIndex(
        (option) => option.dataset.value === select.value
      );
      const index =
        position === 'first'
          ? 0
          : position === 'last'
            ? options.length - 1
            : Math.max(0, selected);
      options[index].focus({ preventScroll: true });
      options[index].scrollIntoView({ block: 'nearest' });
    }
    trigger.addEventListener('click', () => (menu.hidden ? open() : close()));
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        open(
          event.key === 'Home'
            ? 'first'
            : event.key === 'End'
              ? 'last'
              : 'selected'
        );
      }
    });
    menu.addEventListener('keydown', (event) => {
      const index = options.indexOf(document.activeElement);
      let target;
      if (event.key === 'ArrowDown') target = (index + 1) % options.length;
      if (event.key === 'ArrowUp')
        target = (index - 1 + options.length) % options.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = options.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        options[target].focus({ preventScroll: true });
        options[target].scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const option =
          select.options[
            Array.from(select.options).findIndex(
              (option) => option.value === options[index]?.dataset.value
            )
          ];
        if (option) choose(option);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Tab') {
        close(true);
      } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const now = Date.now();
        search =
          now - lastTypedAt < 700
            ? search + event.key.toLowerCase()
            : event.key.toLowerCase();
        lastTypedAt = now;
        const match = options.find((option) =>
          option.textContent.toLowerCase().startsWith(search)
        );
        match?.focus({ preventScroll: true });
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!root.contains(event.target)) close();
    });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) close();
    });
    root.addEventListener('keydown', (event) => event.stopPropagation());
    window.addEventListener('resize', () => close());
    select.addEventListener('change', render);
    new MutationObserver(render).observe(select, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['disabled', 'label']
    });
    refreshers.push(render);
    render();
  });
  window.SelectControls = {
    refresh: () => refreshers.forEach((render) => render())
  };
})();
