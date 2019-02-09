(function(){
	let ltc = {};
		// ltc.map;
		ltc.meetups = [];
		ltc.markers = {};

	var api = {};
		api.group = 'LearnTeachCode';
		api.perPage = 15;
		api.offset = 0;
		api.path = 'https://api.meetup.com/2/events?&sign=true&photo-host=public';
		api.url = api.path + '&group_urlname=' + api.group + '&page=' + api.perPage;
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
		// Append new meetups
		ltc.meetups.push(...data.results);
		// List new meetups
		listMeetups(data);
		mapMeetups(data);
		console.log('ltc.meetups',ltc.meetups);
	}

	function mapMeetups(data){
		let currentMarkers = [];
		if(data.meta.count){
			drawMap();
			data.results.forEach( meetup => {
				// console.log('venue',meetup.venue.name,meetup.venue.id);
				if( Math.abs(meetup.venue.lat) && Math.abs(meetup.venue.lon) ) {
					meetup.popup = { meetings: [] };
					if( ltc.markers[meetup.venue.id] ) {
						meetup.marker = ltc.markers[meetup.venue.id];
						console.log('venue exists!', meetup.venue.name, meetup, meetup.popup);
						let meeting = '<li>('+meetup.id+') <a href="'+meetup.event_url+'" title="'+meetup.name+'">'+meetup.name+'</a></li>';
						meetup.popup.meetings.push( meeting );
						//let content = meetup.popup.getContent();
						let newContent = meetup.marker.getPopup().getContent().split("</ul>")[0] + meeting + "</ul>";
						meetup.marker.setPopupContent( newContent );
						//console.log( meetup.marker.getPopup().getContent().split("</ul>")[0] + meeting + "</ul>" );
					} else {
						meetup.popup.title = '<h4>'+meetup.venue.name+'</h4>';
						meetup.popup.meetings.push( '<li>('+meetup.id+') <a href="'+meetup.event_url+'" title="'+meetup.name+'">'+meetup.name+'</a></li>' );
						meetup.popup.content = meetup.popup.title;
						meetup.popup.content += "<ul>";
						meetup.popup.meetings.forEach( meeting => {
							meetup.popup.content += meeting;
						});
						meetup.popup.content += "</ul>";
						console.log(meetup.popup.meetings);
						// let popup = '<a href="'+meetup.event_url+'" title="'+meetup.name+'">'+meetup.name+'</a>';
						meetup.marker = L.marker([meetup.venue.lat, meetup.venue.lon]).addTo(ltc.map).bindPopup( meetup.popup.content );
						ltc.markers[meetup.venue.id] = meetup.marker;
						currentMarkers.push( meetup.marker );
					}

				}
			});

			if( currentMarkers.length > 0 ) {
				let group = new L.featureGroup( currentMarkers );
				// Pad allows upper northern markers not to be cut off
				ltc.map.fitBounds( group.getBounds().pad(0.5) );
			}
		}
	}

	function drawMap() {
		if( !ltc.map ) {
			ltc.map = L.map('mapid').setView([
				// Los Angeles
				34.0522, -118.2437
			], 13);
		
			// Use Open Street Map default (Mapnik)
			// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			// 	maxZoom: 20,
			//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			// }).addTo(ltc.map);
			
			//// CARTO BASE MAPS - FREE TO USE ////
			//// Max use 75,000 map impressions a Month per CartoDB, Inc.
			//// MAP STYLE: Voyager
			// var CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			//// MAP STYLE: Voyager Labels Under
			var CartoDB_VoyagerLabelsUnder = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 20
			}).addTo(ltc.map);
		}
	}

	// Display Meetup Data
	function listMeetups(data){
		// List Items
		var list = '';

		// Check count of upcoming events
		if(data.meta.count){
			// Get formatted meetups list items
			list = getFormattedMeetups(data.results).join('');
			// If more items are available add a note
			if(data.meta.total_count > data.meta.count && data.meta.count >= api.perPage){
				list += '<li class="load-more"><a href="https://www.meetup.com/LearnTeachCode/events/">Load More</a></li>';
			}
		}else{
			// No upcoming events note
			list += '<li>No Meetups Currently Scheduled. Stay tuned.</li>';
		}

		// Remove load-more button just before adding new elements, which may include new load-more button
		$('.load-more').remove();

		// Add the list to the element
		$(".meetups").append(list);
	}

	/**
	 * formatEvents() will get a set of meetups and format accordingly
	 * @param {meetups}
	 * @returns {(object|Array)}
	 */
	function getFormattedMeetups( meetups ) {
		var formattedMeetups = [];

		// For each event create a list item
		meetups.filter( function( meetup, index) {
			// Setup event date info
			var d = {};
			d.date = new Date(meetup.time);
			d.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			d.month = d.months[d.date.getMonth()];
			d.d = d.date.getDate();
			d.wkdys = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
			d.dow = d.wkdys[ d.date.getDay() ];
			d.day = (d.d > 9)? d.d : "0"+d.d;
			d.time = formatAMPM( d.date );

			// Formant and add current event to list
			formattedMeetups.push(
				'<li class="meetup">'
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

	function formatAMPM(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}

	/**
	 * Get initial set of group meetups
	 */
	$(document).ready(function(){
		// Get intial set of meetups
		getData( api.url, processData, api.err);

		// Click Event for Load More
		$('.meetups').on('click','.load-more a',function(e) {
			e.preventDefault();
			api.offset++;
			getData( api.url + '&offset=' + api.offset, processData, api.err);
		});
	});



})();
