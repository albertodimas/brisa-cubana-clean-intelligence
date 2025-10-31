import type { ImgHTMLAttributes } from "react";
import React from "react";

type NextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  placeholder?: "blur" | "empty";
};

const NextImage = React.forwardRef<HTMLImageElement, NextImageProps>(
  ({ src, alt, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={typeof src === "string" ? src : ""}
        alt={alt ?? ""}
        {...props}
      />
    );
  },
);

NextImage.displayName = "NextImageStub";

export default NextImage;
