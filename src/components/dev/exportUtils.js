// Utility for generating Vue SFC export code for widgets
export function generateVueExportCode({ fileName, widgets, gridLayout, includeComments, includeStyles }) {
    if (!Array.isArray(widgets) || !Array.isArray(gridLayout)) {
        return "// Error: widgets or gridLayout prop missing or invalid.";
    }
    const componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    const kebabCaseName = fileName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const lines = [];
    if (includeComments) {
        lines.push("<!-- Generated Widget Component -->");
        lines.push("<!-- Created: " + new Date().toISOString() + " -->");
    }
    lines.push("<template>");
    lines.push("  <div class=\"" + kebabCaseName + "-widget\">");
    lines.push("    <v-card>");
    lines.push("      <v-card-title>");
    lines.push("        Custom Widget");
    lines.push("      </v-card-title>");
    lines.push("      <v-card-text>");
    lines.push("        <!-- Add your widget content here -->");
    lines.push("      </v-card-text>");
    lines.push("    </v-card>");
    lines.push("  </div>");
    lines.push("</template>");
    lines.push("");
    lines.push("<script>");
    lines.push("export default {");
    lines.push("  name: \"" + componentName + "\",");
    lines.push("  props: {},");
    lines.push("  data() {");
    lines.push("    return {};");
    lines.push("  }");
    lines.push("};");
    lines.push("</script>");
    if (includeStyles) {
        lines.push("");
        lines.push("<style scoped>");
        lines.push("." + kebabCaseName + "-widget {");
        lines.push("  padding: 16px;");
        lines.push("}");
        lines.push("." + kebabCaseName + "-widget .v-card {");
        lines.push("  border-radius: 8px;");
        lines.push("}");
        lines.push("</style>");
    }
    return lines.join("\n");
}
