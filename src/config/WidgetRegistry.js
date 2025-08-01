/* eslint-disable no-console */
// Widget Registry - Centralized configuration for all widgets and data sources

export const WIDGET_DEFINITIONS = {
    enhancedPartsPlanner: {
        component: "ReleasePlannerWidget",
        title: "Release Planning CA",
        icon: "mdi-clipboard-list",
        description: "Complete CA planning dashboard with filter dropdowns, chart, and table",
        category: "planner",
        props: {
            hideHeader: true    // Hide the outer widget header, but keep the inner "Release Planning Dashboard" header
        },
        dataSource: "parts",
        filters: ["program", "phase", "organization"],
        layout: { 
            minHeight: 600, 
            flex: 3,
            breakpoints: {
                mobile: { flex: 1, height: 500 },
                tablet: { flex: 2, height: 550 },
                desktop: { flex: 3, height: 600 }
            }
        },
        standalone: true, // This widget manages its own filters and data
        visible: true
    },

    lineChart: {
        component: "UniversalChart",
        title: "Line Chart",
        icon: "mdi-chart-line",
        props: { 
            type: "line",
            height: 400
        },
        dataSource: "stats",
        filters: [],
        layout: { 
            minHeight: 400, 
            flex: 2,
            breakpoints: {
                mobile: { flex: 1, height: 300 },
                tablet: { flex: 2, height: 350 },
                desktop: { flex: 2, height: 400 }
            }
        },
        visible: true
    },
    
    barChart: {
        component: "UniversalChart",
        title: "Bar Chart",
        icon: "mdi-chart-bar",
        props: { 
            type: "bar",
            height: 350
        },
        dataSource: "stats",
        filters: ["organization"],
        layout: { 
            minHeight: 350, 
            flex: 1,
            breakpoints: {
                mobile: { flex: 1, height: 250 },
                tablet: { flex: 1, height: 300 },
                desktop: { flex: 1, height: 350 }
            }
        },
        visible: true
    },
    
    pieChart: {
        component: "UniversalChart",
        title: "Pie Chart",
        icon: "mdi-chart-pie",
        props: { 
            type: "pie",
            height: 400
        },
        dataSource: "stats",
        filters: ["organization"],
        layout: { 
            minHeight: 400, 
            flex: 1,
            breakpoints: {
                mobile: { flex: 1, height: 300 },
                tablet: { flex: 1, height: 350 },
                desktop: { flex: 1, height: 400 }
            }
        },
        visible: true
    },
    
    doughnutChart: {
        component: "UniversalChart",
        title: "Doughnut Chart",
        icon: "mdi-chart-donut",
        props: { 
            type: "doughnut",
            height: 400
        },
        dataSource: "stats",
        filters: ["organization"],
        layout: { 
            minHeight: 400, 
            flex: 1,
            breakpoints: {
                mobile: { flex: 1, height: 300 },
                tablet: { flex: 1, height: 350 },
                desktop: { flex: 1, height: 400 }
            }
        },
        visible: true
    },
    
    radarChart: {
        component: "UniversalChart",
        title: "Radar Chart",
        icon: "mdi-radar",
        props: { 
            type: "radar",
            height: 450
        },
        dataSource: "stats",
        filters: ["organization"],
        layout: { 
            minHeight: 450, 
            flex: 2,
            breakpoints: {
                mobile: { flex: 1, height: 350 },
                tablet: { flex: 2, height: 400 },
                desktop: { flex: 2, height: 450 }
            }
        },
        visible: true
    },
    
    scatterChart: {
        component: "UniversalChart",
        title: "Scatter Chart",
        icon: "mdi-chart-scatter-plot",
        props: { 
            type: "scatter",
            height: 400
        },
        dataSource: "parts",
        filters: ["program", "phase", "organization"],
        layout: { 
            minHeight: 400, 
            flex: 2,
            breakpoints: {
                mobile: { flex: 1, height: 300 },
                tablet: { flex: 2, height: 350 },
                desktop: { flex: 2, height: 400 }
            }
        },
        visible: true
    },
    
    partsTable: {
        component: "UniversalTable",
        title: "Parts Data Table",
        icon: "mdi-table",
        props: {
            searchable: true,
            filterable: true,
            dense: false,
            itemsPerPage: 15,
            filterField: "organization"
        },
        headers: [
            { text: "Part Number", value: "partNumber", sortable: true },
            { text: "Title", value: "title", sortable: true },
            { text: "Status", value: "status", sortable: true },
            { text: "Organization", value: "organization", sortable: true },
            { text: "Program", value: "program", sortable: true },
            { text: "Phase", value: "phase", sortable: true },
            { text: "Quantity", value: "quantity", sortable: true },
            { text: "Target Release", value: "tgtRelease", sortable: true },
            { text: "Actual Release", value: "actualRelease", sortable: true },
            { 
                text: "Status Comments", 
                value: "statusComment", 
                sortable: false,
                width: "250px",
                component: "StatusCommentDisplay",
                componentProps: item => {
                    return {
                        statusComment: item.statusComment || item.caStatusComment || "",
                        objectId: item.physId || item.partNumber || item.partNo,
                        itemType: "parts",
                        canEdit: false // Set to true when editing is ready
                    };
                }
            }
        ],
        dataSource: "parts",
        filters: ["program", "phase", "organization"],
        layout: { 
            minHeight: 400, 
            flex: 1,
            breakpoints: {
                mobile: { flex: 1, height: 300, itemsPerPage: 5 },
                tablet: { flex: 1, height: 350, itemsPerPage: 10 },
                desktop: { flex: 1, height: 400, itemsPerPage: 15 }
            }
        },
        visible: true
    },
    
    releasePlanner: {
        component: "PartPlanner",
        title: "Part Planning",
        icon: "mdi-calendar-check",
        dataSource: "partPlanner",
        filters: ["program", "phase", "organization"],
        layout: { 
            minHeight: 600, 
            flex: 3,
            breakpoints: {
                mobile: { flex: 1, height: 400 },
                tablet: { flex: 2, height: 500 },
                desktop: { flex: 3, height: 600 }
            }
        }
    },
    
    // Form widget for data entry
    contactForm: {
        component: "UniversalForm",
        title: "Contact Form",
        icon: "mdi-form-select",
        description: "Dynamic form for collecting contact information",
        category: "form",
        props: {
            title: "Contact Information",
            description: "Please fill out your contact details",
            fields: [
                {
                    name: "firstName",
                    type: "text",
                    label: "First Name",
                    required: true,
                    cols: 6
                },
                {
                    name: "lastName", 
                    type: "text",
                    label: "Last Name",
                    required: true,
                    cols: 6
                },
                {
                    name: "email",
                    type: "email", 
                    label: "Email Address",
                    required: true,
                    cols: 12
                },
                {
                    name: "organization",
                    type: "select",
                    label: "Organization",
                    options: ["Engineering", "Quality", "Procurement", "Management"],
                    required: true,
                    cols: 6
                },
                {
                    name: "contactDate",
                    type: "date",
                    label: "Preferred Contact Date",
                    cols: 6
                },
                {
                    name: "message",
                    type: "textarea",
                    label: "Message",
                    rows: 4,
                    cols: 12
                },
                {
                    name: "newsletter",
                    type: "checkbox",
                    label: "Subscribe to newsletter",
                    cols: 12
                }
            ],
            fieldsPerRow: 2,
            submitEndpoint: "/api/contacts",
            showSubmit: true,
            showReset: true,
            submitText: "Submit Contact"
        },
        dataSource: "forms",
        filters: [],
        layout: { 
            minHeight: 500, 
            flex: 2,
            breakpoints: {
                mobile: { flex: 1, height: 600 },
                tablet: { flex: 2, height: 550 },
                desktop: { flex: 2, height: 500 }
            }
        },
        visible: true
    },

    // Part planning form
    partPlanningForm: {
        component: "UniversalForm", 
        title: "Part Planning Form",
        icon: "mdi-clipboard-text",
        description: "Form for planning new parts",
        category: "form",
        props: {
            title: "New Part Planning",
            description: "Enter details for part planning",
            fields: [
                {
                    name: "partNumber",
                    type: "text",
                    label: "Part Number",
                    required: true,
                    cols: 6
                },
                {
                    name: "title",
                    type: "text", 
                    label: "Part Title",
                    required: true,
                    cols: 6
                },
                {
                    name: "organization",
                    type: "select",
                    label: "Organization",
                    options: ["Engineering", "Quality", "Procurement"],
                    required: true,
                    cols: 4
                },
                {
                    name: "program",
                    type: "select", 
                    label: "Program",
                    options: ["Program A", "Program B", "Program C"],
                    required: true,
                    cols: 4
                },
                {
                    name: "phase",
                    type: "select",
                    label: "Phase", 
                    options: ["Phase 1", "Phase 2", "Phase 3"],
                    required: true,
                    cols: 4
                },
                {
                    name: "quantity",
                    type: "number",
                    label: "Quantity",
                    required: true,
                    min: 1,
                    cols: 6
                },
                {
                    name: "targetRelease",
                    type: "date",
                    label: "Target Release Date", 
                    required: true,
                    cols: 6
                },
                {
                    name: "description",
                    type: "textarea",
                    label: "Description",
                    rows: 3,
                    cols: 12
                }
            ],
            fieldsPerRow: 3,
            submitEndpoint: "/api/parts",
            showSubmit: true,
            showReset: true,
            submitText: "Create Part"
        },
        dataSource: "partPlanner",
        filters: ["organization", "program", "phase"],
        layout: { 
            minHeight: 600, 
            flex: 3,
            breakpoints: {
                mobile: { flex: 1, height: 700 },
                tablet: { flex: 2, height: 650 },
                desktop: { flex: 3, height: 600 }
            }
        }
    }
};

