import { API } from "./api.js";

const usersDiv = document.getElementById("users");
const noUsersText = document.getElementById("no-users");
const sortSelect = document.getElementById("users-sort");
const nameInput = document.getElementById("name-input");
const projectLimitOption = document.getElementById("users-limit");
const usersCountElem = document.getElementById("users-count");

API.getUserCount().then((json) => {
  usersCountElem.textContent = json.users;
});

function clearUsers() {
  usersDiv.replaceChildren();
  noUsersText.classList.remove("hidden");
}

function createUserElem(user, index) {
  noUsersText.classList.add("hidden");

  const userDiv = document.createElement("div");
  userDiv.classList.add("user");

  const rightElem = document.createElement("div");
  rightElem.classList.add("project-right");

  const nameElem = document.createElement("a");
  nameElem.textContent = index + ") " + user.name;
  nameElem.href = "/?author=" + user.name;
  nameElem.classList.add("name");
  rightElem.appendChild(nameElem);

  const authorElem = document.createElement("p");
  const coins = Math.floor((user.minutes / 60) * 10);
  authorElem.textContent = `${user.minutes} mins • ${
    user.devlogs
  } devlogs • est. ${coins} coins • $${Math.floor(coins * 0.03 * 100) / 100}-$${
    Math.floor(coins * 0.29 * 100) / 100
  }`;
  rightElem.appendChild(authorElem);

  userDiv.appendChild(rightElem);
  // projectsDiv.appendChild(projectDiv);

  return userDiv;
}

let currentTimeout;
let requestCounter = 0;
async function updateProjects() {
  requestCounter++;
  let counter = requestCounter;
  const sort = sortSelect.value;
  const name = nameInput.value.startsWith("http") ? nameInput.value.split("/").pop() : nameInput.value;

  const limit = Number.parseInt(projectLimitOption.value);

  let users;
  try {
    users = await API.getUsers(name, sort, limit);
  } catch (err) {
    alert(err.message);
    return;
  }

  if (requestCounter !== counter) return;

  clearUsers();
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    usersDiv.appendChild(createUserElem(user, i + 1));
  }
}

async function onChange() {
  if (currentTimeout != null) {
    clearTimeout(currentTimeout);
  }

  currentTimeout = setTimeout(updateProjects, 200);
}

nameInput.addEventListener("input", onChange);
sortSelect.addEventListener("change", onChange);
projectLimitOption.addEventListener("change", onChange);

const query = new URLSearchParams(location.search);
if (query.has("user")) {
  let author = query.get("user");
  nameInput.value = author;
}

updateProjects();
