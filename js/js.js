/* PROBLEM STATEMENT
1. Assume a sample large (50K items) JSON data set (e.g USA users for a site with location information)
2. Render a Google map, with pins shown for each state (e.g X users from California)
3. On zoom in, show the pins for each city (e.g X users from Palo Alto)
4. On zoom in further, show the pins for each zip code.
5. On zoom out, show the appropriate pins per the zoom level
 */

/*! @license
    Project: Google Map
    Description: Google Map Interface which extends to multi market
    Author: Sanyam Agrawal
    Date : 29/03/2015 (DD/MM/YYYY)
 */

/*
    ASSUMPTIONS:
    1. StoreUtil.getJSON() will give us all the data of a user.
    2. The Map displays only those information available in the user data set.
    3. The user data set will not contain long/lat information initially and this will be needed to be fetched.
    4. One User can have only one Address (State, City, Zip Code) ie. One user cannot belong to more then one address.
 */
(function(window, document, undefined) {

    /**
     * Global Javascript Object which contains "Google Map Object" being shown in the UI.
     */
    var map,

        /**
         * [MapUtil] Contains initialization method for map and event listeners for map object.
         *
         * @type {Object}
         */

        MapUtil,

        /**
         * Marker Util defines all the functionality involved with showing a Marker on the screen,
         * hiding the marker, removing the marker etc
         *
         * @type {Object}
         */
        MarkerUtil,

        /**
         * Store Util Contains Methods and API's to get the Users Details, Process the User's details based
         * Google map and some Utility Function.
         *
         * @type {Object}
         */
        StoreUtil;

    MapUtil = {

        /**
         * A hash map of the Zoom Level and the Information which needs to be rendered. i.e
         * if Zoom Level is 5 then we need to render the Users States Information onto the Map.
         *
         * @type {Object}
         */
        ZOOM_LEVEL_MAP: {
            "5": "state",
            "6": "city",
            "7": "zip"
        },

        /**
         * The default zoom at which Google Map will be rendered.
         * This should be available in the above ZOOM_LEVEL_MAP
         *
         * @type {Number}
         */
        DEFAULT_ZOOM_LEVEL: 5,

        /**
         * Renders the Google Map on to the element
         */
        initialize: function initialize() {
            var mapOptions = {
                zoom: this.DEFAULT_ZOOM_LEVEL,
                center: new google.maps.LatLng(20.593684, 78.962880)
            };

            map = new google.maps.Map(document.getElementById("map-container"), mapOptions);

            //Add listners and callback on google map
            this.initListerners();

            StoreUtil.processJSON();
            MarkerUtil.initMarkers(this.ZOOM_LEVEL_MAP[this.DEFAULT_ZOOM_LEVEL], StoreUtil.getObjectBasedOnZoomLevel(this.DEFAULT_ZOOM_LEVEL));
        },

        /**
         * Initializes all Map Related events here along with their call back function
         */
        initListerners: function initListerners() {
            google.maps.event.addListener(map, "zoom_changed", this.zoomChangedCallback.bind(this));
        },

        /**
         * Callback for Zoom Event. It takes the type of zoom, int number and gets the type from ZOOM_LEVEL_MAP.
         * See ZOOM_LEVEL_MAP for possible zoom events.
         *
         */
        zoomChangedCallback: function zoomChangedCallback() {
            var zoomLevel = map.getZoom(),
                typeOfZoom = this.ZOOM_LEVEL_MAP[zoomLevel];

            //Clear all Markers rendered on the map
            MarkerUtil.clearMarkers();

            //If zoom level is not within the range we want to show (ZOOM_LEVEL_MAP) return from the function
            if (!typeOfZoom) {
                return;
            }

            //Start rendering the markers based on the zoom level.
            MarkerUtil.initMarkers(typeOfZoom, StoreUtil.getObjectBasedOnType(typeOfZoom));
        }
    };

    MarkerUtil = {

        /**
         * All markers during a particular zoom level are stored in this array.
         *
         * @type {Array}
         */
        markers: [],

        /**
         * Bounds Google Map function reference
         *
         * @type {google}
         */
        bounds: new google.maps.LatLngBounds(),

        /**
         * To get the Long/Lat of an address from Google API
         *
         * @type {google}
         */
        geocoder: new google.maps.Geocoder(),

        /**
         * To show the content as a modal over a marker in our rendered map
         *
         * @type {google}
         */
        infowindow: new google.maps.InfoWindow(),

        /**
         * Initializes the data for the required by Google Map to place Marker(s) on to the Map
         *
         * @param  {string} type The type of marker to be placed. ("State","City" or "Zip Code")
         * @param  {object} data The object which contains the data required to place the marker onto the MAP.
         */
        initMarkers: function initMarkers(type, data) {
            this.processMarker(data, type);
        },

        /**
         * This function is responsible for iterating over the data and finding out if we have Longitude and
         * Latitude information of a particular address .
         * If Present it will call the render function which will place the marker on the map.
         * If not present will call the Google Map geoCoder API to get Long/Lat Information
         *
         * @param  {object} Iterator The object which contains the data required to place the marker onto the MAP.
         * @param  {string} type The type of marker to be placed. ("State","City" or "Zip Code")
         */
        processMarker: function processMarker(interator, type) {
            var keys = Object.keys(interator);

            keys.forEach(function(key) {

                var LatLng = interator[key].LatLng;

                //If long/lat information is present then add the marker.
                if (LatLng) {
                    this.addMarker(type, key, LatLng);
                } else {
                    // Call geoLocator API to get long/lat information.
                    this.getLongLatInfo(key, type);
                }
            }.bind(this));
        },

        /**
         * Get Log Lat Information based on address
         *
         * @param  {String} query   The address whose Co-ordinates needs to be found. (Karnataka Or Karnataka,Bangalore or Karnataka,Bangalore,560103)
         * @param  {string} type    The type of marker to be placed. ("State","City" or "Zip Code")
         */
        getLongLatInfo: function getLongLatInfo(query, type) {
            var address = query;

            this.geocoder.geocode({
                "address": address
            }, this.putMarker.bind(this, type, query));
        },

        /**
         * Function Caches the result from geocoder.geocode and calls the method to add the marker to map
         *
         * @param  {string} type    The type of marker to be placed. ("State","City" or "Zip Code")
         * @param  {String} query   The address whose Co-ordinates needs to be found.
         * (Karnataka Or Karnataka,Bangalore or Karnataka,Bangalore,560103)
         * @param  {object} results google Location object. Result of geocoder.geocode
         * @param  {String} status  google.maps.Geocoder Status ENUM status
         * @return {[type]}         NA
         */
        putMarker: function putMarker(type, query, results, status) {

            var position;

            if (status === google.maps.GeocoderStatus.OK) {

                position = results[0].geometry.location;
                StoreUtil.saveLongLatInfo(type, query, position);
                this.addMarker(type, query, position);

            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        },

        /**
         * Place Marker on Google Map based on the result from GetLongLatInfo Function
         *
         * @param  {string} type        The type of marker to be placed. ("State","City" or "Zip Code")
         * @param  {String} query       The address whose Co-ordinates needs to be found. (Karnataka Or Karnataka,Bangalore or Karnataka,Bangalore,560103)
         * @param  {Object} position    Object that contains the co-ordinates of the query string
         */
        addMarker: function addMarker(type, query, position) {
            var marker;

            marker = new google.maps.Marker({
                map: map,
                position: position
            });

            this.markers.push(marker);

            //Event Listeners to show Info tooltip when a marker is clicked.
            google.maps.event.addListener(marker, "click", this.markerClickCallback.bind(this, type, query, marker));
            //this.addBounds(marker);
        },

        /**
         * Shows a tooltip with Information above a marker in a map
         *
         * @param  {string} type    The type of marker to be placed. ("State","City" or "Zip Code")
         * @param  {String} query   The address whose Co-oridnates needs to be found. (Karnataka Or Karnataka,Bangalore or Karnataka,Bangalore,560103)
         * @param  {Object} marker  Google Marker Object which contains details of a address.
         */
        markerClickCallback: function markerClickCallback(type, query, marker) {
            var count = StoreUtil.getObjectBasedOnType(type)[query].count + 1,
                message = ["<div class='markerInfoBox'>", [count, "Users in", query].join(" "), "</div>"].join("");

            this.infowindow.setContent(message);
            this.infowindow.open(map, marker);
        },

        /**
         * Removes the markers from the map, but keeps them in the array.
         */
        clearMarkers: function clearMarkers() {
            this.setAllMap(null);
            this.markers = [];
        },

        /**
         * Sets the map on all markers in the array.
         *
         * @param {Object} map The map to be set
         */
        setAllMap: function setAllMap(map) {
            var i = 0;
            for (i; i < this.markers.length; i++) {
                this.markers[i].setMap(map);
            }
        },

        addBounds: function addBounds(marker) {
            this.bounds.extend(marker.position);
        },

        fitBound: function fitBound() {
            //map.fitBounds(this.bounds);
        }
    };

    StoreUtil = {
        /**
         * JSON Format required to render the Data on Google Maps.
         *
         * @type {Object}
         */
        mappedJson: {},

        /**
         * Special character used to separate different values for the address which needs to be parsed by
         * Google Map.
         *
         * @type {String}
         */
        DELIMITOR: ",",

        /**
         * function returns a json of Users data.
         *
         * @return {Object} JSON Object.
         */
        getJSON: function getJSON() {
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
                        value: 560005
                    }
                }

            }, {
                userId: 2,
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
                userId: 3,
                locationDetails: {
                    state: {
                        value: "Karnataka"
                    },
                    city: {
                        value: "Hubli"
                    },
                    zipCode: {
                        value: 560067
                    }
                }

            }, {
                userId: 4,
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

            }, {
                userId: 5,
                locationDetails: {
                    state: {
                        value: "Maharashtra"
                    },
                    city: {
                        value: "Mumbai"
                    },
                    zipCode: {
                        value: 400003
                    }
                }
            }, {
                userId: 6,
                locationDetails: {
                    state: {
                        value: "Maharashtra"
                    },
                    city: {
                        value: "Mumbai"
                    },
                    zipCode: {
                        value: 400098
                    }
                }
            }, {
                userId: 7,
                locationDetails: {
                    state: {
                        value: "MADHYA PRADESH"
                    },
                    city: {
                        value: "Indore"
                    },
                    zipCode: {
                        value: 452007
                    }
                }
            }, {
                userId: 8,
                locationDetails: {
                    state: {
                        value: "Delhi"
                    },
                    city: {
                        value: "Karnal Haryana"
                    },
                    zipCode: {
                        value: 132001
                    }
                }
            }, {
                userId: 9,
                locationDetails: {
                    state: {
                        value: "Rajasthan"
                    },
                    city: {
                        value: "Jaipur"
                    },
                    zipCode: {
                        value: 302021
                    }
                }
            }, {
                userId: 10,
                locationDetails: {
                    state: {
                        value: "Uttaranchal"
                    },
                    city: {
                        value: "Dehradun"
                    },
                    zipCode: {
                        value: 248001
                    }
                }
            }];
            return response;
        },

        /**
         * Iterates over the Json and converts it to an object that is easier to render on Google Maps.
         */
        processJSON: function processJSON() {
            var data = this.getJSON(),
                stateInfo = {},
                cityInfo = {},
                zipInfo = {};

            data.forEach(function(user) {

                var locationInfo = user.locationDetails,
                    state = locationInfo.state.value,
                    city = locationInfo.city.value,
                    zip = locationInfo.zipCode.value;

                //Place State information here.
                this.put(stateInfo, state);

                //Places State,City Information in cityInfo.
                this.put(cityInfo, [state, city].join(this.DELIMITOR));

                //Places State,City,ZipCode Information Here
                this.put(zipInfo, [state, city, zip].join(this.DELIMITOR));

            }.bind(this));

            //Finally add all the information to a single JSON as ECMA5 doesnt support sending multiple response.
            this.mappedJson = {
                state: stateInfo,
                city: cityInfo,
                zip: zipInfo
            };
        },

        /**
         * A Utility Function which is useful to add information to a Object.
         * I tried adding it to Object.prototype.put but this somehow seems to break google API.
         * Still have to figure out why this is happening.
         *
         * @param  {Object} obj     Object in which the value needs to be placed
         * @param  {[type]} value   The value which needs to be added to count key
         * @return {Object}         A new Object which might or might not have count as a property.
         */
        put: function put(obj, value) {

            if (!obj[value]) {
                obj[value] = {};
                obj[value].count = 0;
            } else {
                obj[value].count = obj[value].count + 1;
            }

            return obj[value];
        },

        /**
         * Get City, State or Zip Code object to be processed based on the type.
         *
         * @param  {string} type    The type of marker to be placed. ("State","City" or "Zip Code")
         * @return {object}         The type of marker to be placed
         */
        getObjectBasedOnType: function getObjectBasedOnType(type) {
            return this.mappedJson[type];
        },

        /**
         * Get City, State or Zip Code Object to be processed based on the Zoom Level.
         *
         * @param  {string} level    The type of marker to be placed. ("State","City" or "Zip Code")
         * @return {object}         The type of marker to be placed
         */
        getObjectBasedOnZoomLevel: function getObjectBasedOnZoomLevel(level) {
            return this.getObjectBasedOnType(MapUtil.ZOOM_LEVEL_MAP[level]);
        },

        /**
         * Utility Function to Cache the Longitude/Latitude information of a specific address,
         * avaliable in the Object
         *
         * @param  {string} type    The type of marker to be placed. ("State","City" or "Zip Code")
         * @param  {String} key     The address whose co-ordinates needs to be found.
         * (Karnataka Or Karnataka, Bangalore or Karnataka, Bangalore,560103)
         * @param  {[type]} value   The value which needs to be put in LatLng value.
         */
        saveLongLatInfo: function saveLongLatInfo(type, key, value) {
            var obj = this.getObjectBasedOnType(type);

            obj[key].LatLng = value;
        }
    };

    // Once The DOM Objet is available start rendering our MAP.
    google.maps.event.addDomListener(window, "load", function() {
        MapUtil.initialize();
    });

})(window, document);
