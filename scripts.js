// Namespace Object
dasApp = {};

// Caching selectors
dasApp.originInput = $('#origin-input');
dasApp.originDatalist = $('#origin-locations');
dasApp.destinationInput = $('#destination-input');
dasApp.destionationDatalist = $('#destination-locations')


// Get value of input element
// Query data every 3rd change to input
// Add options to the datalist using the response
dasApp.getSearchTerms = function() {
    searchTerms = $(this).val();
    if ( searchTerms.length % 3 === 0 ) {
        $.ajax({
            url: `${dasAppConfig.mbPlaces}${searchTerms}.json?access_token=${dasAppConfig.mbToken}&autocomplete=true&types=place&limit=5`,
            method: 'GET',
            dataType: 'json'
        }).then(data => {
            const allLocations = data.features.values();
            for (const location of allLocations) {
                const optiontHtml = `<option value="${location.place_name}"`;
                $(this).next('datalist').append(optiontHtml);
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