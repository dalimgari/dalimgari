const sidebar = document.querySelector('[data-context="sidebar"]');

if (sidebar) {
  let open = false;

  function setOpen(value) {
    open = Boolean(value);
    sidebar.hidden = !open;
  }

  function isOpen() {
    return open;
  }

  setOpen(false);

  window.Dalimgari = window.Dalimgari || {};
  window.Dalimgari.sidebar = {
    setOpen,
    isOpen
  };
}
