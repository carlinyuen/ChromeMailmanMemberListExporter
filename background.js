
// Global Variables & Constants

// Listen for whether or not to show the pageAction icon
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	var response;

	switch (request.request)
	{
		case "showPageAction":
			chrome.pageAction.show(sender.tab.id);
			break;

		case "copyToClipboard":
			response = copyTextToClipboard(request.data);
			break;

		default:
			break;
	}

	if (sendResponse) {
		sendResponse(response);
	}
});

// Listen for if pageAction icon is clicked
chrome.pageAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, {action: "export"}, function(response) {});
});


/////////////////////////////////////////////////////////////////////////////////
// Utility Functions

function copyTextToClipboard(text)
{
	console.log("copyText");
    var copyFrom = $('<textarea/>')
		.attr('id', 'clipboard')
		.text(text)
		.appendTo('body')
		.select();
    document.execCommand('copy', true);
    copyFrom.remove();
	return "Export copied to clipboard.";
}
