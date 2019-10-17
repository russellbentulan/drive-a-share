// Namespace Object
app = {};

// Caching Selectors
//  Trip Form inputs
app.tripForm = $('#trip-input');
app.originInput = $('#origin-input');
app.destinationInput = $('#destination-input');
app.switchInputsButton = $('#switch-locations');
app.driversInput = $('#drivers-input');

//  Trip information outputs
app.distanceOutput = $('#distance-output');
app.durationOutput = $('#duration-output');
app.driversContainer = $('#drivers-container');

//  Trip augmenting inputs
app.addCycleButton = $('#add-cycle');

// Global variables
app.totalDuration = null;
app.totalDistance = null;
app.totalDrivers = null;
app.totalCycles = null;

// Log searched cities with their coordinate array to save extra api requests
app.loggedCoordinates = {};

// Dynamically search for cities with corresponing geographic coordinates
// Query API once 3 or  more letters have been entered
// Check if the datalist contains the option returned
// Add options to the datalist using the response
// Log location name and coordinates into a global object (only if it doesn't exist already)
app.getSearchTerms = function() {
    searchTerms = $(this).val();
    if ( searchTerms.length >= 3 ) {
        $.ajax({
            url: `${appConfig.mbPlaces}${searchTerms}.json?access_token=${appConfig.mbToken}&autocomplete=true&types=place&limit=5`,
            method: 'GET',
            dataType: 'json'
        }).then(data => {
            const allLocations = data.features.values();
            for (const locationInfo of allLocations) {
                if (!app.loggedCoordinates[locationInfo.place_name]) {
                    app.loggedCoordinates[locationInfo.place_name] = locationInfo.center;
                    const optionHtml = `<option value="${locationInfo.place_name}"`;
                    $(this).next('datalist').append(optionHtml);
                }
            }
        }).catch(err => {
            // TODO: Add a section to the page displaying the error
            console.log("There must have been a mistake", err);
        });
    }
}

// Convert distance to km and output to the page
// Convert duration to hours and output to the page
app.showNavigationInfo = () => {
    const distanceInKm = Math.round(app.totalDistance/1000);
    app.distanceOutput.html(distanceInKm + "KM");

    const durationHrs = Math.floor(app.totalDuration / 3600);
    const durationMin = Math.floor((app.totalDuration % 3600) / 60);
    if (durationHrs) {
        const durationString = `${durationHrs} Hours and ${durationMin} Minutes`;
        app.durationOutput.html(durationString);
    } else {
        const durationString = `${durationMin} Minutes`;
        app.durationOutput.html(durationString);
    }
}

/*  CHANGING THIS */
// Take total duration of drive and divide it between the drivers
// Convert the times to hours and minutes and display on the page
// Add event listener to add a cycle for each driver
app.calculateDriverTimesxxx = () => {
    dividedTime = app.totalDuration / app.totalDrivers;
    dividedTimeHrs = Math.floor(dividedTime/3600);
    dividedTimeMin = Math.floor((dividedTime % 3600) / 60);
    for (i = 1; i <= app.totalDrivers; i++) {
        let timeString;
        if (dividedTimeHrs) {
            timeString = `${dividedTimeHrs} Hours and ${dividedTimeMin} Minutes`;
        } else {
            timeString = `${dividedTimeMin} Minutes`;
        }
        let driverHtml = `<h3 class="driver-info driver-${i}">Driver ${i}</h3>${timeString}`;
        app.driversContainer.append(driverHtml);
    }

    app.addCycleButton.on('click', app.newDriverCycle);
}

