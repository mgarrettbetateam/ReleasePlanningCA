<template>
    <div class="universal-component-container">
        <!-- Text Fields -->
        <v-text-field
            v-if="componentType === 'text-field'"
            :label="label"
            :outlined="outlined"
            :readonly="readonly"
            :prepend-icon="prependIcon"
        />
        
        <v-textarea
            v-else-if="componentType === 'textarea'"
            :label="label"
            :outlined="outlined"
            :readonly="readonly"
        />
        
        <!-- Select -->
        <v-select
            v-else-if="componentType === 'select'"
            :label="label"
            :items="items"
            :outlined="outlined"
        />
        
        <!-- Form Controls -->
        <v-checkbox
            v-else-if="componentType === 'checkbox'"
            :label="label"
        />
        
        <v-radio-group
            v-else-if="componentType === 'radio-group'"
        >
            <v-radio label="Option 1" value="1" />
            <v-radio label="Option 2" value="2" />
        </v-radio-group>
        
        <v-switch
            v-else-if="componentType === 'switch'"
            :label="label"
        />
        
        <v-slider
            v-else-if="componentType === 'slider'"
            :label="label"
            :min="min"
            :max="max"
        />
        
        <v-text-field
            v-else-if="componentType === 'date-picker'"
            :label="label"
            prepend-icon="mdi-calendar"
            readonly
        />
        
        <!-- Buttons -->
        <v-btn
            v-else-if="componentType === 'button'"
            :color="color"
        >
            {{ label }}
        </v-btn>
        
        <v-btn
            v-else-if="componentType === 'button-outlined'"
            outlined
            :color="color"
        >
            {{ label }}
        </v-btn>
        
        <v-btn
            v-else-if="componentType === 'button-text'"
            text
            :color="color"
        >
            {{ label }}
        </v-btn>
        
        <v-btn
            v-else-if="componentType === 'icon-button'"
            icon
        >
            <v-icon>{{ iconName }}</v-icon>
        </v-btn>
        
        <v-btn
            v-else-if="componentType === 'fab'"
            fab
            :color="color"
        >
            <v-icon>{{ iconName }}</v-icon>
        </v-btn>
        
        <v-chip
            v-else-if="componentType === 'chip'"
        >
            {{ label }}
        </v-chip>
        
        <!-- Display Elements -->
        <v-alert
            v-else-if="componentType === 'alert'"
            :type="type"
        >
            {{ content }}
        </v-alert>
        
        <v-card
            v-else-if="componentType === 'card'"
        >
            <v-card-title>{{ title }}</v-card-title>
            <v-card-text>{{ content }}</v-card-text>
        </v-card>
        
        <v-avatar
            v-else-if="componentType === 'avatar'"
            :color="color"
        >
            <v-icon dark>{{ iconName }}</v-icon>
        </v-avatar>
        
        <v-badge
            v-else-if="componentType === 'badge'"
            :content="content"
            :color="color"
        >
            <v-icon large>{{ iconName }}</v-icon>
        </v-badge>
        
        <v-progress-linear
            v-else-if="componentType === 'progress-linear'"
            :value="value || 75"
        />
        
        <v-progress-circular
            v-else-if="componentType === 'progress-circular'"
            :value="value || 75"
        />
        
        <v-list
            v-else-if="componentType === 'list'"
        >
            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>List Item 1</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>List Item 2</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list>
        
        <!-- Layout Components -->
        <v-container
            v-else-if="componentType === 'container'"
        >
            <p>{{ content }}</p>
        </v-container>
        
        <v-row
            v-else-if="componentType === 'row'"
        >
            <v-col>
                <p>{{ content }}</p>
            </v-col>
        </v-row>
        
        <v-col
            v-else-if="componentType === 'col'"
            :cols="cols"
        >
            <p>{{ content }}</p>
        </v-col>
        
        <v-spacer
            v-else-if="componentType === 'spacer'"
        />
        
        <v-divider
            v-else-if="componentType === 'divider'"
        />
        
        <v-sheet
            v-else-if="componentType === 'sheet'"
            class="pa-4"
        >
            <p>{{ content }}</p>
        </v-sheet>
        
        <!-- Fallback for unsupported components -->
        <div
            v-else
            class="unsupported-component"
        >
            <p>Component type "{{ componentType }}" preview not yet implemented</p>
        </div>
    </div>
</template>

<style scoped>
.universal-component-container {
    width: 100%;
    height: 100%;
    padding: 8px;
}

.unsupported-component {
    padding: 16px;
    text-align: center;
    background-color: #f5f5f5;
    border: 1px dashed #ccc;
    border-radius: 4px;
}
</style>

<script>
export default {
  name: "UniversalComponent",
  
  props: {
    title: {
      type: String,
      default: ""
    },
    componentType: {
      type: String,
      required: true
    },
    componentTemplate: {
      type: String,
      required: true
    },
    // Dynamic props passed from the widget configuration
    label: {
      type: String,
      default: ""
    },
    outlined: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: "primary"
    },
    items: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: "info"
    },
    content: {
      type: String,
      default: ""
    },
    iconName: {
      type: String,
      default: "mdi-help"
    },
    value: {
      type: [String, Number, Boolean],
      default: null
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    readonly: {
      type: Boolean,
      default: false
    },
    prependIcon: {
      type: String,
      default: ""
    },
    text: {
      type: Boolean,
      default: false
    },
    icon: {
      type: Boolean,
      default: false
    },
    fab: {
      type: Boolean,
      default: false
    },
    cols: {
      type: Number,
      default: 12
    }
  },
  
  computed: {
    // No computed properties needed since we're using v-if conditionals in template
  }
};
</script>
