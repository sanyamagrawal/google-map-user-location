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

    var map,

        MapUtil = {
            ZOOM_LEVEL_MAP: {
                "5": "state",
                "6": "city",
                "7": "zip"
            },

            DEFAULT_ZOOM_LEVEL: 5,

            initialize: function() {
                StoreUtil.processJSON();
                var mapOptions = {
                    zoom: this.DEFAULT_ZOOM_LEVEL,
                    center: new google.maps.LatLng(20.593684, 78.962880)
                };
                map = new google.maps.Map(document.getElementById("map-canvas"),
                    mapOptions);

                this.initListerners();
                MarkerUtil.initMarkers(this.ZOOM_LEVEL_MAP[this.DEFAULT_ZOOM_LEVEL], StoreUtil.getObjectBasedOnZoomLevel(this.DEFAULT_ZOOM_LEVEL));
            },

            initListerners: function() {
                google.maps.event.addListener(map, "zoom_changed", this.zoomChangedCallback);
            },

            zoomChangedCallback: function() {
                var zoomLevel = map.getZoom(),
                    typeOfZoom = this.ZOOM_LEVEL_MAP[zoomLevel];

                MarkerUtil.clearMarkers();
                if (!typeOfZoom) {
                    return;
                }

                MarkerUtil.initMarkers(typeOfZoom, StoreUtil.getObjectBasedOnType(typeOfZoom));
            }
        },

        MarkerUtil = {

            markers: [],

            bounds: new google.maps.LatLngBounds(),

            geocoder: new google.maps.Geocoder(),

            infowindow: new google.maps.InfoWindow(),

            initMarkers: function(type, data) {
                this.processMarker(data, type);
            },

            processMarker: function(interator, type) {
                var keys = Object.keys(interator);

                $(keys).each(function(index, key) {
                    /*jshint unused:true*/
                    var LatLng = interator[key].LatLng;

                    if (LatLng) {
                        this.addMarker(type, key, LatLng);
                    } else {
                        this.getLongLatInfo(key, type);
                    }
                }.bind(this));
            },

            getLongLatInfo: function(query, type) {
                var address = query;

                this.geocoder.geocode({
                    "address": address
                }, this.putMarker.bind(this, type, query));
            },

            putMarker: function(type, query, results, status) {

                var position;

                if (status === google.maps.GeocoderStatus.OK) {

                    position = results[0].geometry.location;
                    StoreUtil.saveLongLatInfo(type, query, position);
                    this.addMarker(type, query, position);

                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            },

            addMarker: function(type, query, position) {
                var marker;

                marker = new google.maps.Marker({
                    map: map,
                    position: position
                });

                this.markers.push(marker);
                google.maps.event.addListener(marker, "click", this.markerClickCallback.bind(this, type, query, marker));
                //this.addBounds(marker);
            },

            markerClickCallback: function(type, query, marker) {
                var count = StoreUtil.getObjectBasedOnType(type)[query].count + 1,
                    message = ["<div class='markerInfoBox'>", [count, "Users in this location."].join(" "), "</div>"].join("");

                this.infowindow.setContent(message);
                this.infowindow.open(map, marker);
            },

            // Removes the markers from the map, but keeps them in the array.
            clearMarkers: function() {
                this.setAllMap(null);
                this.markers = [];
            },

            // Sets the map on all markers in the array.
            setAllMap: function(map) {
                var i = 0;
                for (i; i < this.markers.length; i++) {
                    this.markers[i].setMap(map);
                }
            },

            addBounds: function(marker) {
                this.bounds.extend(marker.position);
            },

            fitBound: function() {
                //map.fitBounds(this.bounds);
            }
        },

        StoreUtil = {
            mappedJson: {},

            DELIMITOR: ",",

            getJSON: function() {
                var response = [{
                    userId: 1,
                    locationDetails: {
                        state: {
                            value: "Karnataka"
                        },
                        city: {
                            value: "Bangalore"
                        },
                        zipCode: {
                            value: 560103
                        }
                    }

                }, {
                    userId: 1,
                    locationDetails: {
                        state: {
                            value: "Karnataka"
                        },
                        city: {
                            value: "Bangalore"
                        },
                        zipCode: {
                            value: 560101
                        }
                    }

                }, {
                    userId: 1,
                    locationDetails: {
                        state: {
                            value: "Karnataka"
                        },
                        city: {
                            value: "Hubli"
                        },
                        zipCode: {
                            value: 560003
                        }
                    }

                }, {
                    userId: 1,
                    locationDetails: {
                        state: {
                            value: "Delhi"
                        },
                        city: {
                            value: "Delhi"
                        },
                        zipCode: {
                            value: 110556
                        }
                    }

                }];
                return response;
            },

            processJSON: function() {
                var data = this.getJSON(),
                    stateInfo = {},
                    cityInfo = {},
                    zipInfo = {};

                $(data).each(function(index, user) {

                    /*jshint unused:true*/

                    var locationInfo = user.locationDetails,
                        state = locationInfo.state.value,
                        city = locationInfo.city.value,
                        zip = locationInfo.zipCode.value;

                    this.put(stateInfo, state);
                    this.put(cityInfo, [state, city].join(this.DELIMITOR));
                    this.put(zipInfo, [state, city, zip].join(this.DELIMITOR));
                    // cityInfo = put(stateInfo, state);
                    // zipInfo = put(cityInfo, city);
                    // put(zipInfo, zip);
                }.bind(this));

                this.mappedJson = {
                    state: stateInfo,
                    city: cityInfo,
                    zip: zipInfo
                };
            },

            put: function(array, value) {

                if (!array[value]) {
                    array[value] = {};
                    array[value].count = 0;
                } else {
                    array[value].count = array[value].count + 1;
                }

                return array[value];
            },

            getObjectBasedOnType: function(type) {
                return this.mappedJson[type];
            },

            getObjectBasedOnZoomLevel: function(level) {
                return this.getObjectBasedOnType(MapUtil.ZOOM_LEVEL_MAP[level]);
            },

            saveLongLatInfo: function(type, key, value) {
                var obj = this.getObjectBasedOnType(type);

                obj[key].LatLng = value;
            }
        };

    google.maps.event.addDomListener(window, "load", MapUtil.initialize.bind(MapUtil));

})(jQuery, window, document);
