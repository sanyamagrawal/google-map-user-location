/*
1. Assume a sample large (50K items) JSON data set (e.g USA users for a site with location information)
2. Render a Google map, with pins shown for each state (e.g X users from California)
3. On zoom in, show the pins for each city (e.g X users from Palo Alto)
4. On zoom in further, show the pins for each zip code.
5. On zoom out, show the appropriate pins per the zoom level
 */

/*! @license
 *  Project: Buttons
 *  Description: Google Map Interface which extends to multi market
 *  Author: Sanyam Agrawal
 *  Date : 26/03/2015 (DD/MM/YYYY)
 *  License: Apache License v2.0
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function(window, document, undefined) {
    var map;

    function initialize() {
        var mapOptions = {
            zoom: 4,
            center: new google.maps.LatLng(20.593684, 78.962880)
        };
        map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);
        initializeMarkers();
    }

    function initializeMarkers() {
        codeAddress("Karnataka");
    }

    function codeAddress(query) {
        var address = query,
            geocoder = new google.maps.Geocoder();

        geocoder.geocode({
            "address": address
        }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                // map.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    }

    function getJSON() {
        var response = [{
            userId: 1,
            locationDetails: {
                state: {
                    value: "Karnataka",
                    longLat: [0.9876, 0.9988]
                },
                city: {
                    value: "Bangalore",
                    longLat: []
                },
                zipCode: {
                    value: 560103,
                    longLat: []
                }
            }

        }, {
            userId: 1,
            locationDetails: {
                state: {
                    value: "Karnataka",
                    longLat: [0.9876, 0.9988]
                },
                city: {
                    value: "Bangalore",
                    longLat: []
                },
                zipCode: {
                    value: 560101,
                    longLat: []
                }
            }

        }, {
            userId: 1,
            locationDetails: {
                state: {
                    value: "Karnataka",
                    longLat: [0.9876, 0.9988]
                },
                city: {
                    value: "Hubli",
                    longLat: []
                },
                zipCode: {
                    value: 560003,
                    longLat: []
                }
            }

        }, {
            userId: 1,
            locationDetails: {
                state: {
                    value: "Delhi",
                    longLat: [0.9876, 0.9988]
                },
                city: {
                    value: "Delhi",
                    longLat: []
                },
                zipCode: {
                    value: 110556,
                    longLat: []
                }
            }

        }];
        return response;
    }

    function processJSON() {
        var data = getJSON(),
            stateInfo = {},
            cityInfo = {},
            zipInfo = {};

        $(data).each(function(index, user) {

            /*jshint unused:true*/

            var locationInfo = user.locationDetails,
                state = locationInfo.state.value,
                city = locationInfo.city.value,
                zip = locationInfo.zipCode.value;

            cityInfo = stateInfo.put(state);
            zipInfo = cityInfo.put(city);
            zipInfo.put(zip);
        });

        return stateInfo;
    }

    google.maps.event.addDomListener(window, "load", initialize);
})(window, document);
