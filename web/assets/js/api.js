async function getProjects() {
  let res = await fetch("/projects");
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
  const res = await fetch(url);

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
  let res = await fetch("/request_update", {
    method: "POST",
  });

  return res.ok;
}

export const API = {
  getProjects,
  proxyMedia,
  requestUpdate,
};
