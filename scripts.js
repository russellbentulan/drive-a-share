// Namespace Object
dasApp = {};

// Caching selectors
dasApp.originInput = $('#origin-input');
dasApp.originDatalist = $('#origin-locations');

// Get location hints from user input
// Add datalist options to the text input based on api response
dasApp.getHintLocations = searchTerms => {
    $.ajax({
        url: `${dasAppConfig.mbPlaces}${searchTerms}.json?access_token=${dasAppConfig.mbToken}&autocomplete=true&types=place&limit=5`,
        method: 'GET',
        dataType: 'json'
    }).then(data => {
        const locationObjects = data.features.values();
        for ( const location of locationObjects ) {
            const datalistHtml = `
                <option value="${location.place_name}">
            `;
            dasApp.originDatalist.append(datalistHtml);
        }
    });
}

// Get value of input element
// Assign possible hint locations to an array every 3rd letter
dasApp.getSearchTerms = function() {
    searchTerms = $(this).val();
    if ( searchTerms.length % 3 === 0 ) {
        dasApp.getHintLocations(searchTerms);
    }
}

// init Function
dasApp.init = () => {
    dasApp.originInput.on('input', dasApp.getSearchTerms);
};

// Document Ready
$(function() {
    dasApp.init();
});