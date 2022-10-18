import { compose, transformData } from "oleoduc";
import Pick from "stream-json/filters/Pick";
import { parser: jsonParser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

export {
  streamNestedJsonArray: (arrayPropertyName) => {
    return compose(
      Pick.withParser({ filter: arrayPropertyName }),
      streamArray(),
      transformData((data) => data.value)
    );
  },
  streamJsonArray: () => {
    return compose(
      jsonParser(),
      streamArray(),
      transformData((data) => data.value)
    );
  },
};
