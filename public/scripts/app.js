var username;
var socketId;
var movesChannel;
var presenceChannel;
var positions;

// On document ready, init UI
$(function () {
    initializeUI();
});

// Sets up UI controls
function initializeUI() {

	$('#dancefloor').click(function(e)
	{
		moveDancer(socketId, e.pageX);
		triggerMove(socketId, e.pageX);
	});

    // Set up 'enter name' dialog and open it
    $('#nameDialog').dialog({
        autoOpen: true,
        width: 400,
        modal: true,
        buttons: {
            "Ok": function () {

                var tempUsername = $('#username').val();

                // Check username is not blank
                if (tempUsername.trim() != '') {
                    username = tempUsername;
                    $('#title').empty().append('Welcome ' + username);
                    $(this).dialog("close");

                    initializePusher();
                }
                else
                    return false;
            }
        }
    });

}



// Initialise Pusher setup
function initializePusher() {

    // Open connection to Pusher, specifying app key
    var pusher = new Pusher(PUSHER_CONFIG.APP_KEY);
    
    // Set up Pusher logging to console
    Pusher.log = function (message) {
        if (window.console && window.console.log) {
            window.console.log(message);
        }
    };

    // Set callback for authentication
    Pusher.channel_auth_endpoint = "/auth?username=" + username;
    
    // Get socket ID on connection success
    pusher.connection.bind('connected', function () {
        socketId = pusher.connection.socket_id;
        console.log("Socket ID: " + socketId);
    });

    // Presence channel
    presenceChannel = pusher.subscribe('presence-dancers');

    presenceChannel.bind('pusher:subscription_succeeded', function () {
        getCurrentPositions();
    });

    presenceChannel.bind('pusher:member_added', function (member) {
        addDancer(member.info.name, member.id);
    });

    presenceChannel.bind('pusher:member_removed', function (member) {
        removeDancer(member.id);
    });

    // Presence channel
    movesChannel = pusher.subscribe('private-dancers');

    movesChannel.bind('move', function(data) {
    	moveDancer(data.id, data.left);
    });
}

function getCurrentPositions()
{
	// Get dancer positions
	$.get('/positions', function(data) {
		positions = jQuery.parseJSON(data);
		console.log('Positions: ' + positions);
		addAllDancers();
	});
}

function addAllDancers()
{
	presenceChannel.members.each(function (member) {
        addDancer(member.info.name, member.id);
        
        if(positions[getDancerId(member.id)])
        {
        	moveDancer(member.id, positions[getDancerId(member.id)]);
        }
    });
}

function addDancer(username, id)
{
	$('#dancefloor').append('<div class="dancer" id="' + getDancerId(id) + '"><img src="http://api.twitter.com/1/users/profile_image?screen_name=' + username + '" /></div>');
}

function removeDancer(id, left) {
	$('#' + getDancerId(id)).remove();
}

function moveDancer(id, left) {
	var dancer = $('#' + getDancerId(id));
    dancer.animate({left:(left - dancer.width() / 2)}, { duration: 1500 });
}

function getDancerId(id) {
	return id.replace(".", "");
}

function triggerMove(id, left) {
	$.post('/move', { id: getDancerId(id), left: left, socketId: socketId });
}