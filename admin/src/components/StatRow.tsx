import React from "react";
import { Flex, Typography, Divider } from "@strapi/design-system";

interface StatRowProps {
  label: string;
  value: string | React.ReactNode;
  valueColor?: string;
}

export const StatRow = ({ label, value, valueColor }: StatRowProps) => {
  return (
    <>
      <Flex style={{ width: "100%" }} alignItems="center">
        <Typography variant="pi" fontWeight="bold" style={{ minWidth: 160 }}>
          {label}
        </Typography>
        {typeof value === "string" ? (
          <Typography variant="pi" textColor={valueColor}>
            {value}
          </Typography>
        ) : (
          value
        )}
      </Flex>
      <Divider style={{ width: "100%" }} />
    </>
  );
};
