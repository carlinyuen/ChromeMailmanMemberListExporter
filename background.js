
// Global Variables & Constants

// Listen for whether or not to show the pageAction icon
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	switch (request.request)
	{
		case "showPageAction":
			chrome.pageAction.show(sender.tab.id);
			break;

		default:
			break;
	}

	sendResponse();
});

// Listen for if pageAction icon is clicked
chrome.pageAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, {action: "export"}, function(response) {});
});
