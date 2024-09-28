import { useIntl } from "react-intl";
import { Divider, Grid, Accordion, Box, IconButton, Tooltip, Button } from "@strapi/design-system";
import { Duplicate } from "@strapi/icons";
import { Page, Layouts } from "@strapi/admin/strapi-admin";
import { useNotification } from "@strapi/strapi/admin";
import { getInterfaces } from "../services";
import { getTranslation } from "../utils/getTranslation";
import React from "react";
import { LightAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import darkTheme from "react-syntax-highlighter/dist/esm/styles/hljs/shades-of-purple";
import lightTheme from "react-syntax-highlighter/dist/esm/styles/hljs/xcode";

const HomePage = () => {
  SyntaxHighlighter.registerLanguage("typescript", ts);
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const [apiResponse, setApiResponse] = React.useState<Record<string, string>>();
  const [theme, setTheme] = React.useState(lightTheme);

  React.useEffect(() => {
    const fetchInterfaces = async () => {
      const response = await getInterfaces();
      setApiResponse(response);
    };

    fetchInterfaces();
  }, []);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("STRAPI_THEME");

    const updateTheme = () => {
      if (storedTheme === "light") {
        setTheme(lightTheme);
      } else if (storedTheme === "dark") {
        setTheme(darkTheme);
      } else if (storedTheme === "system") {
        const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(systemDarkMode ? darkTheme : lightTheme);
      }
    };

    updateTheme();

    // Listen for changes in system preference in case user changes it
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: any) => {
      if (storedTheme === "system") {
        setTheme(e.matches ? darkTheme : lightTheme);
      }
    };

    mediaQuery.onchange = handleSystemThemeChange;
  }, []);

  const copyAllInterfaces = () => {
    if (!apiResponse) return;
    const interfaces = Object.values(apiResponse).join("\n");
    handleCopy(interfaces);
  };

  const handleCopy = (value: string) => {
    // Check if window has access to clipboard
    if (!navigator.clipboard) {
      // If not, display a notification
      toggleNotification({
        title: formatMessage({
          id: getTranslation("page.copy.notSupported.title"),
        }),
        message: formatMessage({
          id: getTranslation("page.copy.notSupported.message"),
        }),
        type: "danger",
      });
      return;
    }

    // Copy value to clipboard
    navigator.clipboard.writeText(value).then(
      () => {
        // Display a notification if successful
        toggleNotification!({
          title: formatMessage({
            id: getTranslation("page.copy.success.title"),
          }),
          message: formatMessage({
            id: getTranslation("page.copy.success.message"),
          }),
          type: "success",
        });
      },
      () => {
        // Display a notification if unsuccessful
        toggleNotification!({
          title: formatMessage({
            id: getTranslation("page.copy.error.title"),
          }),
          message: formatMessage({
            id: getTranslation("page.copy.error.message"),
          }),
          type: "danger",
        });
      }
    );
  };

  return (
    <Page.Main>
      <Page.Title>{formatMessage({ id: getTranslation("page.title") })}</Page.Title>
      <Layouts.Header
        id="title"
        title={formatMessage({
          id: getTranslation("page.title"),
        })}
        subtitle={formatMessage({
          id: getTranslation("page.subTitle"),
        })}
        primaryAction={
          <Tooltip label={formatMessage({ id: getTranslation("page.copy.copyAll.tooltip") })}>
            <Button onClick={() => copyAllInterfaces()}>
              {formatMessage({ id: getTranslation("page.copy.copyAll") })}
            </Button>
          </Tooltip>
        }
      />
      <Layouts.Content>
        <Divider style={{ marginBottom: "50px" }} />
        {!apiResponse ? (
          <Page.Loading />
        ) : (
          <Grid.Root gap={5} style={{ alignItems: "start", paddingBottom: "30px" }}>
            {apiResponse &&
              Object.entries(apiResponse).map(([key, value], idx) => (
                <Grid.Item col={6} key={key}>
                  <Accordion.Root defaultValue={idx == 0 && key} style={{ width: "100%" }}>
                    <Accordion.Item value={key}>
                      <Accordion.Header>
                        <Accordion.Trigger
                          description={`${formatMessage({
                            id: getTranslation("page.tooltip.interfaceFor"),
                          })} ${key}`}
                        >
                          {key}
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content>
                        <Box padding={4}>
                          <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", top: "0", right: "0" }}>
                              <Tooltip label={`Copy ${key} Interface`}>
                                <IconButton
                                  onClick={() => handleCopy(value)}
                                  label={formatMessage({
                                    id: getTranslation("page.tooltip.copyInterface"),
                                  })}
                                >
                                  <Duplicate />
                                </IconButton>
                              </Tooltip>
                            </div>
                            <SyntaxHighlighter
                              showLineNumbers
                              lineNumberStyle={{ opacity: "0.5" }}
                              customStyle={{ fontSize: "14px", borderRadius: "4px" }}
                              language="typescript"
                              style={theme}
                            >
                              {value}
                            </SyntaxHighlighter>
                          </div>
                        </Box>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </Grid.Item>
              ))}
          </Grid.Root>
        )}
      </Layouts.Content>
    </Page.Main>
  );
};

export { HomePage };
