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
			function whatIsThis () {
				console.log(this.bind(this));
			} 
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
		Called from: An event listener on an element with the id #toggle-all.
		    Accepts: Event object. 
		    Returns: Does not return anything, updates the .completed 
		             property of all todos.
		        How: - When #toggle-all is clicked the #toggle-all's .checked
		               property changes, then this function get's fired.
		             - The variable isChecked gets set to the
		               .checked value of #toggle-all. 
		             - loop through all todos and set the copmleted value
		               to isChecked.
		       Note: #toggle-all.checked value can change in two ways:
		             1. #toggle-all is clicked.
		             2. all todos are manually toggled to the same 
		                .completed value.
		        Why: To toggle/change/update all the todos .completed 
		             value to the same value. 
		----------------------*/
		toggleAll: function (e) {
			// the checked value of the #toggle-all element 
			// is already set before this function is run.
		 
			var isChecked = $(e.target).prop('checked');
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
                     or 'Active' in the footer.
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
		}, // End getCompletedTodos --->  Call Stack: getCompletedTodos > getFilteredTodos > render

	/*************************************************************
    *************************************************************/

		/*----------------------
	     getFilteredTodos
        ------------------------
		Called from: render
		    Accepts: Does not accept any parameters, uses existing data on this.todos
		    Returns: An array of todos depending on what filter was clicked:
		             if the 'Active' button (filter) was clicked it returns an
		             array of active todos.
		        How: - If filter/button === 'active' the active button was clicked,
		               call getActiveTodos and return array. - end function.
		             - If filter/button === 'completed' the completed button was clicked,
		               call getCompletedTodos and return array. end function.
		             - If/(else) filter/button === 'All' the All button was clicked,
		               return all todos. - no need for another if or else statement. end function.
		        Why: To return/filter todos based on what filter/button was clicked.

		----------------------*/
	    getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},  // End getFilteredTodos ->  Call Stack: getFilteredTodos > render

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
         destroyCompleted
        ------------------------
		Called from: Event listener on #clear-completed - only visible/available
		             when there is at least one todo that has been completed - 
		             .completed = true;
		    Accepts: Does not accept any parameters, uses existing data on this.todos
		    Returns: Does not return anything updates todos array and calls render.
		        How: - Is fired when #clear-completed is clicked - this button
		               is only available when there is at least one todo that has been
		               completed.
		             - Sets this.todos to active todos - todos that have not been 
		               completed.
		             - Sets the filter to 'All' - to display all todos that are left.
		               This is clever - after #clear-completed is cilcked there will no longer
		               be any Completed todos and all todos left will be Active so 
		               setting the filter/view to All makes sense.
		             - Call render.
		        Why: To generate and display a new todos array with only
		             the Active (not completed) todos.
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

      // Shorthand way of saying while i is grater than 0 run then subtract 1.
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
		Called from: Event listener is set up in bindEvents on the
		             #new-todo element - keyup fires everytime a key is released. 
		    Accepts: Event object from #new-todo on keyup.
		    Returns: Does not return a value:
					 - creates a new item on this.todos
		        How: - if the keypressed was not the enter key
		               or if the enter key was pressed 
		               but there is no value in #new-todo - return.
		             - if the enter key was pressed and there is a value
		               in #new-todo push new item to this.todos
		               - create/set unique id
		               - set #new-todo value as the title
		               - set the completed property to flase
		             - clear $input/#new-todo.
		             - render
		        Why: To create a new item on this.todos.
		----------------------*/
		create: function (e) {
			var $input = $(e.target);
			var val = $input.val().trim();
			
			// 1st - was the enter key pressed
			// 2nd - if enter was pressed was there a value in #new-todo. 
			// return uless enter key was pressed and the value is not empty.
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
		Called from: bind event listener, fires on change/click of an element
		             with the .toggle class.
		    Accepts: event object - element that was clicked.
		    Returns: Doesn't return anything, updates the 
		             completed property on a todo.
		        How: - Sets i to the position/index of the clicked item.
		               in the todos array.
		             - Changes/updates the completed property of that item.
		             - Calls render.
		        Why: To toggle/change/update the completed property of an
		             item in the todos array - a todo.
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
		Called from: Event listener is set up in bindEvents on a label in #todo-list
		             when a <label> is dblclick within #todo-list.
		    Accepts: event object - element that was clicked.
		    Returns: Does not return anything adds a class to the li element that 
		             was double clicked and finds the element with 
		             the .edit class. 
		        How: - Sets $input to the element that was clicked
		             - finds the closest li and adds the class editing.
		             - finds and sets $input to the element with the 
		             class .edit.
		             - Takes that input element and calls focus which 
		             places the curser in that element.
		        Why: To make the input element visible and give it the focus/curser.
		             - by default the input element on the list is hidden.
		----------------------*/
		editingMode: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			$input.focus().select();
		}, // End editingMode ->  Call Stack:

    /*************************************************************
    *************************************************************/
		
	    /*----------------------
            editKeyup
        ------------------------
		Called from: Event listener is set up in bindEvents on an element
		             with the class .edit. (keyup) - this method
		             gets fired every keyup.
		    Accepts: event object from element that was clicked.
		    Returns: Does not return anything. Looks to see if the 
		             enter key or esc key was pressed and if it was
		             removes the focus from the elemment.
		             If the enter key was pressed the data entered stays.
		             If esc key was pushed it removes data that was 
		             entered. 
		        How: on keyup:
		        	 - If the enter key was pressed remove focus and
		        	   leave data as is.
		        	 - If esc key was pressed remove modifed data and 
		        	   return it to was it was then remove the focus.
		        	 - Note that if the user deletes all data so it is empty
		        	   then presses esc, the item will be destroyed. 
		        	   look at update - if (!val)
		        Why: To see if the enter or esc was pressed, and if so remove focus.
		----------------------*/
		editKeyup: function (e) {
			var test = e.target.value;

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
		Called from: event listener set up in bind - .on('focusout', '.edit'
		             when an element is in editing mode - has the .edit class
		             and focus is moved out this method gets fired.
		    Accepts: event object
		    Returns: Does not return anything, it returns to break out of 
		             the function in specific situations. 
		        How: - Set el to the element that was clicked.
		             - Wrap $el in the jQuery version of the element that was clicked.
		               to give it access to the jQuery lib. Specifically the data method -
		               Store arbitrary data associated with the specified element and/or 
		               return the value that was set. 
		               - in editKeyUp() data was used to set the attribute 'abort', true 
		                 on the todo that is being edited to detect if the esc key was used.
		                 If the esc key was used don't errase/destroy anything.
		             - trim the white space if any off the begining and end of the value
		               and set it to val.
		             - if (!val) - if the value is empty (nothing in the todo - blank)
		               destroy that todo, because it's blank, and retun - leave function.
		               - I decided that I didn't want the user to be able to destroy a todo
		                 while editing a todo so I removed the call to destroy and added
		                 this.render(). - If a user erases the title/val of a todo
		                 and focus is lost the todo will remain, to destroy a todo they 
		                 will have to explicitly delete it.
		             - If the element has the 'abort' property set the property to false 
		               then call render.
		             - If esc key was not pressed - the item does not have the 'abort' property
		               so set the title to the value - edited todo.
		             - render.
		        Why: To update a todo on foucsOut when an item is in ediingMode.
		----------------------*/
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				// this.destroy(e);
				this.render();
				return;
			}

			// 'abort' - added to todo in editKeyup if esc key was pressed.
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
			// getIndexFromEl figures out what item in the todos array has been clicked
			this.todos.splice(this.getIndexFromEl(e.target), 1);
			// display
			this.render();
		}  // End destroy ->  Call Stack: Does not return anything, calls render.

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

