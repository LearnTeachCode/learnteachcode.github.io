(function(){

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

	// Display Meetup Data
	function displayMeetups(data){
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

		// Remove load-more button, if exists, just before adding new elements
		$('.load-more').remove();
		// Add the list to the element
		$(".meetups").append(list);

		$('.load-more a').click( function(e) {
			e.preventDefault();
			api.offset++;
			getData( api.url + '&offset=' + api.offset, displayMeetups, api.err);
		});
	}

	/**
	 * formatEvents() will get a set of meetups and format accordingly
	 * @param {meetups}
	 * @returns {(object|Array)}
	 */
	function getFormattedMeetups(meetups) {
		var formattedMeetups = [];
		// For each event create a list item
		meetups.filter( function( meetup, index) {
			// Setup event date info
			var d = {};
			d.date = new Date(meetup.time);
			d.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			d.month = d.months[d.date.getMonth()];
			d.d = d.date.getDate();
			d.day = (d.d > 9)? d.d : "0"+d.d;

			// Formant and add current event to list
			formattedMeetups.push('<li>'+d.month+' '+d.day+' - '+meetup.venue.city+': <a href="'+meetup.event_url+'">'+meetup.name+'</a></li>');
		});
		return formattedMeetups;
	}

	/**
	 * Get initial set of group meetups
	 */
	$(document).ready(function(){
		getData( api.url, displayMeetups, api.err);
	});

})();