// Data Sources - Configuration for all data adapters
export const DATA_SOURCES = {
    // Parts data source (main data for charts and tables)
    parts: {
        endpoint: "/api/parts",
        localData: () => import("@/assets/config/app-data.json").then(module => module.default.parts),
        chartAdapter: data => {
            if (!data || !Array.isArray(data)) {
                return { labels: [], datasets: [] };
            }
            
            // Count parts by organization for chart visualization
            const orgCounts = {};
            data.forEach(part => {
                orgCounts[part.organization] = (orgCounts[part.organization] || 0) + 1;
            });
            
            return {
                labels: Object.keys(orgCounts),
                datasets: [{
                    label: "Parts by Organization",
                    data: Object.values(orgCounts),
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(54, 162, 235, 0.2)",
                        "rgba(255, 205, 86, 0.2)",
                        "rgba(75, 192, 192, 0.2)"
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 205, 86, 1)",
                        "rgba(75, 192, 192, 1)"
                    ],
                    borderWidth: 1
                }]
            };
        },
        tableAdapter: data => data || [],
        filters: ["program", "phase", "organization"]
    },

    // CAS data source (Change Actions)
    cas: {
        endpoint: "/internal/resources/AttributeValQuery/retrievePhaseCAs",
        localData: () => import("@/assets/config/app-data.json").then(module => module.default.cas || []),
        chartAdapter: data => {
            if (!data || !Array.isArray(data)) {
                return { labels: [], datasets: [] };
            }
            
            // Group by date for Target vs Actual line chart
            const dateMap = new Map();
            data.forEach(ca => {
                const targetDate = ca.targetReleaseDate;
                const actualDate = ca.actualReleaseDate;
                
                if (!targetDate) return;
                
                const date = new Date(targetDate).toLocaleDateString();
                if (!dateMap.has(date)) {
                    dateMap.set(date, { target: 0, actual: 0 });
                }
                dateMap.get(date).target++;
                
                if (actualDate && actualDate !== "N/A" && actualDate !== null && actualDate !== "" && actualDate.trim() !== "") {
                    const actualFormattedDate = new Date(actualDate).toLocaleDateString();
                    if (!dateMap.has(actualFormattedDate)) {
                        dateMap.set(actualFormattedDate, { target: 0, actual: 0 });
                    }
                    dateMap.get(actualFormattedDate).actual++;
                }
            });
            
            const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(a) - new Date(b));
            return {
                labels: sortedDates,
                datasets: [
                    {
                        label: "Target Completions",
                        data: sortedDates.map(date => dateMap.get(date).target),
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: "Actual Completions",
                        data: sortedDates.map(date => dateMap.get(date).actual),
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        tension: 0.1,
                        fill: false
                    }
                ]
            };
        },
        tableAdapter: data => data || [],
        // Table columns configuration for CAS
        tableColumns: [
            { text: "CA Number", value: "name", sortable: true, width: "140px" },
            { text: "Revision", value: "revision", sortable: true, width: "80px" },
            { text: "Summary", value: "changeSummary", sortable: true, width: "200px" },
            { text: "Target Release", value: "targetReleaseDate", sortable: true, width: "120px" },
            { text: "Current State", value: "currentState", sortable: true, width: "120px" },
            { text: "Organization", value: "organization", sortable: true, width: "150px" },
            { text: "Responsible Engineer", value: "respEngr", sortable: true, width: "150px" },
            { 
                text: "Status Comments", 
                value: "statusComment", 
                sortable: false,
                width: "250px",
                component: "StatusCommentDisplay",
                componentProps: item => {
                    // Debug logging for field access
                    if (item.name === "CA-00000268" || item.caNumber === "CA-00000268") {
                        console.log("🔍 WidgetRegistry componentProps for CA-00000268:", {
                            item,
                            statusComment: item.statusComment,
                            caStatusComment: item.caStatusComment,
                            directFieldAccess: item["statusComment"],
                            allStatusFields: Object.keys(item).filter(key => 
                                key.toLowerCase().includes("status") || 
                                key.toLowerCase().includes("comment")
                            ).reduce((acc, key) => {
                                acc[key] = item[key];
                                return acc;
                            }, {})
                        });
                    }
                    
                    return {
                        statusComment: item.statusComment || item.caStatusComment || "",
                        objectId: item.physId || item.caNumber || item.name,
                        itemType: "cas",
                        canEdit: false // Set to true when editing is ready
                    };
                }
            }
        ],
        filters: ["program", "phase", "organization"]
    },

    // CRS data source (Change Requests)
    crs: {
        endpoint: "/internal/resources/AttributeValQuery/retrievePhaseCRs",
        localData: () => import("@/assets/config/app-data.json").then(module => module.default.crs || []),
        chartAdapter: data => {
            console.log("🔍 CRS Chart Adapter - Input data:", data);
            
            if (!data || !Array.isArray(data)) {
                console.log("❌ CRS Chart Adapter - No data or not array");
                return { labels: [], datasets: [] };
            }
            
            // Group by date for Target vs Actual line chart
            const dateMap = new Map();
            data.forEach((cr, index) => {
                console.log(`🔍 CRS Chart Adapter - Processing CR ${index}:`, {
                    crNumber: cr.crNumber,
                    targetReleaseDate: cr.targetReleaseDate,
                    actualCompleteDate: cr.actualCompleteDate,
                    actualReleaseDate: cr.actualReleaseDate,
                    completedDate: cr.completedDate,
                    allFields: Object.keys(cr)
                });
                
                const targetDate = cr.targetReleaseDate;
                const actualDate = cr.actualCompleteDate || cr.actualReleaseDate || cr.completedDate;
                
                if (!targetDate) {
                    console.log(`⚠️ CRS Chart Adapter - No target date for CR ${cr.crNumber}`);
                    return;
                }
                
                const date = new Date(targetDate).toLocaleDateString();
                if (!dateMap.has(date)) {
                    dateMap.set(date, { target: 0, actual: 0 });
                }
                dateMap.get(date).target++;
                
                if (actualDate && actualDate !== "N/A" && actualDate !== null && actualDate !== "" && actualDate.trim() !== "") {
                    console.log(`✅ CRS Chart Adapter - Found actual date for CR ${cr.crNumber}: ${actualDate}`);
                    const actualFormattedDate = new Date(actualDate).toLocaleDateString();
                    if (!dateMap.has(actualFormattedDate)) {
                        dateMap.set(actualFormattedDate, { target: 0, actual: 0 });
                    }
                    dateMap.get(actualFormattedDate).actual++;
                } else {
                    console.log(`❌ CRS Chart Adapter - No actual date for CR ${cr.crNumber} (value: ${actualDate})`);
                }
            });
            
            const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(a) - new Date(b));
            
            console.log("🔍 CRS Chart Adapter - DateMap:", Object.fromEntries(dateMap));
            console.log("🔍 CRS Chart Adapter - Sorted dates:", sortedDates);
            
            const result = {
                labels: sortedDates,
                datasets: [
                    {
                        label: "Target Completions",
                        data: sortedDates.map(date => dateMap.get(date).target),
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: "Actual Completions",
                        data: sortedDates.map(date => dateMap.get(date).actual),
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        tension: 0.1,
                        fill: false
                    }
                ]
            };
            
            console.log("🔍 CRS Chart Adapter - Final result:", result);
            return result;
        },
        tableAdapter: data => data || [],
        // Table columns configuration for CRS
        tableColumns: [
            { text: "CR Number", value: "crNumber", sortable: true, width: "140px" },
            { text: "Title", value: "title", sortable: true, width: "200px" },
            { text: "Status", value: "status", sortable: true, width: "120px" },
            { text: "Priority", value: "priority", sortable: true, width: "100px" },
            { text: "Organization", value: "organization", sortable: true, width: "150px" },
            { text: "Assignee", value: "assignee", sortable: true, width: "150px" },
            { text: "Created Date", value: "createdDate", sortable: true, width: "120px" },
            { 
                text: "Status Comments", 
                value: "statusComment", 
                sortable: false,
                width: "250px",
                component: "StatusCommentDisplay",
                componentProps: item => {
                    return {
                        statusComment: item.statusComment || item.caStatusComment || "",
                        objectId: item.physId || item.crNumber,
                        itemType: "crs",
                        canEdit: false // Set to true when editing is ready
                    };
                }
            }
        ],
        filters: ["program", "phase", "organization"]
    },

    // Stats data source (aggregated metrics for dashboards)

    // BOM data source (specific to BomViewer)
    bom: {
        endpoint: "/api/bom",
        localData: () => import("@/assets/config/app-data.json").then(module => module.default.bom),
        chartAdapter: data => {
            if (!data || !Array.isArray(data)) {
                return { labels: [], datasets: [] };
            }
            
            // Count parts by owner for BOM visualization
            const ownerCounts = {};
            data.forEach(item => {
                ownerCounts[item.owner] = (ownerCounts[item.owner] || 0) + 1;
            });
            
            return {
                labels: Object.keys(ownerCounts),
                datasets: [{
                    label: "BOM Items by Owner",
                    data: Object.values(ownerCounts),
                    backgroundColor: [
                        "rgba(153, 102, 255, 0.2)",
                        "rgba(255, 159, 64, 0.2)",
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(54, 162, 235, 0.2)"
                    ],
                    borderColor: [
                        "rgba(153, 102, 255, 1)",
                        "rgba(255, 159, 64, 1)",
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)"
                    ],
                    borderWidth: 1
                }]
            };
        },
        tableAdapter: data => data || []
    },

    // Part Planner data source (specific to PartPlanner form)
    partPlanner: {
        endpoint: "/api/part-planner",
        localData: () => import("@/assets/config/app-data.json").then(module => module.default.partPlanner?.partData || {}),
        chartAdapter: data => data || { labels: [], datasets: [] },
        tableAdapter: data => data ? [data] : []
    },

    // Forms data source (for UniversalForm widgets)
    forms: {
        endpoint: "/api/forms",
        localData: () => import("@/assets/config/app-data.json").then(module => module.default.forms || []),
        chartAdapter: data => data || { labels: [], datasets: [] },
        tableAdapter: data => data || []
    }
};

