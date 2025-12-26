import * as core from "@actions/core";

export function printAnnotation(
  message: string,
  props: core.AnnotationProperties,
) {
  core.error(message, props);
}
