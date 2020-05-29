/**
 * Swipe Content Plugin - by CodyHouse.co
 * https://codyhouse.co/ds/components/info/swipe-content
 */

(function() {
 /**
  * Create swipeable content.
  * @param {Element} element An element of the content.
  */
	var SwipeContent = function(element) {
		this.element = element;
		this.delta = [false, false];
		this.dragging = false;
		this.intervalId = false;
		initSwipeContent(this);
	};

   /**
    * @param {SwipeContent} content Content to shift on action.
    */
	function initSwipeContent(content) {
		content.element.addEventListener('mousedown', handleEvent.bind(content));
		content.element.addEventListener('touchstart', handleEvent.bind(content));
	};

   /**
    * Add necessary event (action) listeners.
    * @param {SwipeContent} content Content to shift on action.
    */
	function initDragging(content) {
		content.element.addEventListener('mousemove', handleEvent.bind(content));
		content.element.addEventListener('touchmove', handleEvent.bind(content));
		content.element.addEventListener('mouseup', handleEvent.bind(content));
		content.element.addEventListener('mouseleave', handleEvent.bind(content));
		content.element.addEventListener('touchend', handleEvent.bind(content));
	};

   /**
    * @param {SwipeContent} content Content to shift on action.
    */
	function cancelDragging(content) {
		// remove event listeners
		if(content.intervalId) {
			(!window.requestAnimationFrame) ? clearInterval(content.intervalId) : window.cancelAnimationFrame(content.intervalId);
			content.intervalId = false;
		}
		content.element.removeEventListener('mousemove', handleEvent.bind(content));
		content.element.removeEventListener('touchmove', handleEvent.bind(content));
		content.element.removeEventListener('mouseup', handleEvent.bind(content));
		content.element.removeEventListener('mouseleave', handleEvent.bind(content));
		content.element.removeEventListener('touchend', handleEvent.bind(content));
	};

   /**
    * @param {Event} event User-end event triggers.
    */
	function handleEvent(event) {
		switch(event.type) {
			case 'mousedown':
			case 'touchstart':
				startDrag(this, event);
				break;
			case 'mousemove':
			case 'touchmove':
				drag(this, event);
				break;
			case 'mouseup':
			case 'mouseleave':
			case 'touchend':
				endDrag(this, event);
				break;
		}
	};

   /**
    * @param {SwipeContent} content Content to shift on action.
    * @param {Event} event User-end event triggers.
    */
	function startDrag(content, event) {
		content.dragging = true;
		// Listen to drag movements.
		initDragging(content);
		content.delta = [parseInt(unify(event).clientX), parseInt(unify(event).clientY)];
		// Produce drag start event.
		emitSwipeEvents(content, 'dragStart', content.delta);
	};

   /**
    * @param {SwipeContent} content Content to shift on action.
    * @param {Event} event User-end event triggers.
    */
	function endDrag(content, event) {
		cancelDragging(content);
		// Credits: https://css-tricks.com/simple-swipe-with-vanilla-javascript/.
		var dx = parseInt(unify(event).clientX), 
	    dy = parseInt(unify(event).clientY);
	  
	    // Check if there was a left/right swipe.
		if(content.delta && (content.delta[0] || content.delta[0] === 0)) {
	    var s = Math.sign(dx - content.delta[0]);
			
			if(Math.abs(dx - content.delta[0]) > 30) {
				(s < 0) ? emitSwipeEvents(content, 'swipeLeft', [dx, dy]) : emitSwipeEvents(content, 'swipeRight', [dx, dy]);	
			}
	    
	    content.delta[0] = false;
	  }
	  // Check if there was a top/bottom swipe.
	  if(content.delta && (content.delta[1] || content.delta[1] === 0)) {
	  	var y = Math.sign(dy - content.delta[1]);

	  	if(Math.abs(dy - content.delta[1]) > 30) {
	    	(y < 0) ? emitSwipeEvents(content, 'swipeUp', [dx, dy]) : emitSwipeEvents(content, 'swipeDown', [dx, dy]);
	    }

	    content.delta[1] = false;
	  }
	  // Emit drag end event.
	  emitSwipeEvents(content, 'dragEnd', [dx, dy]);
	  content.dragging = false;
	};

   /**
    * Produce dragging event with coordinates.
    * @param {SwipeContent} content Content to shift on action.
    * @param {Event} event User-end event trigger.
    */
	function drag(content, event) {
		if(!content.dragging) return;
		(!window.requestAnimationFrame) 
			? content.intervalId = setTimeout(function(){emitDrag.bind(content, event);}, 250) 
			: content.intervalId = window.requestAnimationFrame(emitDrag.bind(content, event));
	};

   /**
    * @param {Event} event User-end event trigger.
    */
	function emitDrag(event) {
		emitSwipeEvents(this, 'dragging', [parseInt(unify(event).clientX), parseInt(unify(event).clientY)]);
	};

   /**
    * @param {Event} event User-end event trigger.
    */
	function unify(event) { 
		// unify mouse and touch events
		return event.changedTouches ? event.changedTouches[0] : event; 
	};

   /**
    * Produce event with coordinates.
    * @param {SwipeContent} content Content to shift on action.
    * @param {string} eventName
    * @param {array} detail Details of the event with given eventName.
    */
	function emitSwipeEvents(content, eventName, detail) {
		var event = new CustomEvent(eventName, {detail: {x: detail[0], y: detail[1]}});
		content.element.dispatchEvent(event);
	};

	window.SwipeContent = SwipeContent;
	
	// Initialize the SwipeContent objects.
	var swipe = document.getElementsByClassName('js-swipe-content');
	if( swipe.length > 0 ) {
		for( var i = 0; i < swipe.length; i++) {
			(function(i){new SwipeContent(swipe[i]);})(i);
		}
	}
}());