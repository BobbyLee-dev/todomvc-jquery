/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.removedTodos = util.store('removed-todos');
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.removedTemplate = Handlebars.compile($('#removed-template').html());
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		bindEvents: function () {
			
			$('#new-todo').on('keyup', this.create.bind(this));
			$('#toggle-all').on('change', this.toggleAll.bind(this));
			$('#toggle-all-removed').on('change', this.toggleRemoved.bind(this));
			$('#footer').on('click', '#clear-completed', this.removeCompleted.bind(this));
			$('#todo-list')
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.editingMode.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.remove', this.remove.bind(this));


			$('footer')
				// .on('click', '#all', this.snapshot.bind(this))
				// .on('click', '#active', this.removedCurrentTodos.bind(this))
				// .on('click', '#completed', this.removedCurrentTodos.bind(this));

			$('#removed-section')
				// .on('click', '#all-removed', this.removedSnapshot.bind(this))
				// .on('click', '#completed-removed', this.currentTodos.bind(this))
				// .on('click', '#not-completed-removed', this.currentTodos.bind(this))
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.editingMode.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.destroy', this.destroy.bind(this));
		}, 
		render: function (todo) {
			var todos = this.getFilteredTodos();
			var removedList = this.getRemovedFilteredTodos();;
			// var removedList;
			var removedTodos = this.getRemovedFilteredTodos();
			// To filter todos that have not been removed
			var notRemoved = this.todos.filter(function (todo) {
				if (todo.removed === false) {
					return todo;
				}
			});
			var removed = this.todos.filter(function (todo) {
				if (todo.removed === true) {
					return todo;
				}
			});
			
			$('#todo-list').html(this.todoTemplate(todos));
			$('#main').toggle(notRemoved.length > 0);
			$('#toggle-all').prop('checked', this.getNotRemovedActiveTodos().length === 0);
			
			this.renderFooter();
			
			$('#removed-section').toggle(removed.length > 0).html(this.removedTemplate({
				removedCount: removed.length,
				allCompleted: this.getRemovedCompletedTodos.length,
				allNotCompleted: this.getRemovedNotCompleted.length,
				removedTodoWord: util.pluralize(removed.length, 'item'),
				removedli: this.getRemovedFilteredTodos()
			}));
			
			// $('#new-todo').focus();
			util.store('todos-jquery', this.todos);
			util.store('removed-todos', this.removedTodos);

			console.log(this.getRemovedFilteredTodos());
			
		}, 
		renderFooter: function () {
			var todoCount = this.todos.length;
			var todosNotRemovedCount = this.getNotRemovedTodosCount().length;
			var activeTodoCount = this.getNotRemovedActiveTodos().length;
			var allTodos = this.getNotRemovedTodosCount().length;
			var completed = this.getNotRemovedCompletedCount().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				all: allTodos,
				completed: completed,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todosNotRemovedCount - activeTodoCount,
				// filter: this.filter
			});

			$('#footer').toggle(todosNotRemovedCount > 0).html(template);
		},
		toggleAll: function (e) {
		 
			var isChecked = $(e.target).prop('checked');
			this.todos.forEach(function (todo) {
				if (!todo.removed) {
					todo.completed = isChecked;
				}
				
			});
			this.render();
		},
    	toggleRemoved: function () {
    		var isChecked = $('#toggle-all-removed').prop('checked');
    		if(isChecked) {
    			$('#removed').css('display', 'none');
    		} else {
    			$('#removed').css('display', 'block');
    		}
    		
    		
    	},
		getActiveTodos: function () {
			// return this.todos array after .filter has been run.
			return this.todos.filter(function (todo) {
				// return item to the this.todos array if true.
				return !todo.completed;
			});
			
		},
    	getNotRemovedActiveTodos: function () {
    		return this.todos.filter(function (todo) {
    			if (!todo.removed && !todo.completed) {
    				return todo;
    			}
			});
    	},
    	getNotRemovedCompletedCount: function () {
    		return this.todos.filter(function (todo) {
    			if (!todo.removed && todo.completed) {
    				return todo;
    			}
    		});
    	},
    	getNotRemovedTodosCount: function () {
    		return this.todos.filter(function (todo) {
    			return !todo.removed;
    		});
    	},
    	getRemovedTodos: function () {
    		return this.todos.filter(function (todo) {
    			return todo.removedTodos;
    			
    		});
    	},
    	getRemovedCompletedTodos: function () {
    		var removedTodos = this.getRemovedTodos();
			return removedTodos.filter(function (todo) {
				return todo.completed;
			});
    	},
    	getRemovedNotCompleted: function () {
    		var notCompleted = this.getRemovedTodos();
    		return notCompleted.filter(function (todo) {
    			return !todo.completed;
    		});
    	},
		getCompletedTodos: function () {
			// return this.todos array after .filter has been run.
			return this.todos.filter(function (todo) {
				// return item to the this.todos array if true.
				return todo.completed;
			});
		},
	    getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getNotRemovedActiveTodos();
			} else if (this.filter === 'completed') {
				return this.getNotRemovedCompletedCount();
			} else if (this.filter === 'all') {
				return this.getNotRemovedTodosCount();
			} else {
				return;
			}
		},
		getRemovedFilteredTodos: function () {
			
			if (this.filter === 'all-removed') {
				return this.getRemovedTodos();
			} else if (this.filter === 'completed-removed') {
				return this.getRemovedCompletedTodos();
			} else if (this.filter === 'not-completed-removed') {
				return this.getRemovedNotCompleted();
			} else {
				return 'test';
			}
		},
		
		removeCompleted: function () {
			var removed = this.getCompletedTodos();
			
			removed.forEach(function(todo) {
				todo.removed = true;
			}, this);
			this.filter = 'all';
			this.render();
		}, 
		getIndexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

     
			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var $input = $(e.target);
			var val = $input.val().trim();
			
			if (e.which !== ENTER_KEY || !val) {
				return;
			}
		
			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false,
				removed: false,
				destroyed: false
			});

			$input.val('');

			this.render();
		},
		toggle: function (e) {
			var i = this.getIndexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		editingMode: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			$input.focus().select();
		},
		editKeyup: function (e) {
			var test = e.target.value;

			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},  
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				
				this.render();
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[this.getIndexFromEl(el)].title = val;
			}

			this.render();
		},  
		remove: function (e) {
			var i = this.getIndexFromEl(e.target);
			
			this.removedTodos.push(this.todos[i]);
			this.todos.splice(i, 1);
			this.render();
		},
		destroy: function (e) {
			var i = this.getIndexFromEl(e.target);

			this.todos.splice(i, 1);
			this.render();
		}  
	};  
	App.init();
});


// using 2 lists now.
// this.todos and this.removedTodos
// remove method is updated.
// need to display removed list - this.removedTodos, create removedTodos filter:
// if (removed-all) {
// 	get all removed
// }
// if (completed-removed) {
// 	get completed-removed
// }
// if (not-completed-removed) {
// 	get not-completed-removed
// } else {
// 	do nothing - return maybe?
// }
