<!-- Release Planner Panel Wrapper - Uses existing PartPlanner component -->
<template>
    <div class="release-planner-panel">
        <PartPlanner />
    </div>
</template>

<style scoped>
.release-planner-panel {
    width: 100%;
    height: 100%;
}
</style>

<script>
import PartPlanner from "@/components/part-planning/PartPlanner.vue";

export default {
    name: "ReleasePlannerPanel",
    components: {
        PartPlanner
    }
};
</script>
