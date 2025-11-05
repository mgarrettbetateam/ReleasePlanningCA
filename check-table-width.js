// Run this in Chrome DevTools Console to diagnose the table width issue
const wrapper = document.querySelector('.v-data-table__wrapper');
const table = document.querySelector('.draggable-table table');
const tableCard = document.querySelector('.table-card');

console.log('=== TABLE WIDTH DIAGNOSIS ===');
console.log('Table Card Width:', tableCard?.offsetWidth);
console.log('Wrapper Width:', wrapper?.offsetWidth);
console.log('Wrapper ScrollWidth:', wrapper?.scrollWidth);
console.log('Table Width:', table?.offsetWidth);
console.log('Table Computed Width:', getComputedStyle(table)?.width);
console.log('Table Min-Width:', getComputedStyle(table)?.minWidth);
console.log('Table Layout:', getComputedStyle(table)?.tableLayout);

// Check if scrollbar should appear
if (wrapper) {
    const shouldScroll = wrapper.scrollWidth > wrapper.offsetWidth;
    console.log('Should show scrollbar?', shouldScroll);
    console.log('Overflow detected:', wrapper.scrollWidth - wrapper.offsetWidth, 'px');
}

// Check all parent containers
console.log('\n=== PARENT CONTAINERS ===');
let element = wrapper;
while (element) {
    console.log(element.className, {
        width: element.offsetWidth,
        maxWidth: getComputedStyle(element).maxWidth,
        overflow: getComputedStyle(element).overflow,
        overflowX: getComputedStyle(element).overflowX
    });
    element = element.parentElement;
    if (element?.tagName === 'HTML') break;
}
