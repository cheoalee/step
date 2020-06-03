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
  * Fetches comments from /data and adds them to the DOM.
  */
function getComments() {
  fetch('/data').then(response => response.json()).then((comments) => {
    console.log("Accessed getComments");
    const commentsContainer = document.getElementById('comments-container');
    commentsContainer.innerHTML = '';
    console.log("Getting comments: " + comments);
    comments.forEach((comment) => {
      console.log("Comment: " + comment);
      commentsContainer.innerHTML += comment;
    });
  });
}

 /**
  * Creates an <li> element containing text.
  * @param {string} text Text to add as a list element.
  * @return {string} Text as a list element.
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
  document.getElementById('message-container').innerText = "Successfully deleted all Datastore comments.";
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

 /**
  * Initialize necessary methods for data.html.
  */
function initialize() {
  fetchBlobstoreUrl();
  getComments();
}
