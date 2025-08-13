import { API } from "./api.js";

const projectsDiv = document.getElementById("projects");
const noProjectsText = document.getElementById("no-projects");
const sortSelect = document.getElementById("project-sort");
const authorInput = document.getElementById("author-input");
const nameOrDescInput = document.getElementById("name-input");
const projectLimitOption = document.getElementById("project-limit");
const requestUpdateBtn = document.getElementById("request-update-btn");
const forceUpdateBtn = document.getElementById("force-update-btn");
const scraperStateElem = document.getElementById("scraper-state");
const devlogsElem = document.getElementById("devlogs-count");
const projectsCountElem = document.getElementById("projects-count");
const hoursCountElem = document.getElementById("hours-count");

function clearProjects() {
  projectsDiv.replaceChildren();
  noProjectsText.classList.remove("hidden");
}

function createProjectElem(project) {
  noProjectsText.classList.add("hidden");

  const projectDiv = document.createElement("div");
  projectDiv.classList.add("project");

  const imgUrl = project.imageUrl;
  if (imgUrl) {
    const proxiedUrl = imgUrl.startsWith("http")
      ? imgUrl
      : "https://summer.hackclub.com" + imgUrl;

    API.proxyMedia(proxiedUrl)
      .then((img) => {
        if (img.type === "image") {
          const imgElem = document.createElement("img");
          imgElem.classList.add('cover')
          imgElem.src = URL.createObjectURL(img.blob);
          projectDiv.prepend(imgElem);
        } else {
          const videoElem = document.createElement("video");
          imgElem.classList.add('cover')
          videoElem.src = URL.createObjectURL(img.blob);
          videoElem.muted = true;
          videoElem.autoplay = true;
          videoElem.loop = true;
          videoElem.controls = true;
          projectDiv.prepend(videoElem);
        }
      })
      .catch(() => {
        console.log("Image failed to load :/", imgUrl);
      });
  }

  const rightElem = document.createElement("div");
  rightElem.classList.add("project-right");

  const nameElem = document.createElement("a");
  nameElem.textContent = project.name;
  nameElem.href = "https://summer.hackclub.com/projects/" + project.projectId;
  nameElem.target = "_blank";
  nameElem.classList.add("name");
  rightElem.appendChild(nameElem);

  const authorLinkElem = document.createElement("a");
  if (project.authorName) {
    authorLinkElem.href = "/user-search?user=" + project.authorSlackId;
  }
  authorLinkElem.textContent = project.authorName ?? "Unknown";

  const authorElem = document.createElement("p");
  authorElem.classList.add("author");

  authorElem.append(
    "by ",
    authorLinkElem,
    ` • ${Math.floor(project.secondsSpent / 60)} mins • ${
      project.devlogsCount
    } devlogs`
  );
  rightElem.appendChild(authorElem);

  let datesArray = [];

  if (project.projectCreatedAt) {
    const createdTxt = document.createElement("span");
    const date = new Date(project.projectCreatedAt);
    const dateTime = `${date.toLocaleDateString()}`;
    createdTxt.textContent = `Created: ${dateTime}`;
    datesArray.push(createdTxt);
  }

  if (project.projectUpdatedAt) {
    const updateTxt = document.createElement("span");
    const date = new Date(project.projectUpdatedAt);
    const dateTime = `${date.toLocaleDateString()}`;
    updateTxt.textContent = `Updated: ${dateTime}`;
    datesArray.push(updateTxt);
  }

  if (datesArray.length > 0) {
    const datesP = document.createElement("p");
    datesP.classList.add("dates");
    for (let i = 0; i < datesArray.length; i++) {
      datesP.append(datesArray[i]);
      if (i < datesArray.length - 1) {
        datesP.append(" - ");
      }
    }

    rightElem.appendChild(datesP);
  }

  let linksArray = [];

  if (project.repoLink) {
    const repoLink = document.createElement("a");
    repoLink.textContent = "Repo";
    repoLink.target = "_blank";
    repoLink.href = project.repoLink;
    linksArray.push(repoLink);
  }

  if (project.demoLink) {
    const demoLink = document.createElement("a");
    demoLink.textContent = "Demo";
    demoLink.target = "_blank";
    demoLink.href = project.demoLink;
    linksArray.push(demoLink);
  }

  if (project.readmeLink) {
    const readmeLink = document.createElement("a");
    readmeLink.textContent = "Readme";
    readmeLink.target = "_blank";
    readmeLink.href = project.readmeLink;
    linksArray.push(readmeLink);
  }

  const linksP = document.createElement("p");
  linksP.classList.add("project-links");
  if (linksArray.length > 0) {
    for (let i = 0; i < linksArray.length; i++) {
      linksP.append(linksArray[i]);
      if (i < linksArray.length - 1) {
        // linksP.append(" • ");
      }
    }

    rightElem.appendChild(linksP);
  }

  const descElem = document.createElement("p");
  descElem.textContent = project.description;
  rightElem.appendChild(descElem);

  projectDiv.appendChild(rightElem);

  return projectDiv;
}

API.getProjectCount().then((json) => {
  projectsCountElem.textContent = json.projects;
  devlogsElem.textContent = json.devlogs;
  hoursCountElem.textContent = Math.floor((json.seconds / 60 / 60) * 100) / 100;
});

let currentTimeout;
let requestCounter = 0;
async function updateProjects() {
  requestCounter++;
  let counter = requestCounter;
  const sort = sortSelect.value;
  const author = authorInput.value.startsWith("http")
    ? authorInput.value.split("/").pop()
    : authorInput.value;

  const nameOrDesc = nameOrDescInput.value;
  const limit = Number.parseInt(projectLimitOption.value);

  let projects;
  try {
    projects = await API.getProjects(author, nameOrDesc, sort, limit);
  } catch (err) {
    alert(err.message);
    return;
  }

  let usersCount = 0;
  let users = [];
  for (const project of projects) {
    if (!users.includes(project.author)) {
      ++usersCount;
      users.push(project.author);
    }
  }

  // Prevent old requests from updating content if they finish later
  if (requestCounter !== counter) return;

  clearProjects();
  for (const project of projects.splice(0, limit)) {
    projectsDiv.appendChild(createProjectElem(project));
  }
}

async function onChange() {
  updateURLParams();
  if (currentTimeout != null) {
    clearTimeout(currentTimeout);
  }

  currentTimeout = setTimeout(updateProjects, 200);
}

const query = new URLSearchParams(location.search);
if (query.has("author")) {
  let author = query.get("author");
  authorInput.value = author;
}

if (query.has("nameOrDesc")) {
  let nameOrDesc = query.get("nameOrDesc");
  nameOrDescInput.value = nameOrDesc;
}

async function updateURLParams() {
  if (authorInput.value) {
    query.set("author", authorInput.value);
  } else {
    query.delete("author");
  }

  if (nameOrDescInput.value) {
    query.set("nameOrDesc", nameOrDescInput.value);
  } else {
    query.delete("nameOrDesc");
  }

  const url = location.href;
  const parsed = URL.parse(url);
  parsed.search = query.toString();

  window.history.replaceState({}, document.title, parsed.href);
}

authorInput.addEventListener("input", onChange);
nameOrDescInput.addEventListener("input", onChange);
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

updateProjects();
