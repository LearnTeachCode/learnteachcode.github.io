(function(){
	const ltc = {};
		ltc.map;
		ltc.meetups = [];
		ltc.markers = {};
	
//COMBINE WITH DATE FUNCTION
	// get week range for meetups
	let days = getCurrentDates(2);
	let today = new Date;
	// let firstDow = today.getDate() - days[0].date + 1;
	// let lastDow = days[days.length -1].date - today.getDate(); // next week Saturday
	// let firstDow = 0;
	let lastDow = 14 - today.getDay();
	console.log(days);
	console.log('todays date', today.getDate());
	// console.log(firstDow, lastDow);
	// let firstDow = 7;
	// let lastDow = 28;
	const api = {};
		api.group = 'LearnTeachCode';
		// api.perPage = 21; 
		api.offset = 0;
		api.path = 'https://api.meetup.com/2/events?&sign=true&photo-host=public';
		// api.startWeekDate = firstDow + 'd'; //-4d, 
		api.startWeekDate = '0';
		api.endWeekDate = lastDow + 'd'; // 23
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
		console.log(data);
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
		let currentMarkers = [];
		if(data.meta.count){
			drawMap();
			data.results.forEach( meetup => {
				// console.log('venue',meetup.venue.name,meetup.venue.id);
				if( Math.abs(meetup.venue.lat) && Math.abs(meetup.venue.lon) ) {
					let meeting = '<li>'+meetup.d.month+' '+meetup.d.d+': <a href="#meetup-'+meetup.id+'" title="'+meetup.name+'">'+meetup.name+'</a></li>';
					meetup.popup = { meetings: [] };
					if( ltc.markers[meetup.venue.id] ) {
						meetup.marker = ltc.markers[meetup.venue.id];
						// console.log('venue exists!', meetup.venue.name, meetup, meetup.popup);
						
						meetup.popup.meetings.push( meeting );
						//let content = meetup.popup.getContent();
						let newContent = meetup.marker.getPopup().getContent().split("</ul>")[0] + meeting + "</ul>";
						meetup.marker.setPopupContent( newContent );
						//console.log( meetup.marker.getPopup().getContent().split("</ul>")[0] + meeting + "</ul>" );
					} else {
						meetup.popup.title = '<strong>' + meetup.venue.name + '</strong>';
						meetup.popup.location = '<br><small>' + meetup.venue.address_1 +', ';
						meetup.popup.location += meetup.venue.city +', '+ meetup.venue.state.toUpperCase();
						meetup.popup.location += ( (meetup.venue.zip)? ', '+meetup.venue.zip : '' )+'</small>';
						meetup.popup.meetings.push( meeting );
						meetup.popup.content = meetup.popup.title + meetup.popup.location;
						meetup.popup.content += "<ul>";
						meetup.popup.meetings.forEach( meeting => {
							meetup.popup.content += meeting;
						});
						meetup.popup.content += "</ul>";
						// console.log(meetup.popup.meetings);

						// let popup = '<a href="'+meetup.event_url+'" title="'+meetup.name+'">'+meetup.name+'</a>';
						meetup.marker = L.marker([meetup.venue.lat, meetup.venue.lon]).bindPopup( meetup.popup.content ).addTo(ltc.map);
						ltc.markers[meetup.venue.id] = meetup.marker;
						currentMarkers.push( meetup.marker );
					}

				}
			});

			if( currentMarkers.length > 0 ) {
				let group = new L.featureGroup( currentMarkers );
				ltc.map.fitBounds( group.getBounds() );
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

		let days = data.days;
		console.log('testing', days);
		let meetups = data.results;

		// REMOVE UNNECESSARY, COMBINE with DATE FUNCTION
		// let today = new Date();
		// let maxDay = new Date(today.getDate()+5);
		// let maxTime = maxDay.getTime(); //compare by utc time

		// let filteredMeetups = meetups.filter((meetup) => meetup.time >= maxTime);

		let meetupsByDay = getWeekFormattedMeetups(meetups);

//COMBINE BELOW 
		for(let i=0; i <= 6; i++) {
			let week1div = '<div class="day" id="' + days[i].dow.toLowerCase() + days[i].date + '"></div>';
			document.querySelector('#firstweek').insertAdjacentHTML('beforeend', week1div);
		}

		for(let i=7; i <= 13; i++) {
			let week2div = '<div class="day" id="' + days[i].dow.toLowerCase() + days[i].date + '"></div>';
			document.querySelector('#secondweek').insertAdjacentHTML('beforeend', week2div);
		}

		for(let i=0; i < days.length; i++) {
			let weekday = days[i];
			let dowDay = weekday.dow.substring(0,3) + weekday.date;
			let meetupString = meetupsByDay[dowDay];
			let formattedWeek = '<div class="weekday">'
				+ weekday.dow.substring(0,3) + ' ' 
				+ weekday.month.substring(0,3) + ' ' 
				+ weekday.date
				+ '</div>';
				console.log(weekday);
			if(meetupString) {
				formattedWeek += meetupString.join('');	

			} else {
				formattedWeek += '<div class="week-meetup-none">No meetups!</div';
			}			
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

			let formattedMeetup = '<li id="meetup-' + meetup.id + '" class="week-meetup">'
			+ '<div class="week-time">' + d.time + '</div>'
			+ '<div class="week-infobox">' 
			// + ' <div class="date">' + d.dowFull + ' ' + d.day + '</div>'
			+ ' <div class="title"><a href="' + meetup.event_url + '">' + meetup.name + '</a></div>'
			+ ' <div class="week-city">' + meetup.venue.city + ' - ' + meetup.venue.name + '</div>'
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
				'<li id="meetup-' + meetup.id + '" class="list-meetup">'
				+ '<div class="datebox">'
				+ ' <div class="dow">' + d.dow + '</div>'
				+ ' <div class="date">' + d.month + ' ' + d.day + '</div>'
				+ ' <div class="time">' + d.time	+ '</div>'
				+ '</div>'
				+ '<div class="infobox">'
				+ ' <div class="title"><a href="' + meetup.event_url + '">' + meetup.name + '</a></div>'
				+ ' <div class="city">' + meetup.venue.city + ' - ' + meetup.venue.name + '</div>'
				+ '</div>'
				+'</li>'
			);
		});
		return formattedMeetups;
	}
// ADD TO DATE FUNCTION
	// Get Week Range
	// function getWeekRange() {
	// 	const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	// 	const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	// 	let d = new Date; //get current date

	// 	let first = d.getDate() - d.getDay(); //date - dow in num 22 - 5 = 17
	// 	let firstday = (new Date(d.setDate(first - 1))).toUTCString();
	// 	let week = [firstday];

	// 	for(let i=0; i<21; i++) {
	// 		let next = new Date(d.getTime());
	// 		next.setDate(first+i);
	// 		week.push({
	// 			dow: weekdays[next.getDay()],
	// 			date: next.getDate(),
	// 			month: months[next.getMonth()]
	// 		});
	// 	}
	// 	return week;
	// }
	// Get Week Range
	function getCurrentDates(numOfWeeks) {
		const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const weekdays = ['Sunday','Monday','Tueday','Wednesday','Thursday','Friday','Saturday'];
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
		$( "#weekbutton" ).on('click', function() {     
			$('.listview').hide();
			$('.weekview').show();
			$('.dots').show();
		});

		$( "#listbutton" ).on('click', function() {     
			$('.weekview').hide();
			$('.listview').show();
			$('.dots').hide();
		});

		// Click Event for Load More
		$('.listview').on('click', '.load-more a', function(e) {
			e.preventDefault();
			api.offset++;
			getData( api.url + '&offset=' + api.offset, processData, api.err);
		});

		// Click Popup Event (when it exists) link to go to info
		$('#mapid').on('click', '.leaflet-popup-content a', function(evt) {
			evt.preventDefault();
			let id = evt.target.hash.replace("#", "");
			let meetupListItem = document.getElementById( id );
			meetupListItem.scrollIntoView();
			meetupListItem.classList.add('active');
			setTimeout( () => { meetupListItem.classList.remove('active'); }, 3000);
		});

	});

})();
