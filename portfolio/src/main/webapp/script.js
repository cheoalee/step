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

/**
 * Adds a random greeting to the page.
 */
function addRandomGreeting() {
  const greetings =
      ['Hello world!', '¡Hola Mundo!', '你好，世界！', 'Bonjour le monde!'];

  // Pick a random greeting.
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Add it to the page.
  const greetingContainer = document.getElementById('greeting-container');
  greetingContainer.innerText = greeting;
}

function openNav() {
    document.getElementById("sideNavigation").style.width = "20%";
    document.getElementById("navicon").style.height = "0%";
}

function closeNav() {
    document.getElementById("sideNavigation").style.width = "0";
    document.getElementById("navicon").style.height = "12%";
}

function randomWant() {
  const wants =
      ['Fido is hungry.', 'Fido is thirsty.', 'Fido wants to go outside.', 'Fido is tired.', 'Fido wants to be pet.', 'Fido wants to play.'];

  // Pick a random greeting.
  const want = wants[Math.floor(Math.random() * wants.length)];

  // Add it to the page.
  const wantsContainer = document.getElementById('want-container');
  wantsContainer.innerText = want;
}

function openEye() {
    document.getElementById("eye").style.height = "10px";
}

function noHeldObject() {
    const objContainer = document.getElementById('fido-object-container');
    objContainer.innerText = "";
}

function petAnimation() {
    openEye();
    document.getElementById("dog-graphic").classList.add("wiggleJump");
}

function sleepingDog() {
    noHeldObject();
    hideSky();
    document.getElementById("eye").style.height = "3px";
}

function spawnBall() {
  // Add it to the page.
  openEye();
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "⚽";
}

function spawnDrink() {
  // Add it to the page.
  openEye();
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "🧊";
}

function spawnFood() {
  // Add it to the page.
  openEye();
  hideSky();
  const objContainer = document.getElementById('fido-object-container');
  objContainer.innerText = "🍏";
}

function showSky() {
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