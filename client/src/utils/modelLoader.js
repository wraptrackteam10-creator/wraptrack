import * as mobilenet from "@tensorflow-models/mobilenet";

let cachedModel = null;

export async function loadModel() {
  if (!cachedModel) {
    console.log("🧠 Loading MobileNet model...");
    cachedModel = await mobilenet.load();
    console.log("✅ Model loaded and cached.");
  } else {
    console.log("♻️ Using cached MobileNet model.");
  }
  return cachedModel;
}

export function getModel() {
  return cachedModel;
}
