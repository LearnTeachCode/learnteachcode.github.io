(function(){
	const ltc = {};
		ltc.map;
		ltc.meetups = [];
		ltc.markers = {};
	
	// get week range for meetups
	let today = new Date;
	let lastDow = 14 - today.getDay();
	const api = {};
		api.group = 'LearnTeachCode';
		api.offset = 0;
		api.path = 'https://api.meetup.com/2/events?&sign=true&photo-host=public';
		api.startWeekDate = '0';
		api.endWeekDate = lastDow + 'd';
		api.status = 'upcoming';
		api.url = api.path + '&group_urlname=' + api.group + '&status=' + api.status + '&time=' + api.startWeekDate + ',' + api.endWeekDate;
		api.err = "Error occurred processing Meetup API URL";

	// Get Meetup Data
	function getData(url, successFunc, errMsg) {
		$.ajax({
			type: "GET",
			url: url,
			success: successFunc,
			error: function(){ console.log( errMsg ); },
			dataType: 'jsonp'
		});
	}

	function processData(data) {
		data.days = getCurrentDates(2);
		data.results.forEach( function( meetup, index ) {
			// Get event formatted dates and time
			data.results[index].d = getDateFormats( meetup );
		});
		// Append new meetups
		ltc.meetups.push(...data.results);
		// List new meetups
		listMeetups(data);
		mapMeetups(data);
		listMeetupsinWeekView(data);
	}

	function mapMeetups(data){
		if (data.meta.count > 0) {

			data.results.forEach( meetup => {
				let meetingListItem, updatedPopupContent;
				let has = {
					lat: !!Math.abs(meetup.venue.lat),
					lon: !!Math.abs(meetup.venue.lon),
					venue: meetup.venue.name.toLowerCase().trim() !== "online event"
				};
				
				if (has.lat && has.lon && has.venue) {
					meetingListItem = '<li>'+meetup.d.month+' '+meetup.d.d+': <a href="#meetup-'+meetup.id+'" title="'+meetup.name+'">'+meetup.name+'</a></li>';
					meetup.popup = { meetings: [] };
					if( ltc.markers[meetup.venue.id] ) {
						meetup.marker = ltc.markers[meetup.venue.id];
						meetup.popup.meetings.push( meetingListItem );
						updatedPopupContent = meetup.marker.getPopup().getContent().split("</ul>")[0] + meetingListItem + "</ul>";
						meetup.marker.setPopupContent( updatedPopupContent );
					} else {
						meetup.popup.title = '<strong>' + meetup.venue.name + '</strong>';
						meetup.popup.location = '<br><small>' + meetup.venue.address_1 +', ';
						meetup.popup.location += (meetup.venue.city)? meetup.venue.city : '';
						meetup.popup.location += (meetup.venue.state)? ', '+ meetup.venue.state.toUpperCase() : '';
						meetup.popup.location += ( (meetup.venue.zip)? ', '+meetup.venue.zip : '' )+'</small>';
						meetup.popup.meetings.push( meetingListItem );
						meetup.popup.content = meetup.popup.title + meetup.popup.location;
						meetup.popup.content += "<ul>";
						meetup.popup.meetings.forEach( meeting => {
							meetup.popup.content += meeting;
						});
						meetup.popup.content += "</ul>";

						meetup.marker = L.marker([meetup.venue.lat, meetup.venue.lon]).bindPopup( meetup.popup.content );
						ltc.markers[meetup.venue.id] = meetup.marker;
					}
				}
			});

			// Check if ltc.markers (object values = actual markers object) exist
			if( Object.values(ltc.markers).length > 0 ) {
				drawMap();
				// Create grouping markers and add group of markers to map
				ltc.map.featureGroup = new L.featureGroup( Object.values(ltc.markers) ).addTo(ltc.map);
				// Size the map to the boundries of outer most markers and give it a little padding
				ltc.map.fitBounds( ltc.map.featureGroup.getBounds().pad(0.1) );
			}
		}
	}

	function drawMap() {
		// If a map has not been created
		if( !ltc.map ) {
			// Add height to map div via active class
			document.getElementById('mapid').classList.add('active');

			// Map Center Coordinates
			let latlng = [ 34.0522, -118.2437 ];  // Los Angeles
			let zoomlevel = 13;                   // Greater LA Metro Zoom view

			// Initialize Map and assign to ltc.map
			ltc.map = L.map('mapid').setView( latlng, zoomlevel );
		
			// Use Open Street Map default (Mapnik)
			// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			// 	maxZoom: 20,
			//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			// }).addTo(ltc.map);
			
			//// CARTO BASE MAPS - FREE TO USE ////
			//// Max use 75,000 map impressions a Month per CartoDB, Inc.
			//// MAP STYLE: Voyager
			// L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			//// MAP STYLE: Voyager Labels Under
			L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 20
			}).addTo(ltc.map);
		}
	}

	// Display Meetup Data
	function listMeetups(data){
		// List Items
		let list = '';

		// Check count of upcoming events
		if(data.meta.count){
			// Get formatted meetups list items
			list = getFormattedMeetups(data.results).join('');
			// If more items are available add a note
			if(data.meta.total_count > data.meta.count && data.meta.count >= api.perPage){
				list += '<li class="load-more"><a href="https://www.meetup.com/LearnTeachCode/events/">Load More</a></li>';
			}
		} else{
			// No upcoming events note
			list += '<li>No Meetups Currently Scheduled. Stay tuned.</li>';
		}

		// Remove load-more button just before adding new elements, which may include new load-more button
		$('.load-more').remove();

		// Add the list to the element
		$(".listview").append(list);
	}

	// Display Meetup Data in Week View
	function listMeetupsinWeekView(data) {

		let today = new Date();
		let weekdays = getDays();
		let days = data.days;
		let meetups = data.results;

		let meetupsByDay = getWeekFormattedMeetups(meetups);

		// 14 days, 0-indexed
		for(let i=0; i < 14; i++) {
			// Determine which week we're on
			let weekid = ( i<7 ) ? 'first' : 'second';
			let weekdiv = '<div class="day" id="' + days[i].dow.toLowerCase() + days[i].date + '"></div>';
			document.querySelector('#' + weekid + 'week').insertAdjacentHTML('beforeend', weekdiv);
		}

		for(let i=0; i < days.length; i++) {
			let weekday = days[i];
			let dowDay = weekday.dow.substring(0,3) + weekday.date;
			let meetupString = meetupsByDay[dowDay];
			let isToday = ( (weekdays[today.getDay()].substring(0, 3) + today.getDate()) == dowDay )? " today" : "";
			let formattedWeek = '<div class="weekday'+ isToday + '">'
				+ weekday.dow.substring(0,3) + ' ' 
				+ weekday.month.substring(0,3) + ' ' 
				+ weekday.date
				+ '</div>';
			// If meetups exist
			if(meetupString) {
				formattedWeek += meetupString.join('');	
			// Otherwise indicate no meetups for the day
			} else {
				formattedWeek += '<div class="week-meetup-none">No meetups!</div';
			}
			// Append to weekday
			$('#' + weekday.dow.toLowerCase() + weekday.date).append(formattedWeek);
		}
	}

	// Format Meetup Data for Week View
	function getWeekFormattedMeetups( meetups ) {
	
		let dayArrays = {};

		// For each event create a list item
		meetups.forEach( function( meetup ) {
			let d = getDateFormats( meetup );
			// does d.dow exist within dayArray as array, if not create array
			let dowDay = d.dow + d.d;
			if( !dayArrays[dowDay] ) {
				dayArrays[dowDay] = [];
			}

			let formattedMeetup = '<li id="week-meetup-' + meetup.id + '" class="week-meetup">'
			+ '<div class="week-time">' + d.time + '</div>'
			+ '<div class="week-infobox">' 
			+ ' <div class="title"><a href="' + meetup.event_url + '">' + meetup.name + '</a></div>'
			+ ' <div class="week-city">' + ((meetup.venue.city)?meetup.venue.city+ ' - ' :'') + meetup.venue.name + '</div>'
			+ '</div>'
			+'</li>';
			
			dayArrays[dowDay].push(formattedMeetup);
		});
		return dayArrays;
	}
	/**
	 * formatEvents() will get a set of meetups and format accordingly
	 * @param {meetups}
	 * @returns {(object|Array)}
	 */
	function getFormattedMeetups( meetups ) {
		let formattedMeetups = [];

		// For each event create a list item
		meetups.filter( function( meetup ) {
			// Get event formatted dates and time
			let d = getDateFormats( meetup );

			// Formant and add current event to list
			formattedMeetups.push(
				'<li id="list-meetup-' + meetup.id + '" class="list-meetup">'
				+ '<div class="datebox">'
				+ ' <div class="dow">' + d.dow + '</div>'
				+ ' <div class="date">' + d.month + ' ' + d.day + '</div>'
				+ ' <div class="time">' + d.time	+ '</div>'
				+ '</div>'
				+ '<div class="infobox">'
				+ ' <div class="title"><a href="' + meetup.event_url + '">' + meetup.name + '</a></div>'
				+ ' <div class="city">' + ((meetup.venue.city)?meetup.venue.city + ' - ':'') + meetup.venue.name + '</div>'
				+ '</div>'
				+'</li>'
			);
		});
		return formattedMeetups;
	}

	// Get Week Range
	function getCurrentDates(numOfWeeks) {
		const months = getMonths();
		const weekdays = getDays();
		let numOfDays = numOfWeeks * 7;
		let days = [];
		let today = new Date;
		let firstDay = today.getDate() - today.getDay();
		
		for(let i=0; i<numOfDays; i++) {		 
			let nextDate = new Date(today.getTime()); 
			nextDate.setDate(firstDay+i);
			days.push({
				dow: weekdays[nextDate.getDay()],
				date: nextDate.getDate(),
				month: months[nextDate.getMonth()],
				year: nextDate.getFullYear()
			});
		}
		return days;

	}
	function getDateFormats(meetup) {
		const months = getMonths();
		const weekdays = getDays();
		const dt = new Date(meetup.time);

		// Setup event date info
		let d = {};
		d.year = dt.getFullYear();
		d.yyyy = d.year;
		d.monthFull = months[dt.getMonth()];
		d.month = d.monthFull.substring(0, 3);
		d.m = dt.getMonth()+1;
		d.mm = (d.m > 9)? d.m : "0"+d.m;
		d.d = dt.getDate();
		d.dowFull = weekdays[dt.getDay()];
		d.dow = d.dowFull.substring(0, 3);
		d.day = (d.d > 9)? d.d : "0"+d.d;
		d.dd = d.day;
		d.time = formatAMPM( dt );
		return d;
	}

	function getMonths() {
		return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	}

	function getDays() {
		return ['Sunday','Monday','Tueday','Wednesday','Thursday','Friday','Saturday'];
	}

	function formatAMPM(date) {
		let hours = date.getHours();
		let minutes = date.getMinutes();
		let ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		let strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}

	/**
	 * Get initial set of group meetups
	 */
	$(document).ready(function() {
		// Get intial set of meetups
		getData( api.url, processData, api.err);

		// Toggle between calendar and list views
		
		$('.viewLinks').on('click', '.button', function(e) {
			e.preventDefault();
			$('.viewLinks .button').removeClass('active');
			$('.view').removeClass('showing');
			$(this).addClass('active');
			$('.view.' + this.id ).addClass('showing');
		});

		// Click Event for Load More
		$('.listview').on('click', '.load-more a', function(e) {
			e.preventDefault();
			api.offset++;
			getData( api.url + '&offset=' + api.offset, processData, api.err);
		});

		// Click Popup Event (when it exists) link to go to info
		$('#mapid').on('click', '.leaflet-popup-content a', function(e) {
			e.preventDefault();
			let id = e.target.hash.replace("#", "");
			let activeView = document.querySelector('.view.showing');
			let meetupListItem = activeView.querySelector("[id$='"+id+"']");
			if ( meetupListItem ) {
				meetupListItem.scrollIntoView();
				meetupListItem.classList.add('active');
				setTimeout( () => { meetupListItem.classList.remove('active'); }, 3000);
			}
		});

	});

})();
