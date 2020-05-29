// Utility function
function Util () {};

/* Class manipulation functions. */

/**
 * @param {element} el Element to check for className class.
 * @param {string} className
 */
Util.hasClass = function(el, className) {
	if (el.classList) return el.classList.contains(className);
	else return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
};

/**
 * @param {element} el Element to add className class to.
 * @param {string} className
 */
Util.addClass = function(el, className) {
	var classList = className.split(' ');
 	if (el.classList) el.classList.add(classList[0]);
 	else if (!Util.hasClass(el, classList[0])) el.className += " " + classList[0];
 	if (classList.length > 1) Util.addClass(el, classList.slice(1).join(' '));
};

/**
 * @param {element} el Element to remove className class from.
 * @param {string} className
 */
Util.removeClass = function(el, className) {
	var classList = className.split(' ');
	if (el.classList) el.classList.remove(classList[0]);	
	else if(Util.hasClass(el, classList[0])) {
		var reg = new RegExp('(\\s|^)' + classList[0] + '(\\s|$)');
		el.className=el.className.replace(reg, ' ');
	}
	if (classList.length > 1) Util.removeClass(el, classList.slice(1).join(' '));
};

/**
 * @param {element} el Element to toggle className class to/from.
 * @param {string} className
 * @param {*} bool If true, add className class. Else, remove class.
 */
Util.toggleClass = function(el, className, bool) {
	if(bool) Util.addClass(el, className);
	else Util.removeClass(el, className);
};

Util.setAttributes = function(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
};

/* DOM Manipulation */

/**
 * @param {element} el Element to get className class children from.
 * @param {string} className
 */
Util.getChildrenByClassName = function(el, className) {
  var children = el.children,
    childrenByClass = [];
  for (var i = 0; i < el.children.length; i++) {
    if (Util.hasClass(el.children[i], className)) childrenByClass.push(el.children[i]);
  }
  return childrenByClass;
};

/**
 * Animate height of an element.
 * @param {number} start Starting height.
 * @param {number} to Ending height.
 * @param {Element} element Element to manipulate.
 * @param {number} duration Transition duration.
 * @param {*} cb Ending action (once transition time is up).
 */
Util.setHeight = function(start, to, element, duration, cb) {
	var change = to - start,
	    currentTime = null;

  var animateHeight = function(timestamp){  
    if (!currentTime) currentTime = timestamp;         
    var progress = timestamp - currentTime;
    var val = parseInt((progress/duration)*change + start);
    element.setAttribute("style", "height:"+val+"px;");
    if(progress < duration) {
        window.requestAnimationFrame(animateHeight);
    } else {
    	cb();
    }
  };
  
  // Set the height of the element before starting animation -> fix bug on Safari.
  element.setAttribute("style", "height:"+start+"px;");
  window.requestAnimationFrame(animateHeight);
};

/**
 * Smooth Scroll.
 * @param {number} final Position to scroll to.
 * @param {number} duration Transition duration.
 * @param {*} cb Ending action (once transition time is up).
 */
Util.scrollTo = function(final, duration, cb) {
  var start = window.scrollY || document.documentElement.scrollTop,
      currentTime = null;
      
  var animateScroll = function(timestamp){
  	if (!currentTime) currentTime = timestamp;        
    var progress = timestamp - currentTime;
    if(progress > duration) progress = duration;
    var val = Math.easeInOutQuad(progress, start, final-start, duration);
    window.scrollTo(0, val);
    if(progress < duration) {
        window.requestAnimationFrame(animateScroll);
    } else {
      cb && cb();
    }
  };

  window.requestAnimationFrame(animateScroll);
};

/* Focus utility classes. */

/**
 * Move focus to an element.
 * @param {Element} element
 */
Util.moveFocus = function (element) {
  if( !element ) element = document.getElementsByTagName("body")[0];
  element.focus();
  if (document.activeElement !== element) {
    element.setAttribute('tabindex','-1');
    element.focus();
  }
};

/* Misc. */

/**
 * @param {array} array
 * @param {element} el
 */
Util.getIndexInArray = function(array, el) {
  return Array.prototype.indexOf.call(array, el);
};

/**
 * @param {string} property
 * @param {string} value
 */
Util.cssSupports = function(property, value) {
  if('CSS' in window) {
    return CSS.supports(property, value);
  } else {
    var jsProperty = property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase();});
    return jsProperty in document.body.style;
  }
};

/*  Polyfills */

// Closest() method.
if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
	Element.prototype.closest = function(s) {
		var el = this;
		if (!document.documentElement.contains(el)) return null;
		do {
			if (el.matches(s)) return el;
			el = el.parentElement || el.parentNode;
		} while (el !== null && el.nodeType === 1); 
		return null;
	};
}

if ( typeof window.CustomEvent !== "function" ) {

 /**
  * Custom Event() constructor.
  * @param {string} event
  * @param {string} params
  */
  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
}

 /**
  * Animation curves.
  * @param {number} t
  * @param {number} b
  * @param {number} c
  * @param {Number} d
  */
Math.easeInOutQuad = function (t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t + b;
	t--;
	return -c/2 * (t*(t-2) - 1) + b;
};