import { API } from "./api.js";

const usersDiv = document.getElementById("users");
const noUsersText = document.getElementById("no-users");
const sortSelect = document.getElementById("users-sort");
const nameInput = document.getElementById("name-input");
const projectLimitOption = document.getElementById("users-limit");
const usersCountElem = document.getElementById("users-count");
const projectsCountElem = document.getElementById("projects-count");
const hoursCountElem = document.getElementById("hours-count");

function clearUsers() {
  usersDiv.replaceChildren();
  noUsersText.classList.remove("hidden");
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
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
  authorElem.textContent = `${user.minutesSpent} mins • ${user.devlogsCount} devlogs`;
  rightElem.appendChild(authorElem);

  userDiv.appendChild(rightElem);
  // projectsDiv.appendChild(projectDiv);

  return userDiv;
}

function getStrippedName(name) {
  return name.replace(/[^\dA-Za-z]/g, "");
}

let currentTimeout;
let requestCounter = 0;
async function updateProjects() {
  requestCounter++;
  let counter = requestCounter;
  const sort = sortSelect.value;
  const name = getStrippedName(nameInput.value);
  const limit = Number.parseInt(projectLimitOption.value);

  let users = [];
  let projects;
  try {
    projects = await API.getProjects();
  } catch (err) {
    alert(err.message);
    return;
  }

  for (const project of projects) {
    let user = users.find((u) => u.name === project.author);
    if (user) {
      user.projects.push(project);
      user.minutesSpent += project.minutesSpent;
      user.devlogsCount += project.devlogsCount;
    } else {
      let obj = {
        name: project.author,
        minutesSpent: project.minutesSpent,
        devlogsCount: project.devlogsCount,
        projects: [project],
      };
      users.push(obj);
    }
  }

  usersCountElem.textContent = users.length;
  projectsCountElem.textContent = projects.length;
  hoursCountElem.textContent = Math.floor(projects.reduce((prev, curr) => prev + curr.minutesSpent, 0) / 60 * 100) / 100;

  if (name) {
    users = users.filter((u) =>
      getStrippedName(u.name.toLowerCase()).includes(name.toLowerCase())
    );
  }

  if (sort === "mins") {
    users.sort((a, b) => b.minutesSpent - a.minutesSpent);
  } else if (sort === "devlogs") {
    users.sort((a, b) => b.devlogsCount - a.devlogsCount);
  } else if (sort === "rnd") {
    shuffleArray(users);
  }

  // Prevent old requests from updating content if they finish later
  if (requestCounter !== counter) return;

  clearUsers();
  const portion = users.splice(0, limit);
  for (let i = 0; i < portion.length; i++) {
    const user = portion[i];
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
