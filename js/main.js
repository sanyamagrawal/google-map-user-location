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
(function($, window, document, undefined) {

    var MarkerUtil = {

            markers: [],

            initMarkers: function(type) {
                this.processMarker(mappedJson[type]);
            },

            processMarker: function(interator) {
                var keys = Object.keys(interator);
                $(keys).each(function(index, key) {
                    /*jshint unused:true*/
                    this.putMarker(key);
                });
            },

            putMarker: function(query) {
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
                        markers.push(marker);
                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });
            },

            // Removes the markers from the map, but keeps them in the array.
            clearMarkers: function() {
                this.setAllMap(null);
                this.markers = [];
            },

            // Sets the map on all markers in the array.
            setAllMap: function(map) {
                for (var i = 0; i < markers.length; i++) {
                    markers[i].setMap(map);
                }
            }
        },

        map,
        mappedJson = {},
        DELIMITOR = ",",
        ZOOM_LEVEL_MAP = {
            "4": "state",
            "5": "city",
            "6": "zip"
        },
        ZOOM_LEVEL = 4;

    function initialize() {
        processJSON();
        var mapOptions = {
            zoom: ZOOM_LEVEL,
            center: new google.maps.LatLng(20.593684, 78.962880)
        };
        map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);

        initListerners();
        MarkerUtil.initMarkers(ZOOM_LEVEL_MAP[ZOOM_LEVEL]);
    }

    function initListerners() {
        google.maps.event.addListener(map, "zoom_changed", zoomChangedcallBack);
    }

    function zoomChangedcallBack() {
        var zoomLevel = map.getZoom(),
            typeOfZoom = ZOOM_LEVEL_MAP[zoomLevel];

        if (!typeOfZoom) {
            return;
        }

        MarkerUtil.clearMarkers();
        MarkerUtil.initMarkers(typeOfZoom);
        //map.setCenter(myLatLng);
        //infowindow.setContent('Zoom: ' + zoomLevel);
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

            put(stateInfo, state);
            put(cityInfo, [state, city].join(DELIMITOR));
            put(zipInfo, [state, city, zip].join(DELIMITOR));
            // cityInfo = put(stateInfo, state);
            // zipInfo = put(cityInfo, city);
            // put(zipInfo, zip);
        });

        mappedJson = {
            state: stateInfo,
            city: cityInfo,
            zip: zipInfo
        };
    }

    function put(array, value) {
        if (!array[value]) {
            array[value] = {};
            array[value].count = 0;
        } else {
            array[value].count = array[value].count + 1;
        }
        return array[value];
    }

    google.maps.event.addDomListener(window, "load", initialize);

})(jQuery, window, document);
