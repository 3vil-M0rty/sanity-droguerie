/**
 * Phone layout for the shared `.dataTable` lists (styles/global.css).
 *
 * On a phone a row's columns no longer fit side by side, so each row
 * becomes a small card and the header row is hidden. Without the
 * header, a card would only show bare values ("18 · 0 · 28,5"), so
 * this copies every header label onto the matching cell as
 * `data-label`, which the CSS prints in front of the value.
 *
 * One observer for the whole app instead of touching the ~80 tables:
 * it only runs while the phone media query matches, and its work is
 * batched to one pass per animation frame.
 */
const PHONE_QUERY = "(max-width: 760px)";

function labelTable(table) {
  const head = table.querySelector(":scope > .dataTableHead");
  if (!head) return;
  const labels = Array.from(head.children, (c) => c.textContent.trim());
  table.querySelectorAll(":scope > .dataTableRow, :scope > * > .dataTableRow").forEach((row) => {
    const cells = row.children;
    if (cells.length !== labels.length) return;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].getAttribute("data-label") !== labels[i]) cells[i].setAttribute("data-label", labels[i]);
    }
  });
}

function labelAll() {
  document.querySelectorAll(".dataTable").forEach(labelTable);
}

export function installResponsiveTableLabels() {
  if (typeof window === "undefined" || !window.matchMedia || !window.MutationObserver) return;
  const mq = window.matchMedia(PHONE_QUERY);
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      labelAll();
    });
  };
  const observer = new MutationObserver(schedule);
  const sync = () => {
    if (mq.matches) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      schedule();
    } else {
      observer.disconnect();
    }
  };
  mq.addEventListener("change", sync);
  sync();
}
