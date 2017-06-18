$(document).ready(function(){

	// Get Meetup Data
	$.ajax({
		type:"GET",
		url:"https://api.meetup.com/2/events?&sign=true&photo-host=public&group_urlname=LearnTeachCode&page=15",
		success: displayMeetups,
		error: function(){console.log("Error occurred processing Meetup API URL");},
		dataType: 'jsonp'
	});

	// Display Meetup Data
	function displayMeetups(data){
		// List Items
		var list = '';

		// Check count of upcoming events
		if(data.meta.count){
			// For each event create a list item
			for (var i=0,l=data.results.length; i < l; i++) {
				// Current event
				var meetup = data.results[i];

				// Setup event date info
				var d = {};
				d.date = new Date(meetup.time);
				d.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
				d.month = d.months[d.date.getMonth()];
				d.d = d.date.getDate();
				d.day = (d.d > 9)? d.d : "0"+d.d;

				// Formant and add current event to list
				list += '<li>'+d.month+' '+d.day+': <a href="'+meetup.event_url+'">'+meetup.name+'</a></li>';
			}
			// If more items are available add a note
			if(data.meta.total_count > data.meta.count){
				list += '<li>More events available: <a href="https://www.meetup.com/LearnTeachCode/#upcoming">View More</a></li>';
			}
		}else{
			// No upcoming events note
			list += '<li>No Meetups Currently Scheduled. Stay tuned.</li>';
		}

		// Add the list to the element
		$(".meetups").html(list);
	}

});
