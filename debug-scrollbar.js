// Debug script to diagnose horizontal scrollbar issue
// Copy and paste this into Chrome DevTools Console

console.log('=== SCROLLBAR DEBUG ===');

const wrapper = document.querySelector('.v-data-table__wrapper');
const table = document.querySelector('.v-data-table table');
const dataTable = document.querySelector('.v-data-table');

console.log('1. Wrapper element:', wrapper);
console.log('2. Wrapper width:', wrapper?.offsetWidth);
console.log('3. Wrapper scrollWidth:', wrapper?.scrollWidth);
console.log('4. Wrapper overflow-x:', getComputedStyle(wrapper)?.overflowX);
console.log('5. Wrapper scrollbar height:', getComputedStyle(wrapper)?.getPropertyValue('::-webkit-scrollbar'));

console.log('6. Table element:', table);
console.log('7. Table width:', table?.offsetWidth);
console.log('8. Table scrollWidth:', table?.scrollWidth);
console.log('9. Table min-width:', getComputedStyle(table)?.minWidth);

console.log('10. Data table classes:', dataTable?.classList);
console.log('11. Is scrollable?', wrapper?.scrollWidth > wrapper?.offsetWidth);
console.log('12. Scroll position:', wrapper?.scrollLeft, '/', wrapper?.scrollWidth - wrapper?.offsetWidth);

// Check if mobile mode is truly off
console.log('13. Mobile mode active?', dataTable?.classList.contains('v-data-table--mobile'));

// Get all column widths
const headers = document.querySelectorAll('.v-data-table thead th');
console.log('14. Header count:', headers.length);
const widths = Array.from(headers).map((h, i) => ({
    col: i,
    width: h.offsetWidth,
    minWidth: getComputedStyle(h).minWidth
}));
console.log('15. Column widths:', widths);
console.log('16. Total column width:', widths.reduce((sum, w) => sum + w.width, 0));

console.log('=== END DEBUG ===');
