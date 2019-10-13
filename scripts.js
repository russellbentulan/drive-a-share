// Namespace Object
dasApp = {};

// Caching selectors
dasApp.originInput = $('#origin-input');
dasApp.destinationInput = $('#destination-input');

// Log searched cities with their coordinate array to save extra api requests
dasApp.loggedLocations = {};

// Get value of input element
// Query data once 3 or more letters have been entered
// Add options to the datalist using the response
// Save location name and coordinate array into the log object
dasApp.getSearchTerms = function() {
    searchTerms = $(this).val();
    if ( searchTerms.length >= 3 ) {
        $.ajax({
            url: `${dasAppConfig.mbPlaces}${searchTerms}.json?access_token=${dasAppConfig.mbToken}&autocomplete=true&types=place&limit=5`,
            method: 'GET',
            dataType: 'json'
        }).then(data => {
            const allLocations = data.features.values();
            for (const locationInfo of allLocations) {
                const optiontHtml = `<option value="${locationInfo.place_name}"`;
                $(this).next('datalist').append(optiontHtml);
                dasApp.loggedLocation[locationInfo.place_name] = locationInfo.center;
            }
        }).catch(err => {
            console.log("There must have been a mistake", err);
        });
    }
}

// init Function
dasApp.init = () => {
    dasApp.originInput.on('input', dasApp.getSearchTerms);
    dasApp.destinationInput.on('input', dasApp.getSearchTerms);
};

// Document Ready
$(function() {
    dasApp.init();
});