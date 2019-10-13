// Namespace Object
dasApp = {};

// Caching selectors
dasApp.originInput = $('#origin-input');
dasApp.originDatalist = $('#origin-locations');

// Get location hints
dasApp.searchLocation = searchTerms => {
    $.ajax({
        url: `${dasAppConfig.mbPlaces}${searchTerms}.json?access_token=${dasAppConfig.mbToken}&autocomplete=true&types=place&limit=5`,
        method: 'GET',
        dataType: 'json'
    }).then(data => {
        console.log(data);
    });
}

// init Function
dasApp.init = () => {

    dasApp.originInput.on('keyup', function() {
        originSearchTerms = $(this).val();
        dasApp.searchLocation(originSearchTerms);
    });
};

// Document Ready
$(function() {
    dasApp.init();
});