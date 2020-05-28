// Horizontal Timeline - by CodyHouse.co.

(function() {
 /**
  * Create a horizontal timeline.
  * @param {Element} element An element of the timeline.
  */
  var HorizontalTimeline = function(element) {
		this.element = element;
		this.datesContainer = this.element.getElementsByClassName('cd-h-timeline__dates')[0];
		this.line = this.datesContainer.getElementsByClassName('cd-h-timeline__line')[0]; // grey line in the top timeline section
		this.fillingLine = this.datesContainer.getElementsByClassName('cd-h-timeline__filling-line')[0]; // green filling line in the top timeline section  
		this.date = this.line.getElementsByClassName('cd-h-timeline__date');
		this.selectedDate = this.line.getElementsByClassName('cd-h-timeline__date--selected')[0];
		this.dateValues = parseDate(this);
		this.minLapse = calcMinLapse(this);
		this.navigation = this.element.getElementsByClassName('cd-h-timeline__navigation');
		this.contentWrapper = this.element.getElementsByClassName('cd-h-timeline__events')[0];
		this.content = this.contentWrapper.getElementsByClassName('cd-h-timeline__event');
		
		this.eventsMinDistance = 60; // min distance between two consecutive events (in px)
		this.eventsMaxDistance = 200; // max distance between two consecutive events (in px)
		this.translate = 0; // this will be used to store the translate value of this line
		this.lineLength = 0; // total length of this line
		
		// Store index of selected and previous selected dates.
		this.oldDateIndex = Util.getIndexInArray(this.date, this.selectedDate);
		this.newDateIndex = this.oldDateIndex;

		initTimeline(this);
		initEvents(this);
  };

 /**
  * Set position of remaining timeline dates.
  * @param {HorizontalTimeline} timeline The timeline to which to add the dates.
  */
  function initTimeline(timeline) {
  	var left = 0;
		for (var i = 0; i < timeline.dateValues.length; i++) { 
			var j = (i == 0) ? 0 : i - 1;
	    var distance = daydiff(timeline.dateValues[j], timeline.dateValues[i]),
	    	distanceNorm = (Math.round(distance/timeline.minLapse) + 2)*timeline.eventsMinDistance;
	
	    if(distanceNorm < timeline.eventsMinDistance) {
	    	distanceNorm = timeline.eventsMinDistance;
	    } else if(distanceNorm > timeline.eventsMaxDistance) {
	    	distanceNorm = timeline.eventsMaxDistance;
	    }
	    left = left + distanceNorm;
	    timeline.date[i].setAttribute('style', 'left:' + left+'px');
		}
		
	// Set line/filling line dimensions.
    timeline.line.style.width = (left + timeline.eventsMinDistance)+'px';
		timeline.lineLength = left + timeline.eventsMinDistance;
		// Reveal timeline.
		Util.addClass(timeline.element, 'cd-h-timeline--loaded');
		selectNewDate(timeline, timeline.selectedDate);
		resetTimelinePosition(timeline, 'next');
  };

 /**
  * Initialize events according to scrolling on timeline.
  * @param {HorizontalTimeline} timeline The timeline on which to scroll.
  */
  function initEvents(timeline) {
  	var self = timeline;
		// Click on arrow navigation.
		self.navigation[0].addEventListener('click', function(event){
			event.preventDefault();
			translateTimeline(self, 'prev');
		});
		self.navigation[1].addEventListener('click', function(event){
			event.preventDefault();
			translateTimeline(self, 'next');
		});

		// Swipe on timeline.
		new SwipeContent(self.datesContainer);
		self.datesContainer.addEventListener('swipeLeft', function(event){
			translateTimeline(self, 'next');
		});
		self.datesContainer.addEventListener('swipeRight', function(event){
			translateTimeline(self, 'prev');
		});

		// Select a new event.
		for(var i = 0; i < self.date.length; i++) {
			(function(i){
				self.date[i].addEventListener('click', function(event){
					event.preventDefault();
					selectNewDate(self, event.target);
				});

				self.content[i].addEventListener('animationend', function(event){
					if( i == self.newDateIndex && self.newDateIndex != self.oldDateIndex) resetAnimation(self);
				});
			})(i);
		}
  };

 /**
  * Update the fill on the timeline itself according to user scrolling.
  * @param {HorizontalTimeline} timeline The timeline on which to update filling.
  */
  function updateFilling(timeline) { // update fillingLine scale value
		var dateStyle = window.getComputedStyle(timeline.selectedDate, null),
			left = dateStyle.getPropertyValue("left"),
			width = dateStyle.getPropertyValue("width");
		
		left = Number(left.replace('px', '')) + Number(width.replace('px', ''))/2;
		timeline.fillingLine.style.transform = 'scaleX('+(left/timeline.lineLength)+')';
	};

  /**
   * @param {HorizontalTimeline} timeline The timeline to translate.
   * @param {string} direction The direction in which to translate.
   */
  function translateTimeline(timeline, direction) { // translate timeline (and date elements)
  	var containerWidth = timeline.datesContainer.offsetWidth;
  	if(direction) {
  		timeline.translate = (direction == 'next') ? timeline.translate - containerWidth + timeline.eventsMinDistance : timeline.translate + containerWidth - timeline.eventsMinDistance;
  	}
    if( 0 - timeline.translate > timeline.lineLength - containerWidth ) timeline.translate = containerWidth - timeline.lineLength;
    if( timeline.translate > 0 ) timeline.translate = 0;

    timeline.line.style.transform = 'translateX('+timeline.translate+'px)';
        // Update the navigation items status (toggle inactive class)
		(timeline.translate == 0 ) ? Util.addClass(timeline.navigation[0], 'cd-h-timeline__navigation--inactive') : Util.removeClass(timeline.navigation[0], 'cd-h-timeline__navigation--inactive');
		(timeline.translate == containerWidth - timeline.lineLength ) ? Util.addClass(timeline.navigation[1], 'cd-h-timeline__navigation--inactive') : Util.removeClass(timeline.navigation[1], 'cd-h-timeline__navigation--inactive');
  };

  /**
   * @param {HorizontalTimeline} timeline The timeline to translate.
   * @param {string} direction The direction in which to translate.
   */
	function selectNewDate(timeline, target) { // new date has been selected -> update timeline
		timeline.newDateIndex = Util.getIndexInArray(timeline.date, target);
		timeline.oldDateIndex = Util.getIndexInArray(timeline.date, timeline.selectedDate);
		Util.removeClass(timeline.selectedDate, 'cd-h-timeline__date--selected');
		Util.addClass(timeline.date[timeline.newDateIndex], 'cd-h-timeline__date--selected');
		timeline.selectedDate = timeline.date[timeline.newDateIndex];
		updateOlderEvents(timeline);
		updateVisibleContent(timeline);
		updateFilling(timeline);
	};

  /**
   * Update style of older events.
   * @param {HorizontalTimeline} timeline The timeline on which to update.
   */
	function updateOlderEvents(timeline) {
		for(var i = 0; i < timeline.date.length; i++) {
			(i < timeline.newDateIndex) ? Util.addClass(timeline.date[i], 'cd-h-timeline__date--older-event') : Util.removeClass(timeline.date[i], 'cd-h-timeline__date--older-event');
		}
	};

  /**
   * Update timelien to show contents of newly selected dates.
   * @param {HorizontalTimeline} timeline The timeline on which to update.
   */
	function updateVisibleContent(timeline) {
		if (timeline.newDateIndex > timeline.oldDateIndex) {
			var classEntering = 'cd-h-timeline__event--selected cd-h-timeline__event--enter-right',
				classLeaving = 'cd-h-timeline__event--leave-left';
		} else if(timeline.newDateIndex < timeline.oldDateIndex) {
			var classEntering = 'cd-h-timeline__event--selected cd-h-timeline__event--enter-left',
				classLeaving = 'cd-h-timeline__event--leave-right';
		} else {
			var classEntering = 'cd-h-timeline__event--selected',
				classLeaving = '';
		}

		Util.addClass(timeline.content[timeline.newDateIndex], classEntering);
		if (timeline.newDateIndex != timeline.oldDateIndex) {
			Util.removeClass(timeline.content[timeline.oldDateIndex], 'cd-h-timeline__event--selected');
			Util.addClass(timeline.content[timeline.oldDateIndex], classLeaving);
			timeline.contentWrapper.style.height = timeline.content[timeline.newDateIndex].offsetHeight + 'px';
		}
	};

  /**
   * Reset content classes when entering animation is over.
   * @param {HorizontalTimeline} timeline The timeline on which to reset.
   */
	function resetAnimation(timeline) {
		timeline.contentWrapper.style.height = null;
		Util.removeClass(timeline.content[timeline.newDateIndex], 'cd-h-timeline__event--enter-right cd-h-timeline__event--enter-left');
		Util.removeClass(timeline.content[timeline.oldDateIndex], 'cd-h-timeline__event--leave-right cd-h-timeline__event--leave-left');
	};

  /**
   * Navigate the timeline using the keyboard.
   * @param {HorizontalTimeline} timeline The timeline on which to navigate.
   * @param {string} direction The direction of navigation.
   */
	function keyNavigateTimeline(timeline, direction) {
		var newIndex = (direction == 'next') ? timeline.newDateIndex + 1 : timeline.newDateIndex - 1;
		if(newIndex < 0 || newIndex >= timeline.date.length) return;
		selectNewDate(timeline, timeline.date[newIndex]);
		resetTimelinePosition(timeline, direction);
	};
	
  /**
   * Translate timeline according to new selected event position.
   * @param {HorizontalTimeline} timeline The timeline on which to reset.
   * @param {string} direction The direction of translation.
   */
    function resetTimelinePosition(timeline, direction) {
		var eventStyle = window.getComputedStyle(timeline.selectedDate, null),
			eventLeft = Number(eventStyle.getPropertyValue('left').replace('px', '')),
			timelineWidth = timeline.datesContainer.offsetWidth;

    if( (direction == 'next' && eventLeft >= timelineWidth - timeline.translate) || (direction == 'prev' && eventLeft <= - timeline.translate) ) {
    	timeline.translate = timelineWidth/2 - eventLeft;
    	translateTimeline(timeline, false);
    }
  };

 /**
  * Get timestamp value for each date.
  * @param {HorizontalTimeline} timeline The timeline whose values to retrieve.
  */
  function parseDate(timeline) {
		var dateArrays = [];
		for(var i = 0; i < timeline.date.length; i++) {
			var singleDate = timeline.date[i].getAttribute('data-date'),
				dateComp = singleDate.split('T');
			
			if( dateComp.length > 1 ) { // both DD/MM/YEAR and time are provided
				var dayComp = dateComp[0].split('/'),
					timeComp = dateComp[1].split(':');
			} else if( dateComp[0].indexOf(':') >=0 ) { // only time is provided
				var dayComp = ["2000", "0", "0"],
					timeComp = dateComp[0].split(':');
			} else { // only DD/MM/YEAR
				var dayComp = dateComp[0].split('/'),
					timeComp = ["0", "0"];
			}
			var	newDate = new Date(dayComp[2], dayComp[1]-1, dayComp[0], timeComp[0], timeComp[1]);
			dateArrays.push(newDate);
		}
	  return dateArrays;
  };

 /**
  * Determine the minimum distance among events.
  * @param {HorizontalTimeline} timeline The timeline with events used for determination.
  */
  function calcMinLapse(timeline) {
		var dateDistances = [];
		for(var i = 1; i < timeline.dateValues.length; i++) { 
	    var distance = daydiff(timeline.dateValues[i-1], timeline.dateValues[i]);
	    if(distance > 0) dateDistances.push(distance);
		}

		return (dateDistances.length > 0 ) ? Math.min.apply(null, dateDistances) : 86400000;
	};

  /**
   * Calculate the time distance between two events.
   * @param {number} first
   * @param {number} second
   */
	function daydiff(first, second) {
		return Math.round((second-first));
	};

  window.HorizontalTimeline = HorizontalTimeline;

  var horizontalTimeline = document.getElementsByClassName('js-cd-h-timeline'),
  	horizontalTimelineTimelineArray = [];
  if(horizontalTimeline.length > 0) {
		for(var i = 0; i < horizontalTimeline.length; i++) {
			horizontalTimelineTimelineArray.push(new HorizontalTimeline(horizontalTimeline[i])); 
		}
		// Navigate the timeline when inside the viewport using the keyboard.
		document.addEventListener('keydown', function(event){
			if( (event.keyCode && event.keyCode == 39) || ( event.key && event.key.toLowerCase() == 'arrowright') ) {
				updateHorizontalTimeline('next'); // move to next event
			} else if((event.keyCode && event.keyCode == 37) || ( event.key && event.key.toLowerCase() == 'arrowleft')) {
				updateHorizontalTimeline('prev'); // move to prev event
			}
		});
  };

 /**
  * @param {string} direction The direction in which to update.
  */
  function updateHorizontalTimeline(direction) {
		for(var i = 0; i < horizontalTimelineTimelineArray.length; i++) {
			if(elementInViewport(horizontalTimeline[i])) keyNavigateTimeline(horizontalTimelineTimelineArray[i], direction);
		}
  };

   /**
    * @param {element} el A timeline element.
    */
	function elementInViewport(el) {
		var top = el.offsetTop;
		var left = el.offsetLeft;
		var width = el.offsetWidth;
		var height = el.offsetHeight;

		while(el.offsetParent) {
		    el = el.offsetParent;
		    top += el.offsetTop;
		    left += el.offsetLeft;
		}

		return (
		    top < (window.pageYOffset + window.innerHeight) &&
		    left < (window.pageXOffset + window.innerWidth) &&
		    (top + height) > window.pageYOffset &&
		    (left + width) > window.pageXOffset
		);
	}
}());