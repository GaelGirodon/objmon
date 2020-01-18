/**
 * Color by progress value.
 */
const colors = {
  0: { red: 255, green: 0, blue: 0 },
  25: { red: 255, green: 165, blue: 0 },
  50: { red: 255, green: 215, blue: 0 },
  75: { red: 173, green: 255, blue: 47 },
  100: { red: 50, green: 205, blue: 50 }
};

/**
 * Vue.js application.
 */
const app = new Vue({
  el: "#app",
  data: {
    // Data
    title: "",
    subtitle: "",
    objectives: [],
    subjects: [],
    lastLoadTime: 0,
    // Filters
    filterSubject: "",
    showObjectiveLabel: false,
    // Sorting
    sorts: [null, "asc", "desc"],
    sortProgress: null,
    sortSubject: null
  },
  methods: {
    /**
     * Load the objective tracking data from the server.
     */
    loadData: function loadData() {
      const self = this;
      axios.get("/data").then(function (res) {
        if (res.data.lastLoadTime !== self.lastLoadTime) {
          Object.assign(self, res.data);
        }
      });
    },

    /**
     * Get the color associated with the subject progress on an objective.
     * @param {number} progress Progress percentage (0-100).
     * @param {number} opacity Color opacity (0-1).
     * @return The RGBA color.
     */
    color: function color(progress, opacity) {
      opacity = opacity || 1;
      let from, to;
      for (const p in colors) {
        if (p <= progress) {
          from = p;
        }
        if (p >= progress) {
          to = p;
          break;
        }
      }
      from = from && from >= 0 ? from : 0;
      to = to && to <= 100 ? to : 100;
      const fromRate = (to - progress) / ((to - from) || 100);
      const toRate = 1 - fromRate;
      const avg = {
        red: Math.round(colors[from].red * fromRate + colors[to].red * toRate),
        green: Math.round(colors[from].green * fromRate + colors[to].green * toRate),
        blue: Math.round(colors[from].blue * fromRate + colors[to].blue * toRate)
      }
      return "rgba(" + avg.red + "," + avg.green + "," + avg.blue + "," + opacity + ")";
    },
    
    /**
     * Check whether an objective is evaluated on a subject.
     * @param {*} subject The subject.
     * @param {*} objective The objective.
     * @return true or false.
     */
    isTracking: function isTracking(subject, objective) {
      return subject && subject.objectives && subject.objectives[objective.id];
    },

    /**
     * Compute the bar width from a progress value.
     * @param {number} progress Progress percentage (0-100).
     * @return Bar width (0-100).
     */
    bar: function bar(progress) {
      return Math.min(100, Math.max(progress, 0));
    },

    /**
     * Toggle sort by progress between available sort values
     * (no sort, ascending, descending).
     */
    toggleSortProgress: function toggleSortProgress() {
      this.sortSubject = null;
      this.sortProgress = this.sorts[(this.sorts.indexOf(this.sortProgress) + 1) % this.sorts.length];
    },

    /**
     * Toggle sort by subject name between available sort values
     * (no sort, ascending, descending).
     */
    toggleSortSubject: function toggleSortSubject() {
      this.sortProgress = null;
      this.sortSubject = this.sorts[(this.sorts.indexOf(this.sortSubject) + 1) % this.sorts.length];
    }
  },
  computed: {
    /**
     * Computed subjects, filtered by search value, with global progress calculated,
     * sorted by name, progress or initial sorting.
     * @return Subjects list.
     */
    dynSubjects: function dynSubjects() {
      let subjects = this.subjects
        .filter(s => s.name.toLowerCase().indexOf(this.filterSubject.toLowerCase()) > -1)
        .map(s => {
          if (!s.objectives || s.objectives.length === 0) {
            s.objectives = [];
            s.progress = 0;
            return s;
          }
          let sum = 0;
          for (const o in s.objectives) {
            let obj = s.objectives[o];
            if (Number.isInteger(obj)) {
              obj = (s.objectives[o] = { progress: obj });
            }
            sum += Number.isInteger(obj) ? obj : obj.progress;
          }
          s.progress = Math.round(sum / Object.keys(s.objectives).length);
          return s;
        });
      if (this.sortProgress) {
        subjects = subjects.sort((a, b) => {
          return this.sortProgress === "asc" ? a.progress - b.progress : b.progress - a.progress;
        });
      }
      if (this.sortSubject) {
        subjects = subjects.sort((a, b) => {
          return this.sortSubject === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        });
      }
      return subjects;
    },

    /**
     * Objectives with the associated progress on all subjects.
     * @return Computed objectives list.
     */
    dynObjectives: function dynObjectives() {
      return this.objectives.map(o => {
        const subjects = this.dynSubjects.filter(s => this.isTracking(s, o));
        const sum = subjects.map(s => s.objectives[o.id].progress).reduce((acc, cur) => acc + cur, 0);
        o.progress = Math.round(sum / (subjects.length || 1));
        return o;
      });
    },

    /**
     * Compute the global progress.
     * @return Global progress.
     */
    progress: function progress() {
      const sum = this.dynSubjects.reduce((sum, s) => sum += s.progress, 0);
      return Math.round(sum / (this.dynSubjects.length || 1));
    }
  },

  /**
   * Load the objective tracking data from the server.
   */
  mounted: function mounted() {
    this.loadData();
    setInterval(() => this.loadData(), 2500);
  }
});
