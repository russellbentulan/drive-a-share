// Namespace Object
dasApp = {};

// Caching selectors
dasApp.tripForm = $('#trip-input');
dasApp.originInput = $('#origin-input');
dasApp.destinationInput = $('#destination-input');
dasApp.switchInputsButton = $('#switch-locations');

// Log searched cities with their coordinate array to save extra api requests
dasApp.loggedCoordinates = {};

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
                dasApp.loggedCoordinates[locationInfo.place_name] = locationInfo.center;
            }
        }).catch(err => {
            console.log("There must have been a mistake", err);
        });
    }
}

// Take origin and destination coordinates
dasApp.getNavigationInfo = coordinatesObject => {
    const coordinatesString = coordinatesObject.orgin[0] + "," + coordinatesObject.orgin[1] + ";" + coordinatesObject.destination[0] + "," + coordinatesObject.destination[1];
    
    $.ajax({
        url: `${dasAppConfig.mbDirections}${coordinatesString}.json?access_token=${dasAppConfig.mbToken}`,
        method: 'GET',
        dataType: 'json'
    }).then(navigationObject => {
        const navInfo = navigationObject.routes[0];
        console.log(navInfo.distance, navInfo.duration);
    }).catch(err => {
        console.log("There must have been a mistake", err);
    });
};

// Get origin and destination values and match them to their coordinates
// Query the API for the navigation instructions
dasApp.getFormValues = () => {
    const originName = dasApp.originInput.val();
    const destinationName = dasApp.destinationInput.val();
    const coordinates = {
        orgin: dasApp.loggedCoordinates[originName],
        destination: dasApp.loggedCoordinates[destinationName]
    };
    const navigationInfo = dasApp.getNavigationInfo(coordinates);
}

// init Function
dasApp.init = () => {
    dasApp.tripForm.on('submit', e => {
        e.preventDefault();
        dasApp.getFormValues();
    });
    dasApp.originInput.on('keyup', dasApp.getSearchTerms);
    dasApp.destinationInput.on('keyup', dasApp.getSearchTerms);
    dasApp.switchInputsButton.on('input', e => console.log(e));    
};

// Document Ready
$(function() {
    dasApp.init();
});