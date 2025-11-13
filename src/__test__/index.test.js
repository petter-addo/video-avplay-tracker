import nrvideo from '@newrelic/video-core'
import Tracker from "../tracker";

const exportedModule = require("../index");

describe("nrvideo AVPlayTracker Assignment", () => {
  it("should assign Tracker to nrvideo.AVPlayTracker", () => {
    expect(nrvideo.AVPlayTracker).toBe(Tracker);
  });

  it("should export the modified nrvideo object", () => {
    expect(exportedModule).toBe(nrvideo);
  });
});
