import Image from "next/image";
import React from "react";

const SiteLogo = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/images/logo/logo.svg"
      alt="CopilotSMC"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
};

export default SiteLogo;
