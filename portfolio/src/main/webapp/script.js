// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function openNav() {
  document.getElementById("sideNavigation").style.width = "20%";
  document.getElementById("navicon").style.height = "0%";
}

function closeNav() {
  document.getElementById("sideNavigation").style.width = "0";
  document.getElementById("navicon").style.height = "12%";
}

/**
 * Adds a random want to the page.
 */
function randomWant() {
  const wants =
      ['Fido is hungry.', 'Fido is thirsty.', 'Fido wants to go outside.',
      'Fido is tired.', 'Fido wants to be pet.', 'Fido wants to play.'];

  // Pick a random want.
  const want = wants[Math.floor(Math.random() * wants.length)];

  // Add it to the page.
  const wantsContainer = document.getElementById('want-container');
  wantsContainer.innerText = want;
}

/**
 * Sets dog animation's eye to be open.
 */
function openEye() {
  document.getElementById("eye").style.height = "10px";
}

/**
 * Removes objects from dog animation's "mouth".
 */
function noHeldObject() {
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "";
}

/**
 * Activate wiggle jump animation in response to "pet" option click.
 */
function petAnimation() {
  openEye();
  document.getElementById("dog-graphic").classList.add("wiggleJump");
}

/**
 * Sets dog animation's eye to be closed.
 */
function sleepingDog() {
  noHeldObject();
  hideSky();
  document.getElementById("eye").style.height = "3px";
}

function spawnBall() {
  openEye();
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "⚽";
}

function spawnDrink() {
  openEye();
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "🧊";
}

function spawnFood() {
  openEye();
  hideSky();
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "🍏";
}

function showSky() {
  openEye();
  document.getElementById('sky').style.height = "350px";
}

function hideSky() {
  document.getElementById('sky').style.height = "0px";
}

function tailReaction() {
openEye();
  const wantsContainer = document.getElementById('want-container');
  wantsContainer.innerText = "Fido does not like it when you grab Fido's tail 😔";
}

function noseReaction() {
  openEye();
  noHeldObject();
  const wantsContainer = document.getElementById('want-container');
  wantsContainer.innerText = "Fido sneezed.";
}

function tongueReaction() {
  openEye();
  noHeldObject();
  const wantsContainer = document.getElementById('want-container');
  wantsContainer.innerText = "Fido licked your hand.";
}

 /**
  * Fetches messages from /data and adds them to the DOM.
  */
function getMessagesAsJSON() {
 fetch('/data').then(response => response.json()).then((messages) => {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(
        createListElement('First message: ' + messages[0]));
    messagesContainer.appendChild(
        createListElement('Second message: ' + messages[1]));
    messagesContainer.appendChild(
        createListElement('Third message: ' + messages[2]));
  });
}

/**
  * Creates an <li> element containing text.
  * @param text Text to add as a list element.
  * @return Text as a list element.
  */
function createListElement(text) {
  const liElement = document.createElement('li');
  liElement.innerText = text;
  return liElement;
}

 /**
  * Fetch comments from Datastore after clearing Datastore;
  * essentially, clear the Datastore.
  */
async function clearCommentsUsingAsyncAwait() {
  const response = await fetch('/delete-data', {method: 'POST'});
  document.getElementById('messages-container').innerText = "Successfully deleted all Datastore comments.";
}

 /**
  * Fetch image from Blobstore (Week 4 API).
  */
function fetchBlobstoreUrl() {
  fetch('/blobstore-upload-url')
      .then((response) => {
        return response.text();
      })
      .then((imageUploadUrl) => {
        const messageForm = document.getElementById('my-form');
        // Directs visitor to /my-form-handler, where the text and image
        // submitted will be shown.
        messageForm.action = imageUploadUrl;
      });
}

/* USER INTERACTION WITH MAP */

let map;

/* Editable marker that displays when a user clicks in the map. */
let editMarker;

/** Creates a map that allows users to add markers. */
function createMap() {
  map = new google.maps.Map(
      document.getElementById('map'),
      {center: {lat: 38.5949, lng: -94.8923}, zoom: 4});

  // When the user clicks in the map, show a marker with a text box the user can
  // edit.
  map.addListener('click', (event) => {
    createMarkerForEdit(event.latLng.lat(), event.latLng.lng());
  });

  fetchMarkers();
}

/** Fetches markers from the backend and adds them to the map. */
function fetchMarkers() {
  fetch('/markers').then(response => response.json()).then((markers) => {
    markers.forEach(
        (marker) => {
            createMarkerForDisplay(marker.lat, marker.lng, marker.content)});
  });
}

/** Creates a marker that shows a read-only info window when clicked. */
function createMarkerForDisplay(lat, lng, content) {
  const marker =
      new google.maps.Marker({position: {lat: lat, lng: lng}, map: map});

  const infoWindow = new google.maps.InfoWindow({content: content});
  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}

/** Sends a marker to the backend for saving. */
function postMarker(lat, lng, content) {
  const params = new URLSearchParams();
  params.append('lat', lat);
  params.append('lng', lng);
  params.append('content', content);

  fetch('/markers', {method: 'POST', body: params});
}

/** Creates a marker that shows a textbox the user can edit. */
function createMarkerForEdit(lat, lng) {
  // If we're already showing an editable marker, then remove it.
  if (editMarker) {
    editMarker.setMap(null);
  }

  editMarker =
      new google.maps.Marker({position: {lat: lat, lng: lng}, map: map});

  const infoWindow =
      new google.maps.InfoWindow({content: buildInfoWindowInput(lat, lng)});

  // When the user closes the editable info window, remove the marker.
  google.maps.event.addListener(infoWindow, 'closeclick', () => {
    editMarker.setMap(null);
  });

  infoWindow.open(map, editMarker);
}

/**
 * Builds and returns HTML elements that show an editable textbox and a submit
 * button.
 */
function buildInfoWindowInput(lat, lng) {
  const textBox = document.createElement('textarea');
  const button = document.createElement('button');
  button.appendChild(document.createTextNode('Submit'));

  button.onclick = () => {
    postMarker(lat, lng, textBox.value);
    createMarkerForDisplay(lat, lng, textBox.value);
    editMarker.setMap(null);
  };

  const containerDiv = document.createElement('div');
  containerDiv.appendChild(textBox);
  containerDiv.appendChild(document.createElement('br'));
  containerDiv.appendChild(button);

  return containerDiv;
}
