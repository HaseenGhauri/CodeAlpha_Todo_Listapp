
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentView = 'all';
        this.currentCategory = null;
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.attachEventListeners();
        this.loadTheme();
        this.renderTasks();
        this.updateStats();
        this.setMinDate();
    }

    cacheDOMElements() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskDate = document.getElementById('taskDate');
        this.taskTime = document.getElementById('taskTime');
        this.taskPriority = document.getElementById('taskPriority');
        this.taskCategory = document.getElementById('taskCategory');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskTags = document.getElementById('taskTags');
        this.expandFormBtn = document.getElementById('expandFormBtn');
        this.formExpanded = document.getElementById('formExpanded');

        // Display elements
        this.tasksContainer = document.getElementById('tasksContainer');
        this.emptyState = document.getElementById('emptyState');
        this.viewTitle = document.getElementById('viewTitle');
        this.taskCount = document.getElementById('taskCount');

        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.sortBy = document.getElementById('sortBy');

        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.closeModal = document.getElementById('closeModal');
        this.cancelEdit = document.getElementById('cancelEdit');

        // Stat elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');

        // Sidebar buttons
        this.viewButtons = document.querySelectorAll('[data-view]');
        this.categoryButtons = document.querySelectorAll('[data-category]');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.exportBtn = document.getElementById('exportBtn');

        // Notification container
        this.notificationContainer = document.getElementById('notificationContainer');
    }

    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Expand form
        this.expandFormBtn.addEventListener('click', () => this.toggleExpandForm());

        // Search and filter
        this.searchInput.addEventListener('input', () => this.renderTasks());
        this.sortBy.addEventListener('change', () => this.renderTasks());

        // Modal
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());
        this.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.setView(view);
            });
        });

        // Category buttons
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.setCategory(category);
            });
        });

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Export
        this.exportBtn.addEventListener('click', () => this.exportTasks());
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        this.taskDate.setAttribute('min', today);
    }

    // ============================================
    // Task CRUD Operations
    // ============================================
    addTask() {
        const taskData = {
            id: Date.now().toString(),
            title: this.taskInput.value.trim(),
            description: this.taskDescription.value.trim(),
            date: this.taskDate.value,
            time: this.taskTime.value,
            priority: this.taskPriority.value,
            category: this.taskCategory.value,
            tags: this.taskTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(taskData);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.resetForm();
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    toggleTaskComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as incomplete';
            this.showNotification(message, 'success');
        }
    }

    openEditModal(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        this.editingTaskId = id;

        // Populate form
        document.getElementById('editTaskName').value = task.title;
        document.getElementById('editTaskDate').value = task.date || '';
        document.getElementById('editTaskTime').value = task.time || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskCategory').value = task.category;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskTags').value = task.tags.join(', ');

        this.editModal.classList.add('show');
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
    }

    saveEdit() {
        const task = this.tasks.find(task => task.id === this.editingTaskId);
        if (!task) return;

        task.title = document.getElementById('editTaskName').value.trim();
        task.date = document.getElementById('editTaskDate').value;
        task.time = document.getElementById('editTaskTime').value;
        task.priority = document.getElementById('editTaskPriority').value;
        task.category = document.getElementById('editTaskCategory').value;
        task.description = document.getElementById('editTaskDescription').value.trim();
        task.tags = document.getElementById('editTaskTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        task.updatedAt = new Date().toISOString();

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeEditModal();
        this.showNotification('Task updated successfully!', 'success');
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear', 'info');
            return;
        }

        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(`${completedCount} completed task(s) cleared!`, 'success');
        }
    }

   
    setView(view) {
        this.currentView = view;
        this.currentCategory = null;

        // Update active state
        this.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.categoryButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const titles = {
            all: 'All Tasks',
            today: 'Today',
            upcoming: 'Upcoming',
            overdue: 'Overdue',
            completed: 'Completed'
        };
        this.viewTitle.textContent = titles[view];

        this.renderTasks();
    }

    setCategory(category) {
        this.currentCategory = category;
        this.currentView = null;

        // Update active state
        this.categoryButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        this.viewButtons.forEach(btn => {
            btn.classList.remove('active');
        });

       
        this.viewTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);

        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        
        if (this.currentView) {
            switch (this.currentView) {
                case 'today':
                    filtered = filtered.filter(task => {
                        if (!task.date) return false;
                        const taskDate = new Date(task.date);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate.getTime() === today.getTime() && !task.completed;
                    });
                    break;
                case 'upcoming':
                    filtered = filtered.filter(task => {
                        if (!task.date) return false;
                        const taskDate = new Date(task.date);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate > today && !task.completed;
                    });
                    break;
                case 'overdue':
                    filtered = filtered.filter(task => {
                        if (!task.date) return false;
                        const taskDate = new Date(task.date);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate < today && !task.completed;
                    });
                    break;
                case 'completed':
                    filtered = filtered.filter(task => task.completed);
                    break;
            }
        }

        if (this.currentCategory) {
            filtered = filtered.filter(task => task.category === this.currentCategory);
        }

       
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm) ||
                task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        const sortBy = this.sortBy.value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(a.date) - new Date(b.date);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'name':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return filtered;
    }

    
    renderTasks() {
        const tasks = this.getFilteredTasks();
        
        if (tasks.length === 0) {
            this.tasksContainer.style.display = 'none';
            this.emptyState.classList.add('show');
        } else {
            this.tasksContainer.style.display = 'flex';
            this.emptyState.classList.remove('show');
        }

        this.taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
        
        this.tasksContainer.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');

        this.attachTaskEventListeners();
        this.updateCounts();
    }

    createTaskHTML(task) {
        const isOverdue = task.date && new Date(task.date) < new Date() && !task.completed;
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''} priority-${task.priority}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-info">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                        <div class="task-meta">
                            ${task.date ? `
                                <span class="meta-item ${isOverdue ? 'overdue' : ''}">
                                    <i class="fas fa-calendar"></i>
                                    ${this.formatDate(task.date)}
                                    ${task.time ? `<i class="fas fa-clock"></i> ${task.time}` : ''}
                                </span>
                            ` : ''}
                            <span class="category-badge category-${task.category}">
                                ${this.getCategoryIcon(task.category)} ${task.category}
                            </span>
                            <span class="priority-badge priority-${task.priority}">
                                <i class="fas fa-flag"></i> ${task.priority}
                            </span>
                        </div>
                        ${task.tags.length > 0 ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `<span class="tag">#${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit" data-id="${task.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${task.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachTaskEventListeners() {
        
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.toggleTaskComplete(id);
            });
        });

       
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.openEditModal(id);
            });
        });

        
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteTask(id);
            });
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        this.animateNumber(this.totalTasksEl, total);
        this.animateNumber(this.completedTasksEl, completed);
        this.animateNumber(this.pendingTasksEl, pending);
    }

    updateCounts() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        
        document.getElementById('allCount').textContent = this.tasks.length;
        document.getElementById('todayCount').textContent = this.tasks.filter(task => {
            if (!task.date || task.completed) return false;
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
        }).length;

        document.getElementById('upcomingCount').textContent = this.tasks.filter(task => {
            if (!task.date || task.completed) return false;
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate > today;
        }).length;

        document.getElementById('overdueCount').textContent = this.tasks.filter(task => {
            if (!task.date || task.completed) return false;
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate < today;
        }).length;

        document.getElementById('completedCount').textContent = this.tasks.filter(task => task.completed).length;

        
        document.getElementById('workCount').textContent = this.tasks.filter(task => task.category === 'work').length;
        document.getElementById('personalCount').textContent = this.tasks.filter(task => task.category === 'personal').length;
        document.getElementById('shoppingCount').textContent = this.tasks.filter(task => task.category === 'shopping').length;
        document.getElementById('healthCount').textContent = this.tasks.filter(task => task.category === 'health').length;
    }

    animateNumber(element, target) {
        const current = parseInt(element.textContent) || 0;
        const increment = target > current ? 1 : -1;
        const duration = 300;
        const steps = Math.abs(target - current);
        const stepDuration = duration / (steps || 1);

        let value = current;
        const timer = setInterval(() => {
            value += increment;
            element.textContent = value;
            
            if (value === target) {
                clearInterval(timer);
            }
        }, stepDuration);
    }

    
    saveTasks() {
        localStorage.setItem('taskmaster_tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const stored = localStorage.getItem('taskmaster_tasks');
        return stored ? JSON.parse(stored) : [];
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!', 'success');
    }

   
    loadTheme() {
        const savedTheme = localStorage.getItem('taskmaster_theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('taskmaster_theme', isDark ? 'dark' : 'light');
        this.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        this.showNotification(`${isDark ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    
    toggleExpandForm() {
        const isExpanded = this.formExpanded.classList.contains('show');
        this.formExpanded.classList.toggle('show');
        this.expandFormBtn.classList.toggle('active');
    }

    resetForm() {
        this.taskForm.reset();
        this.formExpanded.classList.remove('show');
        this.expandFormBtn.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span class="notification-text">${message}</span>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

   
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
        if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    getCategoryIcon(category) {
        const icons = {
            work: '<i class="fas fa-briefcase"></i>',
            personal: '<i class="fas fa-user"></i>',
            shopping: '<i class="fas fa-shopping-cart"></i>',
            health: '<i class="fas fa-heartbeat"></i>'
        };
        return icons[category] || '';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// Add slideOutRight animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    .overdue {
        color: var(--danger-color) !important;
    }
`;
document.head.appendChild(style);
