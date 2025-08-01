<!-- StatusCommentDisplay.vue -->
<template>
    <div class="status-comment-display">
        <!-- Table Cell Display -->
        <div class="comment-cell" @click="openModal">
            <v-icon 
                small 
                :color="hasComments ? 'primary' : 'grey'"
                class="comment-icon"
            >
                {{ hasComments ? 'mdi-comment-text' : 'mdi-comment-outline' }}
            </v-icon>
            <span class="comment-preview">{{ displayText }}</span>
            <span v-if="commentCount > 0" class="comment-count">{{ commentCount }}</span>
        </div>
    
        <!-- Modal Dialog -->
        <v-dialog v-model="dialog" max-width="700" persistent>
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2">mdi-comment-text</v-icon>
                    <span>Status Comments</span>
                    <v-spacer/>
                    <v-btn 
                        v-if="!editMode && canEdit" 
                        small 
                        color="primary"
                        @click="enterEditMode"
                    >
                        <v-icon small left>mdi-pencil</v-icon>
                        Edit
                    </v-btn>
                    <v-btn 
                        v-if="editMode" 
                        small 
                        color="success"
                        :loading="saving"
                        @click="saveChanges"
                    >
                        <v-icon small left>mdi-content-save</v-icon>
                        Save
                    </v-btn>
                    <v-btn 
                        v-if="editMode" 
                        small 
                        text
                        class="ml-2"
                        @click="cancelEdit"
                    >
                        Cancel
                    </v-btn>
                </v-card-title>
        
                <v-divider/>
        
                <v-card-text class="pa-0">
                    <!-- Read-Only Mode -->
                    <div v-if="!editMode" class="read-mode">
                        <div v-if="!hasComments" class="no-comments">
                            <v-icon color="grey" class="mr-2">mdi-comment-outline</v-icon>
                            No status comments available
                        </div>
                        <div v-else class="comments-timeline">
                            <div 
                                v-for="(comment, index) in parsedComments" 
                                :key="index"
                                class="comment-item"
                            >
                                <div class="comment-timeline-marker">
                                    <v-avatar size="28" :color="getUserColor(comment.author)">
                                        <span class="white--text text-caption">{{ comment.authorInitials }}</span>
                                    </v-avatar>
                                </div>
                                <div class="comment-content">
                                    <div class="comment-header">
                                        <strong>{{ comment.author }}</strong>
                                        <span class="comment-date">{{ formatDate(comment.date) }}</span>
                                    </div>
                                    <div class="comment-message">{{ comment.text }}</div>
                                    <div v-if="comment.eta" class="comment-eta">
                                        <v-chip small color="orange" text-color="white">
                                            <v-icon small left>mdi-clock</v-icon>
                                            ETA: {{ formatDate(comment.eta) }}
                                        </v-chip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
          
                    <!-- Edit Mode -->
                    <div v-else class="edit-mode">
                        <v-textarea
                            v-model="editableComment"
                            label="Status Comments"
                            hint="Format: [YYYY-MM-DD] username: comment - ETA: YYYY-MM-DD"
                            persistent-hint
                            outlined
                            rows="8"
                            auto-grow
                            counter
                            :rules="commentRules"
                        />
            
                        <!-- Add New Comment Helper -->
                        <v-expansion-panels v-if="editMode" class="mt-4">
                            <v-expansion-panel>
                                <v-expansion-panel-header>
                                    <v-icon class="mr-2">mdi-plus</v-icon>
                                    Add New Comment
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <v-form ref="newCommentForm">
                                        <v-textarea
                                            v-model="newComment"
                                            label="New Comment"
                                            placeholder="Enter your comment..."
                                            outlined
                                            rows="3"
                                            :rules="[v => !!v || 'Comment is required']"
                                        />
                                        <v-text-field
                                            v-model="newEta"
                                            label="ETA (optional)"
                                            placeholder="YYYY-MM-DD"
                                            outlined
                                            type="date"
                                        />
                                        <v-btn 
                                            color="primary" 
                                            :disabled="!newComment.trim()"
                                            @click="addNewComment"
                                        >
                                            <v-icon small left>mdi-plus</v-icon>
                                            Add Comment
                                        </v-btn>
                                    </v-form>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </div>
                </v-card-text>
        
                <v-divider/>
        
                <v-card-actions>
                    <v-spacer/>
                    <v-btn text @click="closeModal">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.status-comment-display {
  width: 100%;
}

.comment-cell {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  max-width: 220px;
  min-height: 32px;
}

.comment-cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.comment-icon {
  flex-shrink: 0;
  margin-right: 8px;
}

.comment-preview {
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
}

.comment-count {
  background: #1976d2;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  margin-left: 6px;
  flex-shrink: 0;
}

