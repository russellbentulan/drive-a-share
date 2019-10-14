// Namespace Object
dasApp = {};

// Caching selectors
dasApp.tripForm = $('#trip-input');
dasApp.originInput = $('#origin-input');
dasApp.destinationInput = $('#destination-input');
dasApp.switchInputsButton = $('#switch-locations');
dasApp.driversInput = $('#drivers-input');
dasApp.distanceOutput = $('#distance-output');
dasApp.durationOutput = $('#duration-output');
dasApp.driversContainer = $('#drivers-container');

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
            // TODO: Add a section to the page displaying the error
            console.log("There must have been a mistake", err);
        });
    }
}

// Convert distance to km and output to the page
// Convert duration to hours and output to the page
dasApp.showNavigationInfo = (distance, duration) => {
    const distanceInKm = Math.round(distance/1000);
    dasApp.distanceOutput.html(distanceInKm + "KM");

    const durationHrs = Math.floor(duration/3600);
    const durationMin = Math.floor((duration % 3600) / 60);
    if (durationHrs) {
        const durationString = `${durationHrs} Hours and ${durationMin} Minutes`;
        dasApp.durationOutput.html(durationString);
    } else {
        const durationString = `${durationMin} Minutes`;
        dasApp.durationOutput.html(durationString);
    }
}

// Take total duration of drive and divide it between the drivers
// Convert the times to hours and minutes and display on the page
dasApp.calculateDriverTimes = totalDuration => {
    totalDrivers = dasApp.driversInput.val();
    dividedTime = totalDuration/totalDrivers;
    dividedTimeHrs = Math.floor(dividedTime/3600);
    dividedTimeMin = Math.floor((dividedTime % 3600) / 60);
    for (i = totalDrivers; i > 0; i--) {
        let timeString;
        if (dividedTimeHrs) {
            timeString = `Driver ${i}: ${dividedTimeHrs} Hours and ${dividedTimeMin} Minutes`;
        } else {
            timeString = `Driver ${i}: ${dividedTimeMin} Minutes`;
        }
        let driverHtml = `<p class="driver-info driver-${i}">${timeString}</p>`;
        dasApp.driversContainer.prepend(driverHtml);
    }
}

// Take origin and destination coordinates
// Query the API for directions
// If there is navigation information, place it onto the page
dasApp.getNavigationInfo = coordinatesObject => {
    const coordinatesString = coordinatesObject.orgin[0] + "," + coordinatesObject.orgin[1] + ";" + coordinatesObject.destination[0] + "," + coordinatesObject.destination[1];
    
    $.ajax({
        url: `${dasAppConfig.mbDirections}${coordinatesString}.json?access_token=${dasAppConfig.mbToken}`,
        method: 'GET',
        dataType: 'json'
    }).then(navigationObject => {
        const navInfo = navigationObject.routes[0];
        if (navInfo) {
            dasApp.showNavigationInfo(navInfo.distance, navInfo.duration);
            dasApp.calculateDriverTimes(navInfo.duration);
        } else {
            console.log("Sorry, there were no directions found for these locations.")
        }
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
    dasApp.getNavigationInfo(coordinates);
}

dasApp.switchInputs = () => {
    const tempOriginVal = dasApp.originInput.val();
    dasApp.originInput.val(dasApp.destinationInput.val());
    dasApp.destinationInput.val(tempOriginVal);
}

// init Function
dasApp.init = () => {
    dasApp.tripForm.on('submit', e => {
        e.preventDefault();
        dasApp.getFormValues();
    });
    dasApp.originInput.on('keyup', dasApp.getSearchTerms);
    dasApp.destinationInput.on('keyup', dasApp.getSearchTerms);
    dasApp.switchInputsButton.on('click', dasApp.switchInputs);    
};

// Document Ready
$(function() {
    dasApp.init();
});