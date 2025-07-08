import Vue from "vue";
import Vuetify from "vuetify/lib";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(Vuetify);

const theme21x = {
    "ds-primary": "#005686",
    "ds-grey-0": "#F4F5F6",
    "ds-grey-1": "#F1F1F1",
    "ds-grey-2": "#E2E4E3",
    "ds-grey-3": "#D1D4D4",
    "ds-grey-4": "#B4B6BA",
    "ds-grey-5": "#77797C",
    "ds-grey-6": "#3D3D3D",
    "ds-steel-0": "#D5E8F2",
    "ds-steel-1": "#005686",
    "ds-steel-2": "#003C5A",
    "ds-blue-0": "#78BEFA",
    "ds-blue-1": "#42A2DA",
    "ds-blue-2": "#368EC4",
    "ds-green-0": "#EDF6EB",
    "ds-green-1": "#57B847",
    "ds-green-2": "#477738",
    "ds-red-0": "#FFF0EE",
    "ds-red-1": "#EA4F37",
    "ds-red-2": "#844138",
    "ds-orange-0": "#FFF3E9",
    "ds-orange-1": "#E87B00",
    "ds-orange-2": "#8F4C00",
    "ds-cyan-0": "#F2F5F7",
    "ds-cyan-1": "#00B8DE",
    "ds-cyan-2": "#0087A3",
    "ds-gradient-0": "#005686",
    "ds-gradient-1": "#136A97",
    "ds-gradient-2": "#267EA6",
    "ds-gradient-3": "#3991B5",
    "ds-gradient-4": "#4DA3C2",
    "ds-gradient-5": "#60B5CE",
    "ds-gradient-6": "#73C5D8",
    "ds-gradient-7": "#86D4E1",
    "ds-gradient-8": "#99E1E9"
};

export default new Vuetify({
    icons: {
        iconfont: "mdi"
    },
    theme: {
        themes: {
            light: theme21x
        },
        options: {
            customProperties: true
        }
    }
});
