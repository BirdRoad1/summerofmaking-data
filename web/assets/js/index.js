import { API } from "./api.js";

const projectsDiv = document.getElementById("projects");
const noProjectsText = document.getElementById("no-projects");
const sortSelect = document.getElementById("project-sort");
const authorInput = document.getElementById("author-input");
const nameInput = document.getElementById("name-input");
const projectLimitOption = document.getElementById("project-limit");
const requestUpdateBtn = document.getElementById("request-update-btn");
const forceUpdateBtn = document.getElementById("force-update-btn");
const scraperStateElem = document.getElementById("scraper-state");
const usersCountElem = document.getElementById("users-count");
const projectsCountElem = document.getElementById("projects-count");
const hoursCountElem = document.getElementById("hours-count");
function clearProjects() {
  projectsDiv.replaceChildren();
  noProjectsText.classList.remove("hidden");
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function createProjectElem(project) {
  noProjectsText.classList.add("hidden");

  const projectDiv = document.createElement("div");
  projectDiv.classList.add("project");

  const imgUrl = project.imageUrl;
  const proxiedUrl = imgUrl.startsWith("http")
    ? project.imageUrl
    : "https://summer.hackclub.com" + project.imageUrl;

  API.proxyMedia(proxiedUrl)
    .then((img) => {
      if (img.type === "image") {
        const imgElem = document.createElement("img");
        imgElem.src = URL.createObjectURL(img.blob);
        projectDiv.prepend(imgElem);
      } else {
        const videoElem = document.createElement("video");
        videoElem.src = URL.createObjectURL(img.blob);
        videoElem.muted = true;
        videoElem.autoplay = true;
        videoElem.loop = true;
        videoElem.controls = true;
        projectDiv.prepend(videoElem);
      }
    })
    .catch(() => {
      console.log("Image failed to load :/", project.imageUrl);
    });

  const rightElem = document.createElement("div");
  rightElem.classList.add("project-right");

  const nameElem = document.createElement("a");
  nameElem.textContent = project.name;
  nameElem.href = "https://summer.hackclub.com" + project.url;
  nameElem.target = "_blank";
  nameElem.classList.add("name");
  rightElem.appendChild(nameElem);

  const authorLinkElem = document.createElement("a");
  authorLinkElem.href = "/user-search?user=" + project.author;
  authorLinkElem.textContent = project.author;

  const authorElem = document.createElement("p");
  const coins = Math.floor((project.minutesSpent / 60) * 10);

  authorElem.append(
    "by ",
    authorLinkElem,
    ` • ${project.minutesSpent} mins • ${
      project.devlogsCount
    } devlogs • est. ${coins} coins • $${
      Math.floor(coins * 0.03 * 100) / 100
    }-$${Math.floor(coins * 0.29 * 100) / 100}`
  );
  rightElem.appendChild(authorElem);

  const descElem = document.createElement("p");
  descElem.textContent = project.description;
  rightElem.appendChild(descElem);

  projectDiv.appendChild(rightElem);

  return projectDiv;
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
  let isSlack = authorInput.value.startsWith("http");
  const author = authorInput.value.startsWith("http")
    ? authorInput.value.split("/").pop()
    : getStrippedName(authorInput.value);

  const name = getStrippedName(nameInput.value);
  const limit =
    projectLimitOption.value === "all"
      ? Number.POSITIVE_INFINITY
      : Number.parseInt(projectLimitOption.value);

  let projects;
  try {
    projects = await API.getProjects();
  } catch (err) {
    alert(err.message);
    return;
  }

  projectsCountElem.textContent = projects.length;
  let usersCount = 0;
  let users = [];
  for (const project of projects) {
    if (!users.includes(project.author)) {
      ++usersCount;
      users.push(project.author);
    }
  }
  usersCountElem.textContent = usersCount;
  hoursCountElem.textContent =
    Math.floor(
      (projects.reduce((prev, curr) => prev + curr.minutesSpent, 0) / 60) * 100
    ) / 100;

  if (author) {
    if (isSlack) {
      projects = projects.filter(
        (p) => p.slackId.toLowerCase() === author.toLowerCase()
      );
    } else {
      projects = projects.filter((p) =>
        getStrippedName(p.author.toLowerCase()).includes(author.toLowerCase())
      );
    }
  }

  if (name) {
    projects = projects.filter((p) =>
      getStrippedName(p.name.toLowerCase()).includes(name.toLowerCase())
    );
  }

  if (sort === "mins") {
    projects.sort((a, b) => b.minutesSpent - a.minutesSpent);
  } else if (sort === "devlogs") {
    projects.sort((a, b) => b.devlogsCount - a.devlogsCount);
  } else if (sort === "rnd") {
    shuffleArray(projects);
  } else if (sort === "url") {
    projects.sort(
      (a, b) => Number(b.url.split("/")[2]) - Number(a.url.split("/")[2])
    );
  }

  // Prevent old requests from updating content if they finish later
  if (requestCounter !== counter) return;

  clearProjects();
  for (const project of projects.splice(0, limit)) {
    projectsDiv.appendChild(createProjectElem(project));
  }
}

async function onChange() {
  if (currentTimeout != null) {
    clearTimeout(currentTimeout);
  }

  currentTimeout = setTimeout(updateProjects, 200);
}

authorInput.addEventListener("input", onChange);
nameInput.addEventListener("input", onChange);
sortSelect.addEventListener("change", onChange);
projectLimitOption.addEventListener("change", onChange);

requestUpdateBtn.addEventListener("click", () => {
  API.requestUpdate()
    .then((success) => {
      alert(success ? "Update requested" : "The scraper is busy");
    })
    .catch((err) => {
      alert(err.message);
    });
});

forceUpdateBtn.addEventListener("click", () => {
  const token = prompt("Enter the secret token:");
  if (!token) {
    return;
  }

  API.requestForceUpdate(token)
    .then((success) => {
      alert(success ? "Force update requested" : "The scraper is busy");
    })
    .catch((err) => {
      alert(err.message);
    });
});

setInterval(
  (function checkState() {
    API.getScraperStatus()
      .then((state) => {
        scraperStateElem.textContent = state;
      })
      .catch((err) => {
        scraperStateElem.textContent = "unknown";
      });

    return checkState;
  })(),
  1000
);

const query = new URLSearchParams(location.search);
if (query.has("author")) {
  let author = query.get("author");
  authorInput.value = author;
}

updateProjects();
