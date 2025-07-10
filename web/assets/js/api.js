async function getProjects(author, name, sort, limit) {
  const params = new URLSearchParams({
    sort,
    limit,
  });

  if (author) {
    params.append("author", author);
  }

  if (name) {
    params.append("name", name);
  }

  let res = await fetch("/api/projects?" + params.toString());
  let text = "";
  let json;
  try {
    text = await res.text();
    json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.error);
    }
  } catch (err) {
    throw new Error("Failed to parse json:" + text);
  }

  return json;
}

async function getUsers(name, sort, limit) {
  const params = new URLSearchParams({
    sort,
    limit,
  });

  if (name) {
    params.append("name", name);
  }

  let res = await fetch("/api/users?" + params.toString());
  let text = "";
  let json;
  try {
    text = await res.text();
    json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.error);
    }
  } catch (err) {
    throw new Error("Failed to parse json:" + text);
  }

  return json;
}

let videoTypes = ["mp4", "mov", "mkv", "webm", "avi", "wmv"];
async function proxyMedia(url) {
  const res = await fetch(`/api/img?url=${url}`);

  let type = res.headers.get("content-type");
  if (videoTypes.some((vid) => type.endsWith("/" + vid))) {
    type = "video";
  } else {
    type = "image";
  }

  return {
    blob: await res.blob(),
    type,
  };
}

async function requestUpdate() {
  let res = await fetch("/api/scraper/request", {
    method: "POST",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? "Unknown error");
  }

  return json.status;
}

/**
 * @param {string | undefined} token
 * @returns
 */
async function requestForceUpdate(token) {
  let res = await fetch("/api/scraper/request-force", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token,
    },
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Unknown error");
  }

  return res.ok;
}

async function getScraperStatus() {
  let res = await fetch("/api/scraper/status");
  let text = "";
  let json;
  try {
    text = await res.text();
    json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.error);
    }
  } catch (err) {
    throw new Error("Failed to parse json:" + text);
  }

  return json.status;
}

async function getUserCount() {
  let res = await fetch("/api/users/count");
  let text = "";
  let json;
  try {
    text = await res.text();
    json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.error);
    }
  } catch (err) {
    throw new Error("Failed to parse json:" + text);
  }

  return json;
}

async function getProjectCount() {
  let res = await fetch("/api/projects/count");
  let text = "";
  let json;
  try {
    text = await res.text();
    json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.error);
    }
  } catch (err) {
    throw new Error("Failed to parse json:" + text);
  }

  return json;
}

export const API = Object.freeze({
  getProjects,
  getUsers,
  proxyMedia,
  requestUpdate,
  requestForceUpdate,
  getScraperStatus,
  getUserCount,
  getProjectCount,
});