.read-mode {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.edit-mode {
  padding: 16px;
}

.no-comments {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comments-timeline {
  position: relative;
}

.comment-item {
  display: flex;
  margin-bottom: 20px;
  position: relative;
}

.comment-timeline-marker {
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-date {
  font-size: 11px;
  color: #999;
}

.comment-message {
  margin-bottom: 8px;
  line-height: 1.4;
  word-wrap: break-word;
  font-size: 14px;
}

.comment-eta {
  margin-top: 6px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .comment-cell {
    max-width: 160px;
  }
  
  .comment-preview {
    font-size: 11px;
  }
}
</style>

<script>
export default {
  name: "StatusCommentDisplay",
  props: {
    value: {
      type: String,
      default: ""
    },
    canEdit: {
      type: Boolean,
      default: false
    },
    maxPreviewLength: {
      type: Number,
      default: 50
    }
  },
  
  data() {
    return {
      dialog: false,
      editMode: false,
      editableComment: "",
      originalComment: "",
      newComment: "",
      newEta: "",
      saving: false,
      currentUser: "currentUser", // TODO: Get from auth service
      commentRules: [
        v => v.length <= 5000 || "Comment must be less than 5000 characters"
      ]
    };
  },
  
  computed: {
    statusComment() {
      return this.value || "";
    },
    
    hasComments() {
      return this.statusComment && this.statusComment.trim().length > 0;
    },
    
    displayText() {
      if (!this.hasComments) return "No comments";
      
      // Show preview of the most recent comment (last one chronologically)
      const comments = this.parsedComments;
      if (comments.length > 0) {
        // Since parsedComments is reversed (newest first), get the first item which is the most recent
        const latest = comments[0];
        const previewLength = 40;
        const preview = latest.text.length > previewLength ? latest.text.substring(0, previewLength) + "..." : latest.text;
        return `${latest.author}: ${preview}`;
      }
      
      return "View comments";
    },
    
    commentCount() {
      return this.parsedComments.length;
    },
    
    parsedComments() {
      if (!this.statusComment) return [];
      
      const lines = this.statusComment.split("\n").filter(line => line.trim());
      
      return lines.map(line => {
        // Parse format: [YYYY-MM-DD] username: comment - ETA: YYYY-MM-DD
        const match = line.match(/\[([^\]]+)\]\s*([^:]+):\s*(.+?)(?:\s*-\s*ETA:\s*([^\s]+))?$/);
        
        if (match) {
          return {
            date: match[1],
            author: match[2].trim(),
            text: match[3].trim(),
            eta: match[4] || null,
            authorInitials: this.getInitials(match[2].trim()),
            status: this.getStatusFromComment(match[3])
          };
        }
        
        // Handle malformed lines
        return {
          date: "",
          author: "Unknown",
          text: line,
          eta: null,
          authorInitials: "UN",
          status: "info"
        };
      }).reverse(); // Show newest first
    }
  },
  
  mounted() {
    // Debug the received props
    console.log("🔍 StatusCommentDisplay mounted with props:", {
      value: this.value,
      canEdit: this.canEdit,
      maxPreviewLength: this.maxPreviewLength,
      hasComments: this.hasComments,
      displayText: this.displayText
    });
  },
  
  methods: {
    openModal() {
      this.dialog = true;
      this.originalComment = this.statusComment;
      this.editableComment = this.statusComment;
    },
    
    closeModal() {
      this.dialog = false;
      this.editMode = false;
      this.newComment = "";
      this.newEta = "";
    },
    
    enterEditMode() {
      this.editMode = true;
      this.editableComment = this.statusComment || "";
    },
    
    cancelEdit() {
      this.editMode = false;
      this.editableComment = this.originalComment;
      this.newComment = "";
      this.newEta = "";
    },
    
    async saveChanges() {
      this.saving = true;
      
      try {
        // TODO: Future API call to save the comment
        // const response = await ApiService.updateStatusComment(
        //   this.objectId,
        //   this.editableComment,
        //   this.itemType
        // );
        
        // Emit the updated data back to parent
        this.$emit("comment-updated", {
          objectId: this.objectId,
          statusComment: this.editableComment
        });
        
        this.originalComment = this.editableComment;
        this.editMode = false;
        this.newComment = "";
        this.newEta = "";
        
        // Show success message
        this.$emit("show-message", {
          type: "success",
          message: "Status comment updated successfully"
        });
        
      } catch (error) {
        console.error("Error saving status comment:", error);
        this.$emit("show-message", {
          type: "error",
          message: "Failed to save status comment"
        });
      } finally {
        this.saving = false;
      }
    },
    
    addNewComment() {
      if (!this.newComment.trim()) return;
      
      const today = new Date().toISOString().split("T")[0];
      const etaText = this.newEta ? ` - ETA: ${this.newEta}` : "";
      const newEntry = `[${today}] ${this.currentUser}: ${this.newComment.trim()}${etaText}`;
      
      if (this.editableComment) {
        this.editableComment += "\n" + newEntry;
      } else {
        this.editableComment = newEntry;
      }
      
      this.newComment = "";
      this.newEta = "";
    },
    
    getInitials(name) {
      if (!name) return "UN";
      return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    },
    
    getUserColor(username) {
      // Generate consistent color for each user based on their username
      if (!username) return "#2196f3";
      
      // Simple hash function to convert username to number
      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Predefined set of professional colors for avatars
      const colors = [
        "#2196F3", // Blue
        "#4CAF50", // Green  
        "#FF9800", // Orange
        "#9C27B0", // Purple
        "#F44336", // Red
        "#00BCD4", // Cyan
        "#795548", // Brown
        "#607D8B", // Blue Grey
        "#E91E63", // Pink
        "#3F51B5", // Indigo
        "#009688", // Teal
        "#FF5722"  // Deep Orange
      ];
      
      // Use hash to select color consistently
      const colorIndex = Math.abs(hash) % colors.length;
      return colors[colorIndex];
    },
    
    getStatusColor(status) {
      const colorMap = {
        error: "#f44336",
        warning: "#ff9800",
        success: "#4caf50",
        info: "#2196f3"
      };
      return colorMap[status] || "#2196f3";
    },
    
    getStatusFromComment(text) {
      const lowerText = text.toLowerCase();
      if (lowerText.includes("error") || lowerText.includes("fail")) return "error";
      if (lowerText.includes("warning") || lowerText.includes("wait")) return "warning";
      if (lowerText.includes("complete") || lowerText.includes("done")) return "success";
      return "info";
    },
    
    formatDate(dateString) {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        });
      } catch {
        return dateString;
      }
    }
  }
};
</script>
