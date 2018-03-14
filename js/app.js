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
		/*----------------------
			   init
    ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},  // End init ->  Call Stack:

    /*************************************************************
    *************************************************************/
		
	  /*----------------------
			bindEvents
    ------------------------
    Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		bindEvents: function () {
			$('#new-todo').on('keyup', this.create.bind(this));
			// .on('change') doesn't necessarily trigger this event listener.
			// for ex. if a user toggles all todo's individually without clicking toggleAll
			// the checked value will change but this event listener will not get fired.
			// https://developer.mozilla.org/en-US/docs/Web/Events/change
			// *** if the change happens from javascript - 
			$('#toggle-all').on('change', this.toggleAll.bind(this));
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			$('#todo-list')
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.editingMode.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.destroy', this.destroy.bind(this));
		}, // End bindEvents ->  Call Stack:

    /*************************************************************
    *************************************************************/

	 /*----------------------
			render
  ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		render: function () {
			var todos = this.getFilteredTodos();
			$('#todo-list').html(this.todoTemplate(todos));
			$('#main').toggle(todos.length > 0);
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			
			this.renderFooter();
			$('#new-todo').focus();
			util.store('todos-jquery', this.todos);
		},  // End render ->  Call Stack:
  
    /*************************************************************
    *************************************************************/

	    /*----------------------
	         renderFooter
      ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			$('#footer').toggle(todoCount > 0).html(template);
		},  // renderFooter ->  Call Stack:

    /*************************************************************
    *************************************************************/

	    /*----------------------
			toggleAll
        ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		toggleAll: function (e) {
			// the checked value is already set before this function is run.
			// This function just looks at what that value is.
			// the value will chage because of default behavior of an input element type="checkbox"
			// this is clever...
			// getting the #toggleAll checked value and setting it to isChecked.
			// #toggleAll is an <input> element with type="checkbox" this a a checked property. 
			var isChecked = $(e.target).prop('checked');
			// set all todos to what the checked value is.
			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},  // End toggleAll ->  Call Stack:

	/*************************************************************
    *************************************************************/

		/*----------------------
		   getActiveTodos
        ------------------------
		Called from: render > getFilteredTodos > getActiveTodos
		    Accepts: Does not accept any parameters, uses existing data - this.todos
		    Returns: An array of Active todos (todos !completed).
		        How: Takes this.todos array and uses .filter to return an array
		             of completed todos.
		        Why: To display all the completed todos when the user clicks 'All' 
                 in the footer.
	    ----------------------*/
		getActiveTodos: function () {
			// return this.todos array after .filter has been run.
			return this.todos.filter(function (todo) {
				// return item to the this.todos array if true.
				return !todo.completed;
			});
			
		},  // End getActiveTodos ->  Call Stack: gitFilteredTodos > render

    /*************************************************************
    *************************************************************/

		/*----------------------
		   getCompletedTodos
    ------------------------
		Called from: render > getFilteredTodos > getCompletedTodos
			  Accepts: Does not accept any parameters, uses existing data on this.todos
			  Returns: An array of completed todos.
		        How: Takes this.todos array and uses .filter to return an array
			           of completed todos.
		        Why: To display all the completed todos when the user clicks 'All' in the 
		             footer.
		----------------------*/
		getCompletedTodos: function () {
			// return this.todos array after .filter has been run.
			return this.todos.filter(function (todo) {
				// return item to the this.todos array if true.
				return todo.completed;
			});
		}, // End getCompletedTodos --->  Call Stack: 

	/*************************************************************
  *************************************************************/

		/*----------------------
	     getFilteredTodos
    ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
	    getFilteredTodos: function () {
			if (this.filter === 'active') {
				console.log(this.filter);
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},  // End getFilteredTodos ->  Call Stack: 

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
         destroyCompleted
      ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		}, // End destroyCompleted ->  Call Stack:

    /*************************************************************
    *************************************************************/

	    /*------------------------
	          getIndexFromEl
	    --------------------------
	    Called from: toggle, update, destroy
	        Accepts: e.target - element that was clicked.
	        Returns: Index/position of element in the todos array.
	            How: - When called, e.target (element that was clicked) 
	                   gets passed into getIndexFromEl as an argument.
	                 - The data id is found.
	                 - while loop to find the item in the todos array
	                   with the same data id.
	                 - Return items position in todos array.
	            Why: To locate and return the index of an item in the todos array.
        ----------------------*/
		getIndexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

      // Shorthand way of saying while i > 0.
			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},  // End getIndexFromEl ->  Call Stack: 

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
	         create
        ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		create: function (e) {
			var $input = $(e.target);
			var val = $input.val().trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			$input.val('');

			this.render();
		}, // End create ->  Call Stack:

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
		        toggle
        ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		toggle: function (e) {
			var i = this.getIndexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},  // End toggle ->  Call Stack:

  /*************************************************************
  *************************************************************/
		
	  /*----------------------
          editingMode
      ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		editingMode: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			var val = $input.val();
			$input.val('').focus().val(val);
		}, // End editingMode ->  Call Stack:

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
            editKeyup
        ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},  // End editKeyup ->  Call Stack:

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
			update
        ------------------------
		Called from: 
		    Accepts:
		    Returns:
		        How:
		        Why:
		----------------------*/
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[this.getIndexFromEl(el)].title = val;
			}

			this.render();
		},  // End update ->  Call Stack:

	/***************************************************************
    ***************************************************************/
    

		/*----------------------
		        destroy
        ------------------------
		Called from: App.bindEvents (63, 69); App.update (192)
		    Accepts: Object from a click event on an element with the class destroy -
                     .on('click', '.destroy',... - 69
		    Returns: Does not retun anything - processing.
		        How: - Accepts object
		             - gets position of object in the todos array - this.getIndexFromEl(e.target
		             - splice that item
		             - Calls the render() function to display
		        Why: To delete an item when that items .destroy element is clicked.
		----------------------*/
		destroy: function (e) {
			var todoPosition = this.getIndexFromEl(e.target);

			this.destroyedTodosArray(this.todos[todoPosition]);
			// getIndexFromEl figures out what item in the todos array has been clicked
			this.todos.splice(todoPosition, 1);
			// display
			this.render();




		},  // End destroy ->  Call Stack: Does not return anything, calls render.
		destroyedTodosArray: function (destroyedTodo) {
			var destroyedList = [];
			destroyedList.push(destroyedTodo);
			this.displayDestroyed(destroyedTodo);
		},
		displayDestroyed: function (todo) {
			var destroyedUl = document.getElementById('destroyed-todos');
			var destroyedLi = document.createElement('li');
			destroyedLi.textContent = todo.title;
			destroyedUl.appendChild(destroyedLi);
		}

	};  // ---- End App

	App.init();


});

/*----------------------
		 Map
-------------------------

jQuery {

	Handlebars {}

	CONST;
	CONST;

	util {

		- uuid
		- pluralize
		- store

	} -- End util --

	App {

		- init
		- bindEvents
		- render
		- renderFooter
		- toggleAll
		- getActiveTodos
		- getCompletedTodos
		- getFilteredTodos
		- destroyCompleted
		- getIndexFromEl
		- create
		- toggle
		- editingMode
		- editKeyup
		- update
		- destroy

	}  -- End App --

	App.init();

} -- End jQuery --




Method template:

/*----------------------
    method name;
        ------------------------
Called from: 
    Accepts:
    Returns:
        How:
        Why:
----------------------*/

/*************************************************************
*************************************************************/

