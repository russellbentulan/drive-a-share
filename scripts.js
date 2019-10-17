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
app.totalLegs = null;

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

// Convert seconds to hours and minutes
// Check if the drive is long enough to have a string with hours and minutes output
// Return a formatted string to output to the user
app.formatTime = seconds => {
    const hours = Math.floor(seconds/3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let formattedHours,
        formattedMinutes,
        formattedTime = '';
    
    if (hours === 1) {
        formattedHours = hours + ' hour'
    } else {
        formattedHours = hours + ' hours'
    }

    if (minutes === 1) {
        formattedMinutes = minutes + ' minute'
    } else {
        formattedMinutes = minutes + ' minutes'
    }
    
    if ( !hours && !minutes) {
        formattedTime = "This drive is too short!";
    } else if ( !hours ) {
        formattedTime = formattedMinutes;
    } else if (!minutes) {
        formattedTime = formattedHours;
    } else {
        formattedTime = formattedHours + ' and ' + formattedMinutes;
    }
    return formattedTime;
}

// Check each cycle if it has drivers
// Display the drivers in each cycle
app.displayDrivers = () => {
    app.driversContainer.empty();
    
    cycleInfoHtml = `
        <h3>
            Total cycles: ${app.totalCycles}
        </h3>
    `;
    app.driversContainer.append(cycleInfoHtml);
    
    driverInfoHtml = `
        <h4 class="driver">Each person's time behind the wheel: ${app.allDrivers[1].driveTime}</h4>
        <p>Total Drivers: ${app.totalDrivers}</p>
        `;
        app.driversContainer.append(driverInfoHtml);


    /***** WIP *****/
    // for (i = 1; i <= app.totalCycles; i++) {
    //     const thisCycle = i;
    //     const drivingThisCycle = [];
    //     const cycleContainer = $(`<div class="cycle--${i}"></div>`);
    //     for (i = 1; i <= app.totalDrivers; i++) {
    //         if (app.allDrivers[i].cycles.includes(thisCycle)) {
    //             drivingThisCycle.push({
    //                 name: app.allDrivers[i].name,
    //                 driveTime: app.allDrivers[i].driveTime,
    //                 id: i
    //             });
    //         }
    //     }

    //     app.driversContainer.append(cycleContainer);
    //     drivingThisCycle.forEach(function(driver) {
    //         driverHtml = `
    //             <h3 class="driver-info__name">
    //                 <span class="driver-info__title">Name:</span> ${driver.name}
    //             </h3>
    //             <p>
    //                 <span class="driver-info__title">Drive Time:</span> ${driver.driveTime}
    //             </p>
    //         `;
    //         cycleContainer.append(driverHtml);
    //     });
    // }
}

// Add new legs to divide the total drive
// Calculate new drive times for each driver and cycle
// Display driver information on the page
app.newDriverCycle = () => {
    app.totalCycles++;
    app.totalLegs += app.totalDrivers;
    const driveTime = app.totalDuration / app.totalLegs;
    for (i = 1; i <= app.totalDrivers; i++) {
        app.allDrivers[i].driveTime = app.formatTime(driveTime);
        app.allDrivers[i].cycles.push(app.totalCycles);
    }

    app.displayDrivers();
}

// Change total cycles to 0 ( newDriverCycle adds 1 cycle )
// Set an empty drivers object
// Populate the emptied drivers object with new drivers
app.initialCycle = () => {
    app.driversContainer.empty();
    app.totalCycles = 1;
    app.totalLegs = app.totalDrivers;
    app.allDrivers = {};

    const initialTime = app.totalDuration / app.totalLegs;
    for (i = 1; i <= app.totalDrivers; i++) {
        app.allDrivers[i] = {
            name: 'Driver ' + i,
            driveTime: app.formatTime(initialTime),
            id: i,
            cycles: [app.totalCycles],
            isEditable: true
        }
    }
    app.displayDrivers();
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