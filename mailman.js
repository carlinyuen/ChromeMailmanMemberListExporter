
// Global Variables & Constants
var regex = /mailman.jpg/;
var letter;

// Document ready function
$(function()
{
	// Detect page letter
	letter = getURLParameter('letter');
	console.log("Page Letter:", letter);

	// If no letter, then should clear stored data
	if (!letter) {
		console.log("Clearing Local Storage");
		chrome.storage.local.remove(['exportData', 'continue', 'auto']);
	}
	else	// Check if continuing from previous page
	{
		chrome.storage.local.get('continue', function(data) {
			if (data.continue) {
				console.log("Continuing...");
				runExport();
			}
		});
	}

	// Look for mailman to show page action
	if (regex.test(document.body.innerHTML)) {
		chrome.runtime.sendMessage({request: "showPageAction"});
	}
});

// Listen for messages from background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	switch (request.action)
	{
		case "export":
			runExport();
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
			// Check if there were results and we should set letter as a
			if (members.length && !letter)
			{
				console.log("First page, setting letter to 'a'");
				letter = 'a';

				// See if they want to autorun
				chrome.storage.local.set({auto:
					confirm("Would you like this to run through the list automatically?")
				});
			}

			// Check whether to go to next page
			if (letter != 'c')
			{
				chrome.storage.local.get('auto', function(data)
				{
					var continueResult = data.auto;
					if (!continueResult) {
						continueResult = confirm('Would you like to continue to the next page?');
					}
					if (continueResult) {
						chrome.storage.local.set({continue: true}, function() {
							window.location = $('table').find('center')
								.find('a[href$="' + nextAsciiCharacter(letter) + '"]')
								.first().attr('href');
						});
					}
				});
			}
			else	// Done! Alert user and copy to clipboard
			{
				var exportString = members.join('\n');
				chrome.runtime.sendMessage({request: "copyToClipboard",
					data: exportString}, function(response) {alert(response);});
			}
		});
	});
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
	return String.fromCharCode(c.charCodeAt(0) + 1);
}