export const LAYOUT_PRESETS = {
    default: [
        { id: "lineChart", row: 0, visible: true },
        { id: "barChart", row: 0, visible: true },
        { id: "partsTable", row: 1, visible: true },
        { id: "releasePlanner", row: 2, visible: true }
    ],
    
    minimal: [
        { id: "lineChart", row: 0, visible: true },
        { id: "partsTable", row: 1, visible: true }
    ],
    
    comprehensive: [
        { id: "lineChart", row: 0, visible: true },
        { id: "barChart", row: 1, visible: true },
        { id: "partsTable", row: 1, visible: true },
        { id: "bomViewer", row: 3, visible: true },
        { id: "releasePlanner", row: 4, visible: true }
    ]
};

export const DATA_TYPE_MAPPING = {
    Parts: "parts",
    CR: "cr", 
    CA: "ca"
};

// Main WidgetRegistry object
export const WidgetRegistry = {
    getDefaultDashboard() {
        // Make all widgets visible by default
        return {
            id: "default",
            title: "Default Dashboard",
            widgets: Object.keys(WIDGET_DEFINITIONS).map(key => ({
                ...WIDGET_DEFINITIONS[key],
                id: key,
                visible: true
            }))
        };
    },

    getAvailableWidgets() {
        return Object.keys(WIDGET_DEFINITIONS).map(key => ({
            ...WIDGET_DEFINITIONS[key],
            id: key
        }));
    }
};

// Default export
export default WidgetRegistry;
