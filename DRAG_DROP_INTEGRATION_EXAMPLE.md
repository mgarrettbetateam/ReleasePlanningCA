// Example integration of useDragAndDrop composable with UniversalTable
// Add this to the script section of UniversalTable.vue

import { useDragAndDrop } from "@/composables/useDragAndDrop";

// In the setup() function:
export default {
    setup(props) {
        // Initialize drag and drop functionality
        const {
            isDragging,
            dragData,
            setupTableRowDrag,
            createDragAttributes
        } = useDragAndDrop();

        // Set up table row drag functionality
        const tableDrag = setupTableRowDrag(
            props.data, // Table data array
            // Function to extract physId from row data
            (rowData) => {
                return rowData.physId || rowData.objId || rowData.id;
            },
            // Function to extract additional item data
            (rowData) => {
                return {
                    itemType: props.dataType || "unknown",
                    itemNumber: rowData.itemNumber || rowData.name || rowData.title,
                    itemState: rowData.state || rowData.status,
                    physId: rowData.physId || rowData.objId || rowData.id
                };
            }
        );

        return {
            isDragging,
            dragData,
            tableDrag
        };
    }
};

// Template usage example:
/*
<v-data-table>
    <template #item="{ item, index }">
        <tr v-bind="tableDrag.getRowDragAttributes(item)">
            <td v-for="column in columns" :key="column.key">
                {{ item[column.key] }}
            </td>
        </tr>
    </template>
</v-data-table>
*/

// Or for individual cells that need drag functionality:
/*
<template #item.itemNumber="{ item }">
    <div v-bind="createDragAttributes(item, { dataType: 'CA' })">
        {{ item.itemNumber }}
    </div>
</template>
*/
