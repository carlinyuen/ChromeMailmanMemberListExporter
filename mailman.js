
// Global Variables & Constants
var regex = /mailman.jpg/;

// Document ready function
$(function()
{
	// Look for mailman
	if (regex.test(document.body.innerText)) {
		chrome.runtime.sendMessage({request: "showPageAction"}
			, function(response) {});
	}

});

// Listen for messages from background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	console.log("content onMessage:", request);

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

function runExport()
{
}
