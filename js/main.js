/*! @license
 *  Project: Google Map
 *  Description: Google Map Interface which extends to multi market
 *  Author: Sanyam Agrawal
 *  Date : 26/03/2015 (DD/MM/YYYY)
 *  License: Apache License v2.0
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function($, window, document, undefined) {
    "use strict";
    var element = $("#map_canvas").get(0);

    function initialize() {
        var mapOptions = {
                zoom: 8,
                center: new google.maps.LatLng(-34.397, 150.644)
            },
            map = new google.maps.Map(element, mapOptions);
    }

    google.maps.event.addDomListener(window, "load", initialize);
})(jQuery, window, document);
