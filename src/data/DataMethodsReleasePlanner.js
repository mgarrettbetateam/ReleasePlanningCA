import dataService from "../data/DataServiceBase.js";

export default function ({ _widget, _requirejsPromise, _IssueService }) {
  return {
    /**
     * Compute statistics for an array of parts.
     */
    computeStatsForArray(partsArray) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const stats = {
        totalCount: partsArray.length,
        releasedCount: 0,
        thisWeekCount: 0,
        nextWeekCount: 0,
        next30DaysCount: 0,
        overdueCount: 0,
        thisWeekPlanned: 0,
        thisWeekReleased: 0,
        nextWeekPlanned: 0,
        nextWeekReleased: 0,
        next30DaysPlanned: 0,
        next30DaysReleased: 0,
        toDatePlanned: 0,
        toDateReleased: 0
      };

      stats.releasedCount = partsArray.filter(p => p.currentState === "RELEASED").length;

      const toDateParts = partsArray.filter(part => {
        const tgt = new Date(part.tgtRelease);
        tgt.setHours(0, 0, 0, 0);
        return tgt.getTime() <= currentDate.getTime();
      });
      stats.toDatePlanned = toDateParts.length;
      stats.toDateReleased = toDateParts.filter(p => p.currentState === "RELEASED").length;

      const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(currentDate);
      const [startNextWeek, endNextWeek] = this.getNextWeekRange(currentDate);

      // This Week
      const thisWeekParts = partsArray.filter(part => {
        const tgt = new Date(part.tgtRelease);
        tgt.setHours(0, 0, 0, 0);
        return tgt.getTime() >= startOfWeek && tgt.getTime() <= endOfWeek;
      });
      stats.thisWeekPlanned = thisWeekParts.length;
      stats.thisWeekReleased = thisWeekParts.filter(p => p.currentState === "RELEASED").length;
      stats.thisWeekCount = thisWeekParts.length;

      // Next Week
      const nextWeekParts = partsArray.filter(part => {
        const tgt = new Date(part.tgtRelease);
        tgt.setHours(0, 0, 0, 0);
        return tgt.getTime() >= startNextWeek && tgt.getTime() <= endNextWeek;
      });
      stats.nextWeekPlanned = nextWeekParts.length;
      stats.nextWeekReleased = nextWeekParts.filter(p => p.currentState === "RELEASED").length;
      stats.nextWeekCount = nextWeekParts.length;

      // Next 30 Days
      const DAYS_IN_30 = 30;
      const nowMs = currentDate.getTime();
      const next30 = new Date(currentDate);
      next30.setDate(next30.getDate() + DAYS_IN_30);
      const next30Ms = next30.getTime();

      const next30Parts = partsArray.filter(part => {
        const tgt = new Date(part.tgtRelease);
        tgt.setHours(0, 0, 0, 0);
        return tgt.getTime() >= nowMs && tgt.getTime() <= next30Ms;
      });
      stats.next30DaysPlanned = next30Parts.length;
      stats.next30DaysReleased = next30Parts.filter(p => p.currentState === "RELEASED").length;
      stats.next30DaysCount = next30Parts.length;

      // Overdue
      stats.overdueCount = partsArray.filter(part => {
        const tgt = new Date(part.tgtRelease);
        tgt.setHours(0, 0, 0, 0);
        return tgt.getTime() < currentDate.getTime() && part.currentState !== "RELEASED";
      }).length;

      return stats;
    },

    async fetchPrograms() {
      try {
        const programs = await dataService.fetchPrograms();
        this.programs = programs || [];

        if (this.programs.includes("CX300 Pre-Production Builds")) {
          this.selectedProgram = "CX300 Pre-Production Builds";
        } else if (this.programs.length > 0) {
          this.selectedProgram = this.programs[0];
        }

        if (this.selectedProgram) {
          await this.fetchPhases();
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("API not available, using mock data for programs. Error:", err.message);
        }
        // Fallback to mock data for template demo
        this.programs = ["CX300 Pre-Production Builds", "Demo Program 1", "Demo Program 2"];
        this.selectedProgram = "CX300 Pre-Production Builds";
        await this.fetchPhases();
      }
    },

    onProgramChange() {
      if (this.selectedProgram) {
        this.fetchPhases();
      }
    },

    async fetchPhases() {
      this.loading = true;
      try {
        const phases = await dataService.fetchPhases(this.selectedProgram);
        this.phases = phases || [];

        if (this.phases.length > 0) {
          this.selectedPhase = this.phases[0];
          await this.fetchData(this.selectedPhase);
        } else if (process.env.NODE_ENV === "development") {
          console.warn("No phases retrieved");
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("API not available, using mock data for phases. Error:", error.message);
        }
        // Fallback to mock data
        this.phases = ["Phase 1", "Phase 2", "Phase 3"];
        this.selectedPhase = "Phase 1";
        await this.fetchData(this.selectedPhase);
      } finally {
        this.loading = false;
      }
    },

    async handlePhaseChange(phase) {
      if (!phase) return;
      this.loading = true;
      await this.fetchData(phase);
      this.loading = false;
    },

    async fetchData(phase) {
      this.loading = true;
      try {
        const parts = await dataService.fetchParts(phase);
        this.tableData = Array.isArray(parts)
          ? parts.map(p => ({
              partNo: p.partNumber,
              rev: p.revision,
              description: p.description,
              organization: p.organization || "Unknown",
              tgtRelease: p.targetReleaseDate,
              actualRelease: p.actualReleaseDate || "N/A",
              currentState: p.currentState,
              physId: p.physId
            }))
          : [];

        // Parallel fetch for CA Stats (if needed)
        await this.fetchCAStatsForParts(this.tableData);

        const orgSet = new Set(this.tableData.map(r => r.organization));
        this.organizations = ["All", ...orgSet];

        this.updateFinalData();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("API not available, using mock data for parts. Error:", error.message);
        }
        // Fallback to mock data for template demo
        this.tableData = this.generateMockPartsData();
        
        const orgSet = new Set(this.tableData.map(r => r.organization));
        this.organizations = ["All", ...orgSet];
        
        this.updateFinalData();
      } finally {
        this.loading = false;
      }
    },

    generateMockPartsData() {
      const organizations = ["Engineering", "Manufacturing", "Quality", "Procurement"];
      const states = ["IN_WORK", "RELEASED", "REVIEW", "PENDING"];
      const mockData = [];
      
      const MOCK_PARTS_COUNT = 25;
      const DATE_RANGE_DAYS = 60;
      const DATE_OFFSET_DAYS = 30;
      const ACTUAL_DATE_VARIANCE = 10;
      const ACTUAL_DATE_OFFSET = 5;
      const PART_NUMBER_PAD_LENGTH = 3;
      const MAX_REVISION_NUMBER = 5;
      const ACTUAL_RELEASE_PROBABILITY = 0.3;
      
      for (let i = 1; i <= MOCK_PARTS_COUNT; i++) {
        const baseDate = new Date();
        const randomDays = Math.floor(Math.random() * DATE_RANGE_DAYS) - DATE_OFFSET_DAYS;
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + randomDays);
        
        const actualDate = new Date(targetDate);
        actualDate.setDate(targetDate.getDate() + Math.floor(Math.random() * ACTUAL_DATE_VARIANCE) - ACTUAL_DATE_OFFSET);
        
        mockData.push({
          partNo: `PART-${String(i).padStart(PART_NUMBER_PAD_LENGTH, "0")}`,
          rev: `R${Math.floor(Math.random() * MAX_REVISION_NUMBER) + 1}`,
          description: `Demo Part ${i} Description`,
          organization: organizations[Math.floor(Math.random() * organizations.length)],
          tgtRelease: targetDate.toISOString().split("T")[0],
          actualRelease: Math.random() > ACTUAL_RELEASE_PROBABILITY ? actualDate.toISOString().split("T")[0] : "N/A",
          currentState: states[Math.floor(Math.random() * states.length)],
          physId: `phys-id-${i}`
        });
      }
      
      return mockData;
    },

    async fetchCAStatsForParts(parts) {
      if (!Array.isArray(parts) || parts.length === 0) return;

      const topRows = 20; // Number of top rows to prioritize

      // Process top rows first for immediate UI feedback
      const firstBatch = parts.slice(0, topRows);
      const restBatch = parts.slice(topRows);

      // Use ApiService for the first batch (high priority)
      await this.processCAStatsBatch(firstBatch);
      
      // Load the rest in the background (do not await)
      this.processCAStatsBatch(restBatch);
    },

    async processCAStatsBatch(batch) {
      await Promise.allSettled(
        batch.map(async (part, index) => {
          try {
            const caStats = await dataService.fetchCAStats(part.physId, index);
            if (typeof this.$set === "function") {
              this.$set(part, "caStats", caStats);
            } else {
              part.caStats = caStats;
            }
          } catch (e) {
            if (typeof this.$set === "function") {
              this.$set(part, "caStats", null);
            } else {
              part.caStats = null;
            }
          }
        })
      );
    },

    updateFinalData() {
      // Defensive: ensure tableData is always an array
      if (!Array.isArray(this.tableData)) {
        this.tableData = [];
      }

      let orgResult = [...this.tableData];
      if (this.selectedOrganization !== "All") {
        orgResult = orgResult.filter(r => r.organization === this.selectedOrganization);
      }
      this.orgData = orgResult;
      this.allStats = this.computeStatsForArray(this.orgData);

      let finalSubset = [...this.orgData];
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Define constant for 30 days to avoid magic number
      const DAYS_IN_30 = 30;

      switch (this.currentFilter) {
        case "thisWeek": {
          const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(currentDate);
          finalSubset = finalSubset.filter(part => {
            const tgt = new Date(part.tgtRelease);
            tgt.setHours(0, 0, 0, 0);
            return tgt.getTime() >= startOfWeek && tgt.getTime() <= endOfWeek;
          });
          break;
        }
        case "nextWeek": {
          const [startNextWeek, endNextWeek] = this.getNextWeekRange(currentDate);
          finalSubset = finalSubset.filter(part => {
            const tgt = new Date(part.tgtRelease);
            tgt.setHours(0, 0, 0, 0);
            return tgt.getTime() >= startNextWeek && tgt.getTime() <= endNextWeek;
          });
          break;
        }
        case "next30Days": {
          const nowMs = currentDate.getTime();
          const next30 = new Date(currentDate);
          next30.setDate(currentDate.getDate() + DAYS_IN_30);
          const next30Ms = next30.getTime();
          finalSubset = finalSubset.filter(part => {
            const tgt = new Date(part.tgtRelease);
            tgt.setHours(0, 0, 0, 0);
            return tgt.getTime() >= nowMs && tgt.getTime() <= next30Ms;
          });
          break;
        }
        case "overdue": {
          finalSubset = finalSubset.filter(part => {
            const tgt = new Date(part.tgtRelease);
            tgt.setHours(0, 0, 0, 0);
            return tgt.getTime() < currentDate.getTime() && part.currentState !== "RELEASED";
          });
          break;
        }
        default:
          finalSubset = [...this.orgData];
      }

      this.filteredTableData = finalSubset;
      this.filteredStats = this.computeStatsForArray(this.filteredTableData);

      this.updateChartFromFiltered();
    },

    toggleSidebarFilter(filterType) {
      if (this.currentFilter === filterType) {
        this.currentFilter = "all";
      } else {
        this.currentFilter = filterType;
      }
      this.updateFinalData();
    },

    updateChartFromFiltered() {
      const parts = this.filteredTableData;
      if (!parts || parts.length === 0) {
        this.chartData.labels = [];
        this.chartData.datasets = [];
        return;
      }

      const dateStamps = parts.map(part => {
        const d = new Date(part.tgtRelease);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      });
      const minDate = Math.min(...dateStamps);
      const maxDate = Math.max(...dateStamps);

      const timeLabels = [];
      const MS_PER_SECOND = 1000;
      const MINUTES_PER_HOUR = 60;
      const SECONDS_PER_MINUTE = 60;
      const HOURS_PER_DAY = 24;
      const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
      for (let day = minDate; day <= maxDate; day += MS_PER_DAY) {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        timeLabels.push(d.toLocaleDateString());
      }

      const targetCumulativeData = [];
      const actualCumulativeData = [];

      timeLabels.forEach(label => {
        const labelDateMs = new Date(label).getTime();
        const tgtCount = parts.filter(part => {
          const dt = new Date(part.tgtRelease);
          dt.setHours(0, 0, 0, 0);
          return dt.getTime() <= labelDateMs;
        }).length;

        const actCount = parts.filter(part => {
          if (part.actualRelease === "N/A") return false;
          const dt = new Date(part.actualRelease);
          dt.setHours(0, 0, 0, 0);
          return dt.getTime() <= labelDateMs;
        }).length;

        targetCumulativeData.push(tgtCount);
        actualCumulativeData.push(actCount);
      });

      if (targetCumulativeData[targetCumulativeData.length - 1] !== parts.length) {
        targetCumulativeData[targetCumulativeData.length - 1] = parts.length;
      }

      this.chartData.labels = timeLabels;
      this.chartData.datasets = [
        {
          label: "Target Release Progression",
          data: targetCumulativeData,
          borderColor: "#42A5F5",
          fill: false
        },
        {
          label: "Actual Release Progression",
          data: actualCumulativeData.map((val, index) => {
            const dayMs = new Date(timeLabels[index]).getTime();
            return dayMs <= Date.now() ? val : null;
          }),
          borderColor: "#66BB6A",
          fill: false
        }
      ];
    },

    getCurrentWeekRange(date) {
      const DAYS_IN_WEEK = 7;
      const now = new Date(date);
      now.setHours(0, 0, 0, 0);
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + (DAYS_IN_WEEK - 1));
      return [start.getTime(), end.getTime()];
    },

    getNextWeekRange(date) {
      const DAYS_IN_WEEK = 7;
      const [startOfThisWeek] = this.getCurrentWeekRange(date);
      const startNextWeek = new Date(startOfThisWeek);
      startNextWeek.setDate(startNextWeek.getDate() + DAYS_IN_WEEK);
      const endNextWeek = new Date(startNextWeek);
      endNextWeek.setDate(endNextWeek.getDate() + (DAYS_IN_WEEK - 1));
      return [startNextWeek.getTime(), endNextWeek.getTime()];
    }
  };
}