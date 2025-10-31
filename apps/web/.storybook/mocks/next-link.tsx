import React from "react";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

const NextLink = React.forwardRef<HTMLAnchorElement, Props>(
  ({ href, children, ...rest }, ref) => (
    <a ref={ref} href={href} {...rest}>
      {children}
    </a>
  ),
);

NextLink.displayName = "NextLinkStub";

export default NextLink;