// Convert seconds to hours and minutes
// Return a formatted string to output to the user
app.formatTime = seconds => {
    const hours = Math.floor(seconds/3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let formattedHours,
        formattedMinutes,
        formattedTime = '';
    
    if (hours === 1) {
        formattedHours = hours + 'hour'
    } else {
        formattedHours = hours + 'hours'
    }

    if (minutes === 1) {
        formattedMinutes = minutes + 'minute'
    } else {
        formattedMinutes = minutes + 'minutes'
    }
    
    if (!hours) {
        formattedTime = formattedMinutes;
    } else if (!minutes) {
        formattedTime = formattedHours;
    } else {
        formattedTime = formattedHours + ' ' + formattedMinutes;
    }

    return formattedTime;
}

// Take global drivers object information and display it to the page
app.displayDriver = () => {
    app.driversContainer.empty();

    for (i = 1; i <= app.totalDrivers; i++) {
        const driverInfo = app.allDrivers[i];
        console.log(driverInfo);
    }
}

// Take total drive time and divide it between drivers on the first cycle
// Calculate new drive times when there are 2 or more cycles
// Display driver information on the page
app.newDriverCycle = () => {
    app.totalCycles++;

    if (app.totalCycles === 1) {
        const initialTime = app.totalDuration / app.totalDrivers;
        for (i = 1; i <= app.totalDrivers; i++) {
            app.allDrivers[i] = {
                name: 'Driver ' + i,
                driveTime: initialTime,
                cycles: [app.totalCycles]
            }
        }
        app.displayDriver();
    } else {
        const driveTime = app.totalDuration / app.totalDrivers / app.totalCycles;
        for (i = 1; i <= app.totalDrivers; i++) {
            app.allDrivers[i].driveTime = driveTime;
            app.allDrivers[i].cycles.push(app.totalCycles);
        }
        app.displayDriver();
    }
}

// Change total cycles to 0 ( newDriverCycle adds 1 cycle )
// Set an empty drivers object
app.initialCycle = () => {
    app.totalCycles = 0;
    app.allDrivers = {};
    app.newDriverCycle();
}

// Take origin and destination coordinates when form is submitted
// Query the API for directions
// If there is navigation information, save the information
// Output trip information and initiate the first driving cycle
app.getNavigationInfo = coordinatesObject => {
    const coordinatesString = coordinatesObject.orgin[0] + "," + coordinatesObject.orgin[1] + ";" + coordinatesObject.destination[0] + "," + coordinatesObject.destination[1];
    
    $.ajax({
        url: `${appConfig.mbDirections}${coordinatesString}.json?access_token=${appConfig.mbToken}`,
        method: 'GET',
        dataType: 'json'
    }).then(navigationObject => {
        const navInfo = navigationObject.routes[0];
        if (navInfo) {
            app.totalDuration = navInfo.duration;
            app.totalDistance = navInfo.distance;
            app.totalDrivers = app.driversInput.val();
            
            app.showNavigationInfo();
            app.initialCycle();
        } else {
            console.log("Sorry, there were no directions found for these locations.")
        }
    }).catch(err => {
        console.log("There must have been a mistake", err);
    });
};

// When user submits the form, get the origin and destination names and match them to their coordinates
// Query the API for the navigation instructions
app.getFormValues = () => {
    const originName = app.originInput.val();
    const destinationName = app.destinationInput.val();
    const coordinates = {
        orgin: app.loggedCoordinates[originName],
        destination: app.loggedCoordinates[destinationName]
    };
    app.getNavigationInfo(coordinates);
}

// Take the values from each location input and flip them around
app.switchInputs = () => {
    const tempOriginVal = app.originInput.val();
    app.originInput.val(app.destinationInput.val());
    app.destinationInput.val(tempOriginVal);
}

// init Function
app.init = () => {
    app.originInput.on('input', app.getSearchTerms);
    app.destinationInput.on('input', app.getSearchTerms);
    app.switchInputsButton.on('click', app.switchInputs);    
    app.tripForm.on('submit', e => {
        e.preventDefault();
        app.getFormValues();
    });
    app.addCycleButton.on('click', app.newDriverCycle);
};

// Document Ready
$(function() {
    app.init();
});