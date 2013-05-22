
// Global Variables & Constants
var ASCII_CODE_LETTER_A = 97;
var ASCII_CODE_NUM_9 = 57;
var START_PAGE_LETTER = '0';
var END_PAGE_LETTER = 'z';
var MAILMAN_REGEX = /mailman.jpg/;
var PAGE_LETTER;

// Document ready function
$(function()
{
	// Detect page letter
	PAGE_LETTER = getURLParameter('letter');

	// If no letter, then should clear stored data
	if (!PAGE_LETTER) {
		chrome.storage.local.remove(['exportData', 'continue', 'auto']);
	}
	else	// Check if continuing from previous page
	{
		chrome.storage.local.get('continue', function(data) {
			if (data.continue)
			{
				console.log("Continuing Mailman Export...");
				runExport();
			}
		});
	}

	// Look for mailman to show page action
	if (MAILMAN_REGEX.test(document.body.innerHTML)) {
		chrome.runtime.sendMessage({request: "showPageAction"});
	}
});

// Listen for messages from background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	switch (request.action)
	{
		case "export":
			// Check if data already exists
			chrome.storage.local.get('exportData', function(data) {
				// Check if user wants to clear data
				if (data.exportData &&
						confirm("Old export data exists, would you like to clear it?")) {
					chrome.storage.local.remove(['exportData', 'continue', 'auto']
						, function() { runExport(); });
				} else {
					runExport();
				}
			});
			break;

		default:
			break;
	}

	sendResponse();
});

// Setup and run export
function runExport()
{
	// Check if it's a member list page
	if (!$('h2:contains("Membership List")').get().length) {
		alert('Could not find membership list on this page!');
		return;
	}

	// Get last saved data
	chrome.storage.local.get('exportData', function(data)
	{
		console.log('exportData:', (data.exportData ? data.exportData.length : "empty"));

		// Export on-page list and save the new data
		var members = exportMemberList($.isEmptyObject(data) ? null : data.exportData);
		chrome.storage.local.set({exportData: members}, function()
		{
			// Check if there were results and we should set letter
			if (members.length && !PAGE_LETTER)
			{
				console.log("First page, setting letter to '" + START_PAGE_LETTER + "'");
				PAGE_LETTER = getNextPageLetter(START_PAGE_LETTER).letter;

				// See if they want to autorun
				chrome.storage.local.set({auto:
					confirm("Would you like this to run through the list automatically?")
				});
			}

			// Check whether we can go to next page
			var nextLetter = getNextPageLetter(nextAsciiCharacter(PAGE_LETTER));
			if (nextLetter && nextLetter.letter <= END_PAGE_LETTER)
			{
				// Check to see if we should automatically move on
				chrome.storage.local.get('auto', function(data)
				{
					var continueResult = data.auto;
					if (!continueResult) {	// If not auto, confirm it with user
						continueResult = confirm('Would you like to continue to the next page?');
					}

					// Save continue state
					chrome.storage.local.set({continue: continueResult}, function()
					{
						// If user said continue, we change url
						if (continueResult) {
							window.location = nextLetter.link.first().attr('href');
						} else {	// Else, finish up here
							finishExport(members);
						}
					});
				});
			}
			else {	// We're done! Alert user and copy to clipboard
				finishExport(members);
			}
		});
	});
}

// Gets next available page letter, link must exist on page,
//	and will also check the current passed letter
function getNextPageLetter(letter)
{
	// Check whether we can go to next page
	for (; letter != END_PAGE_LETTER; letter = nextAsciiCharacter(letter))
	{
		// Look for next page link
		var $link = $('table').find('center')
			.find('a[href$="' + letter + '"]');

		// If next page link exists
		if ($link.get().length) {
			return {letter: letter, link: $link};
		}
	}

	return null;
}

// Export complete
function finishExport(members)
{
	console.log("finishExport:", members.length);

	// Clean up
	chrome.storage.local.remove(['continue', 'auto']);

	// Copy text to clipboard, alert user of response
	var exportString = members.join('\n');
	chrome.runtime.sendMessage({request: "copyToClipboard",
		data: exportString}, function(response) {alert(response);});
}

// Export out member list
function exportMemberList(memberExport)
{
	console.log("runExport:", document.URL);

	if (!memberExport) {
		memberExport = [];
	}
	$('table').find('td').find('input[name=user]').each(function() {
		memberExport.push($(this).val());
	});

	return memberExport;
}


/////////////////////////////////////////////////////////////////////////////////
// Utility Functions

function getURLParameter(name) {
    var uri = (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    return (uri ? decodeURI(uri) : null);	// Will return "null" instead of null
}

function nextAsciiCharacter(c) {
	var charCode = c.charCodeAt(0);
	return String.fromCharCode(charCode == ASCII_CODE_NUM_9
		? ASCII_CODE_LETTER_A : charCode + 1);
}
