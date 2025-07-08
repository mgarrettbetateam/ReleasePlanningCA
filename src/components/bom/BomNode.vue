<template>
    <li
        :role="'treeitem'"
        :aria-expanded="node.children && node.children.length > 0 ? expanded : undefined"
    >
        <div
            class="node-label"
            :class="{ expandable: node.children && node.children.length > 0 }"
        >
            <!-- Expand/collapse button for nodes with children -->
            <span
                v-if="node.children && node.children.length > 0"
                class="toggle-btn"
                @click.stop="toggle"
            >
                {{ expanded ? '-' : '+' }}
            </span>
            <!-- Node label: toggles expand/collapse or emits selection -->
            <span
                class="part-name"
                @click="handlePartClick"
            >
                {{ node.name || 'Unnamed' }}
            </span>
        </div>
        <!-- Recursive rendering of child nodes -->
        <ul v-show="expanded" v-if="node.children && node.children.length > 0" class="bom-list">
            <BomNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                @part-selected="$emit('part-selected', $event)"
            />
        </ul>
    </li>
</template>

<style scoped>

</style>

<script>
export default {
  name: "BomNode",
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      expanded: false // Controls expand/collapse state
    };
  },
  methods: {
    // Toggle expand/collapse for nodes with children
    toggle() {
      this.expanded = !this.expanded;
      // Optionally emit for parent tracking:
      // this.$emit('toggle', this.node, this.expanded);
    },
    // Handle click on part name: expand/collapse if expandable, emit selection if leaf
    handlePartClick() {
      if (this.node.children && this.node.children.length > 0) {
        this.toggle();
      } else {
        this.$emit("part-selected", this.node);
      }
    }
  }
};
</script>