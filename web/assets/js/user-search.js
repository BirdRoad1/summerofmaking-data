import { API } from "./api.js";

const usersDiv = document.getElementById("users");
const noUsersText = document.getElementById("no-users");
const sortSelect = document.getElementById("users-sort");
const nameInput = document.getElementById("name-input");
const userLimitOption = document.getElementById("users-limit");
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

  const imgUrl = user.avatar;
  if (imgUrl) {
    const proxiedUrl = imgUrl.startsWith("http")
      ? imgUrl
      : "https://summer.hackclub.com" + imgUrl;

    API.proxyMedia(proxiedUrl)
      .then((img) => {
        if (img.type === "image") {
          const imgElem = document.createElement("img");
          imgElem.classList.add("avatar");
          imgElem.src = URL.createObjectURL(img.blob);
          userDiv.prepend(imgElem);
        } else {
          const videoElem = document.createElement("video");
          videoElem.classList.add("avatar");
          videoElem.src = URL.createObjectURL(img.blob);
          videoElem.muted = true;
          videoElem.autoplay = true;
          videoElem.loop = true;
          videoElem.controls = true;
          userDiv.prepend(videoElem);
        }
      })
      .catch((err) => {
        console.log("Image failed to load :/", imgUrl, err);
      });
  }

  const rightElem = document.createElement("div");
  rightElem.classList.add("user-right");
  const nameElem = document.createElement("a");
  nameElem.textContent =
    index + ". " + (user.name ?? "unknown (user to be scraped)");
  nameElem.href = "/?author=" + user.slackId;
  nameElem.classList.add("name");
  rightElem.appendChild(nameElem);

  const subtitleElem = document.createElement("p");
  subtitleElem.textContent = `${Math.floor(user.seconds / 60)} mins • ${
    user.devlogs
  } devlogs`;
  rightElem.appendChild(subtitleElem);

  if (user.bio) {
    const bioElem = document.createElement("p");
    bioElem.textContent = `${user.bio}`;
    rightElem.appendChild(bioElem);
  }

  userDiv.appendChild(rightElem);

  return userDiv;
}

let currentTimeout;
let requestCounter = 0;
async function updateUsers() {
  requestCounter++;
  let counter = requestCounter;
  const sort = sortSelect.value;
  const name = nameInput.value.startsWith("http")
    ? nameInput.value.split("/").pop()
    : nameInput.value;

  const limit = Number.parseInt(userLimitOption.value);

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

  currentTimeout = setTimeout(updateUsers, 200);
}

nameInput.addEventListener("input", onChange);
sortSelect.addEventListener("change", onChange);
userLimitOption.addEventListener("change", onChange);

const query = new URLSearchParams(location.search);
if (query.has("user")) {
  let author = query.get("user");
  nameInput.value = author;
}

updateUsers();
